import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { NotificationContainer } from "./components/ui/notification";
import { useNotifications } from "./hooks/useNotifications";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import Produtos from "./pages/Produtos";
import Vendas from "./pages/Vendas";
import NovaVenda from "./pages/NovaVenda";
import Catalogo from "./pages/Catalogo";
import Clientes from "./pages/Clientes";
import Relatorios from "./pages/Relatorios";
import Financeiro from "./pages/Financeiro";
import NFe from "./pages/NFe";
import Configuracoes from "./pages/Configuracoes";
import NovoProduto from "./pages/NovoProduto";
import NovoCliente from "./pages/NovoCliente";
import NovaTransacao from "./pages/NovaTransacao";

import PaginaNaoEncontrada from "./pages/NotFound";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";

const clienteQuery = new QueryClient();

function AppContent() {
  const { notifications, removeNotification } = useNotifications();

  return (
    <>
      <BrowserRouter>
        <Routes>
          {/* Landing Page */}
          <Route path="/" element={<LandingPage />} />
          
          {/* Páginas de Autenticação */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/esqueci-senha" element={<ForgotPassword />} />
          
          {/* Rota de demonstração */}
          <Route path="/demo" element={<div>Demonstração</div>} />
          
          {/* Área administrativa - com layout */}
          <Route path="/dashboard" element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="produtos" element={<Produtos />} />
            <Route path="novo-produto" element={<NovoProduto />} />
            <Route path="novo-produto/:id" element={<NovoProduto />} />
             <Route path="vendas" element={<Vendas />} />
            <Route path="nova-venda" element={<NovaVenda />} />
            <Route path="catalogo" element={<Catalogo />} />
            <Route path="clientes" element={<Clientes />} />
            <Route path="novo-cliente" element={<NovoCliente />} />
            <Route path="novo-cliente/:id" element={<NovoCliente />} />
            <Route path="relatorios" element={<Relatorios />} />
            <Route path="financeiro" element={<Financeiro />} />
            <Route path="nova-transacao" element={<NovaTransacao />} />
            <Route path="nfe" element={<NFe />} />
            <Route path="configuracoes" element={<Configuracoes />} />
          </Route>
          
          {/* Rota 404 */}
          <Route path="*" element={<PaginaNaoEncontrada />} />
        </Routes>
      </BrowserRouter>
      
      {/* Sistema de notificações */}
      <NotificationContainer
        notifications={notifications}
        onClose={removeNotification}
      />
    </>
  );
}

const App = () => (
  <QueryClientProvider client={clienteQuery}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppContent />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
