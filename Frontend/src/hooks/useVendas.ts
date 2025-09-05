import { useState, useEffect } from 'react';
import { useApi } from './useApi';

// Interfaces para tipos de venda
export interface ItemVenda {
  produto_id: number;
  quantidade: number;
  preco_unitario: number;
  preco_total: number;
  desconto: number;
}

export interface MetodoPagamento {
  metodo: string;
  valor: string;
  troco?: number;
}

export interface PagamentoPrazo {
  dias: string;
  juros: string;
  valorComJuros: number;
  dataVencimento: Date;
}

export interface Venda {
  id: number;
  numero_venda: string;
  data_venda: string;
  status: 'pendente' | 'pago' | 'cancelado' | 'devolvido';
  subtotal: number;
  desconto: number;
  total: number;
  forma_pagamento: 'dinheiro' | 'cartao_credito' | 'cartao_debito' | 'pix' | 'transferencia' | 'boleto' | 'cheque';
  parcelas: number;
  observacoes?: string;
  cliente_id?: number;
  cliente_nome?: string;
  cliente_email?: string;
  vendedor_nome?: string;
  itens?: VendaItem[];
}

export interface VendaItem {
  id: number;
  produto_id: number;
  produto_nome: string;
  codigo_barras?: string;
  sku?: string;
  quantidade: number;
  preco_unitario: number;
  preco_total: number;
  desconto: number;
}

export interface VendasStats {
  total_vendas: number;
  vendas_pagas: number;
  vendas_pendentes: number;
  receita_total: number;
  ticket_medio: number;
}

export interface VendasFilters {
  page?: number;
  limit?: number;
  q?: string;
  status?: string;
  data_inicio?: string;
  data_fim?: string;
}

export interface VendasResponse {
  vendas: Venda[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export const useVendas = () => {
  const { makeRequest } = useApi();
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });

  // Buscar vendas
  const fetchVendas = async (filters: VendasFilters = {}) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.q) params.append('q', filters.q);
      if (filters.status) params.append('status', filters.status);
      if (filters.data_inicio) params.append('data_inicio', filters.data_inicio);
      if (filters.data_fim) params.append('data_fim', filters.data_fim);

      const response = await makeRequest(`/vendas?${params.toString()}`) as VendasResponse;
      
      setVendas(response.vendas);
      setPagination(response.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar vendas');
      console.error('Erro ao buscar vendas:', err);
    } finally {
      setLoading(false);
    }
  };

  // Buscar venda por ID
  const fetchVenda = async (id: number): Promise<Venda | null> => {
    try {
      setLoading(true);
      setError(null);

      const response = await makeRequest(`/vendas/${id}`) as { venda: Venda };
      return response.venda;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar venda');
      console.error('Erro ao buscar venda:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Criar nova venda
  const createVenda = async (vendaData: Partial<Venda> & { itens: Omit<VendaItem, 'id'>[] }) => {
    try {
      setLoading(true);
      setError(null);

      const response = await makeRequest('/vendas', {
        method: 'POST',
        body: vendaData
      }) as { venda: Venda; message: string };

      // Atualizar lista de vendas
      await fetchVendas({ page: pagination.page, limit: pagination.limit });
      
      return response.venda;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar venda');
      console.error('Erro ao criar venda:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Atualizar status da venda
  const updateVendaStatus = async (id: number, status: Venda['status']) => {
    try {
      setLoading(true);
      setError(null);

      await makeRequest(`/vendas/${id}/status`, {
        method: 'PATCH',
        body: { status }
      });

      // Atualizar lista de vendas
      await fetchVendas({ page: pagination.page, limit: pagination.limit });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar status da venda');
      console.error('Erro ao atualizar status da venda:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Deletar venda
  const deleteVenda = async (id: number) => {
    try {
      setLoading(true);
      setError(null);

      await makeRequest(`/vendas/${id}`, {
        method: 'DELETE'
      });

      // Atualizar lista de vendas
      await fetchVendas({ page: pagination.page, limit: pagination.limit });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar venda');
      console.error('Erro ao deletar venda:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Buscar estatísticas das vendas
  const fetchVendasStats = async (periodo: 'hoje' | 'semana' | 'mes' | 'ano' = 'hoje'): Promise<VendasStats | null> => {
    try {
      setLoading(true);
      setError(null);

      const response = await makeRequest(`/vendas/stats/overview?periodo=${periodo}`) as { stats: VendasStats; periodo: string };
      return response.stats;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar estatísticas');
      console.error('Erro ao buscar estatísticas:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Formatar valor monetário
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Formatar data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  // Formatar data e hora
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR');
  };

  // Obter badge de status
  const getStatusBadge = (status: Venda['status']) => {
    switch (status) {
      case 'pago':
        return { text: 'Pago', className: 'bg-green-100 text-green-800' };
      case 'pendente':
        return { text: 'Pendente', className: 'bg-yellow-100 text-yellow-800' };
      case 'cancelado':
        return { text: 'Cancelado', className: 'bg-red-100 text-red-800' };
      case 'devolvido':
        return { text: 'Devolvido', className: 'bg-gray-100 text-gray-800' };
      default:
        return { text: 'Desconhecido', className: 'bg-gray-100 text-gray-800' };
    }
  };

  // Obter ícone de forma de pagamento
  const getPaymentIcon = (forma_pagamento: Venda['forma_pagamento']) => {
    switch (forma_pagamento) {
      case 'pix':
        return '📱';
      case 'cartao_credito':
      case 'cartao_debito':
        return '💳';
      case 'dinheiro':
        return '💵';
      case 'transferencia':
        return '🏦';
      case 'boleto':
        return '📄';
      case 'cheque':
        return '📝';
      default:
        return '💰';
    }
  };

  // Obter texto da forma de pagamento
  const getPaymentText = (forma_pagamento: Venda['forma_pagamento']) => {
    switch (forma_pagamento) {
      case 'pix':
        return 'PIX';
      case 'cartao_credito':
        return 'Cartão de Crédito';
      case 'cartao_debito':
        return 'Cartão de Débito';
      case 'dinheiro':
        return 'Dinheiro';
      case 'transferencia':
        return 'Transferência';
      case 'boleto':
        return 'Boleto';
      case 'cheque':
        return 'Cheque';
      default:
        return 'Outro';
    }
  };

  return {
    vendas,
    loading,
    error,
    pagination,
    fetchVendas,
    fetchVenda,
    createVenda,
    updateVendaStatus,
    deleteVenda,
    fetchVendasStats,
    formatCurrency,
    formatDate,
    formatDateTime,
    getStatusBadge,
    getPaymentIcon,
    getPaymentText
  };
};

// Hook específico para criar vendas
export const useCriarVenda = () => {
  const { makeRequest } = useApi();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const criar = async (dadosVenda: {
    cliente_id?: number | null;
    itens: ItemVenda[];
    metodos_pagamento?: MetodoPagamento[];
    pagamento_prazo?: PagamentoPrazo;
    subtotal: number;
    desconto: number;
    total: number;
    forma_pagamento: string;
    parcelas: number;
    observacoes?: string;
    status?: 'pendente' | 'pago' | 'cancelado' | 'devolvido';
  }) => {
    try {
      setLoading(true);
      setError(null);

      const response = await makeRequest('/vendas', {
        method: 'POST',
        body: dadosVenda
      }) as { venda: Venda; message: string };

      return response.venda;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar venda';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    criar,
    loading,
    error
  };
};