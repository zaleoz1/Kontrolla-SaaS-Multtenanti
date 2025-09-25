import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from './useApi';
import { API_ENDPOINTS } from '@/config/api';
import { useOperador } from '@/contexts/OperadorContext';

interface User {
  id: number;
  nome: string;
  sobrenome: string;
  email: string;
  role: string;
  tenant_id: number;
  tenant_nome: string;
  tenant_slug: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    loading: true,
  });

  const api = useApi();
  const navigate = useNavigate();
  const { limparOperador } = useOperador();

  // Verificar se há token no localStorage
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        setAuthState({
          user,
          isAuthenticated: true,
          loading: false,
        });
      } catch (error) {
        console.error('Erro ao parsear dados do usuário:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setAuthState({
          user: null,
          isAuthenticated: false,
          loading: false,
        });
      }
    } else {
      setAuthState({
        user: null,
        isAuthenticated: false,
        loading: false,
      });
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await api.makeRequest(API_ENDPOINTS.AUTH.LOGIN, {
        method: 'POST',
        body: { email, senha: password },
      });

      if (response.token && response.user) {
        // Limpar operador selecionado no login
        limparOperador();
        
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        setAuthState({
          user: response.user,
          isAuthenticated: true,
          loading: false,
        });

        return { success: true, data: response };
      }

      throw new Error('Resposta inválida do servidor');
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message || 'Erro ao fazer login' 
      };
    }
  }, [api, limparOperador]);

  const signup = useCallback(async (userData: any) => {
    try {
      const response = await api.makeRequest(API_ENDPOINTS.AUTH.SIGNUP, {
        method: 'POST',
        body: userData,
      });

      if (response.token && response.user) {
        // Limpar operador selecionado no signup
        limparOperador();
        
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        setAuthState({
          user: response.user,
          isAuthenticated: true,
          loading: false,
        });

        return { success: true, data: response };
      }

      throw new Error('Resposta inválida do servidor');
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message || 'Erro ao criar conta' 
      };
    }
  }, [api, limparOperador]);

  const logout = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await api.makeRequest(API_ENDPOINTS.AUTH.LOGOUT, {
          method: 'POST',
        });
      }
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      // Limpar operador selecionado no logout
      limparOperador();
      
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setAuthState({
        user: null,
        isAuthenticated: false,
        loading: false,
      });
      navigate('/login');
    }
  }, [api, navigate, limparOperador]);

  const verifyToken = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token não encontrado');
      }

      const response = await api.makeRequest(API_ENDPOINTS.AUTH.VERIFY);
      
      if (response.valid && response.user) {
        setAuthState({
          user: response.user,
          isAuthenticated: true,
          loading: false,
        });
        return true;
      }

      throw new Error('Token inválido');
    } catch (error) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setAuthState({
        user: null,
        isAuthenticated: false,
        loading: false,
      });
      return false;
    }
  }, [api]);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    try {
      const response = await api.makeRequest(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, {
        method: 'PUT',
        body: {
          senhaAtual: currentPassword,
          novaSenha: newPassword,
        },
      });

      return { success: true, data: response };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message || 'Erro ao alterar senha' 
      };
    }
  }, [api]);

  const updateUser = useCallback((userData: Partial<User>) => {
    setAuthState(prev => ({
      ...prev,
      user: prev.user ? { ...prev.user, ...userData } : null,
    }));

    // Atualizar localStorage
    const currentUser = localStorage.getItem('user');
    if (currentUser) {
      const user = JSON.parse(currentUser);
      const updatedUser = { ...user, ...userData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  }, []);

  return {
    ...authState,
    login,
    signup,
    logout,
    verifyToken,
    changePassword,
    updateUser,
  };
}
