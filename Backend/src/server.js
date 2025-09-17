import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

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
app.use(compression());

// Middleware de CORS
const allowedOrigins = [
  'http://localhost:5173', // Vite dev server padrão
  'http://localhost:8080', // Vite dev server alternativo
  'http://localhost:3000', // React dev server
  'http://127.0.0.1:5173',
  'http://127.0.0.1:8080',
  'http://127.0.0.1:3000'
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

// Rota de health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
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
