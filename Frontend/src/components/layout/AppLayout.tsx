import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar"; 
import { Header } from "./Header";
import { useAuth } from "@/hooks/useAuth"; 

// Componente principal de layout da aplicação
export function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  
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

  // Criar objeto tenant a partir dos dados do usuário
  const tenant = user ? {
    id: user.tenant_id,
    nome: user.tenant_nome,
    slug: user.tenant_slug,
    logo: undefined // Pode ser adicionado posteriormente se necessário
  } : null;

  // Se estivermos em páginas de configurações, renderizar layout sem sidebar e header
  if (isConfiguracoesLayout) {
    return (
      <div className="min-h-screen w-full bg-background">
        <Outlet />
      </div>
    );
  }

  return (
    // Container principal usando flexbox, ocupando toda a altura da tela
    <div className="flex h-screen w-full bg-background">
      {/* Barra lateral fixa à esquerda */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={closeSidebar} 
        user={user}
        tenant={tenant}
        onLogout={logout}
      />
      {/* Área principal do layout */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Cabeçalho fixo no topo */}
        <Header onMenuClick={toggleSidebar} />
        {/* Conteúdo principal, com rolagem vertical e espaçamento */}
        <main className="flex-1 overflow-y-auto bg-muted/30 p-6">
          {/* Centraliza o conteúdo e limita a largura máxima */}
          <div className="max-w-7xl mx-auto">
            {/* Renderiza o conteúdo das rotas filhas */}
            <Outlet />
          </div>
        </main>
      </div> 
    </div>
  );
}