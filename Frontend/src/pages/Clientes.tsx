import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Search, 
  Filter, 
  Users,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ShoppingBag,
  Edit,
  Trash2,
  Star,
  UserPlus
} from "lucide-react";

export default function Clientes() {
  const [termoBusca, setTermoBusca] = useState("");
  const navigate = useNavigate();

  const clientes = [
    {
      id: 1,
      nome: "João Silva",
      email: "joao.silva@email.com",
      telefone: "(11) 99999-8888",
      endereco: "Rua das Flores, 123 - São Paulo, SP",
      dataCadastro: "2024-01-15",
      totalCompras: "R$ 2.847,50",
      ultimaCompra: "2024-01-18",
      status: "ativo",
      vip: true,
      compras: 8,
      avaliacao: 5
    },
    {
      id: 2,
      nome: "Maria Santos",
      email: "maria.santos@email.com", 
      telefone: "(11) 98888-7777",
      endereco: "Av. Paulista, 456 - São Paulo, SP",
      dataCadastro: "2024-01-10",
      totalCompras: "R$ 1.299,80",
      ultimaCompra: "2024-01-17",
      status: "ativo",
      vip: false,
      compras: 4,
      avaliacao: 4
    },
    {
      id: 3,
      nome: "Carlos Lima",
      email: "carlos.lima@email.com",
      telefone: "(11) 97777-6666", 
      endereco: "Rua Augusta, 789 - São Paulo, SP",
      dataCadastro: "2023-12-20",
      totalCompras: "R$ 567,30",
      ultimaCompra: "2024-01-16",
      status: "ativo",
      vip: false,
      compras: 3,
      avaliacao: 4
    },
    {
      id: 4,
      nome: "Ana Costa",
      email: "ana.costa@email.com",
      telefone: "(11) 96666-5555",
      endereco: "Rua da Consolação, 321 - São Paulo, SP", 
      dataCadastro: "2023-11-05",
      totalCompras: "R$ 189,50",
      ultimaCompra: "2023-12-28",
      status: "inativo",
      vip: false,
      compras: 1,
      avaliacao: 3
    }
  ];

  const obterBadgeStatus = (status: string) => {
    switch (status) {
      case "ativo":
        return <Badge className="bg-success hover:bg-success/90">Ativo</Badge>;
      case "inativo":
        return <Badge variant="secondary">Inativo</Badge>;
      default:
        return <Badge variant="secondary">Desconhecido</Badge>;
    }
  };

  const clientesFiltrados = clientes.filter(cliente =>
    cliente.nome.toLowerCase().includes(termoBusca.toLowerCase()) ||
    cliente.email.toLowerCase().includes(termoBusca.toLowerCase()) ||
    cliente.telefone.includes(termoBusca)
  );

  const clientesAtivos = clientes.filter(c => c.status === "ativo").length;
  const clientesVip = clientes.filter(c => c.vip).length;
  const receitaTotal = clientes.reduce((acc, cliente) => {
    const valor = parseFloat(cliente.totalCompras.replace("R$ ", "").replace(".", "").replace(",", "."));
    return acc + valor;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold">Clientes</h1>
          <p className="text-muted-foreground">
            Gerencie seus clientes e relacionamentos
          </p>
        </div>
        <Button className="bg-gradient-primary" onClick={() => navigate("/dashboard/novo-cliente")}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Cliente
        </Button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Clientes</p>
                <p className="text-2xl font-bold">{clientes.length}</p>
              </div>
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Clientes Ativos</p>
                <p className="text-2xl font-bold">{clientesAtivos}</p>
              </div>
              <div className="p-2 rounded-lg bg-success/10">
                <UserPlus className="h-5 w-5 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Clientes VIP</p>
                <p className="text-2xl font-bold">{clientesVip}</p>
              </div>
              <div className="p-2 rounded-lg bg-warning/10">
                <Star className="h-5 w-5 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Receita Total</p>
                <p className="text-2xl font-bold">
                  {receitaTotal.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL"
                  })}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-accent/10">
                <ShoppingBag className="h-5 w-5 text-accent" />
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
                placeholder="Buscar por nome, email ou telefone..."
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Clientes */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {clientesFiltrados.map((cliente) => (
          <Card key={cliente.id} className="bg-gradient-card shadow-card hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 rounded-full bg-gradient-primary flex items-center justify-center">
                    <span className="text-lg font-bold text-white">
                      {cliente.nome.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold flex items-center space-x-2">
                      <span>{cliente.nome}</span>
                      {cliente.vip && <Star className="h-4 w-4 text-warning fill-warning" />}
                    </h3>
                    <div className="flex items-center space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`h-3 w-3 ${i < cliente.avaliacao ? 'text-warning fill-warning' : 'text-muted-foreground'}`} 
                        />
                      ))}
                    </div>
                  </div>
                </div>
                {obterBadgeStatus(cliente.status)}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span className="truncate">{cliente.email}</span>
                </div>
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{cliente.telefone}</span>
                </div>
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span className="truncate">{cliente.endereco}</span>
                </div>
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Cliente desde {new Date(cliente.dataCadastro).toLocaleDateString("pt-BR")}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Total Gasto</p>
                  <p className="font-semibold text-primary">{cliente.totalCompras}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Compras</p>
                  <p className="font-semibold">{cliente.compras}</p>
                </div>
              </div>

              <div className="text-xs text-muted-foreground">
                Última compra: {new Date(cliente.ultimaCompra).toLocaleDateString("pt-BR")}
              </div>

              <div className="flex space-x-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
                <Button variant="outline" size="sm">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {clientesFiltrados.length === 0 && (
        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum cliente encontrado</h3>
            <p className="text-muted-foreground mb-4">
              {termoBusca ? "Tente ajustar sua busca" : "Adicione seu primeiro cliente"}
            </p>
            <Button className="bg-gradient-primary" onClick={() => navigate("/dashboard/novo-cliente")}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Cliente
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}