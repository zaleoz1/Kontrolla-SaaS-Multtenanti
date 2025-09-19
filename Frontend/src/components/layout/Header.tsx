import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Bell, Search, Plus, Menu } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

interface PropsCabecalho {
  onMenuClick: () => void;
}

/**
 * Componente Header
 * Renderiza o cabeçalho da aplicação com barra de busca, botão de nova venda,
 * ícone de notificações e informações da loja.
 */
export function Header({ onMenuClick }: PropsCabecalho) {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Carregar dados do usuário do localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  // Verificar se está em páginas que não devem mostrar o header
  const isNovaVendaPage = location.pathname === '/dashboard/nova-venda';
  const isNovoFuncionarioPage = location.pathname === '/dashboard/novo-funcionario' || location.pathname.startsWith('/dashboard/novo-funcionario/');
  const isConfiguracoesPage = location.pathname === '/dashboard/configuracoes';
  const isNovoFornecedorPage = location.pathname === '/dashboard/novo-fornecedor' || location.pathname.startsWith('/dashboard/novo-fornecedor/');
  const isPagamentosPage = location.pathname === '/dashboard/pagamentos';
  
  // Se estiver em páginas que usam layout próprio, não renderizar o header
  if (isNovaVendaPage || isNovoFuncionarioPage || isConfiguracoesPage || isNovoFornecedorPage || isPagamentosPage) {
    return null;
  }

  return (
    // Header principal com fundo e borda inferior
    <header className="h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex-shrink-0">
      <div className="flex h-full items-center justify-between px-6">
        {/* Botão de menu para mobile */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onMenuClick}
          className="lg:hidden mr-2"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Área de busca */}
        <div className="flex items-center space-x-4 flex-1">
          <div className="relative max-w-md flex-1">
            {/* Ícone de busca sobreposto ao input */}
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar produtos, vendas, clientes..."
              className="pl-10 bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary"
            />
          </div>
        </div>

        {/* Área de ações e informações */}
        <div className="flex items-center space-x-4">   
          {/* Botão para criar nova venda */}
          <Button variant="outline" size="sm" className="gap-2" onClick={() => navigate("/dashboard/nova-venda")}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nova Venda</span>
          </Button>

          {/* Ícone de notificações com badge */}
          <div className="relative">
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="h-5 w-5" />
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              >
                3
              </Badge>
            </Button>
          </div>

          {/* Informações do usuário */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium">{user.nome} {user.sobrenome}</p>
                <p className="text-xs text-muted-foreground">{user.tenant_nome}</p>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/login")}
                >
                  Entrar
                </Button>
                <Button
                  size="sm"
                  onClick={() => navigate("/signup")}
                >
                  Cadastrar
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}