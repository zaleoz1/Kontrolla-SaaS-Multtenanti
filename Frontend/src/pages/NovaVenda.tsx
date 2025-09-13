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
import { useBuscaCodigoBarras } from "@/hooks/useProdutos";
import { Cliente } from "@/hooks/useClientes";
import { Produto } from "@/hooks/useProdutos";
import { useToast } from "@/hooks/use-toast";

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
  const { buscarPorCodigo, carregando: carregandoCodigoBarras } = useBuscaCodigoBarras();
  
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
      const produto = await buscarPorCodigo(codigoBarras.trim());
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold">Nova Venda</h1>
          <p className="text-muted-foreground">
            Sistema de caixa - Processe vendas rapidamente
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            onClick={() => window.history.back()}
            className="border-slate-300 text-slate-600 hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
      </div>

      {/* Layout Principal - Estilo Caixa de Supermercado */}
      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-150px)]">
        {/* Painel Esquerdo - Terminal de Produtos */}
        <Card className="flex-1 flex flex-col min-h-0">
          <CardHeader className="flex-shrink-0">
            <CardTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5" />
              <span>Produtos</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-0 min-h-0">
            {/* Barra de Busca e Scanner */}
            <div className="bg-muted/30 border-b p-4 flex-shrink-0">
              <div className="flex space-x-3">
                <div className="flex-1 relative">
                  <ScanLine className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Digite o código de barras ou nome do produto..."
                    value={codigoBarras}
                    onChange={(e) => setCodigoBarras(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && buscarPorCodigoBarras()}
                    className="pl-10 h-12 text-lg"
                  />
                </div>
                <Button 
                  onClick={buscarPorCodigoBarras} 
                  disabled={!codigoBarras.trim() || carregandoCodigoBarras}
                  className="h-12 px-6 bg-green-600 hover:bg-green-700"
                >
                  <Search className="h-5 w-5" />
                </Button>
              </div>
              
              {/* Busca por Nome */}
              <div className="mt-3 relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar produtos por nome..."
                  value={termoBusca}
                  onChange={(e) => setTermoBusca(e.target.value)}
                  className="pl-10 h-10"
                />
              </div>
            </div>

            {/* Grid de Produtos com Scroll Interno */}
            <div className="flex-1 overflow-y-auto p-4 min-h-0">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                {produtosFiltrados.length === 0 ? (
                  <div className="col-span-full text-center py-12 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p>Nenhum produto encontrado</p>
                  </div>
                ) : (
                  produtosFiltrados.map((produto) => (
                    <div 
                      key={produto.id} 
                      className={`bg-card rounded-lg border-2 p-3 cursor-pointer transition-all hover:shadow-lg h-32 flex flex-col justify-between ${
                        produto.estoque === 0 
                          ? 'opacity-60' 
                          : 'border-border hover:border-green-300'
                      }`}
                      onClick={() => produto.estoque > 0 && adicionarAoCarrinho(produto, 1)}
                    >
                      <div className="flex-1">
                        <h3 className="font-medium text-sm line-clamp-2 mb-1">
                          {produto.nome}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {produto.categoria_nome || 'Sem categoria'}
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-bold ${
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
        <Card className="w-full lg:w-96 flex flex-col bg-slate-50 border-slate-200 shadow-xl rounded-xl h-[calc(100vh-150px)] min-h-0">
          <CardHeader className="bg-slate-100 border-b border-slate-200 rounded-t-xl flex-shrink-0">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2 text-slate-800">
                <ShoppingCart className="h-5 w-5" />
                <span>Carrinho de Compras</span>
              </CardTitle>
              <Badge variant="secondary" className="bg-green-600 text-white">
                {carrinho.length} itens
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-0 bg-slate-50 min-h-0">
            {/* Área de Cliente */}
            <div className="p-4 border-b flex-shrink-0">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-muted-foreground">Cliente</h3>
                <Dialog open={modalClienteAberto} onOpenChange={setModalClienteAberto}>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                    >
                      <User className="h-4 w-4 mr-1" />
                      {clienteSelecionado ? 'Alterar' : 'Selecionar'}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh]">
                    <DialogHeader>
                      <DialogTitle>Selecionar Cliente</DialogTitle>
                    </DialogHeader>
                    
                    {/* Busca de Clientes */}
                    <div className="space-y-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="Buscar cliente por nome ou CPF/CNPJ..."
                          value={termoBuscaCliente}
                          onChange={(e) => setTermoBuscaCliente(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      
                      {/* Botão Novo Cliente */}
                      <div
                        className="p-3 rounded-lg border border-dashed border-green-400 cursor-pointer hover:bg-green-50 transition-colors"
                        onClick={() => {
                          setModalClienteAberto(false);
                          irParaNovoCliente();
                        }}
                      >
                        <div className="flex items-center space-x-2">
                          <Plus className="h-5 w-5 text-green-600" />
                          <p className="text-green-600 font-medium">Novo Cliente</p>
                        </div>
                      </div>
                      
                      {/* Lista de Clientes */}
                      <div className="max-h-96 overflow-y-auto space-y-2">
                        {carregandoClientes ? (
                          <div className="text-center py-8">
                            <p className="text-muted-foreground">Carregando clientes...</p>
                          </div>
                        ) : clientesFiltrados.length === 0 ? (
                          <div className="text-center py-8">
                            <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                            <p className="text-muted-foreground">Nenhum cliente encontrado</p>
                          </div>
                        ) : (
                          clientesFiltrados.map((cliente) => (
                            <div
                              key={cliente.id}
                              className={`p-3 rounded-lg cursor-pointer transition-colors border ${
                                clienteSelecionado?.id === cliente.id
                                  ? "bg-green-600 text-white border-green-600"
                                  : "bg-muted hover:bg-muted/80 border-border"
                              }`}
                              onClick={() => {
                                setClienteSelecionado(cliente);
                                setModalClienteAberto(false);
                              }}
                            >
                              <p className="font-medium">{cliente.nome}</p>
                              <p className={`text-sm ${
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
                <div className="bg-muted rounded-lg p-3">
                  <p className="font-medium text-sm">{clienteSelecionado.nome}</p>
                  <p className="text-muted-foreground text-xs">{clienteSelecionado.cpf_cnpj}</p>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setClienteSelecionado(null)}
                    className="mt-2 text-red-500 hover:text-red-600 p-0 h-auto"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Remover
                  </Button>
                </div>
              ) : (
                <div className="bg-muted rounded-lg p-3 text-center">
                  <p className="text-muted-foreground text-sm">Cliente não selecionado</p>
                </div>
              )}
            </div>

            {/* Lista de Itens do Carrinho */}
            <div className="flex-1 overflow-y-auto p-4 min-h-0">
              {carrinho.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Carrinho vazio</p>
                  <p className="text-muted-foreground/60 text-sm">Adicione produtos para começar</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {carrinho.map((item) => (
                    <div key={item.produto.id} className="bg-muted rounded-lg p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm line-clamp-2">
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
                          className="text-red-500 hover:text-red-600 p-1 h-auto"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => atualizarQuantidade(item.produto.id, item.quantidade - 1)}
                            className="w-6 h-6 p-0"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Input
                            type="text"
                            value={item.quantidade}
                            onChange={(e) => atualizarQuantidade(item.produto.id, parseInt(e.target.value) || 1)}
                            className="w-12 h-6 text-center text-sm"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => atualizarQuantidade(item.produto.id, item.quantidade + 1)}
                            className="w-6 h-6 p-0"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <span className="text-green-600 font-bold text-sm">
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
            <div className="p-4 border-t bg-slate-100 border-slate-200 rounded-b-xl flex-shrink-0">
              <div className="space-y-2 text-sm">
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

                <div className="border-t pt-2">
                  <div className="flex justify-between text-lg font-bold">
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
                className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white h-12 text-lg font-bold"
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
                <CreditCard className="h-5 w-5 mr-2" />
                Ir para Pagamento
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>


    </div>
  );
}
