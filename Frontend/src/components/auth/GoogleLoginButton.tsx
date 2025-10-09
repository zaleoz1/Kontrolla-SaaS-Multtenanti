import React from 'react';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/button';
import { toast } from 'sonner';

interface GoogleLoginButtonProps {
  tenantSlug?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  className?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function GoogleLoginButton({ 
  tenantSlug, 
  onSuccess, 
  onError, 
  className = '',
  variant = 'outline',
  size = 'default'
}: GoogleLoginButtonProps) {
  const navigate = useNavigate();
  const { loginWithGoogle } = useAuth();

  // Check if Google OAuth is available
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  
  if (!googleClientId) {
    console.warn('⚠️ Google OAuth not configured - VITE_GOOGLE_CLIENT_ID not found');
    return (
      <div className={`flex justify-center ${className}`}>
        <div className="text-center p-4 text-gray-500">
          <p>Google OAuth não configurado</p>
          <p className="text-sm">Configure VITE_GOOGLE_CLIENT_ID no arquivo .env</p>
        </div>
      </div>
    );
  }

  const handleSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      console.log('🎫 Credencial Google recebida:', credentialResponse);
      
      if (!credentialResponse.credential) {
        throw new Error('Credencial não fornecida pelo Google');
      }

      const result = await loginWithGoogle(credentialResponse.credential, tenantSlug);
      
      if (result.success) {
        toast.success('Login realizado com sucesso!');
        onSuccess?.();
        navigate('/dashboard');
      } else {
        throw new Error(result.error || 'Acesso negado');
      }
    } catch (error: any) {
      console.error('❌ Erro no login Google:', error);
      const errorMessage = error.message || 'Erro ao fazer login com Google';
      toast.error(errorMessage);
      onError?.(errorMessage);
    }
  };

  const handleError = () => {
    const errorMessage = 'Erro ao fazer login com Google';
    console.error('❌ Erro no componente Google Login');
    toast.error(errorMessage);
    onError?.(errorMessage);
  };

  // Usar o componente original do Google OAuth com estilos customizados
  return (
    <div className={`flex justify-center ${className}`}>
      <div className="google-login-wrapper">
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={handleError}
          useOneTap={false}
          auto_select={false}
          theme="outline"
          size="large"
          text="signin_with"
          shape="rectangular"
          logo_alignment="left"
          width="auto"
          locale="pt-BR"
        />
      </div>
    </div>
  );
}

// Componente alternativo usando botão customizado
export function GoogleLoginButtonCustom({ 
  tenantSlug, 
  onSuccess, 
  onError, 
  className = '',
  variant = 'outline',
  size = 'default'
}: GoogleLoginButtonProps) {
  const navigate = useNavigate();
  const { loginWithGoogle } = useAuth();

  // Check if Google OAuth is available
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  
  if (!googleClientId) {
    console.warn('⚠️ Google OAuth not configured - VITE_GOOGLE_CLIENT_ID not found');
    return (
      <div className={`flex justify-center ${className}`}>
        <div className="text-center p-4 text-gray-500">
          <p>Google OAuth não configurado</p>
          <p className="text-sm">Configure VITE_GOOGLE_CLIENT_ID no arquivo .env</p>
        </div>
      </div>
    );
  }

  const handleGoogleLogin = async () => {
    try {
      // Redirecionar para o backend que fará o redirect para o Google
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const googleAuthUrl = `${backendUrl}/api/auth/google${tenantSlug ? `?tenant_slug=${tenantSlug}` : ''}`;
      
      console.log('🔗 Redirecionando para Google OAuth:', googleAuthUrl);
      window.location.href = googleAuthUrl;
    } catch (error: any) {
      console.error('❌ Erro ao iniciar login Google:', error);
      const errorMessage = error.message || 'Erro ao iniciar login com Google';
      toast.error(errorMessage);
      onError?.(errorMessage);
    }
  };

  // Estilos que combinam com as páginas de Login e Signup
  const buttonHeight = size === 'sm' ? 'h-10' : size === 'lg' ? 'h-12' : 'h-10 sm:h-12';
  const iconSize = size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-3 w-3 sm:h-4 sm:w-4';
  const textSize = size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-lg' : 'text-sm sm:text-base';

  return (
    <button
      type="button"
      onClick={handleGoogleLogin}
      className={`w-full ${buttonHeight} bg-white/10 border border-white/20 text-white hover:bg-white/20 hover:border-emerald-400/50 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all duration-300 rounded-md flex items-center justify-center gap-2 ${textSize} font-medium ${className}`}
    >
      <svg className={iconSize} viewBox="0 0 24 24">
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
      Entrar com Google
    </button>
  );
}
