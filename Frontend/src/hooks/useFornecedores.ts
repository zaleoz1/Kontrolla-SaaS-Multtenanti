import { useState, useEffect } from 'react';
import { useToast } from './use-toast';

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

  const carregarFornecedores = async () => {
    setCarregando(true);
    try {
      // Aqui você implementaria a chamada para a API
      // const response = await api.get('/fornecedores');
      // setFornecedores(response.data);
      
      // Dados mock para demonstração
      const fornecedoresMock: Fornecedor[] = [
        {
          id: 1,
          nome: "Fornecedor ABC Ltda",
          razao_social: "ABC Fornecedores Ltda",
          cnpj: "12.345.678/0001-90",
          email: "contato@abc.com.br",
          telefone: "(11) 99999-9999",
          endereco: "Rua das Flores, 123",
          cidade: "São Paulo",
          estado: "SP",
          cep: "01234-567",
          contato: "João Silva",
          observacoes: "Fornecedor principal de produtos eletrônicos",
          status: "ativo",
          data_criacao: "2024-01-15T10:30:00Z"
        },
        {
          id: 2,
          nome: "Distribuidora XYZ",
          razao_social: "XYZ Distribuidora S.A.",
          cnpj: "98.765.432/0001-10",
          email: "vendas@xyz.com.br",
          telefone: "(11) 88888-8888",
          endereco: "Av. Paulista, 456",
          cidade: "São Paulo",
          estado: "SP",
          cep: "01310-100",
          contato: "Maria Santos",
          observacoes: "Especializada em produtos de limpeza",
          status: "ativo",
          data_criacao: "2024-01-10T14:20:00Z"
        }
      ];
      setFornecedores(fornecedoresMock);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar fornecedores",
        variant: "destructive"
      });
    } finally {
      setCarregando(false);
    }
  };

  const criarFornecedor = async (fornecedor: Omit<Fornecedor, 'id' | 'data_criacao'>) => {
    setSalvando(true);
    try {
      // Aqui você implementaria a chamada para a API
      // const response = await api.post('/fornecedores', fornecedor);
      // const novoFornecedor = response.data;
      
      // Mock para demonstração
      const novoFornecedor: Fornecedor = {
        ...fornecedor,
        id: Date.now(), // ID temporário
        data_criacao: new Date().toISOString()
      };
      
      setFornecedores(prev => [...prev, novoFornecedor]);
      
      toast({
        title: "Sucesso",
        description: "Fornecedor criado com sucesso!",
        variant: "default"
      });
      
      return novoFornecedor;
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar fornecedor",
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
      // Aqui você implementaria a chamada para a API
      // const response = await api.put(`/fornecedores/${id}`, fornecedor);
      // const fornecedorAtualizado = response.data;
      
      // Mock para demonstração
      const fornecedorAtualizado: Fornecedor = {
        ...fornecedores.find(f => f.id === id),
        ...fornecedor
      } as Fornecedor;
      
      setFornecedores(prev => 
        prev.map(f => f.id === id ? fornecedorAtualizado : f)
      );
      
      toast({
        title: "Sucesso",
        description: "Fornecedor atualizado com sucesso!",
        variant: "default"
      });
      
      return fornecedorAtualizado;
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar fornecedor",
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
      // Aqui você implementaria a chamada para a API
      // await api.delete(`/fornecedores/${id}`);
      
      setFornecedores(prev => prev.filter(f => f.id !== id));
      
      toast({
        title: "Sucesso",
        description: "Fornecedor excluído com sucesso!",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir fornecedor",
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
      // Aqui você implementaria a chamada para a API
      // const response = await api.get(`/fornecedores/${id}`);
      // return response.data;
      
      // Mock para demonstração
      const fornecedor = fornecedores.find(f => f.id === id);
      if (!fornecedor) {
        throw new Error('Fornecedor não encontrado');
      }
      return fornecedor;
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao buscar fornecedor",
        variant: "destructive"
      });
      throw error;
    } finally {
      setCarregando(false);
    }
  };

  const buscarCep = async (cep: string) => {
    if (cep.length === 9) {
      try {
        const cepLimpo = cep.replace(/\D/g, '');
        const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
        const data = await response.json();
        
        if (!data.erro) {
          return {
            endereco: `${data.logradouro}, ${data.bairro}`,
            cidade: data.localidade,
            estado: data.uf
          };
        }
      } catch (error) {
        console.error('Erro ao buscar CEP:', error);
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
