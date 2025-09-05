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

    // Contar total de registros
    const [totalResult] = await query(
      `SELECT COUNT(*) as total FROM vendas v ${whereClause}`,
      params
    );

    const total = totalResult.total;
    const totalPages = Math.ceil(total / limit);

    res.json({
      vendas,
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

    res.json({
      venda: {
        ...vendas[0],
        itens
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
      parcelas = 1,
      observacoes
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

    // Iniciar transação
    const result = await queryWithResult(
      `INSERT INTO vendas (
        tenant_id, cliente_id, usuario_id, numero_venda, subtotal, desconto, total,
        forma_pagamento, parcelas, observacoes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.tenant_id, cliente_id, req.user.id, numeroVenda, subtotal,
        desconto, total, forma_pagamento, parcelas, observacoes
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

    // Atualizar total de compras do cliente (se houver)
    if (cliente_id) {
      await query(
        'UPDATE clientes SET total_compras = total_compras + ? WHERE id = ?',
        [total, cliente_id]
      );
    }

    // Buscar venda criada
    const [venda] = await query(
      `SELECT v.*, c.nome as cliente_nome, c.email as cliente_email, u.nome as vendedor_nome
       FROM vendas v 
       LEFT JOIN clientes c ON v.cliente_id = c.id 
       LEFT JOIN usuarios u ON v.usuario_id = u.id
       WHERE v.id = ?`,
      [vendaId]
    );

    res.status(201).json({
      message: 'Venda criada com sucesso',
      venda
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
        COUNT(CASE WHEN status = 'pago' THEN 1 END) as vendas_pagas,
        COUNT(CASE WHEN status = 'pendente' THEN 1 END) as vendas_pendentes,
        COALESCE(SUM(CASE WHEN status = 'pago' THEN total ELSE 0 END), 0) as receita_total,
        COALESCE(AVG(CASE WHEN status = 'pago' THEN total ELSE NULL END), 0) as ticket_medio
      FROM vendas 
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
