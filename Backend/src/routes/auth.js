import express from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { query } from '../database/connection.js';
import { 
  authenticateToken, 
  requireAdmin, 
  createUserSession, 
  invalidateSession, 
  generateJWT 
} from '../middleware/auth.js';
import { validateLogin } from '../middleware/validation.js';

const router = express.Router();

// Rota de cadastro
router.post('/signup', async (req, res) => {
  try {
    const { 
      firstName, 
      lastName, 
      email, 
      phone, 
      company, 
      password, 
      confirmPassword, 
      selectedPlan,
      acceptTerms 
    } = req.body;

    // Validações básicas
    if (!firstName || !lastName || !email || !password || !selectedPlan) {
      return res.status(400).json({
        error: 'Todos os campos obrigatórios devem ser preenchidos'
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        error: 'As senhas não coincidem'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        error: 'A senha deve ter pelo menos 8 caracteres'
      });
    }

    if (!acceptTerms) {
      return res.status(400).json({
        error: 'Você deve aceitar os termos de uso'
      });
    }

    // Verificar se o email já existe
    const existingUsers = await query(
      'SELECT id FROM usuarios WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({
        error: 'Este email já está em uso'
      });
    }

    // Criar tenant para o novo usuário
    const tenantSlug = company.toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    // Verificar se o slug já existe
    let finalSlug = tenantSlug;
    let counter = 1;
    while (true) {
      const existingTenants = await query(
        'SELECT id FROM tenants WHERE slug = ?',
        [finalSlug]
      );
      if (existingTenants.length === 0) break;
      finalSlug = `${tenantSlug}-${counter}`;
      counter++;
    }

    // Criar tenant
    const [tenantResult] = await query(
      `INSERT INTO tenants (nome, slug, email, telefone, status, plano) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [company, finalSlug, email, phone, 'ativo', selectedPlan]
    );

    const tenantId = tenantResult.insertId;

    // Criptografar senha
    const senhaHash = await bcrypt.hash(password, 12);

    // Criar usuário
    const [usuarioResult] = await query(
      `INSERT INTO usuarios (tenant_id, nome, sobrenome, email, senha, telefone, role, status, email_verificado) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [tenantId, firstName, lastName, email, senhaHash, phone, 'admin', 'ativo', true]
    );

    const usuarioId = usuarioResult.insertId;

    // Criar sessão
    const sessionToken = await createUserSession(
      usuarioId, 
      tenantId, 
      req.ip, 
      req.get('User-Agent')
    );

    // Gerar JWT
    const token = generateJWT(usuarioId, sessionToken);

    // Buscar dados completos do usuário
    const usuarios = await query(
      'SELECT u.*, t.nome as tenant_nome, t.slug as tenant_slug FROM usuarios u JOIN tenants t ON u.tenant_id = t.id WHERE u.id = ?',
      [usuarioId]
    );

    res.status(201).json({
      message: 'Cadastro realizado com sucesso',
      token,
      user: {
        id: usuarios[0].id,
        nome: usuarios[0].nome,
        sobrenome: usuarios[0].sobrenome,
        email: usuarios[0].email,
        role: usuarios[0].role,
        tenant_id: usuarios[0].tenant_id,
        tenant_nome: usuarios[0].tenant_nome,
        tenant_slug: usuarios[0].tenant_slug
      }
    });

  } catch (error) {
    console.error('Erro no cadastro:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Rota de login
router.post('/login', validateLogin, async (req, res) => {
  try {
    const { email, senha } = req.body;

    // Buscar usuário no banco de dados
    const usuarios = await query(
      'SELECT u.*, t.nome as tenant_nome, t.slug as tenant_slug, t.status as tenant_status FROM usuarios u JOIN tenants t ON u.tenant_id = t.id WHERE u.email = ?',
      [email]
    );

    if (usuarios.length === 0) {
      return res.status(401).json({
        error: 'Credenciais inválidas'
      });
    }

    const usuario = usuarios[0];

    // Verificar se o usuário está ativo
    if (usuario.status !== 'ativo') {
      return res.status(401).json({
        error: 'Usuário inativo'
      });
    }

    // Verificar se o tenant está ativo
    if (usuario.tenant_status !== 'ativo') {
      return res.status(401).json({
        error: 'Conta suspensa'
      });
    }

    // Verificar senha
    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) {
      return res.status(401).json({
        error: 'Credenciais inválidas'
      });
    }

    // Atualizar último login
    await query(
      'UPDATE usuarios SET ultimo_login = NOW() WHERE id = ?',
      [usuario.id]
    );

    // Criar nova sessão
    const sessionToken = await createUserSession(
      usuario.id, 
      usuario.tenant_id, 
      req.ip, 
      req.get('User-Agent')
    );

    // Gerar JWT
    const token = generateJWT(usuario.id, sessionToken);

    res.json({
      message: 'Login realizado com sucesso',
      token,
      user: {
        id: usuario.id,
        nome: usuario.nome,
        sobrenome: usuario.sobrenome,
        email: usuario.email,
        role: usuario.role,
        tenant_id: usuario.tenant_id,
        tenant_nome: usuario.tenant_nome,
        tenant_slug: usuario.tenant_slug
      }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Rota para obter dados do usuário logado
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const usuarios = await query(
      'SELECT u.id, u.nome, u.email, u.telefone, u.avatar, u.role, u.ultimo_login, t.nome as tenant_nome, t.slug as tenant_slug FROM usuarios u JOIN tenants t ON u.tenant_id = t.id WHERE u.id = ?',
      [req.user.id]
    );

    if (usuarios.length === 0) {
      return res.status(404).json({
        error: 'Usuário não encontrado'
      });
    }

    res.json({
      user: usuarios[0]
    });
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Rota para alterar senha
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const { senhaAtual, novaSenha } = req.body;

    if (!senhaAtual || !novaSenha) {
      return res.status(400).json({
        error: 'Senha atual e nova senha são obrigatórias'
      });
    }

    if (novaSenha.length < 6) {
      return res.status(400).json({
        error: 'Nova senha deve ter pelo menos 6 caracteres'
      });
    }

    // Buscar usuário atual
    const usuarios = await query(
      'SELECT senha FROM usuarios WHERE id = ?',
      [req.user.id]
    );

    if (usuarios.length === 0) {
      return res.status(404).json({
        error: 'Usuário não encontrado'
      });
    }

    // Verificar senha atual
    const senhaValida = await bcrypt.compare(senhaAtual, usuarios[0].senha);
    if (!senhaValida) {
      return res.status(401).json({
        error: 'Senha atual incorreta'
      });
    }

    // Criptografar nova senha
    const novaSenhaHash = await bcrypt.hash(novaSenha, 12);

    // Atualizar senha
    await query(
      'UPDATE usuarios SET senha = ? WHERE id = ?',
      [novaSenhaHash, req.user.id]
    );

    res.json({
      message: 'Senha alterada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Rota para logout (invalidar sessão)
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // Invalidar a sessão atual
    await invalidateSession(req.session.token);
    
    res.json({
      message: 'Logout realizado com sucesso'
    });
  } catch (error) {
    console.error('Erro no logout:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Rota para verificar se o token é válido
router.get('/verify', authenticateToken, (req, res) => {
  res.json({
    valid: true,
    user: req.user
  });
});

export default router;
