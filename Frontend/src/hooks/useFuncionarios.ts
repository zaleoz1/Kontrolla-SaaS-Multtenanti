import { useState, useEffect, useCallback } from 'react';
import { useToast } from './use-toast';
import { useCrudApi } from './useApi';
import { API_ENDPOINTS } from '@/config/api';

export interface Funcionario {
  id?: number;
  nome: string;
  sobrenome: string;
  cpf: string;
  rg?: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  data_nascimento?: string;
  sexo: string;
  estado_civil: string;
  cargo: string;
  departamento?: string;
  data_admissao: string;
  data_demissao?: string | null;
  salario: number;
  tipo_salario: string;
  valor_hora?: number | null;
  comissao_percentual?: number | null;
  banco?: string;
  agencia?: string;
  conta?: string;
  digito?: string;
  tipo_conta: string;
  pix?: string;
  observacoes?: string;
  status: string;
  data_criacao?: string;
  data_atualizacao?: string;
}

interface FuncionariosResponse {
  funcionarios: Funcionario[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

interface FuncionarioSingleResponse {
  funcionario: Funcionario;
}

export function useFuncionarios() {
  const api = useCrudApi<FuncionariosResponse>(API_ENDPOINTS.FUNCIONARIOS.LIST);
  const { toast } = useToast();
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });

  const buscarFuncionarios = useCallback(async (params?: {
    page?: number;
    limit?: number;
    q?: string;
    filtroStatus?: string;
    filtroCargo?: string;
  }) => {
    try {
      const response = await api.list(params);
      setFuncionarios(response.funcionarios);
      setPagination(response.pagination);
      return response;
    } catch (error) {
      console.error('Erro ao buscar funcionários:', error);
      throw error;
    }
  }, [api]);

  const buscarFuncionario = useCallback(async (id: number) => {
    try {
      const response = await api.get(id) as unknown as FuncionarioSingleResponse;
      return response.funcionario;
    } catch (error) {
      console.error('Erro ao buscar funcionário:', error);
      throw error;
    }
  }, [api]);

  const criarFuncionario = useCallback(async (dados: Partial<Funcionario>) => {
    try {
      const response = await api.create(dados) as unknown as FuncionarioSingleResponse;
      // Atualizar lista local
      await buscarFuncionarios();
      return response.funcionario;
    } catch (error) {
      console.error('Erro ao criar funcionário:', error);
      throw error;
    }
  }, [api, buscarFuncionarios]);

  const atualizarFuncionario = useCallback(async (id: number, dados: Partial<Funcionario>) => {
    try {
      const response = await api.update(id, dados) as unknown as FuncionarioSingleResponse;
      // Atualizar lista local
      await buscarFuncionarios();
      return response.funcionario;
    } catch (error) {
      console.error('Erro ao atualizar funcionário:', error);
      throw error;
    }
  }, [api, buscarFuncionarios]);

  const excluirFuncionario = useCallback(async (id: number) => {
    try {
      await api.remove(id);
      // Atualizar lista local
      await buscarFuncionarios();
    } catch (error) {
      console.error('Erro ao excluir funcionário:', error);
      throw error;
    }
  }, [api, buscarFuncionarios]);

  const buscarCep = useCallback(async (cep: string) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.FUNCIONARIOS.SEARCH_CEP(cep)}`);
      const data = await response.json();
      
      if (data.success) {
        return data.dados;
      }
      return null;
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      return null;
    }
  }, []);

  return {
    funcionarios,
    pagination,
    carregando: api.loading,
    salvando: api.loading,
    buscarFuncionarios,
    buscarFuncionario,
    criarFuncionario,
    atualizarFuncionario,
    excluirFuncionario,
    buscarCep
  };
}