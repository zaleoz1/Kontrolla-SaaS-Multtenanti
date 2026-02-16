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
 */

import axios from 'axios';
import { query } from '../database/connection.js';

// URLs da API Focus NFe
const FOCUS_NFE_URLS = {
  homologacao: 'https://homologacao.focusnfe.com.br',
  producao: 'https://api.focusnfe.com.br'
};

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
    token: config.token || '',
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
    'token', 'ambiente', 'serie_padrao', 'natureza_operacao',
    'regime_tributario', 'cnpj_emitente', 'inscricao_estadual',
    'informacoes_complementares'
  ];
  
  for (const key of configKeys) {
    if (config[key] !== undefined) {
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
 * @param {Object} nfe - Dados da NF-e do banco
 * @param {Object} tenant - Dados do tenant (emitente)
 * @param {Object} cliente - Dados do cliente (destinatário)
 * @param {Array} itens - Itens da NF-e
 * @param {Object} focusConfig - Configurações Focus NFe
 * @returns {Object}
 */
function montarNfePayload(nfe, tenant, cliente, itens, focusConfig) {
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
    
    // Consumidor final (0=Não, 1=Sim)
    consumidor_final: cliente ? 0 : 1,
    
    // Presença do comprador (1=Presencial, 2=Internet, 9=Outros)
    presenca_comprador: 1,
    
    // Informações adicionais
    informacoes_adicionais_contribuinte: nfe.observacoes || '',
    
    // === EMITENTE (dados do tenant) ===
    cnpj_emitente: tenant.cnpj?.replace(/\D/g, '') || focusConfig.cnpj_emitente?.replace(/\D/g, ''),
    inscricao_estadual_emitente: tenant.inscricao_estadual || focusConfig.inscricao_estadual,
    nome_emitente: tenant.razao_social || tenant.nome,
    nome_fantasia_emitente: tenant.nome_fantasia || tenant.nome,
    logradouro_emitente: extrairLogradouro(tenant.endereco) || 'Endereço não informado',
    numero_emitente: extrairNumero(tenant.endereco) || 'S/N',
    bairro_emitente: 'Centro',
    municipio_emitente: tenant.cidade || 'Cidade não informada',
    uf_emitente: tenant.estado || 'SP',
    cep_emitente: tenant.cep?.replace(/\D/g, '') || '00000000',
    telefone_emitente: tenant.telefone?.replace(/\D/g, '') || '',
    
    // Regime tributário (1=Simples Nacional, 2=Simples Nacional - excesso, 3=Normal)
    regime_tributario: parseInt(focusConfig.regime_tributario) || 1,
    
    // === ITENS ===
    items: itens.map((item, index) => montarItemNfe(item, index, focusConfig))
  };
  
  // === DESTINATÁRIO (se houver cliente) ===
  if (cliente && cliente.cpf_cnpj) {
    const cpfCnpj = cliente.cpf_cnpj.replace(/\D/g, '');
    
    if (cpfCnpj.length === 11) {
      // CPF
      payload.cpf_destinatario = cpfCnpj;
    } else if (cpfCnpj.length === 14) {
      // CNPJ
      payload.cnpj_destinatario = cpfCnpj;
      if (cliente.inscricao_estadual) {
        payload.inscricao_estadual_destinatario = cliente.inscricao_estadual;
      }
    }
    
    payload.nome_destinatario = cliente.nome;
    
    if (cliente.endereco) {
      payload.logradouro_destinatario = extrairLogradouro(cliente.endereco) || 'Endereço não informado';
      payload.numero_destinatario = extrairNumero(cliente.endereco) || 'S/N';
      payload.bairro_destinatario = 'Centro';
    }
    
    payload.municipio_destinatario = cliente.cidade || 'Cidade não informada';
    payload.uf_destinatario = cliente.estado || 'SP';
    payload.cep_destinatario = cliente.cep?.replace(/\D/g, '') || '00000000';
    payload.indicador_inscricao_estadual_destinatario = 9; // 9=Não contribuinte
    
    if (cliente.email) {
      payload.email_destinatario = cliente.email;
    }
  }
  
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
    origem: produto.icms_origem || '0',
    
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
    
    if (!focusConfig.token) {
      throw new Error('Token da API Focus NFe não configurado. Configure em Configurações > NF-e.');
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
    
    // Criar cliente da API
    const client = createFocusNfeClient(focusConfig.token, focusConfig.ambiente);
    
    // Enviar para a API
    console.log(`[Focus NFe] Emitindo NF-e ${nfe.numero} para referência ${referencia}`);
    
    const response = await client.post(`/v2/nfe?ref=${referencia}`, payload);
    
    // Processar resposta
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
    
    if (!focusConfig.token) {
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
    
    const client = createFocusNfeClient(focusConfig.token, focusConfig.ambiente);
    
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
    
    if (!focusConfig.token) {
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
    
    const client = createFocusNfeClient(focusConfig.token, focusConfig.ambiente);
    
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
    
    if (!focusConfig.token) {
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
    
    const client = createFocusNfeClient(focusConfig.token, focusConfig.ambiente);
    
    const response = await client.get(`/v2/nfe/${nfe.focus_nfe_ref}.xml`, {
      responseType: 'text'
    });
    
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
    
    if (!focusConfig.token) {
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
    
    const client = createFocusNfeClient(focusConfig.token, focusConfig.ambiente);
    
    // Primeiro, consultar a NF-e para obter o caminho do DANFE
    const response = await client.get(`/v2/nfe/${nfe.focus_nfe_ref}`);
    const { data } = response;
    
    if (!data.caminho_danfe) {
      throw new Error('DANFE ainda não está disponível. Aguarde alguns segundos e tente novamente.');
    }
    
    return {
      url: data.caminho_danfe,
      filename: `danfe_${nfe.numero}_${nfe.chave_acesso || 'sem_chave'}.pdf`
    };
  } catch (error) {
    console.error('[Focus NFe] Erro ao obter DANFE:', error.response?.data || error.message);
    throw new Error(error.response?.data?.mensagem || error.message);
  }
}

/**
 * Valida se o tenant possui as configurações mínimas para emissão de NF-e
 * @param {number} tenantId - ID do tenant
 * @returns {Promise<Object>}
 */
export async function validarConfiguracoes(tenantId) {
  const focusConfig = await getFocusNfeConfig(tenantId);
  const errors = [];
  
  if (!focusConfig.token) {
    errors.push('Token da API Focus NFe não configurado');
  }
  
  if (!focusConfig.cnpj_emitente) {
    errors.push('CNPJ do emitente não configurado');
  }
  
  // Buscar dados do tenant
  const [tenant] = await query(
    `SELECT * FROM tenants WHERE id = ?`,
    [tenantId]
  );
  
  if (!tenant) {
    errors.push('Tenant não encontrado');
  } else {
    if (!tenant.razao_social && !tenant.nome) {
      errors.push('Razão social ou nome da empresa não informado');
    }
    if (!tenant.endereco) {
      errors.push('Endereço da empresa não informado');
    }
    if (!tenant.cidade) {
      errors.push('Cidade da empresa não informada');
    }
    if (!tenant.estado) {
      errors.push('Estado da empresa não informado');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    config: {
      token_configurado: !!focusConfig.token,
      ambiente: focusConfig.ambiente,
      cnpj_emitente: focusConfig.cnpj_emitente,
      inscricao_estadual: focusConfig.inscricao_estadual,
      serie_padrao: focusConfig.serie_padrao,
      natureza_operacao: focusConfig.natureza_operacao,
      regime_tributario: focusConfig.regime_tributario
    }
  };
}

export default {
  getFocusNfeConfig,
  saveFocusNfeConfig,
  emitirNfe,
  consultarNfe,
  cancelarNfe,
  obterXmlNfe,
  obterDanfeNfe,
  validarConfiguracoes
};

