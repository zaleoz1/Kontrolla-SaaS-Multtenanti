import express from 'express';
import { query, queryWithResult } from '../database/connection.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateCliente, validateId, validatePagination, validateSearch, handleValidationErrors } from '../middleware/validation.js';

const router = express.Router();

// Aplicar autenticação em todas as rotas
router.use(authenticateToken);

// Listar clientes com paginação e busca
router.get('/', validatePagination, validateSearch, handleValidationErrors, async (req, res) => {
  try {
    const { page = 1, limit = 10, q = '', status = '' } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE tenant_id = ?';
    let params = [req.user.tenant_id];

    // Adicionar filtro de busca
    if (q) {
      whereClause += ' AND (nome LIKE ? OR email LIKE ? OR telefone LIKE ? OR cpf_cnpj LIKE ?)';
      const searchTerm = `%${q}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    // Adicionar filtro de status
    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }

    // Buscar clientes
    const clientes = await query(
      `SELECT * FROM clientes ${whereClause} ORDER BY nome ASC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    // Contar total de registros
    const [totalResult] = await query(
      `SELECT COUNT(*) as total FROM clientes ${whereClause}`,
      params
    );

    const total = totalResult.total;
    const totalPages = Math.ceil(total / limit);

    res.json({
      clientes,
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
    console.error('Erro ao listar clientes:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Buscar cliente por ID
router.get('/:id', validateId, handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;

    const clientes = await query(
      'SELECT * FROM clientes WHERE id = ? AND tenant_id = ?',
      [id, req.user.tenant_id]
    );

    if (clientes.length === 0) {
      return res.status(404).json({
        error: 'Cliente não encontrado'
      });
    }

    res.json({
      cliente: clientes[0]
    });
  } catch (error) {
    console.error('Erro ao buscar cliente:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Criar novo cliente
router.post('/', validateCliente, async (req, res) => {
  try {
    const {
      nome,
      email,
      telefone,
      cpf_cnpj,
      tipo_pessoa = 'fisica',
      endereco,
      cidade,
      estado,
      cep,
      data_nascimento,
      sexo,
      razao_social,
      inscricao_estadual,
      inscricao_municipal,
      nome_fantasia,
      observacoes,
      status = 'ativo',
      vip = false,
      limite_credito = 0
    } = req.body;

    // Verificar se já existe cliente com mesmo CPF/CNPJ
    if (cpf_cnpj) {
      const existingClientes = await query(
        'SELECT id FROM clientes WHERE cpf_cnpj = ? AND tenant_id = ?',
        [cpf_cnpj, req.user.tenant_id]
      );

      if (existingClientes.length > 0) {
        return res.status(409).json({
          error: 'Já existe um cliente com este CPF/CNPJ'
        });
      }
    }

    // Verificar se já existe cliente com mesmo email
    if (email) {
      const existingClientes = await query(
        'SELECT id FROM clientes WHERE email = ? AND tenant_id = ?',
        [email, req.user.tenant_id]
      );

      if (existingClientes.length > 0) {
        return res.status(409).json({
          error: 'Já existe um cliente com este email'
        });
      }
    }

    const result = await queryWithResult(
      `INSERT INTO clientes (
        tenant_id, nome, email, telefone, cpf_cnpj, tipo_pessoa, endereco,
        cidade, estado, cep, data_nascimento, sexo, razao_social,
        inscricao_estadual, inscricao_municipal, nome_fantasia, observacoes,
        status, vip, limite_credito
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.tenant_id, nome, email, telefone, cpf_cnpj, tipo_pessoa,
        endereco, cidade, estado, cep, data_nascimento, sexo, razao_social,
        inscricao_estadual, inscricao_municipal, nome_fantasia, observacoes,
        status, vip, limite_credito
      ]
    );

    // Buscar cliente criado
    const [cliente] = await query(
      'SELECT * FROM clientes WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      message: 'Cliente criado com sucesso',
      cliente
    });
  } catch (error) {
    console.error('Erro ao criar cliente:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Atualizar cliente
router.put('/:id', validateId, validateCliente, handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nome,
      email,
      telefone,
      cpf_cnpj,
      tipo_pessoa,
      endereco,
      cidade,
      estado,
      cep,
      data_nascimento,
      sexo,
      razao_social,
      inscricao_estadual,
      inscricao_municipal,
      nome_fantasia,
      observacoes,
      status,
      vip,
      limite_credito
    } = req.body;

    // Verificar se cliente existe
    const existingClientes = await query(
      'SELECT id FROM clientes WHERE id = ? AND tenant_id = ?',
      [id, req.user.tenant_id]
    );

    if (existingClientes.length === 0) {
      return res.status(404).json({
        error: 'Cliente não encontrado'
      });
    }

    // Verificar duplicação de CPF/CNPJ
    if (cpf_cnpj) {
      const duplicateClientes = await query(
        'SELECT id FROM clientes WHERE cpf_cnpj = ? AND tenant_id = ? AND id != ?',
        [cpf_cnpj, req.user.tenant_id, id]
      );

      if (duplicateClientes.length > 0) {
        return res.status(409).json({
          error: 'Já existe um cliente com este CPF/CNPJ'
        });
      }
    }

    // Verificar duplicação de email
    if (email) {
      const duplicateClientes = await query(
        'SELECT id FROM clientes WHERE email = ? AND tenant_id = ? AND id != ?',
        [email, req.user.tenant_id, id]
      );

      if (duplicateClientes.length > 0) {
        return res.status(409).json({
          error: 'Já existe um cliente com este email'
        });
      }
    }

    await query(
      `UPDATE clientes SET 
        nome = ?, email = ?, telefone = ?, cpf_cnpj = ?, tipo_pessoa = ?,
        endereco = ?, cidade = ?, estado = ?, cep = ?, data_nascimento = ?,
        sexo = ?, razao_social = ?, inscricao_estadual = ?, inscricao_municipal = ?,
        nome_fantasia = ?, observacoes = ?, status = ?, vip = ?, limite_credito = ?
      WHERE id = ? AND tenant_id = ?`,
      [
        nome, email, telefone, cpf_cnpj, tipo_pessoa, endereco, cidade, estado,
        cep, data_nascimento, sexo, razao_social, inscricao_estadual,
        inscricao_municipal, nome_fantasia, observacoes, status, vip,
        limite_credito, id, req.user.tenant_id
      ]
    );

    // Buscar cliente atualizado
    const [cliente] = await query(
      'SELECT * FROM clientes WHERE id = ?',
      [id]
    );

    res.json({
      message: 'Cliente atualizado com sucesso',
      cliente
    });
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Deletar cliente
router.delete('/:id', validateId, handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se cliente existe
    const existingClientes = await query(
      'SELECT id FROM clientes WHERE id = ? AND tenant_id = ?',
      [id, req.user.tenant_id]
    );

    if (existingClientes.length === 0) {
      return res.status(404).json({
        error: 'Cliente não encontrado'
      });
    }

    // Verificar se cliente tem vendas associadas
    const vendas = await query(
      'SELECT id FROM vendas WHERE cliente_id = ? AND tenant_id = ?',
      [id, req.user.tenant_id]
    );

    if (vendas.length > 0) {
      return res.status(400).json({
        error: 'Não é possível deletar cliente com vendas associadas'
      });
    }

    await query(
      'DELETE FROM clientes WHERE id = ? AND tenant_id = ?',
      [id, req.user.tenant_id]
    );

    res.json({
      message: 'Cliente deletado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao deletar cliente:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Estatísticas dos clientes
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = await query(
      `SELECT 
        COUNT(*) as total_clientes,
        COUNT(CASE WHEN status = 'ativo' THEN 1 END) as clientes_ativos,
        COUNT(CASE WHEN vip = 1 THEN 1 END) as clientes_vip,
        COALESCE(SUM(total_compras), 0) as receita_total
      FROM clientes 
      WHERE tenant_id = ?`,
      [req.user.tenant_id]
    );

    res.json({
      stats: stats[0]
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas dos clientes:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

export default router;
