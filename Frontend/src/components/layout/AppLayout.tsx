import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar"; 
import { Header } from "./Header"; 

// Componente principal de layout da aplicação
export function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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

  return (
    // Container principal usando flexbox, ocupando toda a altura da tela
    <div className="flex h-screen w-full bg-background">
      {/* Barra lateral fixa à esquerda */}
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
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