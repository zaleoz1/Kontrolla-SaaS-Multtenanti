import express from 'express';
import { query } from '../database/connection.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateTransacao, validateId, validatePagination, validateSearch, handleValidationErrors } from '../middleware/validation.js';

const router = express.Router();

// Aplicar autenticação em todas as rotas
router.use(authenticateToken);

// Listar transações financeiras
router.get('/transacoes', validatePagination, validateSearch, handleValidationErrors, async (req, res) => {
  try {
    const { page = 1, limit = 10, q = '', tipo = '', status = '', data_inicio = '', data_fim = '' } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE t.tenant_id = ?';
    let params = [req.user.tenant_id];

    // Adicionar filtro de busca
    if (q) {
      whereClause += ' AND (t.descricao LIKE ? OR t.categoria LIKE ? OR c.nome LIKE ?)';
      const searchTerm = `%${q}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Adicionar filtro de tipo
    if (tipo) {
      whereClause += ' AND t.tipo = ?';
      params.push(tipo);
    }

    // Adicionar filtro de status
    if (status) {
      whereClause += ' AND t.status = ?';
      params.push(status);
    }

    // Adicionar filtro de data
    if (data_inicio) {
      whereClause += ' AND t.data_transacao >= ?';
      params.push(data_inicio);
    }

    if (data_fim) {
      whereClause += ' AND t.data_transacao <= ?';
      params.push(data_fim);
    }

    // Buscar transações
    const transacoes = await query(
      `SELECT t.*, c.nome as cliente_nome
       FROM transacoes t 
       LEFT JOIN clientes c ON t.cliente_id = c.id 
       ${whereClause} 
       ORDER BY t.data_transacao DESC, t.data_criacao DESC 
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    // Contar total de registros
    const [totalResult] = await query(
      `SELECT COUNT(*) as total FROM transacoes t ${whereClause}`,
      params
    );

    const total = totalResult.total;
    const totalPages = Math.ceil(total / limit);

    res.json({
      transacoes,
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
    console.error('Erro ao listar transações:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Buscar transação por ID
router.get('/transacoes/:id', validateId, handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;

    const transacoes = await query(
      `SELECT t.*, c.nome as cliente_nome
       FROM transacoes t 
       LEFT JOIN clientes c ON t.cliente_id = c.id 
       WHERE t.id = ? AND t.tenant_id = ?`,
      [id, req.user.tenant_id]
    );

    if (transacoes.length === 0) {
      return res.status(404).json({
        error: 'Transação não encontrada'
      });
    }

    res.json({
      transacao: transacoes[0]
    });
  } catch (error) {
    console.error('Erro ao buscar transação:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Criar nova transação
router.post('/transacoes', validateTransacao, async (req, res) => {
  try {
    const {
      tipo,
      categoria,
      descricao,
      valor,
      data_transacao,
      metodo_pagamento,
      conta,
      fornecedor,
      cliente_id,
      observacoes,
      anexos = [],
      status = 'pendente'
    } = req.body;

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

    const result = await query(
      `INSERT INTO transacoes (
        tenant_id, tipo, categoria, descricao, valor, data_transacao,
        metodo_pagamento, conta, fornecedor, cliente_id, observacoes, anexos, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.tenant_id, tipo, categoria, descricao, valor, data_transacao,
        metodo_pagamento, conta, fornecedor, cliente_id, observacoes,
        JSON.stringify(anexos), status
      ]
    );

    // Buscar transação criada
    const [transacao] = await query(
      `SELECT t.*, c.nome as cliente_nome
       FROM transacoes t 
       LEFT JOIN clientes c ON t.cliente_id = c.id 
       WHERE t.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      message: 'Transação criada com sucesso',
      transacao
    });
  } catch (error) {
    console.error('Erro ao criar transação:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Atualizar transação
router.put('/transacoes/:id', validateId, validateTransacao, handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      tipo,
      categoria,
      descricao,
      valor,
      data_transacao,
      metodo_pagamento,
      conta,
      fornecedor,
      cliente_id,
      observacoes,
      anexos,
      status
    } = req.body;

    // Verificar se transação existe
    const existingTransacoes = await query(
      'SELECT id FROM transacoes WHERE id = ? AND tenant_id = ?',
      [id, req.user.tenant_id]
    );

    if (existingTransacoes.length === 0) {
      return res.status(404).json({
        error: 'Transação não encontrada'
      });
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

    await query(
      `UPDATE transacoes SET 
        tipo = ?, categoria = ?, descricao = ?, valor = ?, data_transacao = ?,
        metodo_pagamento = ?, conta = ?, fornecedor = ?, cliente_id = ?,
        observacoes = ?, anexos = ?, status = ?
      WHERE id = ? AND tenant_id = ?`,
      [
        tipo, categoria, descricao, valor, data_transacao, metodo_pagamento,
        conta, fornecedor, cliente_id, observacoes, JSON.stringify(anexos),
        status, id, req.user.tenant_id
      ]
    );

    // Buscar transação atualizada
    const [transacao] = await query(
      `SELECT t.*, c.nome as cliente_nome
       FROM transacoes t 
       LEFT JOIN clientes c ON t.cliente_id = c.id 
       WHERE t.id = ?`,
      [id]
    );

    res.json({
      message: 'Transação atualizada com sucesso',
      transacao
    });
  } catch (error) {
    console.error('Erro ao atualizar transação:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Deletar transação
router.delete('/transacoes/:id', validateId, handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se transação existe
    const existingTransacoes = await query(
      'SELECT id FROM transacoes WHERE id = ? AND tenant_id = ?',
      [id, req.user.tenant_id]
    );

    if (existingTransacoes.length === 0) {
      return res.status(404).json({
        error: 'Transação não encontrada'
      });
    }

    await query(
      'DELETE FROM transacoes WHERE id = ? AND tenant_id = ?',
      [id, req.user.tenant_id]
    );

    res.json({
      message: 'Transação deletada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao deletar transação:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Listar contas a receber
router.get('/contas-receber', validatePagination, handleValidationErrors, async (req, res) => {
  try {
    const { page = 1, limit = 10, status = '', data_inicio = '', data_fim = '' } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE cr.tenant_id = ?';
    let params = [req.user.tenant_id];

    // Adicionar filtro de status
    if (status) {
      whereClause += ' AND cr.status = ?';
      params.push(status);
    }

    // Adicionar filtro de data
    if (data_inicio) {
      whereClause += ' AND cr.data_vencimento >= ?';
      params.push(data_inicio);
    }

    if (data_fim) {
      whereClause += ' AND cr.data_vencimento <= ?';
      params.push(data_fim);
    }

    // Buscar contas a receber
    const contas = await query(
      `SELECT cr.*, c.nome as cliente_nome, c.email as cliente_email
       FROM contas_receber cr 
       LEFT JOIN clientes c ON cr.cliente_id = c.id 
       ${whereClause} 
       ORDER BY cr.data_vencimento ASC 
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    // Contar total de registros
    const [totalResult] = await query(
      `SELECT COUNT(*) as total FROM contas_receber cr ${whereClause}`,
      params
    );

    const total = totalResult.total;
    const totalPages = Math.ceil(total / limit);

    res.json({
      contas,
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
    console.error('Erro ao listar contas a receber:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Listar contas a pagar
router.get('/contas-pagar', validatePagination, handleValidationErrors, async (req, res) => {
  try {
    const { page = 1, limit = 10, status = '', data_inicio = '', data_fim = '' } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE cp.tenant_id = ?';
    let params = [req.user.tenant_id];

    // Adicionar filtro de status
    if (status) {
      whereClause += ' AND cp.status = ?';
      params.push(status);
    }

    // Adicionar filtro de data
    if (data_inicio) {
      whereClause += ' AND cp.data_vencimento >= ?';
      params.push(data_inicio);
    }

    if (data_fim) {
      whereClause += ' AND cp.data_vencimento <= ?';
      params.push(data_fim);
    }

    // Buscar contas a pagar
    const contas = await query(
      `SELECT * FROM contas_pagar cp 
       ${whereClause} 
       ORDER BY cp.data_vencimento ASC 
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    // Contar total de registros
    const [totalResult] = await query(
      `SELECT COUNT(*) as total FROM contas_pagar cp ${whereClause}`,
      params
    );

    const total = totalResult.total;
    const totalPages = Math.ceil(total / limit);

    res.json({
      contas,
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
    console.error('Erro ao listar contas a pagar:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Estatísticas financeiras
router.get('/stats/overview', async (req, res) => {
  try {
    const { periodo = 'mes' } = req.query;
    
    let whereClause = 'WHERE tenant_id = ?';
    let params = [req.user.tenant_id];

    // Adicionar filtro de período
    switch (periodo) {
      case 'hoje':
        whereClause += ' AND DATE(data_transacao) = CURDATE()';
        break;
      case 'semana':
        whereClause += ' AND data_transacao >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
        break;
      case 'mes':
        whereClause += ' AND data_transacao >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)';
        break;
      case 'ano':
        whereClause += ' AND data_transacao >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR)';
        break;
    }

    // Estatísticas de transações
    const transacoesStats = await query(
      `SELECT 
        COUNT(*) as total_transacoes,
        COUNT(CASE WHEN tipo = 'entrada' THEN 1 END) as entradas,
        COUNT(CASE WHEN tipo = 'saida' THEN 1 END) as saidas,
        COALESCE(SUM(CASE WHEN tipo = 'entrada' AND status = 'concluida' THEN valor ELSE 0 END), 0) as total_entradas,
        COALESCE(SUM(CASE WHEN tipo = 'saida' AND status = 'concluida' THEN valor ELSE 0 END), 0) as total_saidas
      FROM transacoes 
      ${whereClause}`,
      params
    );

    // Contas a receber
    const contasReceber = await query(
      `SELECT 
        COUNT(*) as total_contas,
        COALESCE(SUM(CASE WHEN status = 'pendente' THEN valor ELSE 0 END), 0) as valor_pendente,
        COALESCE(SUM(CASE WHEN status = 'vencido' THEN valor ELSE 0 END), 0) as valor_vencido
      FROM contas_receber 
      WHERE tenant_id = ?`,
      [req.user.tenant_id]
    );

    // Contas a pagar
    const contasPagar = await query(
      `SELECT 
        COUNT(*) as total_contas,
        COALESCE(SUM(CASE WHEN status = 'pendente' THEN valor ELSE 0 END), 0) as valor_pendente,
        COALESCE(SUM(CASE WHEN status = 'vencido' THEN valor ELSE 0 END), 0) as valor_vencido
      FROM contas_pagar 
      WHERE tenant_id = ?`,
      [req.user.tenant_id]
    );

    const fluxoCaixa = transacoesStats[0].total_entradas - transacoesStats[0].total_saidas;

    res.json({
      stats: {
        ...transacoesStats[0],
        fluxo_caixa: fluxoCaixa,
        contas_receber: contasReceber[0],
        contas_pagar: contasPagar[0]
      },
      periodo
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas financeiras:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

export default router;
