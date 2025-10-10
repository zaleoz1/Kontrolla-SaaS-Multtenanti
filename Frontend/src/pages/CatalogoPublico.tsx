import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Eye, 
  ShoppingBag,
  Star,
  Heart,
  Loader2,
  ArrowLeft,
  Filter
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCatalogoPublico } from "@/hooks/useCatalogoPublico";
import { getProductImageUrl, getImageWithFallback } from "@/utils/imageUtils";

export default function CatalogoPublico() {
  const [termoBusca, setTermoBusca] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("");
  const [precoMin, setPrecoMin] = useState("");
  const [precoMax, setPrecoMax] = useState("");
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const navigate = useNavigate();

  const {
    produtos,
    categorias,
    loading,
    error,
    pagination,
    buscarProdutos,
    buscarCategorias
  } = useCatalogoPublico();

  // Carregar dados iniciais
  useEffect(() => {
    buscarProdutos();
    buscarCategorias();
  }, []);

  // Buscar produtos quando filtros mudarem
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      buscarProdutos({
        q: termoBusca,
        categoria_id: categoriaFiltro,
        preco_min: precoMin,
        preco_max: precoMax
      });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [termoBusca, categoriaFiltro, precoMin, precoMax]);

  // Função para formatar preço
  const formatarPreco = (preco) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(preco);
  };

  // Função para obter imagem do produto
  const obterImagemProduto = (produto) => {
    const imageUrl = getProductImageUrl(produto);
    return getImageWithFallback(imageUrl);
  };

  const limparFiltros = () => {
    setTermoBusca("");
    setCategoriaFiltro("");
    setPrecoMin("");
    setPrecoMax("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 prevent-zoom touch-optimized mobile-scroll overflow-x-hidden">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <h1 className="text-xl font-bold text-slate-900">Catálogo de Produtos</h1>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMostrarFiltros(!mostrarFiltros)}
              className="sm:hidden"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Busca e Filtros */}
        <Card className="mb-6">
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-4">
              {/* Campo de busca */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar produtos..."
                  value={termoBusca}
                  onChange={(e) => setTermoBusca(e.target.value)}
                  className="pl-10 h-10"
                />
              </div>

              {/* Filtros - Desktop */}
              <div className="hidden sm:block">
                <div className="flex flex-wrap gap-4 items-center">
                  {/* Categorias */}
                  {categorias.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant={categoriaFiltro === "" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCategoriaFiltro("")}
                      >
                        Todas
                      </Button>
                      {categorias.map((categoria) => (
                        <Button
                          key={categoria.id}
                          variant={categoriaFiltro === categoria.id.toString() ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCategoriaFiltro(categoria.id.toString())}
                        >
                          {categoria.nome}
                        </Button>
                      ))}
                    </div>
                  )}

                  {/* Filtros de preço */}
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      placeholder="Preço mín."
                      value={precoMin}
                      onChange={(e) => setPrecoMin(e.target.value)}
                      className="w-24 h-8"
                    />
                    <span className="text-slate-500">-</span>
                    <Input
                      type="number"
                      placeholder="Preço máx."
                      value={precoMax}
                      onChange={(e) => setPrecoMax(e.target.value)}
                      className="w-24 h-8"
                    />
                  </div>

                  <Button variant="outline" size="sm" onClick={limparFiltros}>
                    Limpar
                  </Button>
                </div>
              </div>

              {/* Filtros - Mobile */}
              {mostrarFiltros && (
                <div className="sm:hidden space-y-4">
                  {/* Categorias */}
                  {categorias.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="font-medium text-sm">Categorias</h3>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant={categoriaFiltro === "" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCategoriaFiltro("")}
                        >
                          Todas
                        </Button>
                        {categorias.map((categoria) => (
                          <Button
                            key={categoria.id}
                            variant={categoriaFiltro === categoria.id.toString() ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCategoriaFiltro(categoria.id.toString())}
                          >
                            {categoria.nome}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Filtros de preço */}
                  <div className="space-y-2">
                    <h3 className="font-medium text-sm">Preço</h3>
                    <div className="flex items-center space-x-2">
                      <Input
                        type="number"
                        placeholder="Mín."
                        value={precoMin}
                        onChange={(e) => setPrecoMin(e.target.value)}
                        className="flex-1"
                      />
                      <span className="text-slate-500">-</span>
                      <Input
                        type="number"
                        placeholder="Máx."
                        value={precoMax}
                        onChange={(e) => setPrecoMax(e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <Button variant="outline" size="sm" onClick={limparFiltros} className="w-full">
                    Limpar Filtros
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {loading && (
          <Card className="mb-6">
            <CardContent className="p-12 text-center">
              <Loader2 className="h-8 w-8 text-muted-foreground mx-auto mb-4 animate-spin" />
              <h3 className="text-lg font-semibold mb-2">Carregando produtos...</h3>
              <p className="text-muted-foreground">
                Aguarde enquanto buscamos os produtos do catálogo.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {error && (
          <Card className="mb-6">
            <CardContent className="p-12 text-center">
              <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Erro ao carregar produtos</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => buscarProdutos()}>
                Tentar novamente
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Grid de Produtos */}
        {!loading && !error && produtos.length > 0 && (
          <div className="grid gap-4 sm:gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {produtos.map((produto) => {
              if (!produto || !produto.id) return null;
              
              const imagem = obterImagemProduto(produto);
              const precoFinal = produto.preco_promocional || produto.preco;
              const temDesconto = produto.preco_promocional && produto.preco_promocional < produto.preco;
              const emEstoque = produto.estoque > 0;
              
              return (
                <Card key={produto.id} className="bg-white shadow-sm hover:shadow-md transition-all duration-300 group">
                  <CardHeader className="pb-2 p-3 sm:p-4">
                    <div className="relative">
                      <div className="aspect-square bg-muted/30 rounded-lg flex items-center justify-center mb-2 sm:mb-3 overflow-hidden">
                        {imagem ? (
                          <img 
                            src={imagem} 
                            alt={produto.nome || 'Produto'}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ShoppingBag className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground" />
                        )}
                      </div>
                      
                      {produto.destaque === true && (
                        <Badge className="absolute top-1 left-1 sm:top-2 sm:left-2 bg-yellow-500 text-yellow-900 text-xs">
                          <Star className="h-3 w-3 mr-1" />
                          <span className="hidden sm:inline">Destaque</span>
                        </Badge>
                      )}
                      
                      {temDesconto === true && (
                        <Badge className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-red-500 text-red-900 text-xs">
                          <span className="hidden sm:inline">Oferta</span>
                          <span className="sm:hidden">%</span>
                        </Badge>
                      )}
                    </div>
                    
                    <div className="space-y-1">
                      <h3 className="font-semibold line-clamp-2 text-sm sm:text-base">{produto.nome || 'Produto sem nome'}</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">{produto.categoria_nome || 'Sem categoria'}</p>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-2 sm:space-y-3 p-3 sm:p-4 pt-0">
                    <div className="space-y-2">
                      <div className="flex flex-col space-y-1 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                        <div className="space-y-1">
                          {temDesconto === true && (
                            <p className="text-xs text-muted-foreground line-through">
                              {formatarPreco(produto.preco)}
                            </p>
                          )}
                          <p className="text-sm sm:text-lg font-bold text-primary">
                            {formatarPreco(precoFinal)}
                          </p>
                        </div>
                        
                        <Badge variant={emEstoque ? "default" : "secondary"} 
                               className={`${emEstoque ? "bg-green-500" : "bg-gray-500"} text-xs`}>
                          {emEstoque ? "Disponível" : "Indisponível"}
                        </Badge>
                      </div>
                      
                      {produto.estoque > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Estoque: {produto.estoque} unidades
                        </p>
                      )}
                    </div>

                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full h-8 sm:h-9 text-xs sm:text-sm"
                      disabled={!emEstoque}
                    >
                      <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Ver Detalhes</span>
                      <span className="sm:hidden">Ver</span>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Estado vazio */}
        {!loading && !error && produtos.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum produto encontrado</h3>
              <p className="text-muted-foreground mb-4">
                {(termoBusca && termoBusca.trim()) || (categoriaFiltro && categoriaFiltro.trim()) || precoMin || precoMax
                  ? "Tente ajustar sua busca ou filtros" 
                  : "Não há produtos disponíveis no catálogo"}
              </p>
              {((termoBusca && termoBusca.trim()) || (categoriaFiltro && categoriaFiltro.trim()) || precoMin || precoMax) && (
                <Button variant="outline" onClick={limparFiltros}>
                  Limpar filtros
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Paginação */}
        {!loading && !error && produtos.length > 0 && pagination.totalPages > 1 && (
          <Card className="mt-6">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                <p className="text-sm text-muted-foreground text-center sm:text-left">
                  Mostrando {((pagination.page - 1) * pagination.limit) + 1} a {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} produtos
                </p>
                <div className="flex space-x-2 justify-center sm:justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => buscarProdutos({ 
                      page: pagination.page - 1,
                      q: termoBusca,
                      categoria_id: categoriaFiltro,
                      preco_min: precoMin,
                      preco_max: precoMax
                    })}
                    disabled={!pagination.hasPrev}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => buscarProdutos({ 
                      page: pagination.page + 1,
                      q: termoBusca,
                      categoria_id: categoriaFiltro,
                      preco_min: precoMin,
                      preco_max: precoMax
                    })}
                    disabled={!pagination.hasNext}
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
