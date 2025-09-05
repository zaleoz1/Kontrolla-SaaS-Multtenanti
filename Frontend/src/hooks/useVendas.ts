import { useState, useCallback } from 'react';
import { useCrudApi, useApi } from './useApi';
import { API_ENDPOINTS } from '@/config/api';

export interface ItemVenda {
  produto_id: number;
  quantidade: number;
  preco_unitario: number;
  preco_total: number;
  desconto?: number;
}

export interface MetodoPagamento {
  metodo: string;
  valor: string;
  parcelas?: number;
  troco?: number;
}

export interface PagamentoPrazo {
  dias: string;
  juros: string;
  valorComJuros: number;
  dataVencimento: Date;
}

export interface Venda {
  id?: number;
  tenant_id?: number;
  cliente_id?: number;
  usuario_id?: number;
  numero_venda?: string;
  data_venda?: string;
  status: 'pendente' | 'pago' | 'cancelado' | 'devolvido';
  subtotal: number;
  desconto: number;
  total: number;
  forma_pagamento: string;
  parcelas?: number;
  observacoes?: string;
  itens: ItemVenda[];
  metodos_pagamento?: MetodoPagamento[];
  pagamento_prazo?: PagamentoPrazo;
  data_criacao?: string;
  data_atualizacao?: string;
}

interface VendasResponse {
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

interface VendaResponse {
  venda: Venda;
}

export function useVendas() {
  const api = useCrudApi<VendasResponse>(API_ENDPOINTS.SALES.LIST);
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });

  const buscarVendas = useCallback(async (params?: {
    page?: number;
    limit?: number;
    q?: string;
    status?: string;
    data_inicio?: string;
    data_fim?: string;
  }) => {
    try {
      const response = await api.list(params);
      setVendas(response.vendas);
      setPagination(response.pagination);
      return response;
    } catch (error) {
      console.error('Erro ao buscar vendas:', error);
      throw error;
    }
  }, [api]);

  const buscarVenda = useCallback(async (id: number) => {
    try {
      const response = await api.get(id);
      return response.venda;
    } catch (error) {
      console.error('Erro ao buscar venda:', error);
      throw error;
    }
  }, [api]);

  const criarVenda = useCallback(async (dados: Partial<Venda>) => {
    try {
      const response = await api.create(dados);
      // Atualizar lista local
      await buscarVendas();
      return response.venda;
    } catch (error) {
      console.error('Erro ao criar venda:', error);
      throw error;
    }
  }, [api, buscarVendas]);

  const atualizarVenda = useCallback(async (id: number, dados: Partial<Venda>) => {
    try {
      const response = await api.update(id, dados);
      // Atualizar lista local
      await buscarVendas();
      return response.venda;
    } catch (error) {
      console.error('Erro ao atualizar venda:', error);
      throw error;
    }
  }, [api, buscarVendas]);

  const deletarVenda = useCallback(async (id: number) => {
    try {
      await api.remove(id);
      // Atualizar lista local
      await buscarVendas();
    } catch (error) {
      console.error('Erro ao deletar venda:', error);
      throw error;
    }
  }, [api, buscarVendas]);

  return {
    vendas,
    pagination,
    loading: api.loading,
    error: api.error,
    buscarVendas,
    buscarVenda,
    criarVenda,
    atualizarVenda,
    deletarVenda,
  };
}

// Hook específico para criar vendas
export function useCriarVenda() {
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const { makeRequest } = useApi();

  const criar = useCallback(async (dadosVenda: {
    cliente_id?: number;
    itens: ItemVenda[];
    metodos_pagamento?: MetodoPagamento[];
    pagamento_prazo?: PagamentoPrazo;
    subtotal: number;
    desconto: number;
    total: number;
    forma_pagamento: string;
    parcelas?: number;
    observacoes?: string;
  }) => {
    setCarregando(true);
    setErro(null);

    try {
      const response = await makeRequest(API_ENDPOINTS.SALES.CREATE, {
        method: 'POST',
        body: dadosVenda,
      });

      return response.venda;
    } catch (error: any) {
      setErro(error.message || 'Erro ao criar venda');
      throw error;
    } finally {
      setCarregando(false);
    }
  }, [makeRequest]);

  return {
    criar,
    carregando,
    erro,
  };
}
