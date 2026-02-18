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

// URLs da API Focus NFe
const FOCUS_NFE_URLS = {
  homologacao: 'https://homologacao.focusnfe.com.br',
  producao: 'https://api.focusnfe.com.br'
};

// Token Principal (Master) - Fixo no sistema via variável de ambiente
const FOCUS_NFE_TOKEN_PRINCIPAL = process.env.FOCUS_NFE_TOKEN_PRINCIPAL || '';

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
     WHERE tenant_id = ? AND chave LIKE 'focus_nfe_%'`,
    [tenantId]
  );
  
  const config = {};
  for (const c of configs) {
    const key = c.chave.replace('focus_nfe_', '');
    config[key] = c.valor;
  }
  
  return {
    // Tokens separados por ambiente
    token_homologacao: config.token_homologacao || '',
    token_producao: config.token_producao || '',
    // Token legado (mantido para compatibilidade)
    token: config.token || '',
    // Configurações gerais
    ambiente: config.ambiente || 'homologacao',
    serie_padrao: config.serie_padrao || '001',
    natureza_operacao: config.natureza_operacao || 'Venda de mercadoria',
    regime_tributario: config.regime_tributario || '1', // 1=Simples Nacional
    cnpj_emitente: config.cnpj_emitente || '',
    inscricao_estadual: config.inscricao_estadual || '',
    // Configurações opcionais
    incluir_na_danfe_informacoes_complementares: config.informacoes_complementares || ''
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
    'regime_tributario', 'cnpj_emitente', 'inscricao_estadual',
    'informacoes_complementares'
  ];
  
  for (const key of configKeys) {
    if (config[key] !== undefined && config[key] !== '') {
      await query(
        `INSERT INTO tenant_configuracoes (tenant_id, chave, valor, tipo)
         VALUES (?, ?, ?, 'string')
         ON DUPLICATE KEY UPDATE valor = VALUES(valor)`,
        [tenantId, `focus_nfe_${key}`, config[key]]
      );
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
function montarNfePayload(nfe, tenant, cliente, itens, focusConfig) {
  // Determinar se é venda para consumidor final (pessoa física)
  // Consumidor final = 1 se for pessoa física (CPF) ou consumidor não identificado
  // Consumidor final = 0 se for pessoa jurídica (CNPJ) com IE
  const isConsumidorFinal = !cliente || 
    !cliente.cpf_cnpj || 
    cliente.cpf_cnpj.replace(/\D/g, '').length === 11 || 
    !cliente.inscricao_estadual;
  
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
    
    // Consumidor final (0=Não, 1=Sim) - IMPORTANTE: deve ser 1 para pessoa física
    consumidor_final: isConsumidorFinal ? 1 : 0,
    
    // Presença do comprador (0=Não se aplica, 1=Presencial, 2=Internet, 4=NFC-e em entrega a domicílio, 9=Outros)
    presenca_comprador: 1,
    
    // Informações adicionais
    informacoes_adicionais_contribuinte: nfe.observacoes || '',
    
    // === ITENS ===
    items: itens.map((item, index) => montarItemNfe(item, index, focusConfig))
  };
  
  // === CNPJ DO EMITENTE (pode ser necessário para autorização) ===
  // Obtém do tenant ou das configurações de NF-e
  const cnpjEmitente = focusConfig.cnpj_emitente || tenant?.cnpj;
  if (cnpjEmitente) {
    payload.cnpj_emitente = cnpjEmitente.replace(/\D/g, '');
    console.log(`[Focus NFe] CNPJ do emitente: ${payload.cnpj_emitente}`);
  } else {
    console.log('[Focus NFe] AVISO: CNPJ do emitente não configurado');
  }
  
  // === DESTINATÁRIO ===
  if (cliente && cliente.cpf_cnpj) {
    // Cliente identificado
    const cpfCnpj = cliente.cpf_cnpj.replace(/\D/g, '');
    
    if (cpfCnpj.length === 11) {
      // Pessoa física (CPF)
      payload.cpf_destinatario = cpfCnpj;
      // Pessoa física = Não contribuinte de ICMS
      payload.indicador_inscricao_estadual_destinatario = 9;
    } else if (cpfCnpj.length === 14) {
      // Pessoa jurídica (CNPJ)
      payload.cnpj_destinatario = cpfCnpj;
      if (cliente.inscricao_estadual) {
        payload.inscricao_estadual_destinatario = cliente.inscricao_estadual;
        payload.indicador_inscricao_estadual_destinatario = 1; // Contribuinte ICMS
      } else {
        payload.indicador_inscricao_estadual_destinatario = 9; // Não contribuinte
      }
    }
    
    payload.nome_destinatario = cliente.nome || 'Consumidor';
    payload.logradouro_destinatario = extrairLogradouro(cliente.endereco) || 'Rua não informada';
    payload.numero_destinatario = extrairNumero(cliente.endereco) || 'S/N';
    payload.bairro_destinatario = cliente.bairro || 'Centro';
    payload.municipio_destinatario = cliente.cidade || 'São Paulo';
    payload.uf_destinatario = cliente.estado || 'SP';
    payload.cep_destinatario = cliente.cep?.replace(/\D/g, '') || '00000000';
    
    if (cliente.email) {
      payload.email_destinatario = cliente.email;
    }
  } else {
    // Consumidor não identificado - OBRIGATÓRIO enviar dados mínimos na NF-e modelo 55
    // A Focus NFe e SEFAZ exigem os dados do destinatário
    
    // Em HOMOLOGAÇÃO, usar dados específicos conforme documentação Focus NFe
    const isHomologacao = focusConfig.ambiente === 'homologacao';
    
    // CPF válido para homologação (conforme exemplo da documentação Focus NFe)
    // Em produção, usar um CPF genérico válido para consumidor não identificado
    payload.cpf_destinatario = isHomologacao ? '03055054911' : '00000000191';
    
    // Nome do destinatário - em homologação DEVE usar esse texto
    payload.nome_destinatario = isHomologacao 
      ? 'NF-E EMITIDA EM AMBIENTE DE HOMOLOGACAO - SEM VALOR FISCAL'
      : 'CONSUMIDOR NAO IDENTIFICADO';
    
    // Endereço obrigatório (usando dados do emitente como base)
    payload.logradouro_destinatario = tenant?.endereco?.split(',')[0] || 'Rua nao informada';
    payload.numero_destinatario = '1';
    payload.bairro_destinatario = tenant?.bairro || 'Centro';
    payload.municipio_destinatario = tenant?.cidade || 'Sao Paulo';
    payload.uf_destinatario = tenant?.estado || 'SP';
    payload.cep_destinatario = tenant?.cep?.replace(/\D/g, '') || '01310100';
    
    // Indicador IE = 9 (Não contribuinte)
    payload.indicador_inscricao_estadual_destinatario = 9;
    
    console.log(`[Focus NFe] Consumidor não identificado - Ambiente: ${focusConfig.ambiente}`);
  }
  
  // === MODALIDADE DE FRETE (obrigatório) ===
  // 0=Por conta do emitente, 1=Por conta do destinatário, 2=Por conta de terceiros, 9=Sem frete
  payload.modalidade_frete = 9; // Sem frete (mais comum para vendas de balcão)
  
  // === FORMA DE PAGAMENTO ===
  payload.formas_pagamento = [
    {
      forma_pagamento: '01', // 01=Dinheiro, 02=Cheque, 03=Cartão Crédito, 04=Cartão Débito, 05=Crédito Loja, 14=Duplicata, 15=Boleto, 17=PIX
      valor_pagamento: parseFloat(nfe.valor_total).toFixed(2)
    }
  ];
  
  return payload;
}

/**
 * Monta um item da NF-e
 * @param {Object} item - Item do banco de dados
 * @param {number} index - Índice do item
 * @param {Object} focusConfig - Configurações Focus NFe
 * @returns {Object}
 */
function montarItemNfe(item, index, focusConfig) {
  const produto = item.produto || {};
  
  return {
    numero_item: index + 1,
    codigo_produto: produto.sku || produto.codigo_barras || item.produto_id.toString(),
    descricao: item.produto_nome || produto.nome || `Produto ${item.produto_id}`,
    codigo_ncm: produto.ncm?.replace(/\D/g, '') || '00000000', // NCM genérico se não informado
    cfop: produto.cfop || '5102', // 5102 = Venda de mercadoria adquirida
    unidade_comercial: 'UN',
    quantidade_comercial: parseFloat(item.quantidade).toFixed(4),
    valor_unitario_comercial: parseFloat(item.preco_unitario).toFixed(4),
    valor_bruto: parseFloat(item.preco_total).toFixed(2),
    unidade_tributavel: 'UN',
    quantidade_tributavel: parseFloat(item.quantidade).toFixed(4),
    valor_unitario_tributavel: parseFloat(item.preco_unitario).toFixed(4),
    
    // Origem da mercadoria (0=Nacional, exceto as indicadas nos códigos 3, 4, 5 e 8)
    // Campo deve se chamar 'icms_origem' conforme documentação Focus NFe
    icms_origem: parseInt(produto.icms_origem) || 0,
    
    // === ICMS (para Simples Nacional) ===
    icms_situacao_tributaria: produto.icms_situacao_tributaria || '102', // 102 = Tributada pelo Simples Nacional sem permissão de crédito
    
    // === PIS ===
    pis_situacao_tributaria: produto.pis_cst || '07', // 07 = Operação Isenta da Contribuição
    
    // === COFINS ===
    cofins_situacao_tributaria: produto.cofins_cst || '07', // 07 = Operação Isenta da Contribuição
    
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
    
    // Debug: mostrar qual token está sendo usado
    console.log(`[Focus NFe] Ambiente: ${ambiente}`);
    console.log(`[Focus NFe] Token sendo usado: ${token ? token.substring(0, 8) + '...' : 'NENHUM'}`);
    console.log(`[Focus NFe] Token Homologação configurado: ${focusConfig.token_homologacao ? 'SIM' : 'NÃO'}`);
    console.log(`[Focus NFe] Token Produção configurado: ${focusConfig.token_producao ? 'SIM' : 'NÃO'}`);
    console.log(`[Focus NFe] Token Legado configurado: ${focusConfig.token ? 'SIM' : 'NÃO'}`);
    
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
    
    // Buscar itens da NF-e com dados do produto
    const itens = await query(
      `SELECT ni.*, p.nome as produto_nome, p.sku, p.codigo_barras, p.ncm, p.cfop,
              p.icms_origem, p.icms_situacao_tributaria, p.pis_cst, p.cofins_cst
       FROM nfe_itens ni
       JOIN produtos p ON ni.produto_id = p.id
       WHERE ni.nfe_id = ?`,
      [nfeId]
    );
    
    if (itens.length === 0) {
      throw new Error('NF-e não possui itens');
    }
    
    // Montar payload
    const payload = montarNfePayload(nfe, tenant, cliente, itens, focusConfig);
    
    // Criar referência única para a NF-e
    const referencia = `nfe-${tenantId}-${nfeId}-${Date.now()}`;
    
    // Criar cliente da API com o token correto
    const client = createFocusNfeClient(token, focusConfig.ambiente);
    
    // Enviar para a API
    console.log(`[Focus NFe] Emitindo NF-e ${nfe.numero} para referência ${referencia}`);
    
    const response = await client.post(`/v2/nfe?ref=${referencia}`, payload);
    
    // Processar resposta
    const { data } = response;
    
    // Log detalhado da resposta da SEFAZ
    console.log(`[Focus NFe] Resposta da API:`, {
      status: data.status,
      mensagem_sefaz: data.mensagem_sefaz,
      mensagem: data.mensagem,
      protocolo: data.protocolo,
      chave_nfe: data.chave_nfe
    });
    
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
        data.chave_nfe || null,
        data.mensagem_sefaz || data.mensagem || null,
        data.status,
        nfeId,
        tenantId
      ]
    );
    
    return {
      success: data.status === 'autorizado',
      status: data.status,
      protocolo: data.protocolo,
      chave_acesso: data.chave_nfe,
      mensagem: data.mensagem_sefaz || data.mensagem,
      referencia
    };
  } catch (error) {
    console.error('[Focus NFe] Erro ao emitir NF-e:', error.response?.data || error.message);
    
    // Atualizar status de erro no banco
    await query(
      `UPDATE nfe SET status = 'erro', motivo_status = ? WHERE id = ? AND tenant_id = ?`,
      [error.response?.data?.mensagem || error.message, nfeId, tenantId]
    );
    
    throw new Error(error.response?.data?.mensagem || error.message);
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
    
    const response = await client.get(`/v2/nfe/${nfe.focus_nfe_ref}`);
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
        data.chave_nfe || null,
        data.mensagem_sefaz || data.mensagem || null,
        nfeId,
        tenantId
      ]
    );
    
    return {
      status: data.status,
      status_sefaz: data.status_sefaz,
      mensagem_sefaz: data.mensagem_sefaz,
      protocolo: data.protocolo,
      chave_acesso: data.chave_nfe,
      numero: data.numero,
      serie: data.serie,
      caminho_xml: data.caminho_xml_nota_fiscal,
      caminho_danfe: data.caminho_danfe,
      data_emissao: data.data_emissao
    };
  } catch (error) {
    console.error('[Focus NFe] Erro ao consultar NF-e:', error.response?.data || error.message);
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
    
    const response = await client.delete(`/v2/nfe/${nfe.focus_nfe_ref}`, {
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
    console.error('[Focus NFe] Erro ao cancelar NF-e:', error.response?.data || error.message);
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
    
    console.log(`[Focus NFe] Obtendo XML para ref: ${nfe.focus_nfe_ref}`);
    const response = await client.get(`/v2/nfe/${nfe.focus_nfe_ref}.xml`, {
      responseType: 'text'
    });
    
    console.log(`[Focus NFe] XML obtido, tamanho: ${response.data?.length || 0} caracteres`);
    
    return {
      xml: response.data,
      filename: `nfe_${nfe.numero}_${nfe.chave_acesso || 'sem_chave'}.xml`
    };
  } catch (error) {
    console.error('[Focus NFe] Erro ao obter XML:', error.response?.data || error.message);
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
    
    // Primeiro, consultar a NF-e para obter o caminho do DANFE
    console.log(`[Focus NFe] Consultando DANFE para ref: ${nfe.focus_nfe_ref}`);
    const response = await client.get(`/v2/nfe/${nfe.focus_nfe_ref}`);
    const { data } = response;
    
    console.log('[Focus NFe] Resposta da consulta:', JSON.stringify(data, null, 2));
    
    if (!data.caminho_danfe) {
      console.log('[Focus NFe] caminho_danfe não disponível ainda');
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
    
    console.log(`[Focus NFe] URL do DANFE: ${danfeUrl}`);
    
    return {
      url: danfeUrl,
      filename: `danfe_${nfe.numero}_${nfe.chave_acesso || 'sem_chave'}.pdf`
    };
  } catch (error) {
    console.error('[Focus NFe] Erro ao obter DANFE:', error.response?.data || error.message);
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

