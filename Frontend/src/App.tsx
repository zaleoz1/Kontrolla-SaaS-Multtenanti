import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Produtos from "./pages/Produtos";
import Vendas from "./pages/Vendas";
import NovaVenda from "./pages/NovaVenda";
import Catalogo from "./pages/Catalogo";
import Clientes from "./pages/Clientes";
import Relatorios from "./pages/Relatorios";
import Financeiro from "./pages/Financeiro";
import NFe from "./pages/NFe";
import NovoProduto from "./pages/NovoProduto";
import NovoCliente from "./pages/NovoCliente";
import NovaTransacao from "./pages/NovaTransacao";
import PaginaNaoEncontrada from "./pages/NotFound";

const clienteQuery = new QueryClient();

const App = () => (
  <QueryClientProvider client={clienteQuery}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="produtos" element={<Produtos />} />
            <Route path="novo-produto" element={<NovoProduto />} />
            <Route path="vendas" element={<Vendas />} />
            <Route path="nova-venda" element={<NovaVenda />} />
            <Route path="catalogo" element={<Catalogo />} />
            <Route path="clientes" element={<Clientes />} />
            <Route path="novo-cliente" element={<NovoCliente />} />
            <Route path="relatorios" element={<Relatorios />} />
            <Route path="financeiro" element={<Financeiro />} />
            <Route path="nova-transacao" element={<NovaTransacao />} />
            <Route path="nfe" element={<NFe />} />
          </Route>
          <Route path="*" element={<PaginaNaoEncontrada />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
