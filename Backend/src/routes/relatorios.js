import express from 'express';
import { query } from '../database/connection.js';
import { authenticateToken } from '../middleware/auth.js';
import { validatePagination, handleValidationErrors } from '../middleware/validation.js';

const router = express.Router();

// Aplicar autenticação em todas as rotas
router.use(authenticateToken);

// Relatório de vendas por período
router.get('/vendas-periodo', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      data_inicio, 
      data_fim, 
      agrupamento = 'diario' 
    } = req.query;


    console.log('🔍 Parâmetros recebidos:', { page, limit, data_inicio, data_fim, agrupamento });
    console.log('🔍 req.user.tenant_id:', req.user?.tenant_id);

    if (!data_inicio || !data_fim) {
      return res.status(400).json({
        error: 'Data de início e fim são obrigatórias'
      });
    }

    const offset = (page - 1) * limit;

    // Buscar dados agrupados - garantir que todos os parâmetros sejam válidos
    const tenantId = parseInt(req.user.tenant_id) || 1;
    const limitNum = parseInt(limit) || 50;
    const offsetNum = parseInt(offset) || 0;
    
    const queryParams = [
      tenantId, 
      data_inicio, 
      data_fim
    ];
    console.log('🔍 Query params:', queryParams);
    console.log('🔍 Query params types:', queryParams.map(p => typeof p));
    console.log('🔍 Query params values:', queryParams.map(p => p === null ? 'NULL' : p === undefined ? 'UNDEFINED' : p));
    
    // Consulta com LIMIT e OFFSET como valores literais
    // Usar valores reais dos pagamentos da tabela venda_pagamentos
    let querySql = `SELECT 
      DATE(v.data_venda) as periodo,
      COUNT(*) as total_vendas,
      COUNT(CASE WHEN v.status = 'pago' THEN 1 END) as vendas_pagas,
      COUNT(CASE WHEN v.status = 'pendente' THEN 1 END) as vendas_pendentes,
      COALESCE(SUM(CASE WHEN v.status = 'pago' THEN COALESCE(
        (SELECT SUM(vp.valor - COALESCE(vp.troco, 0)) 
         FROM venda_pagamentos vp 
         WHERE vp.venda_id = v.id), v.total
      ) ELSE 0 END), 0) as receita_total,
      COALESCE(AVG(CASE WHEN v.status = 'pago' THEN COALESCE(
        (SELECT SUM(vp.valor - COALESCE(vp.troco, 0)) 
         FROM venda_pagamentos vp 
         WHERE vp.venda_id = v.id), v.total
      ) ELSE NULL END), 0) as ticket_medio
     FROM vendas v 
     WHERE v.tenant_id = ? AND DATE(v.data_venda) BETWEEN ? AND ?
     GROUP BY DATE(v.data_venda)
     ORDER BY periodo DESC 
     LIMIT ${limitNum} OFFSET ${offsetNum}`;
    
    console.log('🔍 Query SQL:', querySql);
    
    
    const vendas = await query(querySql, queryParams);

    // Total geral - usar valores reais dos pagamentos
    const [totalGeral] = await query(
      `SELECT 
        COUNT(*) as total_vendas,
        COALESCE(SUM(CASE WHEN status = 'pago' THEN COALESCE(
          (SELECT SUM(vp.valor - COALESCE(vp.troco, 0)) 
           FROM venda_pagamentos vp 
           WHERE vp.venda_id = vendas.id), total
        ) ELSE 0 END), 0) as receita_total,
        COALESCE(AVG(CASE WHEN status = 'pago' THEN COALESCE(
          (SELECT SUM(vp.valor - COALESCE(vp.troco, 0)) 
           FROM venda_pagamentos vp 
           WHERE vp.venda_id = vendas.id), total
        ) ELSE NULL END), 0) as ticket_medio
       FROM vendas 
       WHERE tenant_id = ? AND DATE(data_venda) BETWEEN ? AND ?`,
      [tenantId, data_inicio, data_fim]
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
router.get('/produtos-vendidos', async (req, res) => {
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

    if (categoria_id && categoria_id !== '') {
      whereClause += ' AND p.categoria_id = ?';
      params.push(categoria_id);
    }

    // Buscar produtos mais vendidos
    const limitNum = parseInt(limit) || 50;
    const offsetNum = parseInt(offset) || 0;
    
    const produtos = await query(
      `SELECT 
        p.id, p.nome, p.codigo_barras, p.sku, p.preco,
        c.nome as categoria_nome,
        SUM(vi.quantidade) as total_vendido,
        COUNT(DISTINCT vi.venda_id) as total_vendas,
        SUM(CASE WHEN v.status = 'pago' THEN 
          vi.preco_total * COALESCE(
            (SELECT SUM(vp.valor - COALESCE(vp.troco, 0)) 
             FROM venda_pagamentos vp 
             WHERE vp.venda_id = v.id) / v.total, 1
          ) 
        ELSE 0 END) as receita_total,
        AVG(vi.preco_unitario) as preco_medio_venda
       FROM venda_itens vi
       JOIN produtos p ON vi.produto_id = p.id
       LEFT JOIN categorias c ON p.categoria_id = c.id
       JOIN vendas v ON vi.venda_id = v.id
       ${whereClause}
       GROUP BY p.id, p.nome, p.codigo_barras, p.sku, p.preco, c.nome
       ORDER BY total_vendido DESC
       LIMIT ${limitNum} OFFSET ${offsetNum}`,
      params
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
router.get('/analise-clientes', async (req, res) => {
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
        orderBy = 'total_vendas DESC';
        break;
      case 'valor':
        orderBy = 'valor_total DESC';
        break;
      case 'frequencia':
        orderBy = 'total_vendas DESC';
        break;
      default:
        orderBy = 'total_vendas DESC';
    }

    // Buscar análise de clientes com dados reais de compras
    const limitNum = parseInt(limit) || 50;
    const offsetNum = parseInt(offset) || 0;
    
    const clientes = await query(
      `SELECT 
        c.id, c.nome, c.email, c.telefone, c.vip,
        COALESCE(COUNT(v.id), 0) as total_vendas,
        COALESCE(SUM(CASE WHEN v.status = 'pago' THEN COALESCE(
          (SELECT SUM(vp.valor - COALESCE(vp.troco, 0)) 
           FROM venda_pagamentos vp 
           WHERE vp.venda_id = v.id), v.total
        ) ELSE 0 END), 0) as valor_total,
        COALESCE(AVG(CASE WHEN v.status = 'pago' THEN COALESCE(
          (SELECT SUM(vp.valor - COALESCE(vp.troco, 0)) 
           FROM venda_pagamentos vp 
           WHERE vp.venda_id = v.id), v.total
        ) ELSE NULL END), 0) as ticket_medio,
        MAX(CASE WHEN v.status = 'pago' THEN v.data_venda ELSE NULL END) as ultima_compra,
        MIN(CASE WHEN v.status = 'pago' THEN v.data_venda ELSE NULL END) as primeira_compra
       FROM clientes c
       LEFT JOIN vendas v ON c.id = v.cliente_id 
         AND v.tenant_id = c.tenant_id
         AND DATE(v.data_venda) BETWEEN ? AND ?
       WHERE c.tenant_id = ?
       GROUP BY c.id, c.nome, c.email, c.telefone, c.vip
       ORDER BY ${orderBy}
       LIMIT ${limitNum} OFFSET ${offsetNum}`,
      [data_inicio, data_fim, req.user.tenant_id]
    );

    // Estatísticas gerais com dados reais
    const [stats] = await query(
      `SELECT 
        COUNT(DISTINCT c.id) as total_clientes_ativos,
        COUNT(DISTINCT CASE WHEN c.vip = 1 THEN c.id END) as clientes_vip,
        COALESCE(AVG(CASE WHEN v.status = 'pago' THEN COALESCE(
          (SELECT SUM(vp.valor - COALESCE(vp.troco, 0)) 
           FROM venda_pagamentos vp 
           WHERE vp.venda_id = v.id), v.total
        ) ELSE NULL END), 0) as ticket_medio_geral,
        COALESCE(SUM(CASE WHEN v.status = 'pago' THEN COALESCE(
          (SELECT SUM(vp.valor - COALESCE(vp.troco, 0)) 
           FROM venda_pagamentos vp 
           WHERE vp.venda_id = v.id), v.total
        ) ELSE 0 END), 0) as receita_total_clientes
       FROM clientes c
       LEFT JOIN vendas v ON c.id = v.cliente_id 
         AND v.tenant_id = c.tenant_id
         AND DATE(v.data_venda) BETWEEN ? AND ?
       WHERE c.tenant_id = ?`,
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

// Relatório detalhado de compras por cliente
router.get('/cliente-compras/:clienteId', async (req, res) => {
  try {
    const { clienteId } = req.params;
    const { data_inicio, data_fim } = req.query;

    if (!data_inicio || !data_fim) {
      return res.status(400).json({
        error: 'Data de início e fim são obrigatórias'
      });
    }

    // Buscar dados do cliente
    const [cliente] = await query(
      `SELECT id, nome, email, telefone, vip FROM clientes 
       WHERE id = ? AND tenant_id = ?`,
      [clienteId, req.user.tenant_id]
    );

    if (!cliente) {
      return res.status(404).json({
        error: 'Cliente não encontrado'
      });
    }

    // Buscar vendas do cliente no período
    const vendas = await query(
      `SELECT 
        v.id, v.numero_venda, v.data_venda, v.status, v.total, v.forma_pagamento,
        u.nome as vendedor_nome
       FROM vendas v
       LEFT JOIN usuarios u ON v.usuario_id = u.id
       WHERE v.cliente_id = ? AND v.tenant_id = ? 
         AND DATE(v.data_venda) BETWEEN ? AND ?
       ORDER BY v.data_venda DESC`,
      [clienteId, req.user.tenant_id, data_inicio, data_fim]
    );

    // Buscar produtos mais comprados pelo cliente
    const produtosComprados = await query(
      `SELECT 
        p.id, p.nome, p.categoria_id, cat.nome as categoria_nome,
        SUM(vi.quantidade) as total_quantidade,
        SUM(CASE WHEN v.status = 'pago' THEN 
          vi.preco_total * COALESCE(
            (SELECT SUM(vp.valor - COALESCE(vp.troco, 0)) 
             FROM venda_pagamentos vp 
             WHERE vp.venda_id = v.id) / v.total, 1
          ) 
        ELSE 0 END) as total_gasto,
        AVG(vi.preco_unitario) as preco_medio,
        COUNT(DISTINCT v.id) as vezes_comprado
       FROM vendas v
       JOIN venda_itens vi ON v.id = vi.venda_id
       JOIN produtos p ON vi.produto_id = p.id
       LEFT JOIN categorias cat ON p.categoria_id = cat.id
       WHERE v.cliente_id = ? AND v.tenant_id = ? 
         AND v.status = 'pago'
         AND DATE(v.data_venda) BETWEEN ? AND ?
       GROUP BY p.id, p.nome, p.categoria_id, cat.nome
       ORDER BY total_quantidade DESC, total_gasto DESC
       LIMIT 20`,
      [clienteId, req.user.tenant_id, data_inicio, data_fim]
    );

    // Estatísticas do cliente
    const [stats] = await query(
      `SELECT 
        COUNT(v.id) as total_vendas,
        COALESCE(SUM(CASE WHEN v.status = 'pago' THEN COALESCE(
          (SELECT SUM(vp.valor - COALESCE(vp.troco, 0)) 
           FROM venda_pagamentos vp 
           WHERE vp.venda_id = v.id), v.total
        ) ELSE 0 END), 0) as valor_total,
        COALESCE(AVG(CASE WHEN v.status = 'pago' THEN COALESCE(
          (SELECT SUM(vp.valor - COALESCE(vp.troco, 0)) 
           FROM venda_pagamentos vp 
           WHERE vp.venda_id = v.id), v.total
        ) ELSE NULL END), 0) as ticket_medio,
        MAX(CASE WHEN v.status = 'pago' THEN v.data_venda ELSE NULL END) as ultima_compra,
        MIN(CASE WHEN v.status = 'pago' THEN v.data_venda ELSE NULL END) as primeira_compra
       FROM vendas v
       WHERE v.cliente_id = ? AND v.tenant_id = ? 
         AND DATE(v.data_venda) BETWEEN ? AND ?`,
      [clienteId, req.user.tenant_id, data_inicio, data_fim]
    );

    res.json({
      cliente,
      vendas,
      produtos_comprados: produtosComprados,
      estatisticas: stats,
      periodo: { data_inicio, data_fim }
    });
  } catch (error) {
    console.error('Erro ao buscar compras do cliente:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Relatório financeiro
router.get('/financeiro', async (req, res) => {
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
      const limitNum = parseInt(limit) || 50;
      const offsetNum = parseInt(offset) || 0;
      
      const transacoes = await query(
        `SELECT 
          t.id, t.tipo, t.categoria, t.descricao, t.valor, t.data_transacao,
          t.metodo_pagamento, t.status, c.nome as cliente_nome
         FROM transacoes t
         LEFT JOIN clientes c ON t.cliente_id = c.id
         WHERE t.tenant_id = ? AND DATE(t.data_transacao) BETWEEN ? AND ?
         ORDER BY t.data_transacao DESC
         LIMIT ${limitNum} OFFSET ${offsetNum}`,
        [req.user.tenant_id, data_inicio, data_fim]
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
      const limitNum = parseInt(limit) || 50;
      const offsetNum = parseInt(offset) || 0;
      
      const contasReceber = await query(
        `SELECT 
          cr.id, cr.descricao, cr.valor, cr.data_vencimento, cr.data_pagamento,
          cr.status, cr.parcela, c.nome as cliente_nome
         FROM contas_receber cr
         LEFT JOIN clientes c ON cr.cliente_id = c.id
         WHERE cr.tenant_id = ? AND DATE(cr.data_vencimento) BETWEEN ? AND ?
         ORDER BY cr.data_vencimento ASC
         LIMIT ${limitNum} OFFSET ${offsetNum}`,
        [req.user.tenant_id, data_inicio, data_fim]
      );

      const contasPagar = await query(
        `SELECT 
          cp.id, cp.descricao, cp.valor, cp.data_vencimento, 
          cp.data_pagamento, cp.status, cp.categoria, f.nome as fornecedor_nome
         FROM contas_pagar cp
         LEFT JOIN fornecedores f ON cp.fornecedor_id = f.id
         WHERE cp.tenant_id = ? AND DATE(cp.data_vencimento) BETWEEN ? AND ?
         ORDER BY cp.data_vencimento ASC
         LIMIT ${limitNum} OFFSET ${offsetNum}`,
        [req.user.tenant_id, data_inicio, data_fim]
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
router.get('/controle-estoque', async (req, res) => {
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

    if (categoria_id && categoria_id !== '') {
      whereClause += ' AND p.categoria_id = ?';
      params.push(categoria_id);
    }

    if (tipo === 'baixo') {
      whereClause += ` AND (
        (p.tipo_preco = 'unidade' AND p.estoque <= p.estoque_minimo) OR
        (p.tipo_preco = 'kg' AND p.estoque_kg <= p.estoque_minimo_kg) OR
        (p.tipo_preco = 'litros' AND p.estoque_litros <= p.estoque_minimo_litros)
      )`;
    } else if (tipo === 'zerado') {
      whereClause += ` AND (
        (p.tipo_preco = 'unidade' AND p.estoque = 0) OR
        (p.tipo_preco = 'kg' AND p.estoque_kg = 0) OR
        (p.tipo_preco = 'litros' AND p.estoque_litros = 0)
      )`;
    }

    // Buscar produtos
    const limitNum = parseInt(limit) || 50;
    const offsetNum = parseInt(offset) || 0;
    
    const produtos = await query(
      `SELECT 
        p.id, p.nome, p.codigo_barras, p.sku, p.estoque, p.estoque_minimo,
        p.tipo_preco, p.estoque_kg, p.estoque_litros, p.estoque_minimo_kg, p.estoque_minimo_litros,
        p.preco, c.nome as categoria_nome,
        CASE 
          WHEN p.tipo_preco = 'kg' THEN p.estoque_kg
          WHEN p.tipo_preco = 'litros' THEN p.estoque_litros
          ELSE p.estoque
        END as estoque_atual,
        CASE 
          WHEN p.tipo_preco = 'kg' THEN p.estoque_minimo_kg
          WHEN p.tipo_preco = 'litros' THEN p.estoque_minimo_litros
          ELSE p.estoque_minimo
        END as estoque_minimo_atual,
        COALESCE(
          CASE 
            WHEN p.tipo_preco = 'kg' THEN p.estoque_kg * p.preco
            WHEN p.tipo_preco = 'litros' THEN p.estoque_litros * p.preco
            ELSE p.estoque * p.preco
          END, 0
        ) as valor_estoque,
        CASE 
          WHEN (p.tipo_preco = 'unidade' AND p.estoque = 0) OR
               (p.tipo_preco = 'kg' AND p.estoque_kg = 0) OR
               (p.tipo_preco = 'litros' AND p.estoque_litros = 0)
          THEN 'Sem estoque'
          WHEN (p.tipo_preco = 'unidade' AND p.estoque <= p.estoque_minimo) OR
               (p.tipo_preco = 'kg' AND p.estoque_kg <= p.estoque_minimo_kg) OR
               (p.tipo_preco = 'litros' AND p.estoque_litros <= p.estoque_minimo_litros)
          THEN 'Estoque baixo'
          ELSE 'Normal'
        END as status_estoque
       FROM produtos p
       LEFT JOIN categorias c ON p.categoria_id = c.id
       ${whereClause}
       ORDER BY estoque_atual ASC, p.nome ASC
       LIMIT ${limitNum} OFFSET ${offsetNum}`,
      params
    );

    // Estatísticas do estoque
    const [stats] = await query(
      `SELECT 
        COUNT(*) as total_produtos,
        COUNT(CASE WHEN 
          (tipo_preco = 'unidade' AND estoque = 0) OR
          (tipo_preco = 'kg' AND estoque_kg = 0) OR
          (tipo_preco = 'litros' AND estoque_litros = 0)
        THEN 1 END) as sem_estoque,
        COUNT(CASE WHEN 
          (tipo_preco = 'unidade' AND estoque <= estoque_minimo AND estoque > 0) OR
          (tipo_preco = 'kg' AND estoque_kg <= estoque_minimo_kg AND estoque_kg > 0) OR
          (tipo_preco = 'litros' AND estoque_litros <= estoque_minimo_litros AND estoque_litros > 0)
        THEN 1 END) as estoque_baixo,
        COUNT(CASE WHEN 
          (tipo_preco = 'unidade' AND estoque > estoque_minimo) OR
          (tipo_preco = 'kg' AND estoque_kg > estoque_minimo_kg) OR
          (tipo_preco = 'litros' AND estoque_litros > estoque_minimo_litros)
        THEN 1 END) as estoque_normal,
        COALESCE(SUM(
          CASE 
            WHEN tipo_preco = 'kg' THEN estoque_kg
            WHEN tipo_preco = 'litros' THEN estoque_litros
            ELSE estoque
          END
        ), 0) as total_unidades,
        COALESCE(SUM(
          CASE 
            WHEN tipo_preco = 'kg' THEN estoque_kg * preco
            WHEN tipo_preco = 'litros' THEN estoque_litros * preco
            ELSE estoque * preco
          END
        ), 0) as valor_total_estoque
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
router.get('/performance-vendas', async (req, res) => {
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

    // Construir query baseada no agrupamento
    const limitNum = parseInt(limit) || 50;
    const offsetNum = parseInt(offset) || 0;
    let querySql = '';
    let queryParams = [req.user.tenant_id, data_inicio, data_fim];

    if (agrupamento === 'vendedor') {
      querySql = `SELECT 
        u.id, u.nome as nome_agrupamento,
        COUNT(v.id) as total_vendas,
        COUNT(CASE WHEN v.status = 'pago' THEN 1 END) as vendas_pagas,
        COALESCE(SUM(CASE WHEN v.status = 'pago' THEN COALESCE(
          (SELECT SUM(vp.valor - COALESCE(vp.troco, 0)) 
           FROM venda_pagamentos vp 
           WHERE vp.venda_id = v.id), v.total
        ) ELSE 0 END), 0) as receita_total,
        COALESCE(AVG(CASE WHEN v.status = 'pago' THEN COALESCE(
          (SELECT SUM(vp.valor - COALESCE(vp.troco, 0)) 
           FROM venda_pagamentos vp 
           WHERE vp.venda_id = v.id), v.total
        ) ELSE NULL END), 0) as ticket_medio
       FROM vendas v
       JOIN usuarios u ON v.usuario_id = u.id
       WHERE v.tenant_id = ? AND DATE(v.data_venda) BETWEEN ? AND ?
       GROUP BY u.id, u.nome
       ORDER BY receita_total DESC
       LIMIT ${limitNum} OFFSET ${offsetNum}`;
    } else if (agrupamento === 'categoria') {
      querySql = `SELECT 
        cat.id, cat.nome as nome_agrupamento,
        COUNT(DISTINCT v.id) as total_vendas,
        COUNT(DISTINCT CASE WHEN v.status = 'pago' THEN v.id END) as vendas_pagas,
        COALESCE(SUM(CASE WHEN v.status = 'pago' THEN COALESCE(
          (SELECT SUM(vp.valor - COALESCE(vp.troco, 0)) 
           FROM venda_pagamentos vp 
           WHERE vp.venda_id = v.id), v.total
        ) ELSE 0 END), 0) as receita_total,
        COALESCE(AVG(CASE WHEN v.status = 'pago' THEN COALESCE(
          (SELECT SUM(vp.valor - COALESCE(vp.troco, 0)) 
           FROM venda_pagamentos vp 
           WHERE vp.venda_id = v.id), v.total
        ) ELSE NULL END), 0) as ticket_medio
       FROM vendas v
       JOIN venda_itens vi ON v.id = vi.venda_id
       JOIN produtos p ON vi.produto_id = p.id
       JOIN categorias cat ON p.categoria_id = cat.id
       WHERE v.tenant_id = ? AND DATE(v.data_venda) BETWEEN ? AND ?
       GROUP BY cat.id, cat.nome
       ORDER BY receita_total DESC
       LIMIT ${limitNum} OFFSET ${offsetNum}`;
    } else if (agrupamento === 'cliente') {
      querySql = `SELECT 
        c.id, c.nome as nome_agrupamento,
        COUNT(v.id) as total_vendas,
        COUNT(CASE WHEN v.status = 'pago' THEN 1 END) as vendas_pagas,
        COALESCE(SUM(CASE WHEN v.status = 'pago' THEN COALESCE(
          (SELECT SUM(vp.valor - COALESCE(vp.troco, 0)) 
           FROM venda_pagamentos vp 
           WHERE vp.venda_id = v.id), v.total
        ) ELSE 0 END), 0) as receita_total,
        COALESCE(AVG(CASE WHEN v.status = 'pago' THEN COALESCE(
          (SELECT SUM(vp.valor - COALESCE(vp.troco, 0)) 
           FROM venda_pagamentos vp 
           WHERE vp.venda_id = v.id), v.total
        ) ELSE NULL END), 0) as ticket_medio
       FROM vendas v
       LEFT JOIN clientes c ON v.cliente_id = c.id
       WHERE v.tenant_id = ? AND DATE(v.data_venda) BETWEEN ? AND ?
       GROUP BY c.id, c.nome
       ORDER BY receita_total DESC
       LIMIT ${limitNum} OFFSET ${offsetNum}`;
    }

    // Buscar performance
    const performance = await query(querySql, queryParams);

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

// Relatório detalhado de vendas por período (formato específico)
router.get('/vendas-periodo-detalhado', async (req, res) => {
  try {
    const { 
      data_inicio, 
      data_fim
    } = req.query;

    if (!data_inicio || !data_fim) {
      return res.status(400).json({
        error: 'Data de início e fim são obrigatórias'
      });
    }

    const tenantId = parseInt(req.user.tenant_id) || 1;

    // 1. Resumo Geral do Período
    const [resumoGeral] = await query(
      `SELECT 
        COUNT(*) as total_vendas,
        COALESCE(SUM(CASE WHEN status = 'pago' THEN COALESCE(
          (SELECT SUM(vp.valor - COALESCE(vp.troco, 0)) 
           FROM venda_pagamentos vp 
           WHERE vp.venda_id = vendas.id), total
        ) ELSE 0 END), 0) as receita_total,
        COALESCE(AVG(CASE WHEN status = 'pago' THEN COALESCE(
          (SELECT SUM(vp.valor - COALESCE(vp.troco, 0)) 
           FROM venda_pagamentos vp 
           WHERE vp.venda_id = vendas.id), total
        ) ELSE NULL END), 0) as ticket_medio,
        COUNT(CASE WHEN status = 'pago' THEN 1 END) as vendas_pagas,
        COUNT(CASE WHEN status = 'pendente' THEN 1 END) as vendas_pendentes
       FROM vendas 
       WHERE tenant_id = ? AND DATE(data_venda) BETWEEN ? AND ?`,
      [tenantId, data_inicio, data_fim]
    );

    // 2. Vendas por Forma de Pagamento - usar valores reais dos pagamentos
    const formasPagamento = await query(
      `SELECT
        vp.metodo as metodo_pagamento,
        COUNT(DISTINCT v.id) as quantidade,
        COALESCE(SUM(vp.valor - COALESCE(vp.troco, 0)), 0) as valor_total
       FROM vendas v
       JOIN venda_pagamentos vp ON v.id = vp.venda_id
       WHERE v.tenant_id = ? AND DATE(v.data_venda) BETWEEN ? AND ? AND v.status = 'pago'
       GROUP BY vp.metodo
       ORDER BY valor_total DESC`,
      [tenantId, data_inicio, data_fim]
    );

    // 3. Vendas por Categoria de Produto
    const vendasPorCategoria = await query(
      `SELECT 
        c.nome as categoria_nome,
        SUM(vi.quantidade) as quantidade_vendida,
        COALESCE(SUM(CASE WHEN v.status = 'pago' THEN 
          vi.preco_total * COALESCE(
            (SELECT SUM(vp.valor - COALESCE(vp.troco, 0)) 
             FROM venda_pagamentos vp 
             WHERE vp.venda_id = v.id) / v.total, 1
          ) 
        ELSE 0 END), 0) as faturamento,
        COUNT(DISTINCT v.id) as total_vendas
       FROM venda_itens vi
       JOIN vendas v ON vi.venda_id = v.id
       JOIN produtos p ON vi.produto_id = p.id
       LEFT JOIN categorias c ON p.categoria_id = c.id
       WHERE v.tenant_id = ? AND DATE(v.data_venda) BETWEEN ? AND ?
       GROUP BY c.id, c.nome
       ORDER BY faturamento DESC`,
      [tenantId, data_inicio, data_fim]
    );

    // 4. Vendas por Data
    const vendasPorData = await query(
      `SELECT 
        DATE(v.data_venda) as data_venda,
        COUNT(*) as quantidade_vendas,
        COALESCE(SUM(CASE WHEN v.status = 'pago' THEN COALESCE(
          (SELECT SUM(vp.valor - COALESCE(vp.troco, 0)) 
           FROM venda_pagamentos vp 
           WHERE vp.venda_id = v.id), v.total
        ) ELSE 0 END), 0) as valor_total
       FROM vendas v
       WHERE v.tenant_id = ? AND DATE(v.data_venda) BETWEEN ? AND ?
       GROUP BY DATE(v.data_venda)
       ORDER BY data_venda DESC`,
      [tenantId, data_inicio, data_fim]
    );

    // 5. Informações do responsável (usuário logado)
    const [responsavel] = await query(
      `SELECT nome, sobrenome, email 
       FROM usuarios 
       WHERE id = ?`,
      [req.user.id]
    );

    // Calcular percentuais para categorias
    const totalFaturamento = resumoGeral.receita_total;
    const vendasPorCategoriaComPercentual = vendasPorCategoria.map(categoria => ({
      ...categoria,
      percentual: totalFaturamento > 0 ? (categoria.faturamento / totalFaturamento * 100) : 0
    }));

    res.json({
      periodo: {
        data_inicio,
        data_fim
      },
      responsavel: {
        nome: responsavel ? `${responsavel.nome} ${responsavel.sobrenome || ''}`.trim() : 'N/A',
        email: responsavel?.email || 'N/A'
      },
      resumo_geral: resumoGeral,
      formas_pagamento: formasPagamento,
      vendas_por_categoria: vendasPorCategoriaComPercentual,
      vendas_por_data: vendasPorData
    });
  } catch (error) {
    console.error('Erro ao gerar relatório detalhado de vendas:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

export default router;
