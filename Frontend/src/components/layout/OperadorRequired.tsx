import { useState } from "react";
import { User, Crown, Shield, ShoppingBag, ArrowRight, Sparkles, CheckCircle, X, ChevronLeft, LogOut, Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { useAdministradores } from "@/hooks/useAdministradores";
import { useOperador } from "@/contexts/OperadorContext";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions, Permissions } from "@/hooks/usePermissions";

/**
 * Componente exibido quando não há operador selecionado
 */
export function OperadorRequired() {
  const { administradores, loading, criarCodigo } = useAdministradores();
  const { setOperadorSelecionado } = useOperador();
  const { logout } = useAuth();
  const { permissions } = usePermissions();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [showPermissions, setShowPermissions] = useState(false);
  const [operadorEmCodigo, setOperadorEmCodigo] = useState<number | null>(null);
  const [accessCode, setAccessCode] = useState("");
  const [accessCodeError, setAccessCodeError] = useState("");
  const [criandoCodigo, setCriandoCodigo] = useState(false);
  const [novoCodigo, setNovoCodigo] = useState("");
  const [codigoCriado, setCodigoCriado] = useState<string | null>(null);

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

  const slideIn = {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }
  };

  // Filtrar operadores por role
  const getOperadoresByRole = (role: string) => {
    return administradores.filter(adm => adm.role === role && adm.status === 'ativo');
  };

  // Função para ativar modo de código no card do operador
  const handleOperadorClick = (operador: any) => {
    setOperadorEmCodigo(operador.id);
    setAccessCode("");
    setAccessCodeError("");
    setNovoCodigo("");
    setCodigoCriado(null);
  };

  // Função para validar e selecionar operador
  const handleAccessCodeSubmit = (operador: any) => {
    if (!accessCode.trim()) {
      setAccessCodeError("Código de acesso é obrigatório");
      return;
    }

    // Validar o código de acesso contra o código do operador selecionado
    if (accessCode === operador.codigo) {
      setOperadorSelecionado(operador.id);
      setSelectedRole(null);
      setOperadorEmCodigo(null);
      setAccessCode("");
      setAccessCodeError("");
    } else {
      setAccessCodeError("Código de acesso inválido");
    }
  };

  // Função para criar código personalizado para administrador
  const handleCriarCodigo = async (operador: any) => {
    if (!novoCodigo.trim()) {
      setAccessCodeError("Código é obrigatório");
      return;
    }

    if (novoCodigo.length < 4 || novoCodigo.length > 20) {
      setAccessCodeError("Código deve ter entre 4 e 20 caracteres");
      return;
    }

    try {
      setCriandoCodigo(true);
      setAccessCodeError("");
      
      const response = await criarCodigo(operador.id, novoCodigo);
      setCodigoCriado(novoCodigo);
      
      // Após criar o código, automaticamente selecionar o operador
      setTimeout(() => {
        setOperadorSelecionado(operador.id);
        setOperadorEmCodigo(null);
        setCodigoCriado(null);
        setNovoCodigo("");
      }, 2000); // Aguardar 2 segundos para mostrar o código criado
      
    } catch (error: any) {
      setAccessCodeError(error.response?.data?.error || 'Erro ao criar código');
    } finally {
      setCriandoCodigo(false);
    }
  };

  // Função para cancelar modo de código
  const handleCancelarCodigo = () => {
    setOperadorEmCodigo(null);
    setAccessCode("");
    setAccessCodeError("");
    setNovoCodigo("");
    setCodigoCriado(null);
  };

  // Função para voltar à seleção de roles
  const handleBackToRoles = () => {
    setSelectedRole(null);
  };

  // Função para renderizar as permissões do operador
  const renderPermissions = () => {
    if (!permissions || Object.keys(permissions).length === 0) {
      return null;
    }

    const permissionGroups = {
      'Dashboard e Relatórios': ['dashboard', 'relatorios'],
      'Clientes': ['clientes', 'clientes_criar', 'clientes_editar', 'clientes_excluir'],
      'Produtos': ['produtos', 'produtos_criar', 'produtos_editar', 'produtos_excluir', 'catalogo'],
      'Fornecedores': ['fornecedores', 'fornecedores_criar', 'fornecedores_editar', 'fornecedores_excluir'],
      'Funcionários': ['funcionarios', 'funcionarios_criar', 'funcionarios_editar', 'funcionarios_excluir'],
      'Vendas': ['vendas', 'vendas_criar', 'vendas_editar', 'vendas_cancelar', 'vendas_devolver'],
      'Financeiro': ['financeiro', 'contas_receber', 'contas_pagar', 'transacoes', 'pagamentos'],
      'NF-e': ['nfe', 'nfe_emitir', 'nfe_cancelar'],
      'Configurações': ['configuracoes', 'configuracoes_gerais', 'configuracoes_pagamentos', 'configuracoes_administradores']
    };

    return (
      <motion.div
        variants={fadeInUp}
        className="mt-6 sm:mt-8 p-4 sm:p-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 sm:mb-4 space-y-2 sm:space-y-0">
          <h3 className="text-base sm:text-lg font-semibold text-white">Permissões do Operador</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPermissions(!showPermissions)}
            className="text-white hover:bg-white/10 text-xs sm:text-sm h-7 sm:h-8"
          >
            {showPermissions ? <EyeOff className="h-3 w-3 sm:h-4 sm:w-4 mr-1" /> : <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />}
            {showPermissions ? 'Ocultar' : 'Mostrar'}
          </Button>
        </div>
        
        {showPermissions && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3 sm:space-y-4"
          >
            {Object.entries(permissionGroups).map(([groupName, groupPermissions]) => {
              const hasAnyPermission = groupPermissions.some(perm => permissions[perm as keyof Permissions]);
              if (!hasAnyPermission) return null;

              return (
                <div key={groupName} className="space-y-1.5 sm:space-y-2">
                  <h4 className="text-xs sm:text-sm font-medium text-slate-300">{groupName}</h4>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {groupPermissions.map(permission => {
                      const hasPermission = permissions[permission as keyof Permissions];
                      if (!hasPermission) return null;

                      return (
                        <Badge
                          key={permission}
                          variant="secondary"
                          className="bg-green-500/20 text-green-400 border-green-500/30 text-xs"
                        >
                          {permission.replace(/_/g, ' ')}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}
      </motion.div>
    );
  };

  const operatorTypes = [
    {
      icon: Crown,
      title: "Administrador",
      description: "Acesso completo ao sistema",
      color: "from-red-500 to-red-600",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/20"
    },
    {
      icon: Shield,
      title: "Gerente",
      description: "Gestão de equipes e relatórios",
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20"
    },
    {
      icon: ShoppingBag,
      title: "Vendedor",
      description: "Foco em vendas e clientes",
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/20"
    }
  ];

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-start sm:justify-center overflow-y-auto bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1920&h=1080&fit=crop&crop=center')] bg-cover bg-center opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-800/80 to-slate-900/90" />
        
        {/* Animated Grid */}
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
        
        {/* Floating Elements */}
        <motion.div
          className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl hidden sm:block"
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-96 h-96 bg-green-500/10 rounded-full blur-3xl hidden sm:block"
          animate={{
            x: [0, -100, 0],
            y: [0, 50, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        />
          </div>

      <div className="relative z-10 w-full max-w-6xl px-3 sm:px-6 py-4 sm:py-6">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {/* Header */}
          <motion.div 
            className="text-center mb-6 sm:mb-8 md:mb-12"
            variants={fadeInUp}
          >
            <motion.div
              className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 text-xs sm:text-sm font-medium mb-3 sm:mb-4 md:mb-6"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
              <span className="hidden sm:inline">Seleção de Operador</span>
              <span className="sm:hidden">Seleção</span>
            </motion.div>
            
            <motion.div 
              className="mx-auto mb-3 sm:mb-4 md:mb-6 flex h-14 w-14 sm:h-16 sm:w-16 md:h-20 md:w-20 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm border border-white/20 shadow-2xl"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ duration: 0.3 }}
            >
              <User className="h-7 w-7 sm:h-8 sm:w-8 md:h-10 md:w-10 text-white" />
            </motion.div>
            
            <motion.h1 
              className="text-xl sm:text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-2 sm:mb-3 md:mb-4"
              variants={fadeInUp}
            >
              Selecione um Operador
            </motion.h1>
            
            <motion.p 
              className="text-xs sm:text-sm md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed px-2 sm:px-0"
              variants={fadeInUp}
            >
            Para acessar o sistema, você precisa selecionar um operador no cabeçalho.
              Cada operador possui permissões específicas para diferentes funcionalidades.
            </motion.p>
          </motion.div>

          {/* Operator Cards ou Lista de Operadores */}
          {!selectedRole ? (
            <motion.div 
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6 lg:gap-8 mb-6 sm:mb-8 md:mb-12"
              variants={staggerContainer}
            >
              {operatorTypes.map((operator, index) => {
                const operadoresDisponiveis = getOperadoresByRole(operator.title.toLowerCase());
                const roleKey = operator.title.toLowerCase();
                
                return (
                  <motion.div
                    key={operator.title}
                    variants={scaleIn}
                    whileHover={{ y: -4, scale: 1.02 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="group cursor-pointer"
                    onClick={() => setSelectedRole(roleKey)}
                  >
                    <Card className="bg-white/10 backdrop-blur-sm border border-white/20 shadow-2xl hover:shadow-3xl transition-all duration-500 h-full overflow-hidden group-hover:border-green-400/50">
                      <CardContent className="p-3 sm:p-4 md:p-6 lg:p-8 text-center h-full flex flex-col">
                        <motion.div 
                          className={`w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 bg-gradient-to-br ${operator.color} rounded-lg sm:rounded-xl md:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 md:mb-6 group-hover:scale-110 transition-all duration-300`}
                          whileHover={{ rotate: 180 }}
                          transition={{ duration: 0.8, ease: "easeInOut" }}
                        >
                          <operator.icon className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 lg:h-8 lg:w-8 text-white" />
                        </motion.div>
                        
                        <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-white mb-1 sm:mb-2 md:mb-3 group-hover:text-green-400 transition-colors duration-300">
                          {operator.title}
                        </h3>
                        
                        <p className="text-slate-300 leading-relaxed text-xs sm:text-sm md:text-base lg:text-lg mb-3 sm:mb-4 md:mb-6 flex-grow">
                          {operator.description}
                        </p>
                        
                        <motion.div
                          className={`inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-full ${operator.bgColor} ${operator.borderColor} border text-xs sm:text-sm font-medium text-white`}
                          whileHover={{ x: 5 }}
                        >
                          <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                          <span className="hidden sm:inline">{operadoresDisponiveis.length} Disponível{operadoresDisponiveis.length !== 1 ? 's' : ''}</span>
                          <span className="sm:hidden">{operadoresDisponiveis.length}</span>
                        </motion.div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <motion.div
              variants={slideIn}
              initial="initial"
              animate="animate"
              className="max-w-4xl mx-auto"
            >
              {/* Header da lista de operadores */}
              <motion.div 
                className="flex flex-col sm:flex-row items-center justify-between mb-4 sm:mb-6 md:mb-8 space-y-3 sm:space-y-0"
                variants={fadeInUp}
              >
                <Button
                  variant="ghost"
                  onClick={handleBackToRoles}
                  className="text-white hover:bg-white/10 flex items-center gap-2 text-xs sm:text-sm md:text-base order-1 sm:order-1"
                >
                  <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Voltar</span>
                  <span className="sm:hidden">Voltar</span>
                </Button>
                
                <div className="text-center order-2 sm:order-2">
                  <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white mb-1 sm:mb-2">
                    {operatorTypes.find(op => op.title.toLowerCase() === selectedRole)?.title}s Disponíveis
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300">
                    Selecione um operador para continuar
                  </p>
              </div>
                
                <div className="w-0 sm:w-20 order-3 sm:order-3"></div> {/* Spacer para centralizar */}
              </motion.div>

              {/* Lista de operadores */}
              <motion.div 
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6"
                variants={staggerContainer}
              >
                {getOperadoresByRole(selectedRole).map((operador, index) => (
                  <motion.div
                    key={operador.id}
                    variants={scaleIn}
                    whileHover={{ y: -2, scale: 1.01 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="group"
                  >
                    <Card className={`bg-white/10 backdrop-blur-sm border shadow-xl hover:shadow-2xl transition-all duration-300 h-full ${
                      operadorEmCodigo === operador.id 
                        ? 'border-green-400/50' 
                        : 'border-white/20 group-hover:border-green-400/50'
                    }`}>
                      <CardContent className="p-3 sm:p-4 md:p-6 text-center h-full flex flex-col">
                        <motion.div 
                          className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-md sm:rounded-lg md:rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3 md:mb-4 group-hover:scale-110 transition-all duration-300"
                          whileHover={{ rotate: 180 }}
                          transition={{ duration: 0.8, ease: "easeInOut" }}
                        >
                          <User className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-white" />
                        </motion.div>
                        
                        <h3 className="text-sm sm:text-base md:text-lg font-bold text-white mb-1 sm:mb-2 group-hover:text-green-400 transition-colors duration-300 truncate">
                          {operador.nome} {operador.sobrenome}
                        </h3>

                        {operadorEmCodigo === operador.id ? (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-1.5 sm:space-y-2 md:space-y-3 mt-auto"
                          >
                            {/* Verificar se o operador tem código */}
                            {!operador.codigo || operador.codigo === null || operador.codigo.trim() === '' ? (
                              // Interface para criar código personalizado
                              <div className="space-y-2 sm:space-y-3">
                                <div className="text-center">
                                  <p className="text-xs sm:text-sm text-slate-300 mb-1.5 sm:mb-2">
                                    Olá <span className="text-green-400 font-semibold">{operador.nome}</span>, seja bem vindo ao sistema! Crie seu código de acesso para continuar.
                                  </p>
                                  
                                  {codigoCriado ? (
                                    <div className="space-y-2">
                                      <div className="p-2 sm:p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
                                        <p className="text-xs sm:text-sm text-green-400 font-mono text-center">
                                          Código criado: {codigoCriado}
                                        </p>
                                      </div>
                                      <p className="text-xs text-slate-400">
                                        Selecionando operador automaticamente...
                                      </p>
                                    </div>
                                  ) : (
                                    <div className="space-y-2 sm:space-y-3">
                                      <p className="text-xs sm:text-sm text-slate-300 mb-1.5 sm:mb-2">
                                        Crie seu código de acesso (mínimo 5 caracteres)
                                      </p>
                                      <div className="relative">
                                        <Input
                                          type="text"
                                          placeholder="Digite seu código"
                                          value={novoCodigo}
                                          onChange={(e) => {
                                            setNovoCodigo(e.target.value);
                                            setAccessCodeError("");
                                          }}
                                          className="h-7 sm:h-8 md:h-10 bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-blue-400 focus:ring-blue-400 text-center text-xs sm:text-sm"
                                          maxLength={20}
                                          autoComplete="off"
                                          autoCorrect="off"
                                          autoCapitalize="off"
                                          spellCheck="false"
                                          data-form-type="other"
                                          data-lpignore="true"
                                        />
                                      </div>
                                      <Button
                                        onClick={() => handleCriarCodigo(operador)}
                                        disabled={criandoCodigo || !novoCodigo.trim() || novoCodigo.trim().length < 5}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs h-6 sm:h-7 md:h-8"
                                      >
                                        {criandoCodigo ? (
                                          <>
                                            <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white mr-1 sm:mr-2"></div>
                                            <span className="hidden sm:inline">Criando...</span>
                                            <span className="sm:hidden">Criando...</span>
                                          </>
                                        ) : (
                                          <>
                                            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                            <span className="hidden sm:inline">Criar Código</span>
                                            <span className="sm:hidden">Criar</span>
                                          </>
                                        )}
                                      </Button>
                                    </div>
                                  )}
                                </div>
                                
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={handleCancelarCodigo}
                                  className="w-full bg-slate-700 border-slate-600 text-white hover:bg-slate-600 text-xs h-6 sm:h-7 md:h-8"
                                >
                                  <span className="hidden sm:inline">Cancelar</span>
                                  <span className="sm:hidden">Cancelar</span>
                                </Button>
                                
                                {accessCodeError && (
                                  <p className="text-xs text-red-400 flex items-center justify-center gap-1">
                                    <X className="h-3 w-3" />
                                    {accessCodeError}
                                  </p>
                                )}
                              </div>
                            ) : (
                              // Interface para digitar código (código existente)
                              <div className="space-y-2 sm:space-y-3">
                                <div className="text-center">
                                  <p className="text-xs sm:text-sm text-slate-300 mb-1.5 sm:mb-2">
                                    Digite o código de acesso
                                  </p>
                                  <div className="relative">
                                     <Input
                                       type="text"
                                       placeholder="Código de acesso"
                                       value={accessCode}
                                       onChange={(e) => {
                                         setAccessCode(e.target.value);
                                         setAccessCodeError("");
                                       }}
                                       className="h-7 sm:h-8 md:h-10 bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-green-400 focus:ring-green-400 text-center text-xs sm:text-sm"
                                       onKeyDown={(e) => {
                                         if (e.key === "Enter") {
                                           handleAccessCodeSubmit(operador);
                                         }
                                       }}
                                       autoComplete="off"
                                       autoCorrect="off"
                                       autoCapitalize="off"
                                       spellCheck="false"
                                       data-form-type="other"
                                       data-lpignore="true"
                                     />
                                  </div>
                                  {accessCodeError && (
                                    <p className="text-xs text-red-400 flex items-center justify-center gap-1 mt-1">
                                      <X className="h-3 w-3" />
                                      {accessCodeError}
                                    </p>
                                  )}
                                </div>
                                
                                <div className="flex gap-1 sm:gap-1.5 md:gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleCancelarCodigo}
                                    className="flex-1 bg-slate-700 border-slate-600 text-white hover:bg-slate-600 text-xs h-6 sm:h-7 md:h-8"
                                  >
                                    <span className="hidden sm:inline">Cancelar</span>
                                    <span className="sm:hidden">Cancelar</span>
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => handleAccessCodeSubmit(operador)}
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs h-6 sm:h-7 md:h-8"
                                    disabled={!accessCode.trim()}
                                  >
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    <span className="hidden sm:inline">Confirmar</span>
                                    <span className="sm:hidden">OK</span>
                                  </Button>
                                </div>
                              </div>
                            )}
                          </motion.div>
                        ) : (
                          <motion.div
                            className="space-y-1.5 sm:space-y-2 md:space-y-3 mt-auto"
                          >
                            <div className="text-center">
                              <p className="text-xs sm:text-sm text-slate-300 mb-1.5 sm:mb-2">
                                Clique para selecionar
                              </p>
                              <motion.div
                                className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 md:py-2.5 rounded-lg bg-green-500/20 border border-green-500/30 text-xs sm:text-sm font-medium text-green-400 cursor-pointer w-full justify-center"
                                whileHover={{ x: 5 }}
                                onClick={() => handleOperadorClick(operador)}
                              >
                                <ArrowRight className="w-3 h-3 sm:w-4 sm:w-4 mr-1.5 sm:mr-2" />
                                <span className="hidden sm:inline">Selecionar Operador</span>
                                <span className="sm:hidden">Selecionar</span>
                              </motion.div>
                            </div>
                          </motion.div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>

              {/* Mensagem se não houver operadores */}
              {getOperadoresByRole(selectedRole).length === 0 && (
                <motion.div
                  variants={fadeInUp}
                  className="text-center py-6 sm:py-8 md:py-12"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 bg-slate-500/20 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 md:mb-4">
                    <User className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-slate-400" />
                  </div>
                  <h3 className="text-base sm:text-lg md:text-xl font-semibold text-white mb-1 sm:mb-2">
                    Nenhum operador disponível
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300">
                    Não há operadores ativos para este tipo de função.
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Permissões do operador selecionado */}
          {!selectedRole && renderPermissions()}

          {/* Botão de Logout - Posicionado abaixo dos cards */}
          {!selectedRole && (
            <motion.div 
              className="text-center mt-4 sm:mt-6 md:mt-8"
              variants={fadeInUp}
            >
              <Button
                variant="outline"
                size="lg"
                onClick={logout}
                className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-red-500/20 hover:border-red-500/50 hover:text-red-400 transition-all duration-300 px-4 sm:px-6 md:px-8 py-1.5 sm:py-2 md:py-3 text-xs sm:text-sm md:text-base"
              >
                <LogOut className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 mr-1 sm:mr-1.5 md:mr-2" />
                Logout
              </Button>
            </motion.div>
          )}

        </motion.div>
      </div>

    </div>
  );
}
