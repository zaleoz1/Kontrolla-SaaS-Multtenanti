import { useState, useEffect, useCallback } from 'react';
import { useToast } from './use-toast';
import { useCrudApi } from './useApi';
import { API_ENDPOINTS, API_CONFIG } from '@/config/api';

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
      // Usar o endpoint real de CEP que integra com ViaCEP
      const response = await fetch(`${API_CONFIG.BASE_URL}/auth/cep/${cep}`);
      const data = await response.json();
      
      if (response.ok && data.localidade) {
        // Mapear a resposta da ViaCEP para o formato esperado
        return {
          cep: data.cep,
          endereco: `${data.logradouro}${data.complemento ? ', ' + data.complemento : ''}${data.bairro ? ', ' + data.bairro : ''}`,
          cidade: data.localidade,
          estado: data.uf
        };
      }
      return null;
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      return null;
    }
  }, []);

  const gerarContasMensais = useCallback(async (mes?: number, ano?: number) => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/funcionarios/gerar-contas-mensais`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ mes, ano })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao gerar contas mensais');
      }

      return data;
    } catch (error) {
      console.error('Erro ao gerar contas mensais:', error);
      throw error;
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
    buscarCep,
    gerarContasMensais
  };
}