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
  X
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
      icon: ShoppingCart,
      title: "Gestão de Vendas",
      description: "Controle completo de vendas, pedidos e clientes em tempo real"
    },
    {
      icon: Package,
      title: "Controle de Estoque",
      description: "Monitore produtos, alertas de estoque baixo e movimentações"
    },
    {
      icon: Users,
      title: "CRM Integrado",
      description: "Gerencie relacionamentos com clientes e histórico de compras"
    },
    {
      icon: TrendingUp,
      title: "Relatórios Financeiros",
      description: "Dashboards e relatórios detalhados para tomada de decisão"
    },
    {
      icon: Receipt,
      title: "Emissão de NF-e",
      description: "Emissão automática de notas fiscais eletrônicas"
    },
    {
      icon: Store,
      title: "Catálogo Online",
      description: "Crie e compartilhe catálogos públicos para seus clientes"
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
        "Catálogo online"
      ],
      popular: false,
      cta: "Começar Grátis"
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
        "Relatórios avançados",
        "NF-e integrada",
        "Suporte prioritário",
        "API completa",
        "Backup automático"
      ],
      popular: true,
      cta: "Teste 14 dias grátis"
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
        "SLA garantido",
        "Consultoria incluída"
      ],
      popular: false,
      cta: "Falar com Vendas"
    }
  ];

  const testimonials = [
    {
      name: "João Silva",
      company: "TechStore SP",
      content: "O KontrollaPro revolucionou nossa gestão. Aumentamos 40% nas vendas em 3 meses!",
      rating: 5,
      avatar: "JS"
    },
    {
      name: "Maria Santos",
      company: "Eletrônicos Plus",
      content: "Interface intuitiva e relatórios que realmente ajudam na tomada de decisão.",
      rating: 5,
      avatar: "MS"
    },
    {
      name: "Carlos Lima",
      company: "Gadgets & Co",
      content: "O melhor investimento que fizemos. ROI em menos de 2 meses!",
      rating: 5,
      avatar: "CL"
    }
  ];

  const stats = [
    { number: "10.000+", label: "Empresas Ativas" },
    { number: "R$ 2.5B+", label: "Vendas Processadas" },
    { number: "99.9%", label: "Uptime Garantido" },
    { number: "4.9/5", label: "Avaliação dos Clientes" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 scroll-smooth scroll-snap-type-y-mandatory">
      {/* Header */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="fixed top-0 w-full bg-white/90 backdrop-blur-lg border-b border-slate-200/50 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <motion.div 
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="flex items-center space-x-3 cursor-pointer"
            >
              <img 
                src="/logo.png" 
                alt="KontrollaPro Logo" 
                className="h-10 w-10 rounded-lg"
              />
              <span className="text-xl font-bold text-slate-900">KontrollaPro</span>
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
                  whileHover={{ y: -1 }}
                  className="text-slate-600 hover:text-slate-900 transition-colors relative group"
                >
                  {item.name}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-green-500 transition-all group-hover:w-full"></span>
                </motion.button>
              ))}
            </nav>

            <div className="hidden md:flex items-center space-x-4">
                            <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7, duration: 0.6, ease: "easeOut" }}
              >
                <Button variant="ghost" onClick={() => navigate("/login")}>
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
              <Button className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700" onClick={() => navigate("/signup")}>
                Começar Grátis
              </Button>
              </motion.div>
            </div>

            {/* Mobile Menu Button */}
                        <motion.button
              whileTap={{ scale: 0.98 }}
              className="md:hidden p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <motion.div
                animate={{ rotate: isMenuOpen ? 180 : 0 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
              >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
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
          className="md:hidden bg-white/95 backdrop-blur-sm border-t border-slate-200/50 overflow-hidden"
        >
          <motion.div 
            initial={{ y: -10 }}
            animate={{ y: isMenuOpen ? 0 : -10 }}
            transition={{ delay: 0.1, duration: 0.4, ease: "easeOut" }}
            className="px-4 py-4 space-y-4"
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
                className="block text-slate-600 hover:text-slate-900 text-left w-full"
              >
                {item.name}
              </motion.button>
            ))}
              <div className="pt-4 space-y-2">
                <Button variant="ghost" className="w-full" onClick={() => navigate("/login")}>
                  Entrar
                </Button>
                <Button className="w-full bg-gradient-to-r from-green-500 to-green-600" onClick={() => navigate("/signup")}>
                  Começar Grátis
                </Button>
              </div>
          </motion.div>
        </motion.div>
        
        {/* Progress Bar */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-1 bg-green-500 origin-left"
          style={{ scaleX }}
        />
      </motion.header>

      {/* Hero Section */}
      <motion.section 
        ref={heroRef}
        style={{ y }}
        className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden min-h-screen flex items-center scroll-snap-align-start"
      >
        {/* Background Animation */}
        <motion.div
          className="absolute inset-0 -z-10"
          animate={{
            background: [
              "radial-gradient(circle at 20% 50%, rgba(34, 197, 94, 0.05) 0%, transparent 50%)",
              "radial-gradient(circle at 80% 20%, rgba(34, 197, 94, 0.05) 0%, transparent 50%)",
              "radial-gradient(circle at 40% 80%, rgba(34, 197, 94, 0.05) 0%, transparent 50%)",
            ]
          }}
          transition={{ duration: 12, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
        />
        
        <div className="max-w-7xl mx-auto w-full">
          <motion.div 
            className="text-center"
            variants={staggerContainer}
            initial="initial"
            animate={heroInView ? "animate" : "initial"}
          >
                        <motion.div variants={fadeInUp}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <Badge className="mb-6 bg-green-100 text-green-800 border-green-200 inline-flex items-center">
                  <motion.div
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Zap className="h-3 w-3 mr-1" />
                  </motion.div>
                  Novo: IA para previsão de vendas
                </Badge>
              </motion.div>
            </motion.div>
            
            <motion.h1 
              variants={fadeInUp}
              className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-slate-900 mb-6 leading-tight"
            >
              Gerencie seu negócio com
              <motion.span 
                className="bg-gradient-to-r from-green-500 to-green-600 bg-clip-text text-transparent block sm:inline"
                animate={{ 
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] 
                }}
                transition={{ duration: 3, repeat: Infinity }}
                style={{ backgroundSize: "200% 200%" }}
              >
                inteligência
              </motion.span>
            </motion.h1>
            
            <motion.p 
              variants={fadeInUp}
              className="text-lg sm:text-xl lg:text-2xl text-slate-600 mb-8 max-w-4xl mx-auto leading-relaxed"
            >
              O sistema completo para gestão de vendas, estoque, clientes e finanças. 
              Aumente suas vendas em até 40% com nossa plataforma SaaS multitenant.
            </motion.p>

                        <motion.div 
              variants={fadeInUp}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
            >
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-lg px-8 py-4 shadow-lg hover:shadow-xl transition-all duration-300"
                  onClick={() => navigate("/signup")}
                >
                  Começar Teste Grátis
                  <motion.div
                    animate={{ x: [0, 3, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </motion.div>
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
              <Button 
                size="lg" 
                variant="outline" 
                  className="text-lg px-8 py-4 border-2 hover:bg-slate-50 transition-all duration-300"
                onClick={() => navigate("/demo")}
              >
                <Play className="mr-2 h-5 w-5" />
                Ver Demonstração
              </Button>
              </motion.div>
            </motion.div>

            <motion.div 
              variants={fadeInUp}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-sm text-slate-500"
            >
              {[
                "Teste grátis por 14 dias",
                "Sem cartão de crédito", 
                "Cancele quando quiser"
              ].map((text, index) => (
                <motion.div 
                  key={text}
                  initial={{ opacity: 0, y: 10 }}
                  animate={heroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                  transition={{ delay: index * 0.1 + 0.8, duration: 0.6, ease: "easeOut" }}
                  className="flex items-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={heroInView ? { scale: 1 } : { scale: 0 }}
                    transition={{ delay: index * 0.1 + 1, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                  >
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                  </motion.div>
                  {text}
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Stats Section */}
      <motion.section 
        className="py-16 bg-white relative overflow-hidden scroll-snap-align-center"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
                whileHover={{ scale: 1.02, y: -2 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="text-center group cursor-pointer"
              >
                <motion.div 
                  className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-2 group-hover:text-green-600 transition-colors duration-300"
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  transition={{ delay: index * 0.1, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                >
                  {stat.number}
                </motion.div>
                <motion.div 
                  className="text-slate-600 group-hover:text-slate-800 transition-colors duration-300"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ delay: index * 0.1 + 0.2 }}
                >
                  {stat.label}
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.section 
        id="features" 
        ref={featuresRef}
        className="py-20 bg-slate-50 relative overflow-hidden scroll-snap-align-center min-h-screen flex items-center"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <motion.h2 
              className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-4"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              Tudo que você precisa em uma plataforma
            </motion.h2>
            <motion.p 
              className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
            >
              Recursos poderosos para transformar seu negócio e aumentar suas vendas
            </motion.p>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                whileHover={{ y: -5, scale: 1.01 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="group"
              >
                <Card className="bg-white border-0 shadow-lg hover:shadow-2xl transition-all duration-500 h-full group-hover:border-green-200">
                  <CardContent className="p-6 h-full flex flex-col">
                    <motion.div 
                      className="h-12 w-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center mb-4 group-hover:from-green-600 group-hover:to-green-700 transition-all duration-300"
                      whileHover={{ rotate: 180 }}
                      transition={{ duration: 0.8, ease: "easeInOut" }}
                    >
                    <feature.icon className="h-6 w-6 text-white" />
                    </motion.div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-2 group-hover:text-green-600 transition-colors duration-300">
                    {feature.title}
                  </h3>
                    <p className="text-slate-600 flex-grow">
                    {feature.description}
                  </p>
                    <motion.div
                      className="mt-4 h-1 bg-gradient-to-r from-green-500 to-green-600 rounded-full w-0 group-hover:w-full transition-all duration-500"
                      initial={{ width: 0 }}
                      whileHover={{ width: "100%" }}
                    />
                </CardContent>
              </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Pricing Section */}
      <motion.section 
        id="pricing" 
        ref={pricingRef}
        className="py-24 bg-gradient-to-br from-slate-50 via-white to-slate-100 relative overflow-hidden scroll-snap-align-center min-h-screen flex items-center"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        {/* Background decoration */}
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-r from-green-400/20 to-blue-400/20 rounded-full blur-3xl -z-10" />
        
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
              Planos com 14 dias grátis
            </motion.div>
            
            <motion.h2 
              className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent mb-6"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
            >
              Escolha seu plano ideal
            </motion.h2>
            <motion.p 
              className="text-xl md:text-2xl text-slate-600 max-w-4xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
            >
              Comece grátis hoje e escale conforme seu negócio cresce. 
              <span className="font-semibold text-slate-800"> Sem compromisso, sem cartão de crédito.</span>
            </motion.p>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {plans.map((plan, index) => (
              <motion.div
                key={index}
                variants={scaleIn}
                whileHover={{ y: -5, scale: plan.popular ? 1.02 : 1.01 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="group relative"
              >
                {/* Card Container */}
                <div className={`relative bg-white rounded-2xl shadow-lg border-2 transition-all duration-500 hover:shadow-2xl h-full overflow-hidden flex flex-col ${
                  plan.popular 
                    ? 'border-green-500 shadow-green-100/50' 
                    : 'border-slate-200 group-hover:border-green-300 group-hover:shadow-green-50/50'
                }`}>
                  
                  {/* Popular Badge */}
                  {plan.popular && (
                    <motion.div 
                      className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10"
                      initial={{ scale: 0, rotate: -90 }}
                      whileInView={{ scale: 1, rotate: 0 }}
                      transition={{ delay: index * 0.2 + 0.5, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                      viewport={{ once: true }}
                    >
                      <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-1">
                        Mais Popular
                      </Badge>
                    </motion.div>
                  )}

                  {/* Gradient Background */}
                  <div className={`absolute inset-0 bg-gradient-to-br opacity-5 ${
                    plan.popular 
                      ? 'from-green-500 to-emerald-600' 
                      : 'from-slate-500 to-slate-600'
                  }`} />

                  {/* Header */}
                  <div className="relative p-6 pb-4">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 + 0.3 }}
                      viewport={{ once: true }}
                    >
                      <h3 className={`text-xl font-bold mb-2 transition-colors duration-300 ${
                        plan.popular ? 'text-green-700' : 'text-slate-900 group-hover:text-green-600'
                      }`}>
                        {plan.name}
                      </h3>
                      
                      <motion.div 
                        className="mb-3"
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        transition={{ delay: index * 0.1 + 0.5, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                        viewport={{ once: true }}
                      >
                        <div className="flex items-baseline">
                          <span className={`text-4xl font-bold ${
                            plan.popular ? 'text-green-600' : 'text-slate-900'
                          }`}>
                            {plan.price}
                          </span>
                          <span className="text-slate-500 ml-2">{plan.period}</span>
                        </div>
                      </motion.div>
                      
                      <p className="text-slate-600 leading-relaxed">{plan.description}</p>
                    </motion.div>
                  </div>

                  {/* Features - Flex grow to push button to bottom */}
                  <div className="px-6 pb-6 flex-1">
                    <ul className="space-y-3">
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
                            className="flex-shrink-0 mt-0.5"
                          >
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                              plan.popular ? 'bg-green-100' : 'bg-slate-100 group-hover/item:bg-green-100'
                            } transition-colors duration-300`}>
                              <Check className={`w-3 h-3 ${
                                plan.popular ? 'text-green-600' : 'text-slate-600 group-hover/item:text-green-600'
                              } transition-colors duration-300`} />
                            </div>
                          </motion.div>
                          <span className="text-slate-700 ml-3 leading-relaxed text-sm">{feature}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </div>

                  {/* CTA Button - Always at bottom */}
                  <div className="p-6 pt-0 mt-auto">
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
                          className={`w-full h-12 font-semibold rounded-xl transition-all duration-300 ${
                            plan.popular 
                              ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-green-200/50' 
                              : 'bg-slate-900 hover:bg-slate-800 text-white shadow-lg hover:shadow-slate-200/50 group-hover:bg-green-600 group-hover:shadow-green-200/50'
                          }`}
                          onClick={() => navigate("/signup")}
                        >
                          <span className="flex items-center justify-center">
                            {plan.cta}
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </span>
                        </Button>
                      </motion.div>
                      
                      {/* Additional info */}
                      <motion.p 
                        className="text-center text-sm text-slate-500 mt-4"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        transition={{ delay: index * 0.1 + 1.2 }}
                        viewport={{ once: true }}
                      >
                        {plan.name === 'Starter' && 'Cancele a qualquer momento'}
                        {plan.name === 'Professional' && '14 dias grátis, depois R$ 197/mês'}
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
        className="py-20 bg-slate-50 relative overflow-hidden scroll-snap-align-center min-h-screen flex items-center"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <motion.h2 
              className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-4"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              O que nossos clientes dizem
            </motion.h2>
            <motion.p 
              className="text-lg md:text-xl text-slate-600"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
            >
              Mais de 10.000 empresas confiam no KontrollaPro
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
                whileHover={{ y: -5, scale: 1.01 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="group"
              >
                <Card className="bg-white border-0 shadow-lg hover:shadow-2xl transition-all duration-500 h-full group-hover:border-green-200">
                  <CardContent className="p-6 h-full flex flex-col">
                    <motion.div 
                      className="flex items-center mb-4"
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
                    
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 + 0.4, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                      viewport={{ once: true }}
                    >
                  <Quote className="h-8 w-8 text-green-500 mb-4" />
                    </motion.div>
                    
                    <motion.p 
                      className="text-slate-600 mb-6 italic flex-grow"
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 + 0.6 }}
                      viewport={{ once: true }}
                    >
                    "{testimonial.content}"
                    </motion.p>
                    
                    <motion.div 
                      className="flex items-center"
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 + 0.8 }}
                      viewport={{ once: true }}
                    >
                      <motion.div 
                        className="h-10 w-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mr-3"
                        whileHover={{ rotate: 180 }}
                        transition={{ duration: 0.8, ease: "easeInOut" }}
                      >
                      <span className="text-white font-semibold text-sm">
                        {testimonial.avatar}
                      </span>
                      </motion.div>
                    <div>
                        <div className="font-semibold text-slate-900 group-hover:text-green-600 transition-colors duration-300">
                        {testimonial.name}
                      </div>
                      <div className="text-sm text-slate-600">
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
        className="py-20 bg-gradient-to-r from-green-500 to-green-600 relative overflow-hidden scroll-snap-align-center min-h-screen flex items-center"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        {/* Background Animation */}
        <motion.div
          className="absolute inset-0"
          animate={{
            background: [
              "radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.05) 0%, transparent 50%)",
              "radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.05) 0%, transparent 50%)",
              "radial-gradient(circle at 40% 80%, rgba(255, 255, 255, 0.05) 0%, transparent 50%)",
            ]
          }}
          transition={{ duration: 12, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
        />
        
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.h2 
            className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            Pronto para transformar seu negócio?
          </motion.h2>
          <motion.p 
            className="text-lg md:text-xl text-green-100 mb-8"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            Junte-se a mais de 10.000 empresas que já usam o KontrollaPro
          </motion.p>
          
          <motion.div 
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
          >
                        <div className="flex w-full sm:w-auto max-w-md">
              <motion.div
                whileHover={{ scale: 1.01 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="flex-1"
              >
                <Input
                  type="email"
                  placeholder="Seu melhor email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-r-none border-green-300 focus:border-green-200 h-12"
                />
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
              <Button 
                  className="rounded-l-none bg-white text-green-600 hover:bg-green-50 border border-green-300 h-12 px-6"
                onClick={() => navigate("/signup")}
              >
                Começar Grátis
              </Button>
              </motion.div>
            </div>
          </motion.div>
          
          <motion.p 
            className="text-green-100 text-sm"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            viewport={{ once: true }}
          >
            Teste grátis por 14 dias • Sem cartão de crédito • Cancele quando quiser
          </motion.p>
        </div>
      </motion.section>

      {/* Footer */}
      <motion.footer 
        className="bg-slate-900 text-white py-16 relative overflow-hidden"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="grid md:grid-cols-4 gap-8"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            <motion.div variants={fadeInUp}>
              <motion.div 
                className="flex items-center space-x-3 mb-4"
                whileHover={{ scale: 1.05 }}
              >
                <img 
                  src="/logo.png" 
                  alt="KontrollaPro Logo" 
                  className="h-8 w-8 rounded-lg"
                />
                <span className="text-xl font-bold">KontrollaPro</span>
              </motion.div>
              <p className="text-slate-400 mb-4 leading-relaxed">
                A plataforma completa para gestão de negócios. 
                Transforme sua empresa com tecnologia.
              </p>
              <div className="flex space-x-4">
                {[
                  { icon: Globe, href: "#" },
                  { icon: Smartphone, href: "#" }
                ].map((social, index) => (
                  <motion.a 
                    key={index}
                    href={social.href} 
                    className="text-slate-400 hover:text-white transition-colors"
                    whileHover={{ scale: 1.1, rotate: 2 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                  >
                    <social.icon className="h-5 w-5" />
                  </motion.a>
                ))}
              </div>
            </motion.div>

            {[
              {
                title: "Produto",
                links: ["Recursos", "Preços", "API", "Integrações"]
              },
              {
                title: "Suporte",
                links: ["Central de Ajuda", "Documentação", "Status", "Contato"]
              },
              {
                title: "Empresa",
                links: ["Sobre", "Blog", "Carreiras", "Privacidade"]
              }
            ].map((section, index) => (
              <motion.div key={section.title} variants={fadeInUp}>
                <h3 className="font-semibold mb-4 text-lg">{section.title}</h3>
                <ul className="space-y-3 text-slate-400">
                  {section.links.map((link, linkIndex) => (
                    <motion.li 
                      key={link}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 + linkIndex * 0.05 }}
                      viewport={{ once: true }}
                    >
                      <motion.a 
                        href="#" 
                        className="hover:text-white transition-colors block"
                        whileHover={{ x: 2 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                      >
                        {link}
                      </motion.a>
                    </motion.li>
                  ))}
              </ul>
              </motion.div>
            ))}
          </motion.div>

          <motion.div 
            className="border-t border-slate-800 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <p className="text-slate-400 text-sm">
              © 2024 KontrollaPro. Todos os direitos reservados.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              {["Termos de Uso", "Política de Privacidade", "Cookies"].map((link, index) => (
                <motion.a 
                  key={link}
                  href="#" 
                  className="text-slate-400 hover:text-white text-sm transition-colors"
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
        className="fixed bottom-8 right-8 z-50 bg-green-500 hover:bg-green-600 text-white p-3 rounded-full shadow-lg transition-colors"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ 
          opacity: scrollYProgress.get() > 0.1 ? 1 : 0,
          scale: scrollYProgress.get() > 0.1 ? 1 : 0
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <motion.div
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <ArrowRight className="h-5 w-5 rotate-[-90deg]" />
        </motion.div>
      </motion.button>
    </div>
  );
}
