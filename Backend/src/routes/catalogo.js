import express from 'express';
import { query, queryWithResult } from '../database/connection.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';
import { validatePagination, validateSearch, handleValidationErrors } from '../middleware/validation.js';

const router = express.Router();

// Aplicar autenticação opcional (para permitir acesso público ao catálogo)
router.use(optionalAuth);

// Listar produtos do catálogo público
router.get('/produtos', validatePagination, validateSearch, handleValidationErrors, async (req, res) => {
  try {
    const { page = 1, limit = 12, q = '', categoria_id = '', preco_min = '', preco_max = '' } = req.query;
    const offset = (page - 1) * limit;

    // Se não há usuário autenticado, usar tenant padrão ou permitir acesso público
    const tenantId = req.user?.tenant_id || 1; // Tenant padrão para catálogo público

    let whereClause = 'WHERE p.tenant_id = ? AND p.status = "ativo"';
    let params = [tenantId];

    // Adicionar filtro de busca
    if (q) {
      whereClause += ' AND (p.nome LIKE ? OR p.descricao LIKE ? OR p.codigo_barras LIKE ?)';
      const searchTerm = `%${q}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Adicionar filtro de categoria
    if (categoria_id) {
      whereClause += ' AND p.categoria_id = ?';
      params.push(categoria_id);
    }

    // Adicionar filtro de preço
    if (preco_min) {
      whereClause += ' AND p.preco >= ?';
      params.push(parseFloat(preco_min));
    }

    if (preco_max) {
      whereClause += ' AND p.preco <= ?';
      params.push(parseFloat(preco_max));
    }

    // Buscar produtos
    const produtos = await query(
      `SELECT 
        p.id, p.nome, p.descricao, p.preco, p.preco_promocional, p.estoque,
        p.tipo_preco, p.estoque_kg, p.estoque_litros, p.estoque_minimo,
        p.estoque_minimo_kg, p.estoque_minimo_litros,
        p.imagens, p.destaque, p.codigo_barras, p.sku,
        p.ncm, p.cfop, p.cst, p.icms_aliquota, p.icms_origem, p.icms_situacao_tributaria,
        p.ipi_aliquota, p.ipi_codigo_enquadramento, p.pis_aliquota, p.pis_cst,
        p.cofins_aliquota, p.cofins_cst,
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
       ${whereClause} 
       ORDER BY p.destaque DESC, p.nome ASC 
       LIMIT ${Number(limit)} OFFSET ${Number(offset)}`,
      params
    );

    // Contar total de registros
    const [totalResult] = await query(
      `SELECT COUNT(*) as total FROM produtos p ${whereClause}`,
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
      }
    });
  } catch (error) {
    console.error('Erro ao listar produtos do catálogo:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Buscar produto por ID no catálogo
router.get('/produtos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenant_id || 1;

    const produtos = await query(
      `SELECT 
        p.id, p.nome, p.descricao, p.preco, p.preco_promocional, p.estoque,
        p.tipo_preco, p.estoque_kg, p.estoque_litros, p.estoque_minimo,
        p.estoque_minimo_kg, p.estoque_minimo_litros,
        p.imagens, p.destaque, p.codigo_barras, p.sku, p.peso, p.largura,
        p.altura, p.comprimento, p.fornecedor, p.marca, p.modelo, p.garantia,
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
       WHERE p.id = ? AND p.tenant_id = ? AND p.status = 'ativo'`,
      [id, tenantId]
    );

    if (produtos.length === 0) {
      return res.status(404).json({
        error: 'Produto não encontrado'
      });
    }

    res.json({
      produto: produtos[0]
    });
  } catch (error) {
    console.error('Erro ao buscar produto do catálogo:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Listar categorias do catálogo
router.get('/categorias', async (req, res) => {
  try {
    const tenantId = req.user?.tenant_id || 1;

    const categorias = await query(
      `SELECT 
        c.id, c.nome, c.descricao,
        COUNT(p.id) as total_produtos
       FROM categorias c
       LEFT JOIN produtos p ON c.id = p.categoria_id AND p.status = 'ativo'
       WHERE c.tenant_id = ? AND c.status = 'ativo'
       GROUP BY c.id, c.nome, c.descricao
       ORDER BY c.nome ASC`,
      [tenantId]
    );

    res.json({
      categorias
    });
  } catch (error) {
    console.error('Erro ao listar categorias do catálogo:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Criar nova categoria (apenas para usuários autenticados)
router.post('/categorias', authenticateToken, async (req, res) => {
  try {
    const { nome, descricao = '' } = req.body;

    if (!nome || nome.trim().length === 0) {
      return res.status(400).json({
        error: 'Nome da categoria é obrigatório'
      });
    }

    // Verificar se já existe categoria com mesmo nome
    const existingCategorias = await query(
      'SELECT id FROM categorias WHERE nome = ? AND tenant_id = ?',
      [nome.trim(), req.user.tenant_id]
    );

    if (existingCategorias.length > 0) {
      return res.status(409).json({
        error: 'Já existe uma categoria com este nome'
      });
    }

    const result = await queryWithResult(
      `INSERT INTO categorias (tenant_id, nome, descricao, status) 
       VALUES (?, ?, ?, ?)`,
      [req.user.tenant_id, nome.trim(), descricao.trim(), 'ativo']
    );

    // Buscar categoria criada
    const [categoria] = await query(
      'SELECT id, nome, descricao, status FROM categorias WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      message: 'Categoria criada com sucesso',
      categoria
    });
  } catch (error) {
    console.error('Erro ao criar categoria:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Produtos em destaque
router.get('/destaques', async (req, res) => {
  try {
    const { limit = 8 } = req.query;
    const tenantId = req.user?.tenant_id || 1;

    const produtos = await query(
      `SELECT 
        p.id, p.nome, p.descricao, p.preco, p.preco_promocional, p.estoque,
        p.tipo_preco, p.estoque_kg, p.estoque_litros, p.estoque_minimo,
        p.estoque_minimo_kg, p.estoque_minimo_litros,
        p.imagens, p.destaque, p.codigo_barras, p.sku,
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
       WHERE p.tenant_id = ? AND p.status = 'ativo' AND p.destaque = 1
       ORDER BY p.nome ASC 
       LIMIT ?`,
      [tenantId, parseInt(limit)]
    );

    res.json({
      produtos
    });
  } catch (error) {
    console.error('Erro ao buscar produtos em destaque:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Produtos relacionados (mesma categoria)
router.get('/produtos/:id/relacionados', async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 4 } = req.query;
    const tenantId = req.user?.tenant_id || 1;

    // Buscar categoria do produto
    const produto = await query(
      'SELECT categoria_id FROM produtos WHERE id = ? AND tenant_id = ?',
      [id, tenantId]
    );

    if (produto.length === 0) {
      return res.status(404).json({
        error: 'Produto não encontrado'
      });
    }

    const categoriaId = produto[0].categoria_id;

    if (!categoriaId) {
      return res.json({
        produtos: []
      });
    }

    // Buscar produtos da mesma categoria
    const produtos = await query(
      `SELECT 
        p.id, p.nome, p.descricao, p.preco, p.preco_promocional, p.estoque,
        p.tipo_preco, p.estoque_kg, p.estoque_litros, p.estoque_minimo,
        p.estoque_minimo_kg, p.estoque_minimo_litros,
        p.imagens, p.destaque, p.codigo_barras, p.sku,
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
       WHERE p.tenant_id = ? AND p.status = 'ativo' AND p.categoria_id = ? AND p.id != ?
       ORDER BY p.destaque DESC, p.nome ASC 
       LIMIT ?`,
      [tenantId, categoriaId, id, parseInt(limit)]
    );

    res.json({
      produtos
    });
  } catch (error) {
    console.error('Erro ao buscar produtos relacionados:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Buscar produtos por código de barras (público)
router.get('/buscar/codigo-barras/:codigo', async (req, res) => {
  try {
    const { codigo } = req.params;
    const tenantId = req.user?.tenant_id || 1;

    const produtos = await query(
      `SELECT 
        p.id, p.nome, p.descricao, p.preco, p.preco_promocional, p.estoque,
        p.tipo_preco, p.estoque_kg, p.estoque_litros, p.estoque_minimo,
        p.estoque_minimo_kg, p.estoque_minimo_litros,
        p.imagens, p.destaque, p.codigo_barras, p.sku,
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
       WHERE p.codigo_barras = ? AND p.tenant_id = ? AND p.status = 'ativo'`,
      [codigo, tenantId]
    );

    if (produtos.length === 0) {
      return res.status(404).json({
        error: 'Produto não encontrado'
      });
    }

    res.json({
      produto: produtos[0]
    });
  } catch (error) {
    console.error('Erro ao buscar produto por código de barras:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Estatísticas do catálogo (apenas para usuários autenticados)
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const stats = await query(
      `SELECT 
        COUNT(*) as total_produtos,
        COUNT(CASE WHEN status = 'ativo' THEN 1 END) as produtos_ativos,
        COUNT(CASE WHEN destaque = 1 THEN 1 END) as produtos_destaque,
        COUNT(CASE WHEN estoque > 0 THEN 1 END) as produtos_com_estoque,
        COALESCE(AVG(preco), 0) as preco_medio
       FROM produtos 
       WHERE tenant_id = ?`,
      [req.user.tenant_id]
    );

    const categoriasStats = await query(
      `SELECT 
        COUNT(*) as total_categorias,
        COUNT(CASE WHEN status = 'ativo' THEN 1 END) as categorias_ativas
       FROM categorias 
       WHERE tenant_id = ?`,
      [req.user.tenant_id]
    );

    res.json({
      produtos: stats[0],
      categorias: categoriasStats[0]
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas do catálogo:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Configurações do catálogo (apenas para usuários autenticados)
router.get('/configuracoes', authenticateToken, async (req, res) => {
  try {
    const configuracoes = await query(
      `SELECT chave, valor, tipo 
       FROM tenant_configuracoes 
       WHERE tenant_id = ? AND chave LIKE 'catalogo_%'`,
      [req.user.tenant_id]
    );

    // Converter para objeto
    const config = {};
    configuracoes.forEach(item => {
      let valor = item.valor;
      
      // Converter valor baseado no tipo
      switch (item.tipo) {
        case 'number':
          valor = parseFloat(valor);
          break;
        case 'boolean':
          valor = valor === 'true';
          break;
        case 'json':
          try {
            valor = JSON.parse(valor);
          } catch (e) {
            valor = valor;
          }
          break;
        default:
          valor = valor;
      }
      
      config[item.chave.replace('catalogo_', '')] = valor;
    });

    res.json({
      configuracoes: config
    });
  } catch (error) {
    console.error('Erro ao buscar configurações do catálogo:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Atualizar configurações do catálogo (apenas para administradores)
router.put('/configuracoes', authenticateToken, async (req, res) => {
  try {
    const { configuracoes } = req.body;

    if (!configuracoes || typeof configuracoes !== 'object') {
      return res.status(400).json({
        error: 'Configurações inválidas'
      });
    }

    // Verificar se usuário é admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Acesso restrito a administradores'
      });
    }

    // Atualizar cada configuração
    for (const [chave, valor] of Object.entries(configuracoes)) {
      const chaveCompleta = `catalogo_${chave}`;
      const tipo = typeof valor === 'boolean' ? 'boolean' : 
                   typeof valor === 'number' ? 'number' :
                   typeof valor === 'object' ? 'json' : 'string';
      
      const valorString = tipo === 'json' ? JSON.stringify(valor) : String(valor);

      await query(
        `INSERT INTO tenant_configuracoes (tenant_id, chave, valor, tipo) 
         VALUES (?, ?, ?, ?) 
         ON DUPLICATE KEY UPDATE valor = VALUES(valor), tipo = VALUES(tipo)`,
        [req.user.tenant_id, chaveCompleta, valorString, tipo]
      );
    }

    res.json({
      message: 'Configurações do catálogo atualizadas com sucesso'
    });
  } catch (error) {
    console.error('Erro ao atualizar configurações do catálogo:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

export default router;
