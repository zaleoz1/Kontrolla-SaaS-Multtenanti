import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { API_CONFIG, API_ENDPOINTS } from "@/config/api";
import { useImagePath } from "@/hooks/useImagePath";
import { 
  ArrowRight, 
  Mail, 
  ArrowLeft,
  CheckCircle,
  Sparkles,
  Shield,
  Zap,
  TrendingUp,
  Users,
  BarChart3,
  ShoppingCart,
  Package,
  Eye,
  EyeOff,
  Lock,
  RefreshCw
} from "lucide-react";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const logoPath = useImagePath('logo.png');
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [step, setStep] = useState<'email' | 'code' | 'password'>('email');
  const [codigo, setCodigo] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.AUTH.FORGOT_PASSWORD}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Email enviado!",
          description: "Código de recuperação enviado com sucesso. Verifique sua caixa de entrada.",
        });
        setIsSubmitted(true);
        setStep('code');
      } else {
        toast({
          title: "Erro",
          description: data.message || data.error || "Erro ao enviar código de recuperação",
          variant: "default",
        });
      }
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      toast({
        title: "Erro de conexão",
        description: "Não foi possível conectar ao servidor. Tente novamente.",
        variant: "default",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (codigo.length !== 6) {
      toast({
        title: "Código incompleto",
        description: "Digite o código completo de 6 dígitos.",
        variant: "default",
      });
      return;
    }
    
    setIsLoading(true);
    
    console.log('🔍 Dados sendo enviados para verificação:', { email, codigo, codigoLength: codigo.length });
    
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.AUTH.VERIFY_RESET_CODE}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, codigo }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Código verificado!",
          description: "Código válido. Agora você pode redefinir sua senha.",
        });
        setStep('password');
      } else {
        toast({
          title: "Código inválido",
          description: data.message || data.error || "Código inválido ou expirado",
          variant: "default",
        });
      }
    } catch (error) {
      console.error('Erro ao verificar código:', error);
      toast({
        title: "Erro de conexão",
        description: "Não foi possível conectar ao servidor. Tente novamente.",
        variant: "default",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (novaSenha !== confirmarSenha) {
      toast({
        title: "Senhas não coincidem",
        description: "As senhas digitadas não são iguais. Tente novamente.",
        variant: "default",
      });
      return;
    }

    if (novaSenha.length < 6) {
      toast({
        title: "Senha muito curta",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "default",
      });
      return;
    }

    if (novaSenha.length > 128) {
      toast({
        title: "Senha muito longa",
        description: "A senha deve ter no máximo 128 caracteres.",
        variant: "default",
      });
      return;
    }

    // Verificar senhas muito simples
    const senhasSimples = ['123456', 'password', 'senha123', '123456789', 'qwerty', 'abc123'];
    if (senhasSimples.includes(novaSenha.toLowerCase())) {
      toast({
        title: "Senha muito simples",
        description: "A senha é muito simples. Escolha uma senha mais segura.",
        variant: "default",
      });
      return;
    }

    setIsLoading(true);
    
    console.log('🔍 Dados sendo enviados para redefinição:', { 
      email, 
      codigo, 
      codigoLength: codigo.length, 
      novaSenhaLength: novaSenha.length 
    });
    
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.AUTH.RESET_PASSWORD}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, codigo, novaSenha }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Senha redefinida!",
          description: "Sua senha foi redefinida com sucesso. Faça login com a nova senha.",
        });
        navigate('/login');
      } else {
        toast({
          title: "Erro",
          description: data.message || data.error || "Erro ao redefinir senha",
          variant: "default",
        });
      }
    } catch (error) {
      console.error('Erro ao redefinir senha:', error);
      toast({
        title: "Erro de conexão",
        description: "Não foi possível conectar ao servidor. Tente novamente.",
        variant: "default",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Variantes de animação
  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const scaleIn = {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }
  };

  // Renderizar diferentes passos do processo
  const renderStepContent = () => {
    if (step === 'code') {
    return (
        <div className="relative z-10 w-full max-w-xl mx-auto px-2 sm:px-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
              <CardHeader className="text-center pb-3 sm:pb-4 md:pb-6 p-4 sm:p-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="mx-auto w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center mb-3 sm:mb-4 md:mb-6"
                >
                  <Shield className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-white" />
                </motion.div>
                
                <CardTitle className="text-lg sm:text-xl md:text-2xl font-bold text-white">
                  Recuperação de senha
                </CardTitle>
                
                <p className="text-slate-300 text-xs sm:text-sm md:text-base mt-1 sm:mt-2">
                  Enviamos um código para redefinir sua senha. Digite o código abaixo para continuar.
                </p>
              </CardHeader>

              <CardContent className="space-y-3 sm:space-y-4 md:space-y-6 p-4 sm:p-6">
                {/* Email Display */}
                <div className="text-center">
                  <div className="inline-flex items-center gap-1.5 sm:gap-2 bg-white/10 border border-white/20 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg backdrop-blur-sm">
                    <Mail className="w-3 h-3 sm:w-4 sm:h-4 text-slate-300" />
                    <span className="text-xs sm:text-sm font-medium text-white truncate max-w-[200px] sm:max-w-none">{email}</span>
                  </div>
                </div>

                {/* Code Input Form */}
                <motion.form 
                  onSubmit={handleVerifyCode}
                  className="space-y-3 sm:space-y-4 md:space-y-6"
                  variants={staggerContainer}
                  initial="initial"
                  animate="animate"
                >
                  <motion.div variants={fadeInUp} className="space-y-2">
                    <Label className="text-xs sm:text-sm font-medium text-slate-200 text-center block">
                      Código de verificação
                    </Label>
                    
                    {/* Digit Inputs */}
                    <div className="flex justify-center gap-1.5 sm:gap-2 md:gap-3">
                      {Array.from({ length: 6 }, (_, index) => (
                        <input
                          key={index}
                          id={`digit-${index}`}
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={codigo[index] || ''}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '').slice(0, 1);
                            const newCode = codigo.split('');
                            newCode[index] = value;
                            setCodigo(newCode.join(''));
                            
                            // Auto-focus no próximo campo
                            if (value && index < 5) {
                              const nextInput = document.getElementById(`digit-${index + 1}`);
                              nextInput?.focus();
                            }
                          }}
                          onKeyDown={(e) => {
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
                          }}
                          onPaste={(e) => {
                            e.preventDefault();
                            const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
                            setCodigo(pastedData);
                            
                            // Focus no último campo preenchido
                            const lastIndex = Math.min(pastedData.length - 1, 5);
                            const lastInput = document.getElementById(`digit-${lastIndex}`);
                            lastInput?.focus();
                          }}
                          className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-center text-sm sm:text-lg md:text-xl font-mono font-bold text-white bg-white/10 border border-white/20 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  </motion.div>

                  {/* Submit Button */}
                  <motion.div variants={fadeInUp}>
                    <Button
                      type="submit"
                      className="w-full h-8 sm:h-10 md:h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 text-xs sm:text-sm md:text-base"
                      disabled={isLoading || codigo.length !== 6}
                    >
                      {isLoading ? (
                        <motion.div
                          className="flex items-center gap-1.5 sm:gap-2"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white/30 border-t-white rounded-full" />
                          <span className="hidden sm:inline">Verificando...</span>
                          <span className="sm:hidden">Verificando...</span>
                        </motion.div>
                      ) : (
                        <>
                          <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                          <span className="hidden sm:inline">Verificar Código</span>
                          <span className="sm:hidden">Verificar</span>
                        </>
                      )}
                    </Button>
                  </motion.div>
                </motion.form>

                {/* Resend Code Button */}
                <motion.div 
                  variants={fadeInUp}
                  className="text-center"
                >
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep('email')}
                    className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-emerald-400/50 h-8 sm:h-10 md:h-12 text-xs sm:text-sm md:text-base"
                  >
                    <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Reenviar Código</span>
                    <span className="sm:hidden">Reenviar</span>
                  </Button>
                </motion.div>

                {/* Back Button */}
                <motion.div 
                  variants={fadeInUp}
                  className="text-center"
                >
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setStep('email')}
                    className="text-slate-400 hover:text-white hover:bg-white/10 h-8 sm:h-10 md:h-12 text-xs sm:text-sm md:text-base"
                  >
                    <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    Voltar
                  </Button>
                </motion.div>

                {/* Help Text */}
                <motion.div 
                  variants={fadeInUp}
                  className="text-center text-xs text-slate-400 space-y-0.5 sm:space-y-1"
                >
                  <p>Não recebeu o email? Verifique sua caixa de spam.</p>
                  <p>O código expira em 1 minuto.</p>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      );
    }

    if (step === 'password') {
      return (
        <div className="relative z-10 w-full max-w-6xl mx-auto px-2 sm:px-0">
          <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8 lg:gap-12 items-start">
            {/* Left Side - Form */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
                <CardHeader className="space-y-1 pb-4 sm:pb-6 p-4 sm:p-6">
                  <CardTitle className="text-xl sm:text-2xl font-bold text-center text-white">
                    Nova Senha
                  </CardTitle>
                  <p className="text-center text-slate-300 text-sm sm:text-base">
                    Digite sua nova senha para <span className="truncate inline-block max-w-[200px] sm:max-w-none">{email}</span>
                  </p>
                </CardHeader>
                
                <CardContent className="p-4 sm:p-6">
                  <motion.form 
                    onSubmit={handleResetPassword}
                    className="space-y-4 sm:space-y-6"
                    variants={staggerContainer}
                    initial="initial"
                    animate="animate"
                  >
                    <motion.div variants={fadeInUp} className="space-y-2">
                      <Label htmlFor="novaSenha" className="text-xs sm:text-sm font-medium text-slate-200">
                        Nova Senha
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-slate-400" />
                        <Input
                          id="novaSenha"
                          name="novaSenha"
                          type={showPassword ? "text" : "password"}
                          placeholder="Digite sua nova senha"
                          value={novaSenha}
                          onChange={(e) => setNovaSenha(e.target.value)}
                          className="pl-8 sm:pl-10 pr-8 sm:pr-10 h-9 sm:h-10 md:h-12 bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:border-emerald-500 focus:ring-emerald-500/20 text-sm sm:text-base"
                          required
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
                        >
                          {showPassword ? <EyeOff className="h-3 w-3 sm:h-4 sm:w-4" /> : <Eye className="h-3 w-3 sm:h-4 sm:w-4" />}
                        </button>
                      </div>
                    </motion.div>

                    <motion.div variants={fadeInUp} className="space-y-2">
                      <Label htmlFor="confirmarSenha" className="text-xs sm:text-sm font-medium text-slate-200">
                        Confirmar Nova Senha
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-slate-400" />
                        <Input
                          id="confirmarSenha"
                          name="confirmarSenha"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirme sua nova senha"
                          value={confirmarSenha}
                          onChange={(e) => setConfirmarSenha(e.target.value)}
                          className="pl-8 sm:pl-10 pr-8 sm:pr-10 h-9 sm:h-10 md:h-12 bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:border-emerald-500 focus:ring-emerald-500/20 text-sm sm:text-base"
                          required
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
                        >
                          {showConfirmPassword ? <EyeOff className="h-3 w-3 sm:h-4 sm:w-4" /> : <Eye className="h-3 w-3 sm:h-4 sm:w-4" />}
                        </button>
                      </div>
                    </motion.div>

                    <motion.div variants={fadeInUp}>
                      <Button
                        type="submit"
                        className="w-full h-9 sm:h-10 md:h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold text-sm sm:text-base md:text-lg shadow-lg hover:shadow-emerald-500/25 transition-all duration-300"
                        disabled={isLoading || !novaSenha || !confirmarSenha}
                      >
                        {isLoading ? (
                          <motion.div
                            className="flex items-center"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          >
                            <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full" />
                          </motion.div>
                        ) : (
                          <>
                            <span className="hidden sm:inline">Redefinir Senha</span>
                            <span className="sm:hidden">Redefinir</span>
                            <ArrowRight className="ml-1 sm:ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                          </>
                        )}
                      </Button>
                    </motion.div>

                    <motion.div 
                      variants={fadeInUp}
                      className="text-center pt-3 sm:pt-4"
                    >
                      <p className="text-slate-300 text-xs sm:text-sm">
                        Lembrou da senha?{" "}
                        <Link 
                          to="/login" 
                          className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
                        >
                          Fazer login
                        </Link>
                      </p>
                    </motion.div>
                  </motion.form>
                </CardContent>
              </Card>
            </motion.div>

            {/* Right Side - Security Benefits */}
            <motion.div
              className="space-y-4 sm:space-y-6 md:space-y-8 hidden lg:block"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              {/* Security Benefits */}
              <motion.div
                className="bg-gradient-to-br from-emerald-500/10 to-blue-500/10 rounded-2xl p-4 sm:p-6 md:p-8 border border-emerald-500/20 backdrop-blur-sm"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-3 sm:mb-4 md:mb-6">
                  Sua conta está segura:
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 md:gap-4">
                  {[
                    { icon: Shield, text: "Criptografia SSL", desc: "Dados protegidos em trânsito" },
                    { icon: Lock, text: "Senha Segura", desc: "Criptografia de ponta a ponta" },
                    { icon: CheckCircle, text: "Verificação Dupla", desc: "Código de 6 dígitos" },
                    { icon: Zap, text: "Acesso Rápido", desc: "Recuperação em minutos" }
                  ].map((benefit, index) => (
                    <motion.div
                      key={index}
                      className="flex items-start space-x-2 sm:space-x-3"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 + 0.5 }}
                    >
                      <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-1">
                        <benefit.icon className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-white font-medium text-xs sm:text-sm md:text-base">{benefit.text}</p>
                        <p className="text-slate-300 text-xs sm:text-sm">{benefit.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
              
              {/* Security Features */}
              <motion.div 
                className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                {[
                  { icon: Shield, text: "Proteção", desc: "Conta 100% segura" },
                  { icon: Mail, text: "Email Seguro", desc: "Códigos com expiração" },
                  { icon: CheckCircle, text: "Validação", desc: "Verificação automática" },
                  { icon: Sparkles, text: "IA de Segurança", desc: "Detecção de fraudes" }
                ].map((feature, index) => (
                  <motion.div
                    key={index}
                    className="text-center p-3 sm:p-4 md:p-6 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:border-emerald-500/30 transition-all duration-300"
                    whileHover={{ scale: 1.05, y: -2 }}
                    transition={{ duration: 0.2 }}
                  >
                    <feature.icon className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-emerald-400 mx-auto mb-1.5 sm:mb-2 md:mb-3" />
                    <p className="text-xs sm:text-sm font-semibold text-white mb-0.5 sm:mb-1">{feature.text}</p>
                    <p className="text-xs text-slate-400">{feature.desc}</p>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </div>

          {/* Security Features - Mobile */}
          <motion.div 
            className="mt-8 sm:mt-12 grid grid-cols-3 gap-2 sm:gap-4 lg:hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            {[
              { icon: Shield, text: "Seguro" },
              { icon: Lock, text: "Protegido" },
              { icon: CheckCircle, text: "Verificado" }
            ].map((feature, index) => (
              <motion.div
                key={index}
                className="text-center p-3 sm:p-4 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10"
                whileHover={{ scale: 1.05, y: -2 }}
                transition={{ duration: 0.2 }}
              >
                <feature.icon className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-400 mx-auto mb-1.5 sm:mb-2" />
                <p className="text-xs sm:text-sm text-slate-300 font-medium">{feature.text}</p>
              </motion.div>
            ))}
          </motion.div>
      </div>
    );
  }

    // Step padrão (email)
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-2 sm:p-4">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-slate-800/90 to-slate-900/95" />
        
        {/* Animated Grid */}
        <div className="absolute inset-0 bg-grid-slate-400/[0.02] bg-[size:50px_50px]" />
        
        {/* Floating Elements */}
        <motion.div
          className="absolute top-20 left-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl hidden sm:block"
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl hidden sm:block"
          animate={{
            x: [0, -100, 0],
            y: [0, 50, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-auto">
        {step === 'email' ? (
        <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center">
          {/* Left Side - Form */}
          <div className="w-full max-w-md mx-auto lg:mx-0">
            {/* Header */}
            <motion.div 
              className="text-center lg:text-left mb-6 sm:mb-8"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <motion.div 
                className="flex items-center justify-center lg:justify-start mb-4 sm:mb-6"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <img 
                  src={logoPath} 
                  alt="KontrollaPro Logo" 
                  className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 rounded-lg mr-2 sm:mr-3"
                />
                <span className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-emerald-500 to-blue-500 bg-clip-text text-transparent">
                  KontrollaPro
                </span>
              </motion.div>
              
              <motion.h1 
                className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1 sm:mb-2"
                variants={fadeInUp}
                initial="initial"
                animate="animate"
              >
                Esqueceu sua senha?
              </motion.h1>
              
              <motion.p 
                className="text-slate-300 text-sm sm:text-base lg:text-lg"
                variants={fadeInUp}
                initial="initial"
                animate="animate"
              >
                Não se preocupe, vamos te ajudar a recuperar
              </motion.p>
            </motion.div>

        {/* Form Card */}
        <motion.div
          variants={scaleIn}
          initial="initial"
          animate="animate"
        >
          <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
            <CardHeader className="space-y-1 pb-4 sm:pb-6">
              <CardTitle className="text-xl sm:text-2xl font-bold text-center text-white">
                Recuperar Senha
              </CardTitle>
              <p className="text-center text-slate-300 text-sm sm:text-base">
                Digite seu email para receber instruções de recuperação
              </p>
            </CardHeader>
            
            <CardContent className="p-4 sm:p-6">
              <motion.form 
                      onSubmit={handleSubmitEmail}
                className="space-y-4 sm:space-y-6"
                variants={staggerContainer}
                initial="initial"
                animate="animate"
              >
                {/* Email Field */}
                <motion.div variants={fadeInUp} className="space-y-2">
                  <Label htmlFor="email" className="text-xs sm:text-sm font-medium text-slate-200">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-slate-400" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-8 sm:pl-10 h-9 sm:h-10 md:h-12 bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:border-emerald-500 focus:ring-emerald-500/20 text-sm sm:text-base"
                      required
                    />
                  </div>
                </motion.div>

                {/* Submit Button */}
                <motion.div variants={fadeInUp}>
                  <Button
                    type="submit"
                    className="w-full h-9 sm:h-10 md:h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold text-sm sm:text-base md:text-lg shadow-lg hover:shadow-emerald-500/25 transition-all duration-300"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <motion.div
                        className="flex items-center"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full" />
                      </motion.div>
                    ) : (
                      <>
                    <span className="hidden sm:inline">Receber código de Recuperação</span>
                    <span className="sm:hidden">Receber Código</span>
                        <ArrowRight className="ml-1 sm:ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                      </>
                    )}
                  </Button>
                </motion.div>

                {/* Back to Login */}
                <motion.div 
                  variants={fadeInUp}
                  className="text-center pt-3 sm:pt-4"
                >
                  <p className="text-slate-300 text-xs sm:text-sm">
                    Lembrou da senha?{" "}
                    <Link 
                      to="/login" 
                      className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
                    >
                      Fazer login
                    </Link>
                  </p>
                </motion.div>
              </motion.form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Back to Home */}
        <motion.div 
          className="text-center mt-4 sm:mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Link 
            to="/" 
            className="inline-flex items-center text-slate-400 hover:text-white transition-colors text-xs sm:text-sm"
          >
            <ArrowLeft className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Voltar para o início</span>
            <span className="sm:hidden">Voltar</span>
          </Link>
        </motion.div>
          </div>

          {/* Right Side - Benefits */}
          <motion.div 
            className="space-y-4 sm:space-y-6 md:space-y-8 hidden lg:block"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {/* Security & Recovery Benefits */}
            <motion.div
              className="bg-gradient-to-br from-emerald-500/10 to-blue-500/10 rounded-2xl p-4 sm:p-6 md:p-8 border border-emerald-500/20 backdrop-blur-sm"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-3 sm:mb-4 md:mb-6">
                Recuperação Segura e Confiável:
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 md:gap-4">
                {[
                  { icon: Shield, text: "Recuperação Segura", desc: "Processo criptografado e protegido" },
                  { icon: Zap, text: "Acesso Rápido", desc: "Recupere sua conta em minutos" },
                  { icon: CheckCircle, text: "Verificação", desc: "Confirmação por email" },
                  { icon: Users, text: "Suporte Especializado", desc: "Ajuda personalizada 24/7" }
                ].map((benefit, index) => (
                  <motion.div
                    key={index}
                    className="flex items-start space-x-2 sm:space-x-3"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 + 0.5 }}
                  >
                    <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-1">
                      <benefit.icon className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-medium text-xs sm:text-sm md:text-base">{benefit.text}</p>
                      <p className="text-slate-300 text-xs sm:text-sm">{benefit.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
            
            {/* Security Features */}
            <motion.div
              className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              {[
                { icon: Shield, text: "Criptografia SSL", desc: "Dados protegidos em trânsito" },
                { icon: Mail, text: "Email Seguro", desc: "Links com expiração automática" },
                { icon: CheckCircle, text: "Validação Dupla", desc: "Verificação em múltiplas etapas" },
                { icon: Sparkles, text: "IA de Segurança", desc: "Detecção de tentativas suspeitas" }
              ].map((feature, index) => (
            <motion.div
                  key={index}
                  className="text-center p-3 sm:p-4 md:p-6 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:border-emerald-500/30 transition-all duration-300"
                  whileHover={{ scale: 1.05, y: -2 }}
                  transition={{ duration: 0.2 }}
                >
                  <feature.icon className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-emerald-400 mx-auto mb-1.5 sm:mb-2 md:mb-3" />
                  <p className="text-xs sm:text-sm font-semibold text-white mb-0.5 sm:mb-1">{feature.text}</p>
                  <p className="text-xs text-slate-400">{feature.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

        {/* Security Features - Mobile */}
        <motion.div 
          className="mt-8 sm:mt-12 grid grid-cols-3 gap-2 sm:gap-4 lg:hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          {[
            { icon: Shield, text: "Seguro" },
            { icon: Mail, text: "Rápido" },
            { icon: CheckCircle, text: "Confiável" }
          ].map((feature, index) => (
            <motion.div
              key={index}
              className="text-center p-3 sm:p-4 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10"
              whileHover={{ scale: 1.05, y: -2 }}
              transition={{ duration: 0.2 }}
            >
              <feature.icon className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-400 mx-auto mb-1.5 sm:mb-2" />
              <p className="text-xs sm:text-sm text-slate-300 font-medium">{feature.text}</p>
            </motion.div>
          ))}
        </motion.div>
          </div>
        ) : (
          renderStepContent()
        )}
      </div>
    </div>
  );
}
