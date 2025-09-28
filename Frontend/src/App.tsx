import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AppLayout } from "./components/layout/AppLayout";
import { NotificationContainer } from "./components/ui/notification";
import { useNotifications } from "./hooks/useNotifications";
import { OperadorProvider } from "./contexts/OperadorContext";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import Produtos from "./pages/Produtos";
import Vendas from "./pages/Vendas";
import NovaVenda from "./pages/NovaVenda";
import Pagamentos from "./pages/Pagamentos";
import Catalogo from "./pages/Catalogo";
import Clientes from "./pages/Clientes";
import Relatorios from "./pages/Relatorios";
import Financeiro from "./pages/Financeiro";
import NFe from "./pages/NFe";
import Configuracoes from "./pages/Configuracoes";
import NovoProduto from "./pages/NovoProduto";
import NovoCliente from "./pages/NovoCliente";
import NovaTransacao from "./pages/NovaTransacao";
import Fornecedores from "./pages/Fornecedores";
import Funcionarios from "./pages/Funcionarios";
import NovoFornecedor from "./pages/NovoFornecedor";
import NovoFuncionario from "./pages/NovoFuncionario";

import PaginaNaoEncontrada from "./pages/NotFound";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import CatalogoPublico from "./pages/CatalogoPublico";
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
          
          {/* Catálogo Público */}
          <Route path="/catalogo" element={<CatalogoPublico />} />
          
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
            <Route path="pagamentos" element={<Pagamentos />} />
            <Route path="catalogo" element={<Catalogo />} />
            <Route path="clientes" element={<Clientes />} />
            <Route path="novo-cliente" element={<NovoCliente />} />
            <Route path="novo-cliente/:id" element={<NovoCliente />} />
            <Route path="relatorios" element={<Relatorios />} />
            <Route path="financeiro" element={<Financeiro />} />
            <Route path="nova-transacao" element={<NovaTransacao />} />
            <Route path="nfe" element={<NFe />} />
          <Route path="configuracoes" element={<Configuracoes />} />
          <Route path="fornecedores" element={<Fornecedores />} />
          <Route path="funcionarios" element={<Funcionarios />} />
          <Route path="novo-fornecedor" element={<NovoFornecedor />} />
          <Route path="novo-fornecedor/:id" element={<NovoFornecedor />} />
            <Route path="novo-funcionario" element={<NovoFuncionario />} />
            <Route path="novo-funcionario/:id" element={<NovoFuncionario />} />
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
  <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || "505635879481-974u3cn4qac3eeti5i9gjsreo3o315dp.apps.googleusercontent.com"}>
    <QueryClientProvider client={clienteQuery}>
      <TooltipProvider>
        <OperadorProvider>
          <Toaster />
          <Sonner />
          <AppContent />
        </OperadorProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </GoogleOAuthProvider>
);

export default App;
