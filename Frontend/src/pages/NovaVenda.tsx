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
  Phone
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
      const dadosVenda = {
        cliente_id: clienteSelecionado?.id || null,
        itens: itensVenda,
        metodos_pagamento: metodosFinais,
        pagamento_prazo: usarPagamentoPrazo ? pagamentoPrazo : undefined,
        subtotal: parseFloat(subtotal.toString()),
        desconto: parseFloat(valorDesconto.toString()),
        total: parseFloat(totalFinal.toString()),
        forma_pagamento: metodosFinais[0]?.metodo || metodoPagamentoUnico,
        parcelas: parseInt(parcelas.toString()) || 1,
        observacoes: observacao
      };

      
      // Salvar venda via API
      const vendaCriada = await criarVenda(dadosVenda);
      
      // Preparar dados para o modal da nota
      const dadosNota = {
        ...vendaCriada,
        cliente: clienteSelecionado,
        itens: carrinho,
        metodos_pagamento: metodosFinais,
        pagamento_prazo: usarPagamentoPrazo ? pagamentoPrazo : undefined,
        subtotal: subtotal,
        desconto: valorDesconto,
        total: totalFinal,
        data_hora: new Date()
      };
      
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
                  <div>Juros (${vendaFinalizada.pagamento_prazo.juros}%): +${(vendaFinalizada.pagamento_prazo.valorComJuros - vendaFinalizada.total).toLocaleString('pt-BR', {
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
                TOTAL: ${vendaFinalizada?.total?.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }) || 'R$ 0,00'}
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
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Nova Venda</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Registre uma nova venda para seu cliente
          </p>
        </div>
        <div className="flex flex-col space-y-2 md:flex-row md:items-center md:space-y-0 md:space-x-2">
          <Button variant="outline" onClick={() => window.history.back()} className="w-full md:w-auto">
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button 
            className="w-full md:w-auto bg-gradient-primary" 
            onClick={salvarVenda}
            disabled={!formularioValido || salvandoVenda}
          >
            {salvandoVenda ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {salvandoVenda ? "Salvando..." : "Finalizar Venda"}
          </Button>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="grid gap-4 lg:gap-6 lg:grid-cols-3">
        {/* Coluna Esquerda - Formulário */}
        <div className="lg:col-span-2">
          <Tabs value={abaAtiva} onValueChange={setAbaAtiva} className="space-y-4">
            <TabsList className="grid w-full grid-cols-3 h-auto p-1">
              <TabsTrigger value="venda-rapida" className="flex flex-col items-center space-y-1 p-2 text-xs md:text-sm md:flex-row md:space-y-0 md:space-x-2">
                <Zap className="h-4 w-4" />
                <span className="hidden sm:inline">Venda Rápida</span>
              </TabsTrigger>
              <TabsTrigger value="produtos" className="flex flex-col items-center space-y-1 p-2 text-xs md:text-sm md:flex-row md:space-y-0 md:space-x-2">
                <Package className="h-4 w-4" />
                <span className="hidden sm:inline">Produtos</span>
                {carrinho.length > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {carrinho.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="pagamento" className="flex flex-col items-center space-y-1 p-2 text-xs md:text-sm md:flex-row md:space-y-0 md:space-x-2">
                <CreditCard className="h-4 w-4" />
                <span className="hidden sm:inline">Pagamento</span>
              </TabsTrigger>
            </TabsList>

            {/* Aba Venda Rápida */}
            <TabsContent value="venda-rapida" className="space-y-4">
              <Card className="bg-gradient-card shadow-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center text-lg md:text-xl">
                      <Zap className="h-5 w-5 mr-2" />
                      Venda Rápida
                    </CardTitle>
                    {carrinho.length > 0 && (
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="outline"
                          onClick={limparVendaRapida}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Limpar
                        </Button>
                        <Button 
                          onClick={() => setAbaAtiva("pagamento")}
                          className="bg-gradient-primary"
                        >
                          Continuar para Pagamento
                          <CreditCard className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Busca por Código de Barras */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium">Código de Barras</label>
                    <div className="flex space-x-2">
                      <div className="relative flex-1">
                        <Barcode className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="Digite ou escaneie o código de barras"
                          value={codigoBarras}
                          onChange={(e) => setCodigoBarras(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && buscarPorCodigoBarras()}
                          className="pl-10"
                        />
                      </div>
                      <Button onClick={buscarPorCodigoBarras} disabled={!codigoBarras.trim() || carregandoCodigoBarras}>
                        {carregandoCodigoBarras ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Search className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Botão para ir para aba de Produtos */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Produtos</label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAbaAtiva("produtos")}
                      >
                        Buscar Produtos
                      </Button>
                    </div>
                  </div>

                  {/* Seleção de Cliente (Opcional) */}
                  <div className="space-y-3 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Cliente (Opcional)</label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (mostrarSelecaoCliente) {
                            setMostrarSelecaoCliente(false);
                            setTermoBuscaCliente("");
                          } else {
                            setMostrarSelecaoCliente(true);
                          }
                        }}
                      >
                        {mostrarSelecaoCliente ? "Ocultar" : "Selecionar Cliente"}
                      </Button>
                    </div>
                    
                    {mostrarSelecaoCliente && (
                      <div className="space-y-3">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            placeholder="Digite o nome, CPF ou CNPJ do cliente..."
                            value={termoBuscaCliente}
                            onChange={(e) => setTermoBuscaCliente(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                                                 <div className="max-h-48 overflow-y-auto space-y-2">
                           {/* Opção Novo Cliente */}
                           <div
                             className="p-2 rounded border cursor-pointer transition-colors border-dashed border-primary/50 hover:bg-primary/10 hover:border-primary"
                             onClick={() => {
                               setMostrarSelecaoCliente(false);
                               irParaNovoCliente();
                             }}
                           >
                             <div className="flex items-center space-x-2">
                               <Plus className="h-4 w-4 text-primary" />
                               <p className="font-medium text-sm text-primary">Novo Cliente</p>
                             </div>
                           </div>
                           
                           {/* Lista de Clientes Existentes */}
                           {(() => {
                             if (carregandoClientes) {
                               return (
                                 <div className="p-3 text-center text-muted-foreground">
                                   <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                                   <p className="text-sm">Buscando clientes...</p>
                                 </div>
                               );
                             }
                             
                             if (clientesFiltrados.length === 0 && termoBuscaCliente.trim()) {
                               return (
                                 <div className="p-3 text-center text-muted-foreground">
                                   <p className="text-sm">Nenhum cliente encontrado</p>
                                   <p className="text-xs">Tente buscar por outro termo ou adicione um novo cliente</p>
                                 </div>
                               );
                             }
                             
                             // Se não há termo de busca, mostrar todos os clientes
                             const clientesParaMostrar = clientesFiltrados;
                             
                             // Se não há clientes cadastrados
                             if (clientesParaMostrar.length === 0 && !carregandoClientes) {
                               return (
                                 <div className="p-3 text-center text-muted-foreground">
                                   <p className="text-sm">Nenhum cliente encontrado</p>
                                   <p className="text-xs">Digite para buscar ou clique em "Novo Cliente" para adicionar</p>
                                 </div>
                               );
                             }
                             
                             return clientesParaMostrar.map((cliente) => (
                               <div
                                 key={cliente.id}
                                 className={`p-2 rounded border cursor-pointer transition-colors ${
                                   clienteSelecionado?.id === cliente.id
                                     ? "border-primary bg-primary/10"
                                     : "hover:bg-muted/50"
                                 }`}
                                 onClick={() => {
                                   setClienteSelecionado(cliente);
                                   setMostrarSelecaoCliente(false);
                                   setTermoBuscaCliente("");
                                 }}
                               >
                                 <p className="font-medium text-sm">{cliente.nome}</p>
                                 <p className="text-xs text-muted-foreground">{cliente.cpf_cnpj}</p>
                               </div>
                             ));
                           })()}
                         </div>
                      </div>
                    )}

                    {clienteSelecionado && (
                      <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">{clienteSelecionado.nome}</p>
                            <p className="text-xs text-muted-foreground">{clienteSelecionado.cpf_cnpj}</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setClienteSelecionado(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Resumo do Carrinho */}
                  {carrinho.length > 0 && (
                    <div className="pt-4 border-t">
                      <h4 className="font-medium mb-3">Produtos Selecionados</h4>
                      <div className="space-y-2">
                        {carrinho.map((item) => (
                          <div key={item.produto.id} className="flex flex-col space-y-2 p-2 rounded bg-muted/30 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{item.produto.nome}</p>
                              <p className="text-xs text-muted-foreground">
                                {item.precoUnitario.toLocaleString("pt-BR", {
                                  style: "currency",
                                  currency: "BRL"
                                })} x {item.quantidade}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Input
                                type="text"
                                value={item.quantidade}
                                onChange={(e) => atualizarQuantidade(item.produto.id, parseInt(e.target.value) || 1)}
                                className="w-16 text-sm"
                              />
                              <span className="font-medium text-primary min-w-[70px] md:min-w-[80px] text-right text-sm">
                                {item.precoTotal.toLocaleString("pt-BR", {
                                  style: "currency",
                                  currency: "BRL"
                                })}
                              </span>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => removerDoCarrinho(item.produto.id)}
                                className="px-2 md:px-3"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                      

                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Aba Produtos */}
            <TabsContent value="produtos" className="space-y-4">
              <Card className="bg-gradient-card shadow-card">
                <CardHeader>
                  <CardTitle className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                    <span className="flex items-center text-lg md:text-xl">
                      <Package className="h-5 w-5 mr-2" />
                      Selecionar Produtos
                    </span>
                    <Badge variant="secondary" className="w-fit">
                      {carrinho.length} produto(s) selecionado(s)
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Buscar Produtos */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Buscar produtos por nome, código ou categoria..."
                      value={termoBusca}
                      onChange={(e) => setTermoBusca(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Lista de Produtos */}
                  <div className="max-h-80 md:max-h-96 overflow-y-auto space-y-2">
                    {carregandoProdutos ? (
                      <div className="p-3 text-center text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                        <p className="text-sm">Buscando produtos...</p>
                      </div>
                    ) : produtosFiltrados.length === 0 ? (
                      <div className="p-3 text-center text-muted-foreground">
                        <p className="text-sm">Nenhum produto encontrado</p>
                        <p className="text-xs">Digite para buscar produtos ou adicione um novo</p>
                      </div>
                    ) : (
                      produtosFiltrados.map((produto) => (
                        <div key={produto.id} className="flex flex-col space-y-3 p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm md:text-base">{produto.nome}</h4>
                            <div className="flex flex-col space-y-1 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4 text-xs md:text-sm text-muted-foreground">
                              <span>{produto.categoria_nome || 'Sem categoria'}</span>
                              <span className="hidden sm:inline">•</span>
                              <span>Estoque: {produto.estoque} un.</span>
                              <span className="hidden sm:inline">•</span>
                              <span className="font-medium text-primary">
                                {produto.preco.toLocaleString("pt-BR", {
                                  style: "currency",
                                  currency: "BRL"
                                })}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                const itemExistente = carrinho.find(item => item.produto.id === produto.id);
                                if (itemExistente && itemExistente.quantidade > 1) {
                                  atualizarQuantidade(produto.id, itemExistente.quantidade - 1);
                                } else if (itemExistente && itemExistente.quantidade === 1) {
                                  removerDoCarrinho(produto.id);
                                }
                              }}
                              disabled={produto.estoque === 0}
                              className="px-2 md:px-3 text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700"
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            
                            <Input
                              type="text"
                              placeholder="0"
                              value={(() => {
                                const itemExistente = carrinho.find(item => item.produto.id === produto.id);
                                return itemExistente ? itemExistente.quantidade : "";
                              })()}
                              onChange={(e) => {
                                const quantidade = parseInt(e.target.value) || 0;
                                definirQuantidadeCarrinho(produto, quantidade);
                              }}
                              className="w-16 md:w-20 text-sm text-center"
                            />
                            
                            <Button 
                              size="sm" 
                              onClick={() => adicionarAoCarrinho(produto, 1)}
                              disabled={produto.estoque === 0}
                              className="px-2 md:px-3"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Resumo do Carrinho */}
                  {carrinho.length > 0 && (
                    <div className="pt-4 border-t">
                      <h4 className="font-medium mb-3">Produtos Selecionados</h4>
                      <div className="space-y-2">
                        {carrinho.map((item) => (
                          <div key={item.produto.id} className="flex flex-col space-y-2 p-2 rounded bg-muted/30 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{item.produto.nome}</p>
                              <p className="text-xs text-muted-foreground">
                                {item.precoUnitario.toLocaleString("pt-BR", {
                                  style: "currency",
                                  currency: "BRL"
                                })} x {item.quantidade}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Input
                                type="text"
                                placeholder="0"
                                value={item.quantidade}
                                onChange={(e) => atualizarQuantidade(item.produto.id, parseInt(e.target.value) || 1)}
                                className="w-16 text-sm"
                              />
                              <span className="font-medium text-primary min-w-[70px] md:min-w-[80px] text-right text-sm">
                                {item.precoTotal.toLocaleString("pt-BR", {
                                  style: "currency",
                                  currency: "BRL"
                                })}
                              </span>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => removerDoCarrinho(item.produto.id)}
                                className="px-2 md:px-3"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex justify-end pt-3">
                        <Button 
                          onClick={() => setAbaAtiva("pagamento")}
                          className="bg-gradient-primary w-full md:w-auto"
                        >
                          Continuar para Pagamento
                          <CreditCard className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

                        {/* Aba Pagamento */}
            <TabsContent value="pagamento" className="space-y-4">
              <Card className="bg-gradient-card shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg md:text-xl">
                    <CreditCard className="h-5 w-5 mr-2" />
                    Forma de Pagamento
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                                     {/* Método de Pagamento Único (Padrão) */}
                   {metodosPagamento.length === 0 && (
                     <div className="space-y-3">
                       <div className="flex items-center justify-between">
                         <label className="text-sm font-medium">Método de Pagamento</label>
                                                   <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setMetodosPagamento([{ metodo: "", valor: "" }]);
                            }}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Adicionar Múltiplos
                          </Button>
                       </div>
                       
                       <div className="grid gap-4 grid-cols-1 md:grid-cols-2 p-3 border rounded-lg">
                         <div>
                           <label className="text-sm font-medium">Método</label>
                           <select
                             value={metodoPagamentoUnico}
                             onChange={(e) => {
                               setMetodoPagamentoUnico(e.target.value);
                               if (e.target.value !== "dinheiro") {
                                 setValorDinheiro("");
                               }
                             }}
                             className="w-full mt-1 p-2 border rounded-md bg-background"
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
                           <label className="text-sm font-medium">Valor</label>
                           <Input
                             type="text"
                             placeholder="0,00"
                             value={(usarPagamentoPrazo ? pagamentoPrazo.valorComJuros : total).toLocaleString("pt-BR", {
                               minimumFractionDigits: 2,
                               maximumFractionDigits: 2
                             })}
                             disabled
                             className="mt-1 bg-muted/50"
                           />
                         </div>
                       </div>

                       {/* Campo de Valor em Dinheiro e Cálculo de Troco */}
                       {metodoPagamentoUnico === "dinheiro" && (
                         <div className="grid gap-4 grid-cols-1 md:grid-cols-2 p-3 border rounded-lg bg-muted/30">
                           <div>
                             <label className="text-sm font-medium">Valor em Dinheiro</label>
                             <Input
                               type="text"
                               value={valorDinheiro}
                               onChange={(e) => setValorDinheiro(e.target.value)}
                               className="mt-1"
                               placeholder="0,00"
                             />
                           </div>
                           
                           <div>
                             <label className="text-sm font-medium">Troco</label>
                             <Input
                               type="text"
                               value={Math.max(0, (parseFloat(valorDinheiro) || 0) - (usarPagamentoPrazo ? pagamentoPrazo.valorComJuros : total)).toLocaleString("pt-BR", {
                                 minimumFractionDigits: 2,
                                 maximumFractionDigits: 2
                               })}
                               disabled
                               className="mt-1 bg-muted/50"
                               placeholder="0,00"
                             />
                           </div>
                         </div>
                       )}
                     </div>
                   )}

                   {/* Múltiplos Métodos de Pagamento */}
                   {metodosPagamento.length > 0 && (
                     <div className="space-y-3">
                                               <div className="flex items-center justify-between">
                          <label className="text-sm font-medium">Métodos de Pagamento</label>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setMetodosPagamento([...metodosPagamento, { metodo: "", valor: "" }]);
                              }}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Adicionar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setMetodosPagamento([]);
                                // Não desativar automaticamente o pagamento a prazo
                                // setUsarPagamentoPrazo(false);
                              }}
                            >
                              <X className="h-4 w-4 mr-2" />
                              Voltar ao Único
                            </Button>
                          </div>
                        </div>
                       
                       {metodosPagamento.map((metodo, index) => (
                         <div key={index} className="grid gap-4 grid-cols-1 md:grid-cols-3 p-3 border rounded-lg">
                           <div>
                             <label className="text-sm font-medium">Método</label>
                             <select
                               value={metodo.metodo}
                               onChange={(e) => {
                                 const novosMetodos = [...metodosPagamento];
                                 novosMetodos[index].metodo = e.target.value;
                                 novosMetodos[index].valor = "";
                                 setMetodosPagamento(novosMetodos);
                               }}
                               className="w-full mt-1 p-2 border rounded-md bg-background"
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
                             <label className="text-sm font-medium">Valor</label>
                             <Input
                               type="text"
                               value={metodo.valor}
                               onChange={(e) => {
                                 const novosMetodos = [...metodosPagamento];
                                 novosMetodos[index].valor = e.target.value;
                                 setMetodosPagamento(novosMetodos);
                               }}
                               className="mt-1"
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
                               className="w-full"
                             >
                               <X className="h-4 w-4" />
                             </Button>
                           </div>
                         </div>
                       ))}

                                               {/* Informação sobre valor restante */}
                        {(() => {
                          const totalPago = metodosPagamento.reduce((sum, m) => sum + (parseFloat(m.valor) || 0), 0);
                          const valorRestante = total - totalPago;
                          
                          // Verificar se há métodos com valores vazios ou zerados
                          const temValoresVazios = metodosPagamento.some(m => !m.valor || parseFloat(m.valor) === 0);
                          
                          if (temValoresVazios) {
                            return (
                              <div className="p-3 border rounded-lg bg-warning/10 border-warning/20">
                                <div className="flex justify-between text-sm">
                                  <span className="text-warning font-medium">Falta Pagar:</span>
                                  <span className="text-warning font-medium">
                                    {valorRestante.toLocaleString("pt-BR", {
                                      style: "currency",
                                      currency: "BRL"
                                    })}
                                  </span>
                                </div>
                                <p className="text-xs text-warning mt-1">Complete os valores dos métodos de pagamento</p>
                              </div>
                            );
                          } else if (valorRestante > 0) {
                            return (
                              <div className="p-3 border rounded-lg bg-warning/10 border-warning/20">
                                <div className="flex justify-between text-sm">
                                  <span className="text-warning font-medium">Falta Pagar:</span>
                                  <span className="text-warning font-medium">
                                    {valorRestante.toLocaleString("pt-BR", {
                                      style: "currency",
                                      currency: "BRL"
                                    })}
                                  </span>
                                </div>
                              </div>
                            );
                          } else if (valorRestante < 0) {
                            return (
                              <div className="p-3 border rounded-lg bg-success/10 border-success/20">
                                <div className="flex justify-between text-sm">
                                  <span className="text-success font-medium">Troco:</span>
                                  <span className="text-success font-medium">
                                    {Math.abs(valorRestante).toLocaleString("pt-BR", {
                                      style: "currency",
                                      currency: "BRL"
                                    })}
                                  </span>
                                </div>
                              </div>
                            );
                          } else {
                            return (
                              <div className="p-3 border rounded-lg bg-success/10 border-success/20">
                                <div className="flex justify-between text-sm">
                                  <span className="text-success font-medium">Pagamento Completo</span>
                                  <span className="text-success">✓</span>
                                </div>
                              </div>
                            );
                          }
                        })()}
                     </div>
                   )}

                                       {/* Pagamento a Prazo (Opcional) */}
                    <div className="space-y-3 pt-4 border-t">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">Pagamento a Prazo</label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="usarPagamentoPrazo"
                            checked={usarPagamentoPrazo}
                            onChange={(e) => setUsarPagamentoPrazo(e.target.checked)}
                            disabled={!clienteSelecionado || (metodosPagamento.length > 0 && calcularValorRestantePrazo() <= 0)}
                            className="h-4 w-4 text-primary focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                          <label htmlFor="usarPagamentoPrazo" className={`text-sm ${(!clienteSelecionado || (metodosPagamento.length > 0 && calcularValorRestantePrazo() <= 0)) ? 'text-muted-foreground' : ''}`}>
                            Usar pagamento a prazo
                          </label>
                        </div>
                      </div>
                      
                      {!clienteSelecionado && (
                        <div className="p-3 rounded-lg bg-muted/30 border border-dashed border-muted-foreground/30">
                          <p className="text-sm text-muted-foreground text-center">
                            Selecione um cliente para ativar o pagamento a prazo
                          </p>
                        </div>
                      )}

                      {metodosPagamento.length > 0 && calcularValorRestantePrazo() <= 0 && (
                        <div className="p-3 rounded-lg bg-muted/30 border border-dashed border-muted-foreground/30">
                          <p className="text-sm text-muted-foreground text-center">
                            Não há valor restante para configurar pagamento a prazo
                          </p>
                        </div>
                      )}
                      
                      {usarPagamentoPrazo && clienteSelecionado && (
                        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 p-3 border rounded-lg bg-muted/30">
                          <div>
                            <label className="text-sm font-medium">Dias para Pagamento</label>
                            <Input
                              type="text"
                              placeholder="0"
                              value={pagamentoPrazo.dias}
                              onChange={(e) => {
                                const dias = e.target.value;
                                calcularPagamentoPrazo(dias, pagamentoPrazo.juros);
                              }}
                              className="mt-1"
                            />
                          </div>
                          
                          <div>
                            <label className="text-sm font-medium">Juros (%)</label>
                            <Input
                              type="text"
                              placeholder="0"
                              value={pagamentoPrazo.juros}
                              onChange={(e) => {
                                const juros = e.target.value;
                                calcularPagamentoPrazo(pagamentoPrazo.dias, juros);
                              }}
                              className="mt-1"
                            />
                          </div>
                          
                          {/* Informações do pagamento a prazo */}
                          <div className="md:col-span-2 space-y-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Valor Original:</span>
                              <span className="font-medium">
                                {(metodosPagamento.length > 0 ? calcularValorRestantePrazo() : total).toLocaleString("pt-BR", {
                                  style: "currency",
                                  currency: "BRL"
                                })}
                              </span>
                            </div>
                            {parseFloat(pagamentoPrazo.juros) > 0 && (
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Juros ({pagamentoPrazo.juros}%):</span>
                                <span className="font-medium text-warning">+{((metodosPagamento.length > 0 ? calcularValorRestantePrazo() : total) * parseFloat(pagamentoPrazo.juros) / 100).toLocaleString("pt-BR", {
                                  style: "currency",
                                  currency: "BRL"
                                })}</span>
                              </div>
                            )}
                            <div className="flex justify-between text-sm font-medium border-t pt-2">
                              <span>Total a Pagar:</span>
                              <span className="text-primary">{pagamentoPrazo.valorComJuros.toLocaleString("pt-BR", {
                                style: "currency",
                                currency: "BRL"
                              })}</span>
                            </div>
                            <div className="flex justify-between text-sm text-muted-foreground">
                              <span>Vencimento:</span>
                              <span>{pagamentoPrazo.dataVencimento.toLocaleDateString("pt-BR")}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                                                         {/* Resumo dos Pagamentos */}
                    {metodosPagamento.length > 0 && (
                      <div className="p-3 border rounded-lg bg-muted/30">
                        <h4 className="font-medium text-sm mb-2">Resumo dos Pagamentos</h4>
                        <div className="space-y-1">
                          {metodosPagamento.map((metodo, index) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span className="capitalize">{metodo.metodo.replace('_', ' ')}:</span>
                              <span>{(parseFloat(metodo.valor) || 0).toLocaleString("pt-BR", {
                                style: "currency",
                                currency: "BRL"
                              })}</span>
                            </div>
                          ))}
                          <div className="border-t pt-1 mt-2">
                            <div className="flex justify-between text-sm font-medium">
                              <span>Total Pago:</span>
                              <span>{metodosPagamento.reduce((sum, m) => sum + (parseFloat(m.valor) || 0), 0).toLocaleString("pt-BR", {
                                style: "currency",
                                currency: "BRL"
                              })}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Valor da Venda:</span>
                              <span>{total.toLocaleString("pt-BR", {
                                style: "currency",
                                currency: "BRL"
                              })}</span>
                            </div>
                            
                            {/* Indicador de Valor Restante */}
                            {(() => {
                              const totalPago = metodosPagamento.reduce((sum, m) => sum + (parseFloat(m.valor) || 0), 0);
                              const valorRestante = total - totalPago;
                              
                              // Verificar se há métodos com valores vazios ou zerados
                              const temValoresVazios = metodosPagamento.some(m => !m.valor || parseFloat(m.valor) === 0);
                              
                              if (temValoresVazios) {
                                return (
                                  <div className="flex justify-between text-sm font-medium text-warning border-t pt-1 mt-1">
                                    <span>Falta Pagar:</span>
                                    <span>{total.toLocaleString("pt-BR", {
                                      style: "currency",
                                      currency: "BRL"
                                    })}</span>
                                  </div>
                                );
                              } else if (valorRestante > 0) {
                                return (
                                  <div className="flex justify-between text-sm font-medium text-warning border-t pt-1 mt-1">
                                    <span>Falta Pagar:</span>
                                    <span>{valorRestante.toLocaleString("pt-BR", {
                                      style: "currency",
                                      currency: "BRL"
                                    })}</span>
                                  </div>
                                );
                              } else if (valorRestante < 0) {
                                return (
                                  <div className="flex justify-between text-sm font-medium text-success border-t pt-1 mt-1">
                                    <span>Troco:</span>
                                    <span>{Math.abs(valorRestante).toLocaleString("pt-BR", {
                                      style: "currency",
                                      currency: "BRL"
                                    })}</span>
                                  </div>
                                );
                              } else {
                                return (
                                  <div className="flex justify-between text-sm font-medium text-success border-t pt-1 mt-1">
                                    <span>Pagamento Completo</span>
                                    <span>✓</span>
                                  </div>
                                );
                              }
                            })()}
                            
                            {/* Informações adicionais do pagamento a prazo */}
                            {usarPagamentoPrazo && (() => {
                              const valorRestante = total - metodosPagamento.reduce((sum, m) => sum + (parseFloat(m.valor) || 0), 0);
                              return valorRestante > 0;
                            })() && (
                              <div className="border-t pt-2 mt-2 space-y-1">
                                {(() => {
                                  const valorRestante = total - metodosPagamento.reduce((sum, m) => sum + (parseFloat(m.valor) || 0), 0);
                                  return (
                                    <>
                                      <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>Valor Original:</span>
                                        <span>{valorRestante.toLocaleString("pt-BR", {
                                          style: "currency",
                                          currency: "BRL"
                                        })}</span>
                                      </div>
                                      {parseFloat(pagamentoPrazo.juros) > 0 && (
                                        <div className="flex justify-between text-xs text-warning">
                                          <span>Juros ({pagamentoPrazo.juros}%):</span>
                                          <span>+{(valorRestante * parseFloat(pagamentoPrazo.juros) / 100).toLocaleString("pt-BR", {
                                            style: "currency",
                                            currency: "BRL"
                                          })}</span>
                                        </div>
                                      )}
                                      <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>Vencimento:</span>
                                        <span>{pagamentoPrazo.dataVencimento.toLocaleDateString("pt-BR")}</span>
                                      </div>
                                    </>
                                  );
                                })()}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                                     <div>
                     <label className="text-sm font-medium">Desconto (%)</label>
                     <Input
                       type="text"
                       placeholder="0"
                       value={desconto}
                       onChange={(e) => setDesconto(e.target.value)}
                       className="mt-1"
                     />
                   </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Coluna Direita - Resumo do Pedido */}
        <div className="space-y-4 order-first lg:order-last">
          {/* Card de Resumo do Pedido */}
          <Card className="bg-gradient-card shadow-card lg:sticky lg:top-4">
            <CardHeader>
              <CardTitle className="flex items-center text-lg md:text-xl">
                <Receipt className="h-5 w-5 mr-2" />
                Resumo da Venda
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Informações do Cliente */}
              {clienteSelecionado || cliente.nome ? (
                <div className="p-3 rounded-lg bg-muted/30">
                  <h4 className="font-medium text-sm mb-2">Cliente</h4>
                  {clienteSelecionado ? (
                    <div>
                      <p className="text-sm">{clienteSelecionado.nome}</p>
                      <p className="text-xs text-muted-foreground">{clienteSelecionado.cpf_cnpj}</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm">{cliente.nome}</p>
                      {cliente.cpf_cnpj && (
                        <p className="text-xs text-muted-foreground">{cliente.cpf_cnpj}</p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-muted/30 text-center text-muted-foreground">
                  <p>Nenhum cliente selecionado.</p>
                </div>
              )}

              {/* Itens do Carrinho */}
              {carrinho.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Produtos ({carrinho.length})</h4>
                  <div className="max-h-32 md:max-h-48 overflow-y-auto space-y-1">
                    {carrinho.map((item) => (
                      <div key={item.produto.id} className="flex justify-between text-sm">
                        <span className="truncate flex-1">
                          {item.quantidade}x {item.produto.nome}
                        </span>
                        <span className="font-medium ml-2">
                          {item.precoTotal.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL"
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

                             {/* Resumo do Pagamento */}
               <div className="space-y-2 pt-2 border-t">
                 {/* Métodos de Pagamento */}
                 {metodosPagamento.length > 0 && (
                   <div className="space-y-1">
                     <h4 className="font-medium text-sm">Formas de Pagamento</h4>
                     {metodosPagamento.map((metodo, index) => (
                       <div key={index} className="flex justify-between text-sm">
                         <span className="capitalize">{metodo.metodo.replace('_', ' ')}:</span>
                         <span>{(parseFloat(metodo.valor) || 0).toLocaleString("pt-BR", {
                           style: "currency",
                           currency: "BRL"
                         })}</span>
                       </div>
                     ))}
                     <div className="border-t pt-1 mt-1">
                       <div className="flex justify-between text-sm font-medium">
                         <span>Total Pago:</span>
                         <span>{metodosPagamento.reduce((sum, m) => sum + (parseFloat(m.valor) || 0), 0).toLocaleString("pt-BR", {
                           style: "currency",
                           currency: "BRL"
                         })}</span>
                       </div>
                     </div>
                   </div>
                 )}

                 {/* Método Único de Pagamento */}
                 {metodoPagamentoUnico && metodosPagamento.length === 0 && (
                   <div className="space-y-1">
                     <h4 className="font-medium text-sm">Forma de Pagamento</h4>
                     <div className="flex justify-between text-sm">
                       <span className="capitalize">{metodoPagamentoUnico.replace('_', ' ')}:</span>
                       <span>{(usarPagamentoPrazo ? pagamentoPrazo.valorComJuros : total).toLocaleString("pt-BR", {
                         style: "currency",
                         currency: "BRL"
                       })}</span>
                     </div>
                   </div>
                 )}

                 <div className="flex justify-between text-sm">
                   <span>Subtotal:</span>
                   <span>{subtotal.toLocaleString("pt-BR", {
                     style: "currency",
                     currency: "BRL"
                   })}</span>
                 </div>
                
                {parseFloat(desconto) > 0 && (
                  <div className="flex justify-between text-sm text-success">
                    <span>Desconto ({desconto}%):</span>
                    <span>-{valorDesconto.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL"
                    })}</span>
                  </div>
                )}

                {parseFloat(parcelas) > 1 && (
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Parcelas:</span>
                    <span>{parcelas}x de {(total / parseFloat(parcelas)).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL"
                    })}</span>
                  </div>
                )}

                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Total:</span>
                  <span className="text-primary">
                    {(() => {
                      if (metodosPagamento.length > 0 && usarPagamentoPrazo) {
                        // Se há métodos múltiplos com pagamento a prazo, mostrar a soma
                        const totalPago = metodosPagamento.reduce((sum, m) => sum + (parseFloat(m.valor) || 0), 0);
                        const valorRestante = total - totalPago;
                        if (valorRestante > 0) {
                          return (totalPago + pagamentoPrazo.valorComJuros).toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL"
                          });
                        }
                      } else if (usarPagamentoPrazo && metodosPagamento.length === 0) {
                        // Se não há métodos múltiplos, mas há pagamento a prazo
                        return pagamentoPrazo.valorComJuros.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL"
                        });
                      }
                      
                      // Caso padrão: mostrar o total normal
                      return total.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL"
                      });
                    })()}
                  </span>
                </div>

                                                   {/* Informações do Pagamento a Prazo */}
                  {usarPagamentoPrazo && (
                    <div className="pt-2 border-t">
                      {parseFloat(pagamentoPrazo.juros) > 0 && (
                        <div className="flex justify-between text-sm text-warning">
                          <span>Juros ({pagamentoPrazo.juros}%):</span>
                          <span>+{((metodosPagamento.length > 0 ? calcularValorRestantePrazo() : total) * parseFloat(pagamentoPrazo.juros) / 100).toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL"
                          })}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm font-medium text-warning">
                        <span>Valor a Prazo:</span>
                        <span>{pagamentoPrazo.valorComJuros.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL"
                        })}</span>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Prazo:</span>
                        <span>{pagamentoPrazo.dias} dias</span>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Vencimento:</span>
                        <span>{pagamentoPrazo.dataVencimento.toLocaleDateString("pt-BR")}</span>
                      </div>
                    </div>
                  )}

                {/* Informações de Pagamento em Dinheiro */}
                {metodoPagamentoUnico === "dinheiro" && parseFloat(valorDinheiro) > 0 && (
                  <>
                    <div className="flex justify-between text-sm text-muted-foreground pt-2 border-t">
                      <span>Valor em Dinheiro:</span>
                                              <span>{(parseFloat(valorDinheiro) || 0).toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL"
                        })}</span>
                    </div>
                    
                    {parseFloat(valorDinheiro) > total && (
                      <div className="flex justify-between text-sm text-success font-medium">
                        <span>Troco:</span>
                        <span>{((parseFloat(valorDinheiro) || 0) - total).toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL"
                        })}</span>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Botões de Ação */}
              <div className="space-y-2 pt-4">
                <Button 
                  className="w-full bg-gradient-primary" 
                  onClick={salvarVenda}
                  disabled={!formularioValido || salvandoVenda}
                >
                  {salvandoVenda ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  {salvandoVenda ? "Salvando..." : "Finalizar Venda"}
                </Button>
                
                                 {!formularioValido && (
                   <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                     <AlertCircle className="h-3 w-3" />
                     <span>
                       {(() => {
                         if (!carrinho.length) return "Adicione produtos ao carrinho";
                         
                         // Se for pagamento a prazo, validar se os métodos cobrem o valor com juros
                         if (usarPagamentoPrazo) {
                           if (metodosPagamento.length > 0) {
                             const totalPago = metodosPagamento.reduce((sum, m) => sum + (parseFloat(m.valor) || 0), 0);
                             const valorRestante = total - totalPago;
                             if (valorRestante > 0) {
                               // Se há valor restante, o pagamento a prazo deve cobrir esse valor
                               if (pagamentoPrazo.valorComJuros < valorRestante) {
                                 return `O pagamento a prazo deve cobrir pelo menos R$ ${valorRestante.toFixed(2)}`;
                               }
                             }
                             // Verificar se todos os métodos têm valores válidos
                             const metodoIncompleto = metodosPagamento.find(m => !m.metodo || parseFloat(m.valor) <= 0);
                             if (metodoIncompleto) {
                               return "Complete todos os métodos de pagamento com valores válidos";
                             }
                           }
                           return "Pagamento a prazo configurado";
                         }
                         
                         // Validação para pagamento normal (sem prazo)
                         if (metodosPagamento.length > 0) {
                           const totalPago = metodosPagamento.reduce((sum, m) => sum + (parseFloat(m.valor) || 0), 0);
                           if (totalPago < total) {
                             return `Falta R$ ${(total - totalPago).toFixed(2)} para completar o pagamento`;
                           }
                           // Verificar se todos os métodos têm valores válidos
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
                 )}
              </div>
            </CardContent>
          </Card>

          {/* Ações Rápidas */}
          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle className="text-sm">Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start"
                onClick={irParaNovoCliente}
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Cliente
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start"
                onClick={irParaNovoProduto}
              >
                <Package className="h-4 w-4 mr-2" />
                Adicionar Produto
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Calculator className="h-4 w-4 mr-2" />
                Calculadora
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Botões de Ação após Venda */}
      {vendaFinalizada && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center mb-6">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Venda Realizada com Sucesso!
                </h3>
              <p className="text-sm text-gray-500">
                Venda #{vendaFinalizada.numero_venda} foi criada
              </p>
                  </div>
            
            <div className="flex flex-col space-y-3">
              <Button 
                onClick={imprimirNota} 
                className="w-full bg-gradient-primary"
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
          </div>
        </div>
      )}
    </div>
  );
}
