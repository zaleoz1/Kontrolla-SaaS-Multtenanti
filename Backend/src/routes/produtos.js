import express from 'express';
import { query, queryWithResult } from '../database/connection.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateProduto, validateId, validatePagination, validateSearch, handleValidationErrors } from '../middleware/validation.js';
import { uploadImagensProduto, deleteImagensProduto } from '../services/uploadService.js';
import NotificationService from '../services/notificationService.js';

const router = express.Router();

// Aplicar autenticação em todas as rotas
router.use(authenticateToken);

// Listar produtos com paginação e busca
router.get('/', validatePagination, validateSearch, handleValidationErrors, async (req, res) => {
  try {
    const { page = 1, limit = 10, q = '', status = '', categoria_id = '' } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE p.tenant_id = ?';
    let params = [req.user.tenant_id];

    // Adicionar filtro de busca
    if (q) {
      whereClause += ' AND (p.nome LIKE ? OR p.descricao LIKE ? OR p.codigo_barras LIKE ? OR p.sku LIKE ?)';
      const searchTerm = `%${q}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    // Adicionar filtro de status
    if (status) {
      whereClause += ' AND p.status = ?';
      params.push(status);
    }

    // Adicionar filtro de categoria
    if (categoria_id) {
      whereClause += ' AND p.categoria_id = ?';
      params.push(categoria_id);
    }

    // Buscar produtos com informações da categoria
    const produtos = await query(
      `SELECT p.*, c.nome as categoria_nome,
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
       ORDER BY p.nome ASC 
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
    console.error('Erro ao listar produtos:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Buscar produto por ID
router.get('/:id', validateId, handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;

    const produtos = await query(
      `SELECT p.*, c.nome as categoria_nome,
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
       WHERE p.id = ? AND p.tenant_id = ?`,
      [id, req.user.tenant_id]
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
    console.error('Erro ao buscar produto:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Criar novo produto
router.post('/', validateProduto, async (req, res) => {
  try {
    // Debug: Log dos dados recebidos
    console.log('📦 Dados recebidos para criação de produto:');
    console.log('Body:', JSON.stringify(req.body, null, 2));
    console.log('User:', req.user);
    const {
      categoria_id,
      nome,
      descricao,
      codigo_barras,
      sku,
      preco,
      preco_promocional,
      tipo_preco = 'unidade',
      estoque = 0,
      estoque_minimo = 0,
      estoque_kg = 0,
      estoque_litros = 0,
      estoque_minimo_kg = 0,
      estoque_minimo_litros = 0,
      fornecedor_id,
      marca,
      modelo,
      status = 'ativo',
      destaque = false,
      imagens = []
    } = req.body;

    // Garantir que estoque e estoque_minimo sejam sempre inteiros
    const estoqueInt = Math.round(parseFloat(estoque) || 0);
    const estoqueMinimoInt = Math.round(parseFloat(estoque_minimo) || 0);
    
    // Processar estoque decimal baseado no tipo
    const estoqueKgDecimal = parseFloat(estoque_kg) || 0;
    const estoqueLitrosDecimal = parseFloat(estoque_litros) || 0;
    const estoqueMinimoKgDecimal = parseFloat(estoque_minimo_kg) || 0;
    const estoqueMinimoLitrosDecimal = parseFloat(estoque_minimo_litros) || 0;

    // Preparar valores para preco_por_kg e preco_por_litros baseado no tipo_preco
    let preco_por_kg = null;
    let preco_por_litros = null;
    
    if (tipo_preco === 'kg') {
      preco_por_kg = preco;
      console.log('🔍 Produto por KG - preco_por_kg:', preco_por_kg);
    } else if (tipo_preco === 'litros') {
      preco_por_litros = preco;
      console.log('🔍 Produto por Litros - preco_por_litros:', preco_por_litros);
    }
    
    console.log('🔍 Valores finais - tipo_preco:', tipo_preco, 'preco_por_kg:', preco_por_kg, 'preco_por_litros:', preco_por_litros);

    // Verificar se categoria existe (se fornecida)
    if (categoria_id) {
      const categorias = await query(
        'SELECT id FROM categorias WHERE id = ? AND tenant_id = ?',
        [categoria_id, req.user.tenant_id]
      );

      if (categorias.length === 0) {
        return res.status(400).json({
          error: 'Categoria não encontrada'
        });
      }
    }

    // Verificar se já existe produto com mesmo código de barras
    if (codigo_barras) {
      const existingProdutos = await query(
        'SELECT id FROM produtos WHERE codigo_barras = ? AND tenant_id = ?',
        [codigo_barras, req.user.tenant_id]
      );

      if (existingProdutos.length > 0) {
        return res.status(409).json({
          error: 'Já existe um produto com este código de barras'
        });
      }
    }

    // Verificar se já existe produto com mesmo SKU
    if (sku) {
      const existingProdutos = await query(
        'SELECT id FROM produtos WHERE sku = ? AND tenant_id = ?',
        [sku, req.user.tenant_id]
      );

      if (existingProdutos.length > 0) {
        return res.status(409).json({
          error: 'Já existe um produto com este SKU'
        });
      }
    }

    // Primeiro, criar o produto sem imagens
    const result = await queryWithResult(
      `INSERT INTO produtos (
        tenant_id, categoria_id, nome, descricao, codigo_barras, sku, preco,
        preco_promocional, tipo_preco, preco_por_kg, preco_por_litros, estoque, 
        estoque_minimo, estoque_kg, estoque_litros, estoque_minimo_kg, 
        estoque_minimo_litros, fornecedor_id, marca, modelo, status, destaque, imagens
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.tenant_id, categoria_id, nome, descricao, codigo_barras, sku,
        preco, preco_promocional, tipo_preco, preco_por_kg, preco_por_litros, 
        estoqueInt, estoqueMinimoInt, estoqueKgDecimal, estoqueLitrosDecimal,
        estoqueMinimoKgDecimal, estoqueMinimoLitrosDecimal, fornecedor_id, marca, modelo, status, destaque, JSON.stringify([])
      ]
    );

    const produtoId = result.insertId;
    let imagensCloudinary = [];

    // Se há imagens, fazer upload para Cloudinary
    if (imagens && imagens.length > 0) {
      console.log('📸 Fazendo upload de imagens para Cloudinary...');
      const uploadResult = await uploadImagensProduto(imagens, produtoId, req.user.tenant_id);
      
      if (uploadResult.success) {
        imagensCloudinary = uploadResult.imagens.map(img => img.url);
        
        // Atualizar produto com URLs das imagens do Cloudinary
        await query(
          'UPDATE produtos SET imagens = ? WHERE id = ?',
          [JSON.stringify(imagensCloudinary), produtoId]
        );
        
        console.log('✅ Imagens enviadas para Cloudinary:', imagensCloudinary.length);
      } else {
        console.error('❌ Erro no upload das imagens:', uploadResult.error);
        // Continuar mesmo com erro no upload das imagens
      }
    }

    // Buscar produto criado
    const [produto] = await query(
      `SELECT p.*, c.nome as categoria_nome,
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
       WHERE p.id = ?`,
      [produtoId]
    );

    // Criar notificação do novo produto
    try {
      await NotificationService.notifyNewProduct(req.user.tenant_id, produtoId, nome);
    } catch (notificationError) {
      console.error('Erro ao criar notificação do produto:', notificationError);
      // Não falhar a criação do produto por causa da notificação
    }

    res.status(201).json({
      message: 'Produto criado com sucesso',
      produto: {
        ...produto,
        imagens: imagensCloudinary.length > 0 ? imagensCloudinary : JSON.parse(produto.imagens || '[]')
      }
    });
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Atualizar produto
router.put('/:id', validateId, validateProduto, handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      categoria_id,
      nome,
      descricao,
      codigo_barras,
      sku,
      preco,
      preco_promocional,
      tipo_preco,
      estoque,
      estoque_minimo,
      estoque_kg,
      estoque_litros,
      estoque_minimo_kg,
      estoque_minimo_litros,
      fornecedor_id,
      marca,
      modelo,
      status,
      destaque,
      imagens
    } = req.body;

    // Garantir que estoque e estoque_minimo sejam sempre inteiros
    const estoqueInt = Math.round(parseFloat(estoque) || 0);
    const estoqueMinimoInt = Math.round(parseFloat(estoque_minimo) || 0);
    
    // Processar estoque decimal baseado no tipo
    const estoqueKgDecimal = parseFloat(estoque_kg) || 0;
    const estoqueLitrosDecimal = parseFloat(estoque_litros) || 0;
    const estoqueMinimoKgDecimal = parseFloat(estoque_minimo_kg) || 0;
    const estoqueMinimoLitrosDecimal = parseFloat(estoque_minimo_litros) || 0;

    // Preparar valores para preco_por_kg e preco_por_litros baseado no tipo_preco
    let preco_por_kg = null;
    let preco_por_litros = null;
    
    if (tipo_preco === 'kg') {
      preco_por_kg = preco;
      console.log('🔍 Atualização - Produto por KG - preco_por_kg:', preco_por_kg);
    } else if (tipo_preco === 'litros') {
      preco_por_litros = preco;
      console.log('🔍 Atualização - Produto por Litros - preco_por_litros:', preco_por_litros);
    }
    
    console.log('🔍 Atualização - Valores finais - tipo_preco:', tipo_preco, 'preco_por_kg:', preco_por_kg, 'preco_por_litros:', preco_por_litros);

    // Verificar se produto existe
    const existingProdutos = await query(
      'SELECT id FROM produtos WHERE id = ? AND tenant_id = ?',
      [id, req.user.tenant_id]
    );

    if (existingProdutos.length === 0) {
      return res.status(404).json({
        error: 'Produto não encontrado'
      });
    }

    // Verificar se categoria existe (se fornecida)
    if (categoria_id) {
      const categorias = await query(
        'SELECT id FROM categorias WHERE id = ? AND tenant_id = ?',
        [categoria_id, req.user.tenant_id]
      );

      if (categorias.length === 0) {
        return res.status(400).json({
          error: 'Categoria não encontrada'
        });
      }
    }

    // Verificar duplicação de código de barras
    if (codigo_barras) {
      const duplicateProdutos = await query(
        'SELECT id FROM produtos WHERE codigo_barras = ? AND tenant_id = ? AND id != ?',
        [codigo_barras, req.user.tenant_id, id]
      );

      if (duplicateProdutos.length > 0) {
        return res.status(409).json({
          error: 'Já existe um produto com este código de barras'
        });
      }
    }

    // Verificar duplicação de SKU
    if (sku) {
      const duplicateProdutos = await query(
        'SELECT id FROM produtos WHERE sku = ? AND tenant_id = ? AND id != ?',
        [sku, req.user.tenant_id, id]
      );

      if (duplicateProdutos.length > 0) {
        return res.status(409).json({
          error: 'Já existe um produto com este SKU'
        });
      }
    }

    // Buscar imagens atuais do produto
    const [produtoAtual] = await query(
      'SELECT imagens FROM produtos WHERE id = ? AND tenant_id = ?',
      [id, req.user.tenant_id]
    );

    let imagensAtuais = [];
    if (produtoAtual && produtoAtual.imagens) {
      try {
        imagensAtuais = JSON.parse(produtoAtual.imagens);
      } catch (e) {
        console.warn('Erro ao parsear imagens atuais:', e);
        imagensAtuais = [];
      }
    }

    let imagensCloudinary = imagensAtuais;

    // Se há novas imagens, fazer upload para Cloudinary
    if (imagens && imagens.length > 0) {
      console.log('📸 Fazendo upload de novas imagens para Cloudinary...');
      const uploadResult = await uploadImagensProduto(imagens, id, req.user.tenant_id);
      
      if (uploadResult.success) {
        imagensCloudinary = uploadResult.imagens.map(img => img.url);
        console.log('✅ Novas imagens enviadas para Cloudinary:', imagensCloudinary.length);
      } else {
        console.error('❌ Erro no upload das imagens:', uploadResult.error);
        // Manter imagens atuais em caso de erro
      }
    }

    await query(
      `UPDATE produtos SET 
        categoria_id = ?, nome = ?, descricao = ?, codigo_barras = ?, sku = ?,
        preco = ?, preco_promocional = ?, tipo_preco = ?, preco_por_kg = ?, 
        preco_por_litros = ?, estoque = ?, estoque_minimo = ?, estoque_kg = ?,
        estoque_litros = ?, estoque_minimo_kg = ?, estoque_minimo_litros = ?,
        fornecedor_id = ?, marca = ?, modelo = ?, status = ?, destaque = ?, imagens = ?
      WHERE id = ? AND tenant_id = ?`,
      [
        categoria_id, nome, descricao, codigo_barras, sku, preco, preco_promocional,
        tipo_preco, preco_por_kg, preco_por_litros, estoqueInt, estoqueMinimoInt,
        estoqueKgDecimal, estoqueLitrosDecimal, estoqueMinimoKgDecimal, 
        estoqueMinimoLitrosDecimal, fornecedor_id, marca, modelo, status, destaque, JSON.stringify(imagensCloudinary), id, req.user.tenant_id
      ]
    );

    // Buscar produto atualizado
    const [produto] = await query(
      `SELECT p.*, c.nome as categoria_nome,
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
       WHERE p.id = ?`,
      [id]
    );

    res.json({
      message: 'Produto atualizado com sucesso',
      produto: {
        ...produto,
        imagens: imagensCloudinary
      }
    });
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Deletar produto
router.delete('/:id', validateId, handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se produto existe
    const existingProdutos = await query(
      'SELECT id FROM produtos WHERE id = ? AND tenant_id = ?',
      [id, req.user.tenant_id]
    );

    if (existingProdutos.length === 0) {
      return res.status(404).json({
        error: 'Produto não encontrado'
      });
    }

    // Verificar se produto tem vendas associadas
    const vendas = await query(
      'SELECT id FROM venda_itens WHERE produto_id = ?',
      [id]
    );

    if (vendas.length > 0) {
      return res.status(400).json({
        error: 'Não é possível deletar produto com vendas associadas'
      });
    }

    // Buscar imagens do produto para deletar do Cloudinary
    const [produto] = await query(
      'SELECT imagens FROM produtos WHERE id = ? AND tenant_id = ?',
      [id, req.user.tenant_id]
    );

    if (produto && produto.imagens) {
      try {
        const imagens = JSON.parse(produto.imagens);
        if (imagens.length > 0) {
          console.log('🗑️ Deletando imagens do Cloudinary...');
          
          // Extrair public_ids das URLs do Cloudinary
          const publicIds = imagens
            .filter(url => url.includes('cloudinary.com'))
            .map(url => {
              const parts = url.split('/');
              const filename = parts[parts.length - 1];
              return filename.split('.')[0];
            });

          if (publicIds.length > 0) {
            const deleteResult = await deleteImagensProduto(publicIds);
            if (deleteResult.success) {
              console.log('✅ Imagens deletadas do Cloudinary:', publicIds.length);
            } else {
              console.error('❌ Erro ao deletar imagens do Cloudinary:', deleteResult.error);
            }
          }
        }
      } catch (e) {
        console.warn('Erro ao processar imagens para exclusão:', e);
      }
    }

    await query(
      'DELETE FROM produtos WHERE id = ? AND tenant_id = ?',
      [id, req.user.tenant_id]
    );

    res.json({
      message: 'Produto deletado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao deletar produto:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Buscar produto por código de barras
router.get('/buscar/codigo-barras/:codigo', async (req, res) => {
  try {
    const { codigo } = req.params;

    const produtos = await query(
      `SELECT p.*, c.nome as categoria_nome,
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
      [codigo, req.user.tenant_id]
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

// Estatísticas dos produtos
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = await query(
      `SELECT 
        COUNT(*) as total_produtos,
        COUNT(CASE WHEN status = 'ativo' THEN 1 END) as produtos_ativos,
        COUNT(CASE WHEN 
          (tipo_preco = 'unidade' AND estoque <= estoque_minimo) OR
          (tipo_preco = 'kg' AND estoque_kg <= estoque_minimo_kg) OR
          (tipo_preco = 'litros' AND estoque_litros <= estoque_minimo_litros)
        THEN 1 END) as estoque_baixo,
        COUNT(CASE WHEN 
          (tipo_preco = 'unidade' AND estoque = 0) OR
          (tipo_preco = 'kg' AND estoque_kg = 0) OR
          (tipo_preco = 'litros' AND estoque_litros = 0)
        THEN 1 END) as sem_estoque,
        COALESCE(SUM(
          CASE 
            WHEN tipo_preco = 'kg' THEN estoque_kg * preco_por_kg
            WHEN tipo_preco = 'litros' THEN estoque_litros * preco_por_litros
            ELSE estoque * preco
          END
        ), 0) as valor_total_estoque
      FROM produtos 
      WHERE tenant_id = ?`,
      [req.user.tenant_id]
    );

    res.json({
      stats: stats[0]
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas dos produtos:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Produtos com estoque baixo
router.get('/estoque/baixo', async (req, res) => {
  try {
    const produtos = await query(
      `SELECT p.*, c.nome as categoria_nome,
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
       ORDER BY estoque_atual ASC`,
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

export default router;
