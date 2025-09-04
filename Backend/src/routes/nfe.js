import express from 'express';
import { query, queryWithResult } from '../database/connection.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateId, validatePagination, validateSearch, handleValidationErrors } from '../middleware/validation.js';

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
      whereClause += ' AND (n.numero LIKE ? OR c.nome LIKE ? OR c.cnpj_cpf LIKE ?)';
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
      `SELECT n.*, c.nome as cliente_nome, c.cnpj_cpf as cliente_cnpj_cpf
       FROM nfe n 
       LEFT JOIN clientes c ON n.cliente_id = c.id 
       ${whereClause} 
       ORDER BY n.data_emissao DESC 
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    // Contar total de registros
    const [totalResult] = await query(
      `SELECT COUNT(*) as total FROM nfe n ${whereClause}`,
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

// Buscar NF-e por ID
router.get('/:id', validateId, handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar NF-e
    const nfes = await query(
      `SELECT n.*, c.nome as cliente_nome, c.cnpj_cpf as cliente_cnpj_cpf
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

    // Gerar número da NF-e
    const numeroNfe = await gerarNumeroNfe(req.user.tenant_id);

    // Criar NF-e
    const result = await queryWithResult(
      `INSERT INTO nfe (
        tenant_id, venda_id, cliente_id, cnpj_cpf, numero, serie, valor_total,
        status, ambiente, observacoes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.tenant_id, venda_id, cliente_id, cnpj_cpf, numeroNfe, '001',
        valorTotal, 'pendente', 'homologacao', observacoes
      ]
    );

    const nfeId = result.insertId;

    // Inserir itens da NF-e
    for (const item of itens) {
      await query(
        `INSERT INTO nfe_itens (nfe_id, produto_id, quantidade, preco_unitario, preco_total)
         VALUES (?, ?, ?, ?, ?)`,
        [
          nfeId, item.produto_id, item.quantidade, item.preco_unitario,
          item.quantidade * item.preco_unitario
        ]
      );
    }

    // Buscar NF-e criada
    const [nfe] = await query(
      `SELECT n.*, c.nome as cliente_nome, c.cnpj_cpf as cliente_cnpj_cpf
       FROM nfe n 
       LEFT JOIN clientes c ON n.cliente_id = c.id 
       WHERE n.id = ?`,
      [nfeId]
    );

    res.status(201).json({
      message: 'NF-e criada com sucesso',
      nfe
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

// Estatísticas das NF-e
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

// Função auxiliar para gerar número da NF-e
async function gerarNumeroNfe(tenantId) {
  const result = await query(
    'SELECT MAX(CAST(numero AS UNSIGNED)) as ultimo_numero FROM nfe WHERE tenant_id = ?',
    [tenantId]
  );

  const ultimoNumero = result[0]?.ultimo_numero || 0;
  const proximoNumero = ultimoNumero + 1;
  
  return proximoNumero.toString().padStart(9, '0');
}

export default router;
