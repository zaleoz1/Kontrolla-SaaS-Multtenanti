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

interface PixConfiguracao {
  id?: number;
  chave_pix: string;
  qr_code?: string;
  nome_titular: string;
  cpf_cnpj: string;
  ativo: boolean;
  data_criacao?: string;
  data_atualizacao?: string;
}

interface DadosBancarios {
  id?: number;
  banco: string;
  agencia: string;
  conta: string;
  digito: string;
  tipo_conta: 'corrente' | 'poupanca';
  nome_titular: string;
  cpf_cnpj: string;
  ativo: boolean;
  data_criacao?: string;
  data_atualizacao?: string;
}

interface Administrador {
  id?: number;
  nome: string;
  sobrenome: string;
  email: string;
  senha?: string;
  role: 'administrador' | 'gerente' | 'vendedor';
  status: 'ativo' | 'inativo' | 'suspenso';
  permissoes: string[];
  ultimo_acesso?: string;
  data_criacao?: string;
  data_atualizacao?: string;
  criado_por?: number;
}

export const useConfiguracoes = () => {
  const [dadosConta, setDadosConta] = useState<DadosConta | null>(null);
  const [dadosTenant, setDadosTenant] = useState<DadosTenant | null>(null);
  const [configuracoes, setConfiguracoes] = useState<ConfiguracoesSistema | null>(null);
  const [metodosPagamento, setMetodosPagamento] = useState<MetodoPagamento[]>([]);
  const [pixConfiguracao, setPixConfiguracao] = useState<PixConfiguracao | null>(null);
  const [dadosBancarios, setDadosBancarios] = useState<DadosBancarios | null>(null);
  const [administradores, setAdministradores] = useState<Administrador[]>([]);
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

  // Buscar configurações PIX
  const buscarPixConfiguracao = async () => {
    try {
      const response = await makeRequest('/configuracoes/pix', { method: 'GET' });
      if (response.pix) {
        setPixConfiguracao(response.pix);
        return response.pix;
      }
      return null;
    } catch (err) {
      console.error('Erro ao buscar configurações PIX:', err);
      setError('Erro ao carregar configurações PIX');
      throw err;
    }
  };

  // Buscar dados bancários
  const buscarDadosBancarios = async () => {
    try {
      const response = await makeRequest('/configuracoes/dados-bancarios', { method: 'GET' });
      if (response.dadosBancarios) {
        setDadosBancarios(response.dadosBancarios);
        return response.dadosBancarios;
      }
      return null;
    } catch (err) {
      console.error('Erro ao buscar dados bancários:', err);
      setError('Erro ao carregar dados bancários');
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
        // Buscar dados do tenant, configurações, métodos de pagamento, PIX e dados bancários após obter dados do usuário
        const [tenant, config, metodos, pix, bancarios] = await Promise.all([
          buscarDadosTenant(user.tenant_id),
          buscarConfiguracoes(user.tenant_id),
          buscarMetodosPagamento(),
          buscarPixConfiguracao(),
          buscarDadosBancarios()
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

  // Salvar configurações PIX
  const salvarPixConfiguracao = async (dados: Partial<PixConfiguracao>) => {
    try {
      const response = await makeRequest('/configuracoes/pix', { 
        method: 'POST', 
        body: dados
      });
      if (response.pix) {
        setPixConfiguracao(response.pix);
      }
      return response;
    } catch (err) {
      console.error('Erro ao salvar configurações PIX:', err);
      throw err;
    }
  };

  // Salvar dados bancários
  const salvarDadosBancarios = async (dados: Partial<DadosBancarios>) => {
    try {
      const response = await makeRequest('/configuracoes/dados-bancarios', { 
        method: 'POST', 
        body: dados
      });
      if (response.dadosBancarios) {
        setDadosBancarios(response.dadosBancarios);
      }
      return response;
    } catch (err) {
      console.error('Erro ao salvar dados bancários:', err);
      throw err;
    }
  };

  // Deletar configurações PIX
  const deletarPixConfiguracao = async () => {
    try {
      const response = await makeRequest('/configuracoes/pix', { 
        method: 'DELETE'
      });
      setPixConfiguracao(null);
      return response;
    } catch (err) {
      console.error('Erro ao deletar configurações PIX:', err);
      throw err;
    }
  };

  // Deletar dados bancários
  const deletarDadosBancarios = async () => {
    try {
      const response = await makeRequest('/configuracoes/dados-bancarios', { 
        method: 'DELETE'
      });
      setDadosBancarios(null);
      return response;
    } catch (err) {
      console.error('Erro ao deletar dados bancários:', err);
      throw err;
    }
  };

  // ===== FUNÇÕES PARA ADMINISTRADORES =====

  // Buscar administradores
  const buscarAdministradores = async (filtros?: { busca?: string; role?: string; status?: string }) => {
    try {
      const params = new URLSearchParams();
      if (filtros?.busca) params.append('busca', filtros.busca);
      if (filtros?.role) params.append('role', filtros.role);
      if (filtros?.status) params.append('status', filtros.status);
      
      const queryString = params.toString();
      const url = queryString ? `/configuracoes/administradores?${queryString}` : '/configuracoes/administradores';
      
      const response = await makeRequest(url, { method: 'GET' });
      if (response) {
        setAdministradores(response);
        return response;
      }
    } catch (err) {
      console.error('Erro ao buscar administradores:', err);
      setError('Erro ao carregar administradores');
      throw err;
    }
  };

  // Buscar administrador por ID
  const buscarAdministrador = async (id: number) => {
    try {
      const response = await makeRequest(`/configuracoes/administradores/${id}`, { method: 'GET' });
      return response;
    } catch (err) {
      console.error('Erro ao buscar administrador:', err);
      throw err;
    }
  };

  // Criar administrador
  const criarAdministrador = async (dados: Omit<Administrador, 'id'>) => {
    try {
      const response = await makeRequest('/configuracoes/administradores', { 
        method: 'POST', 
        body: dados
      });
      if (response.administrador) {
        setAdministradores(prev => [...prev, response.administrador]);
      }
      return response;
    } catch (err) {
      console.error('Erro ao criar administrador:', err);
      throw err;
    }
  };

  // Atualizar administrador
  const atualizarAdministrador = async (id: number, dados: Partial<Administrador>) => {
    try {
      const response = await makeRequest(`/configuracoes/administradores/${id}`, { 
        method: 'PUT', 
        body: dados
      });
      if (response.administrador) {
        setAdministradores(prev => 
          prev.map(admin => admin.id === id ? response.administrador : admin)
        );
      }
      return response;
    } catch (err) {
      console.error('Erro ao atualizar administrador:', err);
      throw err;
    }
  };

  // Deletar administrador
  const deletarAdministrador = async (id: number) => {
    try {
      const response = await makeRequest(`/configuracoes/administradores/${id}`, { 
        method: 'DELETE'
      });
      setAdministradores(prev => prev.filter(admin => admin.id !== id));
      return response;
    } catch (err) {
      console.error('Erro ao deletar administrador:', err);
      throw err;
    }
  };

  // Atualizar último acesso
  const atualizarUltimoAcesso = async (id: number) => {
    try {
      const response = await makeRequest(`/configuracoes/administradores/${id}/ultimo-acesso`, { 
        method: 'PUT'
      });
      return response;
    } catch (err) {
      console.error('Erro ao atualizar último acesso:', err);
      throw err;
    }
  };

  // Validar código do operador
  const validarCodigoOperador = async (id: number, codigo: string) => {
    try {
      const response = await makeRequest(`/configuracoes/administradores/${id}/validar-codigo`, {
        method: 'POST',
        body: { codigo }
      });
      return response;
    } catch (err) {
      console.error('Erro ao validar código do operador:', err);
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
    pixConfiguracao,
    dadosBancarios,
    administradores,
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
    deletarParcela,
    buscarPixConfiguracao,
    buscarDadosBancarios,
    salvarPixConfiguracao,
    salvarDadosBancarios,
    deletarPixConfiguracao,
    deletarDadosBancarios,
    buscarAdministradores,
    buscarAdministrador,
    criarAdministrador,
    atualizarAdministrador,
    deletarAdministrador,
    atualizarUltimoAcesso,
    validarCodigoOperador
  };
};
