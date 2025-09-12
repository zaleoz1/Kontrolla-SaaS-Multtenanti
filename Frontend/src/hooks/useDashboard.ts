import { useState, useEffect } from 'react';
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

export interface VendaRecente {
  id: number;
  numero_venda: string;
  data_venda: string;
  total: number;
  status: 'pendente' | 'pago' | 'cancelado' | 'devolvido';
  forma_pagamento: string;
  cliente_nome?: string;
  vendedor_nome?: string;
}

export interface ProdutoEstoqueBaixo {
  id: number;
  nome: string;
  estoque: number;
  estoque_minimo: number;
  preco: number;
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

  const fetchDashboardData = async (periodo: 'hoje' | 'semana' | 'mes' | 'ano' = 'hoje') => {
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
  };

  const refreshData = (periodo: 'hoje' | 'semana' | 'mes' | 'ano' = 'hoje') => {
    fetchDashboardData(periodo);
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

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
      'pix': '📱',
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
      'prazo': 'A Prazo'
    };
    return textMap[forma_pagamento as keyof typeof textMap] || forma_pagamento;
  };

  const calculateVariation = (atual: number, anterior: number) => {
    if (anterior === 0) return 0;
    return ((atual - anterior) / anterior) * 100;
  };

  const getVariationColor = (variacao: number) => {
    if (variacao > 0) return 'text-green-600';
    if (variacao < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getVariationIcon = (variacao: number) => {
    if (variacao > 0) return '↗️';
    if (variacao < 0) return '↘️';
    return '→';
  };

  return {
    data,
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
    getVariationIcon
  };
}
