import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { useApi } from '../../hooks/useApi';
import { API_ENDPOINTS } from '../../config/api';
import { toast } from 'sonner';
import { 
  Mail, 
  Shield, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  RefreshCw,
  ArrowLeft
} from 'lucide-react';

interface EmailVerificationProps {
  email: string;
  tipo?: 'cadastro' | 'login' | 'recuperacao_senha';
  onSuccess: (data?: any) => void;
  onBack?: () => void;
  onResend?: () => void;
  className?: string;
}

export function EmailVerification({ 
  email, 
  tipo = 'cadastro', 
  onSuccess, 
  onBack,
  onResend,
  className = '' 
}: EmailVerificationProps) {
  const [codigo, setCodigo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [maxAttempts] = useState(3);
  
  const api = useApi();

  // Timer para reenvio
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!codigo.trim()) {
      toast.error('Digite o código de verificação');
      return;
    }

    if (codigo.length !== 6) {
      toast.error('O código deve ter 6 dígitos');
      return;
    }

    if (attempts >= maxAttempts) {
      toast.error('Muitas tentativas incorretas. Tente novamente mais tarde.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.makeRequest(API_ENDPOINTS.AUTH.VERIFY_CODE, {
        method: 'POST',
        body: {
          email,
          codigo: codigo.trim(),
          tipo
        }
      });

      if (response.success) {
        toast.success('Email verificado com sucesso!');
        onSuccess(response.cadastro_pendente || response);
      } else {
        throw new Error(response.error || 'Erro ao verificar código');
      }
    } catch (error: any) {
      console.error('❌ Erro ao verificar código:', error);
      setAttempts(prev => prev + 1);
      
      if (error.message?.includes('expirado')) {
        toast.error('Código expirado. Solicite um novo código.');
        setTimeLeft(0);
      } else if (error.message?.includes('inválido')) {
        toast.error('Código inválido. Verifique e tente novamente.');
      } else {
        toast.error(error.message || 'Erro ao verificar código');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (timeLeft > 0) {
      toast.error(`Aguarde ${timeLeft} segundos para reenviar`);
      return;
    }

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
        setTimeLeft(1 * 60); // 1 minuto
        setAttempts(0);
        setCodigo('');
        onResend?.();
      } else {
        throw new Error(response.error || 'Erro ao reenviar código');
      }
    } catch (error: any) {
      console.error('❌ Erro ao reenviar código:', error);
      toast.error(error.message || 'Erro ao reenviar código');
    } finally {
      setIsResending(false);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCodigo(value);
  };

  const handleDigitChange = (index: number, value: string) => {
    const newCode = codigo.split('');
    newCode[index] = value.replace(/\D/g, '').slice(0, 1);
    setCodigo(newCode.join(''));
    
    // Auto-focus no próximo campo
    if (value && index < 5) {
      const nextInput = document.getElementById(`digit-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Backspace - voltar para o campo anterior
    if (e.key === 'Backspace' && !codigo[index] && index > 0) {
      const prevInput = document.getElementById(`digit-${index - 1}`);
      prevInput?.focus();
    }
    
    // Arrow keys - navegar entre campos
    if (e.key === 'ArrowLeft' && index > 0) {
      const prevInput = document.getElementById(`digit-${index - 1}`);
      prevInput?.focus();
    }
    
    if (e.key === 'ArrowRight' && index < 5) {
      const nextInput = document.getElementById(`digit-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    setCodigo(pastedData);
    
    // Focus no último campo preenchido
    const lastIndex = Math.min(pastedData.length - 1, 5);
    const lastInput = document.getElementById(`digit-${lastIndex}`);
    lastInput?.focus();
  };

  const getTitle = () => {
    switch (tipo) {
      case 'cadastro':
        return 'Verifique seu email';
      case 'login':
        return 'Código de verificação';
      case 'recuperacao_senha':
        return 'Recuperação de senha';
      default:
        return 'Verificação de email';
    }
  };

  const getDescription = () => {
    switch (tipo) {
      case 'cadastro':
        return 'Enviamos um código de verificação para seu email. Digite o código abaixo para ativar sua conta.';
      case 'login':
        return 'Para sua segurança, enviamos um código de verificação. Digite o código abaixo para continuar.';
      case 'recuperacao_senha':
        return 'Enviamos um código para redefinir sua senha. Digite o código abaixo para continuar.';
      default:
        return 'Digite o código de verificação enviado para seu email.';
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`w-full max-w-xl mx-auto ${className}`}
    >
        <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
          <CardHeader className="text-center pb-4 sm:pb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center mb-4 sm:mb-6"
            >
              <Shield className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </motion.div>
            
            <CardTitle className="text-xl sm:text-2xl font-bold text-white">
              {getTitle()}
            </CardTitle>
            
            <p className="text-slate-300 text-sm sm:text-base mt-2">
              {getDescription()}
            </p>
          </CardHeader>

          <CardContent className="space-y-4 sm:space-y-6">
            {/* Email Display */}
            <div className="text-center">
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 px-4 py-2 rounded-lg backdrop-blur-sm">
                <Mail className="w-4 h-4 text-slate-300" />
                <span className="text-sm font-medium text-white">{email}</span>
              </div>
            </div>

             {/* Code Input Form */}
             <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
               <div className="space-y-2">
                 <Label className="text-sm font-medium text-slate-200 text-center block">
                   Código de verificação
                 </Label>
                 
                 {/* Digit Inputs */}
                 <div className="flex justify-center gap-2 sm:gap-3">
                   {Array.from({ length: 6 }, (_, index) => (
                     <input
                       key={index}
                       id={`digit-${index}`}
                       type="text"
                       inputMode="numeric"
                       pattern="[0-9]*"
                       value={codigo[index] || ''}
                       onChange={(e) => handleDigitChange(index, e.target.value)}
                       onKeyDown={(e) => handleKeyDown(index, e)}
                       onPaste={handlePaste}
                       className="w-10 h-10 sm:w-12 sm:h-12 text-center text-lg sm:text-xl font-mono font-bold text-white bg-white/10 border border-white/20 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                       maxLength={1}
                       disabled={isLoading}
                       autoComplete="one-time-code"
                     />
                   ))}
                 </div>
                 
                 {/* Hidden input for form submission */}
                 <input
                   type="hidden"
                   name="codigo"
                   value={codigo}
                 />
               </div>

              {/* Timer */}
              {timeLeft > 0 && (
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 text-sm text-slate-400">
                    <Clock className="w-4 h-4" />
                    <span>Pode reenviar em {formatTime(timeLeft)}</span>
                  </div>
                </div>
              )}

              {/* Attempts Warning */}
              {attempts > 0 && (
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 text-sm text-amber-400">
                    <AlertCircle className="w-4 h-4" />
                    <span>Tentativas: {attempts}/{maxAttempts}</span>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-10 sm:h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold shadow-lg hover:shadow-emerald-500/25 transition-all duration-300"
                disabled={isLoading || codigo.length !== 6 || attempts >= maxAttempts}
              >
                {isLoading ? (
                  <motion.div
                    className="flex items-center gap-2"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                    Verificando...
                  </motion.div>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Verificar Código
                  </>
                )}
              </Button>
            </form>

            {/* Resend Code Button */}
            <div className="text-center">
              <Button
                type="button"
                variant="outline"
                onClick={handleResendCode}
                disabled={isResending || timeLeft > 0}
                className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-emerald-400/50 h-10 sm:h-12"
              >
                {isResending ? (
                  <motion.div
                    className="flex items-center gap-2"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <RefreshCw className="w-4 h-4" />
                    Reenviando...
                  </motion.div>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reenviar Código
                  </>
                )}
              </Button>
            </div>

            {/* Back Button */}
            {onBack && (
              <div className="text-center">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onBack}
                  className="text-slate-400 hover:text-white hover:bg-white/10 h-10 sm:h-12"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
              </div>
            )}

            {/* Help Text */}
            <div className="text-center text-xs text-slate-400 space-y-1">
              <p>Não recebeu o email? Verifique sua caixa de spam.</p>
              <p>O código expira em 1 minuto.</p>
            </div>
          </CardContent>
        </Card>
    </motion.div>
  );
}
