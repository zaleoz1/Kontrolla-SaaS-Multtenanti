import express from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { query, queryWithResult } from '../database/connection.js';
import { 
  authenticateToken, 
  requireAdmin, 
  createUserSession, 
  invalidateSession, 
  generateJWT 
} from '../middleware/auth.js';
import { validateLogin, validateSignup } from '../middleware/validation.js';

const router = express.Router();

// Rota de cadastro
router.post('/signup', validateSignup, async (req, res) => {
  try {
    console.log('📝 Iniciando processo de cadastro...');
    console.log('📋 Dados recebidos:', req.body);
    
    const { 
      firstName, 
      lastName, 
      email, 
      phone, 
      company, 
      tipoPessoa,
      cpfCnpj,
      cep,
      endereco,
      cidade,
      estado,
      razaoSocial,
      nomeFantasia,
      inscricaoEstadual,
      inscricaoMunicipal,
      password, 
      confirmPassword, 
      selectedPlan,
      acceptTerms 
    } = req.body;

    // Validações são feitas pelo middleware validateSignup

    // Verificar se o email já existe em qualquer tenant
    console.log('🔍 Verificando se email já existe...');
    const existingUsers = await query(
      'SELECT id FROM usuarios WHERE email = ?',
      [email]
    );
    console.log('📊 Usuários encontrados com este email:', existingUsers.length);

    if (existingUsers.length > 0) {
      console.log('❌ Email já está em uso');
      return res.status(400).json({
        error: 'Este email já está em uso'
      });
    }

    // Criar tenant para o novo usuário
    console.log('🏢 Criando tenant...');
    const tenantSlug = company.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Remove caracteres especiais
      .replace(/\s+/g, '-') // Substitui espaços por hífens
      .replace(/-+/g, '-') // Remove hífens duplicados
      .replace(/^-|-$/g, ''); // Remove hífens do início e fim

    console.log('🏷️ Tenant slug gerado:', tenantSlug);

    // Verificar se o slug já existe
    let finalSlug = tenantSlug || 'empresa';
    let counter = 1;
    while (true) {
      const existingTenants = await query(
        'SELECT id FROM tenants WHERE slug = ?',
        [finalSlug]
      );
      if (existingTenants.length === 0) break;
      finalSlug = `${tenantSlug || 'empresa'}-${counter}`;
      counter++;
    }
    console.log('🏷️ Slug final do tenant:', finalSlug);

    // Truncar campos para evitar erro de tamanho
    const truncateField = (field, maxLength) => {
      if (!field) return null;
      return field.length > maxLength ? field.substring(0, maxLength) : field;
    };

    // Criar tenant
    console.log('💾 Inserindo tenant no banco...');
    const tenantResult = await queryWithResult(
      `INSERT INTO tenants (
        nome, slug, email, telefone, status, plano, tipo_pessoa, 
        cnpj, cpf, endereco, cidade, estado, cep, 
        razao_social, nome_fantasia, inscricao_estadual, inscricao_municipal
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        truncateField(company, 255), 
        finalSlug, 
        truncateField(email, 255), 
        truncateField(phone, 20), 
        'ativo', 
        selectedPlan, 
        tipoPessoa,
        tipoPessoa === 'juridica' ? truncateField(cpfCnpj, 18) : null,
        tipoPessoa === 'fisica' ? truncateField(cpfCnpj, 14) : null,
        truncateField(endereco, 65535), 
        truncateField(cidade, 100), 
        truncateField(estado, 2), 
        truncateField(cep, 10),
        truncateField(razaoSocial, 255), 
        truncateField(nomeFantasia, 255), 
        truncateField(inscricaoEstadual, 20), 
        truncateField(inscricaoMunicipal, 20)
      ]
    );

    const tenantId = tenantResult.insertId;
    console.log('✅ Tenant criado com ID:', tenantId);

    // Criptografar senha
    console.log('🔐 Criptografando senha...');
    const senhaHash = await bcrypt.hash(password, 12);

    // Criar usuário
    console.log('👤 Criando usuário...');
    const usuarioResult = await queryWithResult(
      `INSERT INTO usuarios (tenant_id, nome, sobrenome, email, senha, telefone, role, status, email_verificado) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [tenantId, firstName, lastName, email, senhaHash, phone, 'admin', 'ativo', true]
    );

    const usuarioId = usuarioResult.insertId;
    console.log('✅ Usuário criado com ID:', usuarioId);

    // Criar administrador automaticamente com os dados de cadastro
    console.log('👑 Criando administrador automaticamente...');
    const permissoesAdministrador = ["todos"]; // Administrador tem todas as permissões
    
    const administradorResult = await queryWithResult(
      `INSERT INTO administradores (tenant_id, nome, sobrenome, codigo, role, status, permissoes, criado_por) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [tenantId, firstName, lastName, null, 'administrador', 'ativo', JSON.stringify(permissoesAdministrador), null]
    );

    const administradorId = administradorResult.insertId;
    console.log('✅ Administrador criado automaticamente com ID:', administradorId, 'Código: null');

    // Criar sessão
    console.log('🔑 Criando sessão...');
    const sessionToken = await createUserSession(
      usuarioId, 
      tenantId, 
      req.ip, 
      req.get('User-Agent')
    );
    console.log('✅ Sessão criada');

    // Gerar JWT
    console.log('🎫 Gerando JWT...');
    const token = generateJWT(usuarioId, sessionToken);
    console.log('✅ JWT gerado');

    // Buscar dados completos do usuário
    console.log('👤 Buscando dados do usuário...');
    const usuarios = await query(
      'SELECT u.*, t.nome as tenant_nome, t.slug as tenant_slug FROM usuarios u JOIN tenants t ON u.tenant_id = t.id WHERE u.id = ?',
      [usuarioId]
    );
    console.log('✅ Dados do usuário encontrados');

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
    console.error('❌ Erro no cadastro:', error);
    console.error('❌ Stack trace:', error.stack);
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
      'SELECT u.id, u.nome, u.sobrenome, u.email, u.telefone, u.avatar, u.role, u.ultimo_login, u.tenant_id, t.nome as tenant_nome, t.slug as tenant_slug FROM usuarios u JOIN tenants t ON u.tenant_id = t.id WHERE u.id = ?',
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
    // Invalidar a sessão atual usando o sessionToken do JWT
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'sua-chave-secreta');
      await invalidateSession(decoded.sessionToken);
    }
    
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

// Rota para buscar dados do CEP
router.get('/cep/:cep', async (req, res) => {
  try {
    const { cep } = req.params;
    const cepLimpo = cep.replace(/\D/g, '');
    
    console.log('🔍 Buscando CEP no backend:', cepLimpo);
    
    if (cepLimpo.length !== 8) {
      console.log('❌ CEP inválido:', cepLimpo);
      return res.status(400).json({
        error: 'CEP deve ter 8 dígitos'
      });
    }

    // Usar a API ViaCEP para buscar dados do CEP
    const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
    const data = await response.json();

    console.log('📦 Resposta da ViaCEP:', data);

    if (data.erro) {
      console.log('❌ CEP não encontrado na ViaCEP');
      return res.status(404).json({
        error: 'CEP não encontrado'
      });
    }

    console.log('✅ CEP encontrado:', data.localidade, data.uf);

    res.json({
      cep: data.cep,
      logradouro: data.logradouro,
      complemento: data.complemento,
      bairro: data.bairro,
      localidade: data.localidade,
      uf: data.uf,
      ibge: data.ibge,
      gia: data.gia,
      ddd: data.ddd,
      siafi: data.siafi
    });
  } catch (error) {
    console.error('❌ Erro ao buscar CEP:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

export default router;
