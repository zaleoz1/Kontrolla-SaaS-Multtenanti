import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { query, queryWithResult } from '../database/connection.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { handleValidationErrors } from '../middleware/validation.js';

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

    // Verificar se já existe usuário com mesmo email
    if (email) {
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

    await query(
      `UPDATE usuarios SET 
        nome = ?, sobrenome = ?, email = ?, telefone = ?
      WHERE id = ?`,
      [nome, sobrenome, email, telefone, req.user.id]
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

// Upload de logo da empresa
router.post('/logo', requireAdmin, upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'Nenhum arquivo enviado'
      });
    }

    const logoPath = `/uploads/${req.file.filename}`;

    await query(
      'UPDATE tenants SET logo = ? WHERE id = ?',
      [logoPath, req.user.tenant_id]
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
    console.error('Erro ao fazer upload da logo:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

export default router;
