import { useState, useCallback } from 'react';
import { useApi } from './useApi';
import { API_ENDPOINTS } from '../config/api';
import { toast } from 'sonner';

interface EmailVerificationData {
  email: string;
  tipo: 'cadastro' | 'login' | 'recuperacao_senha';
  tenant_id?: number;
  usuario_id?: number;
}

interface VerificationResult {
  success: boolean;
  data?: any;
  error?: string;
}

export function useEmailVerification() {
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const api = useApi();

  const sendVerificationCode = useCallback(async (data: EmailVerificationData): Promise<VerificationResult> => {
    setIsLoading(true);
    
    try {
      const response = await api.makeRequest(API_ENDPOINTS.AUTH.SEND_VERIFICATION_CODE, {
        method: 'POST',
        body: data
      });

      if (response.success) {
        toast.success('Código de verificação enviado!');
        return { success: true, data: response };
      } else {
        throw new Error(response.error || 'Erro ao enviar código');
      }
    } catch (error: any) {
      console.error('❌ Erro ao enviar código:', error);
      const errorMessage = error.message || 'Erro ao enviar código de verificação';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  const verifyCode = useCallback(async (
    email: string, 
    codigo: string, 
    tipo: 'cadastro' | 'login' | 'recuperacao_senha' = 'cadastro'
  ): Promise<VerificationResult> => {
    setIsLoading(true);
    
    try {
      const response = await api.makeRequest(API_ENDPOINTS.AUTH.VERIFY_CODE, {
        method: 'POST',
        body: {
          email,
          codigo,
          tipo
        }
      });

      if (response.success) {
        toast.success('Email verificado com sucesso!');
        return { success: true, data: response };
      } else {
        throw new Error(response.error || 'Erro ao verificar código');
      }
    } catch (error: any) {
      console.error('❌ Erro ao verificar código:', error);
      const errorMessage = error.message || 'Erro ao verificar código';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  const resendVerificationCode = useCallback(async (
    email: string, 
    tipo: 'cadastro' | 'login' | 'recuperacao_senha' = 'cadastro'
  ): Promise<VerificationResult> => {
    setIsResending(true);
    
    try {
      const response = await api.makeRequest(API_ENDPOINTS.AUTH.RESEND_VERIFICATION_CODE, {
        method: 'POST',
        body: {
          email,
          tipo
        }
      });

      if (response.success) {
        toast.success('Código reenviado com sucesso!');
        return { success: true, data: response };
      } else {
        throw new Error(response.error || 'Erro ao reenviar código');
      }
    } catch (error: any) {
      console.error('❌ Erro ao reenviar código:', error);
      const errorMessage = error.message || 'Erro ao reenviar código';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsResending(false);
    }
  }, [api]);

  const testEmailConfig = useCallback(async (): Promise<VerificationResult> => {
    try {
      const response = await api.makeRequest(API_ENDPOINTS.AUTH.TEST_EMAIL_CONFIG, {
        method: 'GET'
      });

      if (response.success) {
        return { success: true, data: response };
      } else {
        throw new Error(response.error || 'Configuração de email inválida');
      }
    } catch (error: any) {
      console.error('❌ Erro na configuração de email:', error);
      return { success: false, error: error.message };
    }
  }, [api]);

  return {
    isLoading,
    isResending,
    sendVerificationCode,
    verifyCode,
    resendVerificationCode,
    testEmailConfig
  };
}
