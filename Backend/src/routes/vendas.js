import express from 'express';
import { query, queryWithResult } from '../database/connection.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateVenda, validateId, validatePagination, validateSearch, handleValidationErrors } from '../middleware/validation.js';

const router = express.Router();

// Aplicar autenticação em todas as rotas
router.use(authenticateToken);

// Listar vendas com paginação e busca
router.get('/', validatePagination, validateSearch, handleValidationErrors, async (req, res) => {
  try {
    const { page = 1, limit = 10, q = '', status = '', data_inicio = '', data_fim = '' } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE v.tenant_id = ?';
    let params = [req.user.tenant_id];

    // Adicionar filtro de busca
    if (q) {
      whereClause += ' AND (v.numero_venda LIKE ? OR c.nome LIKE ? OR c.email LIKE ?)';
      const searchTerm = `%${q}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Adicionar filtro de status
    if (status) {
      whereClause += ' AND v.status = ?';
      params.push(status);
    }

    // Adicionar filtro de data
    if (data_inicio) {
      whereClause += ' AND DATE(v.data_venda) >= ?';
      params.push(data_inicio);
    }

    if (data_fim) {
      whereClause += ' AND DATE(v.data_venda) <= ?';
      params.push(data_fim);
    }

    // Buscar vendas com informações do cliente
    const vendas = await query(
      `SELECT v.*, c.nome as cliente_nome, c.email as cliente_email, u.nome as vendedor_nome
       FROM vendas v 
       LEFT JOIN clientes c ON v.cliente_id = c.id 
       LEFT JOIN usuarios u ON v.usuario_id = u.id
       ${whereClause} 
       ORDER BY v.data_venda DESC 
       LIMIT ${Number(limit)} OFFSET ${Number(offset)}`,
      params
    );

    // Buscar itens e métodos de pagamento para cada venda
    const vendasComItens = await Promise.all(
      vendas.map(async (venda) => {
        const itens = await query(
          `SELECT vi.*, p.nome as produto_nome, p.codigo_barras, p.sku
           FROM venda_itens vi
           JOIN produtos p ON vi.produto_id = p.id
           WHERE vi.venda_id = ?
           ORDER BY vi.id`,
          [venda.id]
        );

        // Buscar métodos de pagamento
        const metodosPagamento = await query(
          `SELECT metodo, valor, troco
           FROM venda_pagamentos
           WHERE venda_id = ?
           ORDER BY id`,
          [venda.id]
        );

        // Buscar pagamento a prazo (se houver)
        const pagamentoPrazo = await query(
          `SELECT dias, juros, valor_original, valor_com_juros, data_vencimento, status
           FROM venda_pagamentos_prazo
           WHERE venda_id = ?
           ORDER BY id`,
          [venda.id]
        );
        
        return {
          ...venda,
          itens,
          metodos_pagamento: metodosPagamento,
          pagamento_prazo: pagamentoPrazo.length > 0 ? pagamentoPrazo[0] : null
        };
      })
    );

    // Contar total de registros
    const [totalResult] = await query(
      `SELECT COUNT(*) as total FROM vendas v ${whereClause}`,
      params
    );

    const total = totalResult.total;
    const totalPages = Math.ceil(total / limit);

    res.json({
      vendas: vendasComItens,
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
    console.error('Erro ao listar vendas:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Buscar venda por ID
router.get('/:id', validateId, handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar venda
    const vendas = await query(
      `SELECT v.*, c.nome as cliente_nome, c.email as cliente_email, u.nome as vendedor_nome
       FROM vendas v 
       LEFT JOIN clientes c ON v.cliente_id = c.id 
       LEFT JOIN usuarios u ON v.usuario_id = u.id
       WHERE v.id = ? AND v.tenant_id = ?`,
      [id, req.user.tenant_id]
    );

    if (vendas.length === 0) {
      return res.status(404).json({
        error: 'Venda não encontrada'
      });
    }

    // Buscar itens da venda
    const itens = await query(
      `SELECT vi.*, p.nome as produto_nome, p.codigo_barras, p.sku
       FROM venda_itens vi
       JOIN produtos p ON vi.produto_id = p.id
       WHERE vi.venda_id = ?
       ORDER BY vi.id`,
      [id]
    );

    // Buscar métodos de pagamento
    const metodosPagamento = await query(
      `SELECT metodo, valor, troco
       FROM venda_pagamentos
       WHERE venda_id = ?
       ORDER BY id`,
      [id]
    );

    // Buscar pagamento a prazo (se houver)
    const pagamentoPrazo = await query(
      `SELECT dias, juros, valor_original, valor_com_juros, data_vencimento, status
       FROM venda_pagamentos_prazo
       WHERE venda_id = ?
       ORDER BY id`,
      [id]
    );

    res.json({
      venda: {
        ...vendas[0],
        itens,
        metodos_pagamento: metodosPagamento,
        pagamento_prazo: pagamentoPrazo.length > 0 ? pagamentoPrazo[0] : null
      }
    });
  } catch (error) {
    console.error('Erro ao buscar venda:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Criar nova venda
router.post('/', validateVenda, async (req, res) => {
  try {
    const {
      cliente_id,
      itens = [],
      subtotal,
      desconto = 0,
      total,
      forma_pagamento,
      metodos_pagamento = [],
      pagamento_prazo,
      parcelas = 1,
      observacoes,
      status = 'pendente'
    } = req.body;

    // Debug: verificar dados recebidos
    console.log('Dados recebidos na criação da venda:', {
      cliente_id,
      total,
      forma_pagamento,
      metodos_pagamento,
      pagamento_prazo,
      status,
      usarPagamentoPrazo: req.body.pagamento_prazo ? true : false
    });
    
    // Debug: verificar estrutura dos métodos de pagamento
    if (metodos_pagamento && metodos_pagamento.length > 0) {
      console.log('Métodos de pagamento detalhados:', metodos_pagamento);
    }
    
    // Debug: verificar estrutura do pagamento a prazo
    if (pagamento_prazo) {
      console.log('Pagamento a prazo detalhado:', pagamento_prazo);
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
        error: 'Venda deve ter pelo menos um item'
      });
    }

    // Verificar produtos e estoque
    for (const item of itens) {
      const produtos = await query(
        'SELECT id, nome, estoque, preco FROM produtos WHERE id = ? AND tenant_id = ? AND status = "ativo"',
        [item.produto_id, req.user.tenant_id]
      );

      if (produtos.length === 0) {
        return res.status(400).json({
          error: `Produto com ID ${item.produto_id} não encontrado ou inativo`
        });
      }

      const produto = produtos[0];
      if (produto.estoque < item.quantidade) {
        return res.status(400).json({
          error: `Estoque insuficiente para o produto ${produto.nome}. Disponível: ${produto.estoque}`
        });
      }
    }

    // Gerar número da venda
    const numeroVenda = await gerarNumeroVenda(req.user.tenant_id);

    // Determinar forma de pagamento principal (para compatibilidade)
    let formaPagamentoPrincipal = forma_pagamento;
    if (metodos_pagamento && metodos_pagamento.length > 0) {
      formaPagamentoPrincipal = metodos_pagamento[0].metodo;
    } else if (pagamento_prazo) {
      // Se há pagamento a prazo mas não há métodos de pagamento, usar um valor padrão
      formaPagamentoPrincipal = 'pix'; // Valor padrão para pagamento a prazo
    }

    // Iniciar transação
    const result = await queryWithResult(
      `INSERT INTO vendas (
        tenant_id, cliente_id, usuario_id, numero_venda, subtotal, desconto, total,
        forma_pagamento, parcelas, observacoes, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.tenant_id, cliente_id, req.user.id, numeroVenda, subtotal,
        desconto, total, formaPagamentoPrincipal, parcelas, observacoes, status
      ]
    );

    const vendaId = result.insertId;

    // Inserir itens da venda e atualizar estoque
    for (const item of itens) {
      // Inserir item da venda
      await query(
        `INSERT INTO venda_itens (venda_id, produto_id, quantidade, preco_unitario, preco_total, desconto)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          vendaId, item.produto_id, item.quantidade, item.preco_unitario,
          item.preco_total, item.desconto || 0
        ]
      );

      // Atualizar estoque do produto
      await query(
        'UPDATE produtos SET estoque = estoque - ? WHERE id = ?',
        [item.quantidade, item.produto_id]
      );
    }

    // Salvar métodos de pagamento (se houver)
    if (metodos_pagamento && metodos_pagamento.length > 0) {
      for (const metodo of metodos_pagamento) {
        await query(
          `INSERT INTO venda_pagamentos (venda_id, metodo, valor, troco)
           VALUES (?, ?, ?, ?)`,
          [vendaId, metodo.metodo, metodo.valor, metodo.troco || 0]
        );
      }
    } else if (forma_pagamento && !pagamento_prazo) {
      // Fallback para método único (compatibilidade) - apenas se não há pagamento a prazo
      await query(
        `INSERT INTO venda_pagamentos (venda_id, metodo, valor, troco)
         VALUES (?, ?, ?, ?)`,
        [vendaId, forma_pagamento, total, 0]
      );
    }

    // Salvar pagamento a prazo (se houver)
    if (pagamento_prazo) {
      await query(
        `INSERT INTO venda_pagamentos_prazo (
          venda_id, dias, juros, valor_original, valor_com_juros, data_vencimento, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          vendaId,
          pagamento_prazo.dias,
          pagamento_prazo.juros,
          pagamento_prazo.valorOriginal || pagamento_prazo.valor_original || total,
          pagamento_prazo.valorComJuros,
          new Date(pagamento_prazo.dataVencimento).toISOString().split('T')[0], // Converter para formato YYYY-MM-DD
          'pendente'
        ]
      );
    }

    // Atualizar total de compras do cliente (se houver)
    if (cliente_id) {
      await query(
        'UPDATE clientes SET total_compras = total_compras + ? WHERE id = ?',
        [total, cliente_id]
      );
    }

    // Buscar venda criada com métodos de pagamento
    const [venda] = await query(
      `SELECT v.*, c.nome as cliente_nome, c.email as cliente_email, u.nome as vendedor_nome
       FROM vendas v 
       LEFT JOIN clientes c ON v.cliente_id = c.id 
       LEFT JOIN usuarios u ON v.usuario_id = u.id
       WHERE v.id = ?`,
      [vendaId]
    );

    // Buscar métodos de pagamento da venda criada
    const metodosPagamento = await query(
      `SELECT metodo, valor, troco
       FROM venda_pagamentos
       WHERE venda_id = ?
       ORDER BY id`,
      [vendaId]
    );

    // Buscar pagamento a prazo (se houver)
    const pagamentoPrazo = await query(
      `SELECT dias, juros, valor_original, valor_com_juros, data_vencimento, status
       FROM venda_pagamentos_prazo
       WHERE venda_id = ?
       ORDER BY id`,
      [vendaId]
    );

    res.status(201).json({
      message: 'Venda criada com sucesso',
      venda: {
        ...venda,
        metodos_pagamento: metodosPagamento,
        pagamento_prazo: pagamentoPrazo.length > 0 ? pagamentoPrazo[0] : null
      }
    });
  } catch (error) {
    console.error('Erro ao criar venda:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Atualizar status da venda
router.patch('/:id/status', validateId, handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['pendente', 'pago', 'cancelado', 'devolvido'].includes(status)) {
      return res.status(400).json({
        error: 'Status inválido'
      });
    }

    // Verificar se venda existe
    const existingVendas = await query(
      'SELECT id, status as status_atual FROM vendas WHERE id = ? AND tenant_id = ?',
      [id, req.user.tenant_id]
    );

    if (existingVendas.length === 0) {
      return res.status(404).json({
        error: 'Venda não encontrada'
      });
    }

    const venda = existingVendas[0];

    // Se cancelando ou devolvendo, restaurar estoque
    if ((status === 'cancelado' || status === 'devolvido') && venda.status_atual !== 'cancelado' && venda.status_atual !== 'devolvido') {
      const itens = await query(
        'SELECT produto_id, quantidade FROM venda_itens WHERE venda_id = ?',
        [id]
      );

      for (const item of itens) {
        await query(
          'UPDATE produtos SET estoque = estoque + ? WHERE id = ?',
          [item.quantidade, item.produto_id]
        );
      }
    }

    // Atualizar status
    await query(
      'UPDATE vendas SET status = ? WHERE id = ? AND tenant_id = ?',
      [status, id, req.user.tenant_id]
    );

    res.json({
      message: 'Status da venda atualizado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao atualizar status da venda:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Deletar venda
router.delete('/:id', validateId, handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se venda existe
    const existingVendas = await query(
      'SELECT id, status FROM vendas WHERE id = ? AND tenant_id = ?',
      [id, req.user.tenant_id]
    );

    if (existingVendas.length === 0) {
      return res.status(404).json({
        error: 'Venda não encontrada'
      });
    }

    const venda = existingVendas[0];

    // Só permitir deletar vendas pendentes
    if (venda.status !== 'pendente') {
      return res.status(400).json({
        error: 'Só é possível deletar vendas pendentes'
      });
    }

    // Restaurar estoque dos produtos
    const itens = await query(
      'SELECT produto_id, quantidade FROM venda_itens WHERE venda_id = ?',
      [id]
    );

    for (const item of itens) {
      await query(
        'UPDATE produtos SET estoque = estoque + ? WHERE id = ?',
        [item.quantidade, item.produto_id]
      );
    }

    // Deletar itens da venda
    await query('DELETE FROM venda_itens WHERE venda_id = ?', [id]);

    // Deletar venda
    await query('DELETE FROM vendas WHERE id = ? AND tenant_id = ?', [id, req.user.tenant_id]);

    res.json({
      message: 'Venda deletada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao deletar venda:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Estatísticas das vendas
router.get('/stats/overview', async (req, res) => {
  try {
    const { periodo = 'hoje' } = req.query;
    
    let whereClause = 'WHERE tenant_id = ?';
    let params = [req.user.tenant_id];

    // Adicionar filtro de período
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

    const stats = await query(
      `SELECT 
        COUNT(*) as total_vendas,
        COUNT(CASE 
          WHEN status = 'pago' OR EXISTS(
            SELECT 1 FROM venda_pagamentos vp 
            WHERE vp.venda_id = v.id
          ) THEN 1 
        END) as vendas_pagas,
        COUNT(CASE 
          WHEN status = 'pendente' AND NOT EXISTS(
            SELECT 1 FROM venda_pagamentos vp 
            WHERE vp.venda_id = v.id
          ) THEN 1 
        END) as vendas_pendentes,
        COALESCE(
          SUM(CASE 
            WHEN status = 'pago' OR EXISTS(
              SELECT 1 FROM venda_pagamentos vp 
              WHERE vp.venda_id = v.id
            ) THEN 
              COALESCE(
                (SELECT SUM(vp.valor - COALESCE(vp.troco, 0)) FROM venda_pagamentos vp WHERE vp.venda_id = v.id), 
                v.total
              )
            ELSE 0 
          END), 0
        ) as receita_total,
        COALESCE(
          AVG(CASE 
            WHEN status = 'pago' OR EXISTS(
              SELECT 1 FROM venda_pagamentos vp 
              WHERE vp.venda_id = v.id
            ) THEN 
              COALESCE(
                (SELECT SUM(vp.valor - COALESCE(vp.troco, 0)) FROM venda_pagamentos vp WHERE vp.venda_id = v.id), 
                v.total
              )
            ELSE NULL 
          END), 0
        ) as ticket_medio
      FROM vendas v
      ${whereClause}`,
      params
    );

    res.json({
      stats: stats[0],
      periodo
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas das vendas:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Função auxiliar para gerar número da venda
async function gerarNumeroVenda(tenantId) {
  const result = await query(
    'SELECT MAX(CAST(SUBSTRING(numero_venda, 2) AS UNSIGNED)) as ultimo_numero FROM vendas WHERE tenant_id = ? AND numero_venda REGEXP "^V[0-9]+$"',
    [tenantId]
  );

  const ultimoNumero = result[0]?.ultimo_numero || 0;
  const proximoNumero = ultimoNumero + 1;
  
  return `V${proximoNumero.toString().padStart(6, '0')}`;
}

export default router;
