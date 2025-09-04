import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { 
  ArrowRight, 
  Mail, 
  ArrowLeft,
  CheckCircle,
  Sparkles,
  Shield,
  Zap
} from "lucide-react";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simular delay de envio
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
    }, 2000);
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

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center p-4">
              {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Main Background Image */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1920&h=1080&fit=crop&crop=center')] bg-cover bg-center opacity-8" />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50/90 via-white/95 to-slate-100/90" />
        
        {/* Animated Grid */}
        <div className="absolute inset-0 bg-grid-slate-900/[0.02] bg-[size:50px_50px]" />
        
        {/* Floating Elements */}
        <motion.div
          className="absolute top-20 left-10 w-72 h-72 bg-green-500/10 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"
          animate={{
            x: [0, -100, 0],
            y: [0, 50, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Additional floating elements */}
        <motion.div
          className="absolute top-1/2 left-1/4 w-48 h-48 bg-purple-500/5 rounded-full blur-2xl"
          animate={{
            x: [0, 50, 0],
            y: [0, -30, 0],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/3 right-1/4 w-64 h-64 bg-cyan-500/5 rounded-full blur-2xl"
          animate={{
            x: [0, -30, 0],
            y: [0, 40, 0],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Geometric shapes */}
        <motion.div
          className="absolute top-1/4 right-1/3 w-32 h-32 bg-gradient-to-br from-green-400/10 to-blue-400/10 rounded-lg rotate-45 blur-xl"
          animate={{ rotate: [45, 405, 45] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute bottom-1/4 left-1/3 w-24 h-24 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full blur-xl"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

        <div className="relative z-10 w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-2xl text-center">
              <CardContent className="p-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
                >
                  <CheckCircle className="h-10 w-10 text-green-500" />
                </motion.div>
                
                <motion.h1 
                  className="text-2xl font-bold text-slate-900 mb-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  Email enviado!
                </motion.h1>
                
                <motion.p 
                  className="text-slate-600 mb-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  Enviamos um link de recuperação para <strong>{email}</strong>. 
                  Verifique sua caixa de entrada e siga as instruções.
                </motion.p>
                
                <motion.div 
                  className="space-y-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <Button
                    onClick={() => navigate("/login")}
                    className="w-full h-12 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold"
                  >
                    Voltar ao Login
                  </Button>
                  
                  <p className="text-sm text-slate-500">
                    Não recebeu o email?{" "}
                    <button 
                      onClick={() => setIsSubmitted(false)}
                      className="text-green-600 hover:text-green-700 font-medium"
                    >
                      Tentar novamente
                    </button>
                  </p>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center p-4">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1920&h=1080&fit=crop&crop=center')] bg-cover bg-center opacity-5" />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50/80 via-white/90 to-slate-100/80" />
        
        {/* Animated Grid */}
        <div className="absolute inset-0 bg-grid-slate-900/[0.02] bg-[size:50px_50px]" />
        
        {/* Floating Elements */}
        <motion.div
          className="absolute top-20 left-10 w-72 h-72 bg-green-500/10 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"
          animate={{
            x: [0, -100, 0],
            y: [0, 50, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Form */}
          <div className="w-full max-w-md mx-auto lg:mx-0">
            {/* Header */}
            <motion.div 
              className="text-center lg:text-left mb-8"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <motion.div 
                className="flex items-center justify-center lg:justify-start mb-6"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <img 
                  src="/logo.png" 
                  alt="KontrollaPro Logo" 
                  className="h-12 w-12 rounded-lg mr-3"
                />
                <span className="text-2xl font-bold bg-gradient-to-r from-green-500 to-blue-500 bg-clip-text text-transparent">
                  KontrollaPro
                </span>
              </motion.div>
              
              <motion.h1 
                className="text-3xl lg:text-4xl font-bold text-slate-900 mb-2"
                variants={fadeInUp}
                initial="initial"
                animate="animate"
              >
                Esqueceu sua senha?
              </motion.h1>
              
              <motion.p 
                className="text-slate-600 text-lg"
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
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-2xl">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-2xl font-bold text-center text-slate-900">
                Recuperar Senha
              </CardTitle>
              <p className="text-center text-slate-600">
                Digite seu email para receber instruções de recuperação
              </p>
            </CardHeader>
            
            <CardContent>
              <motion.form 
                onSubmit={handleSubmit}
                className="space-y-6"
                variants={staggerContainer}
                initial="initial"
                animate="animate"
              >
                {/* Email Field */}
                <motion.div variants={fadeInUp} className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-12 border-slate-200 focus:border-green-500 focus:ring-green-500/20"
                      required
                    />
                  </div>
                </motion.div>

                {/* Submit Button */}
                <motion.div variants={fadeInUp}>
                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold text-lg shadow-lg hover:shadow-green-500/25 transition-all duration-300"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <motion.div
                        className="flex items-center"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
                      </motion.div>
                    ) : (
                      <>
                        Enviar Link de Recuperação
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>
                </motion.div>

                {/* Back to Login */}
                <motion.div 
                  variants={fadeInUp}
                  className="text-center pt-4"
                >
                  <p className="text-slate-600">
                    Lembrou da senha?{" "}
                    <Link 
                      to="/login" 
                      className="text-green-600 hover:text-green-700 font-semibold transition-colors"
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
          className="text-center mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Link 
            to="/" 
            className="inline-flex items-center text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para o início
          </Link>
        </motion.div>

          </div>

          {/* Right Side - Email Illustration */}
          <motion.div 
            className="relative hidden lg:block"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {/* Email Preview Card */}
            <div className="relative bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <div className="text-slate-600 text-sm font-medium">Email de Recuperação</div>
              </div>
              
              {/* Email Content */}
              <div className="space-y-6">
                {/* Email Header */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                      <Mail className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">KontrollaPro</div>
                      <div className="text-xs text-slate-500">noreply@kontrollapro.com</div>
                    </div>
                  </div>
                  <div className="text-sm text-slate-600">
                    Para: <span className="font-medium">seu@email.com</span>
                  </div>
                </div>
                
                {/* Email Body */}
                <div className="bg-white/20 rounded-xl p-6 space-y-4">
                  <h3 className="text-lg font-bold text-slate-900">Recuperação de Senha</h3>
                  <p className="text-sm text-slate-600">
                    Olá! Recebemos uma solicitação para redefinir sua senha. 
                    Clique no botão abaixo para criar uma nova senha:
                  </p>
                  
                  <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-lg text-center text-sm font-semibold">
                    Redefinir Senha
                  </div>
                  
                  <p className="text-xs text-slate-500">
                    Este link expira em 24 horas por segurança.
                  </p>
                </div>
                
                {/* Security Info */}
                <div className="flex items-center space-x-2 text-xs text-slate-500">
                  <Shield className="h-4 w-4" />
                  <span>Email seguro e criptografado</span>
                </div>
              </div>
            </div>
            
            {/* Floating Elements */}
            <motion.div
              className="absolute -top-4 -right-4 bg-green-500 text-white p-4 rounded-xl shadow-lg"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Mail className="h-6 w-6" />
            </motion.div>
            
            <motion.div
              className="absolute -bottom-4 -left-4 bg-blue-500 text-white p-4 rounded-xl shadow-lg"
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: 1 }}
            >
              <Shield className="h-6 w-6" />
            </motion.div>
            
            <motion.div
              className="absolute top-1/2 -right-8 bg-purple-500 text-white p-3 rounded-lg shadow-lg"
              animate={{ x: [0, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
            >
              <Sparkles className="h-5 w-5" />
            </motion.div>
          </motion.div>
        </div>

        {/* Features Preview - Mobile */}
        <motion.div 
          className="mt-12 grid grid-cols-3 gap-4 lg:hidden"
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
              className="text-center p-4 bg-white/50 backdrop-blur-sm rounded-lg border border-white/20"
              whileHover={{ scale: 1.05, y: -2 }}
              transition={{ duration: 0.2 }}
            >
              <feature.icon className="h-6 w-6 text-green-500 mx-auto mb-2" />
              <p className="text-sm text-slate-600 font-medium">{feature.text}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
