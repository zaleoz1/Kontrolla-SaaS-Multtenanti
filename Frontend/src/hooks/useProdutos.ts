import { useState, useCallback, useEffect } from 'react';
import { useCrudApi, useApi } from './useApi';
import { API_ENDPOINTS } from '@/config/api';

export interface Produto {
  id: number;
  tenant_id: number;
  categoria_id?: number;
  nome: string;
  descricao?: string;
  codigo_barras?: string;
  sku?: string;
  preco: number;
  preco_promocional?: number;
  estoque: number;
  estoque_minimo: number;
  peso?: number;
  largura?: number;
  altura?: number;
  comprimento?: number;
  fornecedor?: string;
  marca?: string;
  modelo?: string;
  garantia?: string;
  status: 'ativo' | 'inativo' | 'rascunho';
  destaque: boolean;
  imagens?: any[];
  data_criacao: string;
  data_atualizacao: string;
  categoria_nome?: string;
}

interface ProdutosResponse {
  produtos: Produto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

interface ProdutoResponse {
  produto: Produto;
}

export function useProdutos() {
  const api = useCrudApi<ProdutosResponse>(API_ENDPOINTS.PRODUCTS.LIST);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });

  const buscarProdutos = useCallback(async (params?: {
    page?: number;
    limit?: number;
    q?: string;
    categoria_id?: string;
    status?: string;
  }) => {
    try {
      const response = await api.list(params);
      setProdutos(response.produtos);
      setPagination(response.pagination);
      return response;
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      throw error;
    }
  }, [api]);

  const buscarProduto = useCallback(async (id: number) => {
    try {
      const response = await api.get(id);
      return response.produto;
    } catch (error) {
      console.error('Erro ao buscar produto:', error);
      throw error;
    }
  }, [api]);

  const criarProduto = useCallback(async (dados: Partial<Produto>) => {
    try {
      const response = await api.create(dados);
      // Atualizar lista local
      await buscarProdutos();
      return response.produto;
    } catch (error) {
      console.error('Erro ao criar produto:', error);
      throw error;
    }
  }, [api, buscarProdutos]);

  const atualizarProduto = useCallback(async (id: number, dados: Partial<Produto>) => {
    try {
      const response = await api.update(id, dados);
      // Atualizar lista local
      await buscarProdutos();
      return response.produto;
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
      throw error;
    }
  }, [api, buscarProdutos]);

  const deletarProduto = useCallback(async (id: number) => {
    try {
      await api.remove(id);
      // Atualizar lista local
      await buscarProdutos();
    } catch (error) {
      console.error('Erro ao deletar produto:', error);
      throw error;
    }
  }, [api, buscarProdutos]);

  // Remover carregamento automático para evitar conflitos

  return {
    produtos,
    pagination,
    loading: api.loading,
    error: api.error,
    buscarProdutos,
    buscarProduto,
    criarProduto,
    atualizarProduto,
    deletarProduto,
  };
}

// Hook para busca de produtos com debounce
export function useBuscaProdutos() {
  const [termoBusca, setTermoBusca] = useState('');
  const [produtosFiltrados, setProdutosFiltrados] = useState<Produto[]>([]);
  const [carregando, setCarregando] = useState(false);
  const { buscarProdutos } = useProdutos();

  const buscar = useCallback(async (termo: string) => {
    setCarregando(true);
    try {
      const response = await buscarProdutos({
        q: termo,
        limit: 20,
        status: 'ativo'
      });
      setProdutosFiltrados(response.produtos);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      setProdutosFiltrados([]);
    } finally {
      setCarregando(false);
    }
  }, [buscarProdutos]);

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
  }, [buscar]);

  return {
    termoBusca,
    setTermoBusca,
    produtosFiltrados,
    carregando,
  };
}

// Hook para busca por código de barras
export function useBuscaCodigoBarras() {
  const [carregando, setCarregando] = useState(false);
  const { makeRequest } = useApi();

  const buscarPorCodigo = useCallback(async (codigo: string): Promise<Produto | null> => {
    if (!codigo.trim()) return null;

    setCarregando(true);
    try {
      const response = await makeRequest(API_ENDPOINTS.CATALOG.SEARCH_BARCODE(codigo));
      return response.produto;
    } catch (error) {
      console.error('Erro ao buscar produto por código de barras:', error);
      return null;
    } finally {
      setCarregando(false);
    }
  }, [makeRequest]);

  return {
    buscarPorCodigo,
    carregando,
  };
}
