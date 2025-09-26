// Importa utilitário para classes CSS, componente de botão e ícones
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  BarChart3, 
  Settings,
  Store,
  Users,
  Receipt,
  TrendingUp,
  LogOut,
  X
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useOperador } from "@/contexts/OperadorContext";

// Interface para dados do usuário
interface User {
  id: number;
  nome: string;
  sobrenome: string;
  email: string;
  role: string;
  tenant_id: number;
  tenant_nome: string;
  tenant_slug: string;
}

// Interface para dados da empresa/tenant
interface Tenant {
  id: number;
  nome: string;
  slug: string;
  logo?: string;
}

// Array de objetos que define os itens de navegação da sidebar
const navegacao = [
  { nome: "Dashboard", href: "/dashboard", icone: LayoutDashboard },
  { nome: "Produtos", href: "/dashboard/produtos", icone: Package },
  { nome: "Vendas", href: "/dashboard/vendas", icone: ShoppingCart },
  { nome: "Catálogo", href: "/dashboard/catalogo", icone: Store },
  { nome: "Clientes", href: "/dashboard/clientes", icone: Users },
  { nome: "Relatórios", href: "/dashboard/relatorios", icone: BarChart3 },
  { nome: "Financeiro", href: "/dashboard/financeiro", icone: TrendingUp },
  { nome: "NF-e", href: "/dashboard/nfe", icone: Receipt },
];

interface PropsSidebar {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  tenant: Tenant | null;
  onLogout: () => void;
}

// Componente principal da Sidebar
export function Sidebar({ isOpen, onClose, user, tenant, onLogout }: PropsSidebar) {
  const { operadorSelecionado } = useOperador();

  // Se não há operador selecionado, não renderizar a sidebar
  if (!operadorSelecionado) {
    return null;
  }

  return (
    <>
      {/* Overlay para mobile - só aparece quando sidebar está aberta */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 min-[1378px]:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Container principal da sidebar */}
      <div className={cn(
        "fixed min-[1378px]:static inset-y-0 left-0 z-50 flex h-full w-64 flex-col bg-sidebar border-r border-sidebar-border transform transition-transform duration-300 ease-in-out flex-shrink-0",
        isOpen ? "translate-x-0" : "-translate-x-full min-[1378px]:translate-x-0"
      )}>
        
        {/* Logo e nome do sistema */}
        <div className="flex h-16 items-center justify-center border-b border-sidebar-border bg-gradient-primary flex-shrink-0">
          <div className="flex items-center space-x-2">
            {tenant?.logo ? (
              <img 
                src={tenant.logo} 
                alt={`Logo ${tenant.nome}`}
                className="h-8 w-8 rounded object-cover"
              />
            ) : (
              <Store className="h-8 w-8 text-white" />
            )}
            <span className="text-xl font-bold text-white">
              {tenant?.nome || "KontrollaPro"}
            </span>
          </div>
          
          {/* Botão de fechar para mobile */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="min-[1378px]:hidden absolute right-2 text-white hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navegação principal */}
        <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
          {navegacao.map((item) => (
            // Cada item de navegação é um NavLink do React Router
            <NavLink
              key={item.nome}
              to={item.href}
              end={item.href === "/dashboard"}
              onClick={() => {
                // Fecha o sidebar em mobile ao clicar em um item
                if (window.innerWidth < 1378) {
                  onClose();
                }
              }}
              className={({ isActive }) =>
                cn(
                  "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200",
                  "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  isActive 
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md" 
                    : "text-sidebar-foreground"
                )
              }
            >
              {/* Ícone do item */}
              <item.icone className="mr-3 h-5 w-5" />
              {/* Nome do item */}
              {item.nome}
            </NavLink>
          ))}
        </nav>

        {/* Seção do usuário na parte inferior */}
        <div className="border-t border-sidebar-border p-4 flex-shrink-0">
          <div className="flex items-center space-x-3 mb-3">
            {/* Avatar do usuário */}
            <div className="h-8 w-8 rounded-full bg-gradient-primary flex items-center justify-center">
              <span className="text-sm font-medium text-white">
                {user ? (user.nome.charAt(0) + user.sobrenome.charAt(0)).toUpperCase() : "U"}
              </span>
            </div>
            {/* Informações do usuário */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user ? `${user.nome} ${user.sobrenome}` : "Usuário"}
              </p>
              <p className="text-xs text-sidebar-foreground/60 truncate">
                {user?.email || "email@exemplo.com"}
              </p>
            </div>
          </div>
          
          {/* Botão de configurações */}
          <NavLink
            to="/dashboard/configuracoes"
            onClick={() => {
              // Fecha o sidebar em mobile ao clicar em um item
              if (window.innerWidth < 1378) {
                onClose();
              }
            }}
            className={({ isActive }) =>
              cn(
                "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 w-full justify-start",
                "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                isActive 
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md" 
                  : "text-sidebar-foreground"
              )
            }
          >
            <Settings className="mr-3 h-4 w-4" />
            Configurações
          </NavLink>
          
          {/* Botão de sair */}
          <Button 
            variant="ghost" 
            className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent mt-1"
            onClick={onLogout}
          >
            <LogOut className="mr-3 h-4 w-4" />
            Sair
          </Button>
        </div>
      </div>
    </>
  );
}