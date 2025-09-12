import { useState, useCallback } from 'react';
import { useCrudApi } from './useApi';
import { API_ENDPOINTS } from '../config/api';

// Interfaces para estatísticas financeiras
export interface FinanceiroStats {
  stats: {
    total_transacoes: number;
    entradas: number;
    saidas: number;
    total_entradas: number;
    total_saidas: number;
    fluxo_caixa: number;
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
  };
  periodo: string;
}

export function useFinanceiroStats() {
  const api = useCrudApi<FinanceiroStats>(API_ENDPOINTS.FINANCIAL.STATS);
  const [stats, setStats] = useState<FinanceiroStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buscarStats = useCallback(async (periodo: 'hoje' | 'semana' | 'mes' | 'ano' = 'mes') => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.list({ periodo });
      setStats(response);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar estatísticas';
      setError(errorMessage);
      console.error('Erro ao buscar estatísticas financeiras:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [api.list]);

  return {
    stats,
    loading,
    error,
    buscarStats,
  };
}
