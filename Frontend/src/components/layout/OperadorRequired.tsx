import { useState } from "react";
import { User, Crown, Shield, ShoppingBag, ArrowRight, Sparkles, CheckCircle, X, ChevronLeft, LogOut } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useAdministradores } from "@/hooks/useAdministradores";
import { useOperador } from "@/contexts/OperadorContext";
import { useAuth } from "@/hooks/useAuth";

/**
 * Componente exibido quando não há operador selecionado
 */
export function OperadorRequired() {
  const { administradores, loading } = useAdministradores();
  const { setOperadorSelecionado } = useOperador();
  const { logout } = useAuth();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

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

  // Função para selecionar operador
  const handleSelectOperador = (operadorId: number) => {
    setOperadorSelecionado(operadorId);
    setSelectedRole(null);
  };

  // Função para voltar à seleção de roles
  const handleBackToRoles = () => {
    setSelectedRole(null);
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
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
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

      <div className="relative z-10 w-full max-w-6xl px-6">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {/* Header */}
          <motion.div 
            className="text-center mb-12"
            variants={fadeInUp}
          >
            <motion.div
              className="inline-flex items-center px-4 py-2 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 text-sm font-medium mb-6"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Seleção de Operador
            </motion.div>
            
            <motion.div 
              className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm border border-white/20 shadow-2xl"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ duration: 0.3 }}
            >
              <User className="h-10 w-10 text-white" />
            </motion.div>
            
            <motion.h1 
              className="text-4xl md:text-5xl font-bold text-white mb-4"
              variants={fadeInUp}
            >
              Selecione um Operador
            </motion.h1>
            
            <motion.p 
              className="text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed"
              variants={fadeInUp}
            >
            Para acessar o sistema, você precisa selecionar um operador no cabeçalho.
              Cada operador possui permissões específicas para diferentes funcionalidades.
            </motion.p>
          </motion.div>

          {/* Operator Cards ou Lista de Operadores */}
          {!selectedRole ? (
            <motion.div 
              className="grid md:grid-cols-3 gap-8 mb-12"
              variants={staggerContainer}
            >
              {operatorTypes.map((operator, index) => {
                const operadoresDisponiveis = getOperadoresByRole(operator.title.toLowerCase());
                const roleKey = operator.title.toLowerCase();
                
                return (
                  <motion.div
                    key={operator.title}
                    variants={scaleIn}
                    whileHover={{ y: -8, scale: 1.02 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="group cursor-pointer"
                    onClick={() => setSelectedRole(roleKey)}
                  >
                    <Card className="bg-white/10 backdrop-blur-sm border border-white/20 shadow-2xl hover:shadow-3xl transition-all duration-500 h-full overflow-hidden group-hover:border-green-400/50">
                      <CardContent className="p-8 text-center h-full flex flex-col">
                        <motion.div 
                          className={`w-16 h-16 bg-gradient-to-br ${operator.color} rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-all duration-300`}
                          whileHover={{ rotate: 180 }}
                          transition={{ duration: 0.8, ease: "easeInOut" }}
                        >
                          <operator.icon className="h-8 w-8 text-white" />
                        </motion.div>
                        
                        <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-green-400 transition-colors duration-300">
                          {operator.title}
                        </h3>
                        
                        <p className="text-slate-300 leading-relaxed text-lg mb-6 flex-grow">
                          {operator.description}
                        </p>
                        
                        <motion.div
                          className={`inline-flex items-center px-4 py-2 rounded-full ${operator.bgColor} ${operator.borderColor} border text-sm font-medium text-white`}
                          whileHover={{ x: 5 }}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          {operadoresDisponiveis.length} Disponível{operadoresDisponiveis.length !== 1 ? 's' : ''}
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
                className="flex items-center justify-between mb-8"
                variants={fadeInUp}
              >
                <Button
                  variant="ghost"
                  onClick={handleBackToRoles}
                  className="text-white hover:bg-white/10 flex items-center gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Voltar
                </Button>
                
                <div className="text-center">
                  <h2 className="text-3xl font-bold text-white mb-2">
                    {operatorTypes.find(op => op.title.toLowerCase() === selectedRole)?.title}s Disponíveis
                  </h2>
                  <p className="text-slate-300">
                    Selecione um operador para continuar
                  </p>
              </div>
                
                <div className="w-20"></div> {/* Spacer para centralizar */}
              </motion.div>

              {/* Lista de operadores */}
              <motion.div 
                className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
                variants={staggerContainer}
              >
                {getOperadoresByRole(selectedRole).map((operador, index) => (
                  <motion.div
                    key={operador.id}
                    variants={scaleIn}
                    whileHover={{ y: -4, scale: 1.02 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="group cursor-pointer"
                    onClick={() => handleSelectOperador(operador.id)}
                  >
                    <Card className="bg-white/10 backdrop-blur-sm border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 h-full group-hover:border-green-400/50">
                      <CardContent className="p-6 text-center h-full flex flex-col">
                        <motion.div 
                          className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-all duration-300"
                          whileHover={{ rotate: 180 }}
                          transition={{ duration: 0.8, ease: "easeInOut" }}
                        >
                          <User className="h-6 w-6 text-white" />
                        </motion.div>
                        
                        <h3 className="text-lg font-bold text-white mb-2 group-hover:text-green-400 transition-colors duration-300">
                          {operador.nome} {operador.sobrenome}
                        </h3>
                        
                        <p className="text-slate-300 text-sm mb-4 capitalize">
                          {operador.role}
                        </p>
                        
                        <motion.div
                          className="inline-flex items-center px-3 py-1 rounded-full bg-green-500/20 border border-green-500/30 text-sm font-medium text-green-400 mt-auto"
                          whileHover={{ x: 5 }}
                        >
                          <ArrowRight className="w-3 h-3 mr-1" />
                          Selecionar
                        </motion.div>
        </CardContent>
      </Card>
                  </motion.div>
                ))}
              </motion.div>

              {/* Mensagem se não houver operadores */}
              {getOperadoresByRole(selectedRole).length === 0 && (
                <motion.div
                  variants={fadeInUp}
                  className="text-center py-12"
                >
                  <div className="w-16 h-16 bg-slate-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="h-8 w-8 text-slate-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Nenhum operador disponível
                  </h3>
                  <p className="text-slate-300">
                    Não há operadores ativos para este tipo de função.
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Botão de Logout - Posicionado abaixo dos cards */}
          {!selectedRole && (
            <motion.div 
              className="text-center mt-8"
              variants={fadeInUp}
            >
              <Button
                variant="outline"
                size="lg"
                onClick={logout}
                className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-red-500/20 hover:border-red-500/50 hover:text-red-400 transition-all duration-300 px-8 py-3"
              >
                <LogOut className="h-5 w-5 mr-2" />
                Logout
              </Button>
            </motion.div>
          )}

        </motion.div>
      </div>
    </div>
  );
}
