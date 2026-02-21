import express from 'express';
import { query, queryWithResult, transaction } from '../database/connection.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateId, validatePagination, validateSearch, handleValidationErrors } from '../middleware/validation.js';
import {
  emitirNfe as focusEmitirNfe,
  consultarNfe as focusConsultarNfe,
  cancelarNfe as focusCancelarNfe,
  obterXmlNfe,
  obterDanfeNfe,
  getFocusNfeConfig,
  saveFocusNfeConfig,
  validarConfiguracoes,
  isTokenPrincipalConfigurado
} from '../services/focusNfeService.js';

const router = express.Router();

// Aplicar autenticação em todas as rotas
router.use(authenticateToken);

// Listar NF-e
router.get('/', validatePagination, validateSearch, handleValidationErrors, async (req, res) => {
  try {
    const { page = 1, limit = 10, q = '', status = '', data_inicio = '', data_fim = '' } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE n.tenant_id = ?';
    let params = [req.user.tenant_id];

    // Adicionar filtro de busca
    if (q) {
      whereClause += ' AND (n.numero LIKE ? OR c.nome LIKE ? OR c.cpf_cnpj LIKE ?)';
      const searchTerm = `%${q}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Adicionar filtro de status
    if (status) {
      whereClause += ' AND n.status = ?';
      params.push(status);
    }

    // Adicionar filtro de data
    if (data_inicio) {
      whereClause += ' AND DATE(n.data_emissao) >= ?';
      params.push(data_inicio);
    }

    if (data_fim) {
      whereClause += ' AND DATE(n.data_emissao) <= ?';
      params.push(data_fim);
    }

    // Buscar NF-e
    const nfes = await query(
      `SELECT n.*, c.nome as cliente_nome, c.cpf_cnpj as cliente_cnpj_cpf
       FROM nfe n 
       LEFT JOIN clientes c ON n.cliente_id = c.id 
       ${whereClause} 
       ORDER BY n.data_emissao DESC 
       LIMIT ${Number(limit)} OFFSET ${Number(offset)}`,
      params
    );

    // Contar total de registros
    const [totalResult] = await query(
      `SELECT COUNT(*) as total FROM nfe n 
       LEFT JOIN clientes c ON n.cliente_id = c.id 
       ${whereClause}`,
      params
    );

    const total = totalResult.total;
    const totalPages = Math.ceil(total / limit);

    res.json({
      nfes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Erro ao listar NF-e:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Estatísticas das NF-e (deve vir antes da rota /:id)
router.get('/stats/overview', async (req, res) => {
  try {
    const { periodo = 'mes' } = req.query;
    
    let whereClause = 'WHERE tenant_id = ?';
    let params = [req.user.tenant_id];

    // Adicionar filtro de período
    switch (periodo) {
      case 'hoje':
        whereClause += ' AND DATE(data_emissao) = CURDATE()';
        break;
      case 'semana':
        whereClause += ' AND data_emissao >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
        break;
      case 'mes':
        whereClause += ' AND data_emissao >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)';
        break;
      case 'ano':
        whereClause += ' AND data_emissao >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR)';
        break;
    }

    const stats = await query(
      `SELECT 
        COUNT(*) as total_nfe,
        COUNT(CASE WHEN status = 'autorizada' THEN 1 END) as nfe_autorizadas,
        COUNT(CASE WHEN status = 'pendente' THEN 1 END) as nfe_pendentes,
        COUNT(CASE WHEN status = 'cancelada' THEN 1 END) as nfe_canceladas,
        COUNT(CASE WHEN status = 'erro' THEN 1 END) as nfe_erro,
        COALESCE(SUM(CASE WHEN status = 'autorizada' THEN valor_total ELSE 0 END), 0) as valor_total_autorizado
      FROM nfe 
      ${whereClause}`,
      params
    );

    res.json({
      stats: stats[0],
      periodo
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas das NF-e:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Buscar NF-e por ID
router.get('/:id', validateId, handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar NF-e
    const nfes = await query(
      `SELECT n.*, c.nome as cliente_nome, c.cpf_cnpj as cliente_cnpj_cpf
       FROM nfe n 
       LEFT JOIN clientes c ON n.cliente_id = c.id 
       WHERE n.id = ? AND n.tenant_id = ?`,
      [id, req.user.tenant_id]
    );

    if (nfes.length === 0) {
      return res.status(404).json({
        error: 'NF-e não encontrada'
      });
    }

    // Buscar itens da NF-e
    const itens = await query(
      `SELECT ni.*, p.nome as produto_nome, p.codigo_barras, p.sku
       FROM nfe_itens ni
       JOIN produtos p ON ni.produto_id = p.id
       WHERE ni.nfe_id = ?
       ORDER BY ni.id`,
      [id]
    );

    res.json({
      nfe: {
        ...nfes[0],
        itens
      }
    });
  } catch (error) {
    console.error('Erro ao buscar NF-e:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Criar nova NF-e
router.post('/', async (req, res) => {
  try {
    const {
      venda_id,
      cliente_id,
      cnpj_cpf,
      itens = [],
      observacoes
    } = req.body;

    // Buscar configurações da Focus NFe do tenant (ambiente e série)
    const focusConfig = await getFocusNfeConfig(req.user.tenant_id);
    const ambienteAtual = focusConfig.ambiente || 'homologacao';
    const seriePadrao = focusConfig.serie_padrao || '001';

    // Verificar se venda existe (se fornecida)
    if (venda_id) {
      const vendas = await query(
        'SELECT id FROM vendas WHERE id = ? AND tenant_id = ?',
        [venda_id, req.user.tenant_id]
      );

      if (vendas.length === 0) {
        return res.status(400).json({
          error: 'Venda não encontrada'
        });
      }
    }

    // Verificar se cliente existe (se fornecido)
    if (cliente_id) {
      const clientes = await query(
        'SELECT id FROM clientes WHERE id = ? AND tenant_id = ?',
        [cliente_id, req.user.tenant_id]
      );

      if (clientes.length === 0) {
        return res.status(400).json({
          error: 'Cliente não encontrado'
        });
      }
    }

    // Verificar se há itens
    if (!itens || itens.length === 0) {
      return res.status(400).json({
        error: 'NF-e deve ter pelo menos um item'
      });
    }

    // Calcular valor total
    const valorTotal = itens.reduce((total, item) => total + (item.quantidade * item.preco_unitario), 0);

    const tenantId = req.user.tenant_id;

    // Gerar número e criar NF-e + itens em uma transação (evita reutilizar número e condição de corrida)
    const { nfeId, numeroNfe } = await transaction(async (conn) => {
      const numeroNfe = await gerarNumeroNfeComTransacao(conn, tenantId);
      const [insertResult] = await conn.execute(
        `INSERT INTO nfe (
          tenant_id, venda_id, cliente_id, cnpj_cpf, numero, serie, valor_total,
          status, ambiente, observacoes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          tenantId,
          venda_id ?? null,
          cliente_id ?? null,
          cnpj_cpf ?? null,
          numeroNfe,
          seriePadrao,
          valorTotal,
          'pendente',
          ambienteAtual,
          observacoes ?? null
        ]
      );
      const nfeId = insertResult.insertId;
      for (const item of itens) {
        await conn.execute(
          `INSERT INTO nfe_itens (nfe_id, produto_id, quantidade, preco_unitario, preco_total)
           VALUES (?, ?, ?, ?, ?)`,
          [
            nfeId, item.produto_id, item.quantidade, item.preco_unitario,
            item.quantidade * item.preco_unitario
          ]
        );
      }
      return { nfeId, numeroNfe };
    });

    console.log(`[NF-e] Criada NF-e #${numeroNfe} em ambiente: ${ambienteAtual.toUpperCase()}`);

    // Buscar NF-e criada
    const [nfe] = await query(
      `SELECT n.*, c.nome as cliente_nome, c.cpf_cnpj as cliente_cnpj_cpf
       FROM nfe n 
       LEFT JOIN clientes c ON n.cliente_id = c.id 
       WHERE n.id = ?`,
      [nfeId]
    );

    res.status(201).json({
      message: 'NF-e criada com sucesso',
      nfe: nfe || null
    });
  } catch (error) {
    console.error('Erro ao criar NF-e:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Atualizar status da NF-e
router.patch('/:id/status', validateId, handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, chave_acesso } = req.body;

    if (!status || !['pendente', 'autorizada', 'cancelada', 'erro'].includes(status)) {
      return res.status(400).json({
        error: 'Status inválido'
      });
    }

    // Verificar se NF-e existe
    const existingNfes = await query(
      'SELECT id FROM nfe WHERE id = ? AND tenant_id = ?',
      [id, req.user.tenant_id]
    );

    if (existingNfes.length === 0) {
      return res.status(404).json({
        error: 'NF-e não encontrada'
      });
    }

    // Atualizar status e chave de acesso (se fornecida)
    const updateFields = ['status = ?'];
    const updateParams = [status];

    if (chave_acesso) {
      updateFields.push('chave_acesso = ?');
      updateParams.push(chave_acesso);
    }

    updateParams.push(id, req.user.tenant_id);

    await query(
      `UPDATE nfe SET ${updateFields.join(', ')} WHERE id = ? AND tenant_id = ?`,
      updateParams
    );

    res.json({
      message: 'Status da NF-e atualizado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao atualizar status da NF-e:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Deletar NF-e
router.delete('/:id', validateId, handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se NF-e existe
    const existingNfes = await query(
      'SELECT id, status FROM nfe WHERE id = ? AND tenant_id = ?',
      [id, req.user.tenant_id]
    );

    if (existingNfes.length === 0) {
      return res.status(404).json({
        error: 'NF-e não encontrada'
      });
    }

    const nfe = existingNfes[0];

    // Só permitir deletar NF-e pendentes
    if (nfe.status !== 'pendente') {
      return res.status(400).json({
        error: 'Só é possível deletar NF-e pendentes'
      });
    }

    // Deletar itens da NF-e
    await query('DELETE FROM nfe_itens WHERE nfe_id = ?', [id]);

    // Deletar NF-e
    await query('DELETE FROM nfe WHERE id = ? AND tenant_id = ?', [id, req.user.tenant_id]);

    res.json({
      message: 'NF-e deletada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao deletar NF-e:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Chave em tenant_configuracoes para o último número de NF-e usado (sequência que nunca reutiliza)
const NFE_ULTIMO_NUMERO_KEY = 'nfe_ultimo_numero';

/**
 * Gera o próximo número de NF-e dentro de uma transação, usando sequência que nunca reutiliza.
 * Evita duplicidade na SEFAZ quando NF-e são excluídas (número já usado na SEFAZ não é reutilizado).
 * @param {import('mysql2/promise').PoolConnection} conn - Conexão da transação (com lock)
 * @param {number} tenantId - ID do tenant
 * @returns {Promise<string>} - Número formatado (9 dígitos)
 */
async function gerarNumeroNfeComTransacao(conn, tenantId) {
  // Garantir que existe linha de sequência (valor = maior entre 0 e MAX(numero) atual)
  await conn.execute(
    `INSERT INTO tenant_configuracoes (tenant_id, chave, valor)
     SELECT ?, ?, COALESCE(MAX(CAST(n.numero AS UNSIGNED)), 0)
     FROM nfe n WHERE n.tenant_id = ?
     ON DUPLICATE KEY UPDATE valor = valor`,
    [tenantId, NFE_ULTIMO_NUMERO_KEY, tenantId]
  );
  // Bloquear a linha e obter próximo número
  const [rows] = await conn.execute(
    `SELECT valor FROM tenant_configuracoes
     WHERE tenant_id = ? AND chave = ? FOR UPDATE`,
    [tenantId, NFE_ULTIMO_NUMERO_KEY]
  );
  const ultimo = parseInt(rows[0]?.valor || '0', 10);
  const proximo = ultimo + 1;
  await conn.execute(
    `UPDATE tenant_configuracoes SET valor = ? WHERE tenant_id = ? AND chave = ?`,
    [String(proximo), tenantId, NFE_ULTIMO_NUMERO_KEY]
  );
  return proximo.toString().padStart(9, '0');
}

// ==========================================
// ROTAS DE INTEGRAÇÃO COM FOCUS NFE
// ==========================================

// Obter configurações da Focus NFe
router.get('/config/focus-nfe', async (req, res) => {
  try {
    const config = await getFocusNfeConfig(req.user.tenant_id);
    
    // Verificar se o Token Principal está configurado no sistema (variável de ambiente)
    config.token_principal_configurado = isTokenPrincipalConfigurado();
    
    // Criar versões mascaradas dos tokens (mantido para compatibilidade)
    // Token de Homologação
    if (config.token_homologacao) {
      config.token_homologacao_masked = '****' + config.token_homologacao.slice(-4);
      config.token_homologacao_configurado = true;
    } else if (config.token) {
      // Fallback para token legado em homologação
      config.token_homologacao_masked = '****' + config.token.slice(-4);
      config.token_homologacao_configurado = true;
      // Usar token legado como token de homologação
      config.token_homologacao = config.token;
    } else {
      config.token_homologacao_configurado = false;
    }
    
    // Token de Produção
    if (config.token_producao) {
      config.token_producao_masked = '****' + config.token_producao.slice(-4);
      config.token_producao_configurado = true;
    } else {
      config.token_producao_configurado = false;
    }
    
    // Manter compatibilidade com frontend antigo
    config.token_configurado = config.token_homologacao_configurado || config.token_producao_configurado;
    config.token_masked = config.ambiente === 'producao' 
      ? config.token_producao_masked 
      : config.token_homologacao_masked;
    
    // Remover apenas o token legado (mantém os tokens separados para exibição)
    delete config.token;
    
    res.json({ config });
  } catch (error) {
    console.error('Erro ao buscar configurações Focus NFe:', error);
    res.status(500).json({
      error: 'Erro ao buscar configurações'
    });
  }
});

// Salvar configurações da Focus NFe
router.post('/config/focus-nfe', async (req, res) => {
  try {
    const {
      token, // Token legado (mantido para compatibilidade)
      token_homologacao, // Token para ambiente de homologação
      token_producao, // Token para ambiente de produção
      ambiente,
      serie_padrao,
      natureza_operacao,
      regime_tributario,
      cnpj_emitente,
      inscricao_estadual,
      informacoes_complementares
    } = req.body;
    
    // Construir objeto de configuração apenas com campos fornecidos
    const config = {};
    if (token !== undefined && token !== '') config.token = token;
    if (token_homologacao !== undefined && token_homologacao !== '') config.token_homologacao = token_homologacao;
    if (token_producao !== undefined && token_producao !== '') config.token_producao = token_producao;
    if (ambiente !== undefined) config.ambiente = ambiente;
    if (serie_padrao !== undefined) config.serie_padrao = serie_padrao;
    if (natureza_operacao !== undefined) config.natureza_operacao = natureza_operacao;
    if (regime_tributario !== undefined) config.regime_tributario = regime_tributario;
    if (cnpj_emitente !== undefined) config.cnpj_emitente = cnpj_emitente;
    if (inscricao_estadual !== undefined) config.inscricao_estadual = inscricao_estadual;
    if (informacoes_complementares !== undefined) config.informacoes_complementares = informacoes_complementares;
    
    await saveFocusNfeConfig(req.user.tenant_id, config);
    
    res.json({
      message: 'Configurações salvas com sucesso'
    });
  } catch (error) {
    console.error('Erro ao salvar configurações Focus NFe:', error);
    res.status(500).json({
      error: 'Erro ao salvar configurações'
    });
  }
});

// Validar configurações da Focus NFe
router.get('/config/focus-nfe/validar', async (req, res) => {
  try {
    const resultado = await validarConfiguracoes(req.user.tenant_id);
    res.json(resultado);
  } catch (error) {
    console.error('Erro ao validar configurações Focus NFe:', error);
    res.status(500).json({
      error: 'Erro ao validar configurações'
    });
  }
});

// Emitir NF-e (transmitir para SEFAZ via Focus NFe)
router.post('/:id/emitir', validateId, handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se NF-e existe e pertence ao tenant
    const existingNfes = await query(
      'SELECT id, status FROM nfe WHERE id = ? AND tenant_id = ?',
      [id, req.user.tenant_id]
    );
    
    if (existingNfes.length === 0) {
      return res.status(404).json({
        error: 'NF-e não encontrada'
      });
    }
    
    const nfe = existingNfes[0];
    
    if (nfe.status === 'autorizada') {
      return res.status(400).json({
        error: 'NF-e já está autorizada'
      });
    }
    
    if (nfe.status === 'cancelada') {
      return res.status(400).json({
        error: 'NF-e está cancelada e não pode ser emitida'
      });
    }
    
    // Emitir via Focus NFe
    const resultado = await focusEmitirNfe(req.user.tenant_id, id);
    
    res.json({
      message: resultado.success ? 'NF-e emitida com sucesso!' : 'NF-e enviada para processamento',
      ...resultado
    });
  } catch (error) {
    console.error('Erro ao emitir NF-e:', error);
    res.status(500).json({
      error: error.message || 'Erro ao emitir NF-e'
    });
  }
});

// Consultar status da NF-e na SEFAZ
router.get('/:id/consultar', validateId, handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se NF-e existe e pertence ao tenant
    const existingNfes = await query(
      'SELECT id FROM nfe WHERE id = ? AND tenant_id = ?',
      [id, req.user.tenant_id]
    );
    
    if (existingNfes.length === 0) {
      return res.status(404).json({
        error: 'NF-e não encontrada'
      });
    }
    
    // Consultar via Focus NFe
    const resultado = await focusConsultarNfe(req.user.tenant_id, id);
    
    res.json({
      message: 'Consulta realizada com sucesso',
      ...resultado
    });
  } catch (error) {
    console.error('Erro ao consultar NF-e:', error);
    res.status(500).json({
      error: error.message || 'Erro ao consultar NF-e'
    });
  }
});

// Cancelar NF-e
router.post('/:id/cancelar', validateId, handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    const { justificativa } = req.body;
    
    if (!justificativa || justificativa.length < 15) {
      return res.status(400).json({
        error: 'Justificativa deve ter no mínimo 15 caracteres'
      });
    }
    
    // Verificar se NF-e existe e pertence ao tenant
    const existingNfes = await query(
      'SELECT id, status FROM nfe WHERE id = ? AND tenant_id = ?',
      [id, req.user.tenant_id]
    );
    
    if (existingNfes.length === 0) {
      return res.status(404).json({
        error: 'NF-e não encontrada'
      });
    }
    
    const nfe = existingNfes[0];
    
    if (nfe.status !== 'autorizada') {
      return res.status(400).json({
        error: 'Apenas NF-e autorizadas podem ser canceladas'
      });
    }
    
    // Cancelar via Focus NFe
    const resultado = await focusCancelarNfe(req.user.tenant_id, id, justificativa);
    
    res.json({
      message: resultado.success ? 'NF-e cancelada com sucesso!' : 'Erro ao cancelar NF-e',
      ...resultado
    });
  } catch (error) {
    console.error('Erro ao cancelar NF-e:', error);
    res.status(500).json({
      error: error.message || 'Erro ao cancelar NF-e'
    });
  }
});

// Download do XML da NF-e
router.get('/:id/xml', validateId, handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se NF-e existe e pertence ao tenant
    const existingNfes = await query(
      'SELECT id, status FROM nfe WHERE id = ? AND tenant_id = ?',
      [id, req.user.tenant_id]
    );
    
    if (existingNfes.length === 0) {
      return res.status(404).json({
        error: 'NF-e não encontrada'
      });
    }
    
    // Obter XML via Focus NFe
    const resultado = await obterXmlNfe(req.user.tenant_id, id);
    
    // Garantir que o XML está como string UTF-8
    const xmlContent = typeof resultado.xml === 'string' 
      ? resultado.xml 
      : Buffer.from(resultado.xml).toString('utf-8');
    
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    // Usar formato RFC 5987 para suporte a caracteres especiais no nome do arquivo
    const encodedFilename = encodeURIComponent(resultado.filename);
    const disposition = `attachment; filename="${resultado.filename}"; filename*=UTF-8''${encodedFilename}`;
    res.setHeader('Content-Disposition', disposition);
    // Adicionar header customizado como fallback
    res.setHeader('X-Filename', resultado.filename);
    res.send(xmlContent);
  } catch (error) {
    console.error('Erro ao obter XML da NF-e:', error);
    res.status(500).json({
      error: error.message || 'Erro ao obter XML da NF-e'
    });
  }
});

// Download do DANFE (PDF) da NF-e
router.get('/:id/danfe', validateId, handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se NF-e existe e pertence ao tenant
    const existingNfes = await query(
      'SELECT id, status FROM nfe WHERE id = ? AND tenant_id = ?',
      [id, req.user.tenant_id]
    );
    
    if (existingNfes.length === 0) {
      return res.status(404).json({
        error: 'NF-e não encontrada'
      });
    }
    
    // Obter URL do DANFE via Focus NFe
    const resultado = await obterDanfeNfe(req.user.tenant_id, id);
    
    // Retornar a URL do DANFE para o frontend fazer o download
    res.json({
      url: resultado.url,
      filename: resultado.filename
    });
  } catch (error) {
    console.error('Erro ao obter DANFE da NF-e:', error);
    res.status(500).json({
      error: error.message || 'Erro ao obter DANFE da NF-e'
    });
  }
});

// Reprocessar NF-e com erro (tentar emitir novamente)
router.post('/:id/reprocessar', validateId, handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se NF-e existe e pertence ao tenant
    const existingNfes = await query(
      'SELECT id, status, motivo_status FROM nfe WHERE id = ? AND tenant_id = ?',
      [id, req.user.tenant_id]
    );
    
    if (existingNfes.length === 0) {
      return res.status(404).json({
        error: 'NF-e não encontrada'
      });
    }
    
    const nfe = existingNfes[0];
    
    if (nfe.status !== 'erro' && nfe.status !== 'processando') {
      return res.status(400).json({
        error: 'Apenas NF-e com erro ou em processamento podem ser reprocessadas'
      });
    }
    
    // Não permitir reprocessar quando a SEFAZ rejeitou por duplicidade: a nota pode já estar autorizada
    const motivo = (nfe.motivo_status || '').toLowerCase();
    if (motivo.includes('duplicidade de nf-e') || motivo.includes('duplicidade de nfe')) {
      return res.status(400).json({
        error: 'Esta NF-e não pode ser reprocessada: a SEFAZ indicou duplicidade (a nota pode já estar autorizada). Use "Verificar" para consultar o status na SEFAZ ou verifique na lista de notas autorizadas.'
      });
    }
    
    // Resetar status para pendente e tentar emitir novamente
    await query(
      `UPDATE nfe SET status = 'pendente', motivo_status = NULL, focus_nfe_ref = NULL WHERE id = ? AND tenant_id = ?`,
      [id, req.user.tenant_id]
    );
    
    // Emitir novamente via Focus NFe
    const resultado = await focusEmitirNfe(req.user.tenant_id, id);
    
    res.json({
      message: resultado.success ? 'NF-e reprocessada com sucesso!' : 'NF-e enviada para processamento',
      ...resultado
    });
  } catch (error) {
    console.error('Erro ao reprocessar NF-e:', error);
    res.status(500).json({
      error: error.message || 'Erro ao reprocessar NF-e'
    });
  }
});

export default router;
