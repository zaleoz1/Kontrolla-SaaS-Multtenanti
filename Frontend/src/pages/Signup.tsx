import { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { useEmailVerification } from "@/hooks/useEmailVerification";
import { GoogleLoginButton } from "@/components/auth/GoogleLoginButton";
import { EmailVerification } from "@/components/auth/EmailVerification";
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
  const { signup } = useAuth();
  const { sendVerificationCode, verifyCode } = useEmailVerification();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    tipoPessoa: "juridica",
    cpfCnpj: "",
    cep: "",
    endereco: "",
    cidade: "",
    estado: "",
    razaoSocial: "",
    nomeFantasia: "",
    inscricaoEstadual: "",
    inscricaoMunicipal: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
    acceptMarketing: false,
    selectedPlan: "",
    emailVerified: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [pendingSignupData, setPendingSignupData] = useState<any>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    let processedValue = value;
    
    // Formatação específica para cada campo
    if (name === 'cpfCnpj') {
      processedValue = formatarCpfCnpj(value, formData.tipoPessoa);
    } else if (name === 'cep') {
      processedValue = formatarCep(value);
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : processedValue
    }));

    // Buscar CEP automaticamente quando completar 8 dígitos
    if (name === 'cep' && value.replace(/\D/g, '').length === 8) {
      buscarCep(value);
    }
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

  const buscarCep = async (cep: string) => {
    const cepLimpo = cep.replace(/\D/g, '');
    if (cepLimpo.length === 8) {
      setIsLoadingCep(true);
      try {
        console.log('🔍 Buscando CEP:', cepLimpo);
        const response = await fetch(`/api/auth/cep/${cepLimpo}`);
        const data = await response.json();
        
        console.log('📦 Resposta da API:', data);
        
        if (response.ok && !data.erro) {
          setFormData(prev => ({
            ...prev,
            endereco: data.logradouro || '',
            cidade: data.localidade || '',
            estado: data.uf || ''
          }));
          console.log('✅ CEP encontrado e preenchido automaticamente');
        } else {
          console.log('❌ CEP não encontrado:', data.error || 'CEP inválido');
          // Limpar campos se CEP não for encontrado
          setFormData(prev => ({
            ...prev,
            endereco: '',
            cidade: '',
            estado: ''
          }));
        }
      } catch (error) {
        console.error('❌ Erro ao buscar CEP:', error);
        // Limpar campos em caso de erro
        setFormData(prev => ({
          ...prev,
          endereco: '',
          cidade: '',
          estado: ''
        }));
      } finally {
        setIsLoadingCep(false);
      }
    }
  };

  const formatarCpfCnpj = (value: string, tipoPessoa: string) => {
    const numeros = value.replace(/\D/g, '');
    if (tipoPessoa === 'fisica') {
      return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else {
      return numeros.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
  };

  const formatarCep = (value: string) => {
    const numeros = value.replace(/\D/g, '');
    return numeros.replace(/(\d{5})(\d{3})/, '$1-$2');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação adicional
    if (!formData.selectedPlan) {
      alert("Por favor, selecione um plano para continuar.");
      return;
    }
    
    if (!formData.acceptTerms) {
      alert("Por favor, aceite os termos de uso para continuar.");
      return;
    }
    
    // Função para truncar campos conforme limites do banco
    const truncateField = (field: string, maxLength: number) => {
      if (!field) return field;
      return field.length > maxLength ? field.substring(0, maxLength) : field;
    };
    
    // Preparar dados com truncamento
    const dadosTruncados = {
      firstName: truncateField(formData.firstName, 255),
      lastName: truncateField(formData.lastName, 255),
      email: truncateField(formData.email, 255),
      phone: truncateField(formData.phone, 20),
      company: truncateField(formData.company, 255),
      tipoPessoa: formData.tipoPessoa,
      cpfCnpj: formData.tipoPessoa === 'juridica' 
        ? truncateField(formData.cpfCnpj, 18) 
        : truncateField(formData.cpfCnpj, 14),
      cep: truncateField(formData.cep, 10),
      endereco: truncateField(formData.endereco, 65535),
      cidade: truncateField(formData.cidade, 100),
      estado: truncateField(formData.estado, 2),
      razaoSocial: truncateField(formData.razaoSocial, 255),
      nomeFantasia: truncateField(formData.nomeFantasia, 255),
      inscricaoEstadual: truncateField(formData.inscricaoEstadual, 20),
      inscricaoMunicipal: truncateField(formData.inscricaoMunicipal, 20),
      password: formData.password,
      confirmPassword: formData.confirmPassword,
      selectedPlan: formData.selectedPlan,
      acceptTerms: formData.acceptTerms,
      acceptMarketing: formData.acceptMarketing
    };
    
    // Verificar se o email foi verificado no primeiro passo
    if (!formData.emailVerified) {
      alert('Por favor, verifique seu email no primeiro passo antes de finalizar o cadastro.');
      setCurrentStep(1);
      return;
    }

    // Fazer o cadastro final
    setIsLoading(true);
    
    try {
      const result = await signup(dadosTruncados);
      
      if (result.success) {
        // Redirecionar para o dashboard
        navigate("/dashboard");
      } else {
        alert(result.error || 'Erro ao criar conta. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro no cadastro:', error);
      alert('Erro interno. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Função para lidar com sucesso da verificação de email
  const handleEmailVerificationSuccess = async (data?: any) => {
    if (!pendingSignupData) {
      console.error('❌ Dados do cadastro não encontrados');
      return;
    }

    // Se o email foi verificado, continuar para o próximo passo
    if (pendingSignupData.emailVerified) {
      // Atualizar os dados do formulário com os dados verificados
      setFormData(pendingSignupData);
      
      // Voltar para o formulário e ir para o próximo passo
      setShowEmailVerification(false);
      setPendingSignupData(null);
      setCurrentStep(2); // Ir para o próximo passo
      
      // Email verificado com sucesso - continuar para o próximo passo
    } else {
      // Fluxo antigo - fazer cadastro completo (caso seja usado em outro lugar)
      setIsLoading(true);
      
      try {
        const result = await signup(pendingSignupData);
        
        if (result.success) {
          navigate("/dashboard");
        } else {
          alert(result.error || 'Erro ao criar conta. Tente novamente.');
          setShowEmailVerification(false);
          setPendingSignupData(null);
        }
      } catch (error) {
        console.error('Erro no cadastro:', error);
        alert('Erro interno. Tente novamente.');
        setShowEmailVerification(false);
        setPendingSignupData(null);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Função para voltar do componente de verificação
  const handleBackFromVerification = () => {
    setShowEmailVerification(false);
    setPendingSignupData(null);
  };

  const nextStep = async () => {
    // Se estiver no primeiro passo (dados pessoais), verificar email antes de prosseguir
    if (currentStep === 1) {
      // Validar se o email foi preenchido
      if (!formData.email || !formData.email.includes('@')) {
        alert('Por favor, digite um email válido antes de continuar.');
        return;
      }

      // Validar se nome e sobrenome foram preenchidos
      if (!formData.firstName.trim() || !formData.lastName.trim()) {
        alert('Por favor, preencha seu nome e sobrenome antes de continuar.');
        return;
      }

      // Enviar código de verificação
      setIsLoading(true);
      
      try {
        const verificationResult = await sendVerificationCode({
          email: formData.email,
          tipo: 'cadastro',
          tenant_id: null,
          usuario_id: null
        });

        if (verificationResult.success) {
          // Salvar dados parciais para continuar após verificação
          setPendingSignupData({
            ...formData,
            // Marcar que o email foi verificado
            emailVerified: true
          });
          setShowEmailVerification(true);
          setIsLoading(false);
        } else {
          throw new Error(verificationResult.error || 'Erro ao enviar código de verificação');
        }
      } catch (error: any) {
        console.error('Erro ao enviar código de verificação:', error);
        alert(error.message || 'Erro ao enviar código de verificação. Tente novamente.');
        setIsLoading(false);
      }
    } else if (currentStep < 5) {
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

  const plans = [
    {
      id: "starter",
      name: "Starter",
      price: "R$ 97",
      period: "/mês",
      description: "Perfeito para pequenos negócios",
      features: [
        "Até 100 produtos",
        "Até 500 vendas/mês",
        "1 usuário",
        "Relatórios básicos",
        "Suporte por email",
        "Catálogo online",
        "Backup diário"
      ],
      popular: false,
      cta: "Escolher Starter"
    },
    {
      id: "professional",
      name: "Professional",
      price: "R$ 197",
      period: "/mês",
      description: "Ideal para empresas em crescimento",
      features: [
        "Produtos ilimitados",
        "Vendas ilimitadas",
        "Até 5 usuários",
        "Relatórios avançados + IA",
        "NF-e integrada",
        "Suporte prioritário",
        "API completa",
        "Backup automático",
        "Integrações populares"
      ],
      popular: true,
      cta: "Escolher Professional"
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: "R$ 397",
      period: "/mês",
      description: "Para grandes empresas",
      features: [
        "Tudo do Professional",
        "Usuários ilimitados",
        "Multi-empresas",
        "Integrações customizadas",
        "Suporte 24/7",
        "Treinamento dedicado",
        "SLA 99.9% garantido",
        "Consultoria incluída",
        "White-label disponível"
      ],
      popular: false,
      cta: "Escolher Enterprise"
    }
  ];

  const steps = [
    { number: 1, title: "", desc: "Dados básicos" },
    { number: 2, title: "", desc: "Informações" },
    { number: 3, title: "", desc: "Localização" },
    { number: 4, title: "", desc: "Senha" },
    { number: 5, title: "", desc: "Escolha" }
  ];

  // Se estiver mostrando verificação de email, renderizar apenas o componente
  if (showEmailVerification) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <EmailVerification
          email={formData.email}
          tipo="cadastro"
          onSuccess={handleEmailVerificationSuccess}
          onBack={handleBackFromVerification}
          className="w-full max-w-md"
        />
      </div>
    );
  }

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
          <motion.div 
            className="flex items-center justify-center mb-4 sm:mb-8"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <img 
              src="/logo.png" 
              alt="KontrollaPro Logo" 
              className="h-12 w-12 sm:h-16 sm:w-16 rounded-xl mr-3 sm:mr-4"
            />
            <span className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
              KontrollaPro
            </span>
          </motion.div>
          
          <motion.h1 
            className="text-2xl sm:text-4xl md:text-5xl font-bold text-white mb-2 sm:mb-4"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
          >
            Transforme seu negócio
          </motion.h1>
          
          <motion.p 
            className="text-slate-300 text-base sm:text-xl max-w-2xl mx-auto px-4 sm:px-0"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
          >
            A plataforma completa para gestão empresarial. Comece grátis hoje mesmo.
          </motion.p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6 sm:gap-12 items-start">
          {/* Left Side - Form */}
          <motion.div
            variants={scaleIn}
            initial="initial"
            animate="animate"
          >
            <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
              <CardHeader className="space-y-1 pb-4 sm:pb-6">
                <CardTitle className="text-xl sm:text-2xl font-bold text-center text-white">
                  Crie sua conta
                </CardTitle>
                <p className="text-center text-slate-300 text-sm sm:text-base">
                  Preencha os dados abaixo para começar
                </p>
                
                {/* Progress Steps */}
                <div className="flex justify-center mt-4 sm:mt-6">
                  <div className="flex items-center space-x-1 sm:space-x-2 max-w-full overflow-hidden">
                    {steps.map((step, index) => (
                      <div key={step.number} className="flex items-center flex-shrink-0">
                        <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                          currentStep >= step.number 
                            ? 'bg-emerald-500 text-white' 
                            : 'bg-slate-600 text-slate-300'
                        }`}>
                          {currentStep > step.number ? <Check className="h-2 w-2 sm:h-3 sm:w-3" /> : step.number}
                        </div>
                        {index < steps.length - 1 && (
                          <div className={`w-4 sm:w-8 h-0.5 mx-1 ${
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
                      className="space-y-4 sm:space-y-6"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName" className="text-xs sm:text-sm font-medium text-slate-200">
                            Nome
                          </Label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-slate-400" />
                            <Input
                              id="firstName"
                              name="firstName"
                              type="text"
                              placeholder="Seu nome"
                              value={formData.firstName}
                              onChange={handleInputChange}
                              className="pl-8 sm:pl-10 h-10 sm:h-12 bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:border-emerald-500 focus:ring-emerald-500/20 text-sm sm:text-base"
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="lastName" className="text-xs sm:text-sm font-medium text-slate-200">
                            Sobrenome
                          </Label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-slate-400" />
                            <Input
                              id="lastName"
                              name="lastName"
                              type="text"
                              placeholder="Seu sobrenome"
                              value={formData.lastName}
                              onChange={handleInputChange}
                              className="pl-8 sm:pl-10 h-10 sm:h-12 bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:border-emerald-500 focus:ring-emerald-500/20 text-sm sm:text-base"
                              required
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-xs sm:text-sm font-medium text-slate-200">
                          Email
                          {formData.emailVerified && (
                            <span className="ml-2 inline-flex items-center text-xs text-emerald-400">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Verificado
                            </span>
                          )}
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
                            className={`pl-8 sm:pl-10 h-10 sm:h-12 bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:border-emerald-500 focus:ring-emerald-500/20 text-sm sm:text-base ${
                              formData.emailVerified ? 'border-emerald-500/50 bg-emerald-500/5' : ''
                            }`}
                            required
                            disabled={formData.emailVerified}
                          />
                          {formData.emailVerified && (
                            <CheckCircle2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-emerald-400" />
                          )}
                        </div>
                        {formData.emailVerified && (
                          <p className="text-xs text-emerald-400 flex items-center">
                            <Shield className="w-3 h-3 mr-1" />
                            Email verificado com sucesso! Você pode continuar.
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-xs sm:text-sm font-medium text-slate-200">
                          Telefone
                        </Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-slate-400" />
                          <Input
                            id="phone"
                            name="phone"
                            type="tel"
                            placeholder="(11) 99999-9999"
                            value={formData.phone}
                            onChange={handleInputChange}
                            className="pl-8 sm:pl-10 h-10 sm:h-12 bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:border-emerald-500 focus:ring-emerald-500/20 text-sm sm:text-base"
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
                      className="space-y-4 sm:space-y-6"
                    >
                      {/* Tipo de Pessoa */}
                      <div className="space-y-2">
                        <Label className="text-xs sm:text-sm font-medium text-slate-200">
                          Tipo de Pessoa
                        </Label>
                        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="radio"
                              name="tipoPessoa"
                              value="fisica"
                              checked={formData.tipoPessoa === 'fisica'}
                              onChange={handleInputChange}
                              className="text-emerald-500 focus:ring-emerald-500"
                            />
                            <span className="text-slate-300 text-sm sm:text-base">Pessoa Física</span>
                          </label>
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="radio"
                              name="tipoPessoa"
                              value="juridica"
                              checked={formData.tipoPessoa === 'juridica'}
                              onChange={handleInputChange}
                              className="text-emerald-500 focus:ring-emerald-500"
                            />
                            <span className="text-slate-300 text-sm sm:text-base">Pessoa Jurídica</span>
                          </label>
                        </div>
                      </div>

                      {/* CPF/CNPJ */}
                      <div className="space-y-2">
                        <Label htmlFor="cpfCnpj" className="text-xs sm:text-sm font-medium text-slate-200">
                          {formData.tipoPessoa === 'fisica' ? 'CPF' : 'CNPJ'}
                        </Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-slate-400" />
                          <Input
                            id="cpfCnpj"
                            name="cpfCnpj"
                            type="text"
                            placeholder={formData.tipoPessoa === 'fisica' ? '000.000.000-00' : '00.000.000/0000-00'}
                            value={formData.cpfCnpj}
                            onChange={handleInputChange}
                            className="pl-8 sm:pl-10 h-10 sm:h-12 bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:border-emerald-500 focus:ring-emerald-500/20 text-sm sm:text-base"
                            required
                          />
                        </div>
                      </div>

                      {/* Nome da Empresa */}
                      <div className="space-y-2">
                        <Label htmlFor="company" className="text-xs sm:text-sm font-medium text-slate-200">
                          {formData.tipoPessoa === 'fisica' ? 'Nome Completo' : 'Nome da Empresa'}
                        </Label>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-slate-400" />
                          <Input
                            id="company"
                            name="company"
                            type="text"
                            placeholder={formData.tipoPessoa === 'fisica' ? 'Seu nome completo' : 'Nome da sua empresa'}
                            value={formData.company}
                            onChange={handleInputChange}
                            className="pl-8 sm:pl-10 h-10 sm:h-12 bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:border-emerald-500 focus:ring-emerald-500/20 text-sm sm:text-base"
                            required
                          />
                        </div>
                      </div>

                      {/* Razão Social e Nome Fantasia (apenas para PJ) */}
                      {formData.tipoPessoa === 'juridica' && (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="razaoSocial" className="text-xs sm:text-sm font-medium text-slate-200">
                              Razão Social
                            </Label>
                            <div className="relative">
                              <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-slate-400" />
                              <Input
                                id="razaoSocial"
                                name="razaoSocial"
                                type="text"
                                placeholder="Razão social da empresa"
                                value={formData.razaoSocial}
                                onChange={handleInputChange}
                                className="pl-8 sm:pl-10 h-10 sm:h-12 bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:border-emerald-500 focus:ring-emerald-500/20 text-sm sm:text-base"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="nomeFantasia" className="text-xs sm:text-sm font-medium text-slate-200">
                              Nome Fantasia
                            </Label>
                            <div className="relative">
                              <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-slate-400" />
                              <Input
                                id="nomeFantasia"
                                name="nomeFantasia"
                                type="text"
                                placeholder="Nome fantasia da empresa"
                                value={formData.nomeFantasia}
                                onChange={handleInputChange}
                                className="pl-8 sm:pl-10 h-10 sm:h-12 bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:border-emerald-500 focus:ring-emerald-500/20 text-sm sm:text-base"
                              />
                            </div>
                          </div>
                        </>
                      )}

                      {/* Inscrições (apenas para PJ) */}
                      {formData.tipoPessoa === 'juridica' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="inscricaoEstadual" className="text-xs sm:text-sm font-medium text-slate-200">
                              Inscrição Estadual
                            </Label>
                            <div className="relative">
                              <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-slate-400" />
                              <Input
                                id="inscricaoEstadual"
                                name="inscricaoEstadual"
                                type="text"
                                placeholder="Inscrição Estadual"
                                value={formData.inscricaoEstadual}
                                onChange={handleInputChange}
                                className="pl-8 sm:pl-10 h-10 sm:h-12 bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:border-emerald-500 focus:ring-emerald-500/20 text-sm sm:text-base"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="inscricaoMunicipal" className="text-xs sm:text-sm font-medium text-slate-200">
                              Inscrição Municipal
                            </Label>
                            <div className="relative">
                              <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-slate-400" />
                              <Input
                                id="inscricaoMunicipal"
                                name="inscricaoMunicipal"
                                type="text"
                                placeholder="Inscrição Municipal"
                                value={formData.inscricaoMunicipal}
                                onChange={handleInputChange}
                                className="pl-8 sm:pl-10 h-10 sm:h-12 bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:border-emerald-500 focus:ring-emerald-500/20 text-sm sm:text-base"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Logo Upload */}
                      <div className="space-y-2">
                        <Label className="text-xs sm:text-sm font-medium text-slate-200">
                          Logo da Empresa (Opcional)
                        </Label>
                        <div className="space-y-4">
                          {companyLogo ? (
                            <div className="relative">
                              <img
                                src={companyLogo}
                                alt="Company Logo Preview"
                                className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg border border-white/20"
                              />
                              <button
                                type="button"
                                onClick={removeLogo}
                                className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-5 h-5 sm:w-6 sm:h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                              >
                                <X className="h-2 w-2 sm:h-3 sm:w-3" />
                              </button>
                            </div>
                          ) : (
                            <div
                              onClick={() => fileInputRef.current?.click()}
                              className="w-20 h-20 sm:w-24 sm:h-24 border-2 border-dashed border-white/30 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-500/10 transition-all duration-200"
                            >
                              <Upload className="h-4 w-4 sm:h-6 sm:w-6 text-slate-400 mb-1" />
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

                  {/* Step 3: Address Information */}
                  {currentStep === 3 && (
                    <motion.div
                      variants={fadeInUp}
                      className="space-y-4 sm:space-y-6"
                    >
                      {/* CEP */}
                      <div className="space-y-2">
                        <Label htmlFor="cep" className="text-xs sm:text-sm font-medium text-slate-200">
                          CEP
                        </Label>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-slate-400" />
                          <Input
                            id="cep"
                            name="cep"
                            type="text"
                            placeholder="00000-000"
                            value={formData.cep}
                            onChange={handleInputChange}
                            className="pl-8 sm:pl-10 pr-8 sm:pr-10 h-10 sm:h-12 bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:border-emerald-500 focus:ring-emerald-500/20 text-sm sm:text-base"
                            required
                          />
                          {isLoadingCep && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                              <motion.div
                                className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              />
                            </div>
                          )}
                        </div>
                        {isLoadingCep && (
                          <p className="text-xs text-emerald-400">Buscando endereço...</p>
                        )}
                      </div>

                      {/* Endereço */}
                      <div className="space-y-2">
                        <Label htmlFor="endereco" className="text-xs sm:text-sm font-medium text-slate-200">
                          Endereço
                        </Label>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-slate-400" />
                          <Input
                            id="endereco"
                            name="endereco"
                            type="text"
                            placeholder="Rua, número, bairro"
                            value={formData.endereco}
                            onChange={handleInputChange}
                            className="pl-8 sm:pl-10 h-10 sm:h-12 bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:border-emerald-500 focus:ring-emerald-500/20 text-sm sm:text-base"
                            required
                          />
                        </div>
                      </div>

                      {/* Cidade e Estado */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="cidade" className="text-xs sm:text-sm font-medium text-slate-200">
                            Cidade
                          </Label>
                          <div className="relative">
                            <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-slate-400" />
                            <Input
                              id="cidade"
                              name="cidade"
                              type="text"
                              placeholder="Cidade"
                              value={formData.cidade}
                              onChange={handleInputChange}
                              className="pl-8 sm:pl-10 h-10 sm:h-12 bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:border-emerald-500 focus:ring-emerald-500/20 text-sm sm:text-base"
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="estado" className="text-xs sm:text-sm font-medium text-slate-200">
                            Estado
                          </Label>
                          <div className="relative">
                            <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-slate-400" />
                            <Input
                              id="estado"
                              name="estado"
                              type="text"
                              placeholder="UF"
                              value={formData.estado}
                              onChange={handleInputChange}
                              className="pl-8 sm:pl-10 h-10 sm:h-12 bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:border-emerald-500 focus:ring-emerald-500/20 text-sm sm:text-base"
                              required
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 4: Security */}
                  {currentStep === 4 && (
                    <motion.div
                      variants={fadeInUp}
                      className="space-y-4 sm:space-y-6"
                    >
                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-xs sm:text-sm font-medium text-slate-200">
                          Senha
                        </Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-slate-400" />
                          <Input
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Mínimo 8 caracteres"
                            value={formData.password}
                            onChange={handleInputChange}
                            className="pl-8 sm:pl-10 pr-8 sm:pr-10 h-10 sm:h-12 bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:border-emerald-500 focus:ring-emerald-500/20 text-sm sm:text-base"
                            required
                            minLength={8}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
                          >
                            {showPassword ? <EyeOff className="h-3 w-3 sm:h-4 sm:w-4" /> : <Eye className="h-3 w-3 sm:h-4 sm:w-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword" className="text-xs sm:text-sm font-medium text-slate-200">
                          Confirmar Senha
                        </Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-slate-400" />
                          <Input
                            id="confirmPassword"
                            name="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirme sua senha"
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            className="pl-8 sm:pl-10 pr-8 sm:pr-10 h-10 sm:h-12 bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:border-emerald-500 focus:ring-emerald-500/20 text-sm sm:text-base"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
                          >
                            {showConfirmPassword ? <EyeOff className="h-3 w-3 sm:h-4 sm:w-4" /> : <Eye className="h-3 w-3 sm:h-4 sm:w-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Terms and Marketing */}
                      <div className="space-y-3 sm:space-y-4">
                        <div className="flex items-start space-x-2">
                          <Checkbox
                            id="acceptTerms"
                            name="acceptTerms"
                            checked={formData.acceptTerms}
                            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, acceptTerms: !!checked }))}
                            className="mt-1"
                            required
                          />
                          <Label htmlFor="acceptTerms" className="text-xs sm:text-sm text-slate-300 leading-relaxed">
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
                          <Label htmlFor="acceptMarketing" className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                            Quero receber dicas e novidades por email
                          </Label>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 5: Plan Selection */}
                  {currentStep === 5 && (
                    <motion.div
                      variants={fadeInUp}
                      className="space-y-4 sm:space-y-6"
                    >
                      <div className="text-center mb-6 sm:mb-8">
                        <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                          Escolha seu plano
                        </h3>
                        <p className="text-slate-300 text-sm sm:text-base">
                          Selecione o plano que melhor se adapta ao seu negócio
                        </p>
                      </div>

                      <div className="grid gap-3 sm:gap-4">
                        {plans.map((plan, index) => (
                          <motion.div
                            key={plan.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`relative cursor-pointer transition-all duration-300 ${
                              formData.selectedPlan === plan.id
                                ? 'ring-2 ring-emerald-500 bg-emerald-500/10'
                                : 'hover:bg-white/5'
                            }`}
                            onClick={() => setFormData(prev => ({ ...prev, selectedPlan: plan.id }))}
                          >
                            <Card className={`bg-white/10 backdrop-blur-sm border transition-all duration-300 ${
                              formData.selectedPlan === plan.id
                                ? 'border-emerald-500/50 shadow-emerald-500/20'
                                : 'border-white/20 hover:border-emerald-400/50'
                            }`}>
                              <CardContent className="p-4 sm:p-6">
                                <div className="flex items-start justify-between mb-3 sm:mb-4">
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2 sm:space-x-3 mb-2">
                                      <h4 className={`text-lg sm:text-xl font-bold ${
                                        formData.selectedPlan === plan.id ? 'text-emerald-400' : 'text-white'
                                      }`}>
                                        {plan.name}
                                      </h4>
                                      {plan.popular && (
                                        <Badge className="bg-emerald-500 text-white text-xs px-2 py-1">
                                          Popular
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-slate-300 text-xs sm:text-sm mb-2 sm:mb-3">{plan.description}</p>
                                    <div className="flex items-baseline">
                                      <span className={`text-2xl sm:text-3xl font-bold ${
                                        formData.selectedPlan === plan.id ? 'text-emerald-400' : 'text-white'
                                      }`}>
                                        {plan.price}
                                      </span>
                                      <span className="text-slate-300 ml-1 text-sm sm:text-base">{plan.period}</span>
                                    </div>
                                  </div>
                                  
                                  <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center ${
                                    formData.selectedPlan === plan.id
                                      ? 'border-emerald-500 bg-emerald-500'
                                      : 'border-white/30'
                                  }`}>
                                    {formData.selectedPlan === plan.id && (
                                      <Check className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                                    )}
                                  </div>
                                </div>

                                <ul className="space-y-1 sm:space-y-2">
                                  {plan.features.slice(0, 4).map((feature, featureIndex) => (
                                    <li key={featureIndex} className="flex items-center text-xs sm:text-sm text-slate-300">
                                      <Check className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-400 mr-2 flex-shrink-0" />
                                      {feature}
                                    </li>
                                  ))}
                                  {plan.features.length > 4 && (
                                    <li className="text-xs sm:text-sm text-slate-400 ml-5 sm:ml-6">
                                      +{plan.features.length - 4} recursos adicionais
                                    </li>
                                  )}
                                </ul>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </div>

                      {!formData.selectedPlan && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-center text-red-400 text-sm"
                        >
                          Por favor, selecione um plano para continuar
                        </motion.div>
                      )}
                    </motion.div>
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex flex-col sm:flex-row justify-between pt-4 sm:pt-6 space-y-3 sm:space-y-0">
                    {currentStep > 1 ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={prevStep}
                        className="bg-white/10 border-white/20 text-white hover:bg-white/20 h-10 sm:h-12 text-sm sm:text-base w-full sm:w-auto"
                      >
                        <ArrowLeft className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                        Voltar
                      </Button>
                    ) : (
                      <div />
                    )}

                    {currentStep < 5 ? (
                      <Button
                        type="button"
                        onClick={nextStep}
                        className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white h-10 sm:h-12 text-sm sm:text-base w-full sm:w-auto"
                        disabled={currentStep === 4 && !formData.acceptTerms}
                      >
                        {isLoading ? (
                          <motion.div
                            className="flex items-center"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          >
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full mr-2" />
                            Enviando código...
                          </motion.div>
                        ) : currentStep === 1 ? (
                          <>
                            Verificar Email
                            <Mail className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                          </>
                        ) : (
                          <>
                            Próximo
                            <ArrowRight className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button
                        type="submit"
                        className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 h-10 sm:h-12 text-sm sm:text-base w-full sm:w-auto"
                        disabled={isLoading || !formData.acceptTerms || !formData.selectedPlan}
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
                            <span className="hidden sm:inline">Criar Conta Grátis</span>
                            <span className="sm:hidden">Criar Conta</span>
                            <ArrowRight className="ml-2 h-3 w-3 sm:h-5 sm:w-5" />
                          </>
                        )}
                      </Button>
                    )}
                  </div>

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
                      tenantSlug={formData.company?.toLowerCase().replace(/\s+/g, '-')}
                      onSuccess={() => {
                        console.log('✅ Login Google realizado com sucesso');
                      }}
                      onError={(error) => {
                        console.error('❌ Erro no login Google:', error);
                      }}
                      className="w-full"
                    />
                  </motion.div>

                  {/* Login Link */}
                  <motion.div 
                    variants={fadeInUp}
                    className="text-center pt-3 sm:pt-4"
                  >
                    <p className="text-slate-300 text-sm sm:text-base">
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
                O que você ganha:
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {benefits.map((benefit, index) => (
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
              {features.map((feature, index) => (
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