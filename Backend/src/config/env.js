import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Determinar qual arquivo .env carregar baseado no ambiente
const envFile = process.env.NODE_ENV === 'production' 
  ? path.join(__dirname, '../../env.production')
  : path.join(__dirname, '../../.env');

// Carregar variáveis de ambiente
dotenv.config({ path: envFile });

// Configurações do ambiente
export const config = {
  // Servidor
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Banco de dados
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME || 'kontrollapro'
  },
  
  // Autenticação
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'default_secret_change_in_production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
    sessionSecret: process.env.SESSION_SECRET || 'default_session_secret_change_in_production',
    apiKey: process.env.API_KEY || '',
    encryptionKey: process.env.ENCRYPTION_KEY || ''
  },
  
  // Upload
  upload: {
    path: process.env.UPLOAD_PATH || './uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880 // 5MB
  },
  
  // Rate limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutos
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
  },
  
  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173'
  },
  
  // Email
  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || '',
    from: process.env.EMAIL_FROM || 'noreply@kontrollapro.com'
  },
  
  // NF-e
  nfe: {
    certificadoPath: process.env.NFE_CERTIFICADO_PATH || './certificados/certificado.pfx',
    certificadoPassword: process.env.NFE_CERTIFICADO_PASSWORD || '',
    ambiente: process.env.NFE_AMBIENTE || 'homologacao'
  },
  
  // Cloudinary
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || ''
  },
  
  // Google OAuth
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback'
  },
  
  // Segurança
  security: {
    helmetCspEnabled: process.env.HELMET_CSP_ENABLED === 'true',
    helmetHstsEnabled: process.env.HELMET_HSTS_ENABLED === 'true',
    sslEnabled: process.env.SSL_ENABLED === 'true',
    sslRedirect: process.env.SSL_REDIRECT === 'true'
  },
  
  // Log
  log: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'combined'
  },
  
  // Cache
  cache: {
    ttl: parseInt(process.env.CACHE_TTL) || 3600
  },
  
  // Backup
  backup: {
    enabled: process.env.BACKUP_ENABLED === 'true',
    schedule: process.env.BACKUP_SCHEDULE || '0 2 * * *'
  },
  
  // Monitoramento
  monitoring: {
    healthCheckEnabled: process.env.HEALTH_CHECK_ENABLED === 'true',
    metricsEnabled: process.env.METRICS_ENABLED === 'true'
  },
  
  // Compressão
  compression: {
    enabled: process.env.COMPRESSION_ENABLED === 'true',
    level: parseInt(process.env.COMPRESSION_LEVEL) || 6
  },
  
  // Timeout
  timeout: {
    request: parseInt(process.env.REQUEST_TIMEOUT) || 30000,
    keepAlive: parseInt(process.env.KEEP_ALIVE_TIMEOUT) || 5000
  },
  
  // Workers
  workers: {
    count: parseInt(process.env.WORKERS) || 1,
    clusterMode: process.env.CLUSTER_MODE === 'true'
  }
};

// Validar configurações críticas em produção
if (config.nodeEnv === 'production') {
  const requiredVars = [
    'JWT_SECRET',
    'SESSION_SECRET',
    'DB_HOST',
    'DB_USER',
    'DB_PASSWORD',
    'DB_NAME'
  ];
  
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Variáveis de ambiente obrigatórias não encontradas:', missingVars);
    process.exit(1);
  }
  
  // Validar JWT_SECRET
  if (config.auth.jwtSecret === 'default_secret_change_in_production' || 
      config.auth.jwtSecret.length < 32) {
    console.error('❌ JWT_SECRET deve ter pelo menos 32 caracteres em produção');
    process.exit(1);
  }
  
  // Validar SESSION_SECRET
  if (config.auth.sessionSecret === 'default_session_secret_change_in_production' || 
      config.auth.sessionSecret.length < 32) {
    console.error('❌ SESSION_SECRET deve ter pelo menos 32 caracteres em produção');
    process.exit(1);
  }
}

export default config;
