import { useState, useCallback } from 'react';
import { useCrudApi } from './useApi';
import { API_ENDPOINTS } from '../config/api';

// Interfaces para transações financeiras
export interface Transacao {
  id?: number;
  tipo: 'entrada' | 'saida';
  categoria: string;
  descricao: string;
  valor: number;
  data_transacao: string;
  metodo_pagamento: 'pix' | 'cartao_credito' | 'cartao_debito' | 'dinheiro' | 'transferencia' | 'boleto' | 'cheque';
  conta: string;
  fornecedor?: string;
  cliente_id?: number;
  observacoes?: string;
  anexos?: string[];
  status: 'pendente' | 'concluida' | 'cancelada';
  data_criacao?: string;
  data_atualizacao?: string;
  cliente_nome?: string;
}

export interface TransacoesResponse {
  transacoes: Transacao[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface TransacaoResponse {
  transacao: Transacao;
}

export interface TransacaoStats {
  total_transacoes: number;
  entradas: number;
  saidas: number;
  saldo: number;
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
}

export function useTransacoes() {
  const api = useCrudApi<TransacoesResponse>(API_ENDPOINTS.FINANCIAL.TRANSACTIONS);
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });

  const buscarTransacoes = useCallback(async (params?: {
    page?: number;
    limit?: number;
    q?: string;
    tipo?: string;
    status?: string;
    data_inicio?: string;
    data_fim?: string;
  }) => {
    try {
      const response = await api.list(params);
      setTransacoes(response.transacoes);
      setPagination(response.pagination);
      return response;
    } catch (error) {
      console.error('Erro ao buscar transações:', error);
      throw error;
    }
  }, [api]);

  const buscarTransacao = useCallback(async (id: number) => {
    try {
      const response = await api.get(id) as unknown as TransacaoResponse;
      return response.transacao;
    } catch (error) {
      console.error('Erro ao buscar transação:', error);
      throw error;
    }
  }, [api]);

  const criarTransacao = useCallback(async (dados: Partial<Transacao>) => {
    try {
      const response = await api.create(dados) as unknown as TransacaoResponse;
      // Atualizar lista local
      await buscarTransacoes();
      return response.transacao;
    } catch (error) {
      console.error('Erro ao criar transação:', error);
      throw error;
    }
  }, [api, buscarTransacoes]);

  const atualizarTransacao = useCallback(async (id: number, dados: Partial<Transacao>) => {
    try {
      const response = await api.update(id, dados) as unknown as TransacaoResponse;
      // Atualizar lista local
      await buscarTransacoes();
      return response.transacao;
    } catch (error) {
      console.error('Erro ao atualizar transação:', error);
      throw error;
    }
  }, [api, buscarTransacoes]);

  const deletarTransacao = useCallback(async (id: number) => {
    try {
      await api.remove(id);
      // Atualizar lista local
      await buscarTransacoes();
    } catch (error) {
      console.error('Erro ao deletar transação:', error);
      throw error;
    }
  }, [api, buscarTransacoes]);

  return {
    ...api,
    transacoes,
    pagination,
    buscarTransacoes,
    buscarTransacao,
    criarTransacao,
    atualizarTransacao,
    deletarTransacao,
  };
}

// Hook específico para estatísticas financeiras
export function useTransacaoStats() {
  const api = useCrudApi<TransacaoStats>(API_ENDPOINTS.DASHBOARD.FINANCIAL_SUMMARY);
  const [stats, setStats] = useState<TransacaoStats | null>(null);

  const buscarStats = useCallback(async (periodo?: number) => {
    try {
      const params = periodo ? { periodo } : {};
      const response = await api.list(params);
      setStats(response);
      return response;
    } catch (error) {
      console.error('Erro ao buscar estatísticas financeiras:', error);
      throw error;
    }
  }, [api]);

  return {
    ...api,
    stats,
    buscarStats,
  };
}
