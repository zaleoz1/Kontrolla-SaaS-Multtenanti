import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Search, 
  Trash2,
  User,
  Package,
  CreditCard,
  Receipt,
  ShoppingCart,
  Calculator,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  Zap,
  Barcode,
  Clock,
  Percent,
  Minus,
  Loader2,
  Printer,
  Building2,
  Calendar,
  MapPin,
  Phone,
  ScanLine,
  DollarSign,
  ShoppingBag,
  Monitor,
  Keyboard,
  MousePointer,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Settings
} from "lucide-react";
import { useBuscaClientes } from "@/hooks/useBuscaClientes";
import { useBuscaProdutos } from "@/hooks/useBuscaProdutos";
import { useBuscaCodigoBarras } from "@/hooks/useProdutos";
import { Cliente } from "@/hooks/useClientes";
import { Produto } from "@/hooks/useProdutos";
import { useCriarVenda, ItemVenda, MetodoPagamento, PagamentoPrazo } from "@/hooks/useVendas";
import { useTenant } from "@/hooks/useTenant";
import { useToast } from "@/hooks/use-toast";

interface ItemCarrinho {
  produto: Produto;
  quantidade: number;
  precoUnitario: number;
  precoTotal: number;
}

export default function NovaVenda() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Hooks para integração com API
  const { clientesFiltrados, termoBuscaCliente, setTermoBuscaCliente, carregando: carregandoClientes } = useBuscaClientes();
  const { produtosFiltrados, termoBusca, setTermoBusca, carregando: carregandoProdutos } = useBuscaProdutos();
  const { buscarPorCodigo, carregando: carregandoCodigoBarras } = useBuscaCodigoBarras();
  const { criar: criarVenda, loading: salvandoVenda } = useCriarVenda();
  const { tenant, loading: carregandoTenant } = useTenant();
  
  const [abaAtiva, setAbaAtiva] = useState("venda-rapida");
  const [cliente, setCliente] = useState<Cliente>({
    id: 0,
    nome: "",
    email: "",
    telefone: "",
    cpf_cnpj: "",
    endereco: "",
    tipo_pessoa: "fisica",
    status: "ativo",
    vip: false,
    limite_credito: 0,
    total_compras: 0,
    data_criacao: "",
    data_atualizacao: ""
  });
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [codigoBarras, setCodigoBarras] = useState("");
  const [metodosPagamento, setMetodosPagamento] = useState<MetodoPagamento[]>([]);
  const [metodoPagamentoUnico, setMetodoPagamentoUnico] = useState("");
  const [parcelas, setParcelas] = useState("");
  const [desconto, setDesconto] = useState("");
  const [observacao, setObservacao] = useState("");
  const [valorDinheiro, setValorDinheiro] = useState("");
  const [mostrarSelecaoCliente, setMostrarSelecaoCliente] = useState(false);
  
  // Novos estados para pagamento a prazo
  const [pagamentoPrazo, setPagamentoPrazo] = useState<PagamentoPrazo>({
    dias: "",
    juros: "",
    valorComJuros: 0,
    dataVencimento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  });
  const [usarPagamentoPrazo, setUsarPagamentoPrazo] = useState(false);

  // Estado para venda finalizada
  const [vendaFinalizada, setVendaFinalizada] = useState<any>(null);

  // Função para calcular valor com juros e data de vencimento
  const calcularPagamentoPrazo = (dias: string, juros: string) => {
    // Se há métodos múltiplos, calcular juros sobre o valor restante
    // Se não há métodos múltiplos, calcular juros sobre o total
    const valorBase = metodosPagamento.length > 0 ? calcularValorRestantePrazo() : total;
    const diasNum = parseFloat(dias) || 0;
    const jurosNum = parseFloat(juros) || 0;
    const valorComJuros = valorBase * (1 + jurosNum / 100);
    const dataVencimento = new Date(Date.now() + diasNum * 24 * 60 * 60 * 1000);
    
    setPagamentoPrazo({
      ...pagamentoPrazo,
      dias,
      juros,
      valorComJuros,
      dataVencimento
    });
  };

  // Função para calcular o valor restante para pagamento a prazo
  const calcularValorRestantePrazo = () => {
    if (metodosPagamento.length === 0) return 0;
    
    const totalPago = metodosPagamento.reduce((sum, m) => sum + (parseFloat(m.valor) || 0), 0);
    return Math.max(0, total - totalPago);
  };

  // Função para atualizar pagamento a prazo automaticamente quando métodos múltiplos mudam
  const atualizarPagamentoPrazoAutomatico = () => {
    if (metodosPagamento.length > 0) {
      const valorRestante = calcularValorRestantePrazo();
      if (valorRestante > 0) {
        // Não ativar automaticamente - apenas calcular o valor com juros se já estiver ativo
        if (usarPagamentoPrazo) {
          const jurosNum = parseFloat(pagamentoPrazo.juros) || 0;
          const diasNum = parseFloat(pagamentoPrazo.dias) || 0;
          const valorComJuros = valorRestante * (1 + jurosNum / 100);
          const dataVencimento = new Date(Date.now() + diasNum * 24 * 60 * 60 * 1000);
          
          setPagamentoPrazo({
            ...pagamentoPrazo,
            valorComJuros,
            dataVencimento
          });
        }
      } else {
        // Desativar pagamento a prazo se não há valor restante
        setUsarPagamentoPrazo(false);
        // Resetar o valor com juros para 0
        setPagamentoPrazo({
          ...pagamentoPrazo,
          valorComJuros: 0
        });
      }
    }
  };

  // Usar produtos filtrados da API
  const produtosDisponiveis = produtosFiltrados;

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
    
    // Resetar valor em dinheiro quando o carrinho muda
    if (metodoPagamentoUnico === "dinheiro") {
      setValorDinheiro("");
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
    
    // Resetar valor em dinheiro quando o carrinho muda
    if (metodoPagamentoUnico === "dinheiro") {
      setValorDinheiro("");
    }
  };

  const removerDoCarrinho = (produtoId: number) => {
    setCarrinho(carrinho.filter(item => item.produto.id !== produtoId));
    
    // Resetar valor em dinheiro quando o carrinho muda
    if (metodoPagamentoUnico === "dinheiro") {
      setValorDinheiro("");
    }
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
    
    // Resetar valor em dinheiro quando o carrinho muda
    if (metodoPagamentoUnico === "dinheiro") {
      setValorDinheiro("");
    }
  };

  const subtotal = carrinho.reduce((soma, item) => soma + item.precoTotal, 0);
  const descontoNum = parseFloat(desconto) || 0;
  const valorDesconto = (subtotal * descontoNum) / 100;
  const total = subtotal - valorDesconto;

  // Atualizar pagamento a prazo quando o total ou métodos de pagamento mudarem
  useEffect(() => {
    if (usarPagamentoPrazo) {
      // Sempre usar a função calcularPagamentoPrazo que já trata corretamente os casos
      calcularPagamentoPrazo(pagamentoPrazo.dias, pagamentoPrazo.juros);
    }
  }, [total, usarPagamentoPrazo, metodosPagamento]);

  // Atualizar pagamento a prazo automaticamente quando métodos múltiplos mudam
  useEffect(() => {
    if (metodosPagamento.length > 0) {
      // Apenas atualizar se já estiver ativo
      if (usarPagamentoPrazo) {
        atualizarPagamentoPrazoAutomatico();
      }
    }
  }, [metodosPagamento]);

  // Desativar pagamento a prazo quando cliente for removido
  useEffect(() => {
    if (!clienteSelecionado && usarPagamentoPrazo) {
      setUsarPagamentoPrazo(false);
    }
  }, [clienteSelecionado, usarPagamentoPrazo]);

  // Limpar métodos de pagamento quando pagamento a prazo for ativado e não há pagamento múltiplo
  useEffect(() => {
    if (usarPagamentoPrazo && metodosPagamento.length === 0) {
      // Limpar método único de pagamento
      setMetodoPagamentoUnico("");
      setValorDinheiro("");
    }
  }, [usarPagamentoPrazo, metodosPagamento.length]);

  const salvarVenda = async () => {
    try {
      // Determinar os métodos de pagamento finais
      let metodosFinais = metodosPagamento;
      
      // Se não há métodos configurados, mas há um método único selecionado, usar o padrão
      if (metodosPagamento.length === 0 && metodoPagamentoUnico) {
        if (metodoPagamentoUnico === "dinheiro") {
          const valorAlvo = usarPagamentoPrazo ? pagamentoPrazo.valorComJuros : total;
          metodosFinais = [{ 
            metodo: metodoPagamentoUnico, 
            valor: valorDinheiro,
            troco: Math.max(0, (parseFloat(valorDinheiro) || 0) - valorAlvo)
          }];
        } else {
          const valorAlvo = usarPagamentoPrazo ? pagamentoPrazo.valorComJuros : total;
          metodosFinais = [{ metodo: metodoPagamentoUnico, valor: valorAlvo.toString() }];
        }
      } else if (metodosPagamento.length > 0) {
        // Processar métodos múltiplos para calcular troco se houver dinheiro
        const valorAlvo = usarPagamentoPrazo ? pagamentoPrazo.valorComJuros : total;
        metodosFinais = metodosPagamento.map(metodo => {
          if (metodo.metodo === "dinheiro") {
            return {
              ...metodo,
              troco: Math.max(0, parseFloat(metodo.valor) - (valorAlvo - metodosPagamento.reduce((sum, m) => 
                m.metodo !== "dinheiro" ? sum + parseFloat(m.valor) : sum, 0)))
            };
          }
          return metodo;
        });
      }
      
      // Calcular o total final da venda
      let totalFinal = total;
      if (metodosPagamento.length > 0 && usarPagamentoPrazo) {
        const totalPago = metodosPagamento.reduce((sum, m) => sum + parseFloat(m.valor), 0);
        const valorRestante = total - totalPago;
        if (valorRestante > 0) {
          // O total final é a soma do que foi pago + o valor restante com juros
          totalFinal = totalPago + pagamentoPrazo.valorComJuros;
        }
      } else if (usarPagamentoPrazo && metodosPagamento.length === 0) {
        // Se não há métodos múltiplos, mas há pagamento a prazo, usar o valor com juros
        totalFinal = pagamentoPrazo.valorComJuros;
      }
      
      // Preparar itens da venda
      const itensVenda: ItemVenda[] = carrinho.map(item => ({
        produto_id: parseInt(item.produto.id.toString()),
        quantidade: parseInt(item.quantidade.toString()),
        preco_unitario: parseFloat(item.precoUnitario.toString()),
        preco_total: parseFloat(item.precoTotal.toString()),
        desconto: 0
      }));
      
      // Preparar dados da venda
      const statusVenda: 'pendente' | 'pago' = usarPagamentoPrazo ? 'pendente' : 'pago';
      const dadosVenda = {
        cliente_id: clienteSelecionado?.id || null,
        itens: itensVenda,
        metodos_pagamento: metodosFinais,
        pagamento_prazo: usarPagamentoPrazo ? {
          ...pagamentoPrazo,
          valorOriginal: metodosPagamento.length > 0 ? calcularValorRestantePrazo() : total
        } : undefined,
        subtotal: parseFloat(subtotal.toString()),
        desconto: parseFloat(valorDesconto.toString()),
        total: parseFloat(totalFinal.toString()),
        forma_pagamento: metodosFinais.length > 0 ? metodosFinais[0]?.metodo : (metodoPagamentoUnico || null),
        parcelas: parseInt(parcelas.toString()) || 1,
        observacoes: observacao,
        status: statusVenda
      };

      // Debug: verificar dados antes de enviar
      console.log('Dados da venda:', dadosVenda);
      console.log('Usar pagamento a prazo:', usarPagamentoPrazo);
      console.log('Status definido:', statusVenda);

      
      // Salvar venda via API
      const vendaCriada = await criarVenda(dadosVenda);
      
      // Preparar dados para o modal da nota
      const dadosNota = {
        ...vendaCriada,
        cliente: clienteSelecionado,
        itens: carrinho,
        metodos_pagamento: metodosFinais,
        pagamento_prazo: usarPagamentoPrazo ? {
          ...pagamentoPrazo,
          valorOriginal: metodosPagamento.length > 0 ? calcularValorRestantePrazo() : total
        } : undefined,
        subtotal: subtotal,
        desconto: valorDesconto,
        total: totalFinal,
        data_hora: new Date()
      };
      
      // Debug: verificar dados da nota
      console.log('Dados da nota:', dadosNota);
      console.log('Pagamento a prazo na nota:', dadosNota.pagamento_prazo);
      
      // Salvar dados da venda finalizada
      setVendaFinalizada(dadosNota);
      
      toast({
        title: "Venda realizada com sucesso!",
        description: `Venda #${vendaCriada.numero_venda} foi criada`,
      });
      
    } catch (error: any) {
      toast({
        title: "Erro ao salvar venda",
        description: error.message || "Ocorreu um erro inesperado",
        variant: "destructive",
      });
    }
  };

  const formularioValido = carrinho.length > 0 && (
    // Se for pagamento a prazo, não precisa validar métodos de pagamento
    usarPagamentoPrazo || (
      (metodosPagamento.length > 0 && metodosPagamento.reduce((sum, m) => sum + parseFloat(m.valor), 0) >= total) || 
      (metodoPagamentoUnico && (metodoPagamentoUnico !== "dinheiro" || (parseFloat(valorDinheiro) || 0) >= total))
    )
  ) && (
    // Se não for pagamento a prazo, validar métodos de pagamento
    usarPagamentoPrazo || metodosPagamento.length === 0 || 
    metodosPagamento.every(m => m.metodo && parseFloat(m.valor) > 0)
  );

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
    setObservacao("");
    setMetodosPagamento([]);
    setMetodoPagamentoUnico("");
    setValorDinheiro("");
    // Desativar pagamento a prazo quando não há cliente
    setUsarPagamentoPrazo(false);
    setPagamentoPrazo({
      dias: "",
      juros: "",
      valorComJuros: 0,
      dataVencimento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });
    // Limpar busca de cliente
    setTermoBuscaCliente("");
    setMostrarSelecaoCliente(false);
  };

  const fecharVenda = () => {
    setVendaFinalizada(null);
    // Limpar formulário
    limparVendaRapida();
    // Navegar para lista de vendas
    navigate("/dashboard/vendas");
  };

  const imprimirNota = () => {
    if (!vendaFinalizada) return;
    
      const janelaImpressao = window.open('', '_blank');
      if (janelaImpressao) {
        janelaImpressao.document.write(`
          <html>
            <head>
              <title>Nota de Venda #${vendaFinalizada?.numero_venda || ''}</title>
              <style>
              @page {
                size: 80mm auto;
                margin: 0;
              }
              body { 
                font-family: 'Courier New', monospace; 
                margin: 0; 
                padding: 5mm;
                font-size: 12px;
                line-height: 1.2;
                width: 70mm;
              }
              .header { 
                text-align: center; 
                border-bottom: 1px solid #000; 
                padding-bottom: 5px; 
                margin-bottom: 10px; 
              }
              .loja-nome { 
                font-size: 14px; 
                font-weight: bold; 
                margin-bottom: 3px;
              }
              .loja-info { 
                font-size: 10px; 
                margin-bottom: 5px; 
              }
              .venda-info { 
                margin-bottom: 8px; 
                font-size: 10px;
              }
              .cliente-info { 
                margin-bottom: 8px; 
                font-size: 10px;
                border: 1px solid #000;
                padding: 3px;
              }
              .itens { 
                margin-bottom: 8px; 
              }
              .itens table { 
                width: 100%; 
                border-collapse: collapse; 
                font-size: 10px;
              }
              .itens th, .itens td { 
                border: 1px solid #000; 
                padding: 2px; 
                text-align: left; 
              }
              .itens th { 
                background-color: #f0f0f0; 
                font-weight: bold;
              }
              .produto-nome { 
                max-width: 30mm; 
                word-wrap: break-word; 
              }
              .produto-qtd { 
                width: 8mm; 
                text-align: center; 
              }
              .produto-preco { 
                width: 15mm; 
                text-align: right; 
              }
              .produto-total { 
                width: 15mm; 
                text-align: right; 
                font-weight: bold;
              }
              .totais { 
                margin-top: 8px; 
                font-size: 11px;
              }
              .totais table { 
                width: 100%; 
              }
              .totais td { 
                padding: 1px; 
              }
              .total-final { 
                font-weight: bold; 
                font-size: 13px; 
                border-top: 1px solid #000; 
                padding-top: 3px;
              }
              .footer { 
                margin-top: 10px; 
                text-align: center; 
                font-size: 10px; 
                border-top: 1px solid #000;
                padding-top: 5px;
              }
              .separator { 
                border-top: 1px dashed #000; 
                margin: 5px 0; 
              }
              @media print { 
                body { margin: 0; padding: 2mm; }
                .no-print { display: none; }
              }
              </style>
            </head>
            <body>
            <div class="header">
              <div class="loja-nome">
                ${tenant?.nome_fantasia || tenant?.nome || 'Kontrolla'}
              </div>
              <div class="loja-info">
                ${tenant?.endereco ? `
                  <div>
                    ${tenant.endereco}
                    ${tenant.cidade ? ` - ${tenant.cidade}` : ''}
                    ${tenant.estado ? `/${tenant.estado}` : ''}
                    ${tenant.cep ? ` - ${tenant.cep}` : ''}
                  </div>
                ` : ''}
                ${tenant?.telefone ? `<div>Tel: ${tenant.telefone}</div>` : ''}
                ${tenant?.email ? `<div>${tenant.email}</div>` : ''}
                ${(tenant?.cnpj || tenant?.cpf) ? `
                  <div>
                    ${tenant.tipo_pessoa === 'juridica' ? 'CNPJ' : 'CPF'}: ${tenant.cnpj || tenant.cpf}
                  </div>
                ` : ''}
                ${tenant?.inscricao_estadual ? `<div>IE: ${tenant.inscricao_estadual}</div>` : ''}
              </div>
            </div>

            <div class="venda-info">
              <div>Data: ${vendaFinalizada?.data_hora?.toLocaleDateString('pt-BR') || ''} ${vendaFinalizada?.data_hora?.toLocaleTimeString('pt-BR') || ''}</div>
              <div>Venda: #${vendaFinalizada?.numero_venda || ''}</div>
            </div>

            ${vendaFinalizada?.cliente ? `
              <div class="cliente-info">
                <div><strong>CLIENTE:</strong></div>
                <div>Nome: ${vendaFinalizada.cliente.nome}</div>
                <div>CPF/CNPJ: ${vendaFinalizada.cliente.cpf_cnpj}</div>
                ${vendaFinalizada.cliente.telefone ? `<div>Tel: ${vendaFinalizada.cliente.telefone}</div>` : ''}
                ${vendaFinalizada.cliente.email ? `<div>Email: ${vendaFinalizada.cliente.email}</div>` : ''}
              </div>
            ` : ''}

            <div class="itens">
              <div><strong>ITENS:</strong></div>
              <table>
                <thead>
                  <tr>
                    <th class="produto-nome">Produto</th>
                    <th class="produto-qtd">Qtd</th>
                    <th class="produto-preco">Unit.</th>
                    <th class="produto-total">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${vendaFinalizada?.itens?.map((item: ItemCarrinho) => `
                    <tr>
                      <td class="produto-nome">${item.produto.nome}</td>
                      <td class="produto-qtd">${item.quantidade}</td>
                      <td class="produto-preco">
                        ${item.precoUnitario.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        })}
                      </td>
                      <td class="produto-total">
                        ${item.precoTotal.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        })}
                      </td>
                    </tr>
                  `).join('') || ''}
                </tbody>
              </table>
            </div>

            <div class="totais">
              <div class="separator"></div>
              <div>Subtotal: ${vendaFinalizada?.subtotal?.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }) || 'R$ 0,00'}</div>
              
              ${vendaFinalizada?.desconto > 0 ? `
                <div>Desconto: -${vendaFinalizada.desconto.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                })}</div>
              ` : ''}

              ${vendaFinalizada?.metodos_pagamento?.map((metodo: any) => `
                <div>
                  ${metodo.metodo?.replace('_', ' ').toUpperCase()}: ${parseFloat(metodo.valor || 0).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  })}
                </div>
              `).join('') || ''}

              ${vendaFinalizada?.pagamento_prazo ? `
                <div>
                  <div>Valor Original: ${(vendaFinalizada.pagamento_prazo.valorOriginal || vendaFinalizada.total).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  })}</div>
                  <div>Juros (${vendaFinalizada.pagamento_prazo.juros}%): +${(vendaFinalizada.pagamento_prazo.valorComJuros - (vendaFinalizada.pagamento_prazo.valorOriginal || vendaFinalizada.total)).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  })}</div>
                  <div><strong>Valor a Prazo: ${vendaFinalizada.pagamento_prazo.valorComJuros.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  })}</strong></div>
                  <div>Vencimento: ${new Date(vendaFinalizada.pagamento_prazo.dataVencimento).toLocaleDateString('pt-BR')}</div>
                </div>
              ` : ''}

              <div class="separator"></div>
              <div class="total-final">
                TOTAL: ${vendaFinalizada?.pagamento_prazo ? 
                  vendaFinalizada.pagamento_prazo.valorComJuros.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }) : 
                  vendaFinalizada?.total?.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }) || 'R$ 0,00'
                }
              </div>
            </div>

            ${vendaFinalizada?.observacoes ? `
              <div>
                <div><strong>OBS:</strong></div>
                <div>${vendaFinalizada.observacoes}</div>
              </div>
            ` : ''}

            <div class="footer">
              <div>Obrigado pela sua compra!</div>
              <div>Volte sempre!</div>
            </div>
            </body>
          </html>
        `);
        janelaImpressao.document.close();
        janelaImpressao.print();
    }
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
          <Button 
            onClick={salvarVenda}
            disabled={!formularioValido || salvandoVenda}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {salvandoVenda ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            {salvandoVenda ? "Processando..." : "Finalizar Venda"}
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
                  {carregandoCodigoBarras ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Search className="h-5 w-5" />
                  )}
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
                {carregandoProdutos ? (
                  <div className="col-span-full flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : produtosFiltrados.length === 0 ? (
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
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setMostrarSelecaoCliente(!mostrarSelecaoCliente)}
                >
                  <User className="h-4 w-4 mr-1" />
                  {clienteSelecionado ? 'Alterar' : 'Selecionar'}
                </Button>
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

              {/* Lista de Clientes */}
              {mostrarSelecaoCliente && (
                <div className="mt-3 space-y-2 max-h-32 overflow-y-auto">
                  <div
                    className="p-2 rounded border border-dashed border-green-400 cursor-pointer hover:bg-green-50"
                    onClick={() => {
                      setMostrarSelecaoCliente(false);
                      irParaNovoCliente();
                    }}
                  >
                    <div className="flex items-center space-x-2">
                      <Plus className="h-4 w-4 text-green-600" />
                      <p className="text-green-600 text-sm font-medium">Novo Cliente</p>
                    </div>
                  </div>
                  
                  {clientesFiltrados.map((cliente) => (
                    <div
                      key={cliente.id}
                      className={`p-2 rounded cursor-pointer transition-colors ${
                        clienteSelecionado?.id === cliente.id
                          ? "bg-green-600 text-white"
                          : "bg-muted hover:bg-muted/80"
                      }`}
                      onClick={() => {
                        setClienteSelecionado(cliente);
                        setMostrarSelecaoCliente(false);
                      }}
                    >
                      <p className="font-medium text-sm">{cliente.nome}</p>
                      <p className="text-xs opacity-75">{cliente.cpf_cnpj}</p>
                    </div>
                  ))}
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
                onClick={() => setAbaAtiva("pagamento")}
                disabled={carrinho.length === 0}
              >
                <CreditCard className="h-5 w-5 mr-2" />
                Ir para Pagamento
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal de Pagamento */}
      {abaAtiva === "pagamento" && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Terminal de Pagamento</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAbaAtiva("venda-rapida")}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent>
              {/* Resumo da Venda */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Resumo da Venda</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Itens:</span>
                      <span className="ml-2 font-bold">{carrinho.length}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total:</span>
                      <span className="ml-2 font-bold text-green-600">
                        {total.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL"
                        })}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Formas de Pagamento */}
              <div className="space-y-6">
                {/* Método de Pagamento Único */}
                {metodosPagamento.length === 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Forma de Pagamento</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Método
                          </label>
                          <select
                            value={metodoPagamentoUnico}
                            onChange={(e) => {
                              setMetodoPagamentoUnico(e.target.value);
                              if (e.target.value !== "dinheiro") {
                                setValorDinheiro("");
                              }
                            }}
                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          >
                            <option value="">Selecione uma forma de pagamento</option>
                            <option value="pix">PIX</option>
                            <option value="cartao_credito">Cartão de Crédito</option>
                            <option value="cartao_debito">Cartão de Débito</option>
                            <option value="dinheiro">Dinheiro</option>
                            <option value="transferencia">Transferência</option>
                            <option value="boleto">Boleto</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Valor
                          </label>
                          <Input
                            type="text"
                            value={(usarPagamentoPrazo ? pagamentoPrazo.valorComJuros : total).toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })}
                            disabled
                            className="bg-muted text-muted-foreground"
                          />
                        </div>
                      </div>

                      {/* Campo de Valor em Dinheiro */}
                      {metodoPagamentoUnico === "dinheiro" && (
                        <div className="grid grid-cols-2 gap-4 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                          <div>
                            <label className="block text-sm font-medium mb-2">
                              Valor em Dinheiro
                            </label>
                            <Input
                              type="text"
                              value={valorDinheiro}
                              onChange={(e) => setValorDinheiro(e.target.value)}
                              placeholder="0,00"
                              className="text-lg"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium mb-2">
                              Troco
                            </label>
                            <Input
                              type="text"
                              value={Math.max(0, (parseFloat(valorDinheiro) || 0) - (usarPagamentoPrazo ? pagamentoPrazo.valorComJuros : total)).toLocaleString("pt-BR", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                              })}
                              disabled
                              className="bg-muted text-muted-foreground text-lg font-bold"
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex justify-between">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setMetodosPagamento([{ metodo: "", valor: "" }]);
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Adicionar Múltiplos Métodos
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Múltiplos Métodos de Pagamento */}
                {metodosPagamento.length > 0 && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Métodos de Pagamento</CardTitle>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setMetodosPagamento([...metodosPagamento, { metodo: "", valor: "" }]);
                            }}
                            className="border-green-300 text-green-600 hover:bg-green-50"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Adicionar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setMetodosPagamento([]);
                            }}
                            className="border-red-300 text-red-600 hover:bg-red-50"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Voltar ao Único
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                    
                      {metodosPagamento.map((metodo, index) => (
                        <div key={index} className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg border">
                          <div>
                            <label className="block text-sm font-medium mb-2">
                              Método
                            </label>
                            <select
                              value={metodo.metodo}
                              onChange={(e) => {
                                const novosMetodos = [...metodosPagamento];
                                novosMetodos[index].metodo = e.target.value;
                                novosMetodos[index].valor = "";
                                setMetodosPagamento(novosMetodos);
                              }}
                              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                            >
                              <option value="">Selecione</option>
                              <option value="pix">PIX</option>
                              <option value="cartao_credito">Cartão de Crédito</option>
                              <option value="cartao_debito">Cartão de Débito</option>
                              <option value="dinheiro">Dinheiro</option>
                              <option value="transferencia">Transferência</option>
                              <option value="boleto">Boleto</option>
                            </select>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium mb-2">
                              Valor
                            </label>
                            <Input
                              type="text"
                              value={metodo.valor}
                              onChange={(e) => {
                                const novosMetodos = [...metodosPagamento];
                                novosMetodos[index].valor = e.target.value;
                                setMetodosPagamento(novosMetodos);
                              }}
                              placeholder="0,00"
                            />
                          </div>
                          
                          <div className="flex items-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setMetodosPagamento(metodosPagamento.filter((_, i) => i !== index));
                              }}
                              className="w-full border-red-300 text-red-600 hover:bg-red-50"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}

                      {/* Resumo dos Pagamentos */}
                      <div className="bg-muted rounded-lg p-4">
                        <h4 className="font-bold mb-3">Resumo dos Pagamentos</h4>
                        <div className="space-y-2">
                          {metodosPagamento.map((metodo, index) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span className="capitalize text-muted-foreground">
                                {metodo.metodo.replace('_', ' ')}:
                              </span>
                              <span className="font-medium">
                                {(parseFloat(metodo.valor) || 0).toLocaleString("pt-BR", {
                                  style: "currency",
                                  currency: "BRL"
                                })}
                              </span>
                            </div>
                          ))}
                          <div className="border-t pt-2">
                            <div className="flex justify-between font-bold">
                              <span>Total Pago:</span>
                              <span>
                                {metodosPagamento.reduce((sum, m) => sum + (parseFloat(m.valor) || 0), 0).toLocaleString("pt-BR", {
                                  style: "currency",
                                  currency: "BRL"
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Pagamento a Prazo */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Pagamento a Prazo</CardTitle>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="usarPagamentoPrazo"
                          checked={usarPagamentoPrazo}
                          onChange={(e) => setUsarPagamentoPrazo(e.target.checked)}
                          disabled={!clienteSelecionado || (metodosPagamento.length > 0 && calcularValorRestantePrazo() <= 0)}
                          className="h-4 w-4 text-green-600 focus:ring-green-500 disabled:opacity-50"
                        />
                        <label htmlFor="usarPagamentoPrazo" className="text-sm font-medium">
                          Usar pagamento a prazo
                        </label>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {!clienteSelecionado && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-yellow-800 text-sm text-center">
                          Selecione um cliente para ativar o pagamento a prazo
                        </p>
                      </div>
                    )}

                    {usarPagamentoPrazo && clienteSelecionado && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">
                              Dias para Pagamento
                            </label>
                            <Input
                              type="text"
                              placeholder="0"
                              value={pagamentoPrazo.dias}
                              onChange={(e) => {
                                const dias = e.target.value;
                                calcularPagamentoPrazo(dias, pagamentoPrazo.juros);
                              }}
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium mb-2">
                              Juros (%)
                            </label>
                            <Input
                              type="text"
                              placeholder="0"
                              value={pagamentoPrazo.juros}
                              onChange={(e) => {
                                const juros = e.target.value;
                                calcularPagamentoPrazo(pagamentoPrazo.dias, juros);
                              }}
                            />
                          </div>
                        </div>
                        
                        {/* Informações do pagamento a prazo */}
                        <div className="bg-white rounded-lg p-4 border border-green-300">
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Valor Original:</span>
                              <span className="font-medium">
                                {(metodosPagamento.length > 0 ? calcularValorRestantePrazo() : total).toLocaleString("pt-BR", {
                                  style: "currency",
                                  currency: "BRL"
                                })}
                              </span>
                            </div>
                            {parseFloat(pagamentoPrazo.juros) > 0 && (
                              <div className="flex justify-between text-orange-600">
                                <span>Juros ({pagamentoPrazo.juros}%):</span>
                                <span className="font-medium">
                                  +{((metodosPagamento.length > 0 ? calcularValorRestantePrazo() : total) * parseFloat(pagamentoPrazo.juros) / 100).toLocaleString("pt-BR", {
                                    style: "currency",
                                    currency: "BRL"
                                  })}
                                </span>
                              </div>
                            )}
                            <div className="flex justify-between font-bold text-green-600 border-t border-green-200 pt-2">
                              <span>Total a Pagar:</span>
                              <span>{pagamentoPrazo.valorComJuros.toLocaleString("pt-BR", {
                                style: "currency",
                                currency: "BRL"
                              })}</span>
                            </div>
                            <div className="flex justify-between text-muted-foreground">
                              <span>Vencimento:</span>
                              <span>{pagamentoPrazo.dataVencimento.toLocaleDateString("pt-BR")}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Desconto e Observações */}
                <Card>
                  <CardContent className="space-y-4 pt-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium">
                        Desconto (%)
                      </label>
                      <Input
                        type="text"
                        placeholder="0"
                        value={desconto}
                        onChange={(e) => setDesconto(e.target.value)}
                        className="max-w-xs"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium">
                        Observações
                      </label>
                      <textarea
                        value={observacao}
                        onChange={(e) => setObservacao(e.target.value)}
                        placeholder="Observações adicionais..."
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Botões de Ação */}
                <div className="flex space-x-4 pt-6 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setAbaAtiva("venda-rapida")}
                    className="flex-1"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar
                  </Button>
                  <Button
                    onClick={salvarVenda}
                    disabled={!formularioValido || salvandoVenda}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white h-12 text-lg font-bold"
                  >
                    {salvandoVenda ? (
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="h-5 w-5 mr-2" />
                    )}
                    {salvandoVenda ? "Processando..." : "Finalizar Venda"}
                  </Button>
                </div>

                {/* Validação do Formulário */}
                {!formularioValido && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 text-red-800">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        {(() => {
                          if (!carrinho.length) return "Adicione produtos ao carrinho";
                          
                          if (usarPagamentoPrazo) {
                            if (metodosPagamento.length > 0) {
                              const totalPago = metodosPagamento.reduce((sum, m) => sum + (parseFloat(m.valor) || 0), 0);
                              const valorRestante = total - totalPago;
                              if (valorRestante > 0) {
                                if (pagamentoPrazo.valorComJuros < valorRestante) {
                                  return `O pagamento a prazo deve cobrir pelo menos R$ ${valorRestante.toFixed(2)}`;
                                }
                              }
                              const metodoIncompleto = metodosPagamento.find(m => !m.metodo || parseFloat(m.valor) <= 0);
                              if (metodoIncompleto) {
                                return "Complete todos os métodos de pagamento com valores válidos";
                              }
                            }
                            return "Pagamento a prazo configurado";
                          }
                          
                          if (metodosPagamento.length > 0) {
                            const totalPago = metodosPagamento.reduce((sum, m) => sum + (parseFloat(m.valor) || 0), 0);
                            if (totalPago < total) {
                              return `Falta R$ ${(total - totalPago).toFixed(2)} para completar o pagamento`;
                            }
                            const metodoIncompleto = metodosPagamento.find(m => !m.metodo || parseFloat(m.valor) <= 0);
                            if (metodoIncompleto) {
                              return "Complete todos os métodos de pagamento com valores válidos";
                            }
                          }
                          if (metodoPagamentoUnico === "dinheiro" && (parseFloat(valorDinheiro) || 0) < total) {
                            return `Valor em dinheiro deve ser maior ou igual a R$ ${total.toFixed(2)}`;
                          }
                          if (!metodoPagamentoUnico && metodosPagamento.length === 0) return "Selecione uma forma de pagamento";
                          return "Preencha todos os campos obrigatórios";
                        })()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de Venda Finalizada */}
      {vendaFinalizada && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="max-w-md w-full mx-4">
            <CardContent className="pt-6">
              <div className="text-center mb-6">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-lg font-medium mb-2">
                  Venda Realizada com Sucesso!
                </h3>
                <p className="text-sm text-muted-foreground">
                  Venda #{vendaFinalizada.numero_venda} foi criada
                </p>
              </div>
              
              <div className="flex flex-col space-y-3">
                <Button 
                  onClick={imprimirNota} 
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimir Nota
                </Button>
                <Button 
                  variant="outline" 
                  onClick={fecharVenda}
                  className="w-full"
                >
                  <X className="h-4 w-4 mr-2" />
                  Fechar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
