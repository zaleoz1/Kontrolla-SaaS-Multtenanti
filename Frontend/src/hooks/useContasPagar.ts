import { useState, useCallback } from 'react';
import { useCrudApi } from './useApi';
import { API_ENDPOINTS } from '../config/api';

// Interfaces para contas a pagar
export interface ContaPagar {
  id?: number;
  fornecedor: string;
  descricao: string;
  valor: number;
  data_vencimento: string;
  data_pagamento?: string;
  status: 'pendente' | 'pago' | 'vencido' | 'cancelado';
  categoria?: string;
  observacoes?: string;
  data_criacao?: string;
  data_atualizacao?: string;
  tipo_origem?: 'conta_pagar' | 'transacao';
  tipo_conta?: 'funcionario' | 'fornecedor' | 'outro';
  funcionario_id?: number;
  fornecedor_id?: number;
}

export interface ContasPagarResponse {
  contas: ContaPagar[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ContaPagarResponse {
  conta: ContaPagar;
}

export function useContasPagar() {
  const api = useCrudApi<ContasPagarResponse>(API_ENDPOINTS.FINANCIAL.ACCOUNTS_PAYABLE);
  const [contas, setContas] = useState<ContaPagar[]>([]);
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
      console.log('Contas a pagar carregadas:', response.contas);
      setContas(response.contas);
      setPagination(response.pagination);
      return response;
    } catch (error) {
      console.error('Erro ao buscar contas a pagar:', error);
      throw error;
    }
  }, [api.list]);

  const buscarConta = useCallback(async (id: number) => {
    try {
      const response = await api.get(id) as unknown as ContaPagarResponse;
      return response.conta;
    } catch (error) {
      console.error('Erro ao buscar conta a pagar:', error);
      throw error;
    }
  }, [api.get]);

  const criarConta = useCallback(async (dados: Partial<ContaPagar>) => {
    try {
      const response = await api.create(dados) as unknown as ContaPagarResponse;
      // Atualizar lista local
      await buscarContas();
      return response.conta;
    } catch (error) {
      console.error('Erro ao criar conta a pagar:', error);
      throw error;
    }
  }, [api.create, buscarContas]);

  const atualizarConta = useCallback(async (id: number, dados: Partial<ContaPagar>) => {
    try {
      const response = await api.update(id, dados) as unknown as ContaPagarResponse;
      // Atualizar lista local
      await buscarContas();
      return response.conta;
    } catch (error) {
      console.error('Erro ao atualizar conta a pagar:', error);
      throw error;
    }
  }, [api.update, buscarContas]);

  const deletarConta = useCallback(async (id: number, tipo_origem?: 'conta_pagar' | 'transacao') => {
    try {
      await (api.remove as any)(id, { tipo_origem });
      // Atualizar lista local
      await buscarContas();
    } catch (error) {
      console.error('Erro ao deletar conta a pagar:', error);
      throw error;
    }
  }, [api.remove, buscarContas]);

  const marcarComoPago = useCallback(async (id: number, dataPagamento?: string, tipo_origem?: 'conta_pagar' | 'transacao') => {
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
