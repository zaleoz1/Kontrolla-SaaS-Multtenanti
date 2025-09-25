
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  tipo_preco: 'unidade' | 'kg' | 'litros';
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

interface Categoria {
  id: number;
  nome: string;
  descricao: string;
  total_produtos: number;
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
  const [filtroEstoque, setFiltroEstoque] = useState("");
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [produtoParaExcluir, setProdutoParaExcluir] = useState<{id: number, nome: string} | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const produtosApi = useCrudApi<ProdutosResponse>(API_ENDPOINTS.PRODUCTS.LIST);
  const deleteApi = useCrudApi(API_ENDPOINTS.PRODUCTS.LIST);
  const categoriasApi = useCrudApi<{categorias: Categoria[]}>(API_ENDPOINTS.CATALOG.CATEGORIES);

  // Carregar categorias e produtos
  useEffect(() => {
    carregarCategorias();
    carregarProdutos();
  }, [termoBusca, filtroStatus, filtroCategoria]);
  // filtroEstoque não precisa recarregar a API pois é filtrado no frontend

  const carregarCategorias = async () => {
    try {
      const response = await categoriasApi.list();
      setCategorias(response.categorias || []);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      // Não mostrar toast de erro para categorias pois não é crítico
    }
  };

  const carregarProdutos = async () => {
    try {
      const params: Record<string, any> = {
        limit: 100, // Limite máximo permitido pelo backend
      };

      if (termoBusca) params.q = termoBusca;
      if (filtroStatus) params.status = filtroStatus;
      if (filtroCategoria) params.categoria_id = filtroCategoria;
      // Removido filtroEstoque da API - será filtrado no frontend

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

  const handleExcluirProduto = (id: number, nome: string) => {
    setProdutoParaExcluir({ id, nome });
    setShowDeleteDialog(true);
  };

  const confirmarExclusao = async () => {
    if (!produtoParaExcluir) return;

    try {
      await deleteApi.remove(produtoParaExcluir.id);
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
    } finally {
      setShowDeleteDialog(false);
      setProdutoParaExcluir(null);
    }
  };

  const cancelarExclusao = () => {
    setShowDeleteDialog(false);
    setProdutoParaExcluir(null);
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

  const obterUnidadeEstoque = (tipo_preco: string) => {
    switch (tipo_preco) {
      case 'kg':
        return 'kg';
      case 'litros':
        return 'L';
      case 'unidade':
      default:
        return 'un.';
    }
  };

  const todosProdutos = produtosApi.data?.produtos || [];

  // Filtrar produtos baseado no filtro de estoque
  const filtrarProdutosPorEstoque = (produtos: Produto[]) => {
    if (!filtroEstoque) return produtos;

    switch (filtroEstoque) {
      case 'disponivel':
        return produtos.filter(p => p.estoque > p.estoque_minimo);
      case 'estoque_baixo':
        return produtos.filter(p => p.estoque > 0 && p.estoque <= p.estoque_minimo);
      case 'sem_estoque':
        return produtos.filter(p => p.estoque === 0);
      default:
        return produtos;
    }
  };

  const produtos = filtrarProdutosPorEstoque(todosProdutos);

  // Calcular métricas dos produtos (usando todos os produtos, não apenas os filtrados)
  const calcularMetricas = () => {
    const total = todosProdutos.length;
    const semEstoque = todosProdutos.filter(p => p.estoque === 0).length;
    const estoqueBaixo = todosProdutos.filter(p => p.estoque > 0 && p.estoque <= p.estoque_minimo).length;
    const disponiveis = todosProdutos.filter(p => p.estoque > p.estoque_minimo).length;
    
    return { total, semEstoque, estoqueBaixo, disponiveis };
  };

  const metricas = calcularMetricas();

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

      {/* Card de Métricas */}
      {!produtosApi.loading && !produtosApi.error && !categoriasApi.loading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-card shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total de Produtos</p>
                  <p className="text-2xl font-bold text-primary">{metricas.total}</p>
                </div>
                <div className="p-2 rounded-lg bg-primary/10">
                  <Package className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Disponíveis</p>
                  <p className="text-2xl font-bold text-success">{metricas.disponiveis}</p>
                </div>
                <div className="p-2 rounded-lg bg-success/10">
                  <CheckCircle className="h-6 w-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Estoque Baixo</p>
                  <p className="text-2xl font-bold text-warning">{metricas.estoqueBaixo}</p>
                </div>
                <div className="p-2 rounded-lg bg-warning/10">
                  <AlertTriangle className="h-6 w-6 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Sem Estoque</p>
                  <p className="text-2xl font-bold text-destructive">{metricas.semEstoque}</p>
                </div>
                <div className="p-2 rounded-lg bg-destructive/10">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
              <select
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
                className="px-3 py-2 border border-input bg-background rounded-md text-sm"
                disabled={categoriasApi.loading}
              >
                <option value="">Todas as categorias</option>
                {categorias.map((categoria) => (
                  <option key={categoria.id} value={categoria.id}>
                    {categoria.nome} ({categoria.total_produtos})
                  </option>
                ))}
              </select>
              <select
                value={filtroEstoque}
                onChange={(e) => setFiltroEstoque(e.target.value)}
                className="px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                <option value="">Todos os estoques</option>
                <option value="disponivel">Disponíveis</option>
                <option value="estoque_baixo">Estoque Baixo</option>
                <option value="sem_estoque">Sem Estoque</option>
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
      {(produtosApi.loading || categoriasApi.loading) && (
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
      {!produtosApi.loading && !produtosApi.error && !categoriasApi.loading && (
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
                      <span className="font-medium">
                        {produto.estoque} {obterUnidadeEstoque(produto.tipo_preco)}
                      </span>
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
      {!produtosApi.loading && !produtosApi.error && !categoriasApi.loading && produtos.length === 0 && (
        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum produto encontrado</h3>
            <p className="text-muted-foreground mb-4">
              {termoBusca || filtroStatus || filtroCategoria || filtroEstoque
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

      {/* Modal de Confirmação de Exclusão */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Confirmar Exclusão
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o produto <strong>"{produtoParaExcluir?.nome}"</strong>?
              <br />
              <span className="text-sm text-muted-foreground mt-2 block">
                Esta ação não pode ser desfeita.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelarExclusao} disabled={deleteApi.loading}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmarExclusao}
              disabled={deleteApi.loading}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteApi.loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}