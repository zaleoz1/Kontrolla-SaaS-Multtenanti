import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  ArrowRight, 
  Check, 
  Star, 
  Users, 
  ShoppingCart, 
  Package, 
  TrendingUp, 
  Receipt,
  BarChart3,
  Store,
  Shield,
  Zap,
  Globe,
  Smartphone,
  Headphones,
  Award,
  ChevronRight,
  Play,
  Quote,
  Menu,
  X,
  Building2,
  Target,
  Clock,
  DollarSign,
  LineChart,
  Database,
  Cloud,
  Lock,
  RefreshCw,
  CheckCircle,
  ArrowUpRight,
  Sparkles,
  Rocket,
  TrendingDown,
  Activity,
  PieChart,
  BarChart,
  FileText,
  CreditCard,
  Settings,
  Download,
  Zap as Lightning
} from "lucide-react";

export default function LandingPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Refs para animações
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const pricingRef = useRef(null);
  const testimonialsRef = useRef(null);
  
  // Hooks de animação
  const heroInView = useInView(heroRef, { once: true, margin: "-100px" });
  const featuresInView = useInView(featuresRef, { once: true, margin: "-100px" });
  const pricingInView = useInView(pricingRef, { once: true, margin: "-100px" });
  const testimonialsInView = useInView(testimonialsRef, { once: true, margin: "-100px" });
  
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  
  // Progress bar para scroll
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);
  
  // Variantes de animação mais suaves e profissionais
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
  
  const gentleFade = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 1, ease: "easeOut" }
  };

  const features = [
    {
      icon: BarChart3,
      title: "Dashboard Inteligente",
      description: "Visão completa do seu negócio com métricas em tempo real e insights baseados em IA",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop&crop=center",
      color: "from-blue-500 to-blue-600"
    },
    {
      icon: ShoppingCart,
      title: "Gestão de Vendas",
      description: "Pipeline completo de vendas, automação de follow-up e previsão de receita",
      image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=400&fit=crop&crop=center",
      color: "from-green-500 to-green-600"
    },
    {
      icon: Package,
      title: "Controle de Estoque",
      description: "Gestão inteligente de inventário com alertas automáticos e otimização de custos",
      image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&h=400&fit=crop&crop=center",
      color: "from-purple-500 to-purple-600"
    },
    {
      icon: Users,
      title: "CRM Avançado",
      description: "Relacionamento com clientes 360°, segmentação automática e campanhas personalizadas",
      image: "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=600&h=400&fit=crop&crop=center",
      color: "from-orange-500 to-orange-600"
    },
    {
      icon: Receipt,
      title: "Financeiro Integrado",
      description: "Controle completo de receitas, despesas, fluxo de caixa e relatórios fiscais",
      image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&h=400&fit=crop&crop=center",
      color: "from-emerald-500 to-emerald-600"
    },
    {
      icon: Cloud,
      title: "Multi-tenant SaaS",
      description: "Arquitetura escalável para múltiplas empresas com segurança e isolamento total",
      image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&h=400&fit=crop&crop=center",
      color: "from-cyan-500 to-cyan-600"
    }
  ];

  const plans = [
    {
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
      cta: "Começar Grátis",
      savings: null
    },
    {
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
      cta: "Teste 7 dias grátis",
      savings: "Economize 20%"
    },
    {
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
      cta: "Falar com Vendas",
      savings: "Preço sob consulta"
    }
  ];

  const testimonials = [
    {
      name: "João Silva",
      company: "TechStore SP",
      role: "CEO",
      content: "O KontrollaPro revolucionou nossa gestão. Aumentamos significativamente nossas vendas! A IA para previsão de vendas é incrível.",
      rating: 5,
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
      results: "Crescimento expressivo"
    },
    {
      name: "Maria Santos",
      company: "Eletrônicos Plus",
      role: "Diretora Comercial",
      content: "Interface intuitiva e relatórios que realmente ajudam na tomada de decisão. O tempo de setup foi surpreendentemente rápido.",
      rating: 5,
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face",
      results: "Setup rápido"
    },
    {
      name: "Carlos Lima",
      company: "Gadgets & Co",
      role: "Fundador",
      content: "O melhor investimento que fizemos. ROI rápido e eficiente! A integração com NF-e economizou horas de trabalho.",
      rating: 5,
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
      results: "ROI rápido"
    }
  ];

  const stats = [
    { number: "100%", label: "Foco na Qualidade", icon: Building2 },
    { number: "24/7", label: "Suporte Disponível", icon: DollarSign },
    { number: "99.9%", label: "Uptime Garantido", icon: Shield },
    { number: "LGPD", label: "Conformidade Total", icon: Star }
  ];

  const benefits = [
    {
      icon: Rocket,
      title: "Setup em 5 minutos",
      description: "Configure sua empresa e comece a vender imediatamente"
    },
    {
      icon: Lock,
      title: "Segurança Enterprise",
      description: "Criptografia de ponta a ponta e conformidade LGPD"
    },
    {
      icon: RefreshCw,
      title: "Backup Automático",
      description: "Seus dados protegidos com backup diário na nuvem"
    },
    {
      icon: Zap,
      title: "Integrações Ilimitadas",
      description: "Conecte com mais de 200 ferramentas populares"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 scroll-smooth scroll-snap-type-y-mandatory">
      {/* Header */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="fixed top-0 w-full bg-white/95 backdrop-blur-xl border-b border-slate-200/60 z-50 shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18">
            <motion.div 
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="flex items-center space-x-3 cursor-pointer"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <div className="relative">
                <img 
                  src="/logo.png" 
                  alt="KontrollaPro Logo" 
                  className="h-12 w-12 rounded-xl shadow-sm"
                />
                <motion.div
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-500/20 to-blue-500/20"
                  whileHover={{ opacity: 1 }}
                  initial={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                KontrollaPro
              </span>
            </motion.div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              {[
                { name: "Recursos", id: "features" },
                { name: "Preços", id: "pricing" },
                { name: "Depoimentos", id: "testimonials" },
                { name: "Contato", id: "contact" }
              ].map((item, index) => (
                <motion.button
                  key={item.name}
                  onClick={() => {
                    const element = document.getElementById(item.id);
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 + 0.3, duration: 0.6, ease: "easeOut" }}
                  whileHover={{ y: -2 }}
                  className="text-slate-600 hover:text-slate-900 transition-all duration-300 relative group font-medium text-lg"
                >
                  {item.name}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-green-500 to-blue-500 transition-all group-hover:w-full rounded-full"></span>
                </motion.button>
              ))}
            </nav>

            <div className="hidden md:flex items-center space-x-4">
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7, duration: 0.6, ease: "easeOut" }}
              >
                <Button 
                  variant="ghost" 
                  onClick={() => navigate("/login")}
                  className="text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium px-6 py-2"
                >
                  Entrar
                </Button>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8, duration: 0.6, ease: "easeOut" }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button 
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold px-6 py-2 shadow-lg hover:shadow-green-500/25 transition-all duration-300" 
                  onClick={() => navigate("/signup")}
                >
                  <Rocket className="mr-2 h-4 w-4" />
                  Começar Grátis
                </Button>
              </motion.div>
            </div>

            {/* Mobile Menu Button */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              className="md:hidden p-3 rounded-lg hover:bg-slate-100 transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <motion.div
                animate={{ rotate: isMenuOpen ? 180 : 0 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
              >
                {isMenuOpen ? <X className="h-6 w-6 text-slate-700" /> : <Menu className="h-6 w-6 text-slate-700" />}
              </motion.div>
            </motion.button>
          </div>
        </div>

        {/* Mobile Menu */}
        <motion.div
          initial={false}
          animate={{ 
            height: isMenuOpen ? "auto" : 0,
            opacity: isMenuOpen ? 1 : 0
          }}
          transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="md:hidden bg-white/98 backdrop-blur-xl border-t border-slate-200/60 overflow-hidden shadow-lg"
        >
          <motion.div 
            initial={{ y: -10 }}
            animate={{ y: isMenuOpen ? 0 : -10 }}
            transition={{ delay: 0.1, duration: 0.4, ease: "easeOut" }}
            className="px-6 py-6 space-y-6"
          >
            {[
              { name: "Recursos", id: "features" },
              { name: "Preços", id: "pricing" },
              { name: "Depoimentos", id: "testimonials" },
              { name: "Contato", id: "contact" }
            ].map((item, index) => (
              <motion.button
                key={item.name}
                onClick={() => {
                  const element = document.getElementById(item.id);
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                  setIsMenuOpen(false);
                }}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: isMenuOpen ? 1 : 0, x: isMenuOpen ? 0 : -10 }}
                transition={{ delay: index * 0.1 + 0.2, duration: 0.4, ease: "easeOut" }}
                className="block text-slate-600 hover:text-slate-900 text-left w-full text-lg font-medium py-2 hover:bg-slate-50 rounded-lg px-3 transition-colors"
              >
                {item.name}
              </motion.button>
            ))}
            <div className="pt-4 space-y-3 border-t border-slate-200">
              <Button 
                variant="ghost" 
                className="w-full text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium py-3" 
                onClick={() => navigate("/login")}
              >
                Entrar
              </Button>
              <Button 
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 shadow-lg" 
                onClick={() => navigate("/signup")}
              >
                <Rocket className="mr-2 h-4 w-4" />
                Começar Grátis
              </Button>
            </div>
          </motion.div>
        </motion.div>
        
        {/* Progress Bar */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-blue-500 origin-left rounded-full"
          style={{ scaleX }}
        />
      </motion.header>

      {/* Hero Section */}
      <motion.section 
        ref={heroRef}
        className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
      >
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1920&h=1080&fit=crop&crop=center')] bg-cover bg-center opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-800/80 to-slate-900/90" />
          
          {/* Animated Grid */}
          <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
          
          {/* Floating Elements */}
          <motion.div
            className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl"
            animate={{
              x: [0, 100, 0],
              y: [0, -50, 0],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute bottom-20 right-10 w-96 h-96 bg-green-500/10 rounded-full blur-3xl"
            animate={{
              x: [0, -100, 0],
              y: [0, 50, 0],
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div 
              className="text-center lg:text-left"
              variants={staggerContainer}
              initial="initial"
              animate={heroInView ? "animate" : "initial"}
            >
              <motion.div variants={fadeInUp}>
                <Badge className="mb-6 bg-green-500/10 text-green-400 border-green-500/20 inline-flex items-center px-4 py-2">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Novo: IA para previsão de vendas
                </Badge>
              </motion.div>
              
              <motion.h1 
                variants={fadeInUp}
                className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-6 leading-tight"
              >
                A plataforma completa para
                <motion.span 
                  className="bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 bg-clip-text text-transparent block"
                  animate={{ 
                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] 
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                  style={{ backgroundSize: "200% 200%" }}
                >
                  gestão empresarial
                </motion.span>
              </motion.h1>
              
              <motion.p 
                variants={fadeInUp}
                className="text-xl text-slate-300 mb-8 max-w-2xl leading-relaxed"
              >
                Gerencie vendas, estoque, clientes e finanças em uma única plataforma. 
                Potencialize sua receita com inteligência artificial e automação.
              </motion.p>

              <motion.div 
                variants={fadeInUp}
                className="flex flex-col sm:flex-row items-center gap-4 mb-8"
              >
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-lg px-8 py-4 shadow-2xl hover:shadow-green-500/25 transition-all duration-300"
                  onClick={() => navigate("/signup")}
                >
                  Começar Teste Grátis
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="text-lg px-8 py-4 border-2 border-blue-500/30 text-blue-600 hover:bg-blue-500/10 backdrop-blur-sm"
                  onClick={() => navigate("/download")}
                >
                  <Download className="mr-2 h-5 w-5" />
                  Baixar Desktop
                </Button>
              </motion.div>

              <motion.div 
                variants={fadeInUp}
                className="flex flex-wrap items-center justify-center lg:justify-start gap-6 text-sm text-slate-400"
              >
                {[
                  "Teste grátis por 7 dias",
                  "Cancele quando quiser"
                ].map((text, index) => (
                  <div key={text} className="flex items-center">
                    <Check className="h-4 w-4 text-green-400 mr-2" />
                    {text}
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* Right Content - Dashboard Preview */}
            <motion.div 
              className="relative"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={heroInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="relative bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <div className="text-white/60 text-sm">KontrollaPro Dashboard</div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-white/10 rounded-lg p-4">
                    <div className="text-2xl font-bold text-white">R$ 45.2K</div>
                    <div className="text-sm text-green-400">+12.5% vs mês anterior</div>
                  </div>
                  <div className="bg-white/10 rounded-lg p-4">
                    <div className="text-2xl font-bold text-white">1,247</div>
                    <div className="text-sm text-blue-400">Vendas este mês</div>
                  </div>
                </div>
                
                <div className="bg-white/10 rounded-lg p-4">
                  <div className="h-32 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-lg flex items-center justify-center">
                    <BarChart3 className="h-16 w-16 text-white/40" />
                  </div>
                </div>
              </div>
              
              {/* Floating Cards */}
              <motion.div
                className="absolute -top-4 -right-4 bg-green-500 text-white p-3 rounded-lg shadow-lg"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <TrendingUp className="h-6 w-6" />
              </motion.div>
              
              <motion.div
                className="absolute -bottom-4 -left-4 bg-blue-500 text-white p-3 rounded-lg shadow-lg"
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: 1 }}
              >
                <Users className="h-6 w-6" />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Stats Section */}
      <motion.section 
        className="py-20 bg-gradient-to-r from-slate-50 to-white relative overflow-hidden"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Construído para o sucesso
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Características que garantem a excelência da nossa plataforma
            </p>
          </motion.div>

          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {stats.map((stat, index) => (
              <motion.div 
                key={index} 
                variants={scaleIn}
                whileHover={{ scale: 1.05, y: -5 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="group cursor-pointer"
              >
                <Card className="bg-white border-0 shadow-lg hover:shadow-2xl transition-all duration-500 h-full group-hover:border-green-200">
                  <CardContent className="p-6 text-center">
                    <motion.div 
                      className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:from-green-600 group-hover:to-green-700 transition-all duration-300"
                      whileHover={{ rotate: 180 }}
                      transition={{ duration: 0.8, ease: "easeInOut" }}
                    >
                      <stat.icon className="h-8 w-8 text-white" />
                    </motion.div>
                    
                    <motion.div 
                      className="text-3xl md:text-4xl font-bold text-slate-900 mb-2 group-hover:text-green-600 transition-colors duration-300"
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      transition={{ delay: index * 0.1, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                    >
                      {stat.number}
                    </motion.div>
                    
                    <motion.div 
                      className="text-slate-600 group-hover:text-slate-800 transition-colors duration-300 font-medium"
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      transition={{ delay: index * 0.1 + 0.2 }}
                    >
                      {stat.label}
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.section 
        id="features" 
        ref={featuresRef}
        className="py-24 bg-white relative overflow-hidden"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-20"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <motion.div
              className="inline-flex items-center px-4 py-2 rounded-full bg-green-100 text-green-700 text-sm font-medium mb-6"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Recursos Avançados
            </motion.div>
            
            <motion.h2 
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-6"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
            >
              Tudo que você precisa em uma
              <span className="bg-gradient-to-r from-green-500 to-blue-500 bg-clip-text text-transparent block">plataforma única</span>
            </motion.h2>
            <motion.p 
              className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
            >
              Recursos poderosos alimentados por IA para transformar seu negócio e aumentar suas vendas
            </motion.p>
          </motion.div>

          <motion.div 
            className="grid lg:grid-cols-2 gap-12"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="group"
              >
                <Card className="bg-white border-0 shadow-xl hover:shadow-2xl transition-all duration-500 h-full overflow-hidden group-hover:border-green-200">
                  <div className="relative">
                    <div className="h-48 overflow-hidden">
                      <img 
                        src={feature.image} 
                        alt={feature.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    </div>
                    
                    <motion.div 
                      className={`absolute top-4 right-4 w-12 h-12 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center shadow-lg`}
                      whileHover={{ rotate: 180, scale: 1.1 }}
                      transition={{ duration: 0.8, ease: "easeInOut" }}
                    >
                      <feature.icon className="h-6 w-6 text-white" />
                    </motion.div>
                  </div>
                  
                  <CardContent className="p-6">
                    <h3 className="text-2xl font-bold text-slate-900 mb-3 group-hover:text-green-600 transition-colors duration-300">
                      {feature.title}
                    </h3>
                    <p className="text-slate-600 leading-relaxed text-lg">
                      {feature.description}
                    </p>
                    
                    <motion.div
                      className="mt-6 flex items-center text-green-600 font-semibold group-hover:text-green-700 transition-colors duration-300"
                      whileHover={{ x: 5 }}
                    >
                      Saiba mais
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Benefits Section */}
          <motion.div 
            className="mt-24"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-3xl p-8 md:p-12">
              <div className="text-center mb-12">
                <h3 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                  Por que escolher o KontrollaPro?
                </h3>
                <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                  Benefícios exclusivos que fazem a diferença no seu negócio
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="text-center group"
                  >
                    <motion.div 
                      className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:from-green-600 group-hover:to-green-700 transition-all duration-300"
                      whileHover={{ rotate: 180, scale: 1.1 }}
                      transition={{ duration: 0.8, ease: "easeInOut" }}
                    >
                      <benefit.icon className="h-8 w-8 text-white" />
                    </motion.div>
                    <h4 className="text-lg font-semibold text-slate-900 mb-2 group-hover:text-green-600 transition-colors duration-300">
                      {benefit.title}
                    </h4>
                    <p className="text-slate-600 text-sm leading-relaxed">
                      {benefit.description}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Pricing Section */}
      <motion.section 
        id="pricing" 
        ref={pricingRef}
        className="py-24 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        {/* Background decoration */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1920&h=1080&fit=crop&crop=center')] bg-cover bg-center opacity-10" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-800/80 to-slate-900/90" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-r from-green-400/20 to-blue-400/20 rounded-full blur-3xl" />
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-20"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <motion.div
              className="inline-flex items-center px-4 py-2 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 text-sm font-medium mb-6"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <Star className="w-4 h-4 mr-2" />
              Planos com 7 dias grátis
            </motion.div>
            
            <motion.h2 
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
            >
              Escolha seu plano
              <span className="bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent block">ideal</span>
            </motion.h2>
            <motion.p 
              className="text-xl text-slate-300 max-w-4xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
            >
              Comece grátis hoje e escale conforme seu negócio cresce. 
              <span className="font-semibold text-white"> Sem compromisso.</span>
            </motion.p>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {plans.map((plan, index) => (
              <motion.div
                key={index}
                variants={scaleIn}
                whileHover={{ y: -8, scale: plan.popular ? 1.05 : 1.02 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="group relative"
              >
                {/* Popular Badge - Outside the card */}
                {plan.popular && (
                  <motion.div 
                    className="absolute -top-6 left-1/2 transform -translate-x-1/2 z-20"
                    initial={{ scale: 0, rotate: -90 }}
                    whileInView={{ scale: 1, rotate: 0 }}
                    transition={{ delay: index * 0.2 + 0.5, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                    viewport={{ once: true }}
                  >
                    <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-2 text-sm font-semibold shadow-lg">
                      <Sparkles className="w-4 h-4 mr-1" />
                      Mais Popular
                    </Badge>
                  </motion.div>
                )}

                {/* Card Container */}
                <div className={`relative bg-white/10 backdrop-blur-sm rounded-3xl shadow-2xl border transition-all duration-500 hover:shadow-3xl h-full overflow-hidden flex flex-col ${
                  plan.popular 
                    ? 'border-green-500/50 shadow-green-500/20' 
                    : 'border-white/20 group-hover:border-green-400/50 group-hover:shadow-green-500/10'
                }`}>

                  {/* Savings Badge */}
                  {plan.savings && (
                    <motion.div 
                      className="absolute top-4 right-4 z-10"
                      initial={{ opacity: 0, scale: 0 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 + 0.3 }}
                      viewport={{ once: true }}
                    >
                      <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-1 text-xs font-semibold">
                        {plan.savings}
                      </Badge>
                    </motion.div>
                  )}

                  {/* Header */}
                  <div className={`relative p-8 pb-6 ${plan.popular ? 'pt-12' : ''}`}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 + 0.3 }}
                      viewport={{ once: true }}
                    >
                      <h3 className={`text-2xl font-bold mb-3 transition-colors duration-300 ${
                        plan.popular ? 'text-green-400' : 'text-white group-hover:text-green-400'
                      }`}>
                        {plan.name}
                      </h3>
                      
                      <motion.div 
                        className="mb-4"
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        transition={{ delay: index * 0.1 + 0.5, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                        viewport={{ once: true }}
                      >
                        <div className="flex items-baseline">
                          <span className={`text-5xl font-bold ${
                            plan.popular ? 'text-green-400' : 'text-white'
                          }`}>
                            {plan.price}
                          </span>
                          <span className="text-slate-300 ml-2 text-lg">{plan.period}</span>
                        </div>
                      </motion.div>
                      
                      <p className="text-slate-300 leading-relaxed text-lg">{plan.description}</p>
                    </motion.div>
                  </div>

                  {/* Features - Flex grow to push button to bottom */}
                  <div className="px-8 pb-8 flex-1">
                    <ul className="space-y-4">
                      {plan.features.map((feature, featureIndex) => (
                        <motion.li 
                          key={featureIndex} 
                          className="flex items-start group/item"
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 + featureIndex * 0.1 + 0.6 }}
                          viewport={{ once: true }}
                        >
                          <motion.div
                            initial={{ scale: 0 }}
                            whileInView={{ scale: 1 }}
                            transition={{ delay: index * 0.1 + featureIndex * 0.1 + 0.8, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                            viewport={{ once: true }}
                            className="flex-shrink-0 mt-1"
                          >
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                              plan.popular ? 'bg-green-500/20' : 'bg-white/10 group-hover/item:bg-green-500/20'
                            } transition-colors duration-300`}>
                              <Check className={`w-4 h-4 ${
                                plan.popular ? 'text-green-400' : 'text-white group-hover/item:text-green-400'
                              } transition-colors duration-300`} />
                            </div>
                          </motion.div>
                          <span className="text-slate-200 ml-3 leading-relaxed">{feature}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </div>

                  {/* CTA Button - Always at bottom */}
                  <div className="p-8 pt-0 mt-auto">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 + 1 }}
                      viewport={{ once: true }}
                    >
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                      >
                        <Button 
                          className={`w-full h-14 font-semibold rounded-2xl transition-all duration-300 text-lg ${
                            plan.popular 
                              ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-green-500/25' 
                              : 'bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-green-400/50 backdrop-blur-sm group-hover:bg-green-500/20 group-hover:border-green-400/50'
                          }`}
                          onClick={() => navigate("/signup")}
                        >
                          <span className="flex items-center justify-center">
                            {plan.cta}
                            <ArrowRight className="ml-2 h-5 w-5" />
                          </span>
                        </Button>
                      </motion.div>
                      
                      {/* Additional info */}
                      <motion.p 
                        className="text-center text-sm text-slate-400 mt-4"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        transition={{ delay: index * 0.1 + 1.2 }}
                        viewport={{ once: true }}
                      >
                        {plan.name === 'Starter' && 'Cancele a qualquer momento'}
                        {plan.name === 'Professional' && '7 dias grátis, depois R$ 197/mês'}
                        {plan.name === 'Enterprise' && 'Contrato personalizado'}
                      </motion.p>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Bottom CTA */}
          <motion.div 
            className="text-center mt-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 max-w-2xl mx-auto border border-slate-200 shadow-lg">
              <h3 className="text-2xl font-bold text-slate-900 mb-4">
                Precisa de algo personalizado?
              </h3>
              <p className="text-slate-600 mb-6 text-lg">
                Nossa equipe está pronta para criar uma solução sob medida para seu negócio.
              </p>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-block"
              >
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="border-2 border-slate-300 hover:border-green-500 hover:bg-green-50 text-slate-700 hover:text-green-700 px-8 py-3 text-lg font-semibold rounded-xl transition-all duration-300"
                >
                  <Users className="mr-2 h-5 w-5" />
                  Falar com Vendas
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Testimonials Section */}
      <motion.section 
        id="testimonials" 
        ref={testimonialsRef}
        className="py-24 bg-gradient-to-br from-slate-50 to-white relative overflow-hidden"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-20"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <motion.div
              className="inline-flex items-center px-4 py-2 rounded-full bg-green-100 text-green-700 text-sm font-medium mb-6"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <Star className="w-4 h-4 mr-2" />
              Depoimentos Reais
            </motion.div>
            
            <motion.h2 
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-6"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
            >
              O que nossos clientes
              <span className="bg-gradient-to-r from-green-500 to-blue-500 bg-clip-text text-transparent block">dizem</span>
            </motion.h2>
            <motion.p 
              className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
            >
              Empresas de todos os tamanhos confiam no KontrollaPro para crescer seus negócios
            </motion.p>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-3 gap-8"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="group"
              >
                <Card className="bg-white border-0 shadow-xl hover:shadow-2xl transition-all duration-500 h-full overflow-hidden group-hover:border-green-200">
                  <CardContent className="p-8 h-full flex flex-col">
                    {/* Rating */}
                    <motion.div 
                      className="flex items-center mb-6"
                      initial={{ opacity: 0, scale: 0 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 + 0.3, type: "spring", stiffness: 200 }}
                      viewport={{ once: true }}
                    >
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, scale: 0 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.1 + i * 0.1 + 0.5, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                          viewport={{ once: true }}
                        >
                          <Star className="h-5 w-5 text-yellow-400 fill-current" />
                        </motion.div>
                      ))}
                    </motion.div>
                    
                    {/* Quote */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 + 0.4, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                      viewport={{ once: true }}
                    >
                      <Quote className="h-8 w-8 text-green-500 mb-6" />
                    </motion.div>
                    
                    {/* Content */}
                    <motion.p 
                      className="text-slate-600 mb-8 italic flex-grow text-lg leading-relaxed"
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 + 0.6 }}
                      viewport={{ once: true }}
                    >
                      "{testimonial.content}"
                    </motion.p>
                    
                    {/* Results Badge */}
                    <motion.div 
                      className="mb-6"
                      initial={{ opacity: 0, scale: 0 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 + 0.7 }}
                      viewport={{ once: true }}
                    >
                      <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 text-sm font-semibold">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        {testimonial.results}
                      </Badge>
                    </motion.div>
                    
                    {/* Author */}
                    <motion.div 
                      className="flex items-center"
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 + 0.8 }}
                      viewport={{ once: true }}
                    >
                      <motion.div 
                        className="h-14 w-14 rounded-full overflow-hidden mr-4 shadow-lg"
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <img 
                          src={testimonial.avatar} 
                          alt={testimonial.name}
                          className="w-full h-full object-cover"
                        />
                      </motion.div>
                      <div>
                        <div className="font-bold text-slate-900 group-hover:text-green-600 transition-colors duration-300 text-lg">
                          {testimonial.name}
                        </div>
                        <div className="text-slate-600 font-medium">
                          {testimonial.role}
                        </div>
                        <div className="text-sm text-slate-500">
                          {testimonial.company}
                        </div>
                      </div>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section 
        id="contact"
        className="py-24 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1920&h=1080&fit=crop&crop=center')] bg-cover bg-center opacity-10" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-800/80 to-slate-900/90" />
          
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
        
        <div className="relative z-10 max-w-6xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <motion.div
            className="inline-flex items-center px-4 py-2 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 text-sm font-medium mb-8"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <Rocket className="w-4 h-4 mr-2" />
            Comece hoje mesmo
          </motion.div>
          
          <motion.h2 
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            Pronto para transformar
            <span className="bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent block">seu negócio?</span>
          </motion.h2>
          
          <motion.p 
            className="text-xl text-slate-300 mb-12 max-w-3xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            Junte-se às empresas que já usam o KontrollaPro para crescer e automatizar seus processos
          </motion.p>
          
          <motion.div 
            className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-lg px-8 py-4 shadow-2xl hover:shadow-green-500/25 transition-all duration-300"
                onClick={() => navigate("/signup")}
              >
                <Rocket className="mr-2 h-5 w-5" />
                Começar Teste Grátis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </motion.div>
            
          </motion.div>
          
          <motion.div 
            className="flex flex-wrap items-center justify-center gap-8 text-sm text-slate-400"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            viewport={{ once: true }}
          >
            {[
              "Teste grátis por 7 dias", 
              "Cancele quando quiser",
              "Suporte 24/7 incluído"
            ].map((text, index) => (
              <div key={text} className="flex items-center">
                <Check className="h-4 w-4 text-green-400 mr-2" />
                {text}
              </div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Footer */}
      <motion.footer 
        className="bg-slate-900 text-white py-20 relative overflow-hidden"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-r from-green-500/5 to-blue-500/5 rounded-full blur-3xl" />
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="grid md:grid-cols-4 gap-12"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            <motion.div variants={fadeInUp} className="md:col-span-1">
              <motion.div 
                className="flex items-center space-x-3 mb-6"
                whileHover={{ scale: 1.05 }}
              >
                <img 
                  src="/logo.png" 
                  alt="KontrollaPro Logo" 
                  className="h-10 w-10 rounded-lg"
                />
                <span className="text-2xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">KontrollaPro</span>
              </motion.div>
              <p className="text-slate-400 mb-6 leading-relaxed text-lg">
                A plataforma completa para gestão de negócios. 
                Transforme sua empresa com tecnologia e inteligência artificial.
              </p>
              <div className="flex space-x-4">
                {[
                  { icon: Globe, href: "#", label: "Website" },
                  { icon: Smartphone, href: "#", label: "Mobile" },
                  { icon: Headphones, href: "#", label: "Suporte" }
                ].map((social, index) => (
                  <motion.a 
                    key={index}
                    href={social.href} 
                    className="text-slate-400 hover:text-green-400 transition-colors p-2 rounded-lg hover:bg-white/5"
                    whileHover={{ scale: 1.1, rotate: 2 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    title={social.label}
                  >
                    <social.icon className="h-5 w-5" />
                  </motion.a>
                ))}
              </div>
            </motion.div>

            {[
              {
                title: "Produto",
                links: [
                  { name: "Recursos", href: "#" },
                  { name: "Preços", href: "#" },
                  { name: "API", href: "#" },
                  { name: "Integrações", href: "#" },
                  { name: "Changelog", href: "#" }
                ]
              },
              {
                title: "Suporte",
                links: [
                  { name: "Central de Ajuda", href: "#" },
                  { name: "Documentação", href: "#" },
                  { name: "Status", href: "#" },
                  { name: "Contato", href: "#" },
                  { name: "Comunidade", href: "#" }
                ]
              },
              {
                title: "Empresa",
                links: [
                  { name: "Sobre", href: "#" },
                  { name: "Blog", href: "#" },
                  { name: "Carreiras", href: "#" },
                  { name: "Privacidade", href: "#" },
                  { name: "Segurança", href: "#" }
                ]
              }
            ].map((section, index) => (
              <motion.div key={section.title} variants={fadeInUp}>
                <h3 className="font-bold mb-6 text-xl text-white">{section.title}</h3>
                <ul className="space-y-4">
                  {section.links.map((link, linkIndex) => (
                    <motion.li 
                      key={link.name}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 + linkIndex * 0.05 }}
                      viewport={{ once: true }}
                    >
                      <motion.a 
                        href={link.href} 
                        className="text-slate-400 hover:text-green-400 transition-colors block text-lg"
                        whileHover={{ x: 4 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                      >
                        {link.name}
                      </motion.a>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </motion.div>

          <motion.div 
            className="border-t border-slate-800 mt-16 pt-8 flex flex-col md:flex-row items-center justify-between"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-8">
              <p className="text-slate-400 text-sm">
                © 2024 KontrollaPro. Todos os direitos reservados.
              </p>
              <div className="flex items-center space-x-2 text-slate-500">
                <Shield className="h-4 w-4" />
                <span className="text-sm">LGPD Compliant</span>
              </div>
            </div>
            
            <div className="flex flex-wrap justify-center md:justify-end space-x-6 mt-4 md:mt-0">
              {["Termos de Uso", "Política de Privacidade", "Cookies", "SLA"].map((link, index) => (
                <motion.a 
                  key={link}
                  href="#" 
                  className="text-slate-400 hover:text-green-400 text-sm transition-colors"
                  whileHover={{ scale: 1.02 }}
                  initial={{ opacity: 0, y: 5 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + index * 0.1, duration: 0.4, ease: "easeOut" }}
                  viewport={{ once: true }}
                >
                  {link}
                </motion.a>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.footer>
      
      {/* Botão Voltar ao Topo */}
      <motion.button
        className="fixed bottom-8 right-8 z-50 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white p-4 rounded-full shadow-2xl hover:shadow-green-500/25 transition-all duration-300 backdrop-blur-sm border border-green-400/20"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ 
          opacity: scrollYProgress.get() > 0.1 ? 1 : 0,
          scale: scrollYProgress.get() > 0.1 ? 1 : 0
        }}
        whileHover={{ scale: 1.1, y: -2 }}
        whileTap={{ scale: 0.9 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <ArrowRight className="h-6 w-6 rotate-[-90deg]" />
        </motion.div>
      </motion.button>
    </div>
  );
}
