
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
import { usePermissions } from "@/hooks/usePermissions";
import { useNotificationContext } from "@/contexts/NotificationContext";
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
  // Novos campos para estoque decimal
  estoque_kg?: number;
  estoque_litros?: number;
  estoque_minimo_kg?: number;
  estoque_minimo_litros?: number;
  // Campos calculados
  estoque_atual?: number;
  estoque_minimo_atual?: number;
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
  const { hasPermission } = usePermissions();
  
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

    const estoqueAtual = obterEstoqueAtual(produto);
    const estoqueMinimoAtual = obterEstoqueMinimoAtual(produto);

    // Verificar se os valores são válidos
    if (estoqueAtual === null || estoqueAtual === undefined || isNaN(estoqueAtual)) {
      return <Badge variant="destructive">Sem Estoque</Badge>;
    }

    if (estoqueAtual === 0) {
      return <Badge variant="destructive">Sem Estoque</Badge>;
    }

    // Só considerar estoque baixo se o estoque mínimo for válido e maior que 0
    if (estoqueMinimoAtual && estoqueMinimoAtual > 0 && estoqueAtual <= estoqueMinimoAtual) {
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

  const obterTipoEstoqueTexto = (tipo_preco: string) => {
    switch (tipo_preco) {
      case 'kg':
        return 'Peso';
      case 'litros':
        return 'Volume';
      case 'unidade':
      default:
        return 'Quantidade';
    }
  };

  const formatarEstoque = (produto: Produto) => {
    const estoqueAtual = obterEstoqueAtual(produto);
    const unidade = obterUnidadeEstoque(produto.tipo_preco);
    
    if (produto.tipo_preco === 'unidade') {
      return `${Math.round(estoqueAtual)} ${unidade}`;
    } else {
      // Para kg e litros, manter casas decimais mas limitar a 3 casas
      return `${Number(estoqueAtual).toFixed(3).replace(/\.?0+$/, '')} ${unidade}`;
    }
  };

  const obterEstoqueAtual = (produto: Produto) => {
    // Priorizar estoque_atual calculado pelo backend
    if (produto.estoque_atual !== undefined && produto.estoque_atual !== null) {
      return parseFloat(String(produto.estoque_atual)) || 0;
    }
    
    // Fallback para campos específicos baseado no tipo
    switch (produto.tipo_preco) {
      case 'kg':
        return parseFloat(String(produto.estoque_kg)) || 0;
      case 'litros':
        return parseFloat(String(produto.estoque_litros)) || 0;
      case 'unidade':
      default:
        return parseFloat(String(produto.estoque)) || 0;
    }
  };

  const obterEstoqueMinimoAtual = (produto: Produto) => {
    // Priorizar estoque_minimo_atual calculado pelo backend
    if (produto.estoque_minimo_atual !== undefined && produto.estoque_minimo_atual !== null) {
      return parseFloat(String(produto.estoque_minimo_atual)) || 0;
    }
    
    // Fallback para campos específicos baseado no tipo
    switch (produto.tipo_preco) {
      case 'kg':
        return parseFloat(String(produto.estoque_minimo_kg)) || 0;
      case 'litros':
        return parseFloat(String(produto.estoque_minimo_litros)) || 0;
      case 'unidade':
      default:
        return parseFloat(String(produto.estoque_minimo)) || 0;
    }
  };

  const todosProdutos = produtosApi.data?.produtos || [];

  // Filtrar produtos baseado no filtro de estoque
  const filtrarProdutosPorEstoque = (produtos: Produto[]) => {
    if (!filtroEstoque) return produtos;

    switch (filtroEstoque) {
      case 'disponivel':
        return produtos.filter(p => {
          const estoqueAtual = obterEstoqueAtual(p);
          const estoqueMinimoAtual = obterEstoqueMinimoAtual(p);
          return estoqueAtual > 0 && (!estoqueMinimoAtual || estoqueMinimoAtual <= 0 || estoqueAtual > estoqueMinimoAtual);
        });
      case 'estoque_baixo':
        return produtos.filter(p => {
          const estoqueAtual = obterEstoqueAtual(p);
          const estoqueMinimoAtual = obterEstoqueMinimoAtual(p);
          return estoqueAtual > 0 && estoqueMinimoAtual > 0 && estoqueAtual <= estoqueMinimoAtual;
        });
      case 'sem_estoque':
        return produtos.filter(p => obterEstoqueAtual(p) === 0);
      default:
        return produtos;
    }
  };

  const produtos = filtrarProdutosPorEstoque(todosProdutos);

  // Calcular métricas dos produtos (usando todos os produtos, não apenas os filtrados)
  const calcularMetricas = () => {
    const total = todosProdutos.length;
    const semEstoque = todosProdutos.filter(p => obterEstoqueAtual(p) === 0).length;
    const estoqueBaixo = todosProdutos.filter(p => {
      const estoqueAtual = obterEstoqueAtual(p);
      const estoqueMinimoAtual = obterEstoqueMinimoAtual(p);
      return estoqueAtual > 0 && estoqueMinimoAtual > 0 && estoqueAtual <= estoqueMinimoAtual;
    }).length;
    const disponiveis = todosProdutos.filter(p => {
      const estoqueAtual = obterEstoqueAtual(p);
      const estoqueMinimoAtual = obterEstoqueMinimoAtual(p);
      return estoqueAtual > 0 && (!estoqueMinimoAtual || estoqueMinimoAtual <= 0 || estoqueAtual > estoqueMinimoAtual);
    }).length;
    
    return { total, semEstoque, estoqueBaixo, disponiveis };
  };

  const metricas = calcularMetricas();

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden prevent-zoom touch-optimized mobile-scroll">
      {/* Header */}
      <div className="w-full">
        {/* Título e Descrição - Sempre no topo */}
        <div className="mb-4 md:mb-0">
          <h1 className="text-2xl sm:text-3xl font-bold">Produtos</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Gerencie seu catálogo de produtos
          </p>
        </div>

        {/* Botão - Desktop */}
        <div className="hidden md:flex items-center justify-end">
          {hasPermission('produtos_criar') && (
            <Button className="bg-gradient-primary" onClick={() => navigate("/dashboard/novo-produto")}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Produto
            </Button>
          )}
        </div>

        {/* Botão - Mobile */}
        <div className="md:hidden w-full">
          {hasPermission('produtos_criar') && (
            <Button 
              className="w-full bg-gradient-primary text-xs sm:text-sm" 
              onClick={() => navigate("/dashboard/novo-produto")}
            >
              <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Novo Produto</span>
              <span className="sm:hidden">Novo Produto</span>
            </Button>
          )}
        </div>
      </div>

      {/* Card de Métricas */}
      {!produtosApi.loading && !produtosApi.error && !categoriasApi.loading && (
        <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-card shadow-card">
            <CardContent className="p-2 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">Total de Produtos</p>
                  <p className="text-sm sm:text-2xl font-bold text-primary break-words">{metricas.total}</p>
                </div>
                <div className="p-1 sm:p-2 rounded-lg bg-primary/10 flex-shrink-0 self-start sm:self-auto">
                  <Package className="h-3 w-3 sm:h-6 sm:w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card shadow-card">
            <CardContent className="p-2 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">Disponíveis</p>
                  <p className="text-sm sm:text-2xl font-bold text-success break-words">{metricas.disponiveis}</p>
                </div>
                <div className="p-1 sm:p-2 rounded-lg bg-success/10 flex-shrink-0 self-start sm:self-auto">
                  <CheckCircle className="h-3 w-3 sm:h-6 sm:w-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card shadow-card">
            <CardContent className="p-2 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">Estoque Baixo</p>
                  <p className="text-sm sm:text-2xl font-bold text-warning break-words">{metricas.estoqueBaixo}</p>
                </div>
                <div className="p-1 sm:p-2 rounded-lg bg-warning/10 flex-shrink-0 self-start sm:self-auto">
                  <AlertTriangle className="h-3 w-3 sm:h-6 sm:w-6 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card shadow-card">
            <CardContent className="p-2 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">Sem Estoque</p>
                  <p className="text-sm sm:text-2xl font-bold text-destructive break-words">{metricas.semEstoque}</p>
                </div>
                <div className="p-1 sm:p-2 rounded-lg bg-destructive/10 flex-shrink-0 self-start sm:self-auto">
                  <AlertTriangle className="h-3 w-3 sm:h-6 sm:w-6 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card className="bg-gradient-card shadow-card">
        <CardContent className="p-3 sm:p-6">
          {/* Filtros - Desktop */}
          <div className="hidden md:flex flex-col space-y-4 md:flex-row md:items-center md:space-y-0 md:space-x-4">
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

          {/* Filtros - Mobile */}
          <div className="md:hidden space-y-3 w-full">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-3 w-3 sm:h-4 sm:w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar produtos..."
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
                className="pl-8 sm:pl-10 text-xs sm:text-sm"
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full">
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="px-2 py-2 border border-input bg-background rounded-md text-xs sm:text-sm"
              >
                <option value="">Status</option>
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
                <option value="rascunho">Rascunho</option>
              </select>
              <select
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
                className="px-2 py-2 border border-input bg-background rounded-md text-xs sm:text-sm"
                disabled={categoriasApi.loading}
              >
                <option value="">Categoria</option>
                {categorias.map((categoria) => (
                  <option key={categoria.id} value={categoria.id}>
                    {categoria.nome}
                  </option>
                ))}
              </select>
              <select
                value={filtroEstoque}
                onChange={(e) => setFiltroEstoque(e.target.value)}
                className="px-2 py-2 border border-input bg-background rounded-md text-xs sm:text-sm"
              >
                <option value="">Estoque</option>
                <option value="disponivel">Disponíveis</option>
                <option value="estoque_baixo">Baixo</option>
                <option value="sem_estoque">Sem Estoque</option>
              </select>
            </div>

            <Button 
              variant="outline" 
              onClick={carregarProdutos}
              disabled={produtosApi.loading}
              className="w-full text-xs sm:text-sm"
            >
              {produtosApi.loading ? (
                <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              )}
              <span className="hidden sm:inline">Atualizar</span>
              <span className="sm:hidden">Atualizar</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {(produtosApi.loading || categoriasApi.loading) && (
        <div className="grid gap-3 sm:gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <Card key={index} className="bg-gradient-card shadow-card">
              <CardHeader className="pb-3 sm:pb-4">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-6 w-6 sm:h-10 sm:w-10 rounded-lg" />
                  <Skeleton className="h-4 w-16 sm:h-6 sm:w-20" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <div>
                  <Skeleton className="h-4 w-3/4 mb-2 sm:h-6" />
                  <Skeleton className="h-3 w-1/2 sm:h-4" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Skeleton className="h-3 w-10 sm:h-4 sm:w-12" />
                    <Skeleton className="h-3 w-12 sm:h-4 sm:w-16" />
                  </div>
                  <div className="flex justify-between">
                    <Skeleton className="h-3 w-10 sm:h-4 sm:w-12" />
                    <Skeleton className="h-3 w-12 sm:h-4 sm:w-16" />
                  </div>
                </div>
                <div className="flex space-x-2 pt-2">
                  <Skeleton className="h-6 flex-1 sm:h-8" />
                  <Skeleton className="h-6 w-6 sm:h-8 sm:w-8" />
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
        <div className="grid gap-3 sm:gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {produtos.map((produto) => (
            <Card key={produto.id} className="bg-gradient-card shadow-card hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="pb-3 sm:pb-4">
                <div className="flex items-center justify-between">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10">
                    <Package className="h-4 w-4 sm:h-6 sm:w-6 text-primary" />
                  </div>
                  {obterBadgeStatus(produto)}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3 sm:space-y-4">
                <div>
                  <h3 className="font-semibold text-base sm:text-lg line-clamp-2">{produto.nome}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">{produto.categoria_nome || 'Sem categoria'}</p>
                  {produto.marca && (
                    <p className="text-xs text-muted-foreground">{produto.marca}</p>
                  )}
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {produto.tipo_preco === 'unidade' && 'Por unidade'}
                      {produto.tipo_preco === 'kg' && 'Por KG'}
                      {produto.tipo_preco === 'litros' && 'Por litro'}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm text-muted-foreground">Preço:</span>
                    <div className="text-right">
                      <span className="font-semibold text-foreground text-sm sm:text-base">
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
                    <span className="text-xs sm:text-sm text-muted-foreground">
                      {obterTipoEstoqueTexto(produto.tipo_preco)}:
                    </span>
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <span className="font-medium text-xs sm:text-sm">
                        {formatarEstoque(produto)}
                      </span>
                      {(() => {
                        const estoqueAtual = obterEstoqueAtual(produto);
                        const estoqueMinimoAtual = obterEstoqueMinimoAtual(produto);
                        
                        if (estoqueAtual > 0 && estoqueMinimoAtual > 0 && estoqueAtual <= estoqueMinimoAtual) {
                          return <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-warning" />;
                        } else if (estoqueAtual > 0) {
                          return <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-success" />;
                        }
                        return null;
                      })()}
                    </div>
                  </div>

                  {produto.codigo_barras && (
                    <div className="text-xs text-muted-foreground truncate">
                      Código: {produto.codigo_barras}
                    </div>
                  )}
                  {produto.sku && (
                    <div className="text-xs text-muted-foreground truncate">
                      SKU: {produto.sku}
                    </div>
                  )}
                </div>

                {/* Ocultar botões de ação para vendedores */}
                {(hasPermission('produtos_editar') || hasPermission('produtos_excluir')) && (
                  <div className="flex space-x-2 pt-2">
                    {hasPermission('produtos_editar') && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 text-xs sm:text-sm"
                        onClick={() => navigate(`/dashboard/novo-produto/${produto.id}`)}
                      >
                        <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">Editar</span>
                        <span className="sm:hidden">Ed.</span>
                      </Button>
                    )}
                    {hasPermission('produtos_excluir') && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-xs sm:text-sm"
                        onClick={() => handleExcluirProduto(produto.id, produto.nome)}
                        disabled={deleteApi.loading}
                      >
                        {deleteApi.loading ? (
                          <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!produtosApi.loading && !produtosApi.error && !categoriasApi.loading && produtos.length === 0 && (
        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-6 sm:p-12 text-center">
            <Package className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-semibold mb-2">Nenhum produto encontrado</h3>
            <p className="text-sm sm:text-base text-muted-foreground mb-4">
              {termoBusca || filtroStatus || filtroCategoria || filtroEstoque
                ? "Tente ajustar sua busca ou filtros" 
                : "Adicione seu primeiro produto"
              }
            </p>
            {hasPermission('produtos_criar') && (
              <Button 
                className="bg-gradient-primary text-xs sm:text-sm"
                onClick={() => navigate("/dashboard/novo-produto")}
              >
                <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Adicionar Produto</span>
                <span className="sm:hidden">Adicionar</span>
              </Button>
            )}
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