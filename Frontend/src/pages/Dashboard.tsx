import { CartaoMetrica } from "@/components/dashboard/MetricsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, 
  ShoppingCart, 
  Package, 
  Users,
  AlertTriangle,
  Eye,
  TrendingUp,
  Calendar
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();
  
  const metricas = [
    {
      titulo: "Vendas Hoje",
      valor: "R$ 2.847,50",
      mudanca: "+12.5%",
      tipoMudanca: "positiva" as const,
      icone: DollarSign,
      descricao: "vs. ontem"
    },
    {
      titulo: "Pedidos",
      valor: "23",
      mudanca: "+8",
      tipoMudanca: "positiva" as const,
      icone: ShoppingCart,
      descricao: "pedidos hoje"
    },
    {
      titulo: "Produtos",
      valor: "156",
      mudanca: "3 em falta",
      tipoMudanca: "negativa" as const,
      icone: Package,
      descricao: "no estoque"
    },
    {
      titulo: "Clientes",
      valor: "842",
      mudanca: "+24",
      tipoMudanca: "positiva" as const,
      icone: Users,
      descricao: "este mês"
    }
  ];

  const vendasRecentes = [
    { id: "001", cliente: "João Silva", valor: "R$ 189,50", status: "Pago", hora: "10:30" },
    { id: "002", cliente: "Maria Santos", valor: "R$ 349,90", status: "Pendente", hora: "10:15" },
    { id: "003", cliente: "Carlos Lima", valor: "R$ 89,00", status: "Pago", hora: "09:45" },
    { id: "004", cliente: "Ana Costa", valor: "R$ 567,30", status: "Pago", hora: "09:20" },
  ];

  const produtosEstoqueBaixo = [
    { nome: "Smartphone Galaxy", estoque: 2, minimo: 10 },
    { nome: "Fone Bluetooth", estoque: 1, minimo: 15 },
    { nome: "Carregador USB-C", estoque: 0, minimo: 20 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Bem-vindo de volta! Aqui está o resumo da sua loja hoje.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button size="sm" className="bg-gradient-primary" onClick={() => navigate("/relatorios")}>
            <TrendingUp className="h-4 w-4 mr-2" />
            Ver Relatórios
          </Button>
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metricas.map((metrica, index) => (
          <CartaoMetrica key={index} {...metrica} />
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Vendas Recentes */}
        <Card className="md:col-span-2 bg-gradient-card shadow-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Vendas Recentes</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate("/vendas")}>
                <Eye className="h-4 w-4 mr-2" />
                Ver Todas
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {vendasRecentes.map((venda) => (
                <div key={venda.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border">
                  <div className="space-y-1">
                    <p className="font-medium">{venda.cliente}</p>
                    <p className="text-sm text-muted-foreground">Pedido #{venda.id} • {venda.hora}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="font-semibold">{venda.valor}</p>
                    <Badge 
                      variant={venda.status === "Pago" ? "default" : "secondary"}
                      className={venda.status === "Pago" ? "bg-success hover:bg-success/90" : ""}
                    >
                      {venda.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Alerta de Estoque Baixo */}
        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-warning" />
              Estoque Baixo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {produtosEstoqueBaixo.map((produto, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm">{produto.nome}</p>
                    <Badge 
                      variant={produto.estoque === 0 ? "destructive" : "secondary"}
                      className={produto.estoque === 0 ? "" : "bg-warning/20 text-warning-foreground border-warning/30"}
                    >
                      {produto.estoque} un.
                    </Badge>
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <span>Mín: {produto.minimo}</span>
                  </div>
                  {index < produtosEstoqueBaixo.length - 1 && (
                    <div className="border-t border-border/50" />
                  )}
                </div>
              ))}
              <Button size="sm" variant="outline" className="w-full mt-4" onClick={() => navigate("/produtos")}>
                Gerenciar Estoque
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}