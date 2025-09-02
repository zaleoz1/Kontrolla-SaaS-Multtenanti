import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Search, 
  Filter, 
  ShoppingCart,
  Calendar,
  DollarSign,
  User,
  Receipt,
  Eye,
  CreditCard,
  Banknote,
  Smartphone
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Vendas() {
  const [termoBusca, setTermoBusca] = useState("");
  const navigate = useNavigate();

  const vendas = [
    {
      id: "VD001",
      cliente: "João Silva",
      data: "2024-01-18",
      hora: "14:30",
      itens: 3,
      total: "R$ 847,90",
      pagamento: "PIX",
      status: "concluida",
      produtos: ["Smartphone Galaxy", "Fone Bluetooth", "Carregador"]
    },
    {
      id: "VD002", 
      cliente: "Maria Santos",
      data: "2024-01-18",
      hora: "13:45",
      itens: 1,
      total: "R$ 299,90",
      pagamento: "Cartão",
      status: "concluida",
      produtos: ["Fone Bluetooth Premium"]
    },
    {
      id: "VD003",
      cliente: "Carlos Lima", 
      data: "2024-01-18",
      hora: "12:20",
      itens: 2,
      total: "R$ 189,80",
      pagamento: "Dinheiro",
      status: "concluida",
      produtos: ["Carregador USB-C", "Cabo Lightning"]
    },
    {
      id: "VD004",
      cliente: "Ana Costa",
      data: "2024-01-18", 
      hora: "11:15",
      itens: 1,
      total: "R$ 2.499,00",
      pagamento: "PIX",
      status: "pendente",
      produtos: ["Smartphone Galaxy S24"]
    }
  ];

  const obterBadgeStatus = (status: string) => {
    switch (status) {
      case "concluida":
        return <Badge className="bg-success hover:bg-success/90">Concluída</Badge>;
      case "pendente":
        return <Badge className="bg-warning/80 text-warning-foreground">Pendente</Badge>;
      case "cancelada":
        return <Badge variant="destructive">Cancelada</Badge>;
      default:
        return <Badge variant="secondary">Desconhecido</Badge>;
    }
  };

  const obterIconePagamento = (pagamento: string) => {
    switch (pagamento.toLowerCase()) {
      case "pix":
        return <Smartphone className="h-4 w-4" />;
      case "cartão":
        return <CreditCard className="h-4 w-4" />;
      case "dinheiro":
        return <Banknote className="h-4 w-4" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  const vendasFiltradas = vendas.filter(venda =>
    venda.cliente.toLowerCase().includes(termoBusca.toLowerCase()) ||
    venda.id.toLowerCase().includes(termoBusca.toLowerCase())
  );

  const totalVendas = vendas.reduce((acc, venda) => {
    const valor = parseFloat(venda.total.replace("R$ ", "").replace(".", "").replace(",", "."));
    return acc + valor;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold">Vendas</h1>
          <p className="text-muted-foreground">
            Gerencie suas vendas e transações
          </p>
        </div>
        <Button className="bg-gradient-primary" onClick={() => navigate("/nova-venda")}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Venda
        </Button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Hoje</p>
                <p className="text-2xl font-bold">
                  {totalVendas.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL"
                  })}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-primary/10">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Vendas</p>
                <p className="text-2xl font-bold">{vendas.length}</p>
              </div>
              <div className="p-2 rounded-lg bg-secondary/10">
                <ShoppingCart className="h-5 w-5 text-secondary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ticket Médio</p>
                <p className="text-2xl font-bold">
                  {(totalVendas / vendas.length).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL"
                  })}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-accent/10">
                <Receipt className="h-5 w-5 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Clientes</p>
                <p className="text-2xl font-bold">{new Set(vendas.map(v => v.cliente)).size}</p>
              </div>
              <div className="p-2 rounded-lg bg-info/10">
                <User className="h-5 w-5 text-info" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="bg-gradient-card shadow-card">
        <CardContent className="p-6">
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-y-0 md:space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente ou ID da venda..."
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              Período
            </Button>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Vendas */}
      <div className="space-y-4">
        {vendasFiltradas.map((venda) => (
          <Card key={venda.id} className="bg-gradient-card shadow-card hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
                <div className="flex items-center space-x-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <ShoppingCart className="h-6 w-6 text-primary" />
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold">#{venda.id}</h3>
                      {obterBadgeStatus(venda.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">{venda.cliente}</p>
                    <p className="text-xs text-muted-foreground">
                      {venda.data} às {venda.hora} • {venda.itens} {venda.itens === 1 ? 'item' : 'itens'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">{venda.total}</p>
                    <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                      {obterIconePagamento(venda.pagamento)}
                      <span>{venda.pagamento}</span>
                    </div>
                  </div>

                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Detalhes
                  </Button>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-border/50">
                <p className="text-sm text-muted-foreground">
                  <strong>Produtos:</strong> {venda.produtos.join(", ")}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {vendasFiltradas.length === 0 && (
        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-12 text-center">
            <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma venda encontrada</h3>
            <p className="text-muted-foreground mb-4">
              {termoBusca ? "Tente ajustar sua busca" : "Registre sua primeira venda"}
            </p>
            <Button className="bg-gradient-primary" onClick={() => navigate("/nova-venda")}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Venda
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}