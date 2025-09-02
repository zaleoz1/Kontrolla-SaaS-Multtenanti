import express from 'express';
import { query } from '../database/connection.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Aplicar autenticação em todas as rotas
router.use(authenticateToken);

// Métricas gerais do dashboard
router.get('/metricas', async (req, res) => {
  try {
    const { periodo = 'hoje' } = req.query;
    
    let whereClause = 'WHERE tenant_id = ?';
    let params = [req.user.tenant_id];

    // Adicionar filtro de período para vendas
    switch (periodo) {
      case 'hoje':
        whereClause += ' AND DATE(data_venda) = CURDATE()';
        break;
      case 'semana':
        whereClause += ' AND data_venda >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
        break;
      case 'mes':
        whereClause += ' AND data_venda >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)';
        break;
      case 'ano':
        whereClause += ' AND data_venda >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR)';
        break;
    }

    // Vendas do período
    const vendasStats = await query(
      `SELECT 
        COUNT(*) as total_vendas,
        COALESCE(SUM(CASE WHEN status = 'pago' THEN total ELSE 0 END), 0) as receita_total,
        COALESCE(AVG(CASE WHEN status = 'pago' THEN total ELSE NULL END), 0) as ticket_medio
      FROM vendas 
      ${whereClause}`,
      params
    );

    // Total de clientes
    const clientesStats = await query(
      `SELECT 
        COUNT(*) as total_clientes,
        COUNT(CASE WHEN status = 'ativo' THEN 1 END) as clientes_ativos,
        COUNT(CASE WHEN vip = 1 THEN 1 END) as clientes_vip
      FROM clientes 
      WHERE tenant_id = ?`,
      [req.user.tenant_id]
    );

    // Total de produtos
    const produtosStats = await query(
      `SELECT 
        COUNT(*) as total_produtos,
        COUNT(CASE WHEN status = 'ativo' THEN 1 END) as produtos_ativos,
        COUNT(CASE WHEN estoque <= estoque_minimo THEN 1 END) as estoque_baixo,
        COUNT(CASE WHEN estoque = 0 THEN 1 END) as sem_estoque
      FROM produtos 
      WHERE tenant_id = ?`,
      [req.user.tenant_id]
    );

    // Comparação com período anterior
    let comparacaoVendas = null;
    if (periodo !== 'hoje') {
      let whereClauseAnterior = 'WHERE tenant_id = ?';
      let paramsAnterior = [req.user.tenant_id];

      switch (periodo) {
        case 'semana':
          whereClauseAnterior += ' AND data_venda >= DATE_SUB(CURDATE(), INTERVAL 14 DAY) AND data_venda < DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
          break;
        case 'mes':
          whereClauseAnterior += ' AND data_venda >= DATE_SUB(CURDATE(), INTERVAL 2 MONTH) AND data_venda < DATE_SUB(CURDATE(), INTERVAL 1 MONTH)';
          break;
        case 'ano':
          whereClauseAnterior += ' AND data_venda >= DATE_SUB(CURDATE(), INTERVAL 2 YEAR) AND data_venda < DATE_SUB(CURDATE(), INTERVAL 1 YEAR)';
          break;
      }

      const vendasAnteriores = await query(
        `SELECT 
          COUNT(*) as total_vendas_anterior,
          COALESCE(SUM(CASE WHEN status = 'pago' THEN total ELSE 0 END), 0) as receita_anterior
        FROM vendas 
        ${whereClauseAnterior}`,
        paramsAnterior
      );

      const atual = vendasStats[0];
      const anterior = vendasAnteriores[0];

      comparacaoVendas = {
        vendas: {
          atual: atual.total_vendas,
          anterior: anterior.total_vendas_anterior,
          variacao: anterior.total_vendas_anterior > 0 ? 
            ((atual.total_vendas - anterior.total_vendas_anterior) / anterior.total_vendas_anterior * 100) : 0
        },
        receita: {
          atual: atual.receita_total,
          anterior: anterior.receita_anterior,
          variacao: anterior.receita_anterior > 0 ? 
            ((atual.receita_total - anterior.receita_anterior) / anterior.receita_anterior * 100) : 0
        }
      };
    }

    res.json({
      metricas: {
        vendas: vendasStats[0],
        clientes: clientesStats[0],
        produtos: produtosStats[0],
        comparacao: comparacaoVendas
      },
      periodo
    });
  } catch (error) {
    console.error('Erro ao buscar métricas do dashboard:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Vendas recentes
router.get('/vendas-recentes', async (req, res) => {
  try {
    const { limit = 5 } = req.query;

    const vendas = await query(
      `SELECT v.id, v.numero_venda, v.data_venda, v.total, v.status, v.forma_pagamento,
              c.nome as cliente_nome, u.nome as vendedor_nome
       FROM vendas v 
       LEFT JOIN clientes c ON v.cliente_id = c.id 
       LEFT JOIN usuarios u ON v.usuario_id = u.id
       WHERE v.tenant_id = ? 
       ORDER BY v.data_venda DESC 
       LIMIT ?`,
      [req.user.tenant_id, parseInt(limit)]
    );

    res.json({
      vendas
    });
  } catch (error) {
    console.error('Erro ao buscar vendas recentes:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Produtos com estoque baixo
router.get('/estoque-baixo', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const produtos = await query(
      `SELECT p.id, p.nome, p.estoque, p.estoque_minimo, p.preco, c.nome as categoria_nome
       FROM produtos p 
       LEFT JOIN categorias c ON p.categoria_id = c.id 
       WHERE p.tenant_id = ? AND p.estoque <= p.estoque_minimo AND p.status = 'ativo'
       ORDER BY p.estoque ASC 
       LIMIT ?`,
      [req.user.tenant_id, parseInt(limit)]
    );

    res.json({
      produtos
    });
  } catch (error) {
    console.error('Erro ao buscar produtos com estoque baixo:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Gráfico de vendas por período
router.get('/grafico-vendas', async (req, res) => {
  try {
    const { tipo = 'diario', dias = 30 } = req.query;

    let groupBy = '';
    let dateFormat = '';

    switch (tipo) {
      case 'diario':
        groupBy = 'DATE(data_venda)';
        dateFormat = '%Y-%m-%d';
        break;
      case 'semanal':
        groupBy = 'YEARWEEK(data_venda)';
        dateFormat = '%Y-%u';
        break;
      case 'mensal':
        groupBy = 'DATE_FORMAT(data_venda, "%Y-%m")';
        dateFormat = '%Y-%m';
        break;
      default:
        groupBy = 'DATE(data_venda)';
        dateFormat = '%Y-%m-%d';
    }

    const vendas = await query(
      `SELECT 
        ${groupBy} as periodo,
        COUNT(*) as total_vendas,
        COALESCE(SUM(CASE WHEN status = 'pago' THEN total ELSE 0 END), 0) as receita_total
       FROM vendas 
       WHERE tenant_id = ? AND data_venda >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       GROUP BY ${groupBy}
       ORDER BY periodo ASC`,
      [req.user.tenant_id, parseInt(dias)]
    );

    res.json({
      vendas,
      tipo,
      dias: parseInt(dias)
    });
  } catch (error) {
    console.error('Erro ao buscar dados do gráfico de vendas:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Top produtos mais vendidos
router.get('/top-produtos', async (req, res) => {
  try {
    const { limit = 10, periodo = 30 } = req.query;

    const produtos = await query(
      `SELECT 
        p.id, p.nome, p.preco, c.nome as categoria_nome,
        SUM(vi.quantidade) as total_vendido,
        COUNT(DISTINCT vi.venda_id) as total_vendas,
        SUM(vi.preco_total) as receita_total
       FROM venda_itens vi
       JOIN produtos p ON vi.produto_id = p.id
       LEFT JOIN categorias c ON p.categoria_id = c.id
       JOIN vendas v ON vi.venda_id = v.id
       WHERE v.tenant_id = ? AND v.status = 'pago' 
         AND v.data_venda >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       GROUP BY p.id, p.nome, p.preco, c.nome
       ORDER BY total_vendido DESC
       LIMIT ?`,
      [req.user.tenant_id, parseInt(periodo), parseInt(limit)]
    );

    res.json({
      produtos,
      periodo: parseInt(periodo)
    });
  } catch (error) {
    console.error('Erro ao buscar top produtos:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Resumo financeiro
router.get('/resumo-financeiro', async (req, res) => {
  try {
    const { periodo = 30 } = req.query;

    // Transações do período
    const transacoes = await query(
      `SELECT 
        COUNT(*) as total_transacoes,
        COALESCE(SUM(CASE WHEN tipo = 'entrada' AND status = 'concluida' THEN valor ELSE 0 END), 0) as entradas,
        COALESCE(SUM(CASE WHEN tipo = 'saida' AND status = 'concluida' THEN valor ELSE 0 END), 0) as saidas
       FROM transacoes 
       WHERE tenant_id = ? AND data_transacao >= DATE_SUB(CURDATE(), INTERVAL ? DAY)`,
      [req.user.tenant_id, parseInt(periodo)]
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

    const saldo = transacoes[0].entradas - transacoes[0].saidas;

    res.json({
      resumo: {
        transacoes: transacoes[0],
        contas_receber: contasReceber[0],
        contas_pagar: contasPagar[0],
        saldo
      },
      periodo: parseInt(periodo)
    });
  } catch (error) {
    console.error('Erro ao buscar resumo financeiro:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

export default router;
