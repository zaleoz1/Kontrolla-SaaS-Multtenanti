import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Plus, 
  Search, 
  Filter, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  CreditCard,
  Receipt,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Building,
  FileText,
  RefreshCw,
  AlertCircle,
  Upload,
  X,
  Check,
  Smartphone,
  Banknote,
  CreditCard as CreditCardIcon,
  Smartphone as SmartphoneIcon,
  Building2,
  FileText as FileTextIcon
} from "lucide-react";
import { useTransacoes } from "@/hooks/useTransacoes";
import { useContasReceber } from "@/hooks/useContasReceber";
import { useContasPagar } from "@/hooks/useContasPagar";
import { useFinanceiroStats } from "@/hooks/useFinanceiroStats";
import { useMetodosPagamento } from "@/hooks/useMetodosPagamento";

// Interfaces para pagamentos e recebimentos
interface PagamentoData {
  contaId: number;
  valor: number;
  metodoPagamento: 'pix' | 'dinheiro' | 'cartao_credito' | 'cartao_debito' | 'transferencia' | 'boleto' | 'cheque';
  dataPagamento: string;
  comprovante?: File;
  observacoes?: string;
  numeroDocumento?: string;
  bancoOrigem?: string;
  agenciaOrigem?: string;
  contaOrigem?: string;
  tipo_origem?: 'conta_pagar' | 'transacao' | 'conta_receber' | 'venda' | 'transacao_entrada';
  parcelas?: number;
  taxaParcela?: number;
}

interface RecebimentoData {
  contaId: number;
  valor: number;
  metodoPagamento: 'pix' | 'dinheiro' | 'cartao_credito' | 'cartao_debito' | 'transferencia' | 'boleto' | 'cheque';
  dataRecebimento: string;
  comprovante?: File;
  observacoes?: string;
  desconto?: number;
  juros?: number;
  tipo_origem?: 'conta_pagar' | 'transacao' | 'conta_receber' | 'venda' | 'transacao_entrada';
  parcelas?: number;
  taxaParcela?: number;
}

export default function Financeiro() {
  const [termoBusca, setTermoBusca] = useState("");
  const [periodo, setPeriodo] = useState<'hoje' | 'semana' | 'mes' | 'ano'>('mes');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [filtroCliente, setFiltroCliente] = useState('');
  const [filtroStatusPagar, setFiltroStatusPagar] = useState<string>('todos');
  const [filtroFornecedor, setFiltroFornecedor] = useState('');
  const [filtroTipoTransacao, setFiltroTipoTransacao] = useState<'todos' | 'entrada' | 'saida'>('todos');
  const [filtroDataInicioTrans, setFiltroDataInicioTrans] = useState('');
  const navigate = useNavigate();

  // Estados para modais de pagamento e recebimento
  const [modalPagamento, setModalPagamento] = useState(false);
  const [modalRecebimento, setModalRecebimento] = useState(false);
  const [contaSelecionada, setContaSelecionada] = useState<any>(null);
  const [tipoOperacao, setTipoOperacao] = useState<'pagar' | 'receber'>('pagar');
  const [editandoValorRecebimento, setEditandoValorRecebimento] = useState(false);
  const [valorEditadoRecebimento, setValorEditadoRecebimento] = useState(0);
  const [valorOriginalRecebimento, setValorOriginalRecebimento] = useState(0);
  const [dadosPagamento, setDadosPagamento] = useState<PagamentoData>({
    contaId: 0,
    valor: 0,
    metodoPagamento: 'pix',
    dataPagamento: new Date().toISOString().split('T')[0],
    observacoes: '',
    numeroDocumento: '',
    bancoOrigem: '',
    agenciaOrigem: '',
    contaOrigem: '',
    parcelas: 1,
    taxaParcela: 0
  });
  const [dadosRecebimento, setDadosRecebimento] = useState<RecebimentoData>({
    contaId: 0,
    valor: 0,
    metodoPagamento: 'pix',
    dataRecebimento: new Date().toISOString().split('T')[0],
    observacoes: '',
    desconto: 0,
    juros: 0,
    parcelas: 1,
    taxaParcela: 0
  });

  // Hooks para dados financeiros
  const { 
    transacoes, 
    loading: loadingTransacoes, 
    error: errorTransacoes,
    buscarTransacoes 
  } = useTransacoes();
  
  const { 
    contas: contasReceber, 
    loading: loadingContasReceber, 
    error: errorContasReceber,
    buscarContas: buscarContasReceber,
    marcarComoPago: marcarContaReceberComoPago,
    processarPagamentoParcial
  } = useContasReceber();
  
  const { 
    contas: contasPagar, 
    loading: loadingContasPagar, 
    error: errorContasPagar,
    buscarContas: buscarContasPagar,
    marcarComoPago: marcarContaPagarComoPago,
    processarPagamento: processarPagamentoContaPagar
  } = useContasPagar();
  
  const { 
    stats, 
    loading: loadingStats, 
    error: errorStats,
    buscarStats 
  } = useFinanceiroStats();

  // Hook para métodos de pagamento
  const { metodosPagamento } = useMetodosPagamento();

  // Métodos de pagamento fixos para o modal "Realizar Pagamento"
  const metodosPagamentoFixos = [
    { id: 1, tipo: 'pix', nome: 'PIX', taxa: 0 },
    { id: 2, tipo: 'dinheiro', nome: 'Dinheiro', taxa: 0 },
    { id: 3, tipo: 'cartao_credito', nome: 'Cartão de Crédito', taxa: 0, parcelas: [
      { id: 1, quantidade: 1, taxa: 0, ativo: true },
      { id: 2, quantidade: 2, taxa: 0, ativo: true },
      { id: 3, quantidade: 3, taxa: 0, ativo: true },
      { id: 4, quantidade: 4, taxa: 0, ativo: true },
      { id: 5, quantidade: 5, taxa: 0, ativo: true },
      { id: 6, quantidade: 6, taxa: 0, ativo: true },
      { id: 7, quantidade: 7, taxa: 0, ativo: true },
      { id: 8, quantidade: 8, taxa: 0, ativo: true },
      { id: 9, quantidade: 9, taxa: 0, ativo: true },
      { id: 10, quantidade: 10, taxa: 0, ativo: true },
      { id: 11, quantidade: 11, taxa: 0, ativo: true },
      { id: 12, quantidade: 12, taxa: 0, ativo: true }
    ]},
    { id: 4, tipo: 'cartao_debito', nome: 'Cartão de Débito', taxa: 0 },
    { id: 5, tipo: 'transferencia', nome: 'Transferência Bancária', taxa: 0 },
    { id: 6, tipo: 'boleto', nome: 'Boleto Bancário', taxa: 0 },
    { id: 7, tipo: 'cheque', nome: 'Cheque', taxa: 0 }
  ];

  // Atualizar método padrão quando os métodos de pagamento forem carregados (apenas na inicialização)
  useEffect(() => {
    if (metodosPagamento.length > 0 && dadosPagamento.metodoPagamento === 'pix' && dadosRecebimento.metodoPagamento === 'pix') {
      const primeiroMetodo = metodosPagamento[0];
      setDadosPagamento(prev => ({ ...prev, metodoPagamento: primeiroMetodo.tipo }));
      setDadosRecebimento(prev => ({ ...prev, metodoPagamento: primeiroMetodo.tipo }));
    }
  }, [metodosPagamento]);

  // Atualizar parcelas quando método de pagamento for cartão de crédito ou débito
  useEffect(() => {
    if (dadosPagamento.metodoPagamento === 'cartao_credito') {
      const parcelasDisponiveis = obterParcelasFixasDisponiveis(dadosPagamento.metodoPagamento);
      if (parcelasDisponiveis.length > 0) {
        const primeiraParcela = parcelasDisponiveis[0];
        setDadosPagamento(prev => ({ 
          ...prev, 
          parcelas: primeiraParcela.quantidade,
          taxaParcela: primeiraParcela.taxa
        }));
      }
    } else if (dadosPagamento.metodoPagamento === 'cartao_debito') {
      // Para cartão de débito, aplicar apenas a taxa sem parcelas
      const metodo = obterMetodoFixoSelecionado(dadosPagamento.metodoPagamento);
      if (metodo) {
        setDadosPagamento(prev => ({ 
          ...prev, 
          parcelas: 1,
          taxaParcela: metodo.taxa
        }));
      }
    } else {
      // Reset parcelas e taxa quando não for cartão
      setDadosPagamento(prev => ({ 
        ...prev, 
        parcelas: 1,
        taxaParcela: 0
      }));
    }
  }, [dadosPagamento.metodoPagamento]);

  useEffect(() => {
    if (dadosRecebimento.metodoPagamento === 'cartao_credito') {
      const parcelasDisponiveis = obterParcelasDisponiveis(dadosRecebimento.metodoPagamento);
      if (parcelasDisponiveis.length > 0) {
        const primeiraParcela = parcelasDisponiveis[0];
        setDadosRecebimento(prev => ({ 
          ...prev, 
          parcelas: primeiraParcela.quantidade,
          taxaParcela: primeiraParcela.taxa
        }));
      }
    } else if (dadosRecebimento.metodoPagamento === 'cartao_debito') {
      // Para cartão de débito, aplicar apenas a taxa sem parcelas
      const metodo = obterMetodoSelecionado(dadosRecebimento.metodoPagamento);
      if (metodo) {
        setDadosRecebimento(prev => ({ 
          ...prev, 
          parcelas: 1,
          taxaParcela: metodo.taxa
        }));
      }
    } else {
      // Reset parcelas e taxa quando não for cartão
      setDadosRecebimento(prev => ({ 
        ...prev, 
        parcelas: 1,
        taxaParcela: 0
      }));
    }
  }, [dadosRecebimento.metodoPagamento]);

  // Carregar dados iniciais
  useEffect(() => {
    const carregarDados = async () => {
      try {
        await Promise.all([
          buscarStats(periodo),
          buscarTransacoes({ limit: 10 }),
          buscarContasReceber({ limit: 10 }),
          buscarContasPagar({ limit: 10 })
        ]);
      } catch (error) {
        console.error('Erro ao carregar dados financeiros:', error);
      }
    };

    carregarDados();
  }, [periodo]); // Removido as funções das dependências para evitar loop infinito

  // Função para recarregar dados
  const recarregarDados = async () => {
    try {
      await Promise.all([
        buscarStats(periodo),
        buscarTransacoes({ limit: 10 }),
        buscarContasReceber({ limit: 10 }),
        buscarContasPagar({ limit: 10 })
      ]);
    } catch (error) {
      console.error('Erro ao recarregar dados:', error);
    }
  };

  // Função para limpar filtros
  const limparFiltros = () => {
    setFiltroStatus('todos');
    setFiltroCliente('');
  };

  // Função para limpar filtros de contas a pagar
  const limparFiltrosPagar = () => {
    setFiltroStatusPagar('todos');
    setFiltroFornecedor('');
  };

  // Função para limpar filtros de transações
  const limparFiltrosTransacoes = () => {
    setFiltroTipoTransacao('todos');
    setFiltroDataInicioTrans('');
  };

  const obterBadgeStatus = (status: string, dias?: number) => {
    switch (status) {
      case "pendente":
        return <Badge variant="secondary">Pendente</Badge>;
      case "vencido":
        return <Badge variant="destructive">Vencido</Badge>;
      case "pago":
      case "concluida":
        return <Badge className="bg-success hover:bg-success/90">Pago</Badge>;
      default:
        return <Badge variant="secondary">Desconhecido</Badge>;
    }
  };

  // Calcular totais dos dados reais
  const totalReceber = Number(stats?.stats?.contas_receber?.valor_pendente) || 0;
  const totalPagar = Number(stats?.stats?.contas_pagar?.valor_pendente) || 0;
  const totalEntradas = Number(stats?.stats?.total_entradas) || 0;
  const totalSaidas = Number(stats?.stats?.total_saidas) || 0;
  const saldoAtual = Number((stats?.stats as any)?.saldo_atual) || 0;
  const totalPagoReceber = Number(stats?.stats?.contas_receber?.valor_pago) || 0;
  const totalPagoPagar = Number(stats?.stats?.contas_pagar?.valor_pago) || 0;

  // Calcular total recebido apenas das transações de entrada
  const totalRecebidoTransacoes = transacoes
    .filter(transacao => transacao.tipo === 'entrada' && transacao.status === 'concluida')
    .reduce((total, transacao) => total + (Number(transacao.valor) || 0), 0);

  // Função para filtrar contas a receber
  const contasReceberFiltradas = contasReceber.filter((conta) => {
    // Filtro por status
    if (filtroStatus && filtroStatus !== 'todos' && conta.status !== filtroStatus) {
      return false;
    }

    // Filtro por nome do cliente
    if (filtroCliente) {
      const clienteNome = (conta.cliente_nome || '').toLowerCase();
      const termoCliente = filtroCliente.toLowerCase();
      if (!clienteNome.includes(termoCliente)) {
        return false;
      }
    }

    return true;
  });

  // Função para filtrar contas a pagar
  const contasPagarFiltradas = contasPagar.filter((conta) => {
    // Filtro por status
    if (filtroStatusPagar && filtroStatusPagar !== 'todos' && conta.status !== filtroStatusPagar) {
      return false;
    }

    // Filtro por nome do fornecedor
    if (filtroFornecedor) {
      const fornecedorNome = (conta.fornecedor || '').toLowerCase();
      const termoFornecedor = filtroFornecedor.toLowerCase();
      if (!fornecedorNome.includes(termoFornecedor)) {
        return false;
      }
    }

    return true;
  });

  // Utilitários de data para filtros (evitar problemas de timezone com 'yyyy-mm-dd')
  const parseDateOnly = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    const [year, month, day] = dateStr.split('-').map((v) => parseInt(v, 10));
    if (!year || !month || !day) return null;
    // new Date(year, monthIndex, day) cria no timezone local às 00:00
    return new Date(year, month - 1, day);
  };

  const atStartOfDay = (d: Date): Date => {
    const out = new Date(d);
    out.setHours(0, 0, 0, 0);
    return out;
  };

  const atEndOfDay = (d: Date): Date => {
    const out = new Date(d);
    out.setHours(23, 59, 59, 999);
    return out;
  };

  // Função para filtrar transações
  const transacoesFiltradas = transacoes.filter((t) => {
    // Filtro por tipo (entrada = recebimento, saida = pagamento)
    if (filtroTipoTransacao !== 'todos' && t.tipo !== filtroTipoTransacao) {
      return false;
    }

    // Filtro por intervalo de datas (usa data_atualizacao com fallback em data_criacao)
    if (filtroDataInicioTrans) {
      const dataBase = new Date(t.data_atualizacao || t.data_criacao);
      const diParsed = parseDateOnly(filtroDataInicioTrans);
      if (diParsed) {
        const di = atStartOfDay(diParsed);
        const df = atEndOfDay(diParsed);
        if (dataBase < di || dataBase > df) return false;
      }
    }

    return true;
  });

  // Função para calcular dias de vencimento
  const calcularDiasVencimento = (dataVencimento: string) => {
    const hoje = new Date();
    const vencimento = new Date(dataVencimento);
    const diffTime = vencimento.getTime() - hoje.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Função para obter texto de dias
  const obterTextoDias = (dias: number) => {
    if (dias > 0) {
      return `${dias} dia${dias > 1 ? 's' : ''} para vencer`;
    } else if (dias === 0) {
      return 'Vence hoje';
    } else {
      return `${Math.abs(dias)} dia${Math.abs(dias) > 1 ? 's' : ''} em atraso`;
    }
  };

  // Função para formatar valor
  const formatarValor = (valor: number) => {
    // Garantir que o valor seja um número válido
    const valorNumerico = typeof valor === 'number' ? valor : parseFloat(valor) || 0;
    
    return valorNumerico.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Função para formatar data
  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString("pt-BR");
  };

  // Função para abrir modal de pagamento
  const abrirModalPagamento = (conta: any, tipo: 'receber' | 'pagar') => {
    setContaSelecionada(conta);
    setTipoOperacao(tipo);
    
    // Para recebimentos, sempre usar PIX como padrão. Para pagamentos, usar o primeiro método disponível
    const metodoPadrao = tipo === 'receber' ? 'pix' : (metodosPagamento.length > 0 ? metodosPagamento[0].tipo : 'pix');
    
    // Configurar parcelas e taxas baseado no método
    let parcelasIniciais = 1;
    let taxaInicial = 0;
    
    if (metodoPadrao === 'cartao_credito') {
      const parcelasDisponiveis = obterParcelasFixasDisponiveis(metodoPadrao);
      if (parcelasDisponiveis.length > 0) {
        parcelasIniciais = parcelasDisponiveis[0].quantidade;
        taxaInicial = parcelasDisponiveis[0].taxa;
      }
    } else if (metodoPadrao === 'cartao_debito') {
      // Para cartão de débito, usar apenas a taxa do método
      const metodo = metodosPagamentoFixos.find(m => m.tipo === metodoPadrao);
      if (metodo) {
        parcelasIniciais = 1;
        taxaInicial = metodo.taxa;
      }
    } else if (metodoPadrao === 'pix') {
      // Para PIX, usar a taxa do método PIX se disponível
      const metodo = metodosPagamentoFixos.find(m => m.tipo === 'pix');
      if (metodo) {
        parcelasIniciais = 1;
        taxaInicial = metodo.taxa;
      }
    }
    
    if (tipo === 'receber') {
      const valorOriginal = Number(conta.valor) || 0;
      setDadosRecebimento({
        contaId: conta.id,
        valor: valorOriginal,
        metodoPagamento: metodoPadrao,
        dataRecebimento: new Date().toISOString().split('T')[0],
        observacoes: '',
        desconto: 0,
        juros: 0,
        tipo_origem: conta.tipo_origem,
        parcelas: parcelasIniciais,
        taxaParcela: taxaInicial
      });
      setValorOriginalRecebimento(valorOriginal);
      // Inicializar com o valor calculado (original + taxas)
      const valorCalculadoInicial = metodoPadrao === 'cartao_debito' 
        ? calcularValorComTaxa(valorOriginal, taxaInicial)
        : calcularValorParcela(valorOriginal, parcelasIniciais, taxaInicial) * parcelasIniciais;
      setValorEditadoRecebimento(valorCalculadoInicial);
      setEditandoValorRecebimento(false);
      setModalRecebimento(true);
    } else {
      setDadosPagamento({
        contaId: conta.id,
        valor: Number(conta.valor) || 0,
        metodoPagamento: metodoPadrao,
        dataPagamento: new Date().toISOString().split('T')[0],
        observacoes: '',
        numeroDocumento: '',
        bancoOrigem: '',
        agenciaOrigem: '',
        contaOrigem: '',
        tipo_origem: conta.tipo_origem,
        parcelas: parcelasIniciais,
        taxaParcela: taxaInicial
      });
      setModalPagamento(true);
    }
  };

  // Função para processar pagamento
  const processarPagamento = async () => {
    try {
      // Usar a nova função de processamento de pagamento
      await processarPagamentoContaPagar(dadosPagamento.contaId, {
        dataPagamento: dadosPagamento.dataPagamento,
        metodoPagamento: dadosPagamento.metodoPagamento,
        observacoes: dadosPagamento.observacoes,
        comprovante: dadosPagamento.comprovante,
        numeroDocumento: dadosPagamento.numeroDocumento,
        bancoOrigem: dadosPagamento.bancoOrigem,
        agenciaOrigem: dadosPagamento.agenciaOrigem,
        contaOrigem: dadosPagamento.contaOrigem,
        parcelas: dadosPagamento.parcelas,
        taxaParcela: dadosPagamento.taxaParcela
      });
      
      setModalPagamento(false);
      await recarregarDados();
      
      // Aqui você pode adicionar notificação de sucesso
      console.log('Pagamento processado com sucesso:', dadosPagamento);
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
    }
  };

  // Função para processar recebimento
  const processarRecebimento = async () => {
    try {
      // Sempre usar a funcionalidade de pagamento parcial que já tem a lógica correta
      // para pagamento completo e parcial
      await processarPagamentoParcial(dadosRecebimento.contaId, {
        valorRecebido: valorEditadoRecebimento,
        dataPagamento: dadosRecebimento.dataRecebimento,
        metodoPagamento: dadosRecebimento.metodoPagamento,
        observacoes: dadosRecebimento.observacoes
      });
      
      setModalRecebimento(false);
      await recarregarDados();
      
      // Aqui você pode adicionar notificação de sucesso
      console.log('Recebimento processado com sucesso:', dadosRecebimento);
    } catch (error) {
      console.error('Erro ao processar recebimento:', error);
    }
  };

  // Função para marcar conta como paga (versão simplificada para compatibilidade)
  const handleMarcarComoPago = async (id: number, tipo: 'receber' | 'pagar', tipo_origem?: 'conta_pagar' | 'transacao' | 'conta_receber' | 'venda' | 'transacao_entrada') => {
    try {
      if (tipo === 'receber') {
        await marcarContaReceberComoPago(id, undefined, tipo_origem as 'conta_receber' | 'venda' | 'transacao_entrada');
      } else {
        await marcarContaPagarComoPago(id, undefined, tipo_origem as 'conta_pagar' | 'transacao');
      }
      await recarregarDados();
    } catch (error) {
      console.error('Erro ao marcar como pago:', error);
    }
  };

  // Função para obter ícone do método de pagamento
  const obterIconeMetodoPagamento = (tipo: string) => {
    switch (tipo) {
      case 'pix':
        return <SmartphoneIcon className="h-4 w-4" />;
      case 'dinheiro':
        return <Banknote className="h-4 w-4" />;
      case 'cartao_credito':
      case 'cartao_debito':
        return <CreditCardIcon className="h-4 w-4" />;
      case 'transferencia':
        return <Building2 className="h-4 w-4" />;
      case 'boleto':
      case 'cheque':
        return <FileTextIcon className="h-4 w-4" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  // Função para obter método de pagamento selecionado
  const obterMetodoSelecionado = (tipo: string) => {
    return metodosPagamento.find(metodo => metodo.tipo === tipo);
  };

  // Função para obter método de pagamento fixo selecionado (para modal de pagamento)
  const obterMetodoFixoSelecionado = (tipo: string) => {
    return metodosPagamentoFixos.find(metodo => metodo.tipo === tipo);
  };

  // Função para obter parcelas disponíveis para um método
  const obterParcelasDisponiveis = (tipo: string) => {
    const metodo = obterMetodoSelecionado(tipo);
    if (!metodo || tipo !== 'cartao_credito') return [];
    
    return metodo.parcelas
      .filter(parcela => parcela.ativo)
      .sort((a, b) => a.quantidade - b.quantidade);
  };

  // Função para obter parcelas disponíveis para um método fixo (para modal de pagamento)
  const obterParcelasFixasDisponiveis = (tipo: string) => {
    const metodo = obterMetodoFixoSelecionado(tipo);
    if (!metodo || tipo !== 'cartao_credito') return [];
    
    return metodo.parcelas
      .filter(parcela => parcela.ativo)
      .sort((a, b) => a.quantidade - b.quantidade);
  };

  // Função para calcular valor da parcela
  const calcularValorParcela = (valor: number, parcelas: number, taxa: number) => {
    const valorComTaxa = valor * (1 + taxa / 100);
    return valorComTaxa / parcelas;
  };

  // Função para calcular valor com taxa (para cartão de débito)
  const calcularValorComTaxa = (valor: number, taxa: number) => {
    return valor * (1 + taxa / 100);
  };

  // Função para calcular valor total a cobrar com taxas
  const calcularValorTotalCobrar = () => {
    if (dadosRecebimento.metodoPagamento === 'cartao_debito') {
      return calcularValorComTaxa(valorOriginalRecebimento, dadosRecebimento.taxaParcela || 0);
    } else if (dadosRecebimento.metodoPagamento === 'cartao_credito') {
      return calcularValorParcela(valorOriginalRecebimento, dadosRecebimento.parcelas || 1, dadosRecebimento.taxaParcela || 0) * (dadosRecebimento.parcelas || 1);
    } else {
      return valorOriginalRecebimento;
    }
  };

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="w-full">
        {/* Título e Descrição - Sempre no topo */}
        <div className="mb-4 md:mb-0">
          <h1 className="text-2xl sm:text-3xl font-bold">Financeiro</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Controle financeiro e fluxo de caixa
          </p>
        </div>

        {/* Filtros e Ações - Desktop */}
        <div className="hidden md:flex items-center space-x-2 justify-end">
          <Select value={periodo} onValueChange={(value: 'hoje' | 'semana' | 'mes' | 'ano') => setPeriodo(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hoje">Hoje</SelectItem>
              <SelectItem value="semana">Esta Semana</SelectItem>
              <SelectItem value="mes">Este Mês</SelectItem>
              <SelectItem value="ano">Este Ano</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={recarregarDados} disabled={loadingStats}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loadingStats ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button className="bg-gradient-primary" onClick={() => navigate("/dashboard/nova-transacao")}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Transação
          </Button>
        </div>

        {/* Filtros e Ações - Mobile */}
        <div className="md:hidden space-y-3 w-full">
          <div className="space-y-1 w-full">
            <Label className="text-xs font-medium">Período:</Label>
            <Select value={periodo} onValueChange={(value: 'hoje' | 'semana' | 'mes' | 'ano') => setPeriodo(value)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hoje">Hoje</SelectItem>
                <SelectItem value="semana">Esta Semana</SelectItem>
                <SelectItem value="mes">Este Mês</SelectItem>
                <SelectItem value="ano">Este Ano</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 w-full">
            <Button 
              variant="outline" 
              onClick={recarregarDados} 
              disabled={loadingStats}
              className="flex-1 text-xs sm:text-sm"
            >
              <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 ${loadingStats ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Atualizar</span>
              <span className="sm:hidden">Atualizar</span>
            </Button>
            <Button 
              className="flex-1 bg-gradient-primary text-xs sm:text-sm" 
              onClick={() => navigate("/dashboard/nova-transacao")}
            >
              <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Nova Transação</span>
              <span className="sm:hidden">Nova</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-2 lg:grid-cols-5">
        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-2 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground">Saldo Atual</p>
                {loadingStats ? (
                  <Skeleton className="h-5 sm:h-8 w-20 sm:w-32" />
                ) : (
                  <p className={`text-sm sm:text-2xl font-bold break-words ${
                    saldoAtual >= 0 ? 'text-success' : 'text-destructive'
                  }`}>
                    {formatarValor(saldoAtual)}
                  </p>
                )}
              </div>
              <div className={`p-1 sm:p-2 rounded-lg flex-shrink-0 self-start sm:self-auto ${
                saldoAtual >= 0 ? 'bg-success/10' : 'bg-destructive/10'
              }`}>
                <DollarSign className={`h-3 w-3 sm:h-5 sm:w-5 ${
                  saldoAtual >= 0 ? 'text-success' : 'text-destructive'
                }`} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-2 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground">Total Recebido</p>
                {loadingTransacoes ? (
                  <Skeleton className="h-5 sm:h-8 w-20 sm:w-32" />
                ) : (
                  <p className="text-sm sm:text-2xl font-bold text-success break-words">
                    {formatarValor(totalRecebidoTransacoes)}
                  </p>
                )}
              </div>
              <div className="p-1 sm:p-2 rounded-lg bg-success/10 flex-shrink-0 self-start sm:self-auto">
                <CheckCircle className="h-3 w-3 sm:h-5 sm:w-5 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-2 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground">A Receber</p>
                {loadingStats ? (
                  <Skeleton className="h-5 sm:h-8 w-20 sm:w-32" />
                ) : (
                  <p className="text-sm sm:text-2xl font-bold text-yellow-600 break-words">
                    {formatarValor(totalReceber)}
                  </p>
                )}
              </div>
              <div className="p-1 sm:p-2 rounded-lg bg-success/10 flex-shrink-0 self-start sm:self-auto">
                <ArrowUpRight className="h-3 w-3 sm:h-5 sm:w-5 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-2 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground">A Pagar</p>
                {loadingStats ? (
                  <Skeleton className="h-5 sm:h-8 w-20 sm:w-32" />
                ) : (
                  <p className="text-sm sm:text-2xl font-bold text-destructive break-words">
                    {formatarValor(totalPagar)}
                  </p>
                )}
              </div>
              <div className="p-1 sm:p-2 rounded-lg bg-destructive/10 flex-shrink-0 self-start sm:self-auto">
                <ArrowDownRight className="h-3 w-3 sm:h-5 sm:w-5 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-2 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground">Total Pago</p>
                {loadingStats ? (
                  <Skeleton className="h-5 sm:h-8 w-20 sm:w-32" />
                ) : (
                  <p className="text-sm sm:text-2xl font-bold text-green-500 break-words">
                    {formatarValor(totalPagoPagar)}
                  </p>
                )}
              </div>
              <div className="p-1 sm:p-2 rounded-lg bg-success/10 flex-shrink-0 self-start sm:self-auto">
                <CheckCircle className="h-3 w-3 sm:h-5 sm:w-5 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Abas Financeiras */}
      <Tabs defaultValue="receber" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
          <TabsTrigger value="receber" className="text-xs sm:text-sm py-2 px-2 sm:px-3">
            <span className="hidden sm:inline">Contas a Receber</span>
            <span className="sm:hidden">Receber</span>
          </TabsTrigger>  
          <TabsTrigger value="pagar" className="text-xs sm:text-sm py-2 px-2 sm:px-3">
            <span className="hidden sm:inline">Contas a Pagar</span>
            <span className="sm:hidden">Pagar</span>
          </TabsTrigger>
          <TabsTrigger value="transacoes" className="text-xs sm:text-sm py-2 px-2 sm:px-3">
            <span className="hidden sm:inline">Transações</span>
            <span className="sm:hidden">Transações</span>
          </TabsTrigger>
          <TabsTrigger value="relatorios" className="text-xs sm:text-sm py-2 px-2 sm:px-3">
            <span className="hidden sm:inline">Relatórios</span>
            <span className="sm:hidden">Relatórios</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="receber" className="space-y-4">
          {/* Filtros para Contas a Receber */}
          <Card className="bg-gradient-card shadow-card">
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Busca e Status */}
                <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-y-0 md:space-x-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nome do cliente..."
                      value={filtroCliente}
                      onChange={(e) => setFiltroCliente(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={limparFiltros}
                    disabled={!filtroCliente && filtroStatus === 'todos'}
                  >
                    Limpar
                  </Button>
                  <div className="flex space-x-2">
                    <Button 
                      variant={filtroStatus === 'todos' ? "default" : "outline"}
                      onClick={() => setFiltroStatus('todos')}
                      size="sm"
                    >
                      Todos
                    </Button>
                    <Button 
                      variant={filtroStatus === 'pendente' ? "default" : "outline"}
                      onClick={() => setFiltroStatus('pendente')}
                      size="sm"
                    >
                      Pendentes
                    </Button>
                    <Button 
                      variant={filtroStatus === 'vencido' ? "default" : "outline"}
                      onClick={() => setFiltroStatus('vencido')}
                      size="sm"
                    >
                      Vencidos
                    </Button>
                  </div>
                </div>

                
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                <CardTitle className="text-sm sm:text-base">Contas a Receber</CardTitle>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="w-fit">
                    {loadingContasReceber ? '...' : contasReceberFiltradas.length} {(filtroStatus !== 'todos' || filtroCliente) ? 'filtradas' : 'pendentes'}
                  </Badge>
                  {(filtroStatus !== 'todos' || filtroCliente) && (
                    <Badge variant="outline" className="text-xs">
                      {contasReceber.length} total
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {errorContasReceber && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Erro ao carregar contas a receber: {errorContasReceber}
                  </AlertDescription>
                </Alert>
              )}
              
              {loadingContasReceber ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                      <div className="text-right space-y-2">
                        <Skeleton className="h-6 w-20" />
                        <Skeleton className="h-8 w-24" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : contasReceberFiltradas.length === 0 ? (
                <div className="text-center py-8">
                  <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {(filtroStatus !== 'todos' || filtroCliente) 
                      ? 'Nenhuma conta encontrada com os filtros aplicados' 
                      : 'Nenhuma conta a receber encontrada'
                    }
                  </p>
                  {(filtroStatus !== 'todos' || filtroCliente) && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={limparFiltros}
                      className="mt-4"
                    >
                      <X className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                      Limpar Filtros
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {contasReceberFiltradas.map((item) => {
                    const dias = calcularDiasVencimento(item.data_vencimento);
                    return (
                      <div key={item.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 rounded-lg border bg-muted/30 space-y-3 sm:space-y-0">
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-sm sm:text-base truncate">{item.cliente_nome || 'Cliente não informado'}</p>
                            {obterBadgeStatus(item.status, dias)}
                            {item.tipo_origem === 'venda' && (
                              <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                                Venda
                              </Badge>
                            )}
                            {item.tipo_origem === 'transacao_entrada' && (
                              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                                Transação
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{item.descricao}</p>
                          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-muted-foreground">
                            <span>Vencimento: {formatarData(item.data_vencimento)}</span>
                            {item.parcela && <span>Parcela: {item.parcela}</span>}
                            <span className={`font-medium ${
                              dias > 0 ? 'text-blue-600' : 
                              dias === 0 ? 'text-orange-600' : 
                              'text-destructive'
                            }`}>
                              {obterTextoDias(dias)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:flex-col sm:items-end sm:space-y-1">
                          {/* Valor principal */}
                          <p className="text-sm sm:text-lg font-bold text-success break-words">{formatarValor(Number(item.valor) || 0)}</p>
                          
                          {item.status === 'pendente' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => abrirModalPagamento(item, 'receber')}
                              className="text-xs sm:text-sm"
                            >
                              <Receipt className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                              <span className="hidden sm:inline">Receber</span>
                              <span className="sm:hidden">Receber</span>
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pagar" className="space-y-4">
          {/* Filtros para Contas a Pagar */}
          <Card className="bg-gradient-card shadow-card">
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Busca e Status */}
                <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-y-0 md:space-x-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nome do fornecedor..."
                      value={filtroFornecedor}
                      onChange={(e) => setFiltroFornecedor(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={limparFiltrosPagar}
                    disabled={!filtroFornecedor && filtroStatusPagar === 'todos'}
                  >
                    Limpar
                  </Button>
                  <div className="flex space-x-2">
                    <Button 
                      variant={filtroStatusPagar === 'todos' ? "default" : "outline"}
                      onClick={() => setFiltroStatusPagar('todos')}
                      size="sm"
                    >
                      Todos
                    </Button>
                    <Button 
                      variant={filtroStatusPagar === 'pago' ? "default" : "outline"}
                      onClick={() => setFiltroStatusPagar('pago')}
                      size="sm"
                    >
                      Pagos
                    </Button>
                    <Button 
                      variant={filtroStatusPagar === 'pendente' ? "default" : "outline"}
                      onClick={() => setFiltroStatusPagar('pendente')}
                      size="sm"
                    >
                      Pendentes
                    </Button>
                    <Button 
                      variant={filtroStatusPagar === 'vencido' ? "default" : "outline"}
                      onClick={() => setFiltroStatusPagar('vencido')}
                      size="sm"
                    >
                      Vencidos
                    </Button>
                  </div>
                </div>

                
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                <CardTitle className="text-sm sm:text-base">Contas a Pagar</CardTitle>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="w-fit">
                    {loadingContasPagar ? '...' : contasPagarFiltradas.length} {(filtroStatusPagar !== 'todos' || filtroFornecedor) ? 'filtradas' : 'pendentes'}
                  </Badge>
                  {(filtroStatusPagar !== 'todos' || filtroFornecedor) && (
                    <Badge variant="outline" className="text-xs">
                      {contasPagar.length} total
                    </Badge>
                  )}
                  {contasPagarFiltradas.some(conta => conta.tipo_conta === 'funcionario') && (
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                      {contasPagarFiltradas.filter(conta => conta.tipo_conta === 'funcionario').length} funcionários
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {errorContasPagar && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Erro ao carregar contas a pagar: {errorContasPagar}
                  </AlertDescription>
                </Alert>
              )}
              
              {loadingContasPagar ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                      <div className="text-right space-y-2">
                        <Skeleton className="h-6 w-20" />
                        <Skeleton className="h-8 w-24" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : contasPagarFiltradas.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {(filtroStatusPagar !== 'todos' || filtroFornecedor) 
                      ? 'Nenhuma conta encontrada com os filtros aplicados' 
                      : 'Nenhuma conta a pagar encontrada'
                    }
                  </p>
                  {(filtroStatusPagar !== 'todos' || filtroFornecedor) && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={limparFiltrosPagar}
                      className="mt-4"
                    >
                      <X className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                      Limpar Filtros
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {contasPagarFiltradas.map((item) => {
                    const dias = calcularDiasVencimento(item.data_vencimento);
                    return (
                      <div key={item.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 rounded-lg border bg-muted/30 space-y-3 sm:space-y-0">
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-sm sm:text-base truncate">{item.fornecedor}</p>
                            {obterBadgeStatus(item.status, dias)}
                            {item.tipo_origem === 'transacao' && (
                              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                                Transação
                              </Badge>
                            )}
                            {item.tipo_conta === 'funcionario' && (
                              <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                                Funcionário
                              </Badge>
                            )}
                            {item.tipo_conta === 'fornecedor' && (
                              <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700">
                                Fornecedor
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{item.descricao}</p>
                          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-muted-foreground">
                            <span>Vencimento: {formatarData(item.data_vencimento)}</span>
                            {item.categoria && (
                              <Badge variant="outline" className="text-xs">{item.categoria}</Badge>
                            )}
                            {item.status === "vencido" && (
                              <span className="text-destructive font-medium">
                                {Math.abs(dias)} dias em atraso
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:flex-col sm:items-end sm:space-y-1">
                          <div className="flex items-center gap-2">
                            <p className={`text-sm sm:text-lg font-bold break-words ${
                              item.status === 'pago' ? 'text-success' : 'text-destructive'
                            }`}>
                              {formatarValor(Number(item.valor) || 0)}
                            </p>
                            {item.status === 'pago' && (
                              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-success flex-shrink-0" />
                            )}
                          </div>
                          {item.status === 'pendente' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => abrirModalPagamento(item, 'pagar')}
                              className="text-xs sm:text-sm"
                            >
                              <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                              <span className="hidden sm:inline">Pagar</span>
                              <span className="sm:hidden">Pagar</span>
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transacoes" className="space-y-4">
          <Card className="bg-gradient-card shadow-card">
            <CardContent>
              {/* Filtros de Transações */}
              <div className="space-y-4 mb-4">
                <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-end md:space-y-0 md:space-x-4">
                  <div className="flex space-x-2">
                    <Button 
                      variant={filtroTipoTransacao === 'todos' ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFiltroTipoTransacao('todos')}
                    >
                      Todos
                    </Button>
                    <Button 
                      variant={filtroTipoTransacao === 'entrada' ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFiltroTipoTransacao('entrada')}
                    >
                      Recebimentos
                    </Button>
                    <Button 
                      variant={filtroTipoTransacao === 'saida' ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFiltroTipoTransacao('saida')}
                    >
                      Pagamentos
                    </Button>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Data:</span>
                    <Input
                      type="date"
                      value={filtroDataInicioTrans}
                      onChange={(e) => setFiltroDataInicioTrans(e.target.value)}
                      className="w-40"
                    />
                  </div>
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={limparFiltrosTransacoes}
                    disabled={filtroTipoTransacao === 'todos' && !filtroDataInicioTrans}
                  >
                    Limpar
                  </Button>
                </div>
              </div>
              {errorTransacoes && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" /> 
                  <AlertDescription>
                    Erro ao carregar transações: {errorTransacoes}
                  </AlertDescription>
                </Alert>
              )}
              
              {loadingTransacoes ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                      <div className="flex items-center space-x-4">
                        <Skeleton className="h-10 w-10 rounded-lg" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-48" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                      </div>
                      <div className="text-right space-y-2">
                        <Skeleton className="h-6 w-20" />
                        <Skeleton className="h-6 w-16" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : transacoesFiltradas.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {(filtroTipoTransacao !== 'todos' || filtroDataInicioTrans)
                      ? 'Nenhuma transação encontrada com os filtros aplicados'
                      : 'Nenhuma transação encontrada'}
                  </p>
                  {(filtroTipoTransacao !== 'todos' || filtroDataInicioTrans) && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={limparFiltrosTransacoes}
                      className="mt-4"
                    >
                      Limpar Filtros
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {transacoesFiltradas.map((transacao) => {
                    const dataHora = new Date(transacao.data_atualizacao || transacao.data_criacao);
                    const data = dataHora.toLocaleDateString("pt-BR");
                    const hora = dataHora.toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' });
                    
                    return (
                      <div key={transacao.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 rounded-lg border bg-muted/30 space-y-3 sm:space-y-0">
                        <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                          <div className={`p-1.5 sm:p-2 rounded-lg flex-shrink-0 ${transacao.tipo === 'entrada' ? 'bg-success/10' : 'bg-destructive/10'}`}>
                            {transacao.tipo === 'entrada' ? (
                              <ArrowUpRight className="h-4 w-4 sm:h-5 sm:w-5 text-success" />
                            ) : (
                              <ArrowDownRight className="h-4 w-4 sm:h-5 sm:w-5 text-destructive" />
                            )}
                          </div>
                          <div className="space-y-1 min-w-0 flex-1">
                            <p className="font-semibold text-sm sm:text-base line-clamp-1">{transacao.descricao}</p>
                            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-muted-foreground">
                              <span>{data} às {hora}</span>
                              <span className="capitalize">{transacao.metodo_pagamento.replace('_', ' ')}</span>
                              {transacao.cliente_nome && <span className="truncate">Cliente: {transacao.cliente_nome}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:flex-col sm:items-end sm:space-y-1">
                          <p className={`text-sm sm:text-lg font-bold break-words ${transacao.tipo === 'entrada' ? 'text-success' : 'text-destructive'}`}>
                            {transacao.tipo === 'entrada' ? '+' : ''}{formatarValor(Number(transacao.valor) || 0)}
                          </p>
                          {obterBadgeStatus(transacao.status)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="relatorios" className="space-y-4">
          <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            <Card className="bg-gradient-card shadow-card">
              <CardContent className="p-4 sm:p-6 text-center">
                <FileText className="h-8 w-8 sm:h-12 sm:w-12 text-primary mx-auto mb-3 sm:mb-4" />
                <h3 className="font-semibold mb-2 text-sm sm:text-base">Fluxo de Caixa</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 line-clamp-2">
                  Relatório detalhado de entradas e saídas
                </p>
                <Button 
                  size="sm" 
                  className="bg-gradient-primary text-xs sm:text-sm w-full sm:w-auto"
                  onClick={() => navigate('/relatorios/financeiro')}
                >
                  Gerar Relatório
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card shadow-card">
              <CardContent className="p-4 sm:p-6 text-center">
                <TrendingUp className="h-8 w-8 sm:h-12 sm:w-12 text-success mx-auto mb-3 sm:mb-4" />
                <h3 className="font-semibold mb-2 text-sm sm:text-base">DRE Mensal</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 line-clamp-2">
                  Demonstrativo de resultados do exercício
                </p>
                <Button 
                  size="sm" 
                  className="bg-gradient-primary text-xs sm:text-sm w-full sm:w-auto"
                  onClick={() => navigate('/relatorios/financeiro?tipo=dre')}
                >
                  Gerar Relatório
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card shadow-card">
              <CardContent className="p-4 sm:p-6 text-center">
                <Building className="h-8 w-8 sm:h-12 sm:w-12 text-info mx-auto mb-3 sm:mb-4" />
                <h3 className="font-semibold mb-2 text-sm sm:text-base">Balanço</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 line-clamp-2">
                  Posição patrimonial da empresa  
                </p>
                <Button 
                  size="sm" 
                  className="bg-gradient-primary text-xs sm:text-sm w-full sm:w-auto"
                  onClick={() => navigate('/relatorios/financeiro?tipo=balanco')}
                >
                  Gerar Relatório
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal de Pagamento */}
      <Dialog open={modalPagamento} onOpenChange={setModalPagamento}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full max-w-[95vw] sm:max-w-2xl">
          <DialogHeader className="pb-2">
            <DialogTitle className="flex items-center gap-2 text-sm sm:text-lg">
              <CreditCard className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="truncate">Realizar Pagamento</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Informações da conta */}
            <div className="p-4 bg-muted/30 rounded-lg">
              <h4 className="font-semibold mb-2 text-base">Conta a Pagar</h4>
              <p className="text-sm text-muted-foreground">
                {contaSelecionada?.fornecedor || 'Fornecedor não informado'}
              </p>
              <p className="text-sm text-muted-foreground">
                {contaSelecionada?.descricao}
              </p>
              <p className="text-lg font-bold text-destructive">
                {formatarValor(dadosPagamento.valor)}
              </p>
            </div>

            {/* Método de pagamento e Data */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Método de Pagamento</Label>
                <Select 
                  value={dadosPagamento.metodoPagamento} 
                  onValueChange={(value: any) => setDadosPagamento({...dadosPagamento, metodoPagamento: value})}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Selecione o método de pagamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {metodosPagamentoFixos.map((metodo) => (
                      <SelectItem key={metodo.id} value={metodo.tipo}>
                        <div className="flex items-center gap-2">
                          {obterIconeMetodoPagamento(metodo.tipo)}
                          <span>{metodo.nome}</span>
                          {metodo.taxa > 0 && (
                            <span className="text-xs text-muted-foreground">
                              ({metodo.taxa}% taxa)
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Data do Pagamento</Label>
                <Input
                  type="date"
                  className="h-10"
                  value={dadosPagamento.dataPagamento}
                  onChange={(e) => setDadosPagamento({...dadosPagamento, dataPagamento: e.target.value})}
                />
              </div>
            </div>


            {/* Seleção de parcelas (para cartão de crédito) */}
            {dadosPagamento.metodoPagamento === 'cartao_credito' && (() => {
              const parcelasDisponiveis = obterParcelasFixasDisponiveis(dadosPagamento.metodoPagamento);
              return parcelasDisponiveis.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm">Parcelas</Label>
                  <Select 
                    value={dadosPagamento.parcelas?.toString() || '1'} 
                    onValueChange={(value) => {
                      const parcelas = parseInt(value);
                      const metodo = obterMetodoFixoSelecionado(dadosPagamento.metodoPagamento);
                      const parcelaSelecionada = metodo?.parcelas.find(p => p.quantidade === parcelas);
                      
                      setDadosPagamento({
                        ...dadosPagamento, 
                        parcelas,
                        taxaParcela: parcelaSelecionada?.taxa || 0
                      });
                    }}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Selecione o número de parcelas" />
                    </SelectTrigger>
                    <SelectContent>
                      {parcelasDisponiveis.map((parcela) => {
                        const valorParcela = calcularValorParcela(dadosPagamento.valor, parcela.quantidade, parcela.taxa);
                        const valorTotal = valorParcela * parcela.quantidade;
                        return (
                          <SelectItem key={parcela.id} value={parcela.quantidade.toString()}>
                            <div className="flex items-center justify-between w-full">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{parcela.quantidade}x</span>
                              </div>
                              <div className="flex items-center gap-3 text-sm">
                                <span className="font-medium">
                                  {formatarValor(valorParcela)}/mês
                                </span>
                                <span className="text-muted-foreground">
                                  Total: {formatarValor(valorTotal)}
                                </span>
                              </div>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              );
            })()}


            {/* Número do documento (para transferência/boleto) */}
            {(dadosPagamento.metodoPagamento === 'transferencia' || dadosPagamento.metodoPagamento === 'boleto') && (
              <div className="space-y-2">
                <Label className="text-sm">Número do Documento</Label>
                <Input
                  className="h-10"
                  placeholder="Ex: 123456789"
                  value={dadosPagamento.numeroDocumento}
                  onChange={(e) => setDadosPagamento({...dadosPagamento, numeroDocumento: e.target.value})}
                />
              </div>
            )}

            {/* Dados bancários (para transferência) */}
            {dadosPagamento.metodoPagamento === 'transferencia' && (
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm">Banco</Label>
                  <Input
                    className="h-10"
                    placeholder="Ex: 001"
                    value={dadosPagamento.bancoOrigem}
                    onChange={(e) => setDadosPagamento({...dadosPagamento, bancoOrigem: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Agência</Label>
                  <Input
                    className="h-10"
                    placeholder="Ex: 1234"
                    value={dadosPagamento.agenciaOrigem}
                    onChange={(e) => setDadosPagamento({...dadosPagamento, agenciaOrigem: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Conta</Label>
                  <Input
                    className="h-10"
                    placeholder="Ex: 12345-6"
                    value={dadosPagamento.contaOrigem}
                    onChange={(e) => setDadosPagamento({...dadosPagamento, contaOrigem: e.target.value})}
                  />
                </div>
              </div>
            )}

            {/* Upload de comprovante e Observações */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Comprovante (Opcional)</Label>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Clique para fazer upload
                  </p>
                  <Input
                    type="file"
                    accept="image/*,.pdf"
                    className="mt-2 h-9"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setDadosPagamento({...dadosPagamento, comprovante: file});
                      }
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Observações (Opcional)</Label>
                <Textarea
                  className="min-h-[120px] text-sm"
                  placeholder="Adicione observações sobre o pagamento..."
                  value={dadosPagamento.observacoes}
                  onChange={(e) => setDadosPagamento({...dadosPagamento, observacoes: e.target.value})}
                />
              </div>
            </div>

            {/* Botões */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setModalPagamento(false)}
                className="flex-1 h-10 text-xs sm:text-sm"
              >
                Cancelar
              </Button>
              <Button 
                onClick={processarPagamento}
                className="flex-1 h-10 bg-gradient-primary text-xs sm:text-sm"
              >
                <Check className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Confirmar Pagamento</span>
                <span className="sm:hidden">Confirmar</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Recebimento */}
      <Dialog open={modalRecebimento} onOpenChange={setModalRecebimento}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full max-w-[95vw] sm:max-w-2xl">
          <DialogHeader className="pb-2">
            <DialogTitle className="flex items-center gap-2 text-sm sm:text-lg">
              <Receipt className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="truncate">Receber Pagamento</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Informações da conta */}
            <div className="p-4 bg-muted/30 rounded-lg">
              <h4 className="font-semibold mb-2 text-base">Conta a Receber</h4>
              <p className="text-sm text-muted-foreground">
                {contaSelecionada?.cliente_nome || 'Cliente não informado'}
              </p>
              <p className="text-sm text-muted-foreground">
                {contaSelecionada?.descricao}
              </p>
              <div className="space-y-3">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    Valor original: {formatarValor(valorOriginalRecebimento)}
                  </p>
                  {(dadosRecebimento.metodoPagamento === 'cartao_credito' || dadosRecebimento.metodoPagamento === 'cartao_debito') && (
                    <p className="text-sm font-medium text-blue-600">
                      Total a cobrar: {formatarValor(calcularValorTotalCobrar())}
                    </p>
                  )}
                  {valorEditadoRecebimento !== valorOriginalRecebimento && (
                    <p className="text-sm text-orange-600 font-medium">
                      Valor restante: {formatarValor(valorOriginalRecebimento - valorEditadoRecebimento)}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Valor a receber:</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditandoValorRecebimento(!editandoValorRecebimento)}
                    >
                      {editandoValorRecebimento ? 'Cancelar' : 'Editar'}
                    </Button>
                  </div>
                  
                  {editandoValorRecebimento ? (
                    <div className="space-y-2">
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Digite o valor a receber"
                        value={valorEditadoRecebimento}
                        onChange={(e) => setValorEditadoRecebimento(parseFloat(e.target.value) || 0)}
                        className="h-10"
                      />
                      
                      {/* Mostrar valor restante */}
                      {(() => {
                        const valorCalculado = dadosRecebimento.metodoPagamento === 'cartao_debito' 
                          ? calcularValorComTaxa(valorOriginalRecebimento, dadosRecebimento.taxaParcela || 0)
                          : calcularValorParcela(valorOriginalRecebimento, dadosRecebimento.parcelas || 1, dadosRecebimento.taxaParcela || 0) * (dadosRecebimento.parcelas || 1);
                        
                        const valorRestante = valorCalculado - valorEditadoRecebimento;
                        
                        return (
                          <div className="p-3 bg-muted/50 rounded-lg space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>Valor calculado:</span>
                              <span className="font-medium">{formatarValor(valorCalculado)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Valor a receber:</span>
                              <span className="font-medium text-success">{formatarValor(valorEditadoRecebimento)}</span>
                            </div>
                          </div>
                        );
                      })()}
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            // Não alterar dadosRecebimento.valor, apenas sair do modo de edição
                            setEditandoValorRecebimento(false);
                          }}
                        >
                          Confirmar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const valorCalculado = dadosRecebimento.metodoPagamento === 'cartao_debito' 
                              ? calcularValorComTaxa(valorOriginalRecebimento, dadosRecebimento.taxaParcela || 0)
                              : calcularValorParcela(valorOriginalRecebimento, dadosRecebimento.parcelas || 1, dadosRecebimento.taxaParcela || 0) * (dadosRecebimento.parcelas || 1);
                            setValorEditadoRecebimento(valorCalculado);
                            setEditandoValorRecebimento(false);
                          }}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-lg font-bold text-success">
                      {formatarValor(valorEditadoRecebimento)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Método de recebimento e Data */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Método de Recebimento</Label>
                <Select 
                  value={dadosRecebimento.metodoPagamento} 
                  onValueChange={(value: any) => setDadosRecebimento({...dadosRecebimento, metodoPagamento: value})}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Selecione o método de pagamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {metodosPagamento.map((metodo) => (
                      <SelectItem key={metodo.id} value={metodo.tipo}>
                        <div className="flex items-center gap-2">
                          {obterIconeMetodoPagamento(metodo.tipo)}
                          <span>{metodo.nome}</span>
                          {metodo.taxa > 0 && (
                            <span className="text-xs text-muted-foreground">
                              ({metodo.taxa}% taxa)
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Data do Recebimento</Label>
                <Input
                  type="date"
                  className="h-10"
                  value={dadosRecebimento.dataRecebimento}
                  onChange={(e) => setDadosRecebimento({...dadosRecebimento, dataRecebimento: e.target.value})}
                />
              </div>
            </div>


            {/* Seleção de parcelas (para cartão de crédito) */}
            {dadosRecebimento.metodoPagamento === 'cartao_credito' && (() => {
              const parcelasDisponiveis = obterParcelasDisponiveis(dadosRecebimento.metodoPagamento);
              return parcelasDisponiveis.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm">Parcelas</Label>
                  <Select 
                    value={dadosRecebimento.parcelas?.toString() || '1'} 
                    onValueChange={(value) => {
                      const parcelas = parseInt(value);
                      const metodo = obterMetodoSelecionado(dadosRecebimento.metodoPagamento);
                      const parcelaSelecionada = metodo?.parcelas.find(p => p.quantidade === parcelas);
                      
                      setDadosRecebimento({
                        ...dadosRecebimento, 
                        parcelas,
                        taxaParcela: parcelaSelecionada?.taxa || 0
                      });
                    }}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Selecione o número de parcelas" />
                    </SelectTrigger>
                    <SelectContent>
                      {parcelasDisponiveis.map((parcela) => {
                        const valorParcela = calcularValorParcela(dadosRecebimento.valor, parcela.quantidade, parcela.taxa);
                        const valorTotal = valorParcela * parcela.quantidade;
                        return (
                          <SelectItem key={parcela.id} value={parcela.quantidade.toString()}>
                            <div className="flex items-center justify-between w-full">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{parcela.quantidade}x</span>
                              </div>
                              <div className="flex items-center gap-3 text-sm">
                                <span className="font-medium">
                                  {formatarValor(valorParcela)}/mês
                                </span>
                                <span className="text-muted-foreground">
                                  Total: {formatarValor(valorTotal)}
                                </span>
                              </div>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              );
            })()}


            {/* Desconto e Juros */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Desconto (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  className="h-10"
                  placeholder="0,00"
                  value={dadosRecebimento.desconto}
                  onChange={(e) => setDadosRecebimento({...dadosRecebimento, desconto: parseFloat(e.target.value) || 0})}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Juros (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  className="h-10"
                  placeholder="0,00"
                  value={dadosRecebimento.juros}
                  onChange={(e) => setDadosRecebimento({...dadosRecebimento, juros: parseFloat(e.target.value) || 0})}
                />
              </div>
            </div>

            {/* Upload de comprovante e Observações */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Comprovante (Opcional)</Label>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Clique para fazer upload
                  </p>
                  <Input
                    type="file"
                    accept="image/*,.pdf"
                    className="mt-2 h-9"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setDadosRecebimento({...dadosRecebimento, comprovante: file});
                      }
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Observações (Opcional)</Label>
                <Textarea
                  className="min-h-[120px] text-sm"
                  placeholder="Adicione observações sobre o recebimento..."
                  value={dadosRecebimento.observacoes}
                  onChange={(e) => setDadosRecebimento({...dadosRecebimento, observacoes: e.target.value})}
                />
              </div>
            </div>

            {/* Botões */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setModalRecebimento(false)}
                className="flex-1 h-10 text-xs sm:text-sm"
              >
                Cancelar
              </Button>
              <Button 
                onClick={processarRecebimento}
                className="flex-1 h-10 bg-gradient-primary text-xs sm:text-sm"
              >
                <Check className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Confirmar Recebimento</span>
                <span className="sm:hidden">Confirmar</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}