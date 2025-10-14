// Configuração da API
// Detecta se está rodando no Electron para usar configuração específica
const isElectron = () => {
  return typeof window !== 'undefined' && 
         window.navigator && 
         window.navigator.userAgent && 
         window.navigator.userAgent.includes('Electron');
};

export const API_CONFIG = {
  BASE_URL: (() => {
    // Se estiver rodando no Electron, usar VPS diretamente
    if (isElectron()) {
      return 'https://pvd.kontrollapro.com.br/api';
    }
    
    // Configuração normal para web
    return import.meta.env.VITE_API_URL || 
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? 'http://localhost:3000/api' 
        : `${window.location.protocol}//${window.location.host}/api`);
  })(),
  TIMEOUT: isElectron() ? 15000 : 10000, // Timeout maior para Electron
  RETRY_ATTEMPTS: 3,
};

// API Configuration

// Endpoints da API
export const API_ENDPOINTS = {
  // Autenticação
  AUTH: {
    LOGIN: '/auth/login',
    SIGNUP: '/auth/signup',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
    VERIFY: '/auth/verify',
    CHANGE_PASSWORD: '/auth/change-password',
    FORGOT_PASSWORD: '/auth/forgot-password',
    VERIFY_RESET_CODE: '/auth/verify-reset-code',
    RESET_PASSWORD: '/auth/reset-password',
    GOOGLE: '/auth/google',
    GOOGLE_CALLBACK: '/auth/google/callback',
    GOOGLE_VERIFY: '/auth/google/verify',
    SEND_VERIFICATION_CODE: '/auth/send-verification-code',
    VERIFY_CODE: '/auth/verify-code',
    RESEND_VERIFICATION_CODE: '/auth/resend-verification-code',
    TEST_EMAIL_CONFIG: '/auth/test-email-config',
  },
  
  // Produtos
  PRODUCTS: {
    LIST: '/produtos',
    CREATE: '/produtos',
    GET: (id: number) => `/produtos/${id}`,
    UPDATE: (id: number) => `/produtos/${id}`,
    DELETE: (id: number) => `/produtos/${id}`,
    SEARCH_BARCODE: (code: string) => `/produtos/buscar/codigo-barras/${code}`,
    LOW_STOCK: '/produtos/estoque/baixo',
    STATS: '/produtos/stats/overview',
  },
  
  // Vendas
  SALES: {
    LIST: '/vendas',
    CREATE: '/vendas',
    GET: (id: number) => `/vendas/${id}`,
    UPDATE_STATUS: (id: number) => `/vendas/${id}/status`,
    DELETE: (id: number) => `/vendas/${id}`,
    STATS: '/vendas/stats/overview',
  },
  
  // Clientes
  CLIENTS: {
    LIST: '/clientes',
    CREATE: '/clientes',
    GET: (id: number) => `/clientes/${id}`,
    UPDATE: (id: number) => `/clientes/${id}`,
    DELETE: (id: number) => `/clientes/${id}`,
    STATS: '/clientes/stats/overview',
  },
  
  // Financeiro
  FINANCIAL: {
    TRANSACTIONS: '/financeiro/transacoes',
    TRANSACTION: (id: number) => `/financeiro/transacoes/${id}`,
    ACCOUNTS_RECEIVABLE: '/financeiro/contas-receber',
    ACCOUNTS_PAYABLE: '/financeiro/contas-pagar',
    STATS: '/financeiro/stats/overview',
  },
  
  // Relatórios
  REPORTS: {
    SALES_PERIOD: '/relatorios/vendas-periodo',
    PRODUCTS_SOLD: '/relatorios/produtos-vendidos',
    CLIENT_ANALYSIS: '/relatorios/analise-clientes',
    FINANCIAL: '/relatorios/financeiro',
    STOCK_CONTROL: '/relatorios/controle-estoque',
    PERFORMANCE: '/relatorios/performance-vendas',
  },
  
  // Dashboard
  DASHBOARD: {
    METRICS: '/dashboard/metricas',
    RECENT_SALES: '/dashboard/vendas-recentes',
    LOW_STOCK: '/dashboard/estoque-baixo',
    SALES_CHART: '/dashboard/grafico-vendas',
    TOP_PRODUCTS: '/dashboard/top-produtos',
    FINANCIAL_SUMMARY: '/dashboard/resumo-financeiro',
  },
  
  // Catálogo
  CATALOG: {
    PRODUCTS: '/catalogo/produtos',
    PRODUCT: (id: number) => `/catalogo/produtos/${id}`,
    CATEGORIES: '/catalogo/categorias',
    CREATE_CATEGORY: '/catalogo/categorias',
    HIGHLIGHTS: '/catalogo/destaques',
    RELATED: (id: number) => `/catalogo/produtos/${id}/relacionados`,
    SEARCH_BARCODE: (code: string) => `/catalogo/buscar/codigo-barras/${code}`,
    STATS: '/catalogo/stats',
    CONFIG: '/catalogo/configuracoes',
  },
  
  // Fornecedores
  FORNECEDORES: {
    LIST: '/fornecedores',
    CREATE: '/fornecedores',
    GET: (id: number) => `/fornecedores/${id}`,
    UPDATE: (id: number) => `/fornecedores/${id}`,
    DELETE: (id: number) => `/fornecedores/${id}`,
    SEARCH_CEP: (cep: string) => `/fornecedores/buscar/cep/${cep}`,
    STATS: '/fornecedores/stats/overview',
  },
  
  // Funcionários
  FUNCIONARIOS: {
    LIST: '/funcionarios',
    CREATE: '/funcionarios',
    GET: (id: number) => `/funcionarios/${id}`,
    UPDATE: (id: number) => `/funcionarios/${id}`,
    DELETE: (id: number) => `/funcionarios/${id}`,
    SEARCH_CEP: (cep: string) => `/funcionarios/buscar/cep/${cep}`,
    STATS: '/funcionarios/stats/overview',
  },
};

// Status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// Mensagens de erro padrão
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Erro de conexão. Verifique sua internet.',
  TIMEOUT: 'Tempo limite excedido. Tente novamente.',
  UNAUTHORIZED: 'Email ou senha incorretos. Verifique suas credenciais e tente novamente.',
  FORBIDDEN: 'Você não tem permissão para esta ação.',
  NOT_FOUND: 'Esse Usuário não esta cadastrado no sistema.',
  SERVER_ERROR: 'Erro interno do servidor. Tente novamente mais tarde.',
  VALIDATION_ERROR: 'Dados inválidos. Verifique os campos.',
  UNKNOWN_ERROR: 'Erro desconhecido. Tente novamente.',
} as const;
