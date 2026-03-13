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
    total_vendas_pagas: number;
    fluxo_caixa: number;
    saldo_atual: number;
    contas_receber: {
      total_contas: number;
      valor_pendente: number;
      valor_vencido: number;
      valor_pago: number;
    };
    contas_pagar: {
      total_contas: number;
      valor_pendente: number;
      valor_vencido: number;
      valor_pago: number;
    };
  };
  periodo: string;
}

export function useFinanceiroStats() {
  const api = useCrudApi<FinanceiroStats>(API_ENDPOINTS.FINANCIAL.STATS);
  const [stats, setStats] = useState<FinanceiroStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buscarStats = useCallback(async (periodoOrRange: 'hoje' | 'semana' | 'mes' | 'ano' | string | { data_inicio: string; data_fim: string } = 'mes') => {
    try {
      setLoading(true);
      setError(null);
      const params =
        typeof periodoOrRange === 'object' && periodoOrRange?.data_inicio && periodoOrRange?.data_fim
          ? { data_inicio: periodoOrRange.data_inicio, data_fim: periodoOrRange.data_fim }
          : { periodo: periodoOrRange as string };
      const response = await api.list(params);
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
