import { useState, useEffect } from 'react';
import { useToast } from './use-toast';

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
}

export const useFuncionarios = () => {
  const { toast } = useToast();
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const carregarFuncionarios = async () => {
    setCarregando(true);
    try {
      // Aqui você implementaria a chamada para a API
      // const response = await api.get('/funcionarios');
      // setFuncionarios(response.data);
      
      // Dados mock para demonstração
      const funcionariosMock: Funcionario[] = [
        {
          id: 1,
          nome: "João",
          sobrenome: "Silva",
          cpf: "123.456.789-00",
          rg: "12.345.678-9",
          email: "joao.silva@empresa.com",
          telefone: "(11) 99999-9999",
          endereco: "Rua das Flores, 123",
          cidade: "São Paulo",
          estado: "SP",
          cep: "01234-567",
          data_nascimento: "1990-05-15",
          sexo: "masculino",
          estado_civil: "casado",
          cargo: "Vendedor",
          departamento: "Vendas",
          data_admissao: "2023-01-15",
          data_demissao: null,
          salario: 3500.00,
          tipo_salario: "mensal",
          valor_hora: null,
          comissao_percentual: 2.5,
          banco: "Banco do Brasil",
          agencia: "1234",
          conta: "12345-6",
          digito: "7",
          tipo_conta: "corrente",
          pix: "joao.silva@empresa.com",
          observacoes: "Funcionário dedicado e pontual",
          status: "ativo",
          data_criacao: "2023-01-15T10:30:00Z"
        },
        {
          id: 2,
          nome: "Maria",
          sobrenome: "Santos",
          cpf: "987.654.321-00",
          rg: "98.765.432-1",
          email: "maria.santos@empresa.com",
          telefone: "(11) 88888-8888",
          endereco: "Av. Paulista, 456",
          cidade: "São Paulo",
          estado: "SP",
          cep: "01310-100",
          data_nascimento: "1985-08-22",
          sexo: "feminino",
          estado_civil: "solteira",
          cargo: "Gerente",
          departamento: "Administrativo",
          data_admissao: "2022-06-01",
          data_demissao: null,
          salario: 6500.00,
          tipo_salario: "mensal",
          valor_hora: null,
          comissao_percentual: null,
          banco: "Itaú",
          agencia: "5678",
          conta: "98765-4",
          digito: "3",
          tipo_conta: "corrente",
          pix: "maria.santos@empresa.com",
          observacoes: "Excelente liderança e organização",
          status: "ativo",
          data_criacao: "2022-06-01T14:20:00Z"
        }
      ];
      setFuncionarios(funcionariosMock);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar funcionários",
        variant: "destructive"
      });
    } finally {
      setCarregando(false);
    }
  };

  const criarFuncionario = async (funcionario: Omit<Funcionario, 'id' | 'data_criacao'>) => {
    setSalvando(true);
    try {
      // Aqui você implementaria a chamada para a API
      // const response = await api.post('/funcionarios', funcionario);
      // const novoFuncionario = response.data;
      
      // Mock para demonstração
      const novoFuncionario: Funcionario = {
        ...funcionario,
        id: Date.now(), // ID temporário
        data_criacao: new Date().toISOString()
      };
      
      setFuncionarios(prev => [...prev, novoFuncionario]);
      
      toast({
        title: "Sucesso",
        description: "Funcionário criado com sucesso!",
        variant: "default"
      });
      
      return novoFuncionario;
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar funcionário",
        variant: "destructive"
      });
      throw error;
    } finally {
      setSalvando(false);
    }
  };

  const atualizarFuncionario = async (id: number, funcionario: Partial<Funcionario>) => {
    setSalvando(true);
    try {
      // Aqui você implementaria a chamada para a API
      // const response = await api.put(`/funcionarios/${id}`, funcionario);
      // const funcionarioAtualizado = response.data;
      
      // Mock para demonstração
      const funcionarioAtualizado: Funcionario = {
        ...funcionarios.find(f => f.id === id),
        ...funcionario
      } as Funcionario;
      
      setFuncionarios(prev => 
        prev.map(f => f.id === id ? funcionarioAtualizado : f)
      );
      
      toast({
        title: "Sucesso",
        description: "Funcionário atualizado com sucesso!",
        variant: "default"
      });
      
      return funcionarioAtualizado;
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar funcionário",
        variant: "destructive"
      });
      throw error;
    } finally {
      setSalvando(false);
    }
  };

  const excluirFuncionario = async (id: number) => {
    setSalvando(true);
    try {
      // Aqui você implementaria a chamada para a API
      // await api.delete(`/funcionarios/${id}`);
      
      setFuncionarios(prev => prev.filter(f => f.id !== id));
      
      toast({
        title: "Sucesso",
        description: "Funcionário excluído com sucesso!",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir funcionário",
        variant: "destructive"
      });
      throw error;
    } finally {
      setSalvando(false);
    }
  };

  const buscarFuncionario = async (id: number) => {
    setCarregando(true);
    try {
      // Aqui você implementaria a chamada para a API
      // const response = await api.get(`/funcionarios/${id}`);
      // return response.data;
      
      // Mock para demonstração
      const funcionario = funcionarios.find(f => f.id === id);
      if (!funcionario) {
        throw new Error('Funcionário não encontrado');
      }
      return funcionario;
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao buscar funcionário",
        variant: "destructive"
      });
      throw error;
    } finally {
      setCarregando(false);
    }
  };

  const buscarCep = async (cep: string) => {
    if (cep.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
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
    funcionarios,
    carregando,
    salvando,
    carregarFuncionarios,
    criarFuncionario,
    atualizarFuncionario,
    excluirFuncionario,
    buscarFuncionario,
    buscarCep
  };
};
