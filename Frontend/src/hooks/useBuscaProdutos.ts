import { useState, useCallback, useEffect } from 'react';
import { useApi } from './useApi';
import { API_ENDPOINTS } from '@/config/api';
import { Produto } from './useProdutos';

export function useBuscaProdutos() {
  const [termoBusca, setTermoBusca] = useState('');
  const [produtosFiltrados, setProdutosFiltrados] = useState<Produto[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [carregandoInicial, setCarregandoInicial] = useState(true);
  const { makeRequest } = useApi();

  const buscar = useCallback(async (termo: string) => {
    setCarregando(true);
    if (termo === '') {
      setCarregandoInicial(true);
    }
    
    try {
      const response = await makeRequest(`${API_ENDPOINTS.CATALOG.PRODUCTS}?limit=10000`, {
        method: 'GET',
        body: undefined,
      });
      
      // Filtrar produtos localmente se houver termo de busca
      let produtos = response.produtos || [];
      if (termo.trim()) {
        produtos = produtos.filter((produto: Produto) => 
          produto.nome.toLowerCase().includes(termo.toLowerCase()) ||
          produto.codigo_barras?.toLowerCase().includes(termo.toLowerCase()) ||
          produto.categoria_nome?.toLowerCase().includes(termo.toLowerCase())
        );
      }
      
      setProdutosFiltrados(produtos);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      setProdutosFiltrados([]);
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

  // Carregar produtos iniciais quando o componente monta
  useEffect(() => {
    buscar('');
  }, []);

  return {
    termoBusca,
    setTermoBusca,
    produtosFiltrados,
    carregando: carregando || carregandoInicial,
  };
}
