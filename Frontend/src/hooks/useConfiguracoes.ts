import { useState, useEffect } from 'react';
import { useApi } from './useApi';

interface DadosConta {
  id: number;
  nome: string;
  sobrenome: string;
  email: string;
  telefone: string;
  avatar?: string;
  role: string;
  ultimo_login?: string;
  tenant_id: number;
  tenant_nome: string;
  tenant_slug: string;
}

interface DadosTenant {
  id: number;
  nome: string;
  slug: string;
  cnpj?: string;
  cpf?: string;
  tipo_pessoa: 'fisica' | 'juridica';
  email: string;
  telefone?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  razao_social?: string;
  nome_fantasia?: string;
  inscricao_estadual?: string;
  inscricao_municipal?: string;
  logo?: string;
  status: 'ativo' | 'inativo' | 'suspenso';
  plano: string;
  data_criacao: string;
}

interface ConfiguracoesSistema {
  tema: 'claro' | 'escuro' | 'sistema';
  idioma: string;
  fuso_horario: string;
  moeda: string;
  formato_data: string;
  notificacoes: {
    email: boolean;
    push: boolean;
    sms: boolean;
    vendas: boolean;
    estoque: boolean;
    financeiro: boolean;
    clientes: boolean;
  };
  seguranca: {
    autenticacao_2fa: boolean;
    sessao_longa: boolean;
    log_atividade: boolean;
    backup_automatico: boolean;
  };
}

interface ParcelaMetodoPagamento {
  id?: number;
  quantidade: number;
  taxa: number;
  ativo: boolean;
}

interface MetodoPagamento {
  id?: number;
  tipo: 'dinheiro' | 'cartao_credito' | 'cartao_debito' | 'pix' | 'transferencia' | 'boleto' | 'cheque';
  nome: string;
  taxa: number;
  ativo: boolean;
  ordem: number;
  configuracoes?: any;
  parcelas: ParcelaMetodoPagamento[];
}

export const useConfiguracoes = () => {
  const [dadosConta, setDadosConta] = useState<DadosConta | null>(null);
  const [dadosTenant, setDadosTenant] = useState<DadosTenant | null>(null);
  const [configuracoes, setConfiguracoes] = useState<ConfiguracoesSistema | null>(null);
  const [metodosPagamento, setMetodosPagamento] = useState<MetodoPagamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { makeRequest } = useApi();

  // Estados locais para edição
  const [dadosContaEditando, setDadosContaEditando] = useState<DadosConta | null>(null);
  const [dadosTenantEditando, setDadosTenantEditando] = useState<DadosTenant | null>(null);
  const [configuracoesEditando, setConfiguracoesEditando] = useState<ConfiguracoesSistema | null>(null);
  const [metodosPagamentoEditando, setMetodosPagamentoEditando] = useState<MetodoPagamento[]>([]);

  // Buscar dados do usuário
  const buscarDadosUsuario = async () => {
    try {
      const response = await makeRequest('/auth/me', { method: 'GET' });
      if (response.user) {
        setDadosConta(response.user);
        return response.user;
      } else {
        throw new Error('Dados do usuário não encontrados na resposta');
      }
    } catch (err) {
      console.error('Erro ao buscar dados do usuário:', err);
      setError('Erro ao carregar dados do usuário');
      throw err;
    }
  };

  // Buscar dados do tenant
  const buscarDadosTenant = async (tenantId: number) => {
    try {
      const response = await makeRequest(`/configuracoes/tenant/${tenantId}`, { method: 'GET' });
      if (response.tenant) {
        setDadosTenant(response.tenant);
        return response.tenant;
      }
    } catch (err) {
      console.error('Erro ao buscar dados do tenant:', err);
      setError('Erro ao carregar dados da empresa');
      throw err;
    }
  };

  // Buscar configurações do sistema
  const buscarConfiguracoes = async (tenantId: number) => {
    try {
      const response = await makeRequest(`/configuracoes/sistema/${tenantId}`, { method: 'GET' });
      if (response.configuracoes) {
        setConfiguracoes(response.configuracoes);
        return response.configuracoes;
      }
    } catch (err) {
      console.error('Erro ao buscar configurações:', err);
      setError('Erro ao carregar configurações');
      throw err;
    }
  };

  // Buscar métodos de pagamento
  const buscarMetodosPagamento = async () => {
    try {
      const response = await makeRequest('/configuracoes/metodos-pagamento', { method: 'GET' });
      if (response) {
        setMetodosPagamento(response);
        return response;
      }
    } catch (err) {
      console.error('Erro ao buscar métodos de pagamento:', err);
      setError('Erro ao carregar métodos de pagamento');
      throw err;
    }
  };

  // Carregar todos os dados
  const carregarDados = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const user = await buscarDadosUsuario();
      
      if (user && user.tenant_id) {
        // Buscar dados do tenant, configurações e métodos de pagamento após obter dados do usuário
        const [tenant, config, metodos] = await Promise.all([
          buscarDadosTenant(user.tenant_id),
          buscarConfiguracoes(user.tenant_id),
          buscarMetodosPagamento()
        ]);
        
        // Sincronizar estados de edição
        if (tenant) {
          setDadosTenantEditando(tenant);
        }
        if (config) {
          setConfiguracoesEditando(config);
        }
        if (metodos) {
          setMetodosPagamentoEditando(metodos);
        }
      } else {
        console.error('Usuário ou tenant_id não encontrado:', user);
        setError('Dados do usuário incompletos');
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setError('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  // Atualizar dados da conta
  const atualizarDadosConta = async (dados: Partial<DadosConta>) => {
    try {
      const response = await makeRequest('/configuracoes/conta', { method: 'PUT', body: dados });
      if (response.user) {
        setDadosConta(response.user);
      }
      return response;
    } catch (err) {
      console.error('Erro ao atualizar dados da conta:', err);
      throw err;
    }
  };

  // Atualizar dados do tenant
  const atualizarDadosTenant = async (dados: Partial<DadosTenant>) => {
    try {
      const response = await makeRequest('/configuracoes/tenant', { method: 'PUT', body: dados });
      if (response.tenant) {
        setDadosTenant(response.tenant);
      }
      return response;
    } catch (err) {
      console.error('Erro ao atualizar dados do tenant:', err);
      throw err;
    }
  };

  // Atualizar configurações do sistema
  const atualizarConfiguracoes = async (dados: Partial<ConfiguracoesSistema>) => {
    try {
      const response = await makeRequest('/configuracoes/sistema', { method: 'PUT', body: dados });
      if (response.configuracoes) {
        setConfiguracoes(response.configuracoes);
      }
      return response;
    } catch (err) {
      console.error('Erro ao atualizar configurações:', err);
      throw err;
    }
  };

  // Alterar senha
  const alterarSenha = async (senhaAtual: string, novaSenha: string) => {
    try {
      const response = await makeRequest('/auth/change-password', { 
        method: 'PUT', 
        body: { senhaAtual, novaSenha }
      });
      return response;
    } catch (err) {
      console.error('Erro ao alterar senha:', err);
      throw err;
    }
  };

  // Upload de avatar
  const uploadAvatar = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      
      const response = await makeRequest('/configuracoes/avatar', { 
        method: 'POST', 
        body: formData,
        headers: {} // Remove Content-Type para permitir que o browser defina o boundary
      });
      if (response.user) {
        setDadosConta(response.user);
      }
      return response;
    } catch (err) {
      console.error('Erro ao fazer upload do avatar:', err);
      throw err;
    }
  };

  // Upload de logo da empresa
  const uploadLogo = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('logo', file);
      
      const response = await makeRequest('/configuracoes/logo', { 
        method: 'POST', 
        body: formData,
        headers: {} // Remove Content-Type para permitir que o browser defina o boundary
      });
      if (response.tenant) {
        setDadosTenant(response.tenant);
      }
      return response;
    } catch (err) {
      console.error('Erro ao fazer upload da logo:', err);
      throw err;
    }
  };

  // Atualizar métodos de pagamento em lote
  const atualizarMetodosPagamento = async (metodos: MetodoPagamento[]) => {
    try {
      const response = await makeRequest('/configuracoes/metodos-pagamento/lote', { 
        method: 'PUT', 
        body: { metodos }
      });
      if (response.metodos) {
        setMetodosPagamento(response.metodos);
        setMetodosPagamentoEditando(response.metodos);
      }
      return response;
    } catch (err) {
      console.error('Erro ao atualizar métodos de pagamento:', err);
      throw err;
    }
  };

  // Criar ou atualizar método de pagamento individual
  const salvarMetodoPagamento = async (metodo: MetodoPagamento) => {
    try {
      const response = await makeRequest('/configuracoes/metodos-pagamento', { 
        method: 'POST', 
        body: metodo
      });
      if (response.metodo) {
        // Atualizar lista de métodos
        const metodosAtualizados = metodosPagamento.filter(m => m.tipo !== metodo.tipo);
        metodosAtualizados.push(response.metodo);
        setMetodosPagamento(metodosAtualizados);
        setMetodosPagamentoEditando(metodosAtualizados);
      }
      return response;
    } catch (err) {
      console.error('Erro ao salvar método de pagamento:', err);
      throw err;
    }
  };

  // Deletar método de pagamento
  const deletarMetodoPagamento = async (id: number) => {
    try {
      const response = await makeRequest(`/configuracoes/metodos-pagamento/${id}`, { 
        method: 'DELETE'
      });
      
      // Atualizar lista de métodos
      const metodosAtualizados = metodosPagamento.filter(m => m.id !== id);
      setMetodosPagamento(metodosAtualizados);
      setMetodosPagamentoEditando(metodosAtualizados);
      
      return response;
    } catch (err) {
      console.error('Erro ao deletar método de pagamento:', err);
      throw err;
    }
  };

  // Adicionar parcela a um método de pagamento
  const adicionarParcela = async (metodoId: number, parcela: ParcelaMetodoPagamento) => {
    try {
      const response = await makeRequest(`/configuracoes/metodos-pagamento/${metodoId}/parcelas`, { 
        method: 'POST', 
        body: parcela
      });
      
      // Atualizar lista de métodos
      const metodosAtualizados = metodosPagamento.map(metodo => {
        if (metodo.id === metodoId) {
          return {
            ...metodo,
            parcelas: [...(metodo.parcelas || []), response.parcela]
          };
        }
        return metodo;
      });
      setMetodosPagamento(metodosAtualizados);
      setMetodosPagamentoEditando(metodosAtualizados);
      
      return response;
    } catch (err) {
      console.error('Erro ao adicionar parcela:', err);
      throw err;
    }
  };

  // Deletar parcela de um método de pagamento
  const deletarParcela = async (metodoId: number, parcelaId: number) => {
    try {
      const response = await makeRequest(`/configuracoes/metodos-pagamento/${metodoId}/parcelas/${parcelaId}`, { 
        method: 'DELETE'
      });
      
      // Atualizar lista de métodos
      const metodosAtualizados = metodosPagamento.map(metodo => {
        if (metodo.id === metodoId) {
          return {
            ...metodo,
            parcelas: (metodo.parcelas || []).filter(p => p.id !== parcelaId)
          };
        }
        return metodo;
      });
      setMetodosPagamento(metodosAtualizados);
      setMetodosPagamentoEditando(metodosAtualizados);
      
      return response;
    } catch (err) {
      console.error('Erro ao deletar parcela:', err);
      throw err;
    }
  };

  // Sincronizar estados de edição com dados originais
  useEffect(() => {
    if (dadosConta) {
      setDadosContaEditando(dadosConta);
    }
  }, [dadosConta]);

  useEffect(() => {
    if (metodosPagamento.length > 0) {
      setMetodosPagamentoEditando(metodosPagamento);
    }
  }, [metodosPagamento]);

  // Carregar dados quando o componente for montado
  useEffect(() => {
    carregarDados();
  }, []);

  return {
    dadosConta,
    dadosTenant,
    configuracoes,
    metodosPagamento,
    dadosContaEditando,
    dadosTenantEditando,
    configuracoesEditando,
    metodosPagamentoEditando,
    setDadosContaEditando,
    setDadosTenantEditando,
    setConfiguracoesEditando,
    setMetodosPagamentoEditando,
    loading,
    error,
    carregarDados,
    atualizarDadosConta,
    atualizarDadosTenant,
    atualizarConfiguracoes,
    alterarSenha,
    uploadAvatar,
    uploadLogo,
    buscarMetodosPagamento,
    atualizarMetodosPagamento,
    salvarMetodoPagamento,
    deletarMetodoPagamento,
    adicionarParcela,
    deletarParcela
  };
};
