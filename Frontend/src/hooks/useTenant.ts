import { useState, useEffect } from 'react';
import { useApi } from './useApi';
import { useAuth } from './useAuth';

export interface Tenant {
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
  data_atualizacao: string;
}

interface TenantResponse {
  tenant: Tenant;
}

export function useTenant(tenantId?: number) {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { makeRequest } = useApi();
  const { user } = useAuth();

  const buscarTenant = async (id: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await makeRequest(`/configuracoes/tenant/${id}`, { 
        method: 'GET' 
      }) as TenantResponse;
      
      if (response.tenant) {
        setTenant(response.tenant);
        return response.tenant;
      } else {
        throw new Error('Dados do tenant não encontrados');
      }
    } catch (err) {
      console.error('Erro ao buscar dados do tenant:', err);
      setError('Erro ao carregar dados da empresa');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Buscar tenant automaticamente se tenantId for fornecido ou se houver usuário autenticado
  useEffect(() => {
    const id = tenantId || user?.tenant_id;
    if (id) {
      buscarTenant(id);
    }
  }, [tenantId, user?.tenant_id]);

  return {
    tenant,
    loading,
    error,
    buscarTenant,
    setTenant
  };
}
