import { useState, useCallback } from 'react';
import { useApi } from './useApi';

// Interface para itens da NF-e
export interface NfeItem {
  id?: number;
  nfe_id?: number;
  produto_id: number;
  produto_nome?: string;
  codigo_barras?: string;
  sku?: string;
  quantidade: number;
  preco_unitario: number;
  preco_total: number;
}

// Interface para NF-e
export interface Nfe {
  id: number;
  numero: string;
  serie: string;
  chave_acesso?: string;
  cliente_id?: number;
  cliente_nome?: string;
  cliente_cnpj_cpf?: string;
  cnpj_cpf?: string;
  venda_id?: number;
  data_emissao: string;
  valor_total: number;
  status: 'pendente' | 'autorizada' | 'cancelada' | 'erro';
  ambiente: 'homologacao' | 'producao';
  xml_path?: string;
  pdf_path?: string;
  observacoes?: string;
  itens?: NfeItem[];
  data_criacao: string;
  data_atualizacao: string;
}

// Interface para estatísticas de NF-e
export interface NfeStats {
  total_nfe: number;
  nfe_autorizadas: number;
  nfe_pendentes: number;
  nfe_canceladas: number;
  nfe_erro: number;
  valor_total_autorizado: number;
}

// Interface para filtros de NF-e
export interface NfeFilters {
  page?: number;
  limit?: number;
  q?: string;
  status?: string;
  data_inicio?: string;
  data_fim?: string;
}

// Interface para resposta de listagem
export interface NfeResponse {
  nfes: Nfe[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Interface para criação de NF-e
export interface NfeCreate {
  venda_id?: number;
  cliente_id?: number;
  cnpj_cpf?: string;
  itens: {
    produto_id: number;
    quantidade: number;
    preco_unitario: number;
  }[];
  observacoes?: string;
}

export function useNfe() {
  const { makeRequest } = useApi();
  const [nfes, setNfes] = useState<Nfe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<NfeStats | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });

  // Buscar lista de NF-e
  const fetchNfes = useCallback(async (filters: NfeFilters = {}) => {
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

      const response = await makeRequest(`/nfe?${params.toString()}`) as NfeResponse;
      
      setNfes(response.nfes);
      setPagination(response.pagination);
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar NF-e');
      console.error('Erro ao buscar NF-e:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [makeRequest]);

  // Buscar NF-e por ID
  const fetchNfe = useCallback(async (id: number): Promise<Nfe | null> => {
    try {
      setLoading(true);
      setError(null);

      const response = await makeRequest(`/nfe/${id}`) as { nfe: Nfe };
      return response.nfe;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar NF-e');
      console.error('Erro ao buscar NF-e:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [makeRequest]);

  // Criar nova NF-e
  const createNfe = useCallback(async (dados: NfeCreate): Promise<Nfe> => {
    try {
      setLoading(true);
      setError(null);

      const response = await makeRequest('/nfe', {
        method: 'POST',
        body: dados
      }) as { nfe: Nfe; message: string };

      // Atualizar lista
      await fetchNfes({ page: pagination.page, limit: pagination.limit });

      return response.nfe;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar NF-e');
      console.error('Erro ao criar NF-e:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [makeRequest, fetchNfes, pagination.page, pagination.limit]);

  // Atualizar status da NF-e
  const updateNfeStatus = useCallback(async (id: number, status: Nfe['status'], chave_acesso?: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      await makeRequest(`/nfe/${id}/status`, {
        method: 'PATCH',
        body: { status, chave_acesso }
      });

      // Atualizar lista
      await fetchNfes({ page: pagination.page, limit: pagination.limit });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar status da NF-e');
      console.error('Erro ao atualizar status da NF-e:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [makeRequest, fetchNfes, pagination.page, pagination.limit]);

  // Deletar NF-e
  const deleteNfe = useCallback(async (id: number): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      await makeRequest(`/nfe/${id}`, {
        method: 'DELETE'
      });

      // Atualizar lista
      await fetchNfes({ page: pagination.page, limit: pagination.limit });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar NF-e');
      console.error('Erro ao deletar NF-e:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [makeRequest, fetchNfes, pagination.page, pagination.limit]);

  // Buscar estatísticas
  const fetchStats = useCallback(async (periodo: 'hoje' | 'semana' | 'mes' | 'ano' = 'mes'): Promise<NfeStats | null> => {
    try {
      setLoading(true);
      setError(null);

      const response = await makeRequest(`/nfe/stats/overview?periodo=${periodo}`) as { stats: NfeStats; periodo: string };
      setStats(response.stats);
      return response.stats;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar estatísticas');
      console.error('Erro ao buscar estatísticas:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [makeRequest]);

  // Formatar valor monetário
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Formatar data
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  // Formatar data e hora
  const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR');
  };

  // Obter label do status
  const getStatusLabel = (status: Nfe['status']): string => {
    const labels: Record<Nfe['status'], string> = {
      pendente: 'Pendente',
      autorizada: 'Autorizada',
      cancelada: 'Cancelada',
      erro: 'Erro'
    };
    return labels[status] || 'Desconhecido';
  };

  // Obter cor do badge de status
  const getStatusBadgeClass = (status: Nfe['status']): string => {
    const classes: Record<Nfe['status'], string> = {
      autorizada: 'bg-success hover:bg-success/90',
      pendente: 'bg-warning/80 text-warning-foreground',
      cancelada: 'bg-secondary',
      erro: 'bg-destructive'
    };
    return classes[status] || 'bg-secondary';
  };

  // Obter cor do ícone de status
  const getStatusIconClass = (status: Nfe['status']): string => {
    const classes: Record<Nfe['status'], string> = {
      autorizada: 'text-success',
      pendente: 'text-warning',
      cancelada: 'text-muted-foreground',
      erro: 'text-destructive'
    };
    return classes[status] || 'text-muted-foreground';
  };

  // Transmitir NF-e (simulado - gera chave de acesso)
  const transmitirNfe = useCallback(async (id: number): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      // Gerar chave de acesso simulada
      const timestamp = Date.now().toString();
      const chaveAcesso = `35${timestamp}${'0'.repeat(44 - timestamp.length - 2)}`;

      await updateNfeStatus(id, 'autorizada', chaveAcesso);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao transmitir NF-e');
      console.error('Erro ao transmitir NF-e:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [updateNfeStatus]);

  // Cancelar NF-e
  const cancelarNfe = useCallback(async (id: number): Promise<void> => {
    try {
      await updateNfeStatus(id, 'cancelada');
    } catch (err) {
      throw err;
    }
  }, [updateNfeStatus]);

  return {
    nfes,
    loading,
    error,
    stats,
    pagination,
    fetchNfes,
    fetchNfe,
    createNfe,
    updateNfeStatus,
    deleteNfe,
    fetchStats,
    transmitirNfe,
    cancelarNfe,
    formatCurrency,
    formatDate,
    formatDateTime,
    getStatusLabel,
    getStatusBadgeClass,
    getStatusIconClass
  };
}

