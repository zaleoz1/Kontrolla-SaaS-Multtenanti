import { useState, useEffect, useRef } from "react";
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
  ScanLine,
  Edit
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
  // Novos campos para estoque decimal
  estoque_kg?: number;
  estoque_litros?: number;
  estoque_minimo_kg?: number;
  estoque_minimo_litros?: number;
  // Campos calculados
  estoque_atual?: number;
  estoque_minimo_atual?: number;
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
  const [modalPesoVolumeAberto, setModalPesoVolumeAberto] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null);
  const [quantidadePesoVolume, setQuantidadePesoVolume] = useState("");
  const [unidadeEntrada, setUnidadeEntrada] = useState<'pequena' | 'grande'>('pequena'); // 'pequena' = g/mL, 'grande' = kg/L
  const [editandoItem, setEditandoItem] = useState<ItemCarrinho | null>(null);
  
  // Ref para o campo de código de barras
  const codigoBarrasRef = useRef<HTMLInputElement>(null);



  // Usar produtos filtrados da API
  const produtosDisponiveis = produtosFiltrados;

  // Limpar o estado da navegação após carregar os dados
  useEffect(() => {
    if (vendaData) {
      // Limpar o estado da navegação para evitar que os dados sejam mantidos em navegações futuras
      window.history.replaceState({}, document.title);
    }
  }, [vendaData]);

  // Focar no campo de código de barras quando a página carregar
  useEffect(() => {
    // Pequeno delay para garantir que o componente esteja totalmente renderizado
    const timer = setTimeout(() => {
      if (codigoBarrasRef.current) {
        codigoBarrasRef.current.focus();
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const buscarPorCodigoBarras = async () => {
    if (!codigoBarras.trim()) return;
    
    try {
      // Buscar produto pelo código de barras nos produtos filtrados
      const produto = produtosFiltrados.find(p => 
        p.codigo_barras?.toLowerCase() === codigoBarras.trim().toLowerCase()
      );
      if (produto) {
        // Verificar se o produto está esgotado antes de adicionar
        const estoqueAtual = obterEstoqueAtual(produto);
        if (estoqueAtual === 0) {
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
        // Focar novamente no campo de código de barras
        setTimeout(() => {
          if (codigoBarrasRef.current) {
            codigoBarrasRef.current.focus();
          }
        }, 100);
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
    const estoqueAtual = obterEstoqueAtual(produto);
    if (estoqueAtual === 0) {
      toast({
        title: "Produto sem estoque",
        description: `${produto.nome} não está disponível para venda`,
        variant: "destructive",
      });
      return;
    }

    // Verificar se o produto é vendido por peso ou volume
    const unidade = obterUnidadeEstoque(produto.tipo_preco, produto.nome);
    if (unidade === 'kg' || unidade === 'L') {
      setProdutoSelecionado(produto);
      setQuantidadePesoVolume("");
      setModalPesoVolumeAberto(true);
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
    
    // Focar novamente no campo de código de barras após adicionar produto
    setTimeout(() => {
      if (codigoBarrasRef.current) {
        codigoBarrasRef.current.focus();
      }
    }, 100);
  };

  const definirQuantidadeCarrinho = (produto: Produto, quantidade: number) => {
    // Verificar se o produto está esgotado
    const estoqueAtual = obterEstoqueAtual(produto);
    if (estoqueAtual === 0) {
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

  const confirmarPesoVolume = () => {
    if (!produtoSelecionado || !quantidadePesoVolume) return;

    const quantidade = parseFloat(quantidadePesoVolume);
    if (isNaN(quantidade) || quantidade <= 0) {
      toast({
        title: "Quantidade inválida",
        description: "Digite uma quantidade válida",
        variant: "destructive",
      });
      return;
    }

    const unidade = obterUnidadeEstoque(produtoSelecionado.tipo_preco, produtoSelecionado.nome);
    const precoUnitario = produtoSelecionado.preco;
    
    // Converter unidades conforme necessário
    let quantidadeParaCalculo = quantidade;
    let unidadeParaExibicao = unidade;
    
    if (unidade === 'kg') {
      if (unidadeEntrada === 'pequena') {
        // Usuário digitou em gramas, converter para kg
        quantidadeParaCalculo = quantidade / 1000;
        unidadeParaExibicao = 'g';
      } else {
        // Usuário digitou em kg, manter
        unidadeParaExibicao = 'kg';
      }
    } else if (unidade === 'L') {
      if (unidadeEntrada === 'pequena') {
        // Usuário digitou em mL, converter para L
        quantidadeParaCalculo = quantidade / 1000;
        unidadeParaExibicao = 'mL';
      } else {
        // Usuário digitou em L, manter
        unidadeParaExibicao = 'L';
      }
    }
    
    const precoTotal = precoUnitario * quantidadeParaCalculo;

    if (editandoItem) {
      // Editando item existente
      setCarrinho(carrinho.map(item => 
        item === editandoItem
          ? { ...item, quantidade: quantidadeParaCalculo, precoTotal }
          : item
      ));
    } else {
      // Adicionando novo item
      const itemExistente = carrinho.find(item => item.produto.id === produtoSelecionado.id);
      
      if (itemExistente) {
        setCarrinho(carrinho.map(item => 
          item.produto.id === produtoSelecionado.id 
            ? { ...item, quantidade: item.quantidade + quantidadeParaCalculo, precoTotal: item.precoTotal + precoTotal }
            : item
        ));
      } else {
        setCarrinho([...carrinho, {
          produto: produtoSelecionado,
          quantidade: quantidadeParaCalculo,
          precoUnitario,
          precoTotal
        }]);
      }
    }

    toast({
      title: editandoItem ? "Produto atualizado" : "Produto adicionado",
      description: `${quantidade} ${unidadeParaExibicao} de ${produtoSelecionado.nome} ${editandoItem ? 'atualizado no' : 'adicionado ao'} carrinho`,
    });

    setModalPesoVolumeAberto(false);
    setProdutoSelecionado(null);
    setQuantidadePesoVolume("");
    setUnidadeEntrada('pequena'); // Reset para padrão
    setEditandoItem(null);
  };

  const cancelarPesoVolume = () => {
    setModalPesoVolumeAberto(false);
    setProdutoSelecionado(null);
    setQuantidadePesoVolume("");
    setUnidadeEntrada('pequena'); // Reset para padrão
    setEditandoItem(null);
  };

  const editarItemPesoVolume = (item: ItemCarrinho) => {
    setEditandoItem(item);
    setProdutoSelecionado(item.produto);
    
    // Converter a quantidade do carrinho para a unidade de entrada
    const unidade = obterUnidadeEstoque(item.produto.tipo_preco, item.produto.nome);
    const unidades = obterUnidadesEntrada(unidade);
    
    if (unidade === 'kg' || unidade === 'L') {
      // Converter kg/L para g/mL para exibição
      const quantidadeEmUnidadePequena = item.quantidade * unidades.fator;
      setQuantidadePesoVolume(quantidadeEmUnidadePequena.toString());
      setUnidadeEntrada('pequena');
    } else {
      setQuantidadePesoVolume(item.quantidade.toString());
      setUnidadeEntrada('grande');
    }
    
    setModalPesoVolumeAberto(true);
  };

  const obterEstoqueAtual = (produto: Produto) => {
    // Priorizar o campo calculado do backend se estiver disponível e válido
    if (produto.estoque_atual !== undefined && produto.estoque_atual !== null) {
      return produto.estoque_atual;
    }
    
    // Fallback para os campos específicos por tipo
    switch (produto.tipo_preco) {
      case 'kg':
        return produto.estoque_kg || 0;
      case 'litros':
        return produto.estoque_litros || 0;
      case 'unidade':
      default:
        return produto.estoque || 0;
    }
  };

  const obterEstoqueMinimoAtual = (produto: Produto) => {
    // Priorizar o campo calculado do backend se estiver disponível e válido
    if (produto.estoque_minimo_atual !== undefined && produto.estoque_minimo_atual !== null) {
      return produto.estoque_minimo_atual;
    }
    
    // Fallback para os campos específicos por tipo
    switch (produto.tipo_preco) {
      case 'kg':
        return produto.estoque_minimo_kg || 0;
      case 'litros':
        return produto.estoque_minimo_litros || 0;
      case 'unidade':
      default:
        return produto.estoque_minimo || 0;
    }
  };

  const obterUnidadeEstoque = (tipo_preco: string, nomeProduto: string) => {
    // Primeiro verifica o tipo_preco do banco
    if (tipo_preco === 'kg') return 'kg';
    if (tipo_preco === 'litros') return 'L';
    
    // Se tipo_preco for 'unidade' ou não definido, tenta detectar pelo nome
    const nome = nomeProduto.toLowerCase();
    
    // Detectar por peso (kg, gramas, g, peso)
    if (nome.includes('kg') || nome.includes('quilo') || nome.includes('grama') || 
        nome.includes('g ') || nome.includes('peso') || nome.includes('balança')) {
      return 'kg';
    }
    
    // Detectar por volume (litros, ml, volume)
    if (nome.includes('litro') || nome.includes('l ') || nome.includes('ml') || 
        nome.includes('volume') || nome.includes('líquido') || nome.includes('bebida')) {
      return 'L';
    }
    
    // Padrão para unidade
    return 'un.';
  };

  const formatarEstoque = (produto: Produto) => {
    const estoqueAtual = obterEstoqueAtual(produto);
    
    if (produto.tipo_preco === 'unidade') {
      return `${Math.round(estoqueAtual)} un.`;
    } else if (produto.tipo_preco === 'kg') {
      // Para kg, manter casas decimais mas limitar a 3 casas
      return `${Number(estoqueAtual).toFixed(3).replace(/\.?0+$/, '')} kg`;
    } else if (produto.tipo_preco === 'litros') {
      // Para litros, manter casas decimais mas limitar a 3 casas
      return `${Number(estoqueAtual).toFixed(3).replace(/\.?0+$/, '')} L`;
    } else {
      // Fallback para detecção por nome (compatibilidade)
      const unidade = obterUnidadeEstoque(produto.tipo_preco, produto.nome);
      if (produto.tipo_preco === 'unidade') {
        return `${Math.round(estoqueAtual)} ${unidade}`;
      } else {
        return `${Number(estoqueAtual).toFixed(3).replace(/\.?0+$/, '')} ${unidade}`;
      }
    }
  };

  const obterUnidadesEntrada = (unidade: string) => {
    if (unidade === 'kg') {
      return {
        pequena: 'g',
        grande: 'kg',
        fator: 1000
      };
    } else if (unidade === 'L') {
      return {
        pequena: 'mL',
        grande: 'L',
        fator: 1000
      };
    }
    return {
      pequena: unidade,
      grande: unidade,
      fator: 1
    };
  };


  return (
    <div className="w-full max-w-full overflow-x-hidden space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="w-full flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Nova Venda</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Sistema de caixa - Processe vendas rapidamente
          </p>
        </div>
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Button 
            variant="outline" 
            onClick={() => navigate("/dashboard")}
            className="border-border text-muted-foreground hover:bg-muted h-8 sm:h-10 text-xs sm:text-sm w-full sm:w-auto"
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
                    ref={codigoBarrasRef}
                    placeholder="Digite o código de barras ou nome do produto..."
                    value={codigoBarras}
                    onChange={(e) => setCodigoBarras(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && buscarPorCodigoBarras()}
                    className="pl-10 h-10 sm:h-12 text-sm sm:text-lg"
                    autoFocus
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
                        obterEstoqueAtual(produto) === 0 
                          ? 'opacity-60' 
                          : 'border-border hover:border-green-300 dark:hover:border-green-600'
                      }`}
                      onClick={() => obterEstoqueAtual(produto) > 0 && adicionarAoCarrinho(produto, 1)}
                    >
                      <div className="flex-1">
                        <h3 className="font-medium text-xs sm:text-sm line-clamp-2 mb-1 text-foreground">
                          {produto.nome}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {produto.categoria_nome || 'Sem categoria'}
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs sm:text-sm font-bold ${
                          obterEstoqueAtual(produto) === 0 ? 'text-gray-500 dark:text-gray-400' : 'text-green-600 dark:text-green-400'
                        }`}>
                          {produto.preco.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL"
                          })}
                        </span>
                        <span className={`text-xs ${
                          obterEstoqueAtual(produto) === 0 ? 'text-gray-500 dark:text-gray-400' : 'text-muted-foreground'
                        }`}>
                          {formatarEstoque(produto)}
                        </span>
                      </div>
                      {obterEstoqueAtual(produto) === 0 && (
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 font-medium text-center">
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
        <Card className="w-full lg:w-96 flex flex-col bg-muted border shadow-xl rounded-xl h-[28rem] sm:h-[32rem] lg:h-[calc(100vh-150px)] min-h-0 order-1 lg:order-2">
          <CardHeader className="bg-muted border-b rounded-t-xl flex-shrink-0 pb-3 sm:pb-6">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2 text-foreground text-sm sm:text-base">
                <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Carrinho de Compras</span>
              </CardTitle>
              <Badge variant="secondary" className="bg-green-600 text-white text-xs">
                {carrinho.length} itens
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-0 bg-muted min-h-0">
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
                            })} x {(() => {
                              const unidade = obterUnidadeEstoque(item.produto.tipo_preco, item.produto.nome);
                              const unidades = obterUnidadesEntrada(unidade);
                              if (unidade === 'kg') {
                                // Se o produto é vendido por kg, mostrar em gramas no carrinho
                                const gramas = Math.round(item.quantidade * 1000);
                                return `${gramas}g`;
                              } else if (unidade === 'L') {
                                // Se o produto é vendido por L, mostrar em mL no carrinho
                                const mL = Math.round(item.quantidade * 1000);
                                return `${mL}mL`;
                              }
                              return `${item.quantidade} ${unidade}`;
                            })()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-1">
                          {(() => {
                            const unidade = obterUnidadeEstoque(item.produto.tipo_preco, item.produto.nome);
                            // Mostrar botão de editar para produtos por peso/volume
                            if (unidade === 'kg' || unidade === 'L') {
                              return (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => editarItemPesoVolume(item)}
                                  className="text-blue-500 hover:text-blue-600 p-0.5 h-auto flex-shrink-0"
                                >
                                  <Edit className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                </Button>
                              );
                            }
                            return null;
                          })()}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removerDoCarrinho(item.produto.id)}
                            className="text-red-500 hover:text-red-600 p-0.5 h-auto flex-shrink-0"
                          >
                            <Trash2 className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1">
                          {(() => {
                            const unidade = obterUnidadeEstoque(item.produto.tipo_preco, item.produto.nome);
                            // Só mostrar botões + e - para produtos vendidos por unidade
                            if (unidade === 'un.') {
                              return (
                                <>
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
                                </>
                              );
                            } else {
                              // Para produtos por peso/volume, mostrar apenas a quantidade
                              return (
                                <span className="text-xs text-muted-foreground">
                                  Quantidade: {item.quantidade} {unidade}
                                </span>
                              );
                            }
                          })()}
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
            <div className="p-3 sm:p-4 border-t bg-muted border rounded-b-xl flex-shrink-0">
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

      {/* Modal para Peso/Volume */}
      <Dialog open={modalPesoVolumeAberto} onOpenChange={setModalPesoVolumeAberto}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5" />
              <span>{editandoItem ? 'Editar Produto' : 'Adicionar Produto'}</span>
            </DialogTitle>
          </DialogHeader>
          
          {produtoSelecionado && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl p-5 border border-slate-200 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-base text-slate-800 mb-1">{produtoSelecionado.nome}</h3>
                    <p className="text-sm text-slate-500">
                      {produtoSelecionado.categoria_nome || 'Sem categoria'}
                    </p>
                  </div>
                  <Package className="h-6 w-6 text-slate-400" />
                </div>
                <div className="bg-white rounded-lg p-3 border border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-600">
                      Preço por {obterUnidadeEstoque(produtoSelecionado.tipo_preco, produtoSelecionado.nome)}:
                    </span>
                    <span className="text-lg font-bold text-green-600">
                      {produtoSelecionado.preco.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL"
                      })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-3">
                  <label className="text-sm font-medium text-slate-700">Unidade de medida:</label>
                  <div className="flex bg-slate-100 rounded-lg p-1 shadow-inner">
                    {(() => {
                      const unidade = obterUnidadeEstoque(produtoSelecionado.tipo_preco, produtoSelecionado.nome);
                      const unidades = obterUnidadesEntrada(unidade);
                      return (
                        <>
                          <button
                            type="button"
                            onClick={() => setUnidadeEntrada('pequena')}
                            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                              unidadeEntrada === 'pequena'
                                ? 'bg-card text-foreground shadow-md border border-border transform scale-105'
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                            }`}
                          >
                            <div className="flex flex-col items-center space-y-0.5">
                              <span className="text-sm font-bold">{unidades.pequena}</span>
                              <span className="text-xs opacity-75">
                                {unidade === 'kg' ? 'Gramas' : unidade === 'L' ? 'Mililitros' : 'Pequena'}
                              </span>
                            </div>
                          </button>
                          <button
                            type="button"
                            onClick={() => setUnidadeEntrada('grande')}
                            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                              unidadeEntrada === 'grande'
                                ? 'bg-card text-foreground shadow-md border border-border transform scale-105'
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                            }`}
                          >
                            <div className="flex flex-col items-center space-y-0.5">
                              <span className="text-sm font-bold">{unidades.grande}</span>
                              <span className="text-xs opacity-75">
                                {unidade === 'kg' ? 'Quilos' : unidade === 'L' ? 'Litros' : 'Grande'}
                              </span>
                            </div>
                          </button>
                        </>
                      );
                    })()}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Quantidade em {(() => {
                      const unidade = obterUnidadeEstoque(produtoSelecionado.tipo_preco, produtoSelecionado.nome);
                      const unidades = obterUnidadesEntrada(unidade);
                      return unidadeEntrada === 'pequena' ? unidades.pequena : unidades.grande;
                    })()}:
                  </label>
                  <Input
                    type="number"
                    step={unidadeEntrada === 'pequena' ? "1" : "0.01"}
                    min={unidadeEntrada === 'pequena' ? "1" : "0.01"}
                    placeholder={`Ex: ${unidadeEntrada === 'pequena' ? '500' : '0.5'}`}
                    value={quantidadePesoVolume}
                    onChange={(e) => setQuantidadePesoVolume(e.target.value)}
                    className="text-lg font-medium text-center border-2 border-border focus:border-green-400 focus:ring-2 focus:ring-green-100 rounded-xl h-12"
                  />
                </div>
                
                {(() => {
                  const unidade = obterUnidadeEstoque(produtoSelecionado.tipo_preco, produtoSelecionado.nome);
                  const unidades = obterUnidadesEntrada(unidade);
                  if (unidade === 'kg') {
                    return (
                      <p className="text-xs text-muted-foreground">
                        {unidadeEntrada === 'pequena' 
                          ? 'Exemplo: 500g = 0,5kg | 1000g = 1kg'
                          : 'Exemplo: 0,5kg | 1kg | 2,5kg'
                        }
                      </p>
                    );
                  } else if (unidade === 'L') {
                    return (
                      <p className="text-xs text-muted-foreground">
                        {unidadeEntrada === 'pequena' 
                          ? 'Exemplo: 500mL = 0,5L | 1000mL = 1L'
                          : 'Exemplo: 0,5L | 1L | 2,5L'
                        }
                      </p>
                    );
                  }
                  return null;
                })()}
              </div>

              {quantidadePesoVolume && !isNaN(parseFloat(quantidadePesoVolume)) && parseFloat(quantidadePesoVolume) > 0 && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-800 rounded-xl p-4 shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-green-800 dark:text-green-200 flex items-center">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Total:
                    </span>
                    <span className="text-2xl font-bold text-green-700 dark:text-green-400">
                      {(() => {
                        const quantidade = parseFloat(quantidadePesoVolume);
                        const unidade = obterUnidadeEstoque(produtoSelecionado.tipo_preco, produtoSelecionado.nome);
                        const unidades = obterUnidadesEntrada(unidade);
                        const quantidadeParaCalculo = unidadeEntrada === 'pequena' ? quantidade / unidades.fator : quantidade;
                        return (quantidadeParaCalculo * produtoSelecionado.preco).toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL"
                        });
                      })()}
                    </span>
                  </div>
                  <div className="bg-card rounded-lg p-3 border border-green-200 dark:border-green-800">
                    <p className="text-sm text-green-700 dark:text-green-400 font-medium text-center">
                      {(() => {
                        const quantidade = parseFloat(quantidadePesoVolume);
                        const unidade = obterUnidadeEstoque(produtoSelecionado.tipo_preco, produtoSelecionado.nome);
                        const unidades = obterUnidadesEntrada(unidade);
                        const unidadeExibicao = unidadeEntrada === 'pequena' ? unidades.pequena : unidades.grande;
                        const quantidadeParaCalculo = unidadeEntrada === 'pequena' ? quantidade / unidades.fator : quantidade;
                        return `${quantidade} ${unidadeExibicao} (${quantidadeParaCalculo} ${unidade}) × ${produtoSelecionado.preco.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL"
                        })}`;
                      })()}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex space-x-3 pt-4">
                <Button
                  variant="outline"
                  onClick={cancelarPesoVolume}
                  className="flex-1 h-12 text-muted-foreground border-border hover:bg-muted hover:border-muted-foreground transition-all duration-200 font-medium"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
                <Button
                  onClick={confirmarPesoVolume}
                  disabled={!quantidadePesoVolume || isNaN(parseFloat(quantidadePesoVolume)) || parseFloat(quantidadePesoVolume) <= 0}
                  className="flex-1 h-12 bg-green-600 hover:bg-green-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  {editandoItem ? 'Atualizar no Carrinho' : 'Adicionar ao Carrinho'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}