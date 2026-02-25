/**
 * Serviço de Integração com a API Focus NFe
 * 
 * Documentação: https://doc.focusnfe.com.br
 * 
 * Este serviço permite:
 * - Emissão de NF-e (Nota Fiscal Eletrônica)
 * - Consulta de NF-e
 * - Cancelamento de NF-e
 * - Download de XML e PDF (DANFE)
 * 
 * ESTRUTURA DE TOKENS:
 * - Token Principal (Master): Fixo no .env (FOCUS_NFE_TOKEN_PRINCIPAL)
 *   → Usado para operações administrativas (gerenciar empresas, certificados)
 * 
 * - Token Produção: Configurado por cada tenant na interface
 *   → Usado para emitir notas REAIS com validade fiscal
 * 
 * - Token Homologação: Configurado por cada tenant na interface
 *   → Usado para emitir notas de TESTE (sem validade fiscal)
 */

import axios from 'axios';
import { query } from '../database/connection.js';
import { avancarSequenciaAposDuplicidadeDocumento } from './nfeNumeroService.js';

/** Rejeições SEFAZ em que o número já foi "consumido" e a sequência deve avançar (próxima emissão usa número seguinte). */
function deveAvancarSequencia(statusSefaz, mensagem) {
  const msg = String(mensagem || '');
  if (/duplicidade\s+de\s+nf-?e|rejei[cç][aã]o[^.]*duplicidade/i.test(msg)) return true;
  if (statusSefaz === '218' || /já está cancelada|já cancelada na base/i.test(msg)) return true;
  return false;
}

// URLs da API Focus NFe
const FOCUS_NFE_URLS = {
  homologacao: 'https://homologacao.focusnfe.com.br',
  producao: 'https://api.focusnfe.com.br'
};

// Token Principal (Master) - Fixo no sistema via variável de ambiente
const FOCUS_NFE_TOKEN_PRINCIPAL = process.env.FOCUS_NFE_TOKEN_PRINCIPAL || '';

function getTipoDocumentoFromModelo(modelo) {
  const m = String(modelo || '55').trim();
  return m === '65' ? 'nfce' : 'nfe';
}

function getEndpointDocumento(tipoDocumento) {
  return tipoDocumento === 'nfce' ? 'nfce' : 'nfe';
}

function mapMetodoPagamentoParaCodigoFocus(metodo) {
  const m = String(metodo || '').toLowerCase().trim();
  if (m.includes('dinheiro')) return '01';
  if (m.includes('cheque')) return '02';
  if (m.includes('cartao_credito')) return '03';
  if (m.includes('cartao_debito')) return '04';
  if (m.includes('boleto')) return '15';
  if (m.includes('pix')) return '17';
  if (m.includes('transferencia')) return '18';
  // Prazo / outros: usar 99 (outros) para não “inventar” um meio específico
  if (m.includes('prazo')) return '99';
  return '99';
}

function montarFormasPagamento(nfe, vendaPagamentos = []) {
  const total = Number(nfe?.valor_total ?? 0);
  const totalValido = Number.isFinite(total) && total > 0 ? total : 0;

  /** @type {{ forma_pagamento: string; valor: number }[]} */
  const linhas = [];

  if (Array.isArray(vendaPagamentos) && vendaPagamentos.length > 0) {
    for (const p of vendaPagamentos) {
      const metodo = String(p?.metodo || '').toLowerCase().trim();
      const valor = Number(p?.valor ?? 0);
      const troco = Number(p?.troco ?? 0);
      if (!Number.isFinite(valor) || valor <= 0) continue;

      // Para dinheiro, valor "aplicado" no documento é valor - troco
      const valorAplicado = metodo.includes('dinheiro')
        ? Math.max(0, valor - (Number.isFinite(troco) ? troco : 0))
        : valor;

      if (valorAplicado <= 0) continue;

      linhas.push({
        forma_pagamento: mapMetodoPagamentoParaCodigoFocus(metodo),
        valor: valorAplicado
      });
    }
  }

  // Fallback: se não há venda/pagamentos, considerar dinheiro no total do documento
  if (linhas.length === 0) {
    linhas.push({
      forma_pagamento: '01',
      valor: totalValido || 0
    });
  }

  // Ajustar soma para bater com o total do documento (evita rejeição por centavos / troco)
  if (totalValido > 0 && linhas.length > 0) {
    const soma = linhas.reduce((s, l) => s + (Number.isFinite(l.valor) ? l.valor : 0), 0);
    const diff = Number((totalValido - soma).toFixed(2));
    if (Math.abs(diff) >= 0.01) {
      const last = linhas[linhas.length - 1];
      last.valor = Number((last.valor + diff).toFixed(2));
    }
  }

  // Remover linhas inválidas e formatar
  const result = linhas
    .filter((l) => Number.isFinite(l.valor) && l.valor > 0)
    .map((l) => ({
      forma_pagamento: l.forma_pagamento,
      valor_pagamento: Number(l.valor).toFixed(2)
    }));

  // Garantir pelo menos uma forma de pagamento
  if (result.length === 0) {
    return [{
      forma_pagamento: '01',
      valor_pagamento: (totalValido || 0).toFixed(2)
    }];
  }

  return result;
}

/**
 * Obtém o Token Principal da Focus NFe (para operações administrativas)
 * @returns {string} - Token principal configurado no .env
 */
export function getTokenPrincipal() {
  return FOCUS_NFE_TOKEN_PRINCIPAL;
}

/**
 * Verifica se o Token Principal está configurado
 * @returns {boolean}
 */
export function isTokenPrincipalConfigurado() {
  return !!FOCUS_NFE_TOKEN_PRINCIPAL && FOCUS_NFE_TOKEN_PRINCIPAL !== 'XnAPKJKCzYI7ZSzcPQewYM5a3jCuC...';
}

/**
 * Cria uma instância do cliente HTTP para a API Focus NFe
 * @param {string} token - Token de acesso da API
 * @param {string} ambiente - 'homologacao' ou 'producao'
 * @returns {AxiosInstance}
 */
function createFocusNfeClient(token, ambiente = 'homologacao') {
  const baseURL = FOCUS_NFE_URLS[ambiente] || FOCUS_NFE_URLS.homologacao;
  
  return axios.create({
    baseURL,
    auth: {
      username: token,
      password: ''
    },
    headers: {
      'Content-Type': 'application/json'
    },
    timeout: 60000 // 60 segundos de timeout
  });
}

/**
 * Obtém o token correto baseado no ambiente
 * @param {Object} config - Configurações do tenant
 * @returns {string} - Token para o ambiente selecionado
 */
function getTokenForAmbiente(config) {
  const ambiente = config.ambiente || 'homologacao';
  
  // Primeiro tenta usar o token específico do ambiente
  if (ambiente === 'producao' && config.token_producao) {
    return config.token_producao;
  }
  if (ambiente === 'homologacao' && config.token_homologacao) {
    return config.token_homologacao;
  }
  
  // Fallback para o token genérico (compatibilidade com configurações antigas)
  return config.token || '';
}

/**
 * Busca as configurações da Focus NFe do tenant
 * @param {number} tenantId - ID do tenant
 * @returns {Promise<Object>}
 */
export async function getFocusNfeConfig(tenantId) {
  const configs = await query(
    `SELECT chave, valor FROM tenant_configuracoes 
     WHERE tenant_id = ?
       AND (
         chave LIKE 'focus_nfe_%'
         OR chave LIKE 'nfe_proximo_numero%'
         OR chave LIKE 'nfce_proximo_numero%'
       )`,
    [tenantId]
  );
  
  const config = {};
  for (const c of configs) {
    if (c.chave.startsWith('nfe_proximo_numero') || c.chave.startsWith('nfce_proximo_numero')) {
      config[c.chave] = c.valor;
    } else {
      const key = c.chave.replace('focus_nfe_', '');
      config[key] = c.valor;
    }
  }
  const amb = (config.ambiente || 'homologacao').toLowerCase().trim();
  const chaveProximoNfeAmb = amb === 'producao' ? 'nfe_proximo_numero_producao' : 'nfe_proximo_numero_homologacao';
  const chaveProximoNfceAmb = amb === 'producao' ? 'nfce_proximo_numero_producao' : 'nfce_proximo_numero_homologacao';
  const proximoNumeroNfe = config[chaveProximoNfeAmb] || config.nfe_proximo_numero || '';
  const proximoNumeroNfce = config[chaveProximoNfceAmb] || config.nfce_proximo_numero || '';
  
  return {
    // Tokens separados por ambiente
    token_homologacao: config.token_homologacao || '',
    token_producao: config.token_producao || '',
    // Token legado (mantido para compatibilidade)
    token: config.token || '',
    // Configurações gerais
    ambiente: config.ambiente || 'homologacao',
    serie_padrao: config.serie_padrao || '001', // NF-e (modelo 55)
    serie_padrao_nfce: config.serie_padrao_nfce || '1', // NFC-e (modelo 65) - padrão comum no painel Focus
    natureza_operacao: config.natureza_operacao || 'Venda de mercadoria',
    regime_tributario: config.regime_tributario || '1', // 1=Simples Nacional
    cnpj_emitente: config.cnpj_emitente || '',
    inscricao_estadual: config.inscricao_estadual || '',
    // Configurações opcionais
    incluir_na_danfe_informacoes_complementares: config.informacoes_complementares || '',
    // Próximo número (por tipo e ambiente) - alinhar com painel Focus NFe para evitar duplicidade
    // Mantém 'proximo_numero' como o da NF-e por compatibilidade com telas antigas.
    proximo_numero: proximoNumeroNfe || '',
    proximo_numero_nfce: proximoNumeroNfce || ''
  };
}

/**
 * Salva ou atualiza as configurações da Focus NFe do tenant
 * @param {number} tenantId - ID do tenant
 * @param {Object} config - Configurações a serem salvas
 */
export async function saveFocusNfeConfig(tenantId, config) {
  const configKeys = [
    'token', 'token_homologacao', 'token_producao', // Tokens (legado + separados)
    'ambiente', 'serie_padrao', 'natureza_operacao',
    'serie_padrao_nfce',
    'regime_tributario', 'cnpj_emitente', 'inscricao_estadual',
    'informacoes_complementares', 'proximo_numero', 'proximo_numero_nfce'
  ];
  
  for (const key of configKeys) {
    const isProximoNumeroNfe = key === 'proximo_numero';
    const isProximoNumeroNfce = key === 'proximo_numero_nfce';
    const isProximoNumero = isProximoNumeroNfe || isProximoNumeroNfce;
    const deveSalvar = isProximoNumero ? config[key] !== undefined : (config[key] !== undefined && config[key] !== '');
    if (deveSalvar) {
      const valor = config[key] === '' || config[key] == null ? '' : String(config[key]);
      if (isProximoNumero) {
        // Salvar por ambiente e por tipo para alinhar com o painel Focus NFe / SEFAZ (produção e homologação independentes)
        const amb = (config.ambiente || 'homologacao').toLowerCase().trim();
        const prefix = isProximoNumeroNfce ? 'nfce' : 'nfe';
        const chaveAmb = amb === 'producao' ? `${prefix}_proximo_numero_producao` : `${prefix}_proximo_numero_homologacao`;
        await query(
          `INSERT INTO tenant_configuracoes (tenant_id, chave, valor, tipo)
           VALUES (?, ?, ?, 'string')
           ON DUPLICATE KEY UPDATE valor = VALUES(valor)`,
          [tenantId, chaveAmb, valor]
        );
        if (valor) {
          await query(
            `INSERT INTO tenant_configuracoes (tenant_id, chave, valor, tipo)
             VALUES (?, ?, ?, 'string')
             ON DUPLICATE KEY UPDATE valor = VALUES(valor)`,
            [tenantId, `${prefix}_proximo_numero`, valor]
          );
        }
      } else {
        const chave = `focus_nfe_${key}`;
        await query(
          `INSERT INTO tenant_configuracoes (tenant_id, chave, valor, tipo)
           VALUES (?, ?, ?, 'string')
           ON DUPLICATE KEY UPDATE valor = VALUES(valor)`,
          [tenantId, chave, valor]
        );
      }
    }
  }
}

/**
 * Monta o objeto da NF-e para envio à API Focus NFe
 * 
 * NOTA: Os dados do emitente (CNPJ, endereço, IE, etc.) são cadastrados
 * diretamente no site Focus NFe e preenchidos automaticamente pela API
 * com base no token da empresa utilizado na autenticação.
 * 
 * @param {Object} nfe - Dados da NF-e do banco
 * @param {Object} tenant - Dados do tenant (não mais usado para emitente)
 * @param {Object} cliente - Dados do cliente (destinatário)
 * @param {Array} itens - Itens da NF-e
 * @param {Object} focusConfig - Configurações Focus NFe
 * @returns {Object}
 */
function montarNfePayload(nfe, tenant, cliente, itens, focusConfig, vendaPagamentos = []) {
  const modelo = String(nfe?.modelo || '55').trim() === '65' ? '65' : '55';
  // Determinar se é venda para consumidor final (pessoa física)
  // Consumidor final = 1 se for pessoa física (CPF) ou consumidor não identificado
  // Consumidor final = 0 se for pessoa jurídica (CNPJ) com IE
  const isConsumidorFinal = !cliente || 
    !cliente.cpf_cnpj || 
    cliente.cpf_cnpj.replace(/\D/g, '').length === 11 || 
    !cliente.inscricao_estadual;
  
  // local_destino (idDest no XML): 1=operação interna, 2=interestadual, 3=exterior.
  // SEFAZ exige: interestadual só quando UF destino ≠ UF origem; se iguais, deve ser operação interna.
  const ufOrigem = (tenant?.estado || '').toString().trim().toUpperCase().substring(0, 2);
  const ufDestino = (cliente?.estado ?? tenant?.estado ?? 'SP').toString().trim().toUpperCase().substring(0, 2);
  const isInterestadual = ufDestino.length === 2 && ufOrigem.length === 2 && ufDestino !== ufOrigem;
  const localDestino = isInterestadual ? 2 : 1;

  // Dados básicos da NF-e
  const payload = {
    // Natureza da operação
    natureza_operacao: focusConfig.natureza_operacao || 'Venda de mercadoria',
    
    // Série e número
    serie: nfe.serie,
    numero: nfe.numero,
    
    // Data e hora de emissão
    data_emissao: new Date().toISOString(),
    
    // Tipo de documento (0=entrada, 1=saída)
    tipo_documento: 1,
    
    // Finalidade (1=Normal, 2=Complementar, 3=Ajuste, 4=Devolução)
    finalidade_emissao: 1,
    
    // Local de destino: 1=Operação interna, 2=Operação interestadual, 3=Operação com exterior (obrigatório consistente com CFOP dos itens)
    local_destino: localDestino,
    
    // Consumidor final (0=Não, 1=Sim) - IMPORTANTE: deve ser 1 para pessoa física
    consumidor_final: isConsumidorFinal ? 1 : 0,
    
    // Presença do comprador (0=Não se aplica, 1=Presencial, 2=Internet, 4=NFC-e em entrega a domicílio, 9=Outros)
    presenca_comprador: 1,
    
    // Informações adicionais
    informacoes_adicionais_contribuinte: nfe.observacoes || '',
    
    // === ITENS === (passa localDestino para itens: em operação interna, CFOP 6.xxx é convertido para 5.xxx)
    items: itens.map((item, index) => montarItemNfe(item, index, focusConfig, localDestino))
  };
  
  // === CNPJ DO EMITENTE (pode ser necessário para autorização) ===
  // Obtém do tenant ou das configurações de NF-e
  const cnpjEmitente = focusConfig.cnpj_emitente || tenant?.cnpj;
  if (cnpjEmitente) {
    payload.cnpj_emitente = cnpjEmitente.replace(/\D/g, '');
  }
  
  // === DESTINATÁRIO ===
  const docDestinatarioRaw = (cliente?.cpf_cnpj || nfe?.cnpj_cpf || '').toString();
  const docDestinatario = docDestinatarioRaw.replace(/\D/g, '');

  // NF-e (55): destinatário identificado é obrigatório (CPF/CNPJ real)
  if (modelo === '55' && !docDestinatario) {
    throw new Error('Para emitir NF-e (modelo 55) é obrigatório informar o CPF/CNPJ do destinatário (cliente).');
  }

  if (docDestinatario) {
    // Cliente identificado
    const cpfCnpj = docDestinatario;
    
    if (cpfCnpj.length === 11) {
      // Pessoa física (CPF)
      payload.cpf_destinatario = cpfCnpj;
      // Pessoa física = Não contribuinte de ICMS
      payload.indicador_inscricao_estadual_destinatario = 9;
    } else if (cpfCnpj.length === 14) {
      // Pessoa jurídica (CNPJ)
      payload.cnpj_destinatario = cpfCnpj;
      const ie = cliente?.inscricao_estadual;
      if (ie) {
        payload.inscricao_estadual_destinatario = ie;
        payload.indicador_inscricao_estadual_destinatario = 1; // Contribuinte ICMS
      } else {
        payload.indicador_inscricao_estadual_destinatario = 9; // Não contribuinte
      }
    } else {
      throw new Error('CPF/CNPJ do destinatário inválido. Informe um documento com 11 (CPF) ou 14 (CNPJ) dígitos.');
    }
    
    payload.nome_destinatario = cliente?.nome || 'Consumidor';
    payload.logradouro_destinatario = extrairLogradouro(cliente?.endereco) || 'Rua não informada';
    payload.numero_destinatario = extrairNumero(cliente?.endereco) || 'S/N';
    // Bairro não existe no schema, usar valor padrão ou extrair do endereço se possível
    payload.bairro_destinatario = 'Centro'; // Valor padrão conforme exigência da SEFAZ
    payload.municipio_destinatario = cliente?.cidade || 'São Paulo';
    payload.uf_destinatario = cliente?.estado || 'SP';
    payload.cep_destinatario = cliente?.cep?.replace(/\D/g, '') || '00000000';
    
    if (cliente?.email) {
      payload.email_destinatario = cliente.email;
    }
  } else {
    // Consumidor não identificado
    // NFC-e (65): pode ser sem CPF/CNPJ (não vamos injetar documento "genérico").
    //
    // IMPORTANTE:
    // - Se enviarmos xNome/enderDest sem CPF/CNPJ, o XML pode ficar inválido
    //   (ex.: xNome aparece onde era esperado CNPJ/CPF).
    // - Portanto, em NFC-e sem documento, NÃO enviar nenhum campo do destinatário.
    //
    // NF-e (55): já bloqueamos acima (exige CPF/CNPJ real).
    if (modelo !== '65') {
      throw new Error('Documento do destinatário ausente para emissão de NF-e (modelo 55).');
    }
  }
  
  // === MODALIDADE DE FRETE (obrigatório) ===
  // 0=Por conta do emitente, 1=Por conta do destinatário, 2=Por conta de terceiros, 9=Sem frete
  payload.modalidade_frete = 9; // Sem frete (mais comum para vendas de balcão)
  
  // === FORMA DE PAGAMENTO ===
  payload.formas_pagamento = montarFormasPagamento(nfe, vendaPagamentos);
  
  return payload;
}

/**
 * Monta um item da NF-e
 * @param {Object} item - Item do banco de dados (com campos do produto já incluídos)
 * @param {number} index - Índice do item
 * @param {Object} focusConfig - Configurações Focus NFe
 * @param {number} localDestino - 1=operação interna, 2=interestadual. Em operação interna, CFOP 6.xxx é convertido para 5.xxx.
 * @returns {Object}
 */
function montarItemNfe(item, index, focusConfig, localDestino = 1) {
  // Os campos do produto já vêm diretos do item (não há objeto produto separado)
  // item já contém: produto_nome, sku, codigo_barras, ncm, cfop, icms_origem, etc.

  // Operação interna (mesmo estado): SEFAZ exige CFOP 5.xxx. Se o produto tem 6.xxx, usar equivalente 5.xxx no envio.
  let cfopEnvio = (item.cfop || '5102').toString().trim();
  const cfopNumerico = cfopEnvio.replace(/\D/g, '');
  if (localDestino === 1 && cfopNumerico.length >= 1 && cfopNumerico.charAt(0) === '6') {
    cfopEnvio = '5' + cfopNumerico.substring(1);
    console.log(`[Focus NFe] Item ${index + 1}: CFOP ${item.cfop} ajustado para operação interna → ${cfopEnvio}`);
  }
  
  // === VERIFICAR REGIME TRIBUTÁRIO DO EMITENTE ===
  // CRT = 1 ou 4 = Simples Nacional
  // Para emitentes do Simples Nacional, SEMPRE usar CST 102, independente do CST cadastrado no produto
  const regimeTributario = focusConfig.regime_tributario || '1'; // 1=Simples Nacional por padrão
  const isSimplesNacional = regimeTributario === '1' || regimeTributario === '4';
  
  // === CÁLCULOS ICMS (antes de montar o objeto) ===
  // Se for Simples Nacional, forçar CST 102
  // Caso contrário, usar o CST do produto
  const cstIcmsOriginal = item.icms_situacao_tributaria || '102';
  const cstIcms = isSimplesNacional ? '102' : cstIcmsOriginal;
  
  const icmsAliquota = parseFloat(item.icms_aliquota) || 0;
  const valorBruto = parseFloat(item.preco_total || 0);
  
  // Montar objeto ICMS baseado no CST
  let icmsFields = {
    icms_situacao_tributaria: cstIcms
  };
  
  if (cstIcms === '102') {
    // CST 102 = Simples Nacional sem permissão de crédito
    // Apenas origem e situação tributária (sem campos de base de cálculo)
    // Não adiciona mais campos
  } else if (cstIcms === '20' || cstIcms === '00' || cstIcms === '10' || cstIcms === '90') {
    // CST 20 = Com redução de base de cálculo
    // CST 00 = Tributada integralmente
    // CST 10 = Tributada e com cobrança do ICMS por substituição tributária
    // CST 90 = Outras
    // Para estes CSTs, precisamos de: modBC, vBC, pICMS, vICMS
    // Se CST 20, também pode ter pRedBC (percentual de redução)
    
    // Modalidade de determinação da base de cálculo (0=Margem de valor agregado, 1=Pauta, 2=Preço tabelado, 3=Valor da operação)
    const modBC = 0; // Usar 0 (valor da operação) como padrão
    
    // Calcular base de cálculo (se não houver redução, usar valor bruto)
    // Se houver redução, calcular base reduzida
    let vBC = valorBruto;
    let pRedBC = null;
    
    // Se CST 20 e houver alíquota, calcular base reduzida (assumindo redução padrão de 30% se não especificado)
    // Na prática, isso deveria vir do cadastro do produto
    if (cstIcms === '20') {
      // Para CST 20, geralmente há redução. Se não especificado, usar 30% como padrão
      // Em produção, isso deveria vir de um campo específico do produto
      const percentualReducao = 30; // Padrão 30% - deveria vir do cadastro do produto
      pRedBC = percentualReducao.toFixed(2);
      vBC = valorBruto * (1 - percentualReducao / 100);
    }
    
    // Valor do ICMS
    const vICMS = vBC * (icmsAliquota / 100);
    
    // Adicionar campos do ICMS
    icmsFields = {
      ...icmsFields,
      icms_modalidade_base_calculo: modBC,
      icms_base_calculo: vBC.toFixed(2),
      icms_aliquota: icmsAliquota.toFixed(2),
      icms_valor: vICMS.toFixed(2)
    };
    
    // Adicionar percentual de redução apenas para CST 20
    if (cstIcms === '20' && pRedBC) {
      icmsFields.icms_reducao_base_calculo = pRedBC;
    }
  } else {
    // Para outros CSTs não implementados, usar CST 102 como fallback
    icmsFields.icms_situacao_tributaria = '102';
  }
  
  return {
    numero_item: index + 1,
    codigo_produto: item.sku || item.codigo_barras || item.produto_id?.toString() || `PROD${index + 1}`,
    descricao: item.produto_nome || `Produto ${item.produto_id}`,
    codigo_ncm: item.ncm?.replace(/\D/g, '') || '00000000', // NCM genérico se não informado
    cfop: cfopEnvio, // 5.xxx = interno, 6.xxx = interestadual; em operação interna 6.xxx é convertido para 5.xxx
    // Unidade comercial: usar 'UN' como padrão (tipo_preco não é a unidade fiscal)
    unidade_comercial: 'UN',
    quantidade_comercial: parseFloat(item.quantidade || 0).toFixed(4),
    valor_unitario_comercial: parseFloat(item.preco_unitario || 0).toFixed(4),
    valor_bruto: parseFloat(item.preco_total || 0).toFixed(2),
    unidade_tributavel: 'UN', // Unidade tributável padrão
    quantidade_tributavel: parseFloat(item.quantidade || 0).toFixed(4),
    valor_unitario_tributavel: parseFloat(item.preco_unitario || 0).toFixed(4),
    
    // Origem da mercadoria (0=Nacional, exceto as indicadas nos códigos 3, 4, 5 e 8)
    // Campo deve se chamar 'icms_origem' conforme documentação Focus NFe
    icms_origem: parseInt(item.icms_origem) || 0,
    
    // Aplicar campos do ICMS calculados acima
    ...icmsFields,
    
    // === PIS ===
    // IMPORTANTE: Sempre usar CST 07 (Isento) para evitar erros de validação
    // CST 07 = Operação Isenta da Contribuição
    // Para CST 07, NÃO devemos enviar alíquota
    // 
    // NOTA: Outros CSTs de PIS requerem campos adicionais que ainda não estão implementados
    pis_situacao_tributaria: '07',
    
    // === COFINS ===
    // IMPORTANTE: Sempre usar CST 07 (Isento) para evitar erros de validação
    // CST 07 = Operação Isenta da Contribuição
    // Para CST 07, NÃO devemos enviar alíquota
    // 
    // NOTA: Outros CSTs de COFINS requerem campos adicionais que ainda não estão implementados
    cofins_situacao_tributaria: '07',
    
    // === IPI (se aplicável) ===
    ...(item.ipi_aliquota && {
      ipi_aliquota: parseFloat(item.ipi_aliquota).toFixed(4),
      ipi_codigo_enquadramento: item.ipi_codigo_enquadramento || undefined
    }),
    
    // === CEST (se aplicável) ===
    ...(item.cest && { cest: item.cest }),
    
    // Inclui no total da NF
    inclui_no_total: 1
  };
}

/**
 * Extrai o logradouro de um endereço
 * @param {string} endereco 
 * @returns {string}
 */
function extrairLogradouro(endereco) {
  if (!endereco) return null;
  // Remove o número se existir (formato: "Rua X, 123" ou "Rua X 123")
  return endereco.replace(/[,\s]+\d+.*$/, '').trim() || endereco;
}

/**
 * Extrai o número de um endereço
 * @param {string} endereco 
 * @returns {string}
 */
function extrairNumero(endereco) {
  if (!endereco) return null;
  const match = endereco.match(/[,\s]+(\d+)/);
  return match ? match[1] : 'S/N';
}

/**
 * Emite uma NF-e através da API Focus NFe
 * @param {number} tenantId - ID do tenant
 * @param {number} nfeId - ID da NF-e no banco de dados
 * @returns {Promise<Object>}
 */
export async function emitirNfe(tenantId, nfeId) {
  try {
    // Buscar configurações
    const focusConfig = await getFocusNfeConfig(tenantId);
    
    // Obter o token correto para o ambiente selecionado
    const token = getTokenForAmbiente(focusConfig);
    const ambiente = focusConfig.ambiente || 'homologacao';
    
    if (!token) {
      throw new Error(`Token de ${ambiente} da API Focus NFe não configurado. Configure em Configurações > NF-e.`);
    }
    
    // Buscar dados da NF-e
    const [nfe] = await query(
      `SELECT * FROM nfe WHERE id = ? AND tenant_id = ?`,
      [nfeId, tenantId]
    );
    
    if (!nfe) {
      throw new Error('NF-e não encontrada');
    }
    
    if (nfe.status === 'autorizada') {
      throw new Error('NF-e já está autorizada');
    }
    
    const tipoDocumento = getTipoDocumentoFromModelo(nfe.modelo);
    const endpoint = getEndpointDocumento(tipoDocumento);

    // Buscar dados do tenant (emitente)
    const [tenant] = await query(
      `SELECT * FROM tenants WHERE id = ?`,
      [tenantId]
    );
    
    // Buscar dados do cliente (destinatário)
    let cliente = null;
    if (nfe.cliente_id) {
      const [c] = await query(
        `SELECT * FROM clientes WHERE id = ? AND tenant_id = ?`,
        [nfe.cliente_id, tenantId]
      );
      cliente = c;
    }
    
    // Buscar itens da NF-e com dados do produto (todos os campos fiscais necessários)
    const itens = await query(
      `SELECT ni.*, 
              p.nome as produto_nome, 
              p.sku, 
              p.codigo_barras, 
              p.ncm, 
              p.cfop,
              p.icms_origem, 
              p.icms_situacao_tributaria,
              p.icms_aliquota,
              p.pis_cst, 
              p.pis_aliquota,
              p.cofins_cst,
              p.cofins_aliquota,
              p.ipi_aliquota,
              p.ipi_codigo_enquadramento,
              p.cest,
              p.tipo_preco
       FROM nfe_itens ni
       JOIN produtos p ON ni.produto_id = p.id
       WHERE ni.nfe_id = ?`,
      [nfeId]
    );
    
    if (itens.length === 0) {
      throw new Error('NF-e não possui itens');
    }
    
    // Buscar pagamentos da venda (se a NF-e foi gerada a partir de uma venda)
    let vendaPagamentos = [];
    if (nfe.venda_id) {
      try {
        vendaPagamentos = await query(
          `SELECT metodo, valor, troco FROM venda_pagamentos WHERE venda_id = ?`,
          [nfe.venda_id]
        );
      } catch {
        // Se não conseguir buscar pagamentos, segue com fallback (dinheiro)
      }
    }

    const regimeTributario = focusConfig.regime_tributario || '1';
    const isSimplesNacional = regimeTributario === '1' || regimeTributario === '4';
    // Montar payload
    const payload = montarNfePayload(nfe, tenant, cliente, itens, focusConfig, vendaPagamentos);
    
    // Criar referência única para a NF-e (definida antes do POST para poder salvar no catch em caso de erro)
    const referencia = `${endpoint}-${tenantId}-${nfeId}-${Date.now()}`;
    
    // Criar cliente da API com o token correto
    const client = createFocusNfeClient(token, focusConfig.ambiente);
    
    let response;
    try {
      response = await client.post(`/v2/${endpoint}?ref=${referencia}`, payload);
    } catch (postError) {
      const dataErro = postError.response?.data || {};
      const msgErro = dataErro.mensagem || dataErro.mensagem_sefaz || postError.message;
      // Salvar ref mesmo quando a API retorna erro (ex.: duplicidade), para permitir "Verificar" depois
      await query(
        `UPDATE nfe SET status = 'erro', motivo_status = ?, focus_nfe_ref = ? WHERE id = ? AND tenant_id = ?`,
        [msgErro, referencia, nfeId, tenantId]
      );
      // Se for duplicidade ou NF-e já cancelada (número consumido na SEFAZ), avançar sequência
      const textoErro = String(msgErro || '');
      if (deveAvancarSequencia(dataErro.status_sefaz, textoErro)) {
        avancarSequenciaAposDuplicidadeDocumento(tenantId, nfe.ambiente, tipoDocumento, nfe.numero).catch(() => {});
      }
      throw new Error(msgErro);
    }
    
    const { data } = response;
    
    // Salvar referência e status
    await query(
      `UPDATE nfe SET 
        focus_nfe_ref = ?,
        status = ?,
        protocolo = ?,
        chave_acesso = ?,
        motivo_status = ?,
        data_autorizacao = CASE WHEN ? = 'autorizado' THEN NOW() ELSE data_autorizacao END
       WHERE id = ? AND tenant_id = ?`,
      [
        referencia,
        data.status === 'autorizado' ? 'autorizada' : (data.status === 'erro_autorizacao' ? 'erro' : 'processando'),
        data.protocolo || null,
        data.chave_nfe || data.chave_nfce || data.chave_acesso || null,
        data.mensagem_sefaz || data.mensagem || null,
        data.status,
        nfeId,
        tenantId
      ]
    );
    // Se rejeitou (duplicidade 539 ou já cancelada 218), avançar sequência para a próxima emissão não repetir o número
    const msgSefaz = String(data.mensagem_sefaz || data.mensagem || '');
    if (data.status === 'erro_autorizacao' && deveAvancarSequencia(data.status_sefaz, msgSefaz)) {
      avancarSequenciaAposDuplicidadeDocumento(tenantId, nfe.ambiente, tipoDocumento, nfe.numero).catch(() => {});
    }
    
    // Considerar sucesso se autorizado ou processando (nota foi enviada com sucesso)
    const isSuccess = data.status === 'autorizado' || data.status === 'processando_autorizacao';
    
    // Se estiver processando, iniciar verificação automática em background
    if (data.status === 'processando_autorizacao') {
      verificarStatusAutomaticamente(tenantId, nfeId, referencia).catch(() => {});
    }
    
    return {
      success: isSuccess,
      status: data.status,
      protocolo: data.protocolo,
      chave_acesso: data.chave_nfe || data.chave_nfce || data.chave_acesso,
      mensagem: data.mensagem_sefaz || data.mensagem || (data.status === 'processando_autorizacao' ? 'NF-e enviada e aguardando processamento pela SEFAZ' : null),
      referencia
    };
  } catch (error) {
    // Atualizar status de erro no banco
    await query(
      `UPDATE nfe SET status = 'erro', motivo_status = ? WHERE id = ? AND tenant_id = ?`,
      [error.response?.data?.mensagem || error.message, nfeId, tenantId]
    );
    
    throw new Error(error.response?.data?.mensagem || error.message);
  }
}

/**
 * Verifica automaticamente o status da NF-e após alguns segundos
 * Faz até 3 tentativas com intervalos crescentes
 * @param {number} tenantId - ID do tenant
 * @param {number} nfeId - ID da NF-e
 * @param {string} referencia - Referência da NF-e na Focus NFe
 * @returns {Promise<void>}
 */
async function verificarStatusAutomaticamente(tenantId, nfeId, referencia) {
  const tentativas = 5; // Aumentar para 5 tentativas
  const intervalos = [3000, 5000, 7000, 10000, 15000]; // 3s, 5s, 7s, 10s, 15s (total: ~40s)
  
  for (let i = 0; i < tentativas; i++) {
    if (i > 0) {
      await new Promise(resolve => setTimeout(resolve, intervalos[i]));
    }
    
    try {
      const focusConfig = await getFocusNfeConfig(tenantId);
      const token = getTokenForAmbiente(focusConfig);
      
      if (!token) break;
      
      const client = createFocusNfeClient(token, focusConfig.ambiente);
      const tipoDocumento = referencia?.startsWith('nfce-') ? 'nfce' : 'nfe';
      const endpoint = getEndpointDocumento(tipoDocumento);
      const response = await client.get(`/v2/${endpoint}/${referencia}`);
      const { data } = response;
      
      if (data.status === 'autorizado') {
        await query(
          `UPDATE nfe SET 
            status = 'autorizada',
            protocolo = COALESCE(?, protocolo),
            chave_acesso = COALESCE(?, chave_acesso),
            motivo_status = ?,
            data_autorizacao = NOW()
           WHERE id = ? AND tenant_id = ?`,
          [
            data.protocolo || null,
            data.chave_nfe || data.chave_nfce || data.chave_acesso || null,
            data.mensagem_sefaz || data.mensagem || 'NF-e autorizada',
            nfeId,
            tenantId
          ]
        );
        break;
      }
      
      if (data.status === 'erro_autorizacao') {
        const msgSefaz = String(data.mensagem_sefaz || data.mensagem || '');
        await query(
          `UPDATE nfe SET 
            status = 'erro',
            motivo_status = ?
           WHERE id = ? AND tenant_id = ?`,
          [
            data.mensagem_sefaz || data.mensagem || 'Erro na autorização',
            nfeId,
            tenantId
          ]
        );

        // Duplicidade (539) ou já cancelada (218): avançar sequência para a próxima emissão não repetir o número
        if (deveAvancarSequencia(data.status_sefaz, msgSefaz)) {
          const nfeRows = await query(
            `SELECT numero, ambiente, modelo FROM nfe WHERE id = ? AND tenant_id = ?`,
            [nfeId, tenantId]
          );
          const nfeRow = nfeRows && nfeRows[0];
          if (nfeRow) {
            const { numero, ambiente, modelo } = nfeRow;
            const tipoDoc = getTipoDocumentoFromModelo(modelo);
            avancarSequenciaAposDuplicidadeDocumento(tenantId, ambiente, tipoDoc, numero).catch(() => {});
          }
        }
        break;
      }
    } catch (error) {
      if (i < tentativas - 1) {
        // Continuar para próxima tentativa
      }
    }
  }
}

/**
 * Consulta o status de uma NF-e na SEFAZ
 * @param {number} tenantId - ID do tenant
 * @param {number} nfeId - ID da NF-e
 * @returns {Promise<Object>}
 */
export async function consultarNfe(tenantId, nfeId) {
  try {
    const focusConfig = await getFocusNfeConfig(tenantId);
    const token = getTokenForAmbiente(focusConfig);
    
    if (!token) {
      throw new Error('Token da API Focus NFe não configurado');
    }
    
    // Buscar dados da NF-e
    const [nfe] = await query(
      `SELECT * FROM nfe WHERE id = ? AND tenant_id = ?`,
      [nfeId, tenantId]
    );
    
    if (!nfe) {
      throw new Error('NF-e não encontrada');
    }
    
    if (!nfe.focus_nfe_ref) {
      throw new Error('NF-e não possui referência da Focus NFe. Emita a nota primeiro.');
    }
    
    const client = createFocusNfeClient(token, focusConfig.ambiente);
    
    const tipoDocumento = getTipoDocumentoFromModelo(nfe.modelo);
    const endpoint = getEndpointDocumento(tipoDocumento);
    const response = await client.get(`/v2/${endpoint}/${nfe.focus_nfe_ref}`);
    const { data } = response;
    
    // Atualizar status no banco
    let novoStatus = nfe.status;
    if (data.status === 'autorizado') {
      novoStatus = 'autorizada';
    } else if (data.status === 'cancelado') {
      novoStatus = 'cancelada';
    } else if (data.status === 'erro_autorizacao') {
      novoStatus = 'erro';
    }
    
    await query(
      `UPDATE nfe SET 
        status = ?,
        protocolo = COALESCE(?, protocolo),
        chave_acesso = COALESCE(?, chave_acesso),
        motivo_status = ?
       WHERE id = ? AND tenant_id = ?`,
      [
        novoStatus,
        data.protocolo || null,
        data.chave_nfe || data.chave_nfce || data.chave_acesso || null,
        data.mensagem_sefaz || data.mensagem || null,
        nfeId,
        tenantId
      ]
    );

    // Se a consulta retornou duplicidade (539) ou já cancelada (218), avançar sequência para a próxima emissão não repetir o número
    const msgConsulta = String(data.mensagem_sefaz || data.mensagem || '');
    if (data.status === 'erro_autorizacao' && deveAvancarSequencia(data.status_sefaz, msgConsulta)) {
      avancarSequenciaAposDuplicidadeDocumento(tenantId, nfe.ambiente, tipoDocumento, nfe.numero).catch(() => {});
    }

    return {
      status: data.status,
      status_sefaz: data.status_sefaz,
      mensagem_sefaz: data.mensagem_sefaz,
      protocolo: data.protocolo,
      chave_acesso: data.chave_nfe || data.chave_nfce || data.chave_acesso,
      numero: data.numero,
      serie: data.serie,
      caminho_xml: data.caminho_xml_nota_fiscal,
      caminho_danfe: data.caminho_danfe,
      data_emissao: data.data_emissao
    };
  } catch (error) {
    throw new Error(error.response?.data?.mensagem || error.message);
  }
}

/**
 * Cancela uma NF-e autorizada
 * @param {number} tenantId - ID do tenant
 * @param {number} nfeId - ID da NF-e
 * @param {string} justificativa - Justificativa do cancelamento (mín. 15 caracteres)
 * @returns {Promise<Object>}
 */
export async function cancelarNfe(tenantId, nfeId, justificativa) {
  try {
    if (!justificativa || justificativa.length < 15) {
      throw new Error('Justificativa deve ter no mínimo 15 caracteres');
    }
    
    const focusConfig = await getFocusNfeConfig(tenantId);
    const token = getTokenForAmbiente(focusConfig);
    
    if (!token) {
      throw new Error('Token da API Focus NFe não configurado');
    }
    
    // Buscar dados da NF-e
    const [nfe] = await query(
      `SELECT * FROM nfe WHERE id = ? AND tenant_id = ?`,
      [nfeId, tenantId]
    );
    
    if (!nfe) {
      throw new Error('NF-e não encontrada');
    }
    
    if (nfe.status !== 'autorizada') {
      throw new Error('Apenas NF-e autorizadas podem ser canceladas');
    }
    
    if (!nfe.focus_nfe_ref) {
      throw new Error('NF-e não possui referência da Focus NFe');
    }
    
    const client = createFocusNfeClient(token, focusConfig.ambiente);
    
    const tipoDocumento = getTipoDocumentoFromModelo(nfe.modelo);
    const endpoint = getEndpointDocumento(tipoDocumento);
    const response = await client.delete(`/v2/${endpoint}/${nfe.focus_nfe_ref}`, {
      data: { justificativa }
    });
    
    const { data } = response;
    
    // Atualizar status no banco
    if (data.status === 'cancelado') {
      await query(
        `UPDATE nfe SET 
          status = 'cancelada',
          motivo_status = ?,
          protocolo_cancelamento = ?,
          data_cancelamento = NOW()
         WHERE id = ? AND tenant_id = ?`,
        [
          justificativa,
          data.protocolo || null,
          nfeId,
          tenantId
        ]
      );
    }
    
    return {
      success: data.status === 'cancelado',
      status: data.status,
      protocolo: data.protocolo,
      mensagem: data.mensagem_sefaz || data.mensagem
    };
  } catch (error) {
    throw new Error(error.response?.data?.mensagem || error.message);
  }
}

/**
 * Obtém o XML da NF-e
 * @param {number} tenantId - ID do tenant
 * @param {number} nfeId - ID da NF-e
 * @returns {Promise<Object>}
 */
export async function obterXmlNfe(tenantId, nfeId) {
  try {
    const focusConfig = await getFocusNfeConfig(tenantId);
    const token = getTokenForAmbiente(focusConfig);
    
    if (!token) {
      throw new Error('Token da API Focus NFe não configurado');
    }
    
    // Buscar dados da NF-e
    const [nfe] = await query(
      `SELECT * FROM nfe WHERE id = ? AND tenant_id = ?`,
      [nfeId, tenantId]
    );
    
    if (!nfe) {
      throw new Error('NF-e não encontrada');
    }
    
    if (!nfe.focus_nfe_ref) {
      throw new Error('NF-e não possui referência da Focus NFe');
    }
    
    const client = createFocusNfeClient(token, focusConfig.ambiente);
    
    const tipoDocumento = getTipoDocumentoFromModelo(nfe.modelo);
    const endpoint = getEndpointDocumento(tipoDocumento);
    const consultaResponse = await client.get(`/v2/${endpoint}/${nfe.focus_nfe_ref}`);
    const consultaData = consultaResponse.data;
    
    // Se a NF-e não está autorizada, não tem XML disponível
    if (consultaData.status !== 'autorizado') {
      throw new Error(`NF-e não está autorizada. Status atual: ${consultaData.status}`);
    }
    
    // Atualizar chave de acesso se não estiver salva ou se a API retornou uma diferente
    const chaveAcesso = consultaData.chave_nfe || consultaData.chave_nfce || consultaData.chave_acesso || nfe.chave_acesso;
    if (chaveAcesso && chaveAcesso !== nfe.chave_acesso) {
      await query(
        `UPDATE nfe SET chave_acesso = ? WHERE id = ? AND tenant_id = ?`,
        [chaveAcesso, nfeId, tenantId]
      );
      nfe.chave_acesso = chaveAcesso;
    }
    
    // Obter o caminho do XML (pode estar em diferentes campos)
    const xmlPath = consultaData.caminho_xml_nota_fiscal || 
                    consultaData.caminho_xml || 
                    consultaData.xml_url ||
                    consultaData.url_xml ||
                    consultaData.xml;
    
    if (!xmlPath) {
      throw new Error('Caminho do XML não disponível na resposta da API Focus NFe. Verifique se a NF-e está autorizada.');
    }
    
    // Construir URL completa do XML
    // Se já for URL completa, usar diretamente; caso contrário, construir com base URL
    let xmlUrl = xmlPath;
    if (!xmlPath.startsWith('http')) {
      const baseURL = FOCUS_NFE_URLS[focusConfig.ambiente] || FOCUS_NFE_URLS.homologacao;
      xmlUrl = `${baseURL}${xmlPath.startsWith('/') ? '' : '/'}${xmlPath}`;
    }
    
    // Obter o XML usando autenticação básica (token como username)
    const httpResponse = await axios.get(xmlUrl, {
      responseType: 'text',
      auth: {
        username: token,
        password: ''
      },
      headers: {
        'Accept': 'application/xml, text/xml, */*'
      },
      timeout: 30000
    });
    
    let xmlContent = httpResponse.data;
    
    // Garantir que é string
    if (Buffer.isBuffer(xmlContent)) {
      xmlContent = xmlContent.toString('utf-8');
    } else if (typeof xmlContent !== 'string') {
      xmlContent = String(xmlContent);
    }
    
    // Remover BOM se existir
    xmlContent = xmlContent.replace(/^\uFEFF/, '').trim();
    
    // Validar se é um XML válido
    if (!xmlContent || xmlContent.length === 0) {
      throw new Error('XML vazio retornado pela Focus NFe');
    }
    
    // Verificar se começa com declaração XML ou tag NFe
    if (!xmlContent.match(/^<\?xml|^<nfeProc|^<NFe/i)) {
      throw new Error('XML retornado não está em formato válido. Verifique se a NF-e está autorizada.');
    }
    
    const filename = chaveAcesso 
      ? `${chaveAcesso}.xml`
      : `nfe_${nfe.numero}.xml`;
    
    return {
      xml: xmlContent,
      filename
    };
  } catch (error) {
    throw new Error(error.response?.data?.mensagem || error.message);
  }
}

/**
 * Obtém a URL do DANFE (PDF) da NF-e
 * @param {number} tenantId - ID do tenant
 * @param {number} nfeId - ID da NF-e
 * @returns {Promise<Object>}
 */
export async function obterDanfeNfe(tenantId, nfeId) {
  try {
    const focusConfig = await getFocusNfeConfig(tenantId);
    const token = getTokenForAmbiente(focusConfig);
    
    if (!token) {
      throw new Error('Token da API Focus NFe não configurado');
    }
    
    // Buscar dados da NF-e
    const [nfe] = await query(
      `SELECT * FROM nfe WHERE id = ? AND tenant_id = ?`,
      [nfeId, tenantId]
    );
    
    if (!nfe) {
      throw new Error('NF-e não encontrada');
    }
    
    if (!nfe.focus_nfe_ref) {
      throw new Error('NF-e não possui referência da Focus NFe');
    }
    
    if (nfe.status !== 'autorizada') {
      throw new Error('DANFE só está disponível para NF-e autorizadas');
    }
    
    const client = createFocusNfeClient(token, focusConfig.ambiente);
    
    const tipoDocumento = getTipoDocumentoFromModelo(nfe.modelo);
    const endpoint = getEndpointDocumento(tipoDocumento);
    const response = await client.get(`/v2/${endpoint}/${nfe.focus_nfe_ref}`);
    const { data } = response;
    
    if (!data.caminho_danfe) {
      throw new Error('DANFE ainda não está disponível. Aguarde alguns segundos e tente novamente.');
    }
    
    // A URL do DANFE vem como caminho relativo - montar URL completa
    // Homologação: https://homologacao.focusnfe.com.br
    // Produção: https://api.focusnfe.com.br
    const baseUrl = focusConfig.ambiente === 'producao' 
      ? 'https://api.focusnfe.com.br' 
      : 'https://homologacao.focusnfe.com.br';
    
    const danfeUrl = data.caminho_danfe.startsWith('http') 
      ? data.caminho_danfe 
      : `${baseUrl}${data.caminho_danfe}`;
    
    return {
      url: danfeUrl,
      filename: `danfe_${nfe.numero}_${nfe.chave_acesso || 'sem_chave'}.pdf`
    };
  } catch (error) {
    throw new Error(error.response?.data?.mensagem || error.message);
  }
}

/**
 * Valida se o tenant possui as configurações mínimas para emissão de NF-e
 * 
 * NOTA: Os dados da empresa (CNPJ, endereço, IE, etc.) são cadastrados
 * diretamente no site Focus NFe e já estão vinculados aos tokens.
 * Aqui validamos apenas os tokens e configurações do sistema.
 * 
 * @param {number} tenantId - ID do tenant
 * @returns {Promise<Object>}
 */
export async function validarConfiguracoes(tenantId) {
  const focusConfig = await getFocusNfeConfig(tenantId);
  const errors = [];
  const warnings = [];
  const ambiente = focusConfig.ambiente || 'homologacao';
  
  // Verificar token do ambiente atual
  const tokenAtual = getTokenForAmbiente(focusConfig);
  if (!tokenAtual) {
    errors.push(`Token de ${ambiente} da API Focus NFe não configurado`);
  }
  
  // Verificar se tem token do outro ambiente (aviso, não erro)
  if (ambiente === 'homologacao' && !focusConfig.token_producao) {
    warnings.push('Token de produção ainda não configurado');
  }
  if (ambiente === 'producao' && !focusConfig.token_homologacao) {
    warnings.push('Token de homologação não configurado (opcional para testes)');
  }
  
  // Verificar série padrão
  if (!focusConfig.serie_padrao) {
    warnings.push('Série padrão não configurada (usando 001)');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    config: {
      // Tokens separados por ambiente
      token_homologacao_configurado: !!focusConfig.token_homologacao || !!focusConfig.token,
      token_producao_configurado: !!focusConfig.token_producao,
      token_configurado: !!tokenAtual, // Token do ambiente atual está configurado?
      ambiente: focusConfig.ambiente,
      serie_padrao: focusConfig.serie_padrao || '001',
      natureza_operacao: focusConfig.natureza_operacao || 'Venda de mercadoria'
    }
  };
}

export default {
  // Tokens
  getTokenPrincipal,
  isTokenPrincipalConfigurado,
  // Configurações
  getFocusNfeConfig,
  saveFocusNfeConfig,
  validarConfiguracoes,
  // Operações NF-e
  emitirNfe,
  consultarNfe,
  cancelarNfe,
  obterXmlNfe,
  obterDanfeNfe
};

