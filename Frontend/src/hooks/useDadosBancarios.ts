import { useState, useEffect } from 'react';
import { useApi } from './useApi';

interface DadosBancarios {
  id: number;
  banco: string;
  agencia: string;
  conta: string;
  digito: string;
  tipo_conta: 'corrente' | 'poupanca';
  nome_titular: string;
  cpf_cnpj: string;
  ativo: boolean;
}

export function useDadosBancarios() {
  const [dadosBancarios, setDadosBancarios] = useState<DadosBancarios | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { makeRequest } = useApi();

  const buscarDadosBancarios = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await makeRequest('/configuracoes/dados-bancarios', {
        method: 'GET',
      });

      // A API retorna { dadosBancarios: dados } ou { dadosBancarios: null }
      setDadosBancarios(data.dadosBancarios);
    } catch (err: any) {
      console.error('❌ Erro ao buscar dados bancários:', err);
      setError(err.message || 'Erro ao buscar dados bancários');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    buscarDadosBancarios();
  }, []);

  return {
    dadosBancarios,
    loading,
    error,
    buscarDadosBancarios
  };
}
