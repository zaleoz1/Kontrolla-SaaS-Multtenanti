import { useState, useEffect, useCallback, useRef } from 'react';
import { useApi } from './useApi';
import { API_ENDPOINTS } from '@/config/api';

export interface DashboardMetricas {
  vendas: {
    total_vendas: number;
    receita_total: number;
    ticket_medio: number;
  };
  clientes: {
    total_clientes: number;
    clientes_ativos: number;
    clientes_vip: number;
  };
  produtos: {
    total_produtos: number;
    produtos_ativos: number;
    estoque_baixo: number;
    sem_estoque: number;
  };
  comparacao?: {
    vendas: {
      atual: number;
      anterior: number;
      variacao: number;
    };
    receita: {
      atual: number;
      anterior: number;
      variacao: number;
    };
  };
}

export interface MetodoPagamento {
  metodo: string;
  valor: number;
  troco?: number;
  parcelas?: number;
  taxaParcela?: number;
}

export interface PagamentoPrazo {
  dias: number;
  juros: number;
  valor_original: number;
  valor_com_juros: number;
  data_vencimento: string;
  status: 'pendente' | 'pago';
}

export interface VendaRecente {
  id: number;
  numero_venda: string;
  data_venda: string;
  total: number;
  status: 'pendente' | 'pago' | 'cancelado' | 'devolvido';
  forma_pagamento: string;
  cliente_nome?: string;
  vendedor_nome?: string;
  metodos_pagamento?: MetodoPagamento[];
  pagamento_prazo?: PagamentoPrazo;
}

export interface ProdutoEstoqueBaixo {
  id: number;
  nome: string;
  estoque: number;
  estoque_minimo: number;
  preco: number;
  tipo_preco: 'unidade' | 'kg' | 'litros';
  estoque_kg?: number;
  estoque_litros?: number;
  estoque_minimo_kg?: number;
  estoque_minimo_litros?: number;
  estoque_atual: number;
  estoque_minimo_atual: number;
  categoria_nome?: string;
}

export interface GraficoVendas {
  periodo: string;
  total_vendas: number;
  receita_total: number;
}

export interface TopProduto {
  id: number;
  nome: string;
  preco: number;
  categoria_nome?: string;
  total_vendido: number;
  total_vendas: number;
  receita_total: number;
}

export interface ResumoFinanceiro {
  transacoes: {
    total_transacoes: number;
    entradas: number;
    saidas: number;
  };
  contas_receber: {
    total_contas: number;
    valor_pendente: number;
    valor_vencido: number;
  };
  contas_pagar: {
    total_contas: number;
    valor_pendente: number;
    valor_vencido: number;
  };
  saldo: number;
}

export interface DashboardData {
  metricas: DashboardMetricas;
  vendas_recentes: VendaRecente[];
  estoque_baixo: ProdutoEstoqueBaixo[];
  grafico_vendas: GraficoVendas[];
  top_produtos: TopProduto[];
  resumo_financeiro: ResumoFinanceiro;
  periodo: string;
}

export function useDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { makeRequest } = useApi();
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchDashboardData = useCallback(async (periodo: 'hoje' | 'semana' | 'mes' | 'ano' = 'hoje') => {
    try {
      setLoading(true);
      setError(null);

      // Buscar todas as métricas em paralelo
      const [
        metricasResponse,
        vendasRecentesResponse,
        estoqueBaixoResponse,
        graficoVendasResponse,
        topProdutosResponse,
        resumoFinanceiroResponse
      ] = await Promise.all([
        makeRequest(`${API_ENDPOINTS.DASHBOARD.METRICS}?periodo=${periodo}`),
        makeRequest(`${API_ENDPOINTS.DASHBOARD.RECENT_SALES}?limit=5`),
        makeRequest(`${API_ENDPOINTS.DASHBOARD.LOW_STOCK}?limit=10`),
        makeRequest(`${API_ENDPOINTS.DASHBOARD.SALES_CHART}?tipo=diario&dias=30`),
        makeRequest(`${API_ENDPOINTS.DASHBOARD.TOP_PRODUCTS}?limit=10&periodo=30`),
        makeRequest(`${API_ENDPOINTS.DASHBOARD.FINANCIAL_SUMMARY}?periodo=30`)
      ]);

      const dashboardData: DashboardData = {
        metricas: metricasResponse.metricas,
        vendas_recentes: vendasRecentesResponse.vendas,
        estoque_baixo: estoqueBaixoResponse.produtos,
        grafico_vendas: graficoVendasResponse.vendas,
        top_produtos: topProdutosResponse.produtos,
        resumo_financeiro: resumoFinanceiroResponse.resumo,
        periodo: metricasResponse.periodo
      };

      setData(dashboardData);
    } catch (err: any) {
      console.error('Erro ao buscar dados do dashboard:', err);
      setError(err.message || 'Erro ao carregar dados do dashboard');
    } finally {
      setLoading(false);
    }
  }, [makeRequest]);

  const refreshData = useCallback((periodo: 'hoje' | 'semana' | 'mes' | 'ano' = 'hoje') => {
    // Cancelar timeout anterior se existir
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Debounce de 300ms para evitar muitas requisições
    debounceTimeoutRef.current = setTimeout(() => {
      fetchDashboardData(periodo);
    }, 300);
  }, [fetchDashboardData]);

  useEffect(() => {
    fetchDashboardData();
    
    // Cleanup do timeout ao desmontar o componente
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [fetchDashboardData]);

  // Funções utilitárias para formatação
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'pago': { variant: 'default', className: 'bg-success hover:bg-success/90' },
      'pendente': { variant: 'secondary', className: '' },
      'cancelado': { variant: 'destructive', className: '' },
      'devolvido': { variant: 'outline', className: '' }
    };
    return statusMap[status as keyof typeof statusMap] || { variant: 'secondary', className: '' };
  };

  const getPaymentIcon = (forma_pagamento: string) => {
    const iconMap = {
      'dinheiro': '💵',
      'cartao_credito': '💳',
      'cartao_debito': '💳',
      'pix': '/logopix.png',
      'transferencia': '🏦',
      'boleto': '📄',
      'cheque': '📝',
      'prazo': '📅'
    };
    return iconMap[forma_pagamento as keyof typeof iconMap] || '💰';
  };

  const getPaymentText = (forma_pagamento: string) => {
    const textMap = {
      'dinheiro': 'Dinheiro',
      'cartao_credito': 'Cartão de Crédito',
      'cartao_debito': 'Cartão de Débito',
      'pix': 'PIX',
      'transferencia': 'Transferência',
      'boleto': 'Boleto',
      'cheque': 'Cheque',
      'prazo': 'A Prazo',
      'multiplo_avista': 'Múltiplo'
    };
    return textMap[forma_pagamento as keyof typeof textMap] || forma_pagamento;
  };

  const calculateVariation = (atual: number, anterior: number) => {
    if (anterior === 0) {
      return atual > 0 ? 100 : 0; // Se não havia dados antes e agora há, 100% de crescimento
    }
    return ((atual - anterior) / anterior) * 100;
  };

  const getVariationColor = (variacao: number) => {
    if (variacao > 0) return 'text-green-600';
    if (variacao < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getVariationIcon = (variacao: number) => {
    return '';
  };

  const formatVariation = (variacao: number) => {
    if (variacao === 0) return '0%';
    const absVariacao = Math.abs(variacao);
    if (absVariacao < 0.1) return '<0.1%';
    return `${absVariacao.toFixed(1)}%`;
  };

  // Funções para formatação de estoque por tipo
  const obterUnidadeEstoque = (tipo_preco: string) => {
    switch (tipo_preco) {
      case 'kg':
        return 'kg';
      case 'litros':
        return 'L';
      case 'unidade':
      default:
        return 'un.';
    }
  };

  const formatarEstoque = (produto: ProdutoEstoqueBaixo) => {
    const unidade = obterUnidadeEstoque(produto.tipo_preco);
    
    if (produto.tipo_preco === 'unidade') {
      return `${Math.round(produto.estoque_atual)} ${unidade}`;
    } else {
      // Para kg e litros, manter casas decimais mas limitar a 3 casas
      return `${Number(produto.estoque_atual).toFixed(3).replace(/\.?0+$/, '')} ${unidade}`;
    }
  };

  const obterTipoEstoqueTexto = (tipo_preco: string) => {
    switch (tipo_preco) {
      case 'kg':
        return 'Peso';
      case 'litros':
        return 'Volume';
      case 'unidade':
      default:
        return 'Quantidade';
    }
  };

  // Função para separar vendas com pagamento múltiplo
  const separarVendasMultiplas = (vendas: VendaRecente[]) => {
    const vendasSeparadas: VendaRecente[] = [];
    
    vendas.forEach(venda => {
      // Verificar se a venda tem pagamento múltiplo (métodos de pagamento + pagamento a prazo)
      const temMetodosPagamento = venda.metodos_pagamento && venda.metodos_pagamento.length > 0;
      const temPagamentoPrazo = venda.pagamento_prazo && venda.pagamento_prazo.status;
      
      if (temMetodosPagamento && temPagamentoPrazo) {
        // Calcular total dos métodos de pagamento (à vista)
        const totalAVista = venda.metodos_pagamento!.reduce((sum: number, metodo: MetodoPagamento) => 
          sum + (metodo.valor - (metodo.troco || 0)), 0
        );
        
        // Criar venda à vista
        const vendaAVista: VendaRecente = {
          ...venda,
          id: parseInt(`${venda.id}1`), // Usar sufixo numérico para evitar conflitos
          numero_venda: `${venda.numero_venda}-AV`,
          status: 'pago',
          total: totalAVista,
          metodos_pagamento: venda.metodos_pagamento,
          pagamento_prazo: undefined,
          forma_pagamento: 'multiplo_avista'
        };
        
        // Criar venda a prazo
        const vendaPrazo: VendaRecente = {
          ...venda,
          id: parseInt(`${venda.id}2`), // Usar sufixo numérico diferente
          numero_venda: `${venda.numero_venda}-PZ`,
          status: 'pendente',
          total: venda.pagamento_prazo!.valor_com_juros,
          metodos_pagamento: [],
          forma_pagamento: 'prazo'
        };
        
        vendasSeparadas.push(vendaAVista, vendaPrazo);
      } else {
        // Venda normal, adicionar como está
        vendasSeparadas.push(venda);
      }
    });
    
    return vendasSeparadas;
  };

  // Processar vendas recentes para separar vendas múltiplas
  const processarVendasRecentes = (vendas: VendaRecente[]) => {
    return separarVendasMultiplas(vendas);
  };

  return {
    data: data ? {
      ...data,
      vendas_recentes: processarVendasRecentes(data.vendas_recentes)
    } : null,
    loading,
    error,
    refreshData,
    formatCurrency,
    formatDate,
    formatDateTime,
    getStatusBadge,
    getPaymentIcon,
    getPaymentText,
    calculateVariation,
    getVariationColor,
    getVariationIcon,
    formatVariation,
    obterUnidadeEstoque,
    formatarEstoque,
    obterTipoEstoqueTexto
  };
}
