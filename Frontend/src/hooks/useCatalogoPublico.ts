import { useState, useEffect } from 'react';

interface Produto {
  id: number;
  nome: string;
  descricao?: string;
  preco: number;
  preco_promocional?: number;
  estoque: number;
  imagens?: string[];
  destaque: boolean;
  codigo_barras?: string;
  sku?: string;
  categoria_nome?: string;
}

interface Categoria {
  id: number;
  nome: string;
  descricao?: string;
  total_produtos: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface Filtros {
  page?: number;
  limit?: number;
  q?: string;
  categoria_id?: string;
  preco_min?: string;
  preco_max?: string;
}

export const useCatalogoPublico = () => {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });

  const API_BASE_URL = import.meta.env.VITE_API_URL || 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
      ? 'http://localhost:3000/api' 
      : `${window.location.protocol}//${window.location.host}/api`);

  const buscarProdutos = async (filtros: Filtros = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: String(filtros.page || 1),
        limit: String(filtros.limit || 12),
        ...(filtros.q && { q: filtros.q }),
        ...(filtros.categoria_id && { categoria_id: filtros.categoria_id }),
        ...(filtros.preco_min && { preco_min: filtros.preco_min }),
        ...(filtros.preco_max && { preco_max: filtros.preco_max })
      });

      const response = await fetch(`${API_BASE_URL}/catalogo/produtos?${params}`);
      
      if (!response.ok) {
        throw new Error('Erro ao carregar produtos');
      }

      const data = await response.json();
      setProdutos(data.produtos || []);
      setPagination(data.pagination || {
        page: 1,
        limit: 12,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('Erro ao buscar produtos:', err);
    } finally {
      setLoading(false);
    }
  };

  const buscarCategorias = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/catalogo/categorias`);
      
      if (!response.ok) {
        throw new Error('Erro ao carregar categorias');
      }

      const data = await response.json();
      setCategorias(data.categorias || []);
    } catch (err) {
      console.error('Erro ao buscar categorias:', err);
    }
  };

  const buscarProdutoPorId = async (id: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/catalogo/produtos/${id}`);
      
      if (!response.ok) {
        throw new Error('Produto não encontrado');
      }

      const data = await response.json();
      return data.produto;
    } catch (err) {
      console.error('Erro ao buscar produto:', err);
      throw err;
    }
  };

  const buscarProdutosDestaque = async (limit: number = 8) => {
    try {
      const response = await fetch(`${API_BASE_URL}/catalogo/destaques?limit=${limit}`);
      
      if (!response.ok) {
        throw new Error('Erro ao carregar produtos em destaque');
      }

      const data = await response.json();
      return data.produtos || [];
    } catch (err) {
      console.error('Erro ao buscar produtos em destaque:', err);
      return [];
    }
  };

  const buscarProdutosRelacionados = async (produtoId: number, limit: number = 4) => {
    try {
      const response = await fetch(`${API_BASE_URL}/catalogo/produtos/${produtoId}/relacionados?limit=${limit}`);
      
      if (!response.ok) {
        throw new Error('Erro ao carregar produtos relacionados');
      }

      const data = await response.json();
      return data.produtos || [];
    } catch (err) {
      console.error('Erro ao buscar produtos relacionados:', err);
      return [];
    }
  };

  const buscarProdutoPorCodigoBarras = async (codigo: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/catalogo/buscar/codigo-barras/${codigo}`);
      
      if (!response.ok) {
        throw new Error('Produto não encontrado');
      }

      const data = await response.json();
      return data.produto;
    } catch (err) {
      console.error('Erro ao buscar produto por código de barras:', err);
      throw err;
    }
  };

  return {
    produtos,
    categorias,
    loading,
    error,
    pagination,
    buscarProdutos,
    buscarCategorias,
    buscarProdutoPorId,
    buscarProdutosDestaque,
    buscarProdutosRelacionados,
    buscarProdutoPorCodigoBarras
  };
};
