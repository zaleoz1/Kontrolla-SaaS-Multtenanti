
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useCrudApi } from "@/hooks/useApi";
import { API_ENDPOINTS } from "@/config/api";
import { 
  Plus, 
  Search, 
  Filter, 
  Package,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Loader2,
  RefreshCw
} from "lucide-react";

interface Produto {
  id: number;
  nome: string;
  descricao?: string;
  preco: number;
  preco_promocional?: number;
  estoque: number;
  estoque_minimo: number;
  codigo_barras?: string;
  sku?: string;
  status: 'ativo' | 'inativo' | 'rascunho';
  categoria_nome?: string;
  marca?: string;
  modelo?: string;
  imagens?: string[];
  destaque: boolean;
  data_criacao: string;
  data_atualizacao: string;
}

interface ProdutosResponse {
  produtos: Produto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export default function Produtos() {
  const [termoBusca, setTermoBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [paginaAtual, setPaginaAtual] = useState(1);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const produtosApi = useCrudApi<ProdutosResponse>(API_ENDPOINTS.PRODUCTS.LIST);
  const deleteApi = useCrudApi(API_ENDPOINTS.PRODUCTS.LIST);

  // Carregar produtos
  useEffect(() => {
    carregarProdutos();
  }, [paginaAtual, termoBusca, filtroStatus, filtroCategoria]);

  const carregarProdutos = async () => {
    try {
      const params: Record<string, any> = {
        page: paginaAtual,
        limit: 12,
      };

      if (termoBusca) params.q = termoBusca;
      if (filtroStatus) params.status = filtroStatus;
      if (filtroCategoria) params.categoria_id = filtroCategoria;

      await produtosApi.list(params);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os produtos. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleExcluirProduto = async (id: number, nome: string) => {
    if (!confirm(`Tem certeza que deseja excluir o produto "${nome}"?`)) {
      return;
    }

    try {
      await deleteApi.remove(id);
      toast({
        title: "Sucesso",
        description: "Produto excluído com sucesso!",
      });
      carregarProdutos();
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o produto. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const obterBadgeStatus = (produto: Produto) => {
    if (produto.status !== 'ativo') {
      return <Badge variant="secondary">Inativo</Badge>;
    }

    if (produto.estoque === 0) {
      return <Badge variant="destructive">Sem Estoque</Badge>;
    }

    if (produto.estoque <= produto.estoque_minimo) {
      return <Badge className="bg-warning/80 text-warning-foreground border-warning/30">Estoque Baixo</Badge>;
    }

    return <Badge className="bg-success hover:bg-success/90">Em Estoque</Badge>;
  };

  const formatarPreco = (preco: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(preco);
  };

  const produtos = produtosApi.data?.produtos || [];
  const pagination = produtosApi.data?.pagination;

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
                placeholder="Buscar por nome, descrição ou código..."
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex space-x-2">
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                <option value="">Todos os status</option>
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
                <option value="rascunho">Rascunho</option>
              </select>
              <Button 
                variant="outline" 
                onClick={carregarProdutos}
                disabled={produtosApi.loading}
              >
                {produtosApi.loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Atualizar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {produtosApi.loading && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <Card key={index} className="bg-gradient-card shadow-card">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
                <div className="flex space-x-2 pt-2">
                  <Skeleton className="h-8 flex-1" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Error State */}
      {produtosApi.error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {produtosApi.error}
          </AlertDescription>
        </Alert>
      )}

      {/* Grid de Produtos */}
      {!produtosApi.loading && !produtosApi.error && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {produtos.map((produto) => (
            <Card key={produto.id} className="bg-gradient-card shadow-card hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Package className="h-6 w-6 text-primary" />
                  </div>
                  {obterBadgeStatus(produto)}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg line-clamp-2">{produto.nome}</h3>
                  <p className="text-sm text-muted-foreground">{produto.categoria_nome || 'Sem categoria'}</p>
                  {produto.marca && (
                    <p className="text-xs text-muted-foreground">{produto.marca}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Preço:</span>
                    <div className="text-right">
                      <span className="font-semibold text-primary">
                        {formatarPreco(produto.preco_promocional || produto.preco)}
                      </span>
                      {produto.preco_promocional && produto.preco_promocional < produto.preco && (
                        <div className="text-xs text-muted-foreground line-through">
                          {formatarPreco(produto.preco)}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Estoque:</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{produto.estoque} un.</span>
                      {produto.estoque <= produto.estoque_minimo && produto.estoque > 0 && (
                        <AlertTriangle className="h-4 w-4 text-warning" />
                      )}
                      {produto.estoque > produto.estoque_minimo && (
                        <CheckCircle className="h-4 w-4 text-success" />
                      )}
                    </div>
                  </div>

                  {produto.codigo_barras && (
                    <div className="text-xs text-muted-foreground">
                      Código: {produto.codigo_barras}
                    </div>
                  )}
                  {produto.sku && (
                    <div className="text-xs text-muted-foreground">
                      SKU: {produto.sku}
                    </div>
                  )}
                </div>

                <div className="flex space-x-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => navigate(`/dashboard/novo-produto/${produto.id}`)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleExcluirProduto(produto.id, produto.nome)}
                    disabled={deleteApi.loading}
                  >
                    {deleteApi.loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!produtosApi.loading && !produtosApi.error && produtos.length === 0 && (
        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum produto encontrado</h3>
            <p className="text-muted-foreground mb-4">
              {termoBusca || filtroStatus || filtroCategoria 
                ? "Tente ajustar sua busca ou filtros" 
                : "Adicione seu primeiro produto"
              }
            </p>
            <Button 
              className="bg-gradient-primary"
              onClick={() => navigate("/dashboard/novo-produto")}
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Produto
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Paginação */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Mostrando {((pagination.page - 1) * pagination.limit) + 1} a {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} produtos
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPaginaAtual(paginaAtual - 1)}
              disabled={!pagination.hasPrev || produtosApi.loading}
            >
              Anterior
            </Button>
            <span className="px-3 py-2 text-sm">
              Página {pagination.page} de {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPaginaAtual(paginaAtual + 1)}
              disabled={!pagination.hasNext || produtosApi.loading}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}