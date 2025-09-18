import { useState, useEffect, useCallback } from 'react';
import { useApi } from './useApi';

interface PixConfiguracao {
  id: number;
  tenant_id: number;
  chave_pix: string;
  qr_code: string;
  nome_titular: string;
  cpf_cnpj: string;
  ativo: boolean;
  data_criacao: string;
  data_atualizacao: string;
}

export function usePixConfiguracoes() {
  const [configuracao, setConfiguracao] = useState<PixConfiguracao | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { makeRequest } = useApi();

  const buscarConfiguracaoPix = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Verificar se há token de autenticação
      const token = localStorage.getItem('token');
      if (!token) {
        setConfiguracao(null);
        setLoading(false);
        return;
      }
      
      const response = await makeRequest('/configuracoes/pix');
      
      if (response && response.pix) {
        setConfiguracao(response.pix);
      } else {
        setConfiguracao(null);
      }
    } catch (err: any) {
      console.error('Erro ao buscar configuração PIX:', err);
      setError(err.message || 'Erro ao buscar configuração PIX');
      setConfiguracao(null);
    } finally {
      setLoading(false);
    }
  }, [makeRequest]);

  useEffect(() => {
    buscarConfiguracaoPix();
  }, [buscarConfiguracaoPix]);

  return {
    configuracao,
    loading,
    error,
    refetch: buscarConfiguracaoPix
  };
}
