import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar"; 
import { Header } from "./Header";
import { OperadorRequired } from "./OperadorRequired";
import { useAuth } from "@/hooks/useAuth";
import { useOperador } from "@/contexts/OperadorContext";
import { useTenant } from "@/hooks/useTenant";
import { ThemeProvider } from "@/hooks/useTheme"; 

// Componente principal de layout da aplicação
export function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const { operadorSelecionado } = useOperador();
  const { tenant } = useTenant();
  const location = useLocation();
  
  console.log('🔍 AppLayout renderizado');
  console.log('🔍 Location:', location.pathname);
  console.log('🔍 User:', user);
  console.log('🔍 Operador:', operadorSelecionado);
  
  // Verificar se estamos em páginas que usam ConfiguracoesSidebar
  const isConfiguracoesPage = location.pathname === '/dashboard/configuracoes';
  const isFornecedoresPage = location.pathname === '/dashboard/fornecedores';
  const isFuncionariosPage = location.pathname === '/dashboard/funcionarios';
  const isNovoFornecedorPage = location.pathname === '/dashboard/novo-fornecedor' || location.pathname.startsWith('/dashboard/novo-fornecedor/');
  const isNovoFuncionarioPage = location.pathname === '/dashboard/novo-funcionario' || location.pathname.startsWith('/dashboard/novo-funcionario/');
  const isConfiguracoesLayout = isConfiguracoesPage || isFornecedoresPage || isFuncionariosPage || isNovoFornecedorPage || isNovoFuncionarioPage;

  // Fecha o sidebar quando a tela é redimensionada para desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  // O tenant agora é carregado pelo hook useTenant com todos os dados, incluindo a logo

  return (
    <ThemeProvider>
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
            user={user}
            tenant={tenant}
            onLogout={logout}
          />
          {/* Área principal do layout */}
          <div className={`flex-1 flex flex-col min-w-0 ${!operadorSelecionado ? 'w-full' : ''}`}>
            {/* Cabeçalho fixo no topo */}
            <Header onMenuClick={toggleSidebar} />
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
    </ThemeProvider>
  );
}