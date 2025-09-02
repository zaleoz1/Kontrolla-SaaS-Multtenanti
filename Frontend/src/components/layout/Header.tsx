import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Bell, Search, Plus, Menu, Package, Users, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

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
          <Button variant="outline" size="sm" className="gap-2" onClick={() => navigate("/nova-venda")}>
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

          {/* Informações da loja e status online */}
          <div className="flex items-center space-x-2">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">Loja Principal</p>
              <p className="text-xs text-muted-foreground">Online</p>
            </div>
            <div className="h-2 w-2 rounded-full bg-success"></div>
          </div>
        </div>
      </div>
    </header>
  );
}