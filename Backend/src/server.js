import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';   
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';          
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';      
import fs from 'fs';       

// Importar rotas
import authRoutes from './routes/auth.js';
import clientesRoutes from './routes/clientes.js';
import produtosRoutes from './routes/produtos.js';
import vendasRoutes from './routes/vendas.js';
import financeiroRoutes from './routes/financeiro.js';
import nfeRoutes from './routes/nfe.js';
import relatoriosRoutes from './routes/relatorios.js';
import dashboardRoutes from './routes/dashboard.js';
import catalogoRoutes from './routes/catalogo.js';
import configuracoesRoutes from './routes/configuracoes.js';
import fornecedoresRoutes from './routes/fornecedores.js';
import funcionariosRoutes from './routes/funcionarios.js';
import notificationsRoutes from './routes/notifications.js';

// Importar middleware
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';

// Configurar dotenv
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware de segurança
app.use(helmet());

// Configurar compressão para não comprimir arquivos binários
app.use(compression({
  filter: (req, res) => {
    // Não comprimir arquivos executáveis e outros binários
    if (req.url.includes('.exe') || req.url.includes('.zip') || req.url.includes('.msi')) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// Middleware de CORS
const allowedOrigins = [
  'http://localhost:5173', // Vite dev server padrão
  'http://localhost:8080', // Vite dev server alternativo
  'http://localhost:3000', // React dev server
  'http://localhost', // Frontend Docker
  'http://127.0.0.1:5173',
  'http://127.0.0.1:8080',
  'http://127.0.0.1:3000',
  'http://127.0.0.1'
];

app.use(cors({
  origin: function (origin, callback) {
    // Permitir requisições sem origin (ex: mobile apps, Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      // Em desenvolvimento, permitir qualquer origin local
      if (process.env.NODE_ENV === 'development' && origin.includes('localhost')) {
        callback(null, true);
      } else {
        callback(new Error('Não permitido pelo CORS'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Middleware de rate limiting (mais permissivo para desenvolvimento)
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 1 * 60 * 1000, // 1 minuto
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000, // limite de 1000 requests por IP
  message: {
    error: 'Muitas tentativas. Tente novamente em alguns minutos.'
  },
  // Pular rate limiting em desenvolvimento
  skip: (req) => process.env.NODE_ENV === 'development'
});
app.use('/api/', limiter);

// Middleware de logging
app.use(morgan('combined'));

// Middleware para parsing de JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir arquivos estáticos
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Servir arquivos do aplicativo desktop
app.use('/dist-electron', express.static(path.join(__dirname, '../../dist-electron')));
app.use('/downloads', express.static(path.join(__dirname, '../../dist-electron')));

// Rota específica para download do aplicativo
app.get('/api/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '../../dist-electron', filename);
  
  // Verificar se o arquivo existe
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Arquivo não encontrado' });
  }
  
  // Obter informações do arquivo
  const stats = fs.statSync(filePath);
  const fileSize = stats.size;
  
  // Configurar headers para download correto
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Length', fileSize);
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  // Desabilitar compressão para este arquivo específico
  res.setHeader('Content-Encoding', 'identity');
  
  // Enviar o arquivo
  res.sendFile(filePath);
});

// Rota de health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// Rota raiz da API
app.get('/', (req, res) => {
  res.json({
    message: 'KontrollaPro API',
    version: '1.0.0',
    status: 'OK',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      clientes: '/api/clientes',
      produtos: '/api/produtos',
      vendas: '/api/vendas',
      financeiro: '/api/financeiro',
      relatorios: '/api/relatorios',
      dashboard: '/api/dashboard',
      catalogo: '/api/catalogo'
    }
  });
});

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/produtos', produtosRoutes);
app.use('/api/vendas', vendasRoutes);
app.use('/api/financeiro', financeiroRoutes);
app.use('/api/nfe', nfeRoutes);
app.use('/api/relatorios', relatoriosRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/catalogo', catalogoRoutes);
app.use('/api/configuracoes', configuracoesRoutes);
app.use('/api/fornecedores', fornecedoresRoutes);
app.use('/api/funcionarios', funcionariosRoutes);
app.use('/api/notifications', notificationsRoutes);

// Middleware para rotas não encontradas
app.use(notFound);

// Middleware de tratamento de erros
app.use(errorHandler);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📊 Ambiente: ${process.env.NODE_ENV}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
});

export default app;
