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
  Printer,
  Zap,
  Banknote,
  Building2,
  FileText,
  Calendar,
  QrCode
} from "lucide-react";
import { useBuscaClientes } from "@/hooks/useBuscaClientes";
import { Cliente } from "@/hooks/useClientes";
import { PagamentoPrazo } from "@/hooks/useVendas";
import { usePagamentos } from "@/hooks/usePagamentos";
import { useTenant } from "@/hooks/useTenant";
import { useToast } from "@/hooks/use-toast";
import { useMetodosPagamento } from "@/hooks/useMetodosPagamento";
import { useApi } from "@/hooks/useApi";
import { usePixConfiguracoes } from "@/hooks/usePixConfiguracoes";
import { useDadosBancarios } from "@/hooks/useDadosBancarios";

interface ItemCarrinho {
  produto: any;
  quantidade: number;
  precoUnitario: number;
  precoTotal: number;
}

interface MetodoPagamentoSelecionado {
  metodo: string;
  valor: string;
  parcelas?: number;
  taxaParcela?: number;
}

interface ParcelaDisponivel {
  id: number;
  quantidade: number;
  taxa: number;
  ativo: boolean;
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
  const { metodosPagamento: metodosDisponiveis, buscarMetodosPagamento } = useMetodosPagamento();
  const { loading: carregandoMetodos } = useApi();
  const { configuracao: pixConfiguracao, loading: carregandoPix } = usePixConfiguracoes();
  const { dadosBancarios, loading: carregandoDadosBancarios } = useDadosBancarios();
  
  // Estados do formulário
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(vendaData.clienteSelecionado);
  const [carrinho] = useState<ItemCarrinho[]>(vendaData.carrinho);
  const [desconto, setDesconto] = useState(vendaData.desconto);
  const [metodosPagamento, setMetodosPagamento] = useState<MetodoPagamentoSelecionado[]>([]);
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
  
  // Estados para controle de carregamento
  const [erroCarregamentoMetodos, setErroCarregamentoMetodos] = useState<string | null>(null);
  const [carregandoMetodosPagamento, setCarregandoMetodosPagamento] = useState(false);

  // Função para recarregar métodos de pagamento
  const recarregarMetodosPagamento = async () => {
    try {
      setCarregandoMetodosPagamento(true);
      setErroCarregamentoMetodos(null);
      await buscarMetodosPagamento();
    } catch (error: any) {
      console.error('Erro ao recarregar métodos de pagamento:', error);
      setErroCarregamentoMetodos(error.message || 'Erro ao carregar métodos de pagamento');
    } finally {
      setCarregandoMetodosPagamento(false);
    }
  };

  // Effect para monitorar o carregamento dos métodos de pagamento
  useEffect(() => {
    if (metodosDisponiveis.length === 0 && !carregandoMetodos) {
      // Se não há métodos carregados e não está carregando, pode ser um erro
      setErroCarregamentoMetodos('Nenhum método de pagamento encontrado');
    } else if (metodosDisponiveis.length > 0) {
      setErroCarregamentoMetodos(null);
    }
  }, [metodosDisponiveis.length, carregandoMetodos]);

  // Effect para verificar autenticação
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('🔓 Usuário não autenticado, redirecionando para login');
      navigate('/login');
    }
  }, [navigate]);

  // Estado para venda finalizada
  const [vendaFinalizada, setVendaFinalizada] = useState<any>(null);
  
  // Estado para modal PIX
  const [mostrarModalPix, setMostrarModalPix] = useState(false);
  
  // Estado para modal de dados bancários
  const [mostrarModalDadosBancarios, setMostrarModalDadosBancarios] = useState(false);
  
  // Estados para modal de parcelas
  const [mostrarModalParcelas, setMostrarModalParcelas] = useState(false);
  const [parcelasDisponiveis, setParcelasDisponiveis] = useState<ParcelaDisponivel[]>([]);
  const [metodoSelecionadoParaParcelas, setMetodoSelecionadoParaParcelas] = useState<string>("");
  const [parcelaSelecionada, setParcelaSelecionada] = useState<ParcelaDisponivel | null>(null);
  const [parcelaConfirmada, setParcelaConfirmada] = useState<ParcelaDisponivel | null>(null);
  const [valorParcelaModal, setValorParcelaModal] = useState<number>(0);

  // Cálculos
  const subtotal = vendaData.subtotal;
  const descontoNum = parseFloat(desconto) || 0;
  const valorDesconto = (subtotal * descontoNum) / 100;
  const total = subtotal - valorDesconto;

  // Função utilitária para converter vírgula em ponto para parseFloat
  const parseValorComVirgula = (valor: string): number => {
    if (!valor) return 0;
    // Substitui vírgula por ponto para parseFloat funcionar corretamente
    const valorFormatado = valor.replace(',', '.');
    return parseFloat(valorFormatado) || 0;
  };

  // Função para calcular o TOTAL FINAL exatamente como mostrado no layout
  const calcularTotalFinal = () => {
    if (usarPagamentoPrazo && clienteSelecionado) {
      // Se há pagamento a prazo, o total da venda deve ser apenas o valor pago à vista
      if (metodosPagamento.length > 0) {
        // Calcular total pago pelos métodos de pagamento (à vista)
        return metodosPagamento.reduce((sum, m) => {
          const valorMetodo = parseValorComVirgula(m.valor);
          return sum + valorMetodo;
        }, 0);
      }
      // Se não há métodos de pagamento à vista, o total é 0 (tudo a prazo)
      return 0;
    }
    
    // O TOTAL sempre deve mostrar o valor da venda, independente dos métodos de pagamento
    return total;
  };

  // Função para calcular o total a cobrar (incluindo taxas de cartão de débito e juros de parcelamento)
  const calcularTotalACobrar = () => {
    // NÃO incluir pagamento a prazo no cálculo - apenas métodos de pagamento à vista
    
    if (metodosPagamento.length > 0) {
      return metodosPagamento.reduce((sum, m) => {
        const valorMetodo = parseValorComVirgula(m.valor);
        let valorComTaxas = valorMetodo;
        
        // Para cartão de débito, incluir taxa do método
        if (m.metodo === "cartao_debito") {
          const metodoDebito = metodosDisponiveis.find(metodo => metodo.tipo === "cartao_debito");
          if (metodoDebito && metodoDebito.taxa > 0) {
            valorComTaxas = valorMetodo * (1 + metodoDebito.taxa / 100);
          }
        } else if (m.taxaParcela && m.taxaParcela > 0) {
          // Para outros métodos com taxa de parcela
          valorComTaxas = valorMetodo * (1 + m.taxaParcela / 100);
        }
        
        return sum + valorComTaxas;
      }, 0);
    }
    
    if (metodoPagamentoUnico === "dinheiro") {
      return parseValorComVirgula(valorDinheiro);
    }
    
    if (metodoPagamentoUnico === "cartao_debito") {
      // Para cartão de débito único, incluir taxa
      const metodoDebito = metodosDisponiveis.find(metodo => metodo.tipo === "cartao_debito");
      if (metodoDebito && metodoDebito.taxa > 0) {
        return total * (1 + metodoDebito.taxa / 100);
      }
      return total;
    }
    
    if (metodoPagamentoUnico === "cartao_credito" && parcelaConfirmada) {
      // Para cartão de crédito parcelado, incluir taxa de parcelamento
      if (parcelaConfirmada.taxa > 0) {
        return total * (1 + parcelaConfirmada.taxa / 100);
      }
      return total;
    }
    
    return total;
  };

  // Função para calcular o total pago pelos métodos de pagamento
  const calcularTotalPago = () => {
    if (metodosPagamento.length > 0) {
      return metodosPagamento.reduce((sum, m) => {
        const valorMetodo = parseValorComVirgula(m.valor);
        // Para todos os métodos, usar valor original (sem taxas da máquina)
        // As taxas são apenas para controle da máquina, não afetam o valor da venda
        return sum + valorMetodo;
      }, 0);
    }
    
    if (metodoPagamentoUnico === "dinheiro") {
      return parseValorComVirgula(valorDinheiro);
    }
    
    if (metodoPagamentoUnico === "cartao_credito" && parcelaConfirmada) {
      return total; // Para cartão de crédito, usar valor original (sem taxas)
    }
    
    // Para cartão de débito, usar valor original (sem taxa) - taxa é apenas para o cliente
    if (metodoPagamentoUnico === "cartao_debito") {
      return total;
    }
    
    if (metodoPagamentoUnico === "pix" || metodoPagamentoUnico === "transferencia") {
      return total;
    }
    
    return 0;
  };

  // Função para calcular valor restante ou troco
  const calcularStatusPagamento = () => {
    const isPagamentoMultiploComPrazo = metodosPagamento.length > 0 && usarPagamentoPrazo && clienteSelecionado;
    
    let totalVenda, totalPago, diferenca;
    
    if (isPagamentoMultiploComPrazo) {
      // Para pagamento múltiplo com prazo, o total da venda é apenas o valor original (sem juros)
      // e o total pago são os métodos à vista
      totalVenda = total;
      totalPago = calcularTotalPago();
      diferenca = totalPago - totalVenda;
    } else {
      // Para outros casos, usar a lógica original
      totalVenda = usarPagamentoPrazo && clienteSelecionado ? pagamentoPrazo.valorComJuros : total;
      totalPago = calcularTotalPago();
      diferenca = totalPago - totalVenda;
    }
    
    return {
      totalVenda,
      totalPago,
      diferenca,
      faltaPagar: isPagamentoMultiploComPrazo 
        ? (diferenca < 0 ? pagamentoPrazo.valorComJuros - totalPago : 0)
        : (diferenca < 0 ? Math.abs(diferenca) : 0),
      troco: diferenca > 0 ? diferenca : 0,
      pagoCompleto: diferenca >= 0
    };
  };

  // Função para calcular valor com juros e data de vencimento
  const handleCalcularPagamentoPrazo = (dias: string, juros: string) => {
    const metodosFormatados = metodosPagamento.map(m => ({ metodo: m.metodo, valor: m.valor }));
    const valorBase = metodosPagamento.length > 0 ? calcularValorRestantePrazo(metodosFormatados, subtotal - valorDesconto) : (subtotal - valorDesconto);
    calcularPagamentoPrazo(dias, juros, valorBase, setPagamentoPrazo);
  };

  // Função para calcular o valor restante para pagamento a prazo
  const handleCalcularValorRestantePrazo = () => {
    const metodosFormatados = metodosPagamento.map(m => ({ metodo: m.metodo, valor: m.valor }));
    return calcularValorRestantePrazo(metodosFormatados, subtotal - valorDesconto);
  };

  // Função para abrir modal de parcelas quando cartão de crédito for selecionado
  const handleSelecionarMetodoPagamento = (metodo: string) => {
    if (metodo === "cartao_credito") {
      // Buscar parcelas disponíveis para cartão de crédito
      const metodoCredito = metodosDisponiveis.find(m => m.tipo === "cartao_credito");
      if (metodoCredito && metodoCredito.parcelas && metodoCredito.parcelas.length > 0) {
        // Ordenar parcelas por quantidade
        const parcelasOrdenadas = [...metodoCredito.parcelas].sort((a, b) => a.quantidade - b.quantidade);
        setParcelasDisponiveis(parcelasOrdenadas);
        setMetodoSelecionadoParaParcelas("cartao_credito");
        setValorParcelaModal(total); // Para método único, usar o total
        setMostrarModalParcelas(true);
        return;
      }
    }
    
    // Para cartão de débito, aplicar taxa automaticamente
    if (metodo === "cartao_debito") {
      const metodoDebito = metodosDisponiveis.find(m => m.tipo === "cartao_debito");
      if (metodoDebito && metodoDebito.taxa > 0) {
        // Aplicar taxa do cartão de débito
        const valorComTaxa = total * (1 + metodoDebito.taxa / 100);
        setMetodoPagamentoUnico(metodo);
        setValorDinheiro("");
        return;
      }
    }
    
    // Para outros métodos, definir diretamente
    setMetodoPagamentoUnico(metodo);
    if (metodo !== "dinheiro") {
      setValorDinheiro("");
    }
  };

  // Função para confirmar seleção de parcela
  const handleConfirmarParcela = () => {
    if (parcelaSelecionada) {
      console.log('Debug - handleConfirmarParcela:', {
        parcelaSelecionada,
        metodoSelecionadoParaParcelas,
        metodosPagamentoLength: metodosPagamento.length,
        metodosPagamento,
        metodosDisponiveisLength: metodosDisponiveis.length,
        metodosDisponiveis
      });
      
      // Verificar se é para múltiplos métodos (formato: metodo_index)
      const parts = metodoSelecionadoParaParcelas.split('_');
      if (parts.length === 3 && !isNaN(parseInt(parts[2]))) {
        const [metodo, tipo, indexStr] = parts;
        const index = parseInt(indexStr);
        
        console.log('Debug - múltiplos métodos:', { metodo, tipo, indexStr, index });
        
        // Validar se o índice é válido e o array de métodos selecionados não está vazio
        if (index >= 0 && metodosPagamento.length > 0 && index < metodosPagamento.length) {
          // Atualizar o método específico nos múltiplos métodos
          const novosMetodos = [...metodosPagamento];
          novosMetodos[index].metodo = `${metodo}_${tipo}`;
          novosMetodos[index].parcelas = parcelaSelecionada.quantidade;
          novosMetodos[index].taxaParcela = parcelaSelecionada.taxa;
          setMetodosPagamento(novosMetodos);
        } else {
          console.error('Índice inválido para múltiplos métodos:', {
            index,
            metodosPagamentoLength: metodosPagamento.length,
            metodoSelecionadoParaParcelas
          });
          
          // Se não há métodos de pagamento selecionados, mostrar erro específico
          if (metodosPagamento.length === 0) {
            toast({
              title: "Erro",
              description: "Nenhum método de pagamento foi adicionado. Adicione pelo menos um método de pagamento primeiro.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Erro",
              description: "Erro ao configurar parcela. Tente novamente.",
              variant: "destructive",
            });
          }
          return;
        }
      } else {
        // Método único - definir cartao_credito como método primário e a parcela selecionada
        setMetodoPagamentoUnico("cartao_credito");
        setParcelaConfirmada(parcelaSelecionada);
        console.log('Debug - método único configurado:', {
          metodo: "cartao_credito",
          parcela: parcelaSelecionada
        });
      }
      
      // Limpar estados após sucesso
      setMostrarModalParcelas(false);
      setParcelaSelecionada(null);
      setMetodoSelecionadoParaParcelas("");
      setParcelasDisponiveis([]);
      setValorParcelaModal(0);
    }
  };

  // Função para cancelar seleção de parcela
  const handleCancelarParcela = () => {
    setMostrarModalParcelas(false);
    setParcelaSelecionada(null);
    setParcelaConfirmada(null);
    setMetodoSelecionadoParaParcelas("");
    setParcelasDisponiveis([]);
    setValorParcelaModal(0);
  };

  // Atualizar pagamento a prazo quando o total ou métodos de pagamento mudarem
  useEffect(() => {
    if (usarPagamentoPrazo) {
      handleCalcularPagamentoPrazo(pagamentoPrazo.dias, pagamentoPrazo.juros);
    }
  }, [total, usarPagamentoPrazo, metodosPagamento]);

  // Atualizar valor das parcelas quando o valor do método de pagamento mudar
  useEffect(() => {
    if (mostrarModalParcelas && metodoSelecionadoParaParcelas.includes('_')) {
      const parts = metodoSelecionadoParaParcelas.split('_');
      if (parts.length === 3 && !isNaN(parseInt(parts[2]))) {
        const index = parseInt(parts[2]);
        if (index >= 0 && index < metodosPagamento.length) {
          const valorMetodo = parseValorComVirgula(metodosPagamento[index].valor);
          setValorParcelaModal(valorMetodo);
        }
      }
    }
  }, [mostrarModalParcelas, metodoSelecionadoParaParcelas, metodosPagamento]);

  // Forçar re-render do select quando valores mudarem para atualizar opções desabilitadas
  const [forceUpdate, setForceUpdate] = useState(0);
  useEffect(() => {
    setForceUpdate(prev => prev + 1);
  }, [metodosPagamento.map(m => m.valor).join(',')]);

  // Desativar pagamento a prazo quando cliente for removido
  useEffect(() => {
    if (!clienteSelecionado && usarPagamentoPrazo) {
      setUsarPagamentoPrazo(false);
    }
  }, [clienteSelecionado, usarPagamentoPrazo]);

  // Limpar métodos de pagamento quando pagamento a prazo for ativado e não houver métodos múltiplos
  useEffect(() => {
    if (usarPagamentoPrazo && metodosPagamento.length === 0) {
      // Limpar método único de pagamento
      setMetodoPagamentoUnico("");
      setValorDinheiro("");
      setParcelaConfirmada(null);
    }
  }, [usarPagamentoPrazo, metodosPagamento.length]);

  // Adicionar atalho da tecla ESC para voltar
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // Verificar se não há modais abertos
        if (!mostrarModalPix && !mostrarModalDadosBancarios && !mostrarModalParcelas && !vendaFinalizada) {
          voltarParaVenda();
        }
      }
    };

    // Adicionar o event listener
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup: remover o event listener quando o componente for desmontado
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [mostrarModalPix, mostrarModalDadosBancarios, mostrarModalParcelas, vendaFinalizada]);

  const salvarVenda = async () => {
    try {
      // Calcular o total final que será salvo no banco
      const totalFinal = calcularTotalFinal();
      
      // Processar dados da venda usando o hook
      // Se há método único e é cartão de crédito com parcelas, incluir as parcelas
      let metodosComParcelas = metodosPagamento.map(m => ({ 
        metodo: m.metodo, 
        valor: m.valor, 
        parcelas: m.parcelas, 
        taxaParcela: m.taxaParcela 
      }));
      
      // Se há método único de cartão de crédito com parcelas confirmadas, incluir
      if (metodoPagamentoUnico === "cartao_credito" && parcelaConfirmada && metodosComParcelas.length === 0) {
        metodosComParcelas = [{
          metodo: "cartao_credito",
          valor: (usarPagamentoPrazo ? pagamentoPrazo.valorComJuros : total).toString(),
          parcelas: parcelaConfirmada.quantidade,
          taxaParcela: parcelaConfirmada.taxa
        }];
      }
      
      const dadosVenda = processarDadosVenda(
        { carrinho, clienteSelecionado, subtotal, desconto, total: totalFinal },
        metodosComParcelas,
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
    metodosPagamento.map(m => ({ metodo: m.metodo, valor: m.valor })),
    metodoPagamentoUnico,
    valorDinheiro,
    usarPagamentoPrazo,
    pagamentoPrazo,
    total
  );
  
  // Validação adicional para pagamento múltiplo
  const validarPagamentoMultiplo = () => {
    if (metodosPagamento.length > 0) {
      // Verificar se todos os métodos têm forma de pagamento e valor preenchidos
      const metodoIncompleto = metodosPagamento.find(m => 
        !m.metodo || 
        !m.valor || 
        parseFloat(m.valor.replace(',', '.')) <= 0
      );
      
      if (metodoIncompleto) {
        return false;
      }
    }
    return true;
  };
  
  const formularioValido = (validacaoFormulario === "Pagamento a prazo configurado" || 
    validacaoFormulario === "Preencha todos os campos obrigatórios") &&
    (!usarPagamentoPrazo || (usarPagamentoPrazo && pagamentoPrazo.dias && pagamentoPrazo.dias.trim() !== "")) &&
    validarPagamentoMultiplo();

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

            ${vendaFinalizada?.metodos_pagamento?.map((metodo: any) => {
              const metodoDisponivel = metodosDisponiveis.find(m => m.tipo === metodo.metodo);
              const valorMetodo = parseFloat(metodo.valor || 0);
              const parcelas = metodo.parcelas || 1;
              const taxaParcela = metodo.taxaParcela || 0;
              
              // Calcular valor com juros se houver taxa
              const valorComJuros = taxaParcela > 0 ? valorMetodo * (1 + taxaParcela / 100) : valorMetodo;
              const valorParcela = valorComJuros / parcelas;
              
              let metodoInfo = `
                <div>
                  ${metodoDisponivel?.nome || metodo.metodo?.replace('_', ' ').toUpperCase()}: ${valorComJuros.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  })}
              `;
              
              // Se for cartão de crédito com parcelas, mostrar detalhes
              if (metodo.metodo === 'cartao_credito' && parcelas > 1) {
                metodoInfo += `
                  <div style="margin-left: 10px; font-size: 10px;">
                    ${parcelas}x de ${valorParcela.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    })}
                  </div>
                `;
              }
              
              metodoInfo += `</div>`;
              return metodoInfo;
            }).join('') || ''}

            ${vendaFinalizada?.pagamento_prazo ? `
              <div>
                <div><strong>Valor a Prazo: ${vendaFinalizada.pagamento_prazo.valorComJuros.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                })}</strong></div>
                <div>Juros (${vendaFinalizada.pagamento_prazo.juros}%): +${(vendaFinalizada.pagamento_prazo.valorComJuros - (vendaFinalizada.pagamento_prazo.valorOriginal || vendaFinalizada.total)).toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                })}</div>
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
    <div className="w-full max-w-full overflow-x-hidden space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="w-full flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center">
            <CreditCard className="h-6 w-6 sm:h-8 sm:w-8 mr-2 sm:mr-3" />
            Terminal de Pagamento
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Configure o pagamento da venda
          </p>
        </div>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
          <Button 
            variant="outline" 
            onClick={voltarParaVenda}
            className="border-slate-300 text-slate-600 hover:bg-slate-50 h-8 sm:h-10 text-xs sm:text-sm w-full sm:w-auto"
          >
            <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            Voltar
          </Button>
          <Button 
            onClick={salvarVenda}
            disabled={!formularioValido || salvandoVenda}
            className="bg-green-600 hover:bg-green-700 text-white h-8 sm:h-10 text-xs sm:text-sm w-full sm:w-auto"
          >
            {salvandoVenda ? (
              <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 animate-spin" />
            ) : (
              <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            )}
            <span className="hidden sm:inline">
              {salvandoVenda ? "Processando..." : "Finalizar Venda"}
            </span>
            <span className="sm:hidden">
              {salvandoVenda ? "Processando..." : "Finalizar"}
            </span>
          </Button>
        </div>
      </div>

      {/* Layout Principal */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        {/* Coluna Esquerda - Formas de Pagamento */}
        <div className="xl:col-span-2 space-y-4 sm:space-y-6 order-2 xl:order-1">
          {/* Método de Pagamento Único */}
          {metodosPagamento.length === 0 && (
            <Card className="border-green-200">
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="text-base sm:text-lg flex items-center">
                  <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-green-600" />
                  Forma de Pagamento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-2 sm:mb-3 text-slate-700">
                    Selecione o método de pagamento
                  </label>
                  
                  {carregandoMetodos ? (
                    <div className="flex items-center justify-center p-4 sm:p-8 bg-slate-50 rounded-lg border-2 border-slate-200">
                      <Loader2 className="h-4 w-4 sm:h-6 sm:w-6 text-slate-500 animate-spin mr-2" />
                      <span className="text-xs sm:text-sm text-slate-600">Carregando métodos...</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
                      {metodosDisponiveis.map((metodo) => {
                        const isSelected = metodoPagamentoUnico === metodo.tipo;
                        const isDisabled = (metodo.tipo === "cartao_credito" && metodosDisponiveis.length === 0) || 
                                          (usarPagamentoPrazo && metodosPagamento.length === 0);
                        
                        return (
                          <div
                            key={metodo.id}
                            onClick={() => {
                              if (isDisabled) {
                                if (usarPagamentoPrazo && metodosPagamento.length === 0) {
                                  toast({
                                    title: "Pagamento a prazo ativo",
                                    description: "Não é possível selecionar métodos de pagamento quando pagamento a prazo está ativado.",
                                    variant: "destructive",
                                  });
                                } else {
                                  toast({
                                    title: "Erro",
                                    description: "Métodos de pagamento não foram carregados. Tente recarregar a página.",
                                    variant: "destructive",
                                  });
                                }
                                return;
                              }
                              handleSelecionarMetodoPagamento(metodo.tipo);
                            }}
                            className={`
                              p-1.5 sm:p-2 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md
                              ${isSelected 
                                ? 'border-green-500 bg-green-50 shadow-md' 
                                : 'border-slate-200 hover:border-green-300 hover:bg-green-50'
                              }
                              ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                            `}
                          >
                            <div className="text-center">
                              <div className={`
                                w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1 rounded-full flex items-center justify-center
                                ${isSelected ? 'bg-green-100' : 'bg-slate-100'}
                              `}>
                                {metodo.tipo === "dinheiro" && <Banknote className="h-3 w-3 sm:h-4 sm:w-4 text-slate-600" />}
                                {metodo.tipo === "pix" && (
                                  <img 
                                    src="/logopix.png" 
                                    alt="PIX" 
                                    className="h-3 w-3 sm:h-4 sm:w-4 object-contain"
                                  />
                                )}
                                {metodo.tipo === "cartao_credito" && <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />}
                                {metodo.tipo === "cartao_debito" && <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />}
                                {metodo.tipo === "transferencia" && <Building2 className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />}
                              </div>
                              <h3 className="text-xs font-medium text-slate-800 mb-1 leading-tight">
                        {metodo.nome}
                              </h3>
                              {metodo.tipo !== "cartao_debito" && metodo.taxa > 0 && (
                                <p className="text-xs text-orange-600">
                                  {metodo.taxa}%
                                </p>
                              )}
                              {metodo.tipo !== "cartao_debito" && metodo.taxa === 0 && (
                                <p className="text-xs text-green-600">
                                  Sem taxa
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Indicação de Parcelas para Cartão de Crédito */}
                {metodoPagamentoUnico === "cartao_credito" && parcelaConfirmada && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-2 sm:p-3 rounded-lg border-2 border-blue-200 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-blue-800 mb-1 text-xs sm:text-sm">
                            Pagamento Parcelado
                          </h4>
                          <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-3 text-xs">
                            <div className="flex items-center space-x-1">
                              <span className="text-blue-600 font-medium">
                                {parcelaConfirmada.quantidade}x
                              </span>
                              <span className="text-blue-600">de</span>
                              <span className="font-bold text-green-600">
                                {parcelaConfirmada.taxa > 0 
                                  ? ((total * (1 + parcelaConfirmada.taxa / 100)) / parcelaConfirmada.quantidade).toLocaleString("pt-BR", {
                                      style: "currency",
                                      currency: "BRL"
                                    })
                                  : (total / parcelaConfirmada.quantidade).toLocaleString("pt-BR", {
                                      style: "currency",
                                      currency: "BRL"
                                    })
                                }
                              </span>
                            </div>
                            {parcelaConfirmada.taxa === 0 && (
                              <div className="flex items-center space-x-1">
                                <span className="text-green-600">•</span>
                                <span className="text-green-600 font-medium">
                                  Sem juros
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-left sm:text-right">
                        <div className="font-bold text-sm sm:text-base text-slate-800">
                          {parcelaConfirmada.taxa > 0
                            ? (total * (1 + parcelaConfirmada.taxa / 100)).toLocaleString("pt-BR", {
                                style: "currency",
                                currency: "BRL"
                              })
                            : total.toLocaleString("pt-BR", {
                                style: "currency",
                                currency: "BRL"
                              })}
                        </div>
                        {parcelaConfirmada.taxa > 0 && (
                          <div className="text-xs text-orange-600">
                            +{((total * parcelaConfirmada.taxa) / 100).toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL"
                            })} juros
                          </div>
                        )}
                        <Button
                          type="button"
                          onClick={() => {
                            // Buscar parcelas disponíveis para cartão de crédito
                            const metodoCredito = metodosDisponiveis.find(m => m.tipo === "cartao_credito");
                            if (metodoCredito && metodoCredito.parcelas && metodoCredito.parcelas.length > 0) {
                              // Ordenar parcelas por quantidade
                              const parcelasOrdenadas = [...metodoCredito.parcelas].sort((a, b) => a.quantidade - b.quantidade);
                              setParcelasDisponiveis(parcelasOrdenadas);
                              setMetodoSelecionadoParaParcelas("cartao_credito");
                              setValorParcelaModal(total); // Para método único, usar o total
                              setMostrarModalParcelas(true);
                            }
                          }}
                          variant="ghost"
                          size="sm"
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-100 mt-1 text-xs h-6 sm:h-8"
                        >
                          <X className="h-3 w-3 mr-1" />
                          Alterar
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Campo de Valor em Dinheiro */}
                {metodoPagamentoUnico === "dinheiro" && (
                  <div className="bg-yellow-50 p-3 sm:p-4 rounded-lg border-2 border-yellow-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2 text-yellow-800">
                          <Banknote className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1" />
                          Valor recebido
                        </label>
                        <Input
                          type="text"
                          value={valorDinheiro}
                          onChange={(e) => setValorDinheiro(e.target.value)}
                          placeholder="0,00"
                          className="text-sm sm:text-lg font-bold h-8 sm:h-10"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2 text-yellow-800">
                          <Calculator className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1" />
                          Troco
                        </label>
                        <Input
                          type="text"
                          value={Math.max(0, (parseValorComVirgula(valorDinheiro)) - (usarPagamentoPrazo ? pagamentoPrazo.valorComJuros : total)).toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                          disabled
                          className="bg-yellow-100 text-yellow-800 text-sm sm:text-lg font-bold h-8 sm:h-10"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Botão Visualizar Chave PIX */}
                {metodoPagamentoUnico === "pix" && (
                  <div className="bg-green-50 p-3 sm:p-4 rounded-lg border-2 border-green-200">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                      <div>
                        <h4 className="font-medium text-green-800 mb-1 flex items-center text-sm sm:text-base">
                          <img 
                            src="/logopix.png" 
                            alt="PIX" 
                            className="h-3 w-3 sm:h-4 sm:w-4 mr-1 object-contain"
                          />
                          Pagamento via PIX
                        </h4>
                        <p className="text-xs sm:text-sm text-green-600">
                          {pixConfiguracao ? 'Clique para visualizar os dados PIX' : 'Configure as informações PIX nas configurações'}
                        </p>
                      </div>
                      <Button
                        type="button"
                        onClick={() => setMostrarModalPix(true)}
                        disabled={!pixConfiguracao || carregandoPix}
                        className="bg-green-600 hover:bg-green-700 text-white h-8 sm:h-10 text-xs sm:text-sm w-full sm:w-auto"
                      >
                        {carregandoPix ? (
                          <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 animate-spin" />
                        ) : (
                          <img 
                            src="/logopix.png" 
                            alt="PIX" 
                            className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 object-contain"
                          />
                        )}
                        Visualizar Chave
                      </Button>
                    </div>
                  </div>
                )}

                {/* Botão Visualizar Dados Bancários */}
                {metodoPagamentoUnico === "transferencia" && (
                  <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border-2 border-blue-200">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                      <div>
                        <h4 className="font-medium text-blue-800 mb-1 text-sm sm:text-base">
                          <Building2 className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1" />
                          Transferência Bancária
                        </h4>
                        <p className="text-xs sm:text-sm text-blue-600">
                          {dadosBancarios ? 'Clique para visualizar os dados da conta' : 'Configure os dados bancários nas configurações'}
                        </p>
                      </div>
                      <Button
                        type="button"
                        onClick={() => setMostrarModalDadosBancarios(true)}
                        disabled={!dadosBancarios || carregandoDadosBancarios}
                        className="bg-blue-600 hover:bg-blue-700 text-white h-8 sm:h-10 text-xs sm:text-sm w-full sm:w-auto"
                      >
                        {carregandoDadosBancarios ? (
                          <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 animate-spin" />
                        ) : (
                          <Building2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        )}
                        Visualizar Conta
                      </Button>
                    </div>
                  </div>
                )}

                {/* Informações do Cartão de Débito */}
                {metodoPagamentoUnico === "cartao_debito" && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-xl border-2 border-blue-200 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <CreditCard className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-blue-800 mb-1">
                            Cartão de Débito
                          </h4>
                          <div className="flex items-center space-x-4 text-sm">
                            {(() => {
                              const metodoDebito = metodosDisponiveis.find(m => m.tipo === "cartao_debito");
                              if (metodoDebito && metodoDebito.taxa > 0) {
                                return (
                                  <div className="flex items-center space-x-1">
                                    <span className="text-orange-600">•</span>
                                    <span className="text-orange-600 font-medium">
                                      Taxa: {metodoDebito.taxa}%
                                    </span>
                                  </div>
                                );
                              }
                              return (
                                <div className="flex items-center space-x-1">
                                  <span className="text-green-600">•</span>
                                  <span className="text-green-600 font-medium">
                                    Sem taxa adicional
                                  </span>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg text-slate-800">
                          {(() => {
                            const metodoDebito = metodosDisponiveis.find(m => m.tipo === "cartao_debito");
                            if (metodoDebito && metodoDebito.taxa > 0) {
                              return (total * (1 + metodoDebito.taxa / 100)).toLocaleString("pt-BR", {
                                style: "currency",
                                currency: "BRL"
                              });
                            }
                            return total.toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL"
                            });
                          })()}
                        </div>
                        {(() => {
                          const metodoDebito = metodosDisponiveis.find(m => m.tipo === "cartao_debito");
                          if (metodoDebito && metodoDebito.taxa > 0) {
                            const valorTaxa = (total * metodoDebito.taxa) / 100;
                            return (
                              <div className="text-xs text-orange-600">
                                +{valorTaxa.toLocaleString("pt-BR", {
                                  style: "currency",
                                  currency: "BRL"
                                })} taxa
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    </div>
                  </div>
                )}

                <Button
                  onClick={() => {
                    // Limpar dados de pagamento anterior
                    setMetodoPagamentoUnico("");
                    setValorDinheiro("");
                    setParcelaConfirmada(null);
                    setUsarPagamentoPrazo(false);
                    setPagamentoPrazo({
                      dias: "",
                      juros: "",
                      valorComJuros: 0,
                      dataVencimento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                    });
                    // Adicionar novo método de pagamento
                    setMetodosPagamento([{ metodo: "", valor: "", parcelas: undefined, taxaParcela: undefined }]);
                  }}
                  className="w-full bg-green-600 hover:bg-green-700 text-white h-8 sm:h-10 text-xs sm:text-sm"
                  disabled={carregandoMetodos}
                >
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Múltiplos Métodos de Pagamento</span>
                  <span className="sm:hidden">Múltiplos Métodos</span>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Múltiplos Métodos de Pagamento */}
          {metodosPagamento.length > 0 && (
            <Card className="border-blue-200">
              <CardHeader className="pb-3 sm:pb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                  <CardTitle className="text-base sm:text-lg flex items-center">
                    <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-600" />
                    Múltiplos Métodos
                  </CardTitle>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        setMetodosPagamento([...metodosPagamento, { metodo: "", valor: "", parcelas: undefined, taxaParcela: undefined }]);
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white h-7 sm:h-8 text-xs"
                      disabled={carregandoMetodos}
                    >
                      <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      Adicionar
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        // Limpar dados de múltiplos métodos
                        setMetodosPagamento([]);
                        // Limpar dados de pagamento a prazo
                        setUsarPagamentoPrazo(false);
                        setPagamentoPrazo({
                          dias: "",
                          juros: "",
                          valorComJuros: 0,
                          dataVencimento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                        });
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white h-7 sm:h-8 text-xs"
                    >
                      <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      Único
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                {/* Mostrar loading se estiver carregando */}
                {carregandoMetodos && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                      <p className="text-sm text-blue-700">Carregando métodos de pagamento...</p>
                    </div>
                  </div>
                )}

                {/* Mostrar erro de carregamento se houver */}
                {erroCarregamentoMetodos && !carregandoMetodos && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="h-5 w-5 text-red-500" />
                        <p className="text-sm text-red-700">{erroCarregamentoMetodos}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={recarregarMetodosPagamento}
                        disabled={carregandoMetodosPagamento}
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        {carregandoMetodosPagamento ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Tentar novamente"
                        )}
                      </Button>
                    </div>
                  </div>
                )}
                
                {metodosPagamento.map((metodo, index) => (
                  <div key={index} className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 sm:p-4 bg-slate-50 rounded-lg border">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2 text-slate-700">
                        Método
                      </label>
                      {parseFloat(metodo.valor) <= 0 && (
                        <p className="text-xs text-amber-600 mb-2">
                          💡 Adicione um valor primeiro para selecionar cartão de crédito
                        </p>
                      )}
                      <select
                        value={metodo.metodo}
                        onChange={(e) => {
                          const metodoSelecionado = e.target.value;
                          if (metodoSelecionado === "cartao_credito") {
                            // Verificar se há métodos de pagamento disponíveis
                            if (metodosDisponiveis.length === 0) {
                              toast({
                                title: "Erro",
                                description: "Métodos de pagamento não foram carregados. Tente recarregar a página.",
                                variant: "destructive",
                              });
                              return;
                            }
                            
                            // Verificar se o valor já foi preenchido
                            const valorAtual = parseValorComVirgula(metodo.valor);
                            if (valorAtual <= 0) {
                              toast({
                                title: "Valor necessário",
                                description: "Por favor, adicione um valor antes de selecionar cartão de crédito.",
                                variant: "destructive",
                              });
                              // Não alterar o método se não há valor
                              return;
                            }
                            
                            // Para múltiplos métodos, também abrir modal de parcelas
                            const metodoCredito = metodosDisponiveis.find(m => m.tipo === "cartao_credito");
                            if (metodoCredito && metodoCredito.parcelas && metodoCredito.parcelas.length > 0) {
                              // Ordenar parcelas por quantidade
                              const parcelasOrdenadas = [...metodoCredito.parcelas].sort((a, b) => a.quantidade - b.quantidade);
                              setParcelasDisponiveis(parcelasOrdenadas);
                              setMostrarModalParcelas(true);
                              // Armazenar o índice para atualizar depois
                              setMetodoSelecionadoParaParcelas(`cartao_credito_${index}`);
                              // Usar o valor já preenchido
                              setValorParcelaModal(valorAtual);
                              return;
                            }
                          }
                          
                          // Para cartão de débito, aplicar taxa automaticamente
                          if (metodoSelecionado === "cartao_debito") {
                            const metodoDebito = metodosDisponiveis.find(m => m.tipo === "cartao_debito");
                            if (metodoDebito && metodoDebito.taxa > 0) {
                              const valorAtual = parseValorComVirgula(metodo.valor);
                              if (valorAtual > 0) {
                                const valorComTaxa = valorAtual * (1 + metodoDebito.taxa / 100);
                                const novosMetodos = [...metodosPagamento];
                                novosMetodos[index].metodo = metodoSelecionado;
                                novosMetodos[index].taxaParcela = metodoDebito.taxa;
                                setMetodosPagamento(novosMetodos);
                                return;
                              }
                            }
                          }
                          
                          const novosMetodos = [...metodosPagamento];
                          novosMetodos[index].metodo = metodoSelecionado;
                          novosMetodos[index].valor = "";
                          novosMetodos[index].parcelas = undefined;
                          novosMetodos[index].taxaParcela = undefined;
                          setMetodosPagamento(novosMetodos);
                        }}
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-500 h-8 sm:h-10 text-xs sm:text-sm"
                        disabled={carregandoMetodos}
                      >
                        <option value="">
                          {carregandoMetodos ? "Carregando..." : "Selecione"}
                        </option>
                        {metodosDisponiveis.map((metodoDisponivel) => {
                          const valorAtual = parseValorComVirgula(metodo.valor);
                          const isCartaoCredito = metodoDisponivel.tipo === "cartao_credito";
                          const isDisabled = isCartaoCredito && valorAtual <= 0;
                          
                          return (
                            <option 
                              key={metodoDisponivel.id} 
                              value={metodoDisponivel.tipo}
                              disabled={isDisabled}
                            >
                              {metodoDisponivel.nome}
                              {isDisabled ? " (adicione um valor primeiro)" : ""}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2 text-slate-700">
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
                        className="text-center h-8 sm:h-10 text-xs sm:text-sm"
                      />
                    </div>
                    
                    <div className="flex items-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setMetodosPagamento(metodosPagamento.filter((_, i) => i !== index));
                        }}
                        className="w-full border-red-300 text-red-600 hover:bg-red-50 h-8 sm:h-10"
                      >
                        <X className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                {/* Botão PIX para múltiplos métodos */}
                {metodosPagamento.some(m => m.metodo === "pix") && (
                  <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-green-800 mb-1 flex items-center">
                          <img 
                            src="/logopix.png" 
                            alt="PIX" 
                            className="h-4 w-4 mr-1 object-contain"
                          />
                          Dados PIX Disponíveis
                        </h4>
                        <p className="text-sm text-green-600">
                          {pixConfiguracao ? 'Clique para visualizar os dados PIX' : 'Configure as informações PIX nas configurações'}
                        </p>
                      </div>
                      <Button
                        type="button"
                        onClick={() => setMostrarModalPix(true)}
                        disabled={!pixConfiguracao || carregandoPix}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        {carregandoPix ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <img 
                            src="/logopix.png" 
                            alt="PIX" 
                            className="h-4 w-4 mr-2 object-contain"
                          />
                        )}
                        Visualizar PIX
                      </Button>
                    </div>
                  </div>
                )}

                {/* Botão Dados Bancários para múltiplos métodos */}
                {metodosPagamento.some(m => m.metodo === "transferencia") && (
                  <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-blue-800 mb-1">
                          <Building2 className="h-4 w-4 inline mr-1" />
                          Dados Bancários Disponíveis
                        </h4>
                        <p className="text-sm text-blue-600">
                          {dadosBancarios ? 'Clique para visualizar os dados da conta' : 'Configure os dados bancários nas configurações'}
                        </p>
                      </div>
                      <Button
                        type="button"
                        onClick={() => setMostrarModalDadosBancarios(true)}
                        disabled={!dadosBancarios || carregandoDadosBancarios}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {carregandoDadosBancarios ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Building2 className="h-4 w-4 mr-2" />
                        )}
                        Visualizar Conta
                      </Button>
                    </div>
                  </div>
                )}

                {/* Resumo dos Pagamentos */}
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                  <h4 className="font-bold mb-4 text-slate-800 flex items-center">
                    <Calculator className="h-5 w-5 mr-2 text-slate-600" />
                    Resumo dos Pagamentos
                  </h4>
                  <div className="space-y-3">
                    {metodosPagamento.map((metodo, index) => {
                      const metodoDisponivel = metodosDisponiveis.find(m => m.tipo === metodo.metodo);
                      const valorMetodo = parseValorComVirgula(metodo.valor);
                      
                      // Calcular valor com juros se houver parcelas com taxa
                      // A taxa é aplicada sobre o valor total da transação, não sobre cada parcela
                      let valorComJuros = valorMetodo;
                      
                      if (metodo.metodo === "cartao_debito") {
                        // Para cartão de débito, aplicar taxa do método
                        const metodoDebito = metodosDisponiveis.find(m => m.tipo === "cartao_debito");
                        if (metodoDebito && metodoDebito.taxa > 0) {
                          valorComJuros = valorMetodo * (1 + metodoDebito.taxa / 100);
                        }
                      } else if (metodo.taxaParcela && metodo.taxaParcela > 0) {
                        // Para outros métodos com taxa de parcela
                        valorComJuros = valorMetodo * (1 + metodo.taxaParcela / 100);
                      }
                      
                      return (
                        <div key={index} className="flex justify-between items-center p-3 bg-white rounded-lg border border-slate-200">
                          <div className="flex items-center space-x-2">
                            <span className="text-slate-700 font-medium">
                              {metodoDisponivel?.nome || metodo.metodo.replace('_', ' ')}
                            </span>
                            {metodo.parcelas && metodo.parcelas > 1 && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                                {metodo.parcelas}x de {(() => {
                                  const valorParcela = valorComJuros / metodo.parcelas;
                                  return valorParcela.toLocaleString("pt-BR", {
                                    style: "currency",
                                    currency: "BRL"
                                  });
                                })()}
                              </span>
                            )}
                            {(metodo.taxaParcela && metodo.taxaParcela > 0) || (metodo.metodo === "cartao_debito" && (() => {
                              const metodoDebito = metodosDisponiveis.find(m => m.tipo === "cartao_debito");
                              return metodoDebito && metodoDebito.taxa > 0;
                            })()) && (
                              <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                                +{metodo.metodo === "cartao_debito" ? 
                                  (() => {
                                    const metodoDebito = metodosDisponiveis.find(m => m.tipo === "cartao_debito");
                                    return metodoDebito ? metodoDebito.taxa : 0;
                                  })() : 
                                  metodo.taxaParcela}%
                              </span>
                            )}
                          </div>
                          <span className="font-bold text-slate-800">
                            {valorComJuros.toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL"
                            })}
                          </span>
                        </div>
                      );
                    })}
                    
                    <div className="border-t border-slate-300 pt-3">
                      <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-200">
                        <span className="font-bold text-lg text-slate-800">Total Pago:</span>
                        <span className="font-bold text-xl text-green-600">
                          {metodosPagamento.reduce((sum, m) => {
                            const valorMetodo = parseValorComVirgula(m.valor);
                            let valorComJuros = valorMetodo;
                            
                            if (m.metodo === "cartao_debito") {
                              // Para cartão de débito, aplicar taxa do método
                              const metodoDebito = metodosDisponiveis.find(metodo => metodo.tipo === "cartao_debito");
                              if (metodoDebito && metodoDebito.taxa > 0) {
                                valorComJuros = valorMetodo * (1 + metodoDebito.taxa / 100);
                              }
                            } else if (m.taxaParcela && m.taxaParcela > 0) {
                              // Para outros métodos com taxa de parcela
                              valorComJuros = valorMetodo * (1 + m.taxaParcela / 100);
                            }
                            
                            return sum + valorComJuros;
                          }, 0).toLocaleString("pt-BR", {
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
            <CardHeader className="pb-3 sm:pb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                <CardTitle className="text-base sm:text-lg flex items-center">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-purple-600" />
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
                  <label htmlFor="usarPagamentoPrazo" className="text-xs sm:text-sm font-medium text-slate-700">
                    Ativar pagamento a prazo
                  </label>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {!clienteSelecionado && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800 text-sm text-center">
                    <AlertCircle className="h-4 w-4 inline mr-1" />
                    Selecione um cliente para ativar o pagamento a prazo
                  </p>
                </div>
              )}

              {usarPagamentoPrazo && clienteSelecionado && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-purple-800">
                        <Calendar className="h-4 w-4 inline mr-1" />
                        Dias para Pagamento
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
                        <Percent className="h-4 w-4 inline mr-1" />
                        Juros (%)
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

          {/* Campo de Desconto */}
          <Card className="border-orange-200">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-sm sm:text-base flex items-center">
                <Percent className="h-3 w-3 sm:h-4 sm:w-4 mr-2 text-orange-600" />
                Desconto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
                <div className="flex-1">
                  <label className="block text-xs font-medium mb-1 text-slate-600">
                    Porcentagem
                  </label>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="text"
                      value={desconto}
                      onChange={(e) => setDesconto(e.target.value)}
                      placeholder="0"
                      className="text-center w-16 text-xs sm:text-sm font-semibold h-7 sm:h-8"
                    />
                    <span className="text-xs sm:text-sm font-medium text-slate-600">%</span>
                  </div>
                </div>
                
                <div className="flex-1">
                  <label className="block text-xs font-medium mb-1 text-slate-600">
                    Valor
                  </label>
                  <div className="bg-slate-50 p-2 rounded border border-slate-200">
                    <span className="text-xs sm:text-sm font-bold text-green-600">
                      {valorDesconto.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL"
                      })}
                    </span>
                  </div>
                </div>
              </div>
              
            </CardContent>
          </Card>

        </div>

        {/* Coluna Direita - Resumo da Venda */}
        <div className="xl:col-span-1 order-1 xl:order-2">
          {/* Resumo da Venda */}
          <Card className="w-full flex flex-col bg-slate-50 border-slate-200 shadow-xl rounded-xl h-[28rem] sm:h-[26rem] md:h-[28rem] lg:h-[calc(100vh-150px)] min-h-0 sticky top-6">
            <CardHeader className="bg-slate-100 border-b border-slate-200 rounded-t-xl flex-shrink-0 pb-3 sm:pb-6">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2 text-slate-800 text-sm sm:text-base">
                  <Receipt className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>Resumo da Venda</span>
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
                </div>
                
                {clienteSelecionado ? (
                  <div className="bg-muted rounded-lg p-2 sm:p-3">
                    <p className="font-medium text-xs sm:text-sm">{clienteSelecionado.nome}</p>
                    <p className="text-muted-foreground text-xs">{clienteSelecionado.cpf_cnpj}</p>
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
                      <div key={item.produto.id} className="bg-muted rounded-lg p-2 sm:p-3">
                        <div className="flex items-start justify-between mb-1 sm:mb-2">
                          <div className="flex-1">
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
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-muted-foreground text-xs">Qtd: {item.quantidade}</span>
                          </div>
                          <span className="text-green-600 font-bold text-xs sm:text-sm">
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

                  {/* Resumo dos métodos de pagamento */}
                  {(metodosPagamento.length > 0 || metodoPagamentoUnico || (metodoPagamentoUnico === "cartao_credito" && parcelaConfirmada)) && (
                    <div className="pt-2 border-t border-slate-300">
                      <div className="text-xs text-muted-foreground mb-2">Formas de Pagamento:</div>
                      <div className="space-y-1">
                        {/* Método único com parcelas */}
                        {metodoPagamentoUnico === "cartao_credito" && parcelaConfirmada && (
                          <div className="flex justify-between text-xs">
                            <span>Cartão de Crédito ({parcelaConfirmada.quantidade}x):</span>
                            <span>{(parcelaConfirmada.taxa > 0
                              ? (total * (1 + parcelaConfirmada.taxa / 100))
                              : total
                            ).toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL"
                            })}</span>
                          </div>
                        )}

                        {/* Múltiplos métodos */}
                        {metodosPagamento.map((metodo, index) => {
                          const metodoDisponivel = metodosDisponiveis.find(m => m.tipo === metodo.metodo);
                          const valorMetodo = parseValorComVirgula(metodo.valor);
                          const valorComJuros = metodo.taxaParcela && metodo.taxaParcela > 0 
                            ? valorMetodo * (1 + metodo.taxaParcela / 100)
                            : valorMetodo;

                          return (
                            <div key={index} className="flex justify-between text-xs">
                              <span>
                                {metodoDisponivel?.nome || metodo.metodo.replace('_', ' ')}
                                {metodo.parcelas && metodo.parcelas > 1 && ` (${metodo.parcelas}x)`}
                              </span>
                              <span>{valorComJuros.toLocaleString("pt-BR", {
                                style: "currency",
                                currency: "BRL"
                              })}</span>
                            </div>
                          );
                        })}

                        {/* Dinheiro */}
                        {metodoPagamentoUnico === "dinheiro" && (
                          <div className="flex justify-between text-xs">
                            <span>Dinheiro:</span>
                            <span>{total.toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL"
                            })}</span>
                          </div>
                        )}

                        {/* PIX */}
                        {metodoPagamentoUnico === "pix" && (
                          <div className="flex justify-between text-xs">
                            <span>PIX:</span>
                            <span>{total.toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL"
                            })}</span>
                          </div>
                        )}

                        {/* Transferência Bancária */}
                        {metodoPagamentoUnico === "transferencia" && (
                          <div className="flex justify-between text-xs">
                            <span>Transferência:</span>
                            <span>{total.toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL"
                            })}</span>
                          </div>
                        )}

                        {/* Cartão de Crédito (método único sem parcelas) */}
                        {metodoPagamentoUnico === "cartao_credito" && !parcelaConfirmada && (
                          <div className="flex justify-between text-xs">
                            <span>Cartão de Crédito:</span>
                            <span>{total.toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL"
                            })}</span>
                          </div>
                        )}

                        {/* Cartão de Débito (método único) */}
                        {metodoPagamentoUnico === "cartao_debito" && (
                          <div className="flex justify-between text-xs">
                            <span>Cartão de Débito:</span>
                            <span>{(() => {
                              const metodoDebito = metodosDisponiveis.find(m => m.tipo === "cartao_debito");
                              const valorComTaxa = metodoDebito && metodoDebito.taxa > 0 
                                ? total * (1 + metodoDebito.taxa / 100)
                                : total;
                              return valorComTaxa.toLocaleString("pt-BR", {
                                style: "currency",
                                currency: "BRL"
                              });
                            })()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                    
                  {/* Pagamento a prazo */}
                  {usarPagamentoPrazo && clienteSelecionado && (
                        <div className="pt-2 border-t border-slate-300">
                      {/* Quando é apenas pagamento a prazo (sem métodos múltiplos), dar mais destaque */}
                      {metodosPagamento.length === 0 && !metodoPagamentoUnico ? (
                        <div className="space-y-2">
                          <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg border-2 border-purple-200">
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                              <span className="text-sm font-bold text-purple-800">Total a Prazo:</span>
                            </div>
                            <span className="text-lg font-bold text-purple-600">
                              {pagamentoPrazo.valorComJuros.toLocaleString("pt-BR", {
                                style: "currency",
                                currency: "BRL"
                              })}
                            </span>
                          </div>
                          <div className="flex justify-between items-center p-2 bg-slate-50 rounded border border-slate-200">
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-3 w-3 text-slate-500" />
                              <span className="text-xs font-medium text-slate-700">Vencimento:</span>
                            </div>
                            <span className="text-sm font-semibold text-slate-800">
                              {pagamentoPrazo.dataVencimento.toLocaleDateString("pt-BR")}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg border-2 border-purple-200">
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                              <span className="text-sm font-bold text-purple-800">Total a Prazo:</span>
                            </div>
                            <span className="text-lg font-bold text-purple-600">
                              {pagamentoPrazo.valorComJuros.toLocaleString("pt-BR", {
                                style: "currency",
                                currency: "BRL"
                              })}
                            </span>
                          </div>
                          <div className="flex justify-between items-center p-2 bg-slate-50 rounded border border-slate-200">
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-3 w-3 text-slate-500" />
                              <span className="text-xs font-medium text-slate-700">Vencimento:</span>
                            </div>
                            <span className="text-sm font-semibold text-slate-800">
                              {pagamentoPrazo.dataVencimento.toLocaleDateString("pt-BR")}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="border-t pt-2 space-y-1">
                    {/* Total a Cobrar - sempre mostra o valor com juros quando há cartão de crédito ou débito */}
                    {(() => {
                      const temCartaoCredito = metodoPagamentoUnico === "cartao_credito" || 
                        metodosPagamento.some(m => m.metodo === "cartao_credito");
                      const temCartaoDebito = metodoPagamentoUnico === "cartao_debito" || 
                        metodosPagamento.some(m => m.metodo === "cartao_debito");
                      
                      // Sempre mostrar quando há cartão de crédito ou débito, pois sempre há valor a cobrar (com ou sem juros)
                      if (temCartaoCredito || temCartaoDebito) {
                        const totalACobrar = calcularTotalACobrar();
                        
                        // Calcular valor original baseado nos métodos de pagamento à vista (sem pagamento a prazo)
                        let valorOriginal = total;
                        if (metodosPagamento.length > 0) {
                          valorOriginal = metodosPagamento.reduce((sum, m) => {
                            return sum + parseValorComVirgula(m.valor);
                          }, 0);
                        } else if (metodoPagamentoUnico === "dinheiro") {
                          valorOriginal = parseValorComVirgula(valorDinheiro);
                        } else if (metodoPagamentoUnico === "cartao_credito" || metodoPagamentoUnico === "cartao_debito") {
                          valorOriginal = total;
                        }
                        
                        return (
                          <div className="flex justify-between items-center p-2 bg-red-50 rounded border border-red-200">
                            <div className="flex items-center space-x-1">
                              <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                              <span className="text-xs font-medium text-red-800">Total a Cobrar:</span>
                            </div>
                            <span className="text-sm font-bold text-red-600">
                              {totalACobrar.toLocaleString("pt-BR", {
                                style: "currency",
                                currency: "BRL"
                              })}
                            </span>
                          </div>
                        );
                      }
                      return null;
                    })()}

                    {/* Total a Receber - só aparece se não for apenas pagamento a prazo */}
                    {!usarPagamentoPrazo && (
                      <div className="flex justify-between items-center p-2 bg-green-50 rounded border border-green-200">
                        <div className="flex items-center space-x-1">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                          <span className="text-xs font-medium text-green-800">Total a Receber:</span>
                        </div>
                        <span className="text-sm font-bold text-green-600">
                          {calcularTotalPago().toLocaleString("pt-BR", {
                                    style: "currency",
                                    currency: "BRL"
                                  })}
                                </span>
                              </div>
                    )}

                    {/* Status do Pagamento */}
                    {(() => {
                      const statusPagamento = calcularStatusPagamento();
                      
                      // Se for apenas pagamento a prazo (sem métodos de pagamento à vista), não mostrar "Falta Receber"
                      if (usarPagamentoPrazo && metodosPagamento.length === 0 && !metodoPagamentoUnico) {
                        return null;
                      }
                      
                      if (statusPagamento.faltaPagar > 0) {
                        // Verificar se é pagamento múltiplo com prazo ativo
                        const isPagamentoMultiploComPrazo = metodosPagamento.length > 0 && usarPagamentoPrazo && clienteSelecionado;
                        
                        // Se for pagamento múltiplo com prazo, não mostrar o card laranja
                        if (isPagamentoMultiploComPrazo) {
                          return null;
                        }
                        
                        return (
                          <div className="flex justify-between items-center p-2 bg-orange-50 rounded border border-orange-200">
                            <div className="flex items-center space-x-1">
                              <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                              <span className="text-xs font-medium text-orange-800">
                                Falta Receber:
                              </span>
                            </div>
                            <span className="text-sm font-bold text-orange-600">
                              {statusPagamento.faltaPagar.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL"
                              })}
                            </span>
                      </div>
                        );
                      }
                      
                      if (statusPagamento.troco > 0) {
                        return (
                          <div className="flex justify-between items-center p-2 bg-blue-50 rounded border border-blue-200">
                            <div className="flex items-center space-x-1">
                              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                              <span className="text-xs font-medium text-blue-800">Troco:</span>
                            </div>
                            <span className="text-sm font-bold text-blue-600">
                              {statusPagamento.troco.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL"
                        })}
                      </span>
                    </div>
                        );
                      }
                      
                      if (statusPagamento.pagoCompleto && !usarPagamentoPrazo) {
                        return (
                          <div className="flex justify-between items-center p-2 bg-green-50 rounded border border-green-200">
                            <div className="flex items-center space-x-1">
                              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                              <span className="text-xs font-medium text-green-800">Pagamento Completo:</span>
                  </div>
                            <span className="text-sm font-bold text-green-600">✓</span>
                          </div>
                        );
                      }
                      
                      return null;
                    })()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>


      {/* Modal de Venda Finalizada */}
      {vendaFinalizada && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full mx-4">
            <CardContent className="pt-4 sm:pt-6">
              <div className="text-center mb-4 sm:mb-6">
                <div className="mx-auto flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-green-100 mb-3 sm:mb-4">
                  <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                </div>
                <h3 className="text-base sm:text-lg font-medium mb-2">
                  Venda Realizada com Sucesso!
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Venda #{vendaFinalizada.numero_venda} foi criada
                </p>
              </div>
              
              <div className="flex flex-col space-y-2 sm:space-y-3">
                <Button 
                  onClick={imprimirNota} 
                  className="w-full bg-green-600 hover:bg-green-700 text-white h-8 sm:h-10 text-xs sm:text-sm"
                >
                  <Printer className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Imprimir Nota
                </Button>
                <Button 
                  variant="outline" 
                  onClick={fecharVenda}
                  className="w-full h-8 sm:h-10 text-xs sm:text-sm"
                >
                  <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Fechar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de Parcelas */}
      {mostrarModalParcelas && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
          <Card className="max-w-2xl w-full max-h-[90vh] flex flex-col">
            <CardHeader className="pb-3 sm:pb-4 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base sm:text-lg lg:text-xl flex items-center">
                  <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 mr-2 text-blue-600" />
                  <span className="hidden sm:inline">Selecionar Parcelas</span>
                  <span className="sm:hidden">Parcelas</span>
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelarParcela}
                  className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 p-0 hover:bg-slate-100"
                >
                  <X className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="flex-1 overflow-hidden flex flex-col">
              {/* Header com informações */}
              <div className="text-center mb-3 sm:mb-4 lg:mb-6 p-2 sm:p-3 lg:p-4 bg-slate-50 rounded-lg">
                <h4 className="font-semibold text-slate-800 mb-2 text-xs sm:text-sm lg:text-base">
                  Escolha o número de parcelas
                </h4>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center space-y-1 sm:space-y-0 sm:space-x-3 lg:space-x-4 text-xs sm:text-sm">
                  <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                    <span className="text-slate-600">Valor para parcelas:</span>
                    <span className="font-bold text-xs sm:text-sm lg:text-lg text-green-600">
                      {valorParcelaModal.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL"
                      })}
                    </span>
                  </div>
                  {parcelaSelecionada && (
                    <div className="flex items-center justify-center space-x-1 sm:space-x-2 text-blue-600">
                      <span>•</span>
                      <span className="font-medium text-xs sm:text-sm">
                        {parcelaSelecionada.quantidade} parcela{parcelaSelecionada.quantidade > 1 ? "s" : ""}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Lista de parcelas com scroll */}
              <div className="flex-1 overflow-y-auto space-y-2 sm:space-y-3 pr-1 sm:pr-2">
                {parcelasDisponiveis.length === 0 ? (
                  <div className="text-center py-6 sm:py-8">
                    <AlertCircle className="h-8 w-8 sm:h-12 sm:w-12 text-slate-400 mx-auto mb-3 sm:mb-4" />
                    <h3 className="text-base sm:text-lg font-medium text-slate-600 mb-2">
                      Nenhuma parcela disponível
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500">
                      Configure as parcelas nas configurações do sistema
                    </p>
                  </div>
                ) : (
                  parcelasDisponiveis.map((parcela) => {
                    // Calcular valor total com taxa aplicada sobre o valor total da transação
                    const valorTotalComTaxa = parcela.taxa > 0 ? valorParcelaModal * (1 + parcela.taxa / 100) : valorParcelaModal;
                    const valorParcela = valorTotalComTaxa / parcela.quantidade;
                    const valorJuros = parcela.taxa > 0 ? (valorParcelaModal * parcela.taxa) / 100 : 0;
                    
                    return (
                      <div
                        key={parcela.id}
                        className={`p-3 sm:p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                          parcelaSelecionada?.id === parcela.id
                            ? "border-blue-500 bg-blue-50 shadow-md"
                            : "border-slate-200 hover:border-blue-300 hover:shadow-sm"
                        }`}
                        onClick={() => setParcelaSelecionada(parcela)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 sm:space-x-4">
                            <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center ${
                              parcelaSelecionada?.id === parcela.id
                                ? "border-blue-500 bg-blue-500"
                                : "border-slate-300"
                            }`}>
                              {parcelaSelecionada?.id === parcela.id && (
                                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white"></div>
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-1 sm:space-x-2 mb-1">
                                <span className="font-semibold text-sm sm:text-lg">
                                  {parcela.quantidade}x
                                </span>
                                <span className="text-slate-600 text-xs sm:text-base">de</span>
                                <span className="font-bold text-green-600 text-xs sm:text-base">
                                  {valorParcela.toLocaleString("pt-BR", {
                                    style: "currency",
                                    currency: "BRL"
                                  })}
                                </span>
                              </div>
                              
                              <div className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm text-slate-500">
                                <span>
                                  {parcela.quantidade} parcela{parcela.quantidade > 1 ? "s" : ""}
                                </span>
                                {parcela.taxa > 0 && (
                                  <>
                                    <span>•</span>
                                    <span className="text-orange-600 font-medium">
                                      Taxa: {parcela.taxa}%
                                    </span>
                                  </>
                                )}
                                {parcela.taxa === 0 && (
                                  <>
                                    <span>•</span>
                                    <span className="text-green-600 font-medium">
                                      Sem juros
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right flex-shrink-0">
                            <div className="font-bold text-sm sm:text-lg lg:text-xl text-slate-800">
                              {valorTotalComTaxa.toLocaleString("pt-BR", {
                                style: "currency",
                                currency: "BRL"
                              })}
                            </div>
                            {valorJuros > 0 && (
                              <div className="text-xs sm:text-sm text-orange-600 font-medium">
                                +{valorJuros.toLocaleString("pt-BR", {
                                  style: "currency",
                                  currency: "BRL"
                                })} juros
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Botões de ação */}
              <div className="flex space-x-2 sm:space-x-3 pt-2 sm:pt-3 lg:pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={handleCancelarParcela}
                  className="flex-1 h-8 sm:h-10 lg:h-12 text-xs sm:text-sm"
                >
                  <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Cancelar</span>
                  <span className="sm:hidden">Cancelar</span>
                </Button>
                <Button
                  onClick={handleConfirmarParcela}
                  disabled={!parcelaSelecionada}
                  className="flex-1 h-8 sm:h-10 lg:h-12 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 text-xs sm:text-sm"
                >
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Confirmar Parcela</span>
                  <span className="sm:hidden">Confirmar</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal PIX */}
      {mostrarModalPix && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
          <Card className="max-w-lg w-full mx-2 sm:mx-4">
            <CardHeader className="pb-2 sm:pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm sm:text-base lg:text-lg flex items-center">
                  <img 
                    src="/logopix.png" 
                    alt="PIX" 
                    className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 mr-1 sm:mr-2 object-contain"
                  />
                  <span className="hidden sm:inline">Dados PIX</span>
                  <span className="sm:hidden">PIX</span>
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMostrarModalPix(false)}
                  className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 p-0"
                >
                  <X className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 lg:space-y-6">
              {pixConfiguracao ? (
                <>
                  {/* QR Code */}
                  <div className="text-center">
                    <h4 className="font-medium mb-2 sm:mb-3 text-slate-700 text-sm sm:text-base">QR Code PIX</h4>
                    <div className="bg-white p-2 sm:p-3 lg:p-4 rounded-lg border-2 border-slate-200 inline-block">
                      {pixConfiguracao.qr_code ? (
                        <img 
                          src={pixConfiguracao.qr_code.startsWith('data:') 
                            ? pixConfiguracao.qr_code 
                            : pixConfiguracao.qr_code.startsWith('http') 
                              ? pixConfiguracao.qr_code 
                              : `data:image/png;base64,${pixConfiguracao.qr_code}`} 
                          alt="QR Code PIX" 
                          className="w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48 mx-auto object-contain"
                          onError={(e) => {
                            console.error('Erro ao carregar QR Code:', e);
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48 mx-auto flex items-center justify-center bg-slate-100 rounded-lg">
                          <div className="text-center">
                            <QrCode className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-slate-400 mx-auto mb-1 sm:mb-2" />
                            <p className="text-xs text-slate-500">
                              QR Code não configurado
                            </p>
                            <p className="text-xs text-slate-400 mt-1">
                              Use a chave PIX abaixo
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1 sm:mt-2 px-2">
                      {pixConfiguracao.qr_code 
                        ? "Escaneie o QR Code com seu aplicativo de pagamento"
                        : "Copie a chave PIX abaixo para fazer o pagamento"
                      }
                    </p>
                  </div>

                  {/* Chave PIX */}
                  <div>
                    <h4 className="font-medium mb-1 sm:mb-2 text-slate-700 text-sm sm:text-base">Chave PIX</h4>
                    <div className="bg-slate-50 p-2 sm:p-3 lg:p-4 rounded-lg border-2 border-slate-200">
                      <p className="font-mono text-xs sm:text-sm break-all text-center bg-white p-2 sm:p-3 rounded border">
                        {pixConfiguracao.chave_pix}
                      </p>
                    </div>
                  </div>

                  {/* Nome do Titular */}
                  <div className="text-center">
                    <h4 className="font-medium mb-2 sm:mb-3 text-slate-700 text-sm sm:text-base">Nome do Titular</h4>
                    <div className="bg-slate-50 p-2 sm:p-3 lg:p-4 rounded-lg border-2 border-slate-200">
                      <p className="text-sm sm:text-base lg:text-lg font-semibold text-slate-800">{pixConfiguracao.nome_titular}</p>
                    </div>
                  </div>

                </>
              ) : (
                <div className="text-center py-6 sm:py-8">
                  <AlertCircle className="h-8 w-8 sm:h-12 sm:w-12 text-slate-400 mx-auto mb-3 sm:mb-4" />
                  <h3 className="text-base sm:text-lg font-medium mb-2 text-slate-600">
                    Configuração PIX não encontrada
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 mb-3 sm:mb-4 px-2">
                    Configure as informações PIX nas configurações do sistema para usar esta funcionalidade.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setMostrarModalPix(false)}
                    className="w-full h-8 sm:h-10 text-xs sm:text-sm"
                  >
                    Fechar
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal Dados Bancários */}
      {mostrarModalDadosBancarios && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
          <Card className="max-w-lg w-full mx-2 sm:mx-4">
            <CardHeader className="pb-2 sm:pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm sm:text-base lg:text-lg flex items-center">
                  <Building2 className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 mr-1 sm:mr-2 text-blue-600" />
                  <span className="hidden sm:inline">Dados Bancários</span>
                  <span className="sm:hidden">Banco</span>
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMostrarModalDadosBancarios(false)}
                  className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 p-0"
                >
                  <X className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 lg:space-y-6">
              {carregandoDadosBancarios ? (
                <div className="text-center py-6 sm:py-8">
                  <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600 mx-auto mb-3 sm:mb-4"></div>
                  <p className="text-slate-600 text-sm sm:text-base">Carregando dados bancários...</p>
                </div>
              ) : dadosBancarios ? (
                <>
                  {/* Banco */}
                  <div>
                    <h4 className="font-medium mb-1 sm:mb-2 text-slate-700 text-sm sm:text-base">Banco</h4>
                    <div className="bg-slate-50 p-2 sm:p-3 lg:p-4 rounded-lg border-2 border-slate-200">
                      <p className="text-sm sm:text-base lg:text-lg font-semibold text-slate-800">{dadosBancarios.banco}</p>
                    </div>
                  </div>

                  {/* Agência e Conta */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <h4 className="font-medium mb-1 sm:mb-2 text-slate-700 text-sm sm:text-base">Agência</h4>
                      <div className="bg-slate-50 p-2 sm:p-3 lg:p-4 rounded-lg border-2 border-slate-200">
                        <p className="text-sm sm:text-base lg:text-lg font-semibold text-slate-800">{dadosBancarios.agencia}</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-1 sm:mb-2 text-slate-700 text-sm sm:text-base">Conta</h4>
                      <div className="bg-slate-50 p-2 sm:p-3 lg:p-4 rounded-lg border-2 border-slate-200">
                        <p className="text-sm sm:text-base lg:text-lg font-semibold text-slate-800">
                          {dadosBancarios.conta}-{dadosBancarios.digito}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Tipo de Conta */}
                  <div>
                    <h4 className="font-medium mb-1 sm:mb-2 text-slate-700 text-sm sm:text-base">Tipo de Conta</h4>
                    <div className="bg-slate-50 p-2 sm:p-3 lg:p-4 rounded-lg border-2 border-slate-200">
                      <p className="text-sm sm:text-base lg:text-lg font-semibold text-slate-800 capitalize">
                        {dadosBancarios.tipo_conta === 'corrente' ? 'Conta Corrente' : 'Conta Poupança'}
                      </p>
                    </div>
                  </div>

                  {/* Nome do Titular */}
                  <div>
                    <h4 className="font-medium mb-1 sm:mb-2 text-slate-700 text-sm sm:text-base">Nome do Titular</h4>
                    <div className="bg-slate-50 p-2 sm:p-3 lg:p-4 rounded-lg border-2 border-slate-200">
                      <p className="text-sm sm:text-base lg:text-lg font-semibold text-slate-800">{dadosBancarios.nome_titular}</p>
                    </div>
                  </div>

                  {/* CPF/CNPJ */}
                  <div>
                    <h4 className="font-medium mb-1 sm:mb-2 text-slate-700 text-sm sm:text-base">CPF/CNPJ</h4>
                    <div className="bg-slate-50 p-2 sm:p-3 lg:p-4 rounded-lg border-2 border-slate-200">
                      <p className="text-sm sm:text-base lg:text-lg font-semibold text-slate-800">{dadosBancarios.cpf_cnpj}</p>
                    </div>
                  </div>

                </>
              ) : (
                <div className="text-center py-6 sm:py-8">
                  <AlertCircle className="h-8 w-8 sm:h-12 sm:w-12 text-slate-400 mx-auto mb-3 sm:mb-4" />
                  <h3 className="text-base sm:text-lg font-medium mb-2 text-slate-600">
                    Dados bancários não encontrados
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 mb-3 sm:mb-4 px-2">
                    Configure os dados bancários nas configurações do sistema para usar esta funcionalidade.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setMostrarModalDadosBancarios(false)}
                    className="w-full h-8 sm:h-10 text-xs sm:text-sm"
                  >
                    Fechar
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
