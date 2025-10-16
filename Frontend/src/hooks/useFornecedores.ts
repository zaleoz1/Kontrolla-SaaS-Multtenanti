import { useState, useEffect } from 'react';
import { useToast } from './use-toast';
import { useCrudApi } from './useApi';
import { API_ENDPOINTS } from '@/config/api';

export interface Fornecedor {
  id?: number;
  nome: string;
  razao_social?: string;
  cnpj?: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  contato?: string;
  observacoes?: string;
  status: string;
  data_criacao?: string;
}

export const useFornecedores = () => {
  const { toast } = useToast();
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  
  // Hook da API para fornecedores
  const api = useCrudApi(API_ENDPOINTS.FORNECEDORES.LIST);

  const carregarFornecedores = async () => {
    setCarregando(true);
    try {
      // Passar um limite muito alto para carregar todos os fornecedores
      const response = await api.list({ limit: 10000 });
      if (response.success) {
        setFornecedores(response.data);
      } else {
        throw new Error(response.error || 'Erro ao carregar fornecedores');
      }
    } catch (error: any) {
      console.error('Erro ao carregar fornecedores:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao carregar fornecedores",
        variant: "destructive"
      });
    } finally {
      setCarregando(false);
    }
  };

  const criarFornecedor = async (fornecedor: Omit<Fornecedor, 'id' | 'data_criacao'>) => {
    setSalvando(true);
    try {
      const response = await api.create(fornecedor);
      if (response.success) {
        const novoFornecedor = response.data;
        setFornecedores(prev => [...prev, novoFornecedor]);
        
        toast({
          title: "Sucesso",
          description: "Fornecedor criado com sucesso!",
          variant: "default"
        });
        
        return novoFornecedor;
      } else {
        throw new Error(response.error || 'Erro ao criar fornecedor');
      }
    } catch (error: any) {
      console.error('Erro ao criar fornecedor:', error);
      
      // Tratar erros específicos
      let errorMessage = "Erro ao criar fornecedor";
      if (error.message.includes('CNPJ já cadastrado')) {
        errorMessage = "CNPJ já está cadastrado para outro fornecedor";
      } else if (error.message.includes('Email já cadastrado')) {
        errorMessage = "Email já está cadastrado para outro fornecedor";
      } else if (error.message.includes('Dados inválidos')) {
        errorMessage = "Verifique os dados preenchidos";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
      throw error;
    } finally {
      setSalvando(false);
    }
  };

  const atualizarFornecedor = async (id: number, fornecedor: Partial<Fornecedor>) => {
    setSalvando(true);
    try {
      const response = await api.update(id, fornecedor);
      if (response.success) {
        const fornecedorAtualizado = response.data;
        setFornecedores(prev => 
          prev.map(f => f.id === id ? fornecedorAtualizado : f)
        );
        
        toast({
          title: "Sucesso",
          description: "Fornecedor atualizado com sucesso!",
          variant: "default"
        });
        
        return fornecedorAtualizado;
      } else {
        throw new Error(response.error || 'Erro ao atualizar fornecedor');
      }
    } catch (error: any) {
      console.error('Erro ao atualizar fornecedor:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar fornecedor",
        variant: "destructive"
      });
      throw error;
    } finally {
      setSalvando(false);
    }
  };

  const excluirFornecedor = async (id: number) => {
    setSalvando(true);
    try {
      const response = await api.remove(id);
      if (response.success) {
        setFornecedores(prev => prev.filter(f => f.id !== id));
        
        toast({
          title: "Sucesso",
          description: "Fornecedor excluído com sucesso!",
          variant: "default"
        });
      } else {
        throw new Error(response.error || 'Erro ao excluir fornecedor');
      }
    } catch (error: any) {
      console.error('Erro ao excluir fornecedor:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir fornecedor",
        variant: "destructive"
      });
      throw error;
    } finally {
      setSalvando(false);
    }
  };

  const buscarFornecedor = async (id: number) => {
    setCarregando(true);
    try {
      const response = await api.get(id);
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.error || 'Fornecedor não encontrado');
      }
    } catch (error: any) {
      console.error('Erro ao buscar fornecedor:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao buscar fornecedor",
        variant: "destructive"
      });
      throw error;
    } finally {
      setCarregando(false);
    }
  };

  const buscarCep = async (cep: string) => {
    const cepLimpo = cep.replace(/\D/g, '');
    if (cepLimpo.length === 8) {
      try {
        const response = await api.makeRequest(API_ENDPOINTS.FORNECEDORES.SEARCH_CEP(cepLimpo));
        
        if (response.success) {
          return response.data;
        } else {
          throw new Error(response.error || 'CEP não encontrado');
        }
      } catch (error: any) {
        console.error('Erro ao buscar CEP:', error);
        toast({
          title: "Erro",
          description: error.message || "Erro ao buscar CEP",
          variant: "destructive"
        });
        return null;
      }
    }
    return null;
  };

  return {
    fornecedores,
    carregando,
    salvando,
    carregarFornecedores,
    criarFornecedor,
    atualizarFornecedor,
    excluirFornecedor,
    buscarFornecedor,
    buscarCep
  };
};
