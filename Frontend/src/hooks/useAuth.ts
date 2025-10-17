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

  // Verificar se há token no localStorage e validar com o servidor
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      const rememberMe = localStorage.getItem('rememberMe') === 'true';

      if (token && userData && rememberMe) {
        try {
          const user = JSON.parse(userData);
          
          // Verificar se o token ainda é válido
          const isValid = await verifyToken();
          
          if (isValid) {
            console.log('Login automático realizado com sucesso');
            setAuthState({
              user,
              isAuthenticated: true,
              loading: false,
            });
          } else {
            // Token inválido, limpar dados
            console.log('Token inválido, limpando dados de login automático');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('rememberMe');
            localStorage.removeItem('rememberedEmail');
            setAuthState({
              user: null,
              isAuthenticated: false,
              loading: false,
            });
          }
        } catch (error) {
          console.error('Erro ao verificar token para login automático:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('rememberMe');
          localStorage.removeItem('rememberedEmail');
          setAuthState({
            user: null,
            isAuthenticated: false,
            loading: false,
          });
        }
      } else if (token && userData && !rememberMe) {
        // Se há token mas "Lembrar-me" não está ativo, verificar se ainda é válido
        // mas não fazer login automático
        try {
          const isValid = await verifyToken();
          if (isValid) {
            const user = JSON.parse(userData);
            setAuthState({
              user,
              isAuthenticated: true,
              loading: false,
            });
          } else {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setAuthState({
              user: null,
              isAuthenticated: false,
              loading: false,
            });
          }
        } catch (error) {
          console.error('Erro ao verificar token:', error);
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
    };

    initializeAuth();
  }, []);

  // Escutar eventos de atualização do usuário
  useEffect(() => {
    const handleUserUpdate = (event: CustomEvent) => {
      const updatedUser = event.detail;
      setAuthState(prev => ({
        ...prev,
        user: updatedUser,
      }));
    };

    window.addEventListener('userUpdated', handleUserUpdate as EventListener);
    return () => window.removeEventListener('userUpdated', handleUserUpdate as EventListener);
  }, []);

  // Lidar com callback do Google OAuth
  useEffect(() => {
    const handleGoogleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      const googleAuth = urlParams.get('google_auth');
      const newUser = urlParams.get('new_user');

      if (token && googleAuth === 'true') {
        // Salvar token no localStorage
        localStorage.setItem('token', token);
        
        // Verificar se o token é válido
        const isValid = await verifyToken();
        if (isValid) {
          // Limpar parâmetros da URL
          const newUrl = window.location.pathname;
          window.history.replaceState({}, document.title, newUrl);
        } else {
          // Redirecionar para login em caso de erro
          navigate('/login?error=google_auth_failed');
        }
      }
    };

    // Verificar se há parâmetros do Google OAuth na URL
    handleGoogleCallback();
  }, [navigate]);

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
      
      // Limpar todos os dados de autenticação
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('rememberMe');
      localStorage.removeItem('rememberedEmail');
      
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

      // Verificar se o token não expirou localmente primeiro
      try {
        const tokenPayload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Math.floor(Date.now() / 1000);
        
        if (tokenPayload.exp && tokenPayload.exp < currentTime) {
          console.log('Token expirado localmente');
          throw new Error('Token expirado');
        }
      } catch (e) {
        console.log('Erro ao verificar expiração local do token:', e);
        throw new Error('Token inválido');
      }

      const response = await api.makeRequest(API_ENDPOINTS.AUTH.VERIFY);
      
      if (response.valid && response.user) {
        // Atualizar dados do usuário se necessário
        localStorage.setItem('user', JSON.stringify(response.user));
        setAuthState({
          user: response.user,
          isAuthenticated: true,
          loading: false,
        });
        return true;
      }

      throw new Error('Token inválido');
    } catch (error) {
      console.error('Erro na verificação do token:', error);
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

  // Função para renovar token automaticamente
  const refreshToken = useCallback(async () => {
    try {
      const response = await api.makeRequest(API_ENDPOINTS.AUTH.REFRESH, {
        method: 'POST',
      });
      
      if (response.token) {
        localStorage.setItem('token', response.token);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro ao renovar token:', error);
      return false;
    }
  }, [api]);

  // Verificar e renovar token periodicamente
  useEffect(() => {
    if (!authState.isAuthenticated) return;

    const checkTokenExpiration = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const tokenPayload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Math.floor(Date.now() / 1000);
        const timeUntilExpiry = tokenPayload.exp - currentTime;
        
        // Se o token expira em menos de 5 minutos, tentar renovar
        if (timeUntilExpiry < 300 && timeUntilExpiry > 0) {
          console.log('Token próximo do vencimento, tentando renovar...');
          const refreshed = await refreshToken();
          if (!refreshed) {
            console.log('Falha ao renovar token, fazendo logout...');
            await logout();
          }
        }
      } catch (error) {
        console.error('Erro ao verificar expiração do token:', error);
      }
    };

    // Verificar a cada 5 minutos
    const interval = setInterval(checkTokenExpiration, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [authState.isAuthenticated, refreshToken, logout]);

  const loginWithGoogle = useCallback(async (googleToken: string, tenantSlug?: string) => {
    try {
      const response = await api.makeRequest(API_ENDPOINTS.AUTH.GOOGLE_VERIFY, {
        method: 'POST',
        body: {
          token: googleToken,
          tenant_slug: tenantSlug
        },
      });

      if (response && response.token) {
        // Salvar token e dados do usuário
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        setAuthState({
          user: response.user,
          isAuthenticated: true,
          loading: false,
        });

        // Limpar operador selecionado no login
        limparOperador();

        return { success: true, data: response };
      }

      throw new Error('Resposta inválida do servidor');
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message || 'Erro ao fazer login com Google' 
      };
    }
  }, [api, limparOperador]);

  // Função para verificar se o login automático está disponível
  const isAutoLoginAvailable = useCallback(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    const rememberMe = localStorage.getItem('rememberMe') === 'true';
    
    return !!(token && userData && rememberMe);
  }, []);

  // Função para desativar o "Lembrar-me"
  const disableRememberMe = useCallback(() => {
    localStorage.removeItem('rememberMe');
    localStorage.removeItem('rememberedEmail');
  }, []);

  return {
    ...authState,
    login,
    signup,
    logout,
    verifyToken,
    changePassword,
    updateUser,
    loginWithGoogle,
    isAutoLoginAvailable,
    disableRememberMe,
  };
}
