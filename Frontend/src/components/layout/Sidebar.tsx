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
}

// Componente principal da Sidebar
export function Sidebar({ isOpen, onClose }: PropsSidebar) {
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
        "fixed lg:static inset-y-0 left-0 z-50 flex h-full w-64 flex-col bg-sidebar border-r border-sidebar-border transform transition-transform duration-300 ease-in-out flex-shrink-0",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        
        {/* Logo e nome do sistema */}
        <div className="flex h-16 items-center justify-center border-b border-sidebar-border bg-gradient-primary flex-shrink-0">
          <div className="flex items-center space-x-2">
            <Store className="h-8 w-8 text-white" />
            <span className="text-xl font-bold text-white">KontrollaPro</span>
          </div>
          
          {/* Botão de fechar para mobile */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="lg:hidden absolute right-2 text-white hover:bg-white/20"
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
                if (window.innerWidth < 1024) {
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
              <span className="text-sm font-medium text-white">A</span>
            </div>
            {/* Informações do usuário */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                Admin
              </p>
              <p className="text-xs text-sidebar-foreground/60 truncate">
                admin@loja.com
              </p>
            </div>
          </div>
          
          {/* Botão de configurações */}
          <Button 
            variant="ghost" 
            className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <Settings className="mr-3 h-4 w-4" />
            Configurações
          </Button>
          
          {/* Botão de sair */}
          <Button 
            variant="ghost" 
            className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent mt-1"
          >
            <LogOut className="mr-3 h-4 w-4" />
            Sair
          </Button>
        </div>
      </div>
    </>
  );
}