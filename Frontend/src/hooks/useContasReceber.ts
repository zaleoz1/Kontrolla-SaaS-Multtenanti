import { useState, useCallback } from 'react';
import { useCrudApi } from './useApi';
import { API_ENDPOINTS } from '../config/api';

// Interfaces para contas a receber
export interface ContaReceber {
  id?: number;
  cliente_id?: number;
  venda_id?: number;
  descricao: string;
  valor: number;
  data_vencimento: string;
  data_pagamento?: string;
  status: 'pendente' | 'pago' | 'vencido' | 'cancelado';
  parcela?: string;
  observacoes?: string;
  // Campos específicos para pagamentos a prazo
  dias?: number;
  juros?: number;
  valor_original?: number;
  valor_com_juros?: number;
  data_criacao?: string;
  data_atualizacao?: string;
  cliente_nome?: string;
  cliente_email?: string;
  tipo_origem?: 'conta_receber' | 'venda' | 'transacao_entrada';
}

export interface ContasReceberResponse {
  contas: ContaReceber[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ContaReceberResponse {
  conta: ContaReceber;
}

export function useContasReceber() {
  const api = useCrudApi<ContasReceberResponse>(API_ENDPOINTS.FINANCIAL.ACCOUNTS_RECEIVABLE);
  const [contas, setContas] = useState<ContaReceber[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });

  const buscarContas = useCallback(async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    data_inicio?: string;
    data_fim?: string;
  }) => {
    try {
      const response = await api.list(params);
      setContas(response.contas);
      setPagination(response.pagination);
      return response;
    } catch (error) {
      console.error('Erro ao buscar contas a receber:', error);
      throw error;
    }
  }, [api.list]);

  const buscarConta = useCallback(async (id: number) => {
    try {
      const response = await api.get(id) as unknown as ContaReceberResponse;
      return response.conta;
    } catch (error) {
      console.error('Erro ao buscar conta a receber:', error);
      throw error;
    }
  }, [api.get]);

  const criarConta = useCallback(async (dados: Partial<ContaReceber>) => {
    try {
      const response = await api.create(dados) as unknown as ContaReceberResponse;
      // Atualizar lista local
      await buscarContas();
      return response.conta;
    } catch (error) {
      console.error('Erro ao criar conta a receber:', error);
      throw error;
    }
  }, [api.create, buscarContas]);

  const atualizarConta = useCallback(async (id: number, dados: Partial<ContaReceber>) => {
    try {
      const response = await api.update(id, dados) as unknown as ContaReceberResponse;
      // Atualizar lista local
      await buscarContas();
      return response.conta;
    } catch (error) {
      console.error('Erro ao atualizar conta a receber:', error);
      throw error;
    }
  }, [api.update, buscarContas]);

  const deletarConta = useCallback(async (id: number, tipo_origem?: 'conta_receber' | 'venda' | 'transacao_entrada') => {
    try {
      await api.remove(id, { tipo_origem });
      // Atualizar lista local
      await buscarContas();
    } catch (error) {
      console.error('Erro ao deletar conta a receber:', error);
      throw error;
    }
  }, [api.remove, buscarContas]);

  const marcarComoPago = useCallback(async (id: number, dataPagamento?: string, tipo_origem?: 'conta_receber' | 'venda' | 'transacao_entrada') => {
    try {
      const dados = {
        status: 'pago' as const,
        data_pagamento: dataPagamento || new Date().toISOString().split('T')[0],
        tipo_origem
      };
      return await atualizarConta(id, dados);
    } catch (error) {
      console.error('Erro ao marcar conta como paga:', error);
      throw error;
    }
  }, [atualizarConta]);

  return {
    ...api,
    contas,
    pagination,
    buscarContas,
    buscarConta,
    criarConta,
    atualizarConta,
    deletarConta,
    marcarComoPago,
  };
}
