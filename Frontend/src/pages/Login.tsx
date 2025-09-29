import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { GoogleLoginButton } from "@/components/auth/GoogleLoginButton";
import { 
  ArrowRight, 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  ArrowLeft,
  Sparkles,
  Shield,
  Zap,
  TrendingUp,
  Users,
  ShoppingCart,
  Package,
  BarChart3
} from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const result = await login(formData.email, formData.password);
      
      if (result.success) {
        // Redirecionar para o dashboard
        navigate("/dashboard");
      } else {
        alert(result.error || 'Erro ao fazer login. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro no login:', error);
      alert('Erro de conexão. Tente novamente.');
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-slate-800/90 to-slate-900/95" />
        
        {/* Animated Grid */}
        <div className="absolute inset-0 bg-grid-slate-400/[0.02] bg-[size:50px_50px]" />
        
        {/* Floating Elements - Hidden on mobile for performance */}
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
        
        {/* Geometric shapes - Hidden on mobile for performance */}
        <motion.div
          className="absolute top-1/4 right-1/3 w-32 h-32 bg-gradient-to-br from-emerald-400/10 to-blue-400/10 rounded-lg rotate-45 blur-xl hidden sm:block"
          animate={{ rotate: [45, 405, 45] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute bottom-1/4 left-1/3 w-24 h-24 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full blur-xl hidden sm:block"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Header */}
        <motion.div 
          className="text-center mb-6 sm:mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <motion.h1 
            className="text-2xl sm:text-4xl md:text-5xl font-bold text-white mb-2 sm:mb-4"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
          >
            Bem-vindo de volta
          </motion.h1>
          
          <motion.p 
            className="text-slate-300 text-base sm:text-xl max-w-2xl mx-auto px-4 sm:px-0"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
          >
            Entre na sua conta para continuar
          </motion.p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6 sm:gap-12 items-start">
          {/* Left Side - Login Form */}
          <motion.div
            variants={scaleIn}
            initial="initial"
            animate="animate"
          >

            <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
              <CardHeader className="space-y-1 pb-4 sm:pb-6">
                <CardTitle className="text-xl sm:text-2xl font-bold text-center text-white">
                  Fazer Login
                </CardTitle>
                <p className="text-center text-slate-300 text-sm sm:text-base">
                  Entre com suas credenciais
                </p>
              </CardHeader>
            
            <CardContent>
              <motion.form 
                onSubmit={handleSubmit}
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
                      value={formData.email}
                      onChange={handleInputChange}
                      className="pl-8 sm:pl-10 h-10 sm:h-12 bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:border-emerald-500 focus:ring-emerald-500/20 text-sm sm:text-base"
                      required
                    />
                  </div>
                </motion.div>

                {/* Password Field */}
                <motion.div variants={fadeInUp} className="space-y-2">
                  <Label htmlFor="password" className="text-xs sm:text-sm font-medium text-slate-200">
                    Senha
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-slate-400" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Sua senha"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="pl-8 sm:pl-10 pr-8 sm:pr-10 h-10 sm:h-12 bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:border-emerald-500 focus:ring-emerald-500/20 text-sm sm:text-base"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-3 w-3 sm:h-4 sm:w-4" /> : <Eye className="h-3 w-3 sm:h-4 sm:w-4" />}
                    </button>
                  </div>
                </motion.div>

                {/* Remember Me & Forgot Password */}
                <motion.div 
                  variants={fadeInUp}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0"
                >
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="rememberMe"
                      name="rememberMe"
                      checked={formData.rememberMe}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, rememberMe: !!checked }))}
                    />
                    <Label htmlFor="rememberMe" className="text-xs sm:text-sm text-slate-300">
                      Lembrar de mim
                    </Label>
                  </div>
                  <Link 
                    to="/forgot-password" 
                    className="text-xs sm:text-sm text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                  >
                    Esqueceu a senha?
                  </Link>
                </motion.div>

                {/* Submit Button */}
                <motion.div variants={fadeInUp}>
                  <Button
                    type="submit"
                    className="w-full h-10 sm:h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold text-sm sm:text-lg shadow-lg hover:shadow-emerald-500/25 transition-all duration-300"
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
                        Entrar
                        <ArrowRight className="ml-2 h-3 w-3 sm:h-5 sm:w-5" />
                      </>
                    )}
                  </Button>
                </motion.div>

                {/* Divider */}
                <motion.div 
                  variants={fadeInUp}
                  className="relative my-4 sm:my-6"
                >
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/20" />
                  </div>
                  <div className="relative flex justify-center text-xs sm:text-sm">
                    <span className="px-4 sm:px-6 text-center text-slate-400">ou continue com</span>
                  </div>
                </motion.div>

                {/* Google Login Button */}
                <motion.div 
                  variants={fadeInUp}
                  className="w-full"
                >
                  <GoogleLoginButton
                    onSuccess={() => {
                      console.log('✅ Login Google realizado com sucesso');
                    }}
                    onError={(error) => {
                      console.error('❌ Erro no login Google:', error);
                    }}
                    className="w-full"
                  />
                </motion.div>

                {/* Sign Up Link */}
                <motion.div 
                  variants={fadeInUp}
                  className="text-center pt-3 sm:pt-4"
                >
                  <p className="text-slate-300 text-sm sm:text-base">
                    Não tem uma conta?{" "}
                    <Link 
                      to="/signup" 
                      className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
                    >
                      Cadastre-se grátis
                    </Link>
                  </p>
                </motion.div>
              </motion.form>
            </CardContent>
          </Card>
        </motion.div>

          {/* Right Side - Benefits */}
          <motion.div
            className="space-y-6 sm:space-y-8 hidden lg:block"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {/* Benefits List */}
            <motion.div
              className="bg-gradient-to-br from-emerald-500/10 to-blue-500/10 rounded-2xl p-6 sm:p-8 border border-emerald-500/20 backdrop-blur-sm"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">
                Por que escolher o KontrollaPro:
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {[
                  { icon: Shield, text: "100% Seguro", desc: "Dados protegidos com criptografia" },
                  { icon: Zap, text: "Rápido e Eficiente", desc: "Interface intuitiva e responsiva" },
                  { icon: BarChart3, text: "Dashboard Inteligente", desc: "Métricas em tempo real" },
                  { icon: Users, text: "Suporte 24/7", desc: "Equipe sempre disponível" }
                ].map((benefit, index) => (
                  <motion.div
                    key={index}
                    className="flex items-start space-x-3"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 + 0.5 }}
                  >
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <benefit.icon className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm sm:text-base">{benefit.text}</p>
                      <p className="text-slate-300 text-xs sm:text-sm">{benefit.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Features Preview */}
            <motion.div 
              className="grid grid-cols-2 gap-3 sm:gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              {[
                { icon: TrendingUp, text: "Relatórios Avançados", desc: "Insights para crescimento" },
                { icon: ShoppingCart, text: "Gestão de Vendas", desc: "Controle total do processo" },
                { icon: Package, text: "Controle de Estoque", desc: "Organização inteligente" },
                { icon: Sparkles, text: "IA Integrada", desc: "Previsões automáticas" }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  className="text-center p-4 sm:p-6 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:border-emerald-500/30 transition-all duration-300"
                  whileHover={{ scale: 1.05, y: -2 }}
                  transition={{ duration: 0.2 }}
                >
                  <feature.icon className="h-6 w-6 sm:h-8 sm:w-8 text-emerald-400 mx-auto mb-2 sm:mb-3" />
                  <p className="text-xs sm:text-sm font-semibold text-white mb-1">{feature.text}</p>
                  <p className="text-xs text-slate-400">{feature.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>

        {/* Features Preview - Mobile */}
        <motion.div 
          className="mt-8 sm:mt-12 grid grid-cols-3 gap-3 sm:gap-4 lg:hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          {[
            { icon: Shield, text: "Seguro" },
            { icon: Zap, text: "Rápido" },
            { icon: Sparkles, text: "Inteligente" }
          ].map((feature, index) => (
            <motion.div
              key={index}
              className="text-center p-3 sm:p-4 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10"
              whileHover={{ scale: 1.05, y: -2 }}
              transition={{ duration: 0.2 }}
            >
              <feature.icon className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-400 mx-auto mb-1 sm:mb-2" />
              <p className="text-xs sm:text-sm text-slate-300 font-medium">{feature.text}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Back to Home */}
        <motion.div 
          className="text-center mt-8 sm:mt-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Link 
            to="/" 
            className="inline-flex items-center text-slate-400 hover:text-white transition-colors text-sm sm:text-base"
          >
            <ArrowLeft className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            Voltar para o início
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
