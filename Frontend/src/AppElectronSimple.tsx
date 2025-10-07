import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AppLayout } from "./components/layout/AppLayout";
import { NotificationContainer } from "./components/ui/notification";
import { useNotifications } from "./hooks/useNotifications";
import { OperadorProvider } from "./contexts/OperadorContext";
import { DebugRoute } from "./components/DebugRoute";
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

  console.log('🔍 AppContent renderizado');
  console.log('🔍 Notificações:', notifications.length);

  return (
    <>
      <HashRouter>
        <Routes>
          {/* Landing Page */}
          <Route path="/" element={<LandingPage />} />
          
          {/* Páginas de Autenticação */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/esqueci-senha" element={<ForgotPassword />} />
          
          {/* Catálogo Público */}
          <Route path="/catalogo-publico" element={<CatalogoPublico />} />
          
          {/* Dashboard */}
          <Route path="/dashboard" element={<AppLayout />}>
            <Route index element={<DebugRoute routeName="Dashboard"><Dashboard /></DebugRoute>} />
          </Route>
          
          {/* Produtos */}
          <Route path="/dashboard/produtos" element={<AppLayout />}>
            <Route index element={<DebugRoute routeName="Produtos"><Produtos /></DebugRoute>} />
          </Route>
          <Route path="/dashboard/novo-produto" element={<AppLayout />}>
            <Route index element={<DebugRoute routeName="NovoProduto"><NovoProduto /></DebugRoute>} />
          </Route>
          <Route path="/dashboard/novo-produto/:id" element={<AppLayout />}>
            <Route index element={<NovoProduto />} />
          </Route>
          
          {/* Vendas */}
          <Route path="/dashboard/vendas" element={<AppLayout />}>
            <Route index element={<Vendas />} />
          </Route>
          <Route path="/dashboard/nova-venda" element={<AppLayout />}>
            <Route index element={<NovaVenda />} />
          </Route>
          
          {/* Pagamentos */}
          <Route path="/dashboard/pagamentos" element={<AppLayout />}>
            <Route index element={<Pagamentos />} />
          </Route>
          
          {/* Catálogo */}
          <Route path="/dashboard/catalogo" element={<AppLayout />}>
            <Route index element={<Catalogo />} />
          </Route>
          
          {/* Clientes */}
          <Route path="/dashboard/clientes" element={<AppLayout />}>
            <Route index element={<Clientes />} />
          </Route>
          <Route path="/dashboard/novo-cliente" element={<AppLayout />}>
            <Route index element={<NovoCliente />} />
          </Route>
          <Route path="/dashboard/novo-cliente/:id" element={<AppLayout />}>
            <Route index element={<NovoCliente />} />
          </Route>
          
          {/* Relatórios */}
          <Route path="/dashboard/relatorios" element={<AppLayout />}>
            <Route index element={<Relatorios />} />
          </Route>
          
          {/* Financeiro */}
          <Route path="/dashboard/financeiro" element={<AppLayout />}>
            <Route index element={<Financeiro />} />
          </Route>
          <Route path="/dashboard/nova-transacao" element={<AppLayout />}>
            <Route index element={<NovaTransacao />} />
          </Route>
          
          {/* NFe */}
          <Route path="/dashboard/nfe" element={<AppLayout />}>
            <Route index element={<NFe />} />
          </Route>
          
          {/* Configurações */}
          <Route path="/dashboard/configuracoes" element={<AppLayout />}>
            <Route index element={<Configuracoes />} />
          </Route>
          
          {/* Fornecedores */}
          <Route path="/dashboard/fornecedores" element={<AppLayout />}>
            <Route index element={<Fornecedores />} />
          </Route>
          <Route path="/dashboard/novo-fornecedor" element={<AppLayout />}>
            <Route index element={<NovoFornecedor />} />
          </Route>
          <Route path="/dashboard/novo-fornecedor/:id" element={<AppLayout />}>
            <Route index element={<NovoFornecedor />} />
          </Route>
          
          {/* Funcionários */}
          <Route path="/dashboard/funcionarios" element={<AppLayout />}>
            <Route index element={<Funcionarios />} />
          </Route>
          <Route path="/dashboard/novo-funcionario" element={<AppLayout />}>
            <Route index element={<NovoFuncionario />} />
          </Route>
          <Route path="/dashboard/novo-funcionario/:id" element={<AppLayout />}>
            <Route index element={<NovoFuncionario />} />
          </Route>
          
          {/* Rota 404 */}
          <Route path="*" element={<PaginaNaoEncontrada />} />
        </Routes>
      </HashRouter>
      
      <NotificationContainer 
        notifications={notifications} 
        onClose={removeNotification} 
      />
      <Toaster />
      <Sonner />
    </>
  );
}

const App = () => {
  // Debug: Log the Google Client ID
  console.log('🔑 Google Client ID (Electron Simple):', import.meta.env.VITE_GOOGLE_CLIENT_ID);
  
  return (
    <QueryClientProvider client={clienteQuery}>
      <TooltipProvider>
        <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ''}>
          <OperadorProvider>
            <AppContent />
          </OperadorProvider>
        </GoogleOAuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
