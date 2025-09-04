import { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  ArrowRight, 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  User,
  Building2,
  ArrowLeft,
  Sparkles,
  Shield,
  Zap,
  Check,
  Phone,
  Upload,
  X,
  Star,
  TrendingUp,
  Users,
  BarChart3,
  Clock,
  CheckCircle2
} from "lucide-react";

export default function Signup() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
    acceptMarketing: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCompanyLogo(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setCompanyLogo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simular delay de cadastro
    setTimeout(() => {
      setIsLoading(false);
      navigate("/dashboard");
    }, 2000);
  };

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Variantes de animação
  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const scaleIn = {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }
  };

  const slideIn = {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }
  };

  const benefits = [
    { icon: Clock, text: "Setup em 5 minutos", desc: "Configure sua conta rapidamente" },
    { icon: Shield, text: "100% Seguro", desc: "Dados protegidos com criptografia" },
    { icon: Zap, text: "Teste grátis", desc: "7 dias sem compromisso" },
    { icon: Users, text: "Suporte 24/7", desc: "Equipe sempre disponível" }
  ];

  const features = [
    { icon: BarChart3, text: "Dashboard Inteligente", desc: "Métricas em tempo real" },
    { icon: TrendingUp, text: "Relatórios Avançados", desc: "Insights para crescimento" },
    { icon: Building2, text: "Gestão Completa", desc: "Tudo em uma plataforma" },
    { icon: Sparkles, text: "IA Integrada", desc: "Previsões automáticas" }
  ];

  const steps = [
    { number: 1, title: "Informações Pessoais", desc: "Seus dados básicos" },
    { number: 2, title: "Empresa", desc: "Dados da sua empresa" },
    { number: 3, title: "Segurança", desc: "Crie sua senha" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-slate-800/90 to-slate-900/95" />
        
        {/* Animated Grid */}
        <div className="absolute inset-0 bg-grid-slate-400/[0.02] bg-[size:50px_50px]" />
        
        {/* Floating Elements */}
        <motion.div
          className="absolute top-20 left-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl"
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
        
        {/* Geometric shapes */}
        <motion.div
          className="absolute top-1/4 right-1/3 w-32 h-32 bg-gradient-to-br from-emerald-400/10 to-blue-400/10 rounded-lg rotate-45 blur-xl"
          animate={{ rotate: [45, 405, 45] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute bottom-1/4 left-1/3 w-24 h-24 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full blur-xl"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <motion.div 
            className="flex items-center justify-center mb-8"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <img 
              src="/logo.png" 
              alt="KontrollaPro Logo" 
              className="h-16 w-16 rounded-xl mr-4"
            />
            <span className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
              KontrollaPro
            </span>
          </motion.div>
          
          <motion.h1 
            className="text-4xl md:text-5xl font-bold text-white mb-4"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
          >
            Transforme seu negócio
          </motion.h1>
          
          <motion.p 
            className="text-slate-300 text-xl max-w-2xl mx-auto"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
          >
            A plataforma completa para gestão empresarial. Comece grátis hoje mesmo.
          </motion.p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left Side - Form */}
          <motion.div
            variants={scaleIn}
            initial="initial"
            animate="animate"
          >
            <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
              <CardHeader className="space-y-1 pb-6">
                <CardTitle className="text-2xl font-bold text-center text-white">
                  Crie sua conta
                </CardTitle>
                <p className="text-center text-slate-300">
                  Preencha os dados abaixo para começar
                </p>
                
                {/* Progress Steps */}
                <div className="flex justify-center mt-6">
                  <div className="flex items-center space-x-4">
                    {steps.map((step, index) => (
                      <div key={step.number} className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                          currentStep >= step.number 
                            ? 'bg-emerald-500 text-white' 
                            : 'bg-slate-600 text-slate-300'
                        }`}>
                          {currentStep > step.number ? <Check className="h-4 w-4" /> : step.number}
                        </div>
                        {index < steps.length - 1 && (
                          <div className={`w-12 h-0.5 mx-2 ${
                            currentStep > step.number ? 'bg-emerald-500' : 'bg-slate-600'
                          }`} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <motion.form 
                  onSubmit={handleSubmit}
                  className="space-y-6"
                  variants={staggerContainer}
                  initial="initial"
                  animate="animate"
                >
                  {/* Step 1: Personal Information */}
                  {currentStep === 1 && (
                    <motion.div
                      variants={fadeInUp}
                      className="space-y-6"
                    >
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName" className="text-sm font-medium text-slate-200">
                            Nome
                          </Label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                              id="firstName"
                              name="firstName"
                              type="text"
                              placeholder="Seu nome"
                              value={formData.firstName}
                              onChange={handleInputChange}
                              className="pl-10 h-12 bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:border-emerald-500 focus:ring-emerald-500/20"
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="lastName" className="text-sm font-medium text-slate-200">
                            Sobrenome
                          </Label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                              id="lastName"
                              name="lastName"
                              type="text"
                              placeholder="Seu sobrenome"
                              value={formData.lastName}
                              onChange={handleInputChange}
                              className="pl-10 h-12 bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:border-emerald-500 focus:ring-emerald-500/20"
                              required
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium text-slate-200">
                          Email
                        </Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="seu@email.com"
                            value={formData.email}
                            onChange={handleInputChange}
                            className="pl-10 h-12 bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:border-emerald-500 focus:ring-emerald-500/20"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-sm font-medium text-slate-200">
                          Telefone
                        </Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <Input
                            id="phone"
                            name="phone"
                            type="tel"
                            placeholder="(11) 99999-9999"
                            value={formData.phone}
                            onChange={handleInputChange}
                            className="pl-10 h-12 bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:border-emerald-500 focus:ring-emerald-500/20"
                            required
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 2: Company Information */}
                  {currentStep === 2 && (
                    <motion.div
                      variants={fadeInUp}
                      className="space-y-6"
                    >
                      <div className="space-y-2">
                        <Label htmlFor="company" className="text-sm font-medium text-slate-200">
                          Nome da Empresa
                        </Label>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <Input
                            id="company"
                            name="company"
                            type="text"
                            placeholder="Nome da sua empresa"
                            value={formData.company}
                            onChange={handleInputChange}
                            className="pl-10 h-12 bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:border-emerald-500 focus:ring-emerald-500/20"
                            required
                          />
                        </div>
                      </div>

                      {/* Logo Upload */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-200">
                          Logo da Empresa (Opcional)
                        </Label>
                        <div className="space-y-4">
                          {companyLogo ? (
                            <div className="relative">
                              <img
                                src={companyLogo}
                                alt="Company Logo Preview"
                                className="w-24 h-24 object-cover rounded-lg border border-white/20"
                              />
                              <button
                                type="button"
                                onClick={removeLogo}
                                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <div
                              onClick={() => fileInputRef.current?.click()}
                              className="w-24 h-24 border-2 border-dashed border-white/30 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-500/10 transition-all duration-200"
                            >
                              <Upload className="h-6 w-6 text-slate-400 mb-1" />
                              <span className="text-xs text-slate-400">Upload</span>
                            </div>
                          )}
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="hidden"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 3: Security */}
                  {currentStep === 3 && (
                    <motion.div
                      variants={fadeInUp}
                      className="space-y-6"
                    >
                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-sm font-medium text-slate-200">
                          Senha
                        </Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <Input
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Mínimo 8 caracteres"
                            value={formData.password}
                            onChange={handleInputChange}
                            className="pl-10 pr-10 h-12 bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:border-emerald-500 focus:ring-emerald-500/20"
                            required
                            minLength={8}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-200">
                          Confirmar Senha
                        </Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <Input
                            id="confirmPassword"
                            name="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirme sua senha"
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            className="pl-10 pr-10 h-12 bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:border-emerald-500 focus:ring-emerald-500/20"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
                          >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Terms and Marketing */}
                      <div className="space-y-4">
                        <div className="flex items-start space-x-2">
                          <Checkbox
                            id="acceptTerms"
                            name="acceptTerms"
                            checked={formData.acceptTerms}
                            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, acceptTerms: !!checked }))}
                            className="mt-1"
                            required
                          />
                          <Label htmlFor="acceptTerms" className="text-sm text-slate-300 leading-relaxed">
                            Eu aceito os{" "}
                            <Link to="/terms" className="text-emerald-400 hover:text-emerald-300 font-medium">
                              Termos de Uso
                            </Link>{" "}
                            e{" "}
                            <Link to="/privacy" className="text-emerald-400 hover:text-emerald-300 font-medium">
                              Política de Privacidade
                            </Link>
                          </Label>
                        </div>

                        <div className="flex items-start space-x-2">
                          <Checkbox
                            id="acceptMarketing"
                            name="acceptMarketing"
                            checked={formData.acceptMarketing}
                            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, acceptMarketing: !!checked }))}
                            className="mt-1"
                          />
                          <Label htmlFor="acceptMarketing" className="text-sm text-slate-300 leading-relaxed">
                            Quero receber dicas e novidades por email
                          </Label>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex justify-between pt-6">
                    {currentStep > 1 ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={prevStep}
                        className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Voltar
                      </Button>
                    ) : (
                      <div />
                    )}

                    {currentStep < 3 ? (
                      <Button
                        type="button"
                        onClick={nextStep}
                        className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white"
                      >
                        Próximo
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        type="submit"
                        className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold shadow-lg hover:shadow-emerald-500/25 transition-all duration-300"
                        disabled={isLoading || !formData.acceptTerms}
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
                            Criar Conta Grátis
                            <ArrowRight className="ml-2 h-5 w-5" />
                          </>
                        )}
                      </Button>
                    )}
                  </div>

                  {/* Login Link */}
                  <motion.div 
                    variants={fadeInUp}
                    className="text-center pt-4"
                  >
                    <p className="text-slate-300">
                      Já tem uma conta?{" "}
                      <Link 
                        to="/login" 
                        className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
                      >
                        Faça login
                      </Link>
                    </p>
                  </motion.div>
                </motion.form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Right Side - Benefits */}
          <motion.div
            className="space-y-8"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {/* Benefits List */}
            <motion.div
              className="bg-gradient-to-br from-emerald-500/10 to-blue-500/10 rounded-2xl p-8 border border-emerald-500/20 backdrop-blur-sm"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="text-2xl font-bold text-white mb-6">
                O que você ganha:
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={index}
                    className="flex items-start space-x-3"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 + 0.5 }}
                  >
                    <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <benefit.icon className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{benefit.text}</p>
                      <p className="text-slate-300 text-sm">{benefit.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Features Preview */}
            <motion.div 
              className="grid grid-cols-2 gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  className="text-center p-6 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:border-emerald-500/30 transition-all duration-300"
                  whileHover={{ scale: 1.05, y: -2 }}
                  transition={{ duration: 0.2 }}
                >
                  <feature.icon className="h-8 w-8 text-emerald-400 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-white mb-1">{feature.text}</p>
                  <p className="text-xs text-slate-400">{feature.desc}</p>
                </motion.div>
              ))}
            </motion.div>

          </motion.div>
        </div>

        {/* Back to Home */}
        <motion.div 
          className="text-center mt-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Link 
            to="/" 
            className="inline-flex items-center text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para o início
          </Link>
        </motion.div>
      </div>
    </div>
  );
}