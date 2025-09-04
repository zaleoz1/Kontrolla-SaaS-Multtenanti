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
  Package,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle
} from "lucide-react";

export default function Produtos() {
  const [termoBusca, setTermoBusca] = useState("");
  const navigate = useNavigate();

  const produtos = [
    {
      id: 1,
      nome: "Smartphone Galaxy S24",
      categoria: "Eletrônicos",
      preco: "R$ 2.499,00",
      estoque: 15,
      estoqueMinimo: 10,
      codigoBarras: "7891234567890",
      status: "ativo",
      imagem: "/api/placeholder/100/100"
    },
    {
      id: 2,
      nome: "Fone Bluetooth Premium",
      categoria: "Acessórios",
      preco: "R$ 299,90",
      estoque: 3,
      estoqueMinimo: 15,
      codigoBarras: "7891234567891",
      status: "estoque_baixo",
      imagem: "/api/placeholder/100/100"
    },
    {
      id: 3,
      nome: "Carregador USB-C 65W",
      categoria: "Acessórios",
      preco: "R$ 89,90",
      estoque: 0,
      estoqueMinimo: 20,
      codigoBarras: "7891234567892",
      status: "sem_estoque",
      imagem: "/api/placeholder/100/100"
    },
    {
      id: 4,
      nome: "Tablet Android 11",
      categoria: "Eletrônicos",
      preco: "R$ 1.299,00",
      estoque: 8,
      estoqueMinimo: 5,
      codigoBarras: "7891234567893",
      status: "ativo",
      imagem: "/api/placeholder/100/100"
    }
  ];

  const obterBadgeStatus = (status: string, estoque: number) => {
    switch (status) {
      case "ativo":
        return <Badge className="bg-success hover:bg-success/90">Em Estoque</Badge>;
      case "estoque_baixo":
        return <Badge className="bg-warning/80 text-warning-foreground border-warning/30">Estoque Baixo</Badge>;
      case "sem_estoque":
        return <Badge variant="destructive">Sem Estoque</Badge>;
      default:
        return <Badge variant="secondary">Inativo</Badge>;
    }
  };

  const produtosFiltrados = produtos.filter(produto =>
    produto.nome.toLowerCase().includes(termoBusca.toLowerCase()) ||
    produto.categoria.toLowerCase().includes(termoBusca.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold">Produtos</h1>
          <p className="text-muted-foreground">
            Gerencie seu catálogo de produtos
          </p>
        </div>
        <Button className="bg-gradient-primary" onClick={() => navigate("/dashboard/novo-produto")}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Produto
        </Button>
      </div>

      {/* Filtros */}
      <Card className="bg-gradient-card shadow-card">
        <CardContent className="p-6">
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-y-0 md:space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou categoria..."
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

      {/* Grid de Produtos */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {produtosFiltrados.map((produto) => (
          <Card key={produto.id} className="bg-gradient-card shadow-card hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                {obterBadgeStatus(produto.status, produto.estoque)}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg line-clamp-2">{produto.nome}</h3>
                <p className="text-sm text-muted-foreground">{produto.categoria}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Preço:</span>
                  <span className="font-semibold text-primary">{produto.preco}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Estoque:</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{produto.estoque} un.</span>
                    {produto.estoque <= produto.estoqueMinimo && (
                      <AlertTriangle className="h-4 w-4 text-warning" />
                    )}
                    {produto.estoque > produto.estoqueMinimo && (
                      <CheckCircle className="h-4 w-4 text-success" />
                    )}
                  </div>
                </div>

                <div className="text-xs text-muted-foreground">
                  Código: {produto.codigoBarras}
                </div>
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

      {produtosFiltrados.length === 0 && (
        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum produto encontrado</h3>
            <p className="text-muted-foreground mb-4">
              {termoBusca ? "Tente ajustar sua busca" : "Adicione seu primeiro produto"}
            </p>
            <Button className="bg-gradient-primary">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Produto
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}