import { useState, useCallback } from 'react';
import { API_CONFIG, API_ENDPOINTS, HTTP_STATUS, ERROR_MESSAGES } from '@/config/api';

interface ApiResponse<T = any> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
}

export function useApi<T = any>() {
  const [state, setState] = useState<ApiResponse<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const makeRequest = useCallback(async (
    endpoint: string,
    options: ApiOptions = {}
  ): Promise<T> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const {
        method = 'GET',
        headers = {},
        body,
        timeout = API_CONFIG.TIMEOUT,
      } = options;

      const token = localStorage.getItem('token');
      const defaultHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        ...headers,
      };

      if (token) {
        defaultHeaders.Authorization = `Bearer ${token}`;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
        method,
        headers: defaultHeaders,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMessage = ERROR_MESSAGES.UNKNOWN_ERROR;
        
        switch (response.status) {
          case HTTP_STATUS.UNAUTHORIZED:
            errorMessage = ERROR_MESSAGES.UNAUTHORIZED;
            // Limpar token inválido
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            break;
          case HTTP_STATUS.FORBIDDEN:
            errorMessage = ERROR_MESSAGES.FORBIDDEN;
            break;
          case HTTP_STATUS.NOT_FOUND:
            errorMessage = ERROR_MESSAGES.NOT_FOUND;
            break;
          case HTTP_STATUS.BAD_REQUEST:
            errorMessage = ERROR_MESSAGES.VALIDATION_ERROR;
            break;
          case HTTP_STATUS.INTERNAL_SERVER_ERROR:
            errorMessage = ERROR_MESSAGES.SERVER_ERROR;
            break;
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();
      setState({ data, loading: false, error: null });
      return data;

    } catch (error: any) {
      let errorMessage = ERROR_MESSAGES.UNKNOWN_ERROR;

      if (error.name === 'AbortError') {
        errorMessage = ERROR_MESSAGES.TIMEOUT;
      } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage = ERROR_MESSAGES.NETWORK_ERROR;
      } else if (error.message) {
        errorMessage = error.message;
      }

      setState({ data: null, loading: false, error: errorMessage });
      throw error;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return {
    ...state,
    makeRequest,
    reset,
  };
}

// Hook específico para operações CRUD
export function useCrudApi<T = any>(endpoint: string) {
  const api = useApi<T>();

  const list = useCallback(async (params?: Record<string, any>) => {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return api.makeRequest(`${endpoint}${queryString}`);
  }, [api, endpoint]);

  const get = useCallback(async (id: number) => {
    return api.makeRequest(`${endpoint}/${id}`);
  }, [api, endpoint]);

  const create = useCallback(async (data: any) => {
    return api.makeRequest(endpoint, {
      method: 'POST',
      body: data,
    });
  }, [api, endpoint]);

  const update = useCallback(async (id: number, data: any) => {
    return api.makeRequest(`${endpoint}/${id}`, {
      method: 'PUT',
      body: data,
    });
  }, [api, endpoint]);

  const remove = useCallback(async (id: number) => {
    return api.makeRequest(`${endpoint}/${id}`, {
      method: 'DELETE',
    });
  }, [api, endpoint]);

  return {
    ...api,
    list,
    get,
    create,
    update,
    remove,
  };
}
