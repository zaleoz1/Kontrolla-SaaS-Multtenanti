import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { query, queryWithResult } from '../database/connection.js';

// Middleware para verificar autenticação com sistema de sessões
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: 'Token de acesso necessário'
      });
    }

    // Verificar e decodificar o token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verificar se a sessão ainda é válida
    const sessoes = await query(
      `SELECT s.*, u.id as usuario_id, u.nome, u.sobrenome, u.email, u.role, u.status, u.tenant_id, t.nome as tenant_nome, t.slug as tenant_slug
       FROM sessoes_usuario s
       JOIN usuarios u ON s.usuario_id = u.id
       JOIN tenants t ON u.tenant_id = t.id
       WHERE s.token_sessao = ? AND s.ativa = TRUE AND s.data_expiracao > NOW()`,
      [decoded.sessionToken]
    );

    if (sessoes.length === 0) {
      return res.status(401).json({
        error: 'Sessão inválida ou expirada'
      });
    }

    const sessao = sessoes[0];
    
    if (sessao.status !== 'ativo') {
      return res.status(401).json({
        error: 'Usuário inativo'
      });
    }

    // Adicionar informações do usuário, tenant e sessão à requisição
    req.user = {
      id: sessao.usuario_id,
      nome: sessao.nome,
      sobrenome: sessao.sobrenome,
      email: sessao.email,
      role: sessao.role,
      status: sessao.status,
      tenant_id: sessao.tenant_id,
      tenant_nome: sessao.tenant_nome,
      tenant_slug: sessao.tenant_slug
    };
    
    req.session = {
      id: sessao.id,
      token: sessao.token_sessao,
      ip_address: sessao.ip_address
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Token inválido'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expirado'
      });
    }

    console.error('Erro na autenticação:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};

// Middleware para verificar permissões de role
export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Usuário não autenticado'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Permissão insuficiente'
      });
    }

    next();
  };
};

// Middleware para verificar se o usuário pertence ao tenant correto
export const requireTenant = async (req, res, next) => {
  try {
    const tenantId = req.params.tenantId || req.body.tenant_id || req.query.tenant_id;
    
    if (!tenantId) {
      return res.status(400).json({
        error: 'ID do tenant é obrigatório'
      });
    }

    if (req.user.tenant_id !== parseInt(tenantId)) {
      return res.status(403).json({
        error: 'Acesso negado ao tenant'
      });
    }

    next();
  } catch (error) {
    console.error('Erro na verificação do tenant:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};

// Middleware para verificar se o usuário é admin do tenant
export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Usuário não autenticado'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Acesso restrito a administradores'
    });
  }

  next();
};

// Middleware opcional de autenticação (não falha se não houver token)
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const sessoes = await query(
        `SELECT s.*, u.id as usuario_id, u.nome, u.sobrenome, u.email, u.role, u.status, u.tenant_id, t.nome as tenant_nome, t.slug as tenant_slug
         FROM sessoes_usuario s
         JOIN usuarios u ON s.usuario_id = u.id
         JOIN tenants t ON u.tenant_id = t.id
         WHERE s.token_sessao = ? AND s.ativa = TRUE AND s.data_expiracao > NOW()`,
        [decoded.sessionToken]
      );

      if (sessoes.length > 0) {
        const sessao = sessoes[0];
        req.user = {
          id: sessao.usuario_id,
          nome: sessao.nome,
          sobrenome: sessao.sobrenome,
          email: sessao.email,
          role: sessao.role,
          tenant_id: sessao.tenant_id,
          tenant_nome: sessao.tenant_nome,
          tenant_slug: sessao.tenant_slug
        };
      }
    }

    next();
  } catch (error) {
    // Se houver erro no token, continua sem autenticação
    next();
  }
};

// Função para gerar token de sessão
export const generateSessionToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Função para criar sessão de usuário
export const createUserSession = async (usuarioId, tenantId, ipAddress, userAgent) => {
  const sessionToken = generateSessionToken();
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + 7); // 7 dias

  await query(
    `INSERT INTO sessoes_usuario (usuario_id, tenant_id, token_sessao, ip_address, user_agent, data_expiracao)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [usuarioId, tenantId, sessionToken, ipAddress, userAgent, expirationDate]
  );

  return sessionToken;
};

// Função para invalidar sessão
export const invalidateSession = async (sessionToken) => {
  await query(
    'UPDATE sessoes_usuario SET ativa = FALSE WHERE token_sessao = ?',
    [sessionToken]
  );
};

// Função para invalidar todas as sessões de um usuário
export const invalidateAllUserSessions = async (usuarioId) => {
  await query(
    'UPDATE sessoes_usuario SET ativa = FALSE WHERE usuario_id = ?',
    [usuarioId]
  );
};

// Função para gerar token JWT com sessão
export const generateJWT = (usuarioId, sessionToken) => {
  return jwt.sign(
    { 
      userId: usuarioId,
      sessionToken: sessionToken
    },
    process.env.JWT_SECRET || 'sua-chave-secreta',
    { expiresIn: '7d' }
  );
};
