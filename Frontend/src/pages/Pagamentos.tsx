import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Trash2,
  User,
  CreditCard,
  Receipt,
  ShoppingCart,
  Calculator,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  Clock,
  Percent,
  Minus,
  Loader2,
  ArrowLeft,
  ArrowRight,
  Printer
} from "lucide-react";
import { useBuscaClientes } from "@/hooks/useBuscaClientes";
import { Cliente } from "@/hooks/useClientes";
import { MetodoPagamento, PagamentoPrazo } from "@/hooks/useVendas";
import { usePagamentos } from "@/hooks/usePagamentos";
import { useTenant } from "@/hooks/useTenant";
import { useToast } from "@/hooks/use-toast";

interface ItemCarrinho {
  produto: any;
  quantidade: number;
  precoUnitario: number;
  precoTotal: number;
}

export default function Pagamentos() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  // Dados da venda vindos do estado da navegação
  const vendaData = location.state as {
    carrinho: ItemCarrinho[];
    clienteSelecionado: Cliente | null;
    subtotal: number;
    desconto: string;
    total: number;
  } || {
    carrinho: [],
    clienteSelecionado: null,
    subtotal: 0,
    desconto: "0",
    total: 0
  };

  // Hooks para integração com API
  const { clientesFiltrados, termoBuscaCliente, setTermoBuscaCliente, carregando: carregandoClientes } = useBuscaClientes();
  const { 
    loading: salvandoVenda, 
    calcularPagamentoPrazo, 
    calcularValorRestantePrazo, 
    validarFormulario, 
    processarDadosVenda, 
    criarVenda 
  } = usePagamentos();
  const { tenant, loading: carregandoTenant } = useTenant();
  
  // Estados do formulário
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(vendaData.clienteSelecionado);
  const [carrinho] = useState<ItemCarrinho[]>(vendaData.carrinho);
  const [desconto, setDesconto] = useState(vendaData.desconto);
  const [metodosPagamento, setMetodosPagamento] = useState<MetodoPagamento[]>([]);
  const [metodoPagamentoUnico, setMetodoPagamentoUnico] = useState("");
  const [valorDinheiro, setValorDinheiro] = useState("");
  const [mostrarSelecaoCliente, setMostrarSelecaoCliente] = useState(false);
  
  // Estados para pagamento a prazo
  const [pagamentoPrazo, setPagamentoPrazo] = useState<PagamentoPrazo>({
    dias: "",
    juros: "",
    valorComJuros: 0,
    dataVencimento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  });
  const [usarPagamentoPrazo, setUsarPagamentoPrazo] = useState(false);

  // Estado para venda finalizada
  const [vendaFinalizada, setVendaFinalizada] = useState<any>(null);

  // Cálculos
  const subtotal = vendaData.subtotal;
  const descontoNum = parseFloat(desconto) || 0;
  const valorDesconto = (subtotal * descontoNum) / 100;
  const total = subtotal - valorDesconto;

  // Função para calcular valor com juros e data de vencimento
  const handleCalcularPagamentoPrazo = (dias: string, juros: string) => {
    const valorBase = metodosPagamento.length > 0 ? calcularValorRestantePrazo(metodosPagamento, total) : total;
    calcularPagamentoPrazo(dias, juros, valorBase, setPagamentoPrazo);
  };

  // Função para calcular o valor restante para pagamento a prazo
  const handleCalcularValorRestantePrazo = () => {
    return calcularValorRestantePrazo(metodosPagamento, total);
  };

  // Atualizar pagamento a prazo quando o total ou métodos de pagamento mudarem
  useEffect(() => {
    if (usarPagamentoPrazo) {
      handleCalcularPagamentoPrazo(pagamentoPrazo.dias, pagamentoPrazo.juros);
    }
  }, [total, usarPagamentoPrazo, metodosPagamento]);

  // Desativar pagamento a prazo quando cliente for removido
  useEffect(() => {
    if (!clienteSelecionado && usarPagamentoPrazo) {
      setUsarPagamentoPrazo(false);
    }
  }, [clienteSelecionado, usarPagamentoPrazo]);

  const salvarVenda = async () => {
    try {
      // Processar dados da venda usando o hook
      const dadosVenda = processarDadosVenda(
        { carrinho, clienteSelecionado, subtotal, desconto, total },
        metodosPagamento,
        metodoPagamentoUnico,
        valorDinheiro,
        usarPagamentoPrazo,
        pagamentoPrazo
      );

      // Salvar venda via API
      const vendaCriada = await criarVenda(dadosVenda);
      
      // Preparar dados para o modal da nota
      const dadosNota = {
        ...vendaCriada,
        cliente: clienteSelecionado,
        itens: carrinho,
        metodos_pagamento: dadosVenda.metodos_pagamento,
        pagamento_prazo: dadosVenda.pagamento_prazo,
        subtotal: subtotal,
        desconto: valorDesconto,
        total: dadosVenda.total,
        data_hora: new Date()
      };
      
      // Salvar dados da venda finalizada
      setVendaFinalizada(dadosNota);
      
      toast({
        title: "Venda realizada com sucesso!",
        description: `Venda #${vendaCriada.numero_venda} foi criada`,
      });

      // Opcional: Imprimir automaticamente após um pequeno delay
      // setTimeout(() => {
      //   imprimirNota();
      // }, 1000);
      
    } catch (error: any) {
      toast({
        title: "Erro ao salvar venda",
        description: error.message || "Ocorreu um erro inesperado",
        variant: "destructive",
      });
    }
  };

  const validacaoFormulario = validarFormulario(
    carrinho,
    metodosPagamento,
    metodoPagamentoUnico,
    valorDinheiro,
    usarPagamentoPrazo,
    pagamentoPrazo,
    total
  );
  
  const formularioValido = validacaoFormulario === "Pagamento a prazo configurado" || 
    validacaoFormulario === "Preencha todos os campos obrigatórios";

  const fecharVenda = () => {
    setVendaFinalizada(null);
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

  const voltarParaVenda = () => {
    navigate("/dashboard/nova-venda", { 
      state: { 
        carrinho, 
        clienteSelecionado, 
        desconto,
        subtotal,
        total 
      } 
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold">💳 Terminal de Pagamento</h1>
          <p className="text-muted-foreground">
            Configure o pagamento da venda
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            onClick={voltarParaVenda}
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

      {/* Layout Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coluna Esquerda - Resumo e Desconto */}
        <div className="space-y-6">
          {/* Resumo da Venda */}
          <Card className="bg-slate-50 border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <Receipt className="h-5 w-5 mr-2 text-slate-600" />
                Resumo da Venda
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Itens no carrinho:</span>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  {carrinho.length} produtos
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Subtotal:</span>
                <span className="font-medium">
                  {subtotal.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL"
                  })}
                </span>
              </div>
              {parseFloat(desconto) > 0 && (
                <div className="flex justify-between items-center text-green-600">
                  <span>Desconto ({desconto}%):</span>
                  <span className="font-medium">
                    -{valorDesconto.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL"
                    })}
                  </span>
                </div>
              )}
              <div className="border-t pt-3">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>TOTAL:</span>
                  <span className="text-green-600">
                    {total.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL"
                    })}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Desconto */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <Percent className="h-5 w-5 mr-2 text-orange-600" />
                Desconto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-3">
                <Input
                  type="text"
                  placeholder="0"
                  value={desconto}
                  onChange={(e) => setDesconto(e.target.value)}
                  className="text-lg text-center"
                />
                <span className="text-slate-600 font-medium">%</span>
                {parseFloat(desconto) > 0 && (
                  <span className="text-green-600 font-bold">
                    = {valorDesconto.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL"
                    })}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Cliente */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <User className="h-5 w-5 mr-2 text-blue-600" />
                Cliente
              </CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        </div>

        {/* Coluna Direita - Formas de Pagamento */}
        <div className="space-y-6">
          {/* Método de Pagamento Único */}
          {metodosPagamento.length === 0 && (
            <Card className="border-green-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <CreditCard className="h-5 w-5 mr-2 text-green-600" />
                  Forma de Pagamento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-700">
                    Selecione o método
                  </label>
                  <select
                    value={metodoPagamentoUnico}
                    onChange={(e) => {
                      setMetodoPagamentoUnico(e.target.value);
                      if (e.target.value !== "dinheiro") {
                        setValorDinheiro("");
                      }
                    }}
                    className="w-full p-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg"
                  >
                    <option value="">💳 Escolha uma forma de pagamento</option>
                    <option value="pix">⚡ PIX</option>
                    <option value="cartao_credito">💳 Cartão de Crédito</option>
                    <option value="cartao_debito">💳 Cartão de Débito</option>
                    <option value="dinheiro">💵 Dinheiro</option>
                    <option value="transferencia">🏦 Transferência</option>
                    <option value="boleto">📄 Boleto</option>
                  </select>
                </div>

                {/* Campo de Valor em Dinheiro */}
                {metodoPagamentoUnico === "dinheiro" && (
                  <div className="bg-yellow-50 p-4 rounded-lg border-2 border-yellow-200">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2 text-yellow-800">
                          💵 Valor recebido
                        </label>
                        <Input
                          type="text"
                          value={valorDinheiro}
                          onChange={(e) => setValorDinheiro(e.target.value)}
                          placeholder="0,00"
                          className="text-lg font-bold"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2 text-yellow-800">
                          🔄 Troco
                        </label>
                        <Input
                          type="text"
                          value={Math.max(0, (parseFloat(valorDinheiro) || 0) - (usarPagamentoPrazo ? pagamentoPrazo.valorComJuros : total)).toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                          disabled
                          className="bg-yellow-100 text-yellow-800 text-lg font-bold"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <Button
                  variant="outline"
                  onClick={() => {
                    setMetodosPagamento([{ metodo: "", valor: "" }]);
                  }}
                  className="w-full border-green-300 text-green-600 hover:bg-green-50"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Múltiplos Métodos
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Múltiplos Métodos de Pagamento */}
          {metodosPagamento.length > 0 && (
            <Card className="border-blue-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center">
                    <CreditCard className="h-5 w-5 mr-2 text-blue-600" />
                    Múltiplos Métodos
                  </CardTitle>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setMetodosPagamento([...metodosPagamento, { metodo: "", valor: "" }]);
                      }}
                      className="border-green-300 text-green-600 hover:bg-green-50"
                    >
                      <Plus className="h-4 w-4 mr-1" />
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
                      <X className="h-4 w-4 mr-1" />
                      Único
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {metodosPagamento.map((metodo, index) => (
                  <div key={index} className="grid grid-cols-3 gap-3 p-4 bg-slate-50 rounded-lg border">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-slate-700">
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
                        <option value="pix">⚡ PIX</option>
                        <option value="cartao_credito">💳 Crédito</option>
                        <option value="cartao_debito">💳 Débito</option>
                        <option value="dinheiro">💵 Dinheiro</option>
                        <option value="transferencia">🏦 Transferência</option>
                        <option value="boleto">📄 Boleto</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2 text-slate-700">
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
                        className="text-center"
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
                <div className="bg-slate-100 rounded-lg p-4">
                  <h4 className="font-bold mb-3 text-slate-800">Resumo dos Pagamentos</h4>
                  <div className="space-y-2">
                    {metodosPagamento.map((metodo, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="capitalize text-slate-600">
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
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total Pago:</span>
                        <span className="text-green-600">
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
          <Card className="border-purple-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-purple-600" />
                  Pagamento a Prazo
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="usarPagamentoPrazo"
                    checked={usarPagamentoPrazo}
                    onChange={(e) => setUsarPagamentoPrazo(e.target.checked)}
                    disabled={!clienteSelecionado || (metodosPagamento.length > 0 && handleCalcularValorRestantePrazo() <= 0)}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 disabled:opacity-50"
                  />
                  <label htmlFor="usarPagamentoPrazo" className="text-sm font-medium text-slate-700">
                    Ativar pagamento a prazo
                  </label>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {!clienteSelecionado && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800 text-sm text-center">
                    ⚠️ Selecione um cliente para ativar o pagamento a prazo
                  </p>
                </div>
              )}

              {usarPagamentoPrazo && clienteSelecionado && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-purple-800">
                        📅 Dias para Pagamento
                      </label>
                      <Input
                        type="text"
                        placeholder="30"
                        value={pagamentoPrazo.dias}
                              onChange={(e) => {
                                const dias = e.target.value;
                                handleCalcularPagamentoPrazo(dias, pagamentoPrazo.juros);
                              }}
                        className="text-center"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2 text-purple-800">
                        📈 Juros (%)
                      </label>
                      <Input
                        type="text"
                        placeholder="0"
                        value={pagamentoPrazo.juros}
                              onChange={(e) => {
                                const juros = e.target.value;
                                handleCalcularPagamentoPrazo(pagamentoPrazo.dias, juros);
                              }}
                        className="text-center"
                      />
                    </div>
                  </div>
                  
                  {/* Informações do pagamento a prazo */}
                  <div className="bg-white rounded-lg p-4 border border-purple-300">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Valor Original:</span>
                        <span className="font-medium">
                                {(metodosPagamento.length > 0 ? handleCalcularValorRestantePrazo() : total).toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL"
                          })}
                        </span>
                      </div>
                      {parseFloat(pagamentoPrazo.juros) > 0 && (
                        <div className="flex justify-between text-orange-600">
                          <span>Juros ({pagamentoPrazo.juros}%):</span>
                          <span className="font-medium">
                                    +{((metodosPagamento.length > 0 ? handleCalcularValorRestantePrazo() : total) * parseFloat(pagamentoPrazo.juros) / 100).toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL"
                            })}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-purple-600 border-t border-purple-200 pt-2 text-lg">
                        <span>Total a Pagar:</span>
                        <span>{pagamentoPrazo.valorComJuros.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL"
                        })}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Vencimento:</span>
                        <span>{pagamentoPrazo.dataVencimento.toLocaleDateString("pt-BR")}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Validação do Formulário */}
      {!formularioValido && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 text-red-800">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm font-medium">
              {validacaoFormulario}
            </span>
          </div>
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
