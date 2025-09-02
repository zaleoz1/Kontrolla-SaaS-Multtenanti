import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../database/connection.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { validateLogin } from '../middleware/validation.js';

const router = express.Router();

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

    // Gerar token JWT
    const token = jwt.sign(
      {
        userId: usuario.id,
        tenantId: usuario.tenant_id,
        email: usuario.email,
        role: usuario.role
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    // Retornar dados do usuário (sem senha)
    const { senha: _, ...usuarioSemSenha } = usuario;

    res.json({
      message: 'Login realizado com sucesso',
      token,
      user: {
        id: usuario.id,
        nome: usuario.nome,
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

// Rota para logout (invalidar token - implementação básica)
router.post('/logout', authenticateToken, (req, res) => {
  // Em uma implementação mais robusta, você manteria uma blacklist de tokens
  res.json({
    message: 'Logout realizado com sucesso'
  });
});

// Rota para verificar se o token é válido
router.get('/verify', authenticateToken, (req, res) => {
  res.json({
    valid: true,
    user: req.user
  });
});

export default router;
