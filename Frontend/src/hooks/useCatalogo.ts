import { useState, useEffect } from 'react';
import { useApi } from './useApi';

export interface ProdutoCatalogo {
  id: number;
  nome: string;
  descricao?: string;
  preco: number;
  preco_promocional?: number;
  estoque: number;
  imagens: string[];
  destaque: boolean;
  codigo_barras?: string;
  sku?: string;
  categoria_nome?: string;
}

export interface CategoriaCatalogo {
  id: number;
  nome: string;
  descricao?: string;
  total_produtos: number;
}

export interface ConfiguracaoCatalogo {
  publico: boolean;
  url_personalizada?: string;
  tema?: string;
  logo?: string;
  descricao?: string;
}

export interface StatsCatalogo {
  total_produtos: number;
  produtos_ativos: number;
  produtos_destaque: number;
  produtos_com_estoque: number;
  preco_medio: number;
}

export const useCatalogo = () => {
  const [produtos, setProdutos] = useState<ProdutoCatalogo[]>([]);
  const [categorias, setCategorias] = useState<CategoriaCatalogo[]>([]);
  const [configuracoes, setConfiguracoes] = useState<ConfiguracaoCatalogo>({
    publico: true
  });
  const [stats, setStats] = useState<StatsCatalogo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });
  
  const { makeRequest } = useApi();

  // Buscar produtos do catálogo
  const buscarProdutos = async (filtros?: {
    page?: number;
    limit?: number;
    q?: string;
    categoria_id?: string;
    preco_min?: string;
    preco_max?: string;
  }) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (filtros?.page) params.append('page', filtros.page.toString());
      if (filtros?.limit) params.append('limit', filtros.limit.toString());
      if (filtros?.q) params.append('q', filtros.q);
      if (filtros?.categoria_id) params.append('categoria_id', filtros.categoria_id);
      if (filtros?.preco_min) params.append('preco_min', filtros.preco_min);
      if (filtros?.preco_max) params.append('preco_max', filtros.preco_max);
      
      const queryString = params.toString();
      const url = queryString ? `/catalogo/produtos?${queryString}` : '/catalogo/produtos';
      
      const response = await makeRequest(url, { method: 'GET' });
      
      if (response && response.produtos) {
        setProdutos(response.produtos);
        if (response.pagination) {
          setPagination(response.pagination);
        }
      } else {
        setProdutos([]);
      }
      
      return response;
    } catch (err) {
      console.error('Erro ao buscar produtos do catálogo:', err);
      setError('Erro ao carregar produtos do catálogo');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Buscar produto por ID
  const buscarProduto = async (id: number) => {
    try {
      const response = await makeRequest(`/catalogo/produtos/${id}`, { method: 'GET' });
      return response.produto;
    } catch (err) {
      console.error('Erro ao buscar produto:', err);
      throw err;
    }
  };

  // Buscar categorias
  const buscarCategorias = async () => {
    try {
      const response = await makeRequest('/catalogo/categorias', { method: 'GET' });
      if (response.categorias) {
        setCategorias(response.categorias);
      }
      return response.categorias;
    } catch (err) {
      console.error('Erro ao buscar categorias:', err);
      throw err;
    }
  };

  // Buscar produtos em destaque
  const buscarDestaques = async (limit: number = 8) => {
    try {
      const response = await makeRequest(`/catalogo/destaques?limit=${limit}`, { method: 'GET' });
      return response.produtos;
    } catch (err) {
      console.error('Erro ao buscar produtos em destaque:', err);
      throw err;
    }
  };

  // Buscar produtos relacionados
  const buscarRelacionados = async (produtoId: number, limit: number = 4) => {
    try {
      const response = await makeRequest(`/catalogo/produtos/${produtoId}/relacionados?limit=${limit}`, { method: 'GET' });
      return response.produtos;
    } catch (err) {
      console.error('Erro ao buscar produtos relacionados:', err);
      throw err;
    }
  };

  // Buscar produto por código de barras
  const buscarPorCodigoBarras = async (codigo: string) => {
    try {
      const response = await makeRequest(`/catalogo/buscar/codigo-barras/${codigo}`, { method: 'GET' });
      return response.produto;
    } catch (err) {
      console.error('Erro ao buscar produto por código de barras:', err);
      throw err;
    }
  };

  // Buscar estatísticas do catálogo
  const buscarStats = async () => {
    try {
      const response = await makeRequest('/catalogo/stats', { method: 'GET' });
      if (response.produtos) {
        setStats(response.produtos);
      }
      return response;
    } catch (err) {
      console.error('Erro ao buscar estatísticas:', err);
      throw err;
    }
  };

  // Buscar configurações do catálogo
  const buscarConfiguracoes = async () => {
    try {
      const response = await makeRequest('/catalogo/configuracoes', { method: 'GET' });
      if (response.configuracoes) {
        setConfiguracoes(response.configuracoes);
      }
      return response.configuracoes;
    } catch (err) {
      console.error('Erro ao buscar configurações:', err);
      throw err;
    }
  };

  // Atualizar configurações do catálogo
  const atualizarConfiguracoes = async (novasConfiguracoes: Partial<ConfiguracaoCatalogo>) => {
    try {
      const response = await makeRequest('/catalogo/configuracoes', {
        method: 'PUT',
        body: { configuracoes: novasConfiguracoes }
      });
      
      // Atualizar estado local
      setConfiguracoes(prev => ({ ...prev, ...novasConfiguracoes }));
      
      return response;
    } catch (err) {
      console.error('Erro ao atualizar configurações:', err);
      throw err;
    }
  };

  // Carregar dados iniciais
  const carregarDados = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        buscarProdutos(),
        buscarCategorias(),
        buscarConfiguracoes(),
        buscarStats()
      ]);
    } catch (err) {
      console.error('Erro ao carregar dados do catálogo:', err);
      setError('Erro ao carregar dados do catálogo');
    } finally {
      setLoading(false);
    }
  };

  // Carregar dados quando o componente for montado
  useEffect(() => {
    carregarDados();
  }, []);

  return {
    produtos,
    categorias,
    configuracoes,
    stats,
    loading,
    error,
    pagination,
    buscarProdutos,
    buscarProduto,
    buscarCategorias,
    buscarDestaques,
    buscarRelacionados,
    buscarPorCodigoBarras,
    buscarStats,
    buscarConfiguracoes,
    atualizarConfiguracoes,
    carregarDados
  };
};
