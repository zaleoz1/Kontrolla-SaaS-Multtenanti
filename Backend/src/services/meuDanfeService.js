/**
 * Serviço de integração com a API MeuDanfe v2
 * https://meudanfe.com.br/api
 * 
 * Funcionalidades:
 * - Consultar NF-e via chave de acesso (R$ 0,03 por consulta)
 * - Converter XML em DANFE PDF (gratuito)
 * - Download de XML (gratuito para notas já consultadas)
 * 
 * Configuração via variáveis de ambiente:
 * - MEUDANFE_API_KEY: API Key obtida em https://meudanfe.com.br
 */

import { query, queryWithResult } from '../database/connection.js';

// URL base da API MeuDanfe v2
// Documentação: https://meudanfe.com.br/api
// Endpoints disponíveis:
// - PUT /fd/add/{chave} - Busca e adiciona NF-e à área do cliente (R$ 0,03)
//   Status: WAITING, SEARCHING, NOT_FOUND, OK, ERROR
// - PUT /fd/add/xml - Envia XML para adicionar à área do cliente (GRÁTIS)
// - POST /fd/convert/xml-to-da - Converte XML para DANFE/DACTE em PDF (GRÁTIS)
// - GET /fd/get/xml/{chave} - Download do XML (GRÁTIS - notas já na área do cliente)
// - GET /fd/get/da/{chave} - Download do DANFE/DACTE em PDF (GRÁTIS - notas já na área do cliente)
const MEUDANFE_API_BASE = process.env.MEUDANFE_API_URL || 'https://api.meudanfe.com.br/v2/fd';

/**
 * Obtém a API Key configurada no backend
 */
function getApiKey() {
  const apiKey = process.env.MEUDANFE_API_KEY;
  if (!apiKey) {
    throw new Error('MEUDANFE_API_KEY não configurada no servidor. Configure a variável de ambiente.');
  }
  return apiKey;
}

/**
 * Verifica se a API está configurada
 */
export function isApiConfigured() {
  return !!process.env.MEUDANFE_API_KEY;
}

/**
 * Obtém informações da configuração (sem expor a API Key)
 */
export function getConfigInfo() {
  const apiKey = process.env.MEUDANFE_API_KEY;
  return {
    api_key_configurada: !!apiKey,
    api_key_masked: apiKey ? '****' + apiKey.slice(-4) : null
  };
}

/**
 * Obtém os headers para as requisições da API MeuDanfe
 */
function getApiHeaders() {
  return {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Api-Key': getApiKey()
  };
}

/**
 * Valida a chave de acesso da NF-e (44 dígitos numéricos)
 */
function validarChaveAcesso(chaveAcesso) {
  const chave = chaveAcesso.replace(/\D/g, '');
  if (chave.length !== 44) {
    return { valid: false, error: 'Chave de acesso deve conter 44 dígitos' };
  }
  return { valid: true, chave };
}

/**
 * Extrai valor de uma tag XML usando regex
 */
function extrairDoXml(xml, tagName) {
  if (!xml) return null;
  // Tenta com namespace e sem namespace
  const patterns = [
    new RegExp(`<${tagName}>([^<]*)</${tagName.split('>').pop()}`, 'i'),
    new RegExp(`<[^:]*:${tagName}>([^<]*)</[^:]*:${tagName.split('>').pop()}`, 'i'),
    new RegExp(`<${tagName}[^>]*>([^<]*)`, 'i')
  ];
  
  for (const pattern of patterns) {
    const match = xml.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return null;
}

/**
 * Extrai valor de uma tag dentro de um bloco XML específico
 */
function extrairDoXmlBloco(xml, blocoTag, tagName) {
  if (!xml) return null;
  // Extrai o bloco primeiro
  const blocoPattern = new RegExp(`<${blocoTag}[^>]*>([\\s\\S]*?)</${blocoTag}>`, 'i');
  const blocoMatch = xml.match(blocoPattern);
  if (blocoMatch && blocoMatch[1]) {
    return extrairDoXml(blocoMatch[1], tagName);
  }
  return null;
}

/**
 * Consulta NF-e por chave de acesso na API MeuDanfe
 * Este serviço é PAGO: R$ 0,03 por consulta
 * 
 * @param {number} tenantId - ID do tenant
 * @param {string} chaveAcesso - Chave de acesso da NF-e (44 dígitos)
 * @returns {Promise<object>} Dados da NF-e consultada
 */
export async function consultarNfePorChave(tenantId, chaveAcesso) {
  // Validar chave de acesso
  const validacao = validarChaveAcesso(chaveAcesso);
  if (!validacao.valid) {
    throw new Error(validacao.error);
  }

  try {
    // Endpoint: PUT /fd/add/{chave} - Busca e adiciona NF-e à área do cliente
    const url = `${MEUDANFE_API_BASE}/add/${validacao.chave}`;
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: getApiHeaders()
    });

    const responseText = await response.text();

    // Parsear resposta JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      if (responseText.includes('<!DOCTYPE') || responseText.includes('<html')) {
        throw new Error(`API MeuDanfe retornou HTML. Verifique a URL da API.`);
      }
      throw new Error(`Resposta inválida da API MeuDanfe`);
    }

    if (!response.ok) {
      // Tratar erros específicos da API
      if (response.status === 404) {
        // Verificar se é um 404 da API (endpoint não encontrado) ou da NF-e
        if (data.path) {
          throw new Error(`Endpoint da API MeuDanfe não encontrado. A URL da API pode estar incorreta. URL atual: ${MEUDANFE_API_BASE}. Verifique a documentação em https://meudanfe.com.br/api ou configure MEUDANFE_API_URL no backend.`);
        }
        throw new Error(data.message || data.error || 'NF-e não encontrada. Verifique a chave de acesso ou a nota pode não estar disponível na SEFAZ.');
      }
      if (response.status === 401 || response.status === 403) {
        throw new Error('API Key inválida ou sem permissão. Verifique a configuração no backend.');
      }
      throw new Error(data.message || data.error || `Erro na consulta: ${response.status} ${response.statusText}`);
    }

    // Tratar os status retornados pela API MeuDanfe
    // Status possíveis: WAITING, SEARCHING, NOT_FOUND, OK, ERROR
    const status = data.status || data.Status;
    
    if (status === 'NOT_FOUND') {
      throw new Error('NF-e não encontrada na SEFAZ. Verifique se a chave de acesso está correta.');
    }
    
    if (status === 'ERROR') {
      throw new Error(data.message || data.erro || 'Erro ao consultar NF-e na SEFAZ.');
    }

    // Se a nota foi adicionada com sucesso (OK), buscar o XML para obter detalhes
    let nfeDetalhes = data;
    let xmlContent = null;
    
    if (status === 'OK') {
      try {
        // Aguardar 1.5 segundos conforme recomendação da API para evitar bloqueio
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Buscar o XML que contém os detalhes da NF-e
        const xmlUrl = `${MEUDANFE_API_BASE}/get/xml/${validacao.chave}`;
        
        const xmlResponse = await fetch(xmlUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Api-Key': getApiKey()
          }
        });

        if (xmlResponse.ok) {
          const xmlData = await xmlResponse.json();
          
          // A API pode retornar em 'data', 'xml', 'content', etc
          xmlContent = xmlData.data || xmlData.xml || xmlData.XML || xmlData.content || xmlData.file;
          
          // Extrair informações do XML
          if (xmlContent && typeof xmlContent === 'string' && xmlContent.length > 100) {
            nfeDetalhes = {
              ...data,
              xml_disponivel: true,
              numero: extrairDoXml(xmlContent, 'nNF'),
              serie: extrairDoXml(xmlContent, 'serie'),
              data_emissao: extrairDoXml(xmlContent, 'dhEmi'),
              valor_total: extrairDoXml(xmlContent, 'vNF'),
              emitente: {
                cnpj: extrairDoXmlBloco(xmlContent, 'emit', 'CNPJ'),
                nome: extrairDoXmlBloco(xmlContent, 'emit', 'xNome'),
                fantasia: extrairDoXmlBloco(xmlContent, 'emit', 'xFant'),
                uf: extrairDoXmlBloco(xmlContent, 'emit', 'UF')
              },
              destinatario: {
                cnpj: extrairDoXmlBloco(xmlContent, 'dest', 'CNPJ'),
                cpf: extrairDoXmlBloco(xmlContent, 'dest', 'CPF'),
                nome: extrairDoXmlBloco(xmlContent, 'dest', 'xNome')
              }
            };
          }
        }
      } catch (xmlError) {
        // Continua sem o XML - ainda retorna os dados básicos
      }
    }

    // Registrar consulta para auditoria
    await registrarConsulta(tenantId, validacao.chave, 'nfe', nfeDetalhes);

    return {
      success: true,
      status: status,
      nfe: nfeDetalhes,
      xml: xmlContent,
      chave_acesso: validacao.chave,
      tipo: data.type || 'NFE',
      aguardando: status === 'WAITING' || status === 'SEARCHING',
      mensagem: status === 'WAITING' ? 'Aguardando na fila...' : 
                status === 'SEARCHING' ? 'Consultando SEFAZ...' : 
                status === 'OK' ? 'NF-e encontrada e adicionada à sua área!' : null
    };
  } catch (error) {
    throw new Error(error.message || 'Erro ao consultar NF-e no MeuDanfe');
  }
}

/**
 * Obtém o XML da NF-e por chave de acesso
 * Gratuito se a nota já foi consultada anteriormente
 * 
 * @param {number} tenantId - ID do tenant
 * @param {string} chaveAcesso - Chave de acesso da NF-e
 * @returns {Promise<object>} XML da NF-e
 */
export async function obterXmlNfePorChave(tenantId, chaveAcesso) {
  const validacao = validarChaveAcesso(chaveAcesso);
  if (!validacao.valid) {
    throw new Error(validacao.error);
  }

  try {
    // Endpoint: GET /fd/get/xml/{chave}
    const url = `${MEUDANFE_API_BASE}/get/xml/${validacao.chave}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Api-Key': getApiKey()
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || `Erro ao obter XML: ${response.status}`);
    }

    // A API retorna JSON com o XML em 'data' (formato texto)
    const responseData = await response.json();
    
    // A API MeuDanfe usa 'data' para o conteúdo
    const xml = responseData.data || responseData.xml || responseData.XML || responseData.content || responseData.file;
    
    if (!xml || (typeof xml === 'string' && xml.length < 100)) {
      throw new Error('XML não disponível. Aguarde alguns segundos e tente novamente.');
    }

    return {
      success: true,
      xml: typeof xml === 'string' ? xml : JSON.stringify(xml),
      chave_acesso: validacao.chave,
      filename: responseData.name || `nfe_${validacao.chave}.xml`
    };
  } catch (error) {
    throw new Error(error.message || 'Erro ao obter XML da NF-e');
  }
}

/**
 * Envia/Adiciona XML à área do cliente
 * Este serviço é GRATUITO
 * 
 * @param {number} tenantId - ID do tenant
 * @param {string} xml - Conteúdo XML da NF-e/CT-e
 * @returns {Promise<object>} Resultado do envio
 */
export async function enviarXmlParaAreaCliente(tenantId, xml) {
  try {
    // Endpoint: PUT /fd/add/xml (GRÁTIS)
    // AVISO: Vários envios do mesmo XML bloqueará a conta!
    const response = await fetch(`${MEUDANFE_API_BASE}/add/xml`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/xml',
        'Api-Key': getApiKey()
      },
      body: xml
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || `Erro ao enviar XML: ${response.status}`);
    }

    const data = await response.json();
    
    // Registrar para auditoria
    await registrarConsulta(tenantId, data.chave || 'xml_upload', 'xml_upload', data);

    return {
      success: true,
      data,
      mensagem: 'XML adicionado à área do cliente com sucesso!'
    };
  } catch (error) {
    throw new Error(error.message || 'Erro ao enviar XML para área do cliente');
  }
}

/**
 * Converte XML em DANFE PDF
 * Este serviço é GRATUITO
 * 
 * @param {string} xml - Conteúdo XML da NF-e
 * @returns {Promise<object>} PDF em base64
 */
export async function converterXmlParaDanfe(xml) {
  try {
    // Endpoint: POST /fd/convert/xml-to-da (GRÁTIS)
    // Envia o XML no body e recebe JSON com PDF em BASE64
    const response = await fetch(`${MEUDANFE_API_BASE}/convert/xml-to-da`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/xml',
        'Api-Key': getApiKey()
      },
      body: xml  // Envia o XML diretamente no body
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Erro ao converter XML: ${response.status}`);
    }

    const data = await response.json();

    return {
      success: true,
      pdf_url: data.url || data.pdf_url,
      pdf_base64: data.pdf || data.base64
    };
  } catch (error) {
    throw new Error(error.message || 'Erro ao converter XML para DANFE');
  }
}

/**
 * Obtém DANFE PDF por chave de acesso
 * 
 * @param {string} chaveAcesso - Chave de acesso da NF-e
 * @returns {Promise<object>} URL do DANFE PDF
 */
export async function obterDanfePorChave(chaveAcesso) {
  const validacao = validarChaveAcesso(chaveAcesso);
  if (!validacao.valid) {
    throw new Error(validacao.error);
  }

  try {
    // Endpoint: GET /fd/get/da/{chave} (GRÁTIS - para notas já na área do cliente)
    const response = await fetch(`${MEUDANFE_API_BASE}/get/da/${validacao.chave}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Api-Key': getApiKey()
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || `Erro ao obter DANFE: ${response.status}`);
    }

    // A API retorna JSON com PDF em BASE64: { name, type, format, data }
    const data = await response.json();

    // 'data' contém o PDF em BASE64
    const pdfBase64 = data.data || data.pdf || data.base64 || data.danfe || data.content || data.file;

    if (!pdfBase64) {
      throw new Error('DANFE não disponível. Tente novamente em alguns segundos.');
    }

    return {
      success: true,
      pdf_base64: pdfBase64,
      filename: data.name || `danfe_${validacao.chave}.pdf`
    };
  } catch (error) {
    throw new Error(error.message || 'Erro ao obter DANFE');
  }
}

/**
 * Importa NF-e consultada para o sistema
 * Cria registro na tabela nfe_importadas
 * 
 * @param {number} tenantId - ID do tenant
 * @param {object} nfeData - Dados da NF-e consultada
 * @returns {Promise<object>} NF-e importada
 */
export async function importarNfeConsultada(tenantId, nfeData) {
  try {
    // Extrair dados da NF-e
    const {
      chave_acesso,
      numero,
      serie,
      data_emissao,
      valor_total,
      emitente,
      destinatario,
      emitente_cnpj,
      emitente_nome,
      emitente_uf,
      destinatario_cnpj,
      destinatario_nome,
      itens,
      xml
    } = nfeData;

    // Verificar se já existe
    const existing = await query(
      `SELECT id FROM nfe_importadas WHERE tenant_id = ? AND chave_acesso = ?`,
      [tenantId, chave_acesso]
    );

    if (existing.length > 0) {
      throw new Error('Esta NF-e já foi importada anteriormente');
    }

    // Inserir NF-e importada
    const result = await queryWithResult(
      `INSERT INTO nfe_importadas (
        tenant_id,
        chave_acesso,
        numero,
        serie,
        data_emissao,
        valor_total,
        emitente_cnpj,
        emitente_nome,
        emitente_uf,
        destinatario_cnpj,
        destinatario_nome,
        xml_content,
        itens_json,
        data_importacao,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 'importada')`,
      [
        tenantId,
        chave_acesso,
        numero || '',
        serie || '1',
        data_emissao || new Date(),
        valor_total || 0,
        emitente_cnpj || emitente?.cnpj || '',
        emitente_nome || emitente?.nome || emitente?.razao_social || '',
        emitente_uf || emitente?.uf || '',
        destinatario_cnpj || destinatario?.cnpj || destinatario?.cpf || '',
        destinatario_nome || destinatario?.nome || destinatario?.razao_social || '',
        xml || null,
        JSON.stringify(itens || [])
      ]
    );

    return {
      success: true,
      id: result.insertId,
      message: 'NF-e importada com sucesso'
    };
  } catch (error) {
    throw new Error(error.message || 'Erro ao importar NF-e');
  }
}

/**
 * Lista NF-e importadas do tenant
 */
export async function listarNfesImportadas(tenantId, params = {}) {
  const { page = 1, limit = 10, q = '' } = params;
  const offset = (page - 1) * limit;

  let whereClause = 'WHERE tenant_id = ?';
  let queryParams = [tenantId];

  if (q) {
    whereClause += ' AND (chave_acesso LIKE ? OR emitente_nome LIKE ? OR numero LIKE ?)';
    const searchTerm = `%${q}%`;
    queryParams.push(searchTerm, searchTerm, searchTerm);
  }

  const nfes = await query(
    `SELECT * FROM nfe_importadas 
     ${whereClause} 
     ORDER BY data_importacao DESC 
     LIMIT ${Number(limit)} OFFSET ${Number(offset)}`,
    queryParams
  );

  const [totalResult] = await query(
    `SELECT COUNT(*) as total FROM nfe_importadas ${whereClause}`,
    queryParams
  );

  return {
    nfes,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: totalResult.total,
      totalPages: Math.ceil(totalResult.total / limit)
    }
  };
}

/**
 * Obtém detalhes de uma NF-e importada
 */
export async function obterNfeImportada(tenantId, nfeId) {
  const results = await query(
    `SELECT * FROM nfe_importadas WHERE id = ? AND tenant_id = ?`,
    [nfeId, tenantId]
  );

  if (results.length === 0) {
    throw new Error('NF-e importada não encontrada');
  }

  const nfe = results[0];
  
  // Parse itens JSON
  if (nfe.itens_json) {
    try {
      nfe.itens = JSON.parse(nfe.itens_json);
    } catch (e) {
      nfe.itens = [];
    }
  }

  return nfe;
}

/**
 * Registra consulta para auditoria
 */
async function registrarConsulta(tenantId, chaveAcesso, tipo, resultado) {
  try {
    await query(
      `INSERT INTO meudanfe_consultas (
        tenant_id,
        chave_acesso,
        tipo,
        resultado,
        custo,
        data_consulta
      ) VALUES (?, ?, ?, ?, ?, NOW())`,
      [
        tenantId,
        chaveAcesso,
        tipo,
        JSON.stringify(resultado).substring(0, 5000),
        0.03 // Custo de R$ 0,03 por consulta
      ]
    );
  } catch (error) {
    // Não falhar se não conseguir registrar
  }
}

/**
 * Obtém estatísticas de uso da API
 */
export async function obterEstatisticasUso(tenantId, periodo = 'mes') {
  let whereDate = '';
  switch (periodo) {
    case 'hoje':
      whereDate = 'AND DATE(data_consulta) = CURDATE()';
      break;
    case 'semana':
      whereDate = 'AND data_consulta >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
      break;
    case 'mes':
      whereDate = 'AND data_consulta >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)';
      break;
    case 'ano':
      whereDate = 'AND data_consulta >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR)';
      break;
  }

  const results = await query(
    `SELECT 
      COUNT(*) as total_consultas,
      COALESCE(SUM(custo), 0) as custo_total
     FROM meudanfe_consultas 
     WHERE tenant_id = ? ${whereDate}`,
    [tenantId]
  );

  return {
    total_consultas: results[0]?.total_consultas || 0,
    custo_total: results[0]?.custo_total || 0,
    periodo
  };
}

/**
 * Valida se a configuração está correta
 */
export function validarConfiguracoes() {
  const errors = [];

  if (!process.env.MEUDANFE_API_KEY) {
    errors.push('Variável de ambiente MEUDANFE_API_KEY não configurada');
  }

  return {
    valid: errors.length === 0,
    errors,
    config: getConfigInfo()
  };
}
