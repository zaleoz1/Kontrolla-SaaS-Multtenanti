import jwt from 'jsonwebtoken';
import { query } from '../database/connection.js';

// Middleware para verificar autenticação
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
    
    // Buscar usuário no banco de dados
    const usuarios = await query(
      'SELECT u.*, t.nome as tenant_nome, t.slug as tenant_slug FROM usuarios u JOIN tenants t ON u.tenant_id = t.id WHERE u.id = ? AND u.status = "ativo"',
      [decoded.userId]
    );

    if (usuarios.length === 0) {
      return res.status(401).json({
        error: 'Usuário não encontrado ou inativo'
      });
    }

    const usuario = usuarios[0];

    // Adicionar informações do usuário e tenant à requisição
    req.user = {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      role: usuario.role,
      tenant_id: usuario.tenant_id,
      tenant_nome: usuario.tenant_nome,
      tenant_slug: usuario.tenant_slug
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
      
      const usuarios = await query(
        'SELECT u.*, t.nome as tenant_nome, t.slug as tenant_slug FROM usuarios u JOIN tenants t ON u.tenant_id = t.id WHERE u.id = ? AND u.status = "ativo"',
        [decoded.userId]
      );

      if (usuarios.length > 0) {
        const usuario = usuarios[0];
        req.user = {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email,
          role: usuario.role,
          tenant_id: usuario.tenant_id,
          tenant_nome: usuario.tenant_nome,
          tenant_slug: usuario.tenant_slug
        };
      }
    }

    next();
  } catch (error) {
    // Se houver erro no token, continua sem autenticação
    next();
  }
};
