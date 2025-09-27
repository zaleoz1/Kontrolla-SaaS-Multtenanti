import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { query, queryWithResult, transaction } from '../database/connection.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

// Função para gerar código único
function gerarCodigo() {
  const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let codigo = '';
  for (let i = 0; i < 8; i++) {
    codigo += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
  }
  return codigo;
}
import { 
  handleValidationErrors, 
  validateMetodoPagamento, 
  validateParcelaMetodoPagamento, 
  validateMetodosPagamentoLote,
  validateCreateAdministrador,
  validateUpdateAdministrador,
  validateSearchAdministradores
} from '../middleware/validation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configuração do multer para upload de arquivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads');
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos de imagem são permitidos'), false);
    }
  }
});

// Aplicar autenticação em todas as rotas
router.use(authenticateToken);

// Buscar dados do tenant
router.get('/tenant/:tenantId', async (req, res) => {
  try {
    const { tenantId } = req.params;

    // Verificar se o usuário tem acesso ao tenant
    if (req.user.tenant_id !== parseInt(tenantId)) {
      return res.status(403).json({
        error: 'Acesso negado ao tenant'
      });
    }

    const tenants = await query(
      'SELECT * FROM tenants WHERE id = ?',
      [tenantId]
    );

    if (tenants.length === 0) {
      return res.status(404).json({
        error: 'Tenant não encontrado'
      });
    }

    res.json({
      tenant: tenants[0]
    });
  } catch (error) {
    console.error('Erro ao buscar dados do tenant:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Atualizar dados do tenant
router.put('/tenant', requireAdmin, async (req, res) => {
  try {
    const {
      nome,
      cnpj,
      cpf,
      tipo_pessoa,
      email,
      telefone,
      endereco,
      cidade,
      estado,
      cep,
      razao_social,
      nome_fantasia,
      inscricao_estadual,
      inscricao_municipal
    } = req.body;

    // Verificar se já existe tenant com mesmo CNPJ/CPF
    if (cnpj || cpf) {
      const existingTenants = await query(
        'SELECT id FROM tenants WHERE (cnpj = ? OR cpf = ?) AND id != ?',
        [cnpj || cpf, cnpj || cpf, req.user.tenant_id]
      );

      if (existingTenants.length > 0) {
        return res.status(409).json({
          error: 'Já existe um tenant com este CNPJ/CPF'
        });
      }
    }

    // Verificar se já existe tenant com mesmo email
    if (email) {
      const existingTenants = await query(
        'SELECT id FROM tenants WHERE email = ? AND id != ?',
        [email, req.user.tenant_id]
      );

      if (existingTenants.length > 0) {
        return res.status(409).json({
          error: 'Já existe um tenant com este email'
        });
      }
    }

    await query(
      `UPDATE tenants SET 
        nome = ?, cnpj = ?, cpf = ?, tipo_pessoa = ?, email = ?, telefone = ?,
        endereco = ?, cidade = ?, estado = ?, cep = ?, razao_social = ?,
        nome_fantasia = ?, inscricao_estadual = ?, inscricao_municipal = ?
      WHERE id = ?`,
      [
        nome, cnpj, cpf, tipo_pessoa, email, telefone, endereco, cidade,
        estado, cep, razao_social, nome_fantasia, inscricao_estadual,
        inscricao_municipal, req.user.tenant_id
      ]
    );

    // Buscar tenant atualizado
    const [tenant] = await query(
      'SELECT * FROM tenants WHERE id = ?',
      [req.user.tenant_id]
    );

    res.json({
      message: 'Dados da empresa atualizados com sucesso',
      tenant
    });
  } catch (error) {
    console.error('Erro ao atualizar dados do tenant:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Buscar configurações do sistema
router.get('/sistema/:tenantId', async (req, res) => {
  try {
    const { tenantId } = req.params;

    // Verificar se o usuário tem acesso ao tenant
    if (req.user.tenant_id !== parseInt(tenantId)) {
      return res.status(403).json({
        error: 'Acesso negado ao tenant'
      });
    }

    const configuracoes = await query(
      `SELECT chave, valor, tipo 
       FROM tenant_configuracoes 
       WHERE tenant_id = ?`,
      [tenantId]
    );

    // Converter para objeto
    const config = {
      tema: 'sistema',
      idioma: 'pt-BR',
      fuso_horario: 'America/Sao_Paulo',
      moeda: 'BRL',
      formato_data: 'DD/MM/YYYY',
      notificacoes: {
        email: true,
        push: true,
        sms: false,
        vendas: true,
        estoque: true,
        financeiro: true,
        clientes: false
      },
      seguranca: {
        autenticacao_2fa: false,
        sessao_longa: true,
        log_atividade: true,
        backup_automatico: true
      }
    };

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
      
      // Mapear chaves para estrutura aninhada
      if (item.chave.startsWith('tema_')) {
        config.tema = valor;
      } else if (item.chave.startsWith('idioma_')) {
        config.idioma = valor;
      } else if (item.chave.startsWith('fuso_')) {
        config.fuso_horario = valor;
      } else if (item.chave.startsWith('moeda_')) {
        config.moeda = valor;
      } else if (item.chave.startsWith('formato_data_')) {
        config.formato_data = valor;
      } else if (item.chave.startsWith('notificacao_')) {
        const key = item.chave.replace('notificacao_', '');
        if (config.notificacoes.hasOwnProperty(key)) {
          config.notificacoes[key] = valor;
        }
      } else if (item.chave.startsWith('seguranca_')) {
        const key = item.chave.replace('seguranca_', '');
        if (config.seguranca.hasOwnProperty(key)) {
          config.seguranca[key] = valor;
        }
      }
    });

    res.json({
      configuracoes: config
    });
  } catch (error) {
    console.error('Erro ao buscar configurações do sistema:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Atualizar configurações do sistema
router.put('/sistema', async (req, res) => {
  try {
    const { configuracoes } = req.body;

    if (!configuracoes || typeof configuracoes !== 'object') {
      return res.status(400).json({
        error: 'Configurações inválidas'
      });
    }

    // Atualizar configurações gerais
    const configsGerais = {
      tema: configuracoes.tema,
      idioma: configuracoes.idioma,
      fuso_horario: configuracoes.fuso_horario,
      moeda: configuracoes.moeda,
      formato_data: configuracoes.formato_data
    };

    for (const [chave, valor] of Object.entries(configsGerais)) {
      if (valor !== undefined) {
        const chaveCompleta = `${chave}_config`;
        const tipo = typeof valor === 'boolean' ? 'boolean' : 
                     typeof valor === 'number' ? 'number' : 'string';
        
        await query(
          `INSERT INTO tenant_configuracoes (tenant_id, chave, valor, tipo) 
           VALUES (?, ?, ?, ?) 
           ON DUPLICATE KEY UPDATE valor = VALUES(valor), tipo = VALUES(tipo)`,
          [req.user.tenant_id, chaveCompleta, String(valor), tipo]
        );
      }
    }

    // Atualizar configurações de notificações
    if (configuracoes.notificacoes) {
      for (const [chave, valor] of Object.entries(configuracoes.notificacoes)) {
        const chaveCompleta = `notificacao_${chave}`;
        
        await query(
          `INSERT INTO tenant_configuracoes (tenant_id, chave, valor, tipo) 
           VALUES (?, ?, ?, ?) 
           ON DUPLICATE KEY UPDATE valor = VALUES(valor), tipo = VALUES(tipo)`,
          [req.user.tenant_id, chaveCompleta, String(valor), 'boolean']
        );
      }
    }

    // Atualizar configurações de segurança
    if (configuracoes.seguranca) {
      for (const [chave, valor] of Object.entries(configuracoes.seguranca)) {
        const chaveCompleta = `seguranca_${chave}`;
        
        await query(
          `INSERT INTO tenant_configuracoes (tenant_id, chave, valor, tipo) 
           VALUES (?, ?, ?, ?) 
           ON DUPLICATE KEY UPDATE valor = VALUES(valor), tipo = VALUES(tipo)`,
          [req.user.tenant_id, chaveCompleta, String(valor), 'boolean']
        );
      }
    }

    res.json({
      message: 'Configurações atualizadas com sucesso'
    });
  } catch (error) {
    console.error('Erro ao atualizar configurações do sistema:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Atualizar dados da conta do usuário
router.put('/conta', async (req, res) => {
  try {
    const {
      nome,
      sobrenome,
      email,
      telefone
    } = req.body;

    // Buscar dados atuais do usuário para usar email atual se não fornecido
    const usuarioAtual = await query(
      'SELECT email FROM usuarios WHERE id = ?',
      [req.user.id]
    );

    if (usuarioAtual.length === 0) {
      return res.status(404).json({
        error: 'Usuário não encontrado'
      });
    }

    const emailAtual = usuarioAtual[0].email;
    const emailParaUsar = email || emailAtual;

    // Verificar se já existe usuário com mesmo email (apenas se email foi fornecido e é diferente do atual)
    if (email && email !== emailAtual) {
      const existingUsers = await query(
        'SELECT id FROM usuarios WHERE email = ? AND id != ?',
        [email, req.user.id]
      );

      if (existingUsers.length > 0) {
        return res.status(409).json({
          error: 'Já existe um usuário com este email'
        });
      }
    }

    // Atualizar apenas os campos fornecidos
    const camposParaAtualizar = [];
    const valoresParaAtualizar = [];

    if (nome !== undefined) {
      camposParaAtualizar.push('nome = ?');
      valoresParaAtualizar.push(nome);
    }

    if (sobrenome !== undefined) {
      camposParaAtualizar.push('sobrenome = ?');
      valoresParaAtualizar.push(sobrenome);
    }

    if (email !== undefined) {
      camposParaAtualizar.push('email = ?');
      valoresParaAtualizar.push(emailParaUsar);
    }

    if (telefone !== undefined) {
      camposParaAtualizar.push('telefone = ?');
      valoresParaAtualizar.push(telefone);
    }

    if (camposParaAtualizar.length === 0) {
      return res.status(400).json({
        error: 'Nenhum campo para atualizar foi fornecido'
      });
    }

    valoresParaAtualizar.push(req.user.id);

    await query(
      `UPDATE usuarios SET ${camposParaAtualizar.join(', ')} WHERE id = ?`,
      valoresParaAtualizar
    );

    // Buscar usuário atualizado
    const usuarios = await query(
      'SELECT u.*, t.nome as tenant_nome, t.slug as tenant_slug FROM usuarios u JOIN tenants t ON u.tenant_id = t.id WHERE u.id = ?',
      [req.user.id]
    );

    res.json({
      message: 'Dados da conta atualizados com sucesso',
      user: usuarios[0]
    });
  } catch (error) {
    console.error('Erro ao atualizar dados da conta:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Upload de avatar
router.post('/avatar', upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'Nenhum arquivo enviado'
      });
    }

    const avatarPath = `/uploads/${req.file.filename}`;

    await query(
      'UPDATE usuarios SET avatar = ? WHERE id = ?',
      [avatarPath, req.user.id]
    );

    // Buscar usuário atualizado
    const usuarios = await query(
      'SELECT u.*, t.nome as tenant_nome, t.slug as tenant_slug FROM usuarios u JOIN tenants t ON u.tenant_id = t.id WHERE u.id = ?',
      [req.user.id]
    );

    res.json({
      message: 'Avatar atualizado com sucesso',
      user: usuarios[0]
    });
  } catch (error) {
    console.error('Erro ao fazer upload do avatar:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Upload de logo da empresa (Base64)
router.post('/logo', requireAdmin, async (req, res) => {
  try {
    const { logo } = req.body;
    
    if (!logo) {
      return res.status(400).json({
        error: 'Logo em Base64 é obrigatória'
      });
    }

    // Validar se é uma string Base64 válida
    if (!logo.startsWith('data:image/')) {
      return res.status(400).json({
        error: 'Formato de logo inválido. Deve ser uma string Base64 de imagem.'
      });
    }

    await query(
      'UPDATE tenants SET logo = ? WHERE id = ?',
      [logo, req.user.tenant_id]
    );

    // Buscar tenant atualizado
    const [tenant] = await query(
      'SELECT * FROM tenants WHERE id = ?',
      [req.user.tenant_id]
    );

    res.json({
      message: 'Logo da empresa atualizada com sucesso',
      tenant
    });
  } catch (error) {
    console.error('Erro ao salvar logo:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// ===== ROTAS PARA MÉTODOS DE PAGAMENTO =====

// Buscar todos os métodos de pagamento do tenant
router.get('/metodos-pagamento', async (req, res) => {
  try {
    const metodos = await query(`
      SELECT 
        mp.*,
        GROUP_CONCAT(
          JSON_OBJECT(
            'id', mpp.id,
            'quantidade', mpp.quantidade,
            'taxa', mpp.taxa,
            'ativo', mpp.ativo
          )
        ) as parcelas_json
      FROM metodos_pagamento mp
      LEFT JOIN metodos_pagamento_parcelas mpp ON mp.id = mpp.metodo_pagamento_id AND mpp.ativo = 1
      WHERE mp.tenant_id = ?
      GROUP BY mp.id
      ORDER BY mp.ordem ASC, mp.nome ASC
    `, [req.user.tenant_id]);

    // Processar parcelas
    const metodosProcessados = metodos.map(metodo => ({
      ...metodo,
      parcelas: metodo.parcelas_json ? 
        JSON.parse(`[${metodo.parcelas_json}]`) : []
    }));

    res.json(metodosProcessados);
  } catch (error) {
    console.error('Erro ao buscar métodos de pagamento:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Criar ou atualizar método de pagamento
router.post('/metodos-pagamento', requireAdmin, validateMetodoPagamento, async (req, res) => {
  try {
    const { tipo, nome, taxa, ativo, ordem, configuracoes, parcelas } = req.body;
    const tenantId = req.user.tenant_id;

    // Verificar se já existe um método com este tipo
    const [metodoExistente] = await query(
      'SELECT id FROM metodos_pagamento WHERE tenant_id = ? AND tipo = ?',
      [tenantId, tipo]
    );

    let metodoId;

    if (metodoExistente) {
      // Atualizar método existente
      await query(`
        UPDATE metodos_pagamento 
        SET nome = ?, taxa = ?, ativo = ?, ordem = ?, configuracoes = ?
        WHERE id = ?
      `, [nome, taxa, ativo, ordem, JSON.stringify(configuracoes || {}), metodoExistente.id]);
      
      metodoId = metodoExistente.id;

      // Remover parcelas existentes
      await query(
        'DELETE FROM metodos_pagamento_parcelas WHERE metodo_pagamento_id = ?',
        [metodoId]
      );
    } else {
      // Criar novo método
      const [result] = await query(`
        INSERT INTO metodos_pagamento (tenant_id, tipo, nome, taxa, ativo, ordem, configuracoes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [tenantId, tipo, nome, taxa, ativo, ordem, JSON.stringify(configuracoes || {})]);
      
      metodoId = result.insertId;
    }

    // Inserir parcelas se fornecidas
    if (parcelas && parcelas.length > 0) {
      for (const parcela of parcelas) {
        await query(`
          INSERT INTO metodos_pagamento_parcelas (metodo_pagamento_id, quantidade, taxa, ativo)
          VALUES (?, ?, ?, ?)
        `, [metodoId, parcela.quantidade, parcela.taxa, parcela.ativo !== false]);
      }
    }

    // Buscar método atualizado
    const [metodoAtualizado] = await query(`
      SELECT 
        mp.*,
        GROUP_CONCAT(
          JSON_OBJECT(
            'id', mpp.id,
            'quantidade', mpp.quantidade,
            'taxa', mpp.taxa,
            'ativo', mpp.ativo
          )
        ) as parcelas_json
      FROM metodos_pagamento mp
      LEFT JOIN metodos_pagamento_parcelas mpp ON mp.id = mpp.metodo_pagamento_id AND mpp.ativo = 1
      WHERE mp.id = ?
      GROUP BY mp.id
    `, [metodoId]);

    const metodoProcessado = {
      ...metodoAtualizado,
      parcelas: metodoAtualizado.parcelas_json ? 
        JSON.parse(`[${metodoAtualizado.parcelas_json}]`) : []
    };

    res.json({
      message: metodoExistente ? 'Método de pagamento atualizado com sucesso' : 'Método de pagamento criado com sucesso',
      metodo: metodoProcessado
    });
  } catch (error) {
    console.error('Erro ao salvar método de pagamento:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Atualizar métodos de pagamento em lote
router.put('/metodos-pagamento/lote', requireAdmin, validateMetodosPagamentoLote, async (req, res) => {
  try {
    const { metodos } = req.body;
    const tenantId = req.user.tenant_id;

    // Usar função de transação existente
    await transaction(async (connection) => {
      // Limpar métodos existentes
      await connection.execute('DELETE FROM metodos_pagamento WHERE tenant_id = ?', [tenantId]);

      // Inserir novos métodos
      for (const metodo of metodos) {
        const [result] = await connection.execute(`
          INSERT INTO metodos_pagamento (tenant_id, tipo, nome, taxa, ativo, ordem, configuracoes)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          tenantId, 
          metodo.tipo, 
          metodo.nome, 
          metodo.taxa, 
          metodo.ativo, 
          metodo.ordem || 0, 
          JSON.stringify(metodo.configuracoes || {})
        ]);

        const metodoId = result.insertId;

        // Inserir parcelas se fornecidas
        if (metodo.parcelas && metodo.parcelas.length > 0) {
          for (const parcela of metodo.parcelas) {
            await connection.execute(`
              INSERT INTO metodos_pagamento_parcelas (metodo_pagamento_id, quantidade, taxa, ativo)
              VALUES (?, ?, ?, ?)
            `, [metodoId, parcela.quantidade, parcela.taxa, parcela.ativo !== false]);
          }
        }
      }
    });

    // Buscar métodos atualizados
    const metodosAtualizados = await query(`
      SELECT 
        mp.*,
        GROUP_CONCAT(
          JSON_OBJECT(
            'id', mpp.id,
            'quantidade', mpp.quantidade,
            'taxa', mpp.taxa,
            'ativo', mpp.ativo
          )
        ) as parcelas_json
      FROM metodos_pagamento mp
      LEFT JOIN metodos_pagamento_parcelas mpp ON mp.id = mpp.metodo_pagamento_id AND mpp.ativo = 1
      WHERE mp.tenant_id = ?
      GROUP BY mp.id
      ORDER BY mp.ordem ASC, mp.nome ASC
    `, [tenantId]);

    const metodosProcessados = metodosAtualizados.map(metodo => ({
      ...metodo,
      parcelas: metodo.parcelas_json ? 
        JSON.parse(`[${metodo.parcelas_json}]`) : []
    }));

    res.json({
      message: 'Métodos de pagamento atualizados com sucesso',
      metodos: metodosProcessados
    });
  } catch (error) {
    console.error('Erro ao atualizar métodos de pagamento em lote:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Deletar método de pagamento
router.delete('/metodos-pagamento/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenant_id;

    // Verificar se o método pertence ao tenant
    const [metodo] = await query(
      'SELECT id FROM metodos_pagamento WHERE id = ? AND tenant_id = ?',
      [id, tenantId]
    );

    if (!metodo) {
      return res.status(404).json({
        error: 'Método de pagamento não encontrado'
      });
    }

    // Deletar método (as parcelas serão deletadas automaticamente por CASCADE)
    await query('DELETE FROM metodos_pagamento WHERE id = ?', [id]);

    res.json({
      message: 'Método de pagamento deletado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao deletar método de pagamento:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Adicionar parcela a um método de pagamento
router.post('/metodos-pagamento/:id/parcelas', requireAdmin, validateParcelaMetodoPagamento, async (req, res) => {
  try {
    const { id } = req.params;
    const { quantidade, taxa, ativo } = req.body;
    const tenantId = req.user.tenant_id;

    // Verificar se o método pertence ao tenant
    const [metodo] = await query(
      'SELECT id FROM metodos_pagamento WHERE id = ? AND tenant_id = ?',
      [id, tenantId]
    );

    if (!metodo) {
      return res.status(404).json({
        error: 'Método de pagamento não encontrado'
      });
    }

    // Verificar se já existe parcela com esta quantidade
    const [parcelaExistente] = await query(
      'SELECT id FROM metodos_pagamento_parcelas WHERE metodo_pagamento_id = ? AND quantidade = ?',
      [id, quantidade]
    );

    if (parcelaExistente) {
      return res.status(400).json({
        error: 'Já existe uma parcela com esta quantidade'
      });
    }

    // Inserir nova parcela
    const result = await queryWithResult(`
      INSERT INTO metodos_pagamento_parcelas (metodo_pagamento_id, quantidade, taxa, ativo)
      VALUES (?, ?, ?, ?)
    `, [id, quantidade, taxa, ativo !== false]);

    res.json({
      message: 'Parcela adicionada com sucesso',
      parcela: {
        id: result.insertId,
        quantidade,
        taxa,
        ativo: ativo !== false
      }
    });
  } catch (error) {
    console.error('Erro ao adicionar parcela:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Deletar parcela de um método de pagamento
router.delete('/metodos-pagamento/:id/parcelas/:parcelaId', requireAdmin, async (req, res) => {
  try {
    const { id, parcelaId } = req.params;
    const tenantId = req.user.tenant_id;

    // Verificar se o método pertence ao tenant
    const [metodo] = await query(
      'SELECT id FROM metodos_pagamento WHERE id = ? AND tenant_id = ?',
      [id, tenantId]
    );

    if (!metodo) {
      return res.status(404).json({
        error: 'Método de pagamento não encontrado'
      });
    }

    // Verificar se a parcela pertence ao método
    const [parcela] = await query(
      'SELECT id FROM metodos_pagamento_parcelas WHERE id = ? AND metodo_pagamento_id = ?',
      [parcelaId, id]
    );

    if (!parcela) {
      return res.status(404).json({
        error: 'Parcela não encontrada'
      });
    }

    // Deletar parcela
    await query('DELETE FROM metodos_pagamento_parcelas WHERE id = ?', [parcelaId]);

    res.json({
      message: 'Parcela deletada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao deletar parcela:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// ===== ROTAS PARA CONFIGURAÇÕES PIX =====

// Buscar configurações PIX
router.get('/pix', async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    
    const pixConfig = await query(
      'SELECT * FROM pix_configuracoes WHERE tenant_id = ? AND ativo = TRUE',
      [tenantId]
    );
    
    if (pixConfig.length === 0) {
      return res.json({ pix: null });
    }
    
    res.json({ pix: pixConfig[0] });
  } catch (error) {
    console.error('Erro ao buscar configurações PIX:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});


// Criar ou atualizar configurações PIX
router.post('/pix', async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const { chave_pix, qr_code, nome_titular, cpf_cnpj } = req.body;
    
    // Validações básicas
    if (!chave_pix || !nome_titular || !cpf_cnpj) {
      return res.status(400).json({ error: 'Chave PIX, nome do titular e CPF/CNPJ são obrigatórios' });
    }
    
    // Verificar se já existe configuração PIX para este tenant
    const existingPix = await query(
      'SELECT id FROM pix_configuracoes WHERE tenant_id = ?',
      [tenantId]
    );
    
    let result;
    if (existingPix.length > 0) {
      // Atualizar configuração existente
      result = await queryWithResult(
        `UPDATE pix_configuracoes 
         SET chave_pix = ?, qr_code = ?, nome_titular = ?, cpf_cnpj = ?, 
             data_atualizacao = CURRENT_TIMESTAMP
         WHERE tenant_id = ?`,
        [chave_pix, qr_code, nome_titular, cpf_cnpj, tenantId]
      );
    } else {
      // Criar nova configuração
      result = await queryWithResult(
        `INSERT INTO pix_configuracoes (tenant_id, chave_pix, qr_code, nome_titular, cpf_cnpj)
         VALUES (?, ?, ?, ?, ?)`,
        [tenantId, chave_pix, qr_code, nome_titular, cpf_cnpj]
      );
    }
    
    // Buscar a configuração atualizada
    const updatedPix = await query(
      'SELECT * FROM pix_configuracoes WHERE tenant_id = ?',
      [tenantId]
    );
    
    res.json({ 
      success: true, 
      pix: updatedPix[0],
      message: existingPix.length > 0 ? 'Configurações PIX atualizadas com sucesso' : 'Configurações PIX criadas com sucesso'
    });
  } catch (error) {
    console.error('Erro ao salvar configurações PIX:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar configurações PIX
router.delete('/pix', async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    
    await query(
      'UPDATE pix_configuracoes SET ativo = FALSE WHERE tenant_id = ?',
      [tenantId]
    );
    
    res.json({ success: true, message: 'Configurações PIX removidas com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar configurações PIX:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ===== ROTAS PARA DADOS BANCÁRIOS =====

// Buscar dados bancários
router.get('/dados-bancarios', async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    
    const dadosBancarios = await query(
      'SELECT * FROM dados_bancarios WHERE tenant_id = ? AND ativo = TRUE',
      [tenantId]
    );
    
    if (dadosBancarios.length === 0) {
      return res.json({ dadosBancarios: null });
    }
    
    res.json({ dadosBancarios: dadosBancarios[0] });
  } catch (error) {
    console.error('Erro ao buscar dados bancários:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar ou atualizar dados bancários
router.post('/dados-bancarios', async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const { banco, agencia, conta, digito, tipo_conta, nome_titular, cpf_cnpj } = req.body;
    
    // Validações básicas
    if (!banco || !agencia || !conta || !digito || !nome_titular || !cpf_cnpj) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }
    
    // Verificar se já existem dados bancários para este tenant
    const existingDados = await query(
      'SELECT id FROM dados_bancarios WHERE tenant_id = ?',
      [tenantId]
    );
    
    let result;
    if (existingDados.length > 0) {
      // Atualizar dados existentes
      result = await queryWithResult(
        `UPDATE dados_bancarios 
         SET banco = ?, agencia = ?, conta = ?, digito = ?, tipo_conta = ?, 
             nome_titular = ?, cpf_cnpj = ?, data_atualizacao = CURRENT_TIMESTAMP
         WHERE tenant_id = ?`,
        [banco, agencia, conta, digito, tipo_conta, nome_titular, cpf_cnpj, tenantId]
      );
    } else {
      // Criar novos dados
      result = await queryWithResult(
        `INSERT INTO dados_bancarios (tenant_id, banco, agencia, conta, digito, tipo_conta, nome_titular, cpf_cnpj)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [tenantId, banco, agencia, conta, digito, tipo_conta, nome_titular, cpf_cnpj]
      );
    }
    
    // Buscar os dados atualizados
    const updatedDados = await query(
      'SELECT * FROM dados_bancarios WHERE tenant_id = ?',
      [tenantId]
    );
    
    res.json({ 
      success: true, 
      dadosBancarios: updatedDados[0],
      message: existingDados.length > 0 ? 'Dados bancários atualizados com sucesso' : 'Dados bancários criados com sucesso'
    });
  } catch (error) {
    console.error('Erro ao salvar dados bancários:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar dados bancários
router.delete('/dados-bancarios', async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    
    await query(
      'UPDATE dados_bancarios SET ativo = FALSE WHERE tenant_id = ?',
      [tenantId]
    );
    
    res.json({ success: true, message: 'Dados bancários removidos com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar dados bancários:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ===== ROTAS PARA ADMINISTRADORES =====

// Buscar todos os administradores do tenant
router.get('/administradores', validateSearchAdministradores, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const { busca, role, status } = req.query;
    
    let sql = `
      SELECT 
        id, nome, sobrenome, codigo, role, status, 
        permissoes, ultimo_acesso, data_criacao,
        criado_por
      FROM administradores 
      WHERE tenant_id = ?
    `;
    const params = [tenantId];
    
    // Filtros opcionais
    if (busca) {
      sql += ' AND (nome LIKE ? OR sobrenome LIKE ?)';
      const buscaParam = `%${busca}%`;
      params.push(buscaParam, buscaParam);
    }
    
    if (role && role !== 'todos') {
      sql += ' AND role = ?';
      params.push(role);
    }
    
    if (status && status !== 'todos') {
      sql += ' AND status = ?';
      params.push(status);
    }
    
    sql += ' ORDER BY data_criacao DESC';
    
    const administradores = await query(sql, params);
    
    res.json(administradores);
  } catch (error) {
    console.error('Erro ao buscar administradores:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar administrador por ID
router.get('/administradores/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenant_id;
    
    const administradores = await query(
      `SELECT 
        id, nome, sobrenome, codigo, role, status, 
        permissoes, ultimo_acesso, data_criacao, data_atualizacao,
        criado_por
      FROM administradores 
      WHERE id = ? AND tenant_id = ?`,
      [id, tenantId]
    );
    
    if (administradores.length === 0) {
      return res.status(404).json({ error: 'Administrador não encontrado' });
    }
    
    res.json(administradores[0]);
  } catch (error) {
    console.error('Erro ao buscar administrador:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar novo administrador
router.post('/administradores', validateCreateAdministrador, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const { nome, sobrenome, codigo, role, status, permissoes } = req.body;
    const criadoPor = null; // Primeiro administrador não tem criado_por
    
    console.log('Dados recebidos no backend:', { nome, sobrenome, codigo, role, status, permissoes });
    
    // Verificar se o código já existe no tenant
    const codigoExistente = await query(
      'SELECT id FROM administradores WHERE codigo = ? AND tenant_id = ?',
      [codigo, tenantId]
    );
    
    if (codigoExistente.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Este código já está em uso por outro administrador'
      });
    }
    
    const result = await query(
      `INSERT INTO administradores 
       (tenant_id, nome, sobrenome, codigo, role, status, permissoes, criado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [tenantId, nome, sobrenome, codigo, role, status, JSON.stringify(permissoes), criadoPor]
    );
    
    // Buscar o administrador criado
    const novoAdministrador = await query(
      `SELECT 
        id, nome, sobrenome, codigo, role, status, 
        permissoes, ultimo_acesso, data_criacao,
        criado_por
      FROM administradores 
      WHERE id = ?`,
      [result.insertId]
    );
    
    res.status(201).json({ 
      success: true, 
      message: 'Administrador criado com sucesso',
      administrador: novoAdministrador[0]
    });
  } catch (error) {
    console.error('Erro ao criar administrador:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar administrador
router.put('/administradores/:id', validateUpdateAdministrador, async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenant_id;
    const { nome, sobrenome, codigo, role, status, permissoes } = req.body;
    
    console.log('Dados recebidos para atualização:', { nome, sobrenome, codigo, role, status, permissoes });
    
    // Verificar se administrador existe
    const administradorExistente = await query(
      'SELECT id FROM administradores WHERE id = ? AND tenant_id = ?',
      [id, tenantId]
    );
    
    if (administradorExistente.length === 0) {
      return res.status(404).json({ error: 'Administrador não encontrado' });
    }
    
    // Preparar campos para atualização
    const campos = [];
    const valores = [];
    
    if (nome) {
      campos.push('nome = ?');
      valores.push(nome);
    }
    if (sobrenome) {
      campos.push('sobrenome = ?');
      valores.push(sobrenome);
    }
    if (codigo) {
      // Verificar se o código já existe em outro administrador do mesmo tenant
      const codigoExistente = await query(
        'SELECT id FROM administradores WHERE codigo = ? AND tenant_id = ? AND id != ?',
        [codigo, tenantId, id]
      );
      
      if (codigoExistente.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Este código já está em uso por outro administrador'
        });
      }
      
      campos.push('codigo = ?');
      valores.push(codigo);
    }
    if (role) {
      campos.push('role = ?');
      valores.push(role);
    }
    if (status) {
      campos.push('status = ?');
      valores.push(status);
    }
    if (permissoes) {
      campos.push('permissoes = ?');
      valores.push(JSON.stringify(permissoes));
    }
    
    if (campos.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }
    
    valores.push(id, tenantId);
    
    await query(
      `UPDATE administradores 
       SET ${campos.join(', ')}, data_atualizacao = CURRENT_TIMESTAMP
       WHERE id = ? AND tenant_id = ?`,
      valores
    );
    
    // Buscar o administrador atualizado
    const administradorAtualizado = await query(
      `SELECT 
        id, nome, sobrenome, codigo, role, status, 
        permissoes, ultimo_acesso, data_criacao, data_atualizacao,
        criado_por
      FROM administradores 
      WHERE id = ? AND tenant_id = ?`,
      [id, tenantId]
    );
    
    res.json({ 
      success: true, 
      message: 'Administrador atualizado com sucesso',
      administrador: administradorAtualizado[0]
    });
  } catch (error) {
    console.error('Erro ao atualizar administrador:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar administrador
router.delete('/administradores/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenant_id;
    
    // Verificar se administrador existe
    const administradorExistente = await query(
      'SELECT id FROM administradores WHERE id = ? AND tenant_id = ?',
      [id, tenantId]
    );
    
    if (administradorExistente.length === 0) {
      return res.status(404).json({ error: 'Administrador não encontrado' });
    }
    
    // Verificar se não é o próprio usuário
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'Você não pode deletar sua própria conta' });
    }
    
    await query(
      'DELETE FROM administradores WHERE id = ? AND tenant_id = ?',
      [id, tenantId]
    );
    
    res.json({ success: true, message: 'Administrador deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar administrador:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar último acesso do administrador
router.put('/administradores/:id/ultimo-acesso', async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenant_id;
    
    await query(
      'UPDATE administradores SET ultimo_acesso = CURRENT_TIMESTAMP WHERE id = ? AND tenant_id = ?',
      [id, tenantId]
    );
    
    res.json({ success: true, message: 'Último acesso atualizado' });
  } catch (error) {
    console.error('Erro ao atualizar último acesso:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para criar código personalizado para administrador
router.post('/administradores/:id/criar-codigo', async (req, res) => {
  try {
    const { id } = req.params;
    const { codigo } = req.body;
    const tenantId = req.user.tenant_id;

    if (!codigo || codigo.trim() === '') {
      return res.status(400).json({ error: 'Código é obrigatório' });
    }

    // Validar tamanho do código (mínimo 4, máximo 20 caracteres)
    if (codigo.length < 4 || codigo.length > 20) {
      return res.status(400).json({ error: 'Código deve ter entre 4 e 20 caracteres' });
    }

    // Buscar administrador
    const administradores = await query(
      'SELECT * FROM administradores WHERE id = ? AND tenant_id = ? AND status = "ativo"',
      [id, tenantId]
    );

    if (administradores.length === 0) {
      return res.status(404).json({ error: 'Administrador não encontrado ou inativo' });
    }

    const administrador = administradores[0];

    // Verificar se o código já existe no tenant
    const codigoExistente = await query(
      'SELECT id FROM administradores WHERE codigo = ? AND tenant_id = ? AND id != ?',
      [codigo, tenantId, id]
    );

    if (codigoExistente.length > 0) {
      return res.status(400).json({ error: 'Este código já está em uso por outro administrador' });
    }

    // Atualizar código no banco
    await query(
      'UPDATE administradores SET codigo = ?, data_atualizacao = CURRENT_TIMESTAMP WHERE id = ?',
      [codigo, id]
    );

    // Atualizar último acesso
    await query(
      'UPDATE administradores SET ultimo_acesso = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );

    res.json({ 
      success: true,
      message: 'Código criado com sucesso',
      codigo: codigo,
      administrador: {
        id: administrador.id,
        nome: administrador.nome,
        sobrenome: administrador.sobrenome,
        role: administrador.role,
        status: administrador.status
      }
    });
  } catch (error) {
    console.error('Erro ao criar código:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para validar código do operador
router.post('/administradores/:id/validar-codigo', async (req, res) => {
  try {
    const { id } = req.params;
    const { codigo } = req.body;
    const tenantId = req.user.tenant_id;

    if (!codigo) {
      return res.status(400).json({ error: 'Código é obrigatório' });
    }

    // Buscar administrador
    const administradores = await query(
      'SELECT * FROM administradores WHERE id = ? AND tenant_id = ? AND status = "ativo"',
      [id, tenantId]
    );

    if (administradores.length === 0) {
      return res.status(404).json({ error: 'Administrador não encontrado ou inativo' });
    }

    const administrador = administradores[0];

    // Validar código
    if (administrador.codigo !== codigo) {
      return res.status(401).json({ error: 'Código incorreto' });
    }

    // Atualizar último acesso
    await query(
      'UPDATE administradores SET ultimo_acesso = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );

    // Retornar dados do administrador (sem o código)
    const { codigo: _, ...administradorSemCodigo } = administrador;
    
    res.json({ 
      success: true,
      message: 'Código validado com sucesso',
      administrador: administradorSemCodigo
    });
  } catch (error) {
    console.error('Erro ao validar código:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;
