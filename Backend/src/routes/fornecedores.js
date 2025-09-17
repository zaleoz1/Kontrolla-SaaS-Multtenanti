import express from 'express';
import { query, queryWithResult } from '../database/connection.js';
import { validateFornecedor, validateId, validatePagination, validateSearch, handleValidationErrors } from '../middleware/validation.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Aplicar autenticação em todas as rotas exceto busca de CEP
router.use((req, res, next) => {
  // Permitir acesso sem autenticação para busca de CEP
  if (req.path.includes('/buscar/cep/')) {
    return next();
  }
  // Aplicar autenticação para todas as outras rotas
  return authenticateToken(req, res, next);
});

// Listar fornecedores com paginação e busca
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, q = '', filtroStatus = 'todos' } = req.query;
    
    // Validar parâmetros manualmente
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const offset = (pageNum - 1) * limitNum;
    
    // Verificar se req.user existe
    if (!req.user || !req.user.tenant_id) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não autenticado'
      });
    }
    
    const tenantId = req.user.tenant_id;

    console.log('🔍 Parâmetros da query:', { page: pageNum, limit: limitNum, offset, tenantId, q, filtroStatus });

    // Buscar fornecedores - query simplificada
    let fornecedoresQuery = `
      SELECT 
        f.id,
        f.nome,
        f.razao_social,
        f.cnpj,
        f.email,
        f.telefone,
        f.endereco,
        f.cidade,
        f.estado,
        f.cep,
        f.contato,
        f.observacoes,
        f.status,
        f.data_criacao,
        f.data_atualizacao
      FROM fornecedores f
      WHERE f.tenant_id = ?
    `;

    let params = [tenantId];

    // Adicionar busca se necessário
    if (q && q.trim()) {
      fornecedoresQuery += ` AND (f.nome LIKE ? OR f.razao_social LIKE ? OR f.cnpj LIKE ?)`;
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }

    // Adicionar filtro de status se necessário
    if (filtroStatus && filtroStatus !== 'todos') {
      fornecedoresQuery += ` AND f.status = ?`;
      params.push(filtroStatus);
    }

    fornecedoresQuery += ` ORDER BY f.nome ASC LIMIT ${limitNum} OFFSET ${offset}`;

    console.log('🔍 Query SQL:', fornecedoresQuery);
    console.log('🔍 Parâmetros finais:', params);
    
    const fornecedores = await query(fornecedoresQuery, params);

    // Contar total de fornecedores
    let countQuery = `
      SELECT COUNT(*) as total
      FROM fornecedores f
      WHERE f.tenant_id = ?
    `;
    
    let countParams = [tenantId];
    
    // Adicionar busca se necessário
    if (q && q.trim()) {
      countQuery += ` AND (f.nome LIKE ? OR f.razao_social LIKE ? OR f.cnpj LIKE ?)`;
      countParams.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }

    // Adicionar filtro de status se necessário
    if (filtroStatus && filtroStatus !== 'todos') {
      countQuery += ` AND f.status = ?`;
      countParams.push(filtroStatus);
    }
    
    const [{ total }] = await query(countQuery, countParams);

    res.json({
      success: true,
      data: fornecedores,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar fornecedores:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Buscar fornecedor por ID
router.get('/:id', validateId, async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenant_id;

    const fornecedorQuery = `
      SELECT 
        f.id,
        f.nome,
        f.razao_social,
        f.cnpj,
        f.email,
        f.telefone,
        f.endereco,
        f.cidade,
        f.estado,
        f.cep,
        f.contato,
        f.observacoes,
        f.status,
        f.data_criacao,
        f.data_atualizacao
      FROM fornecedores f
      WHERE f.id = ? AND f.tenant_id = ?
    `;

    const fornecedores = await query(fornecedorQuery, [id, tenantId]);

    if (fornecedores.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Fornecedor não encontrado'
      });
    }

    res.json({
      success: true,
      data: fornecedores[0]
    });
  } catch (error) {
    console.error('Erro ao buscar fornecedor:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Criar novo fornecedor
router.post('/', validateFornecedor, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const {
      nome,
      razao_social,
      cnpj,
      email,
      telefone,
      endereco,
      cidade,
      estado,
      cep,
      contato,
      observacoes,
      status = 'ativo'
    } = req.body;

    // Verificar se CNPJ já existe (se fornecido)
    if (cnpj) {
      const cnpjExistsQuery = `
        SELECT id FROM fornecedores 
        WHERE cnpj = ? AND tenant_id = ?
      `;
      const existingCnpj = await query(cnpjExistsQuery, [cnpj, tenantId]);
      
      if (existingCnpj.length > 0) {
        return res.status(409).json({
          success: false,
          error: 'CNPJ já cadastrado para outro fornecedor'
        });
      }
    }

    // Verificar se email já existe (se fornecido)
    if (email) {
      const emailExistsQuery = `
        SELECT id FROM fornecedores 
        WHERE email = ? AND tenant_id = ?
      `;
      const existingEmail = await query(emailExistsQuery, [email, tenantId]);
      
      if (existingEmail.length > 0) {
        return res.status(409).json({
          success: false,
          error: 'Email já cadastrado para outro fornecedor'
        });
      }
    }

    const insertQuery = `
      INSERT INTO fornecedores (
        tenant_id, nome, razao_social, cnpj, email, telefone,
        endereco, cidade, estado, cep, contato, observacoes, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await queryWithResult(insertQuery, [
      tenantId, nome, razao_social || null, cnpj || null, email || null,
      telefone || null, endereco || null, cidade || null, estado || null,
      cep || null, contato || null, observacoes || null, status
    ]);

    // Buscar o fornecedor criado
    const fornecedorQuery = `
      SELECT 
        f.id,
        f.nome,
        f.razao_social,
        f.cnpj,
        f.email,
        f.telefone,
        f.endereco,
        f.cidade,
        f.estado,
        f.cep,
        f.contato,
        f.observacoes,
        f.status,
        f.data_criacao,
        f.data_atualizacao
      FROM fornecedores f
      WHERE f.id = ?
    `;

    const [fornecedor] = await query(fornecedorQuery, [result.insertId]);

    res.status(201).json({
      success: true,
      data: fornecedor,
      message: 'Fornecedor criado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao criar fornecedor:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Atualizar fornecedor
router.put('/:id', validateId, validateFornecedor, async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenant_id;
    const {
      nome,
      razao_social,
      cnpj,
      email,
      telefone,
      endereco,
      cidade,
      estado,
      cep,
      contato,
      observacoes,
      status
    } = req.body;

    // Verificar se fornecedor existe
    const fornecedorExistsQuery = `
      SELECT id FROM fornecedores 
      WHERE id = ? AND tenant_id = ?
    `;
    const existingFornecedor = await query(fornecedorExistsQuery, [id, tenantId]);

    if (existingFornecedor.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Fornecedor não encontrado'
      });
    }

    // Verificar se CNPJ já existe em outro fornecedor (se fornecido)
    if (cnpj) {
      const cnpjExistsQuery = `
        SELECT id FROM fornecedores 
        WHERE cnpj = ? AND tenant_id = ? AND id != ?
      `;
      const existingCnpj = await query(cnpjExistsQuery, [cnpj, tenantId, id]);
      
      if (existingCnpj.length > 0) {
        return res.status(409).json({
          success: false,
          error: 'CNPJ já cadastrado para outro fornecedor'
        });
      }
    }

    // Verificar se email já existe em outro fornecedor (se fornecido)
    if (email) {
      const emailExistsQuery = `
        SELECT id FROM fornecedores 
        WHERE email = ? AND tenant_id = ? AND id != ?
      `;
      const existingEmail = await query(emailExistsQuery, [email, tenantId, id]);
      
      if (existingEmail.length > 0) {
        return res.status(409).json({
          success: false,
          error: 'Email já cadastrado para outro fornecedor'
        });
      }
    }

    const updateQuery = `
      UPDATE fornecedores SET
        nome = ?,
        razao_social = ?,
        cnpj = ?,
        email = ?,
        telefone = ?,
        endereco = ?,
        cidade = ?,
        estado = ?,
        cep = ?,
        contato = ?,
        observacoes = ?,
        status = ?,
        data_atualizacao = CURRENT_TIMESTAMP
      WHERE id = ? AND tenant_id = ?
    `;

    await query(updateQuery, [
      nome, razao_social || null, cnpj || null, email || null,
      telefone || null, endereco || null, cidade || null, estado || null,
      cep || null, contato || null, observacoes || null, status,
      id, tenantId
    ]);

    // Buscar o fornecedor atualizado
    const fornecedorQuery = `
      SELECT 
        f.id,
        f.nome,
        f.razao_social,
        f.cnpj,
        f.email,
        f.telefone,
        f.endereco,
        f.cidade,
        f.estado,
        f.cep,
        f.contato,
        f.observacoes,
        f.status,
        f.data_criacao,
        f.data_atualizacao
      FROM fornecedores f
      WHERE f.id = ? AND f.tenant_id = ?
    `;

    const [fornecedor] = await query(fornecedorQuery, [id, tenantId]);

    res.json({
      success: true,
      data: fornecedor,
      message: 'Fornecedor atualizado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao atualizar fornecedor:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Excluir fornecedor
router.delete('/:id', validateId, async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenant_id;

    // Verificar se fornecedor existe
    const fornecedorExistsQuery = `
      SELECT id FROM fornecedores 
      WHERE id = ? AND tenant_id = ?
    `;
    const existingFornecedor = await query(fornecedorExistsQuery, [id, tenantId]);

    if (existingFornecedor.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Fornecedor não encontrado'
      });
    }

    // Verificar se fornecedor está sendo usado em produtos
    const produtosQuery = `
      SELECT COUNT(*) as count FROM produtos 
      WHERE fornecedor_id = ? AND tenant_id = ?
    `;
    const [{ count }] = await query(produtosQuery, [id, tenantId]);

    if (count > 0) {
      return res.status(409).json({
        success: false,
        error: 'Não é possível excluir fornecedor que possui produtos associados'
      });
    }

    // Verificar se fornecedor está sendo usado em contas a pagar
    const contasPagarQuery = `
      SELECT COUNT(*) as count FROM contas_pagar 
      WHERE fornecedor_id = ? AND tenant_id = ?
    `;
    const [{ count: contasCount }] = await query(contasPagarQuery, [id, tenantId]);

    if (contasCount > 0) {
      return res.status(409).json({
        success: false,
        error: 'Não é possível excluir fornecedor que possui contas a pagar associadas'
      });
    }

    const deleteQuery = `
      DELETE FROM fornecedores 
      WHERE id = ? AND tenant_id = ?
    `;

    await query(deleteQuery, [id, tenantId]);

    res.json({
      success: true,
      message: 'Fornecedor excluído com sucesso'
    });
  } catch (error) {
    console.error('Erro ao excluir fornecedor:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Buscar CEP (endpoint auxiliar)
router.get('/buscar/cep/:cep', async (req, res) => {
  try {
    const { cep } = req.params;
    const cepLimpo = cep.replace(/\D/g, '');

    if (cepLimpo.length !== 8) {
      return res.status(400).json({
        success: false,
        error: 'CEP deve ter 8 dígitos'
      });
    }

    // Fazer requisição para ViaCEP
    const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
    
    if (!response.ok) {
      return res.status(500).json({
        success: false,
        error: 'Erro ao consultar CEP'
      });
    }

    const data = await response.json();

    if (data.erro) {
      return res.status(404).json({
        success: false,
        error: 'CEP não encontrado'
      });
    }

    res.json({
      success: true,
      data: {
        endereco: `${data.logradouro}, ${data.bairro}`,
        cidade: data.localidade,
        estado: data.uf
      }
    });
  } catch (error) {
    console.error('Erro ao buscar CEP:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar CEP'
    });
  }
});

export default router;
