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
  LogOut,
  Users,
  UserCog
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ConfiguracoesSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
}

// Definição das abas de configurações
const configuracoesTabs = [
  { 
    id: "conta", 
    nome: "Conta", 
    icone: User, 
    descricao: "Dados pessoais e da empresa" 
  },
  { 
    id: "fornecedores", 
    nome: "Fornecedores", 
    icone: Building2, 
    descricao: "Gerenciar fornecedores",
    isExternal: true,
    path: "/dashboard/fornecedores"
  },
  { 
    id: "funcionarios", 
    nome: "Funcionários", 
    icone: Users, 
    descricao: "Gerenciar funcionários",
    isExternal: true,
    path: "/dashboard/funcionarios"
  },
  { 
    id: "administracao", 
    nome: "Administração", 
    icone: UserCog, 
    descricao: "Gerenciar usuários e permissões" 
  },
  { 
    id: "pagamentos", 
    nome: "Meu Plano", 
    icone: CreditCard, 
    descricao: "Planos e assinatura" 
  },
  { 
    id: "metodos-pagamento", 
    nome: "Métodos De Pagamentos", 
    icone: CreditCard, 
    descricao: "Formas de pagamento" 
  },
  { 
    id: "tema", 
    nome: "Tema", 
    icone: Palette, 
    descricao: "Personalização visual" 
  },
  { 
    id: "notificacoes", 
    nome: "Notificações", 
    icone: Bell, 
    descricao: "Alertas e notificações" 
  },
  { 
    id: "seguranca", 
    nome: "Segurança", 
    icone: Shield, 
    descricao: "Configurações de segurança" 
  }
];

export function ConfiguracoesSidebar({ 
  activeTab, 
  onTabChange, 
  onLogout 
}: ConfiguracoesSidebarProps) {
  const navigate = useNavigate();

  return (
    <div className="flex h-screen w-80 flex-col bg-sidebar border-r border-sidebar-border">
      {/* Header do sidebar */}
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border bg-gradient-primary px-6">
        <div className="flex items-center space-x-2">
          <Settings className="h-6 w-6 text-white" />
          <span className="text-lg font-bold text-white">Configurações</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/dashboard")}
          className="text-white hover:bg-white/20"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
      </div>

      {/* Navegação das abas */}
      <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
        {configuracoesTabs.map((tab) => {
          const Icon = tab.icone;
          const handleClick = () => {
            if (tab.isExternal && tab.path) {
              navigate(tab.path);
            } else {
              onTabChange(tab.id);
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

      {/* Ações rápidas na parte inferior */}
      <div className="border-t border-sidebar-border p-4 space-y-2">
        <Button 
          onClick={onLogout}
          variant="outline" 
          size="sm" 
          className="w-full justify-start text-destructive hover:text-destructive"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sair
        </Button>
      </div>
    </div>
  );
}
