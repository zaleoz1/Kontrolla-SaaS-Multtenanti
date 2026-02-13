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

    // Vendas do período - contar todas as vendas e calcular receita efetiva
    let vendasStats;
    if (periodo === 'hoje') {
      // Para hoje, contar todas as vendas mas usar valor efetivo dos pagamentos para receita
      vendasStats = await query(
        `SELECT 
          COUNT(DISTINCT v.id) as total_vendas,
          COALESCE(SUM(
            CASE 
              WHEN vp.valor IS NOT NULL THEN vp.valor - COALESCE(vp.troco, 0)
              ELSE v.total
            END
          ), 0) as receita_total,
          COALESCE(AVG(
            CASE 
              WHEN vp.valor IS NOT NULL THEN vp.valor - COALESCE(vp.troco, 0)
              ELSE v.total
            END
          ), 0) as ticket_medio
        FROM vendas v
        LEFT JOIN venda_pagamentos vp ON v.id = vp.venda_id
        WHERE v.tenant_id = ? AND DATE(v.data_venda) = CURDATE()`,
        [req.user.tenant_id]
      );
    } else {
      // Para outros períodos, usar valor efetivo dos pagamentos
      vendasStats = await query(
        `SELECT 
          COUNT(DISTINCT v.id) as total_vendas,
          COALESCE(SUM(vp.valor - COALESCE(vp.troco, 0)), 0) as receita_total,
          COALESCE(AVG(vp.valor - COALESCE(vp.troco, 0)), 0) as ticket_medio
        FROM vendas v
        LEFT JOIN venda_pagamentos vp ON v.id = vp.venda_id
        ${whereClause}`,
        params
      );
    }

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
        COUNT(CASE WHEN 
          status = 'ativo' AND (
            (tipo_preco = 'unidade' AND estoque <= estoque_minimo AND estoque > 0) OR
            (tipo_preco = 'kg' AND estoque_kg <= estoque_minimo_kg AND estoque_kg > 0) OR
            (tipo_preco = 'litros' AND estoque_litros <= estoque_minimo_litros AND estoque_litros > 0)
          )
        THEN 1 END) as estoque_baixo,
        COUNT(CASE WHEN 
          status = 'ativo' AND (
            (tipo_preco = 'unidade' AND estoque = 0) OR
            (tipo_preco = 'kg' AND (estoque_kg = 0 OR estoque_kg IS NULL)) OR
            (tipo_preco = 'litros' AND (estoque_litros = 0 OR estoque_litros IS NULL))
          )
        THEN 1 END) as sem_estoque
      FROM produtos 
      WHERE tenant_id = ?`,
      [req.user.tenant_id]
    );

    // Comparação com período anterior
    let comparacaoVendas = null;
    let whereClauseAnterior = 'WHERE tenant_id = ?';
    let paramsAnterior = [req.user.tenant_id];

    switch (periodo) {
      case 'hoje':
        // Comparar com o dia anterior
        whereClauseAnterior += ' AND DATE(data_venda) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)';
        break;
      case 'semana':
        // Comparar com a semana anterior
        whereClauseAnterior += ' AND data_venda >= DATE_SUB(CURDATE(), INTERVAL 14 DAY) AND data_venda < DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
        break;
      case 'mes':
        // Comparar com o mês anterior
        whereClauseAnterior += ' AND data_venda >= DATE_SUB(CURDATE(), INTERVAL 2 MONTH) AND data_venda < DATE_SUB(CURDATE(), INTERVAL 1 MONTH)';
        break;
      case 'ano':
        // Comparar com o ano anterior
        whereClauseAnterior += ' AND data_venda >= DATE_SUB(CURDATE(), INTERVAL 2 YEAR) AND data_venda < DATE_SUB(CURDATE(), INTERVAL 1 YEAR)';
        break;
    }

    // Comparação com período anterior - manter consistência na contagem
    let vendasAnteriores;
    if (periodo === 'hoje') {
      // Para hoje, comparar com todas as vendas do dia anterior
      vendasAnteriores = await query(
        `SELECT 
          COUNT(DISTINCT v.id) as total_vendas_anterior,
          COALESCE(SUM(
            CASE 
              WHEN vp.valor IS NOT NULL THEN vp.valor - COALESCE(vp.troco, 0)
              ELSE v.total
            END
          ), 0) as receita_anterior
        FROM vendas v
        LEFT JOIN venda_pagamentos vp ON v.id = vp.venda_id
        WHERE v.tenant_id = ? AND DATE(v.data_venda) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)`,
        [req.user.tenant_id]
      );
    } else {
      // Para outros períodos, usar a tabela vendas
      vendasAnteriores = await query(
        `SELECT 
          COUNT(*) as total_vendas_anterior,
          COALESCE(SUM(CASE WHEN status = 'pago' THEN total ELSE 0 END), 0) as receita_anterior
        FROM vendas 
        ${whereClauseAnterior}`,
        paramsAnterior
      );
    }

    const atual = vendasStats[0];
    const anterior = vendasAnteriores[0];

    // Calcular variação percentual com tratamento para divisão por zero
    const calcularVariacao = (atual, anterior) => {
      if (anterior === 0) {
        return atual > 0 ? 100 : 0; // Se não havia dados antes e agora há, 100% de crescimento
      }
      return ((atual - anterior) / anterior) * 100;
    };

    comparacaoVendas = {
      vendas: {
        atual: atual.total_vendas,
        anterior: anterior.total_vendas_anterior,
        variacao: calcularVariacao(atual.total_vendas, anterior.total_vendas_anterior)
      },
      receita: {
        atual: atual.receita_total,
        anterior: anterior.receita_anterior,
        variacao: calcularVariacao(atual.receita_total, anterior.receita_anterior)
      }
    };

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
    const limitValue = parseInt(limit);

    // Buscar vendas com informações do cliente
    const vendas = await query(
      `SELECT v.id, v.numero_venda, v.data_venda, v.status, 
              CAST(v.subtotal AS DECIMAL(10,2)) as subtotal, 
              CAST(v.desconto AS DECIMAL(10,2)) as desconto, 
              CAST(v.total AS DECIMAL(10,2)) as total, 
              v.forma_pagamento, v.parcelas, v.observacoes, v.cliente_id, v.usuario_id,
              c.nome as cliente_nome, c.email as cliente_email, u.nome as vendedor_nome
       FROM vendas v 
       LEFT JOIN clientes c ON v.cliente_id = c.id AND c.tenant_id = v.tenant_id
       LEFT JOIN usuarios u ON v.usuario_id = u.id AND u.tenant_id = v.tenant_id
       WHERE v.tenant_id = ? 
       ORDER BY v.data_venda DESC 
       LIMIT ${limitValue}`,
      [req.user.tenant_id]
    );

    // Buscar itens e métodos de pagamento para cada venda
    const vendasComItens = await Promise.all(
      vendas.map(async (venda) => {
        // Buscar itens da venda
        const itens = await query(
          `SELECT vi.id, vi.produto_id, vi.quantidade, 
                  CAST(vi.preco_unitario AS DECIMAL(10,2)) as preco_unitario, 
                  CAST(vi.preco_total AS DECIMAL(10,2)) as preco_total, 
                  CAST(vi.desconto AS DECIMAL(10,2)) as desconto,
                  p.nome as produto_nome
           FROM venda_itens vi
           JOIN produtos p ON vi.produto_id = p.id
           WHERE vi.venda_id = ?
           ORDER BY vi.id`,
          [venda.id]
        );

        // Buscar métodos de pagamento
        const metodosPagamento = await query(
          `SELECT metodo, 
                  CAST(valor AS DECIMAL(10,2)) as valor, 
                  CAST(troco AS DECIMAL(10,2)) as troco,
                  parcelas, 
                  CAST(taxa_parcela AS DECIMAL(5,2)) as taxa_parcela
           FROM venda_pagamentos
           WHERE venda_id = ?
           ORDER BY id`,
          [venda.id]
        );

        // Buscar pagamento a prazo
        const pagamentoPrazo = await query(
          `SELECT 
            dias,
            juros,
            valor_original,
            valor_com_juros,
            data_vencimento, 
            status,
            CAST(valor AS DECIMAL(10,2)) as valor
           FROM contas_receber
           WHERE venda_id = ? AND descricao LIKE 'Pagamento a prazo%'
           ORDER BY id`,
          [venda.id]
        );
        
        // Calcular saldo pendente para vendas a prazo
        let saldoPendente = 0;
        if (venda.status === 'pendente' && pagamentoPrazo.length > 0) {
          // Somar valor de todas as parcelas pendentes
          saldoPendente = pagamentoPrazo
            .filter(p => p.status === 'pendente')
            .reduce((sum, p) => sum + parseFloat(p.valor || 0), 0);
        }
        
        return {
          ...venda,
          itens,
          metodos_pagamento: metodosPagamento,
          pagamento_prazo: pagamentoPrazo.length > 0 ? pagamentoPrazo[0] : null,
          saldo_pendente: saldoPendente
        };
      })
    );

    res.json({
      vendas: vendasComItens
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
    const limitValue = parseInt(limit);

    const produtos = await query(
      `SELECT p.id, p.nome, p.estoque, p.estoque_minimo, p.preco, p.tipo_preco,
              p.estoque_kg, p.estoque_litros, p.estoque_minimo_kg, p.estoque_minimo_litros,
              c.nome as categoria_nome,
              CASE 
                WHEN p.tipo_preco = 'kg' THEN p.estoque_kg
                WHEN p.tipo_preco = 'litros' THEN p.estoque_litros
                ELSE p.estoque
              END as estoque_atual,
              CASE 
                WHEN p.tipo_preco = 'kg' THEN p.estoque_minimo_kg
                WHEN p.tipo_preco = 'litros' THEN p.estoque_minimo_litros
                ELSE p.estoque_minimo
              END as estoque_minimo_atual
       FROM produtos p 
       LEFT JOIN categorias c ON p.categoria_id = c.id 
       WHERE p.tenant_id = ? AND (
         (p.tipo_preco = 'unidade' AND p.estoque <= p.estoque_minimo) OR
         (p.tipo_preco = 'kg' AND p.estoque_kg <= p.estoque_minimo_kg) OR
         (p.tipo_preco = 'litros' AND p.estoque_litros <= p.estoque_minimo_litros)
       ) AND p.status = 'ativo'
       ORDER BY estoque_atual ASC 
       LIMIT ${limitValue}`,
      [req.user.tenant_id]
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

    const diasValue = parseInt(dias);
    const vendas = await query(
      `SELECT 
        ${groupBy} as periodo,
        COUNT(DISTINCT v.id) as total_vendas,
        COALESCE(SUM(vp.valor - COALESCE(vp.troco, 0)), 0) as receita_total
       FROM vendas v
       LEFT JOIN venda_pagamentos vp ON v.id = vp.venda_id
       WHERE v.tenant_id = ? AND v.data_venda >= DATE_SUB(CURDATE(), INTERVAL ${diasValue} DAY)
       GROUP BY ${groupBy}
       ORDER BY periodo ASC`,
      [req.user.tenant_id]
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
    const limitValue = parseInt(limit);
    const periodoValue = parseInt(periodo);

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
         AND v.data_venda >= DATE_SUB(CURDATE(), INTERVAL ${periodoValue} DAY)
       GROUP BY p.id, p.nome, p.preco, c.nome
       ORDER BY total_vendido DESC
       LIMIT ${limitValue}`,
      [req.user.tenant_id]
    );

    res.json({
      produtos,
      periodo: periodoValue
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
    const periodoValue = parseInt(periodo);

    // Transações do período
    const transacoes = await query(
      `SELECT 
        COUNT(*) as total_transacoes,
        COALESCE(SUM(CASE WHEN tipo = 'entrada' AND status = 'concluida' THEN valor ELSE 0 END), 0) as entradas,
        COALESCE(SUM(CASE WHEN tipo = 'saida' AND status = 'concluida' THEN valor ELSE 0 END), 0) as saidas
       FROM transacoes 
       WHERE tenant_id = ? AND data_transacao >= DATE_SUB(CURDATE(), INTERVAL ${periodoValue} DAY)`,
      [req.user.tenant_id]
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
      periodo: periodoValue
    });
  } catch (error) {
    console.error('Erro ao buscar resumo financeiro:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

export default router;
