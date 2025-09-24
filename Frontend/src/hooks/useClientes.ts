import { useState, useCallback, useEffect } from 'react';
import { useCrudApi } from './useApi';
import { API_ENDPOINTS } from '@/config/api';

export interface Cliente {
  id: number;
  nome: string;
  email?: string;
  telefone?: string;
  cpf_cnpj?: string;
  tipo_pessoa: 'fisica' | 'juridica';
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  data_nascimento?: string;
  sexo?: 'masculino' | 'feminino' | 'outro';
  razao_social?: string;
  inscricao_estadual?: string;
  inscricao_municipal?: string;
  nome_fantasia?: string;
  observacoes?: string;
  status: 'ativo' | 'inativo';
  vip: boolean;
  total_compras: number;
  total_pagar?: number;
  quantidade_contas_pendentes?: number;
  data_criacao: string;
  data_atualizacao: string;
}

interface ClientesResponse {
  clientes: Cliente[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

interface ClienteResponse {
  cliente: Cliente;
}

interface ClienteSingleResponse {
  cliente: Cliente;
}

export function useClientes() {
  const api = useCrudApi<ClientesResponse>(API_ENDPOINTS.CLIENTS.LIST);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });

  const buscarClientes = useCallback(async (params?: {
    page?: number;
    limit?: number;
    q?: string;
    status?: string;
  }) => {
    try {
      const response = await api.list(params);
      setClientes(response.clientes);
      setPagination(response.pagination);
      return response;
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      throw error;
    }
  }, [api]);

  const buscarCliente = useCallback(async (id: number) => {
    try {
      const response = await api.get(id) as unknown as ClienteSingleResponse;
      return response.cliente;
    } catch (error) {
      console.error('Erro ao buscar cliente:', error);
      throw error;
    }
  }, [api]);

  const criarCliente = useCallback(async (dados: Partial<Cliente>) => {
    try {
      const response = await api.create(dados) as unknown as ClienteSingleResponse;
      // Atualizar lista local
      await buscarClientes();
      return response.cliente;
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      throw error;
    }
  }, [api, buscarClientes]);

  const atualizarCliente = useCallback(async (id: number, dados: Partial<Cliente>) => {
    try {
      const response = await api.update(id, dados) as unknown as ClienteSingleResponse;
      // Atualizar lista local
      await buscarClientes();
      return response.cliente;
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
      throw error;
    }
  }, [api, buscarClientes]);

  const deletarCliente = useCallback(async (id: number) => {
    try {
      await api.remove(id);
      // Atualizar lista local
      await buscarClientes();
    } catch (error) {
      console.error('Erro ao deletar cliente:', error);
      throw error;
    }
  }, [api, buscarClientes]);

  const buscarTotalPagar = useCallback(async (id: number) => {
    try {
      const response = await api.makeRequest(`${API_ENDPOINTS.CLIENTS.LIST}/${id}/total-pagar`);
      return response;
    } catch (error) {
      console.error('Erro ao buscar total a pagar do cliente:', error);
      throw error;
    }
  }, [api]);

  // Remover carregamento automático para evitar conflitos

  return {
    clientes,
    pagination,
    loading: api.loading,
    error: api.error,
    buscarClientes,
    buscarCliente,
    criarCliente,
    atualizarCliente,
    deletarCliente,
    buscarTotalPagar,
  };
}

// Hook para busca de clientes com debounce
export function useBuscaClientes() {
  const [termoBusca, setTermoBusca] = useState('');
  const [clientesFiltrados, setClientesFiltrados] = useState<Cliente[]>([]);
  const [carregando, setCarregando] = useState(false);
  const { buscarClientes } = useClientes();

  const buscar = useCallback(async (termo: string) => {
    setCarregando(true);
    try {
      const response = await buscarClientes({
        q: termo,
        limit: 20,
        status: 'ativo'
      });
      setClientesFiltrados(response.clientes);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      setClientesFiltrados([]);
    } finally {
      setCarregando(false);
    }
  }, [buscarClientes]);

  // Debounce da busca
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      buscar(termoBusca);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [termoBusca, buscar]);

  // Carregar clientes iniciais quando o componente monta
  useEffect(() => {
    buscar('');
  }, [buscar]);

  return {
    termoBusca,
    setTermoBusca,
    termoBuscaCliente: termoBusca,
    setTermoBuscaCliente: setTermoBusca,
    clientesFiltrados,
    carregando,
  };
}
