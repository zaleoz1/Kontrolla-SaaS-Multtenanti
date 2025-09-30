import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Search, 
  Eye, 
  Share2, 
  Copy,
  ExternalLink,
  QrCode,
  Settings,
  Globe,
  ShoppingBag,
  Star,
  Heart,
  Loader2
} from "lucide-react";
import { useCatalogo } from "@/hooks/useCatalogo";
import { useToast } from "@/hooks/use-toast";

export default function Catalogo() {
  const [termoBusca, setTermoBusca] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("");
  const [isPublico, setIsPublico] = useState(true);
  const [urlCatalogo, setUrlCatalogo] = useState("http://localhost:8080/catalogo");
  
  const { toast } = useToast();
  const {
    produtos,
    categorias,
    configuracoes,
    stats,
    loading,
    error,
    pagination,
    buscarProdutos,
    atualizarConfiguracoes
  } = useCatalogo();

  // Atualizar configurações quando o componente carrega
  useEffect(() => {
    if (configuracoes) {
      setIsPublico(configuracoes.publico);
      if (configuracoes.url_personalizada) {
        setUrlCatalogo(configuracoes.url_personalizada);
      }
    }
  }, [configuracoes]);

  // Buscar produtos quando o termo de busca ou categoria mudar
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const filtros: any = {
        page: 1,
        limit: 100 // Limite máximo permitido pelo backend
      };
      
      // Só adiciona filtro de busca se houver termo
      if (termoBusca && termoBusca.trim()) {
        filtros.q = termoBusca.trim();
      }
      
      // Só adiciona filtro de categoria se não for "Todas as categorias"
      if (categoriaFiltro && categoriaFiltro.trim()) {
        filtros.categoria_id = categoriaFiltro;
      }
      
      buscarProdutos(filtros);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [termoBusca, categoriaFiltro]);

  // Função para formatar preço
  const formatarPreco = (preco: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(preco);
  };

  // Função para obter imagem do produto
  const obterImagemProduto = (produto: any) => {
    if (produto.imagens && produto.imagens.length > 0) {
      // Se as imagens são URLs do Cloudinary
      if (typeof produto.imagens[0] === 'string' && produto.imagens[0].startsWith('http')) {
        return produto.imagens[0];
      }
      // Se as imagens são base64
      if (typeof produto.imagens[0] === 'string' && produto.imagens[0].startsWith('data:')) {
        return produto.imagens[0];
      }
    }
    return null;
  };

  // Função para formatar estoque baseado no tipo de produto
  const formatarEstoque = (produto: any) => {
    const estoqueAtual = produto.estoque_atual || produto.estoque || 0;
    
    if (produto.tipo_preco === 'kg') {
      const estoqueFormatado = parseFloat(estoqueAtual).toFixed(3).replace(/\.?0+$/, '');
      return `${estoqueFormatado} kg`;
    } else if (produto.tipo_preco === 'litros') {
      const estoqueFormatado = parseFloat(estoqueAtual).toFixed(3).replace(/\.?0+$/, '');
      return `${estoqueFormatado} L`;
    } else {
      return `${Math.round(parseFloat(estoqueAtual))} unidades`;
    }
  };

  // Função para copiar URL do catálogo
  const copiarUrl = async () => {
    try {
      await navigator.clipboard.writeText(urlCatalogo);
      toast({
        title: "URL copiada!",
        description: "Link do catálogo copiado para a área de transferência.",
      });
    } catch (err) {
      toast({
        title: "Erro",
        description: "Não foi possível copiar a URL.",
        variant: "destructive",
      });
    }
  };

  // Função para abrir catálogo em nova aba
  const abrirCatalogo = () => {
    window.open(urlCatalogo, '_blank');
  };

  // Função para alternar status público/privado
  const alternarStatus = async (novoStatus: boolean) => {
    try {
      await atualizarConfiguracoes({ publico: novoStatus });
      setIsPublico(novoStatus);
      toast({
        title: "Status atualizado!",
        description: `Catálogo ${novoStatus ? 'público' : 'privado'} com sucesso.`,
      });
    } catch (err) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status do catálogo.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Catálogo Online</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Gerencie e compartilhe seu catálogo público
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" className="text-xs sm:text-sm h-8 sm:h-10">
            <QrCode className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">QR Code</span>
            <span className="sm:hidden">QR</span>
          </Button>
          <Button className="bg-gradient-primary text-xs sm:text-sm h-8 sm:h-10">
            <Share2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Compartilhar</span>
            <span className="sm:hidden">Compartilhar</span>
          </Button>
        </div>
      </div>

      {/* Configurações do Catálogo */}
      <Card className="bg-gradient-card shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <span className="text-base sm:text-lg">Configurações do Catálogo</span>
            <Badge variant={isPublico ? "default" : "secondary"} className={`${isPublico ? "bg-success" : ""} text-xs w-fit`}>
              {isPublico ? "Público" : "Privado"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div className="space-y-1 flex-1">
              <p className="font-medium text-sm sm:text-base">Status do Catálogo</p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {isPublico ? "Seu catálogo está visível para clientes" : "Catálogo privado, apenas para você"}
              </p>
            </div>
            <Switch
              checked={isPublico}
              onCheckedChange={alternarStatus}
            />
          </div>

          <div className="space-y-2">
            <p className="font-medium text-sm sm:text-base">Link Público</p>
            <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-2">
              <Input value={urlCatalogo} readOnly className="flex-1 text-xs sm:text-sm h-8 sm:h-10" />
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={copiarUrl} className="h-8 sm:h-10 text-xs sm:text-sm">
                  <Copy className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={abrirCatalogo} className="h-8 sm:h-10 text-xs sm:text-sm">
                  <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 pt-2">
            <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4 text-xs sm:text-sm text-muted-foreground">
              <div className="flex items-center space-x-1">
                <Globe className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>Produtos: {stats?.produtos_ativos || 0}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>Em destaque: {stats?.produtos_destaque || 0}</span>
              </div>
            </div>
            <Button variant="outline" size="sm" className="h-8 sm:h-10 text-xs sm:text-sm w-full sm:w-auto">
              <Settings className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Personalizar</span>
              <span className="sm:hidden">Personalizar</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Busca e Filtros */}
      <Card className="bg-gradient-card shadow-card">
        <CardContent className="p-4 sm:p-6">
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3 w-3 sm:h-4 sm:w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar produtos no catálogo..."
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
                className="pl-8 sm:pl-10 h-8 sm:h-10 text-xs sm:text-sm"
              />
            </div>
            
            {categorias.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={categoriaFiltro === "" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCategoriaFiltro("")}
                  className="h-8 sm:h-9 text-xs sm:text-sm"
                >
                  <span className="hidden sm:inline">Todas as categorias</span>
                  <span className="sm:hidden">Todas</span>
                </Button>
                {categorias.map((categoria) => (
                  <Button
                    key={categoria.id}
                    variant={categoriaFiltro === categoria.id.toString() ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCategoriaFiltro(categoria.id.toString())}
                    className="h-8 sm:h-9 text-xs sm:text-sm"
                  >
                    <span className="hidden sm:inline">{categoria.nome} ({categoria.total_produtos})</span>
                    <span className="sm:hidden">{categoria.nome}</span>
                  </Button>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-6 sm:p-12 text-center">
            <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground mx-auto mb-4 animate-spin" />
            <h3 className="text-base sm:text-lg font-semibold mb-2">Carregando produtos...</h3>
            <p className="text-sm sm:text-base text-muted-foreground">
              Aguarde enquanto buscamos os produtos do seu catálogo.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-6 sm:p-12 text-center">
            <ShoppingBag className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-base sm:text-lg font-semibold mb-2">Erro ao carregar produtos</h3>
            <p className="text-sm sm:text-base text-muted-foreground mb-4">
              {error}
            </p>
            <Button 
              onClick={() => buscarProdutos({ page: 1, limit: 100 })}
              className="h-8 sm:h-10 text-xs sm:text-sm"
            >
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Grid de Produtos */}
      {!loading && !error && produtos.length > 0 && (
        <div className="grid gap-3 sm:gap-6 grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {produtos.map((produto) => {
            if (!produto || !produto.id) return null;
            
            const imagem = obterImagemProduto(produto);
            const precoFinal = produto.preco_promocional || produto.preco;
            const temDesconto = produto.preco_promocional && produto.preco_promocional < produto.preco;
            const estoqueAtual = produto.estoque_atual || produto.estoque || 0;
            const emEstoque = estoqueAtual > 0;
            
            return (
              <Card key={produto.id} className="bg-gradient-card shadow-card hover:shadow-lg transition-all duration-300 group">
                <CardHeader className="pb-2 p-3 sm:p-6">
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
                      <Badge className="absolute top-1 left-1 sm:top-2 sm:left-2 bg-warning/80 text-warning-foreground text-xs">
                        <span className="hidden sm:inline">Destaque</span>
                        <span className="sm:hidden">★</span>
                      </Badge>
                    )}
                    
                    {temDesconto === true && (
                      <Badge className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-destructive text-destructive-foreground text-xs">
                        <span className="hidden sm:inline">Oferta</span>
                        <span className="sm:hidden">%</span>
                      </Badge>
                    )}
                    
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="absolute top-1 right-1 sm:top-2 sm:right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 sm:h-8 sm:w-8 p-0"
                    >
                      <Heart className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                  
                  <div className="space-y-1">
                    <h3 className="font-semibold line-clamp-2 text-sm sm:text-base">{produto.nome || 'Produto sem nome'}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">{produto.categoria_nome || 'Sem categoria'}</p>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-2 sm:space-y-3 p-3 sm:p-6 pt-0">
                  {produto.descricao && produto.descricao.trim() && (
                    <p className="hidden sm:block text-xs text-muted-foreground line-clamp-2">
                      {produto.descricao}
                    </p>
                  )}

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
                             className={`${emEstoque ? "bg-success" : ""} text-xs w-fit`}>
                        <span className="hidden sm:inline">{emEstoque ? "Disponível" : "Indisponível"}</span>
                        <span className="sm:hidden">{emEstoque ? "✓" : "✗"}</span>
                      </Badge>
                    </div>
                    
                    {emEstoque && (
                      <p className="text-xs text-muted-foreground">
                        Estoque: {formatarEstoque(produto)}
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
        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-6 sm:p-12 text-center">
            <ShoppingBag className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-base sm:text-lg font-semibold mb-2">Nenhum produto encontrado</h3>
            <p className="text-sm sm:text-base text-muted-foreground mb-4">
              {(termoBusca && termoBusca.trim()) || (categoriaFiltro && categoriaFiltro.trim()) 
                ? "Tente ajustar sua busca ou filtros" 
                : "Adicione produtos ao seu catálogo"}
            </p>
            {((termoBusca && termoBusca.trim()) || (categoriaFiltro && categoriaFiltro.trim())) && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setTermoBusca("");
                  setCategoriaFiltro("");
                }}
                className="h-8 sm:h-10 text-xs sm:text-sm"
              >
                Limpar filtros
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}