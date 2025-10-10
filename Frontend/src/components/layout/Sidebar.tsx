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
import { NavLink, useNavigate } from "react-router-dom";
import { useOperador } from "@/contexts/OperadorContext";
import { usePermissions } from "@/hooks/usePermissions";

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
// Cada item agora inclui a permissão necessária para acessá-lo
const navegacao = [
  { nome: "Dashboard", href: "/dashboard", icone: LayoutDashboard, permissao: "dashboard" },
  { nome: "Produtos", href: "/dashboard/produtos", icone: Package, permissao: "produtos" },
  { nome: "Vendas", href: "/dashboard/vendas", icone: ShoppingCart, permissao: "vendas" },
  { nome: "Catálogo", href: "/dashboard/catalogo", icone: Store, permissao: "catalogo" },
  { nome: "Clientes", href: "/dashboard/clientes", icone: Users, permissao: "clientes" },
  { nome: "Relatórios", href: "/dashboard/relatorios", icone: BarChart3, permissao: "relatorios" },
  { nome: "Financeiro", href: "/dashboard/financeiro", icone: TrendingUp, permissao: "financeiro" },
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
  const { hasPermission } = usePermissions();
  const navigate = useNavigate();

  // Debug: verificar dados do tenant
  console.log('Sidebar - tenant data:', tenant);

  // Se não há operador selecionado, não renderizar a sidebar
  if (!operadorSelecionado) {
    return null;
  }

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
        "fixed lg:static inset-y-0 left-0 z-50 flex h-full flex-col bg-sidebar border-r border-sidebar-border transform transition-transform duration-300 ease-in-out flex-shrink-0",
        // Mobile: largura menor para não quebrar o layout
        "w-72 max-w-[85vw]",
        // Desktop: largura fixa de 320px
        "lg:w-80",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Logo e nome do sistema */}
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border bg-gradient-primary px-4 lg:px-6 flex-shrink-0">
          <div className="flex items-center space-x-2 min-w-0 flex-1">
            <Store className="h-6 w-6 lg:h-8 lg:w-8 text-white flex-shrink-0" />
            <span className="text-lg lg:text-xl font-bold text-white truncate">
              {tenant?.nome || "KontrollaPro"}
            </span>
          </div>
          {/* Botão de fechar para mobile */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="lg:hidden text-white hover:bg-white/20 flex-shrink-0 ml-2"
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navegação principal */}
        <nav className="flex-1 space-y-1 p-3 lg:p-4 overflow-y-auto">
          {navegacao
            .filter((item) => hasPermission(item.permissao as any))
            .map((item) => (
              <NavLink
                key={item.nome}
                to={item.href}
                end={item.href === "/dashboard"}
                onClick={() => {
                  if (window.innerWidth < 1024) {
                    onClose();
                  }
                }}
                className={({ isActive }) =>
                  cn(
                    "flex items-center px-3 py-2.5 lg:px-4 lg:py-3 text-sm font-medium rounded-lg transition-all duration-200",
                    "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                      : "text-sidebar-foreground"
                  )
                }
              >
                <item.icone className="mr-2.5 lg:mr-3 h-4 w-4 lg:h-5 lg:w-5 flex-shrink-0" />
                <span className="truncate">{item.nome}</span>
              </NavLink>
            ))}
        </nav>

        {/* Seção do usuário na parte inferior */}
        <div className="border-t border-sidebar-border p-3 lg:p-4 flex-shrink-0">
          <div className="flex items-center space-x-2.5 lg:space-x-3 mb-3">
            <div className="h-7 w-7 lg:h-8 lg:w-8 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0">
              <span className="text-xs lg:text-sm font-medium text-white">
                {user ? (user.nome.charAt(0) + user.sobrenome.charAt(0)).toUpperCase() : "U"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs lg:text-sm font-medium text-sidebar-foreground truncate">
                {user ? `${user.nome} ${user.sobrenome}` : "Usuário"}
              </p>
              <p className="text-xs text-sidebar-foreground/60 truncate">
                {user?.email || "email@exemplo.com"}
              </p>
            </div>
          </div>

          {hasPermission('configuracoes') && (
            <NavLink
              to="/dashboard/configuracoes"
              onClick={() => {
                if (window.innerWidth < 1024) {
                  onClose();
                }
              }}
              className={({ isActive }) =>
                cn(
                  "flex items-center px-3 py-2.5 lg:px-4 lg:py-3 text-xs lg:text-sm font-medium rounded-lg transition-all duration-200 w-full justify-start",
                  "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                    : "text-sidebar-foreground"
                )
              }
            >
              <Settings className="mr-2.5 lg:mr-3 h-3.5 w-3.5 lg:h-4 lg:w-4 flex-shrink-0" />
              <span className="truncate">Configurações</span>
            </NavLink>
          )}

          <Button
            variant="ghost"
            className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent mt-1 px-3 py-2.5 lg:px-4 lg:py-3 text-xs lg:text-sm h-auto"
            onClick={() => navigate("/")}
          >
            <LogOut className="mr-2.5 lg:mr-3 h-3.5 w-3.5 lg:h-4 lg:w-4 flex-shrink-0" />
            <span className="truncate">Sair</span>
          </Button>
        </div>
      </div>
    </>
  );
}