import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  User, 
  Building2, 
  CreditCard, 
  Palette, 
  Bell, 
  Shield,
  Settings,
  ArrowLeft,
  Users,
  UserCog,
  X
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { usePermissions } from "@/hooks/usePermissions";

interface ConfiguracoesSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

// Definição das abas de configurações com permissões
const configuracoesTabs = [
  { 
    id: "conta", 
    nome: "Conta", 
    icone: User, 
    descricao: "Dados pessoais e da empresa",
    permissao: "configuracoes_gerais"
  },
  { 
    id: "fornecedores", 
    nome: "Fornecedores", 
    icone: Building2, 
    descricao: "Gerenciar fornecedores",
    isExternal: true,
    path: "/dashboard/fornecedores",
    permissao: "fornecedores"
  },
  { 
    id: "funcionarios", 
    nome: "Funcionários", 
    icone: Users, 
    descricao: "Gerenciar funcionários",
    isExternal: true,
    path: "/dashboard/funcionarios",
    permissao: "funcionarios"
  },
  { 
    id: "administracao", 
    nome: "Administração", 
    icone: UserCog, 
    descricao: "Gerenciar usuários e permissões",
    permissao: "configuracoes_administradores"
  },
  { 
    id: "pagamentos", 
    nome: "Meu Plano", 
    icone: CreditCard, 
    descricao: "Planos e assinatura",
    permissao: "configuracoes_gerais"
  },
  { 
    id: "metodos-pagamento", 
    nome: "Métodos De Pagamentos", 
    icone: CreditCard, 
    descricao: "Formas de pagamento",
    permissao: "configuracoes_pagamentos"
  },
  { 
    id: "tema", 
    nome: "Tema", 
    icone: Palette, 
    descricao: "Personalização visual",
    permissao: "configuracoes_gerais"
  },
  { 
    id: "notificacoes", 
    nome: "Notificações", 
    icone: Bell, 
    descricao: "Alertas e notificações",
    permissao: "configuracoes_gerais"
  },
  { 
    id: "seguranca", 
    nome: "Segurança", 
    icone: Shield, 
    descricao: "Configurações de segurança",
    permissao: "configuracoes_gerais"
  }
];

export function ConfiguracoesSidebar({ 
  activeTab, 
  onTabChange, 
  isOpen,
  onClose
}: ConfiguracoesSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasPermission, operador } = usePermissions();

  // Função para determinar se uma aba deve ser visível
  const isTabVisible = (tab: typeof configuracoesTabs[0]) => {
    // Se tem permissão específica da aba, mostra
    if (hasPermission(tab.permissao as any)) {
      return true;
    }

    // Para vendedores com permissão de configurações, mostra apenas métodos de pagamento
    if (operador?.role === 'vendedor' && hasPermission('configuracoes')) {
      // Vendedores com configurações podem ver apenas métodos de pagamento
      if (tab.id === 'metodos-pagamento') {
        return true;
      }
    }

    return false;
  };

  return (
    <>
      {/* Overlay para mobile - só aparece quando sidebar está aberta */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Container principal da sidebar */}
      <div className={cn(
        "fixed lg:static inset-y-0 left-0 z-50 flex h-full w-80 flex-col bg-sidebar border-r border-sidebar-border transform transition-transform duration-300 ease-in-out flex-shrink-0",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Header do sidebar */}
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border bg-gradient-primary px-6 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <Settings className="h-6 w-6 text-white" />
            <span className="text-lg font-bold text-white">Configurações</span>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/dashboard")}
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            {/* Botão de fechar para mobile */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="lg:hidden text-white hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

      {/* Navegação das abas */}
      <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
        {configuracoesTabs
          .filter((tab) => isTabVisible(tab))
          .map((tab) => {
          const Icon = tab.icone;
            const handleClick = () => {
              // Fecha o sidebar em mobile ao clicar em um item
              if (window.innerWidth < 1024) {
                onClose();
              }
              
              // Para vendedores com configurações, redireciona para métodos de pagamento
              if (operador?.role === 'vendedor' && hasPermission('configuracoes')) {
                if (tab.isExternal && tab.path) {
                  navigate(tab.path);
                } else {
                  // Vendedores sempre vão para métodos de pagamento nas configurações
                  if (location.pathname !== '/dashboard/configuracoes') {
                    navigate('/dashboard/configuracoes?aba=metodos-pagamento');
                  } else {
                    onTabChange('metodos-pagamento');
                  }
                }
                return;
              }
              
              if (tab.isExternal && tab.path) {
                navigate(tab.path);
              } else {
                // Se estamos em uma página externa (como funcionários), navegar para configurações com a aba específica
                if (location.pathname !== '/dashboard/configuracoes') {
                  navigate(`/dashboard/configuracoes?aba=${tab.id}`);
                } else {
                  // Se já estamos na página de configurações, apenas mudar a aba
                  onTabChange(tab.id);
                }
              }
            };
          
          return (
            <button
              key={tab.id}
              onClick={handleClick}
              className={cn(
                "w-full flex items-start space-x-3 p-4 text-left rounded-lg transition-all duration-200",
                "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                activeTab === tab.id 
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md" 
                  : "text-sidebar-foreground"
              )}
            >
              <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{tab.nome}</p>
                <p className="text-xs text-sidebar-foreground/60 mt-1">
                  {tab.descricao}
                </p>
              </div>
            </button>
          );
        })}
      </nav>

        {/* Botão voltar na parte inferior */}
        <div className="border-t border-sidebar-border p-4 flex-shrink-0">
          <Button 
            onClick={() => navigate("/dashboard")}
            variant="outline" 
            size="sm" 
            className="w-full justify-start"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Dashboard
          </Button>
        </div>
      </div>
    </>
  );
}
