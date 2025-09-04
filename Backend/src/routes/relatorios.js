import express from 'express';
import { query } from '../database/connection.js';
import { authenticateToken } from '../middleware/auth.js';
import { validatePagination, handleValidationErrors } from '../middleware/validation.js';

const router = express.Router();

// Aplicar autenticação em todas as rotas
router.use(authenticateToken);

// Relatório de vendas por período
router.get('/vendas-periodo', validatePagination, handleValidationErrors, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      data_inicio, 
      data_fim, 
      agrupamento = 'diario' 
    } = req.query;

    if (!data_inicio || !data_fim) {
      return res.status(400).json({
        error: 'Data de início e fim são obrigatórias'
      });
    }

    const offset = (page - 1) * limit;

    let groupBy = '';
    let dateFormat = '';

    switch (agrupamento) {
      case 'diario':
        groupBy = 'DATE(v.data_venda)';
        dateFormat = '%Y-%m-%d';
        break;
      case 'semanal':
        groupBy = 'YEARWEEK(v.data_venda)';
        dateFormat = '%Y-%u';
        break;
      case 'mensal':
        groupBy = 'DATE_FORMAT(v.data_venda, "%Y-%m")';
        dateFormat = '%Y-%m';
        break;
      default:
        groupBy = 'DATE(v.data_venda)';
        dateFormat = '%Y-%m-%d';
    }

    // Buscar dados agrupados
    const vendas = await query(
      `SELECT 
        ${groupBy} as periodo,
        COUNT(*) as total_vendas,
        COUNT(CASE WHEN v.status = 'pago' THEN 1 END) as vendas_pagas,
        COUNT(CASE WHEN v.status = 'pendente' THEN 1 END) as vendas_pendentes,
        COALESCE(SUM(CASE WHEN v.status = 'pago' THEN v.total ELSE 0 END), 0) as receita_total,
        COALESCE(AVG(CASE WHEN v.status = 'pago' THEN v.total ELSE NULL END), 0) as ticket_medio
       FROM vendas v 
       WHERE v.tenant_id = ? AND DATE(v.data_venda) BETWEEN ? AND ?
       GROUP BY ${groupBy}
       ORDER BY periodo DESC 
       LIMIT ? OFFSET ?`,
      [req.user.tenant_id, data_inicio, data_fim, parseInt(limit), parseInt(offset)]
    );

    // Total geral
    const [totalGeral] = await query(
      `SELECT 
        COUNT(*) as total_vendas,
        COALESCE(SUM(CASE WHEN status = 'pago' THEN total ELSE 0 END), 0) as receita_total
       FROM vendas 
       WHERE tenant_id = ? AND DATE(data_venda) BETWEEN ? AND ?`,
      [req.user.tenant_id, data_inicio, data_fim]
    );

    res.json({
      vendas,
      total_geral: totalGeral,
      agrupamento,
      periodo: { data_inicio, data_fim }
    });
  } catch (error) {
    console.error('Erro ao gerar relatório de vendas:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Relatório de produtos mais vendidos
router.get('/produtos-vendidos', validatePagination, handleValidationErrors, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      data_inicio, 
      data_fim, 
      categoria_id = '' 
    } = req.query;

    if (!data_inicio || !data_fim) {
      return res.status(400).json({
        error: 'Data de início e fim são obrigatórias'
      });
    }

    const offset = (page - 1) * limit;

    let whereClause = 'WHERE v.tenant_id = ? AND DATE(v.data_venda) BETWEEN ? AND ? AND v.status = "pago"';
    let params = [req.user.tenant_id, data_inicio, data_fim];

    if (categoria_id) {
      whereClause += ' AND p.categoria_id = ?';
      params.push(categoria_id);
    }

    // Buscar produtos mais vendidos
    const produtos = await query(
      `SELECT 
        p.id, p.nome, p.codigo_barras, p.sku, p.preco,
        c.nome as categoria_nome,
        SUM(vi.quantidade) as total_vendido,
        COUNT(DISTINCT vi.venda_id) as total_vendas,
        SUM(vi.preco_total) as receita_total,
        AVG(vi.preco_unitario) as preco_medio_venda
       FROM venda_itens vi
       JOIN produtos p ON vi.produto_id = p.id
       LEFT JOIN categorias c ON p.categoria_id = c.id
       JOIN vendas v ON vi.venda_id = v.id
       ${whereClause}
       GROUP BY p.id, p.nome, p.codigo_barras, p.sku, p.preco, c.nome
       ORDER BY total_vendido DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    // Total de registros
    const [totalResult] = await query(
      `SELECT COUNT(DISTINCT p.id) as total
       FROM venda_itens vi
       JOIN produtos p ON vi.produto_id = p.id
       JOIN vendas v ON vi.venda_id = v.id
       ${whereClause}`,
      params
    );

    const total = totalResult.total;
    const totalPages = Math.ceil(total / limit);

    res.json({
      produtos,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      periodo: { data_inicio, data_fim },
      categoria_id
    });
  } catch (error) {
    console.error('Erro ao gerar relatório de produtos vendidos:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Relatório de análise de clientes
router.get('/analise-clientes', validatePagination, handleValidationErrors, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      data_inicio, 
      data_fim,
      tipo_analise = 'compras' 
    } = req.query;

    if (!data_inicio || !data_fim) {
      return res.status(400).json({
        error: 'Data de início e fim são obrigatórias'
      });
    }

    const offset = (page - 1) * limit;

    let orderBy = '';
    switch (tipo_analise) {
      case 'compras':
        orderBy = 'total_compras DESC';
        break;
      case 'valor':
        orderBy = 'valor_total DESC';
        break;
      case 'frequencia':
        orderBy = 'total_vendas DESC';
        break;
      default:
        orderBy = 'total_compras DESC';
    }

    // Buscar análise de clientes
    const clientes = await query(
      `SELECT 
        c.id, c.nome, c.email, c.telefone, c.vip,
        COUNT(v.id) as total_vendas,
        COALESCE(SUM(CASE WHEN v.status = 'pago' THEN v.total ELSE 0 END), 0) as valor_total,
        COALESCE(AVG(CASE WHEN v.status = 'pago' THEN v.total ELSE NULL END), 0) as ticket_medio,
        MAX(v.data_venda) as ultima_compra,
        MIN(v.data_venda) as primeira_compra
       FROM clientes c
       LEFT JOIN vendas v ON c.id = v.cliente_id 
         AND DATE(v.data_venda) BETWEEN ? AND ? 
         AND v.status = 'pago'
       WHERE c.tenant_id = ?
       GROUP BY c.id, c.nome, c.email, c.telefone, c.vip
       HAVING total_vendas > 0
       ORDER BY ${orderBy}
       LIMIT ? OFFSET ?`,
      [data_inicio, data_fim, req.user.tenant_id, parseInt(limit), parseInt(offset)]
    );

    // Estatísticas gerais
    const [stats] = await query(
      `SELECT 
        COUNT(DISTINCT c.id) as total_clientes_ativos,
        COUNT(DISTINCT CASE WHEN c.vip = 1 THEN c.id END) as clientes_vip,
        COALESCE(AVG(valor_total), 0) as ticket_medio_geral,
        COALESCE(SUM(valor_total), 0) as receita_total_clientes
       FROM (
         SELECT 
           c.id, c.vip,
           COALESCE(SUM(CASE WHEN v.status = 'pago' THEN v.total ELSE 0 END), 0) as valor_total
         FROM clientes c
         LEFT JOIN vendas v ON c.id = v.cliente_id 
           AND DATE(v.data_venda) BETWEEN ? AND ? 
           AND v.status = 'pago'
         WHERE c.tenant_id = ?
         GROUP BY c.id, c.vip
         HAVING valor_total > 0
       ) as clientes_stats`,
      [data_inicio, data_fim, req.user.tenant_id]
    );

    res.json({
      clientes,
      estatisticas: stats,
      periodo: { data_inicio, data_fim },
      tipo_analise
    });
  } catch (error) {
    console.error('Erro ao gerar relatório de análise de clientes:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Relatório financeiro
router.get('/financeiro', validatePagination, handleValidationErrors, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      data_inicio, 
      data_fim,
      tipo = 'transacoes' 
    } = req.query;

    if (!data_inicio || !data_fim) {
      return res.status(400).json({
        error: 'Data de início e fim são obrigatórias'
      });
    }

    const offset = (page - 1) * limit;

    if (tipo === 'transacoes') {
      // Relatório de transações
      const transacoes = await query(
        `SELECT 
          t.id, t.tipo, t.categoria, t.descricao, t.valor, t.data_transacao,
          t.metodo_pagamento, t.status, c.nome as cliente_nome
         FROM transacoes t
         LEFT JOIN clientes c ON t.cliente_id = c.id
         WHERE t.tenant_id = ? AND DATE(t.data_transacao) BETWEEN ? AND ?
         ORDER BY t.data_transacao DESC
         LIMIT ? OFFSET ?`,
        [req.user.tenant_id, data_inicio, data_fim, parseInt(limit), parseInt(offset)]
      );

      // Resumo das transações
      const [resumo] = await query(
        `SELECT 
          COUNT(*) as total_transacoes,
          COUNT(CASE WHEN tipo = 'entrada' THEN 1 END) as total_entradas,
          COUNT(CASE WHEN tipo = 'saida' THEN 1 END) as total_saidas,
          COALESCE(SUM(CASE WHEN tipo = 'entrada' AND status = 'concluida' THEN valor ELSE 0 END), 0) as valor_entradas,
          COALESCE(SUM(CASE WHEN tipo = 'saida' AND status = 'concluida' THEN valor ELSE 0 END), 0) as valor_saidas
         FROM transacoes 
         WHERE tenant_id = ? AND DATE(data_transacao) BETWEEN ? AND ?`,
        [req.user.tenant_id, data_inicio, data_fim]
      );

      res.json({
        transacoes,
        resumo,
        tipo: 'transacoes',
        periodo: { data_inicio, data_fim }
      });
    } else if (tipo === 'contas') {
      // Relatório de contas a receber/pagar
      const contasReceber = await query(
        `SELECT 
          cr.id, cr.descricao, cr.valor, cr.data_vencimento, cr.data_pagamento,
          cr.status, cr.parcela, c.nome as cliente_nome
         FROM contas_receber cr
         LEFT JOIN clientes c ON cr.cliente_id = c.id
         WHERE cr.tenant_id = ? AND DATE(cr.data_vencimento) BETWEEN ? AND ?
         ORDER BY cr.data_vencimento ASC
         LIMIT ? OFFSET ?`,
        [req.user.tenant_id, data_inicio, data_fim, parseInt(limit), parseInt(offset)]
      );

      const contasPagar = await query(
        `SELECT 
          cp.id, cp.fornecedor, cp.descricao, cp.valor, cp.data_vencimento, 
          cp.data_pagamento, cp.status, cp.categoria
         FROM contas_pagar cp
         WHERE cp.tenant_id = ? AND DATE(cp.data_vencimento) BETWEEN ? AND ?
         ORDER BY cp.data_vencimento ASC
         LIMIT ? OFFSET ?`,
        [req.user.tenant_id, data_inicio, data_fim, parseInt(limit), parseInt(offset)]
      );

      res.json({
        contas_receber: contasReceber,
        contas_pagar: contasPagar,
        tipo: 'contas',
        periodo: { data_inicio, data_fim }
      });
    }
  } catch (error) {
    console.error('Erro ao gerar relatório financeiro:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Relatório de controle de estoque
router.get('/controle-estoque', validatePagination, handleValidationErrors, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      tipo = 'geral',
      categoria_id = '' 
    } = req.query;

    const offset = (page - 1) * limit;

    let whereClause = 'WHERE p.tenant_id = ?';
    let params = [req.user.tenant_id];

    if (categoria_id) {
      whereClause += ' AND p.categoria_id = ?';
      params.push(categoria_id);
    }

    if (tipo === 'baixo') {
      whereClause += ' AND p.estoque <= p.estoque_minimo';
    } else if (tipo === 'zerado') {
      whereClause += ' AND p.estoque = 0';
    }

    // Buscar produtos
    const produtos = await query(
      `SELECT 
        p.id, p.nome, p.codigo_barras, p.sku, p.estoque, p.estoque_minimo,
        p.preco, c.nome as categoria_nome,
        COALESCE(p.estoque * p.preco, 0) as valor_estoque,
        CASE 
          WHEN p.estoque = 0 THEN 'Sem estoque'
          WHEN p.estoque <= p.estoque_minimo THEN 'Estoque baixo'
          ELSE 'Normal'
        END as status_estoque
       FROM produtos p
       LEFT JOIN categorias c ON p.categoria_id = c.id
       ${whereClause}
       ORDER BY p.estoque ASC, p.nome ASC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    // Estatísticas do estoque
    const [stats] = await query(
      `SELECT 
        COUNT(*) as total_produtos,
        COUNT(CASE WHEN estoque = 0 THEN 1 END) as sem_estoque,
        COUNT(CASE WHEN estoque <= estoque_minimo AND estoque > 0 THEN 1 END) as estoque_baixo,
        COUNT(CASE WHEN estoque > estoque_minimo THEN 1 END) as estoque_normal,
        COALESCE(SUM(estoque), 0) as total_unidades,
        COALESCE(SUM(estoque * preco), 0) as valor_total_estoque
       FROM produtos 
       WHERE tenant_id = ?`,
      [req.user.tenant_id]
    );

    res.json({
      produtos,
      estatisticas: stats,
      tipo,
      categoria_id
    });
  } catch (error) {
    console.error('Erro ao gerar relatório de controle de estoque:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Relatório de performance de vendas
router.get('/performance-vendas', validatePagination, handleValidationErrors, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      data_inicio, 
      data_fim,
      agrupamento = 'vendedor' 
    } = req.query;

    if (!data_inicio || !data_fim) {
      return res.status(400).json({
        error: 'Data de início e fim são obrigatórias'
      });
    }

    const offset = (page - 1) * limit;

    let groupBy = '';
    let selectFields = '';

    switch (agrupamento) {
      case 'vendedor':
        groupBy = 'u.id, u.nome';
        selectFields = 'u.id, u.nome as nome_agrupamento';
        break;
      case 'categoria':
        groupBy = 'cat.id, cat.nome';
        selectFields = 'cat.id, cat.nome as nome_agrupamento';
        break;
      case 'cliente':
        groupBy = 'c.id, c.nome';
        selectFields = 'c.id, c.nome as nome_agrupamento';
        break;
      default:
        groupBy = 'u.id, u.nome';
        selectFields = 'u.id, u.nome as nome_agrupamento';
    }

    // Buscar performance
    const performance = await query(
      `SELECT 
        ${selectFields},
        COUNT(v.id) as total_vendas,
        COUNT(CASE WHEN v.status = 'pago' THEN 1 END) as vendas_pagas,
        COALESCE(SUM(CASE WHEN v.status = 'pago' THEN v.total ELSE 0 END), 0) as receita_total,
        COALESCE(AVG(CASE WHEN v.status = 'pago' THEN v.total ELSE NULL END), 0) as ticket_medio
       FROM vendas v
       ${agrupamento === 'vendedor' ? 'JOIN usuarios u ON v.usuario_id = u.id' : ''}
       ${agrupamento === 'categoria' ? 'JOIN venda_itens vi ON v.id = vi.venda_id JOIN produtos p ON vi.produto_id = p.id JOIN categorias cat ON p.categoria_id = cat.id' : ''}
       ${agrupamento === 'cliente' ? 'LEFT JOIN clientes c ON v.cliente_id = c.id' : ''}
       WHERE v.tenant_id = ? AND DATE(v.data_venda) BETWEEN ? AND ?
       GROUP BY ${groupBy}
       ORDER BY receita_total DESC
       LIMIT ? OFFSET ?`,
      [req.user.tenant_id, data_inicio, data_fim, parseInt(limit), parseInt(offset)]
    );

    res.json({
      performance,
      agrupamento,
      periodo: { data_inicio, data_fim }
    });
  } catch (error) {
    console.error('Erro ao gerar relatório de performance:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

export default router;
