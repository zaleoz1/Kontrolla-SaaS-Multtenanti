import { useState, useEffect, useRef } from "react";
import { Outlet, useLocation, Navigate } from "react-router-dom";
import { Sidebar } from "./Sidebar"; 
import { Header } from "./Header";
import { OperadorRequired } from "./OperadorRequired";
import { useAuth } from "@/hooks/useAuth";
import { useOperador } from "@/contexts/OperadorContext";
import { useTenant } from "@/hooks/useTenant";
import { ThemeProvider } from "@/hooks/useTheme";
import { NotificationProvider } from "@/contexts/NotificationContext"; 

// Componente principal de layout da aplicação
export function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const sidebarStateBeforeVenda = useRef<boolean | null>(null); // Armazena estado do sidebar antes de entrar em páginas de venda
  const { user, logout, isAuthenticated, loading } = useAuth();
  const { operadorSelecionado } = useOperador();
  const { tenant } = useTenant();
  const location = useLocation();
  
  // Verificar se estamos em páginas que usam ConfiguracoesSidebar
  const isConfiguracoesPage = location.pathname === '/dashboard/configuracoes';
  const isFornecedoresPage = location.pathname === '/dashboard/fornecedores';
  const isFuncionariosPage = location.pathname === '/dashboard/funcionarios';
  const isNovoFornecedorPage = location.pathname === '/dashboard/novo-fornecedor' || location.pathname.startsWith('/dashboard/novo-fornecedor/');
  const isNovoFuncionarioPage = location.pathname === '/dashboard/novo-funcionario' || location.pathname.startsWith('/dashboard/novo-funcionario/');
  const isConfiguracoesLayout = isConfiguracoesPage || isFornecedoresPage || isFuncionariosPage || isNovoFornecedorPage || isNovoFuncionarioPage;

  // Verificar se estamos em páginas de venda (requerem sidebar colapsado para mais espaço)
  const isNovaVendaPage = location.pathname === '/dashboard/nova-venda';
  const isPagamentosPage = location.pathname === '/dashboard/pagamentos';
  const isVendaPages = isNovaVendaPage || isPagamentosPage;

  // Fecha o sidebar quando a tela é redimensionada para desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(false);
      }
      // Em telas menores, sempre expandir o sidebar
      if (window.innerWidth < 1024) {
        setIsSidebarCollapsed(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Colapsar sidebar automaticamente nas páginas de venda (em desktop)
  // e restaurar o estado anterior ao sair dessas páginas
  useEffect(() => {
    if (window.innerWidth >= 1024) {
      if (isVendaPages) {
        // Salvar o estado atual do sidebar antes de colapsar (apenas se ainda não salvou)
        if (sidebarStateBeforeVenda.current === null) {
          sidebarStateBeforeVenda.current = isSidebarCollapsed;
        }
        setIsSidebarCollapsed(true);
      } else {
        // Restaurar o estado anterior ao sair das páginas de venda
        if (sidebarStateBeforeVenda.current !== null) {
          setIsSidebarCollapsed(sidebarStateBeforeVenda.current);
          sidebarStateBeforeVenda.current = null; // Limpar o estado salvo
        }
      }
    }
  }, [isVendaPages]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  // O tenant agora é carregado pelo hook useTenant com todos os dados, incluindo a logo

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Redirecionar para login se não estiver autenticado
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <ThemeProvider>
      <NotificationProvider>
        {/* Se estivermos em páginas de configurações, renderizar layout sem sidebar e header */}
        {isConfiguracoesLayout ? (
          <div className="min-h-screen w-full bg-background">
            <Outlet />
          </div>
        ) : (
          /* Container principal usando flexbox, ocupando toda a altura da tela */
          <div className="flex h-screen w-full bg-background">
            {/* Barra lateral fixa à esquerda - só aparece se houver operador selecionado */}
            <Sidebar 
              isOpen={isSidebarOpen} 
              onClose={closeSidebar} 
              isCollapsed={isSidebarCollapsed}
              user={user}
              tenant={tenant}
              onLogout={logout}
            />
            {/* Área principal do layout */}
            <div className={`flex-1 flex flex-col min-w-0 ${!operadorSelecionado ? 'w-full' : ''}`}>
              {/* Cabeçalho fixo no topo */}
              <Header 
                onMenuClick={toggleSidebar} 
                onToggleSidebar={toggleSidebarCollapse}
                isSidebarCollapsed={isSidebarCollapsed}
              />
              {/* Conteúdo principal, com rolagem vertical e espaçamento */}
              <main className="flex-1 overflow-y-auto bg-muted/30 dark:bg-muted/25 dark-light:bg-muted/30 windows-dark:bg-muted/25 p-6">
                {/* Centraliza o conteúdo e limita a largura máxima */}
                <div className="max-w-7xl mx-auto">
                  {/* Se não há operador selecionado, mostrar mensagem */}
                  {!operadorSelecionado ? (
                    <OperadorRequired />
                  ) : (
                    /* Renderiza o conteúdo das rotas filhas */
                    <Outlet />
                  )}
                </div>
              </main>
            </div> 
          </div>
        )}
      </NotificationProvider>
    </ThemeProvider>
  );
}