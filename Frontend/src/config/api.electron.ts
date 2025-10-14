// Configuração específica da API para Electron Desktop
// Conecta diretamente ao VPS para dados na nuvem

const VPS_CONFIG = {
  HOST: 'pvd.kontrollapro.com.br',
  PORT: '443',
  PROTOCOL: 'https'
};

export const API_CONFIG_ELECTRON = {
  BASE_URL: `${VPS_CONFIG.PROTOCOL}://${VPS_CONFIG.HOST}/api`,
  TIMEOUT: 15000, // Timeout maior para conexões remotas
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
  
  // Headers específicos para Electron
  HEADERS: {
    'Content-Type': 'application/json',
    'User-Agent': 'KontrollaPro-Desktop/1.0.0',
    'X-Client-Type': 'electron-desktop'
  }
};

// Configuração de health check
export const HEALTH_CHECK = {
  URL: `${VPS_CONFIG.PROTOCOL}://${VPS_CONFIG.HOST}/health`,
  INTERVAL: 30000, // Check a cada 30 segundos
  TIMEOUT: 5000
};

// Electron API Configuration

export default API_CONFIG_ELECTRON;