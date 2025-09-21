import { useState, useCallback, useEffect } from 'react';
import { useApi } from './useApi';
import { API_ENDPOINTS } from '@/config/api';
import { Fornecedor } from './useFornecedores';

export function useBuscaFornecedores() {
  const [termoBusca, setTermoBusca] = useState('');
  const [fornecedoresFiltrados, setFornecedoresFiltrados] = useState<Fornecedor[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [carregandoInicial, setCarregandoInicial] = useState(true);
  const { makeRequest } = useApi();

  const buscar = useCallback(async (termo: string) => {
    setCarregando(true);
    if (termo === '') {
      setCarregandoInicial(true);
    }
    
    try {
      const response = await makeRequest(API_ENDPOINTS.FORNECEDORES.LIST, {
        method: 'GET',
        body: undefined,
      });
      
      // Filtrar fornecedores localmente se houver termo de busca
      let fornecedores = response.fornecedores || response.data || [];
      if (termo.trim()) {
        fornecedores = fornecedores.filter((fornecedor: Fornecedor) => 
          fornecedor.nome.toLowerCase().includes(termo.toLowerCase()) ||
          fornecedor.razao_social?.toLowerCase().includes(termo.toLowerCase()) ||
          fornecedor.cnpj?.toLowerCase().includes(termo.toLowerCase()) ||
          fornecedor.email?.toLowerCase().includes(termo.toLowerCase())
        );
      }
      
      setFornecedoresFiltrados(fornecedores);
    } catch (error) {
      console.error('Erro ao buscar fornecedores:', error);
      setFornecedoresFiltrados([]);
    } finally {
      setCarregando(false);
      setCarregandoInicial(false);
    }
  }, [makeRequest]);

  // Debounce da busca
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      buscar(termoBusca);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [termoBusca, buscar]);

  // Carregar fornecedores iniciais quando o componente monta
  useEffect(() => {
    buscar('');
  }, []);

  return {
    termoBusca,
    setTermoBusca,
    termoBuscaFornecedor: termoBusca,
    setTermoBuscaFornecedor: setTermoBusca,
    fornecedoresFiltrados,
    carregando: carregando || carregandoInicial,
  };
}
