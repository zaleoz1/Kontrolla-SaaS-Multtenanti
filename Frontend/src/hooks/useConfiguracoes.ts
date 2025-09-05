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

export const useConfiguracoes = () => {
  const [dadosConta, setDadosConta] = useState<DadosConta | null>(null);
  const [dadosTenant, setDadosTenant] = useState<DadosTenant | null>(null);
  const [configuracoes, setConfiguracoes] = useState<ConfiguracoesSistema | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { makeRequest } = useApi();

  // Estados locais para edição
  const [dadosContaEditando, setDadosContaEditando] = useState<DadosConta | null>(null);
  const [dadosTenantEditando, setDadosTenantEditando] = useState<DadosTenant | null>(null);
  const [configuracoesEditando, setConfiguracoesEditando] = useState<ConfiguracoesSistema | null>(null);

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

  // Carregar todos os dados
  const carregarDados = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const user = await buscarDadosUsuario();
      
      if (user && user.tenant_id) {
        // Buscar dados do tenant e configurações após obter dados do usuário
        const [tenant, config] = await Promise.all([
          buscarDadosTenant(user.tenant_id),
          buscarConfiguracoes(user.tenant_id)
        ]);
        
        // Sincronizar estados de edição
        if (tenant) {
          setDadosTenantEditando(tenant);
        }
        if (config) {
          setConfiguracoesEditando(config);
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

  // Sincronizar estados de edição com dados originais
  useEffect(() => {
    if (dadosConta) {
      setDadosContaEditando(dadosConta);
    }
  }, [dadosConta]);

  // Carregar dados quando o componente for montado
  useEffect(() => {
    carregarDados();
  }, []);

  return {
    dadosConta,
    dadosTenant,
    configuracoes,
    dadosContaEditando,
    dadosTenantEditando,
    configuracoesEditando,
    setDadosContaEditando,
    setDadosTenantEditando,
    setConfiguracoesEditando,
    loading,
    error,
    carregarDados,
    atualizarDadosConta,
    atualizarDadosTenant,
    atualizarConfiguracoes,
    alterarSenha,
    uploadAvatar,
    uploadLogo
  };
};
