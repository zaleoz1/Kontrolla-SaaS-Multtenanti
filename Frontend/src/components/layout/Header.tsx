import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Plus, Menu, User, ChevronDown, Crown, Shield, ShoppingBag } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAdministradores } from "@/hooks/useAdministradores";
import { useOperador } from "@/contexts/OperadorContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PropsCabecalho {
  onMenuClick: () => void;
}

/**
 * Componente Header
 * Renderiza o cabeçalho da aplicação com botão de menu e botão de nova venda.
 */
export function Header({ onMenuClick }: PropsCabecalho) {
  const navigate = useNavigate();
  const location = useLocation();
  const { administradores, loading } = useAdministradores();
  const { operadorSelecionado, setOperadorSelecionado } = useOperador();

  // Validar se o operador selecionado ainda existe e está ativo
  useEffect(() => {
    if (operadorSelecionado && administradores.length > 0) {
      const operadorExiste = administradores.find(
        adm => adm.id === operadorSelecionado && adm.status === 'ativo'
      );
      
      if (!operadorExiste) {
        // Se o operador não existe mais ou não está ativo, limpar a seleção
        setOperadorSelecionado(null);
      }
    }
  }, [administradores, operadorSelecionado, setOperadorSelecionado]);

  // Função auxiliar para obter o operador atual
  const getOperadorAtual = () => {
    return administradores.find(adm => adm.id === operadorSelecionado);
  };



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
        {/* Botão de menu para mobile e telas menores que 1378px */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onMenuClick}
          className="min-[1378px]:hidden mr-2"
        >
          <Menu className="h-5 w-5" />
        </Button>


        {/* Área de ações - alinhada à direita */}
        <div className="flex items-center space-x-4 ml-auto">   
          {/* Botão para criar nova venda */}
          <Button variant="outline" size="sm" className="gap-2" onClick={() => navigate("/dashboard/nova-venda")}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nova Venda</span>
          </Button>

          {/* Seletor de Operador */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2"
              >
                {(() => {
                  const operador = getOperadorAtual();
                  if (operador) {
                    switch (operador.role) {
                      case 'administrador':
                        return <Crown className="h-4 w-4 text-red-500" />;
                      case 'gerente':
                        return <Shield className="h-4 w-4 text-blue-500" />;
                      case 'vendedor':
                        return <ShoppingBag className="h-4 w-4 text-green-500" />;
                      default:
                        return <User className="h-4 w-4" />;
                    }
                  }
                  return <User className="h-4 w-4" />;
                })()}
                <span className="hidden sm:inline">
                  {operadorSelecionado 
                    ? (() => {
                        const operador = getOperadorAtual();
                        return operador ? `${operador.nome} ${operador.sobrenome}` : 'Selecionar Operador';
                      })()
                    : 'Selecionar Operador'
                  }
                </span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Selecionar Operador</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {loading ? (
                <DropdownMenuItem disabled>
                  Carregando...
                </DropdownMenuItem>
              ) : (
                <>
                  {operadorSelecionado && (
                    <>
                      <DropdownMenuItem
                        onClick={() => setOperadorSelecionado(null)}
                        className="text-muted-foreground"
                      >
                        Limpar Seleção
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  {administradores
                    .filter(adm => adm.status === 'ativo')
                    .map((administrador) => (
                      <DropdownMenuItem
                        key={administrador.id}
                        onClick={() => setOperadorSelecionado(administrador.id)}
                        className="flex flex-col items-start"
                      >
                        <div className="font-medium">
                          {administrador.nome} {administrador.sobrenome}
                        </div>
                        <div className="text-xs text-muted-foreground capitalize">
                          {administrador.role}
                        </div>
                      </DropdownMenuItem>
                    ))}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

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
        </div>
      </div>
    </header>
  );
}