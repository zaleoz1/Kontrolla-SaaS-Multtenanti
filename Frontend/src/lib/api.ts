import axios from 'axios';
import { API_CONFIG, HTTP_STATUS, ERROR_MESSAGES } from '@/config/api';

// Instância do axios configurada
const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token de autenticação
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratar respostas e erros
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      const { status } = error.response;
      
      switch (status) {
        case HTTP_STATUS.UNAUTHORIZED:
          // Token expirado ou inválido
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          break;
        case HTTP_STATUS.FORBIDDEN:
          console.error(ERROR_MESSAGES.FORBIDDEN);
          break;
        case HTTP_STATUS.NOT_FOUND:
          console.error(ERROR_MESSAGES.NOT_FOUND);
          break;
        case HTTP_STATUS.INTERNAL_SERVER_ERROR:
          console.error(ERROR_MESSAGES.SERVER_ERROR);
          break;
        default:
          console.error(ERROR_MESSAGES.UNKNOWN_ERROR);
      }
    } else if (error.request) {
      // Erro de rede
      console.error(ERROR_MESSAGES.NETWORK_ERROR);
    } else {
      // Outros erros
      console.error(ERROR_MESSAGES.UNKNOWN_ERROR);
    }
    
    return Promise.reject(error);
  }
);

// Função para fazer requisições GET
export const get = async <T = any>(url: string, config?: any): Promise<T> => {
  const response = await api.get<T>(url, config);
  return response.data;
};

// Função para fazer requisições POST
export const post = async <T = any>(url: string, data?: any, config?: any): Promise<T> => {
  const response = await api.post<T>(url, data, config);
  return response.data;
};

// Função para fazer requisições PUT
export const put = async <T = any>(url: string, data?: any, config?: any): Promise<T> => {
  const response = await api.put<T>(url, data, config);
  return response.data;
};

// Função para fazer requisições PATCH
export const patch = async <T = any>(url: string, data?: any, config?: any): Promise<T> => {
  const response = await api.patch<T>(url, data, config);
  return response.data;
};

// Função para fazer requisições DELETE
export const del = async <T = any>(url: string, config?: any): Promise<T> => {
  const response = await api.delete<T>(url, config);
  return response.data;
};

// Exportar a instância do axios para uso direto
export { api };
export default api;
