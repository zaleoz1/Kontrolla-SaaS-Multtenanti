import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Plus, 
  Search, 
  Trash2,
  User,
  Package,
  CreditCard,
  ShoppingCart,
  X,
  Minus,
  ArrowLeft,
  ScanLine
} from "lucide-react";
import { useBuscaClientes } from "@/hooks/useBuscaClientes";
import { useBuscaProdutos } from "@/hooks/useBuscaProdutos";
import { Cliente } from "@/hooks/useClientes";
import { useToast } from "@/hooks/use-toast";

interface Produto {
  id?: number;
  nome: string;
  descricao?: string;
  categoria_id?: number;
  categoria_nome?: string;
  preco: number;
  preco_promocional?: number;
  tipo_preco: 'unidade' | 'kg' | 'litros';
  codigo_barras?: string;
  sku?: string;
  estoque: number;
  estoque_minimo: number;
  fornecedor_id?: number;
  marca?: string;
  modelo?: string;
  status: 'ativo' | 'inativo' | 'rascunho';
  destaque: boolean;
  imagens: string[];
  data_criacao?: string;
  data_atualizacao?: string;
}

interface ItemCarrinho {
  produto: Produto;
  quantidade: number;
  precoUnitario: number;
  precoTotal: number;
}

export default function NovaVenda() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  // Dados da venda vindos do estado da navegação (quando volta da página Pagamentos)
  const vendaData = location.state as {
    carrinho: ItemCarrinho[];
    clienteSelecionado: Cliente | null;
    subtotal: number;
    desconto: string;
    total: number;
  } | null;
  
  // Hooks para integração com API
  const { clientesFiltrados, termoBuscaCliente, setTermoBuscaCliente, carregando: carregandoClientes } = useBuscaClientes();
  const { produtosFiltrados, termoBusca, setTermoBusca, carregando: carregandoProdutos } = useBuscaProdutos();
  
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(vendaData?.clienteSelecionado || null);
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>(vendaData?.carrinho || []);
  const [codigoBarras, setCodigoBarras] = useState("");
  const [desconto, setDesconto] = useState(vendaData?.desconto || "");
  const [modalClienteAberto, setModalClienteAberto] = useState(false);



  // Usar produtos filtrados da API
  const produtosDisponiveis = produtosFiltrados;

  // Limpar o estado da navegação após carregar os dados
  useEffect(() => {
    if (vendaData) {
      // Limpar o estado da navegação para evitar que os dados sejam mantidos em navegações futuras
      window.history.replaceState({}, document.title);
    }
  }, [vendaData]);

  const buscarPorCodigoBarras = async () => {
    if (!codigoBarras.trim()) return;
    
    try {
      // Buscar produto pelo código de barras nos produtos filtrados
      const produto = produtosFiltrados.find(p => 
        p.codigo_barras?.toLowerCase() === codigoBarras.trim().toLowerCase()
      );
      if (produto) {
        // Verificar se o produto está esgotado antes de adicionar
        if (produto.estoque === 0) {
          toast({
            title: "Produto sem estoque",
            description: `${produto.nome} não está disponível para venda`,
            variant: "destructive",
          });
          setCodigoBarras("");
          return;
        }
        
        adicionarAoCarrinho(produto, 1);
        setCodigoBarras("");
        toast({
          title: "Produto encontrado",
          description: `${produto.nome} adicionado ao carrinho`,
        });
      } else {
        toast({
          title: "Produto não encontrado",
          description: "Nenhum produto encontrado com este código de barras",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro na busca",
        description: "Erro ao buscar produto por código de barras",
        variant: "destructive",
      });
    }
  };

  const adicionarAoCarrinho = (produto: Produto, quantidade: number = 1) => {
    // Verificar se o produto está esgotado
    if (produto.estoque === 0) {
      toast({
        title: "Produto sem estoque",
        description: `${produto.nome} não está disponível para venda`,
        variant: "destructive",
      });
      return;
    }

    const itemExistente = carrinho.find(item => item.produto.id === produto.id);
    
    if (itemExistente) {
      setCarrinho(carrinho.map(item => 
        item.produto.id === produto.id 
          ? { ...item, quantidade: item.quantidade + quantidade, precoTotal: (item.quantidade + quantidade) * item.precoUnitario }
          : item
      ));
    } else {
      setCarrinho([...carrinho, {
        produto,
        quantidade,
        precoUnitario: produto.preco,
        precoTotal: produto.preco * quantidade
      }]);
    }
    
    

  };

  const definirQuantidadeCarrinho = (produto: Produto, quantidade: number) => {
    // Verificar se o produto está esgotado
    if (produto.estoque === 0) {
      toast({
        title: "Produto sem estoque",
        description: `${produto.nome} não está disponível para venda`,
        variant: "destructive",
      });
      return;
    }

    const itemExistente = carrinho.find(item => item.produto.id === produto.id);
    
    if (quantidade <= 0) {
      removerDoCarrinho(produto.id);
      return;
    }
    
    if (itemExistente) {
      setCarrinho(carrinho.map(item => 
        item.produto.id === produto.id 
          ? { ...item, quantidade, precoTotal: quantidade * item.precoUnitario }
          : item
      ));
    } else {
      setCarrinho([...carrinho, {
        produto,
        quantidade,
        precoUnitario: produto.preco,
        precoTotal: produto.preco * quantidade
      }]);
    }
    
  };

  const removerDoCarrinho = (produtoId: number) => {
    setCarrinho(carrinho.filter(item => item.produto.id !== produtoId));
    
  };

  const atualizarQuantidade = (produtoId: number, quantidade: number) => {
    if (quantidade <= 0) {
      removerDoCarrinho(produtoId);
      return;
    }
    
    setCarrinho(carrinho.map(item => 
      item.produto.id === produtoId 
        ? { ...item, quantidade, precoTotal: quantidade * item.precoUnitario }
        : item
    ));
    
  };

  const subtotal = carrinho.reduce((soma, item) => soma + item.precoTotal, 0);
  const descontoNum = parseFloat(desconto) || 0;
  const valorDesconto = (subtotal * descontoNum) / 100;
  const total = subtotal - valorDesconto;



  const irParaNovoCliente = () => {
    navigate("/dashboard/novo-cliente");
  };

  const irParaNovoProduto = () => {
    navigate("/dashboard/novo-produto");
  };

  const limparVendaRapida = () => {
    setCarrinho([]);
    setClienteSelecionado(null);
    setDesconto("");
    // Limpar busca de cliente
    setTermoBuscaCliente("");
    setModalClienteAberto(false);
  };


  return (
    <div className="w-full max-w-full overflow-x-hidden space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="w-full flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Nova Venda</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Sistema de caixa - Processe vendas rapidamente
          </p>
        </div>
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Button 
            variant="outline" 
            onClick={() => navigate("/dashboard")}
            className="border-slate-300 text-slate-600 hover:bg-slate-50 h-8 sm:h-10 text-xs sm:text-sm w-full sm:w-auto"
          >
            <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            Voltar
          </Button>
        </div>
      </div>

      {/* Layout Principal - Estilo Caixa de Supermercado */}
      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
        {/* Painel Esquerdo - Terminal de Produtos */}
        <Card className="flex-1 flex flex-col min-h-0 order-2 lg:order-1 lg:h-[calc(100vh-150px)]">
          <CardHeader className="flex-shrink-0 pb-3 sm:pb-6">
            <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
              <Package className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>Produtos</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-0 min-h-0">
            {/* Barra de Busca e Scanner */}
            <div className="bg-muted/30 border-b p-3 sm:p-4 flex-shrink-0">
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                <div className="flex-1 relative">
                  <ScanLine className="absolute left-3 top-1/2 h-4 w-4 sm:h-5 sm:w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Digite o código de barras ou nome do produto..."
                    value={codigoBarras}
                    onChange={(e) => setCodigoBarras(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && buscarPorCodigoBarras()}
                    className="pl-10 h-10 sm:h-12 text-sm sm:text-lg"
                  />
                </div>
                <Button 
                  onClick={buscarPorCodigoBarras} 
                  disabled={!codigoBarras.trim() || carregandoProdutos}
                  className="h-10 sm:h-12 px-4 sm:px-6 bg-green-600 hover:bg-green-700 text-xs sm:text-sm"
                >
                  <Search className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </div>
              
              {/* Busca por Nome */}
              <div className="mt-3 relative">
                <Search className="absolute left-3 top-1/2 h-3 w-3 sm:h-4 sm:w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar produtos por nome..."
                  value={termoBusca}
                  onChange={(e) => setTermoBusca(e.target.value)}
                  className="pl-9 sm:pl-10 h-8 sm:h-10 text-xs sm:text-sm"
                />
              </div>
            </div>

            {/* Grid de Produtos com Scroll Interno */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 min-h-0">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3">
                {produtosFiltrados.length === 0 ? (
                  <div className="col-span-full text-center py-8 sm:py-12 text-muted-foreground">
                    <Package className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 text-muted-foreground/50" />
                    <p className="text-xs sm:text-sm">Nenhum produto encontrado</p>
                  </div>
                ) : (
                  produtosFiltrados.map((produto) => (
                    <div 
                      key={produto.id} 
                      className={`bg-card rounded-lg border-2 p-2 sm:p-3 cursor-pointer transition-all hover:shadow-lg h-24 sm:h-32 flex flex-col justify-between ${
                        produto.estoque === 0 
                          ? 'opacity-60' 
                          : 'border-border hover:border-green-300'
                      }`}
                      onClick={() => produto.estoque > 0 && adicionarAoCarrinho(produto, 1)}
                    >
                      <div className="flex-1">
                        <h3 className="font-medium text-xs sm:text-sm line-clamp-2 mb-1">
                          {produto.nome}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {produto.categoria_nome || 'Sem categoria'}
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs sm:text-sm font-bold ${
                          produto.estoque === 0 ? 'text-gray-500' : 'text-green-600'
                        }`}>
                          {produto.preco.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL"
                          })}
                        </span>
                        <span className={`text-xs ${
                          produto.estoque === 0 ? 'text-gray-500' : 'text-muted-foreground'
                        }`}>
                          {produto.estoque} un.
                        </span>
                      </div>
                      {produto.estoque === 0 && (
                        <div className="mt-1 text-xs text-gray-500 font-medium text-center">
                          Sem estoque
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Painel Direito - Display do Caixa */}
        <Card className="w-full lg:w-96 flex flex-col bg-slate-50 border-slate-200 shadow-xl rounded-xl h-[28rem] sm:h-[32rem] lg:h-[calc(100vh-150px)] min-h-0 order-1 lg:order-2">
          <CardHeader className="bg-slate-100 border-b border-slate-200 rounded-t-xl flex-shrink-0 pb-3 sm:pb-6">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2 text-slate-800 text-sm sm:text-base">
                <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Carrinho de Compras</span>
              </CardTitle>
              <Badge variant="secondary" className="bg-green-600 text-white text-xs">
                {carrinho.length} itens
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-0 bg-slate-50 min-h-0">
            {/* Área de Cliente */}
            <div className="p-3 sm:p-4 border-b flex-shrink-0">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <h3 className="text-xs sm:text-sm font-medium text-muted-foreground">Cliente</h3>
                <Dialog open={modalClienteAberto} onOpenChange={setModalClienteAberto}>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 sm:h-8 text-xs"
                    >
                      <User className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      {clienteSelecionado ? 'Alterar' : 'Selecionar'}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] w-[95vw] sm:w-full">
                    <DialogHeader>
                      <DialogTitle className="text-base sm:text-lg">Selecionar Cliente</DialogTitle>
                    </DialogHeader>
                    
                    {/* Busca de Clientes */}
                    <div className="space-y-3 sm:space-y-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-3 w-3 sm:h-4 sm:w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="Buscar cliente por nome ou CPF/CNPJ..."
                          value={termoBuscaCliente}
                          onChange={(e) => setTermoBuscaCliente(e.target.value)}
                          className="pl-9 sm:pl-10 h-8 sm:h-10 text-xs sm:text-sm"
                        />
                      </div>
                      
                      {/* Botão Novo Cliente */}
                      <div
                        className="p-2 sm:p-3 rounded-lg border border-dashed border-green-400 cursor-pointer hover:bg-green-50 transition-colors"
                        onClick={() => {
                          setModalClienteAberto(false);
                          irParaNovoCliente();
                        }}
                      >
                        <div className="flex items-center space-x-2">
                          <Plus className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                          <p className="text-green-600 font-medium text-xs sm:text-sm">Novo Cliente</p>
                        </div>
                      </div>
                      
                      {/* Lista de Clientes */}
                      <div className="max-h-80 sm:max-h-96 overflow-y-auto space-y-2">
                        {carregandoClientes ? (
                          <div className="text-center py-6 sm:py-8">
                            <p className="text-muted-foreground text-xs sm:text-sm">Carregando clientes...</p>
                          </div>
                        ) : clientesFiltrados.length === 0 ? (
                          <div className="text-center py-6 sm:py-8">
                            <User className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 text-muted-foreground/50" />
                            <p className="text-muted-foreground text-xs sm:text-sm">Nenhum cliente encontrado</p>
                          </div>
                        ) : (
                          clientesFiltrados.map((cliente) => (
                            <div
                              key={cliente.id}
                              className={`p-2 sm:p-3 rounded-lg cursor-pointer transition-colors border ${
                                clienteSelecionado?.id === cliente.id
                                  ? "bg-green-600 text-white border-green-600"
                                  : "bg-muted hover:bg-muted/80 border-border"
                              }`}
                              onClick={() => {
                                setClienteSelecionado(cliente);
                                setModalClienteAberto(false);
                              }}
                            >
                              <p className="font-medium text-xs sm:text-sm">{cliente.nome}</p>
                              <p className={`text-xs ${
                                clienteSelecionado?.id === cliente.id
                                  ? "text-green-100"
                                  : "text-muted-foreground"
                              }`}>
                                {cliente.cpf_cnpj}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              
              {clienteSelecionado ? (
                <div className="bg-muted rounded-lg p-2 sm:p-3">
                  <p className="font-medium text-xs sm:text-sm">{clienteSelecionado.nome}</p>
                  <p className="text-muted-foreground text-xs">{clienteSelecionado.cpf_cnpj}</p>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setClienteSelecionado(null)}
                    className="mt-1 sm:mt-2 text-red-500 hover:text-red-600 p-0 h-auto text-xs"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Remover
                  </Button>
                </div>
              ) : (
                <div className="bg-muted rounded-lg p-2 sm:p-3 text-center">
                  <p className="text-muted-foreground text-xs sm:text-sm">Cliente não selecionado</p>
                </div>
              )}
            </div>

            {/* Lista de Itens do Carrinho */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 min-h-0">
              {carrinho.length === 0 ? (
                <div className="text-center py-6 sm:py-8">
                  <ShoppingCart className="h-8 w-8 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-3 sm:mb-4" />
                  <p className="text-muted-foreground text-xs sm:text-sm">Carrinho vazio</p>
                  <p className="text-muted-foreground/60 text-xs">Adicione produtos para começar</p>
                </div>
              ) : (
                <div className="space-y-1 sm:space-y-2">
                  {carrinho.map((item) => (
                    <div key={item.produto.id} className="bg-muted rounded-lg p-1.5 sm:p-2">
                      <div className="flex items-start justify-between mb-1 sm:mb-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-xs line-clamp-1 sm:line-clamp-2">
                            {item.produto.nome}
                          </h4>
                          <p className="text-muted-foreground text-xs">
                            {item.precoUnitario.toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL"
                            })} x {item.quantidade}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removerDoCarrinho(item.produto.id)}
                          className="text-red-500 hover:text-red-600 p-0.5 h-auto flex-shrink-0"
                        >
                          <Trash2 className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                        </Button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => atualizarQuantidade(item.produto.id, item.quantidade - 1)}
                            className="w-4 h-4 sm:w-5 sm:h-5 p-0"
                          >
                            <Minus className="h-1.5 w-1.5 sm:h-2 sm:w-2" />
                          </Button>
                          <Input
                            type="text"
                            value={item.quantidade}
                            onChange={(e) => atualizarQuantidade(item.produto.id, parseInt(e.target.value) || 1)}
                            className="w-8 sm:w-10 h-4 sm:h-5 text-center text-xs"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => atualizarQuantidade(item.produto.id, item.quantidade + 1)}
                            className="w-4 h-4 sm:w-5 sm:h-5 p-0"
                          >
                            <Plus className="h-1.5 w-1.5 sm:h-2 sm:w-2" />
                          </Button>
                        </div>
                        <span className="text-green-600 font-bold text-xs">
                          {item.precoTotal.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL"
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Resumo Financeiro */}
            <div className="p-3 sm:p-4 border-t bg-slate-100 border-slate-200 rounded-b-xl flex-shrink-0">
              <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal:</span>
                  <span>{subtotal.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL"
                  })}</span>
                </div>
                
                {parseFloat(desconto) > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Desconto ({desconto}%):</span>
                    <span>-{valorDesconto.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL"
                    })}</span>
                  </div>
                )}

                <div className="border-t pt-1 sm:pt-2">
                  <div className="flex justify-between text-base sm:text-lg font-bold">
                    <span>TOTAL:</span>
                    <span className="text-green-600">
                      {total.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL"
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Botão de Pagamento */}
              <Button 
                className="w-full mt-3 sm:mt-4 bg-green-600 hover:bg-green-700 text-white h-10 sm:h-12 text-sm sm:text-lg font-bold"
                onClick={() => navigate("/dashboard/pagamentos", { 
                  state: { 
                    carrinho, 
                    clienteSelecionado, 
                    desconto,
                    subtotal,
                    total 
                  } 
                })}
                disabled={carrinho.length === 0}
              >
                <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                Ir para Pagamento
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>


    </div>
  );
}