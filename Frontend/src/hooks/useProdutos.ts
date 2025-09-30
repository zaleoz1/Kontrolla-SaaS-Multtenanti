import { useState, useEffect } from 'react';
import { useApi } from './useApi';

export interface Produto {
  id?: number;
  nome: string;
  descricao?: string;
  categoria_id?: number;
  categoria_nome?: string;
  preco: number;
  preco_promocional?: number;
  tipo_preco: 'unidade' | 'kg' | 'litros';
  codigo_barras?: string;
  sku?: string;
  estoque: number;
  estoque_minimo: number;
  fornecedor_id?: number;
  marca?: string;
  modelo?: string;
  status: 'ativo' | 'inativo' | 'rascunho';
  destaque: boolean;
  imagens: string[];
  data_criacao?: string;
  data_atualizacao?: string;
}

interface Categoria {
  id: number;
  nome: string;
  descricao: string;
}

interface Fornecedor {
  id: number;
  nome: string;
  razao_social?: string;
  cnpj?: string;
  email?: string;
  telefone?: string;
  status: string;
}

export const useProdutos = () => {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { makeRequest } = useApi();

  // Buscar produtos
  const buscarProdutos = async (filtros?: { 
    page?: number; 
    limit?: number; 
    q?: string; 
    status?: string; 
    categoria_id?: string; 
  }) => {
    try {
      const params = new URLSearchParams();
      if (filtros?.page) params.append('page', filtros.page.toString());
      if (filtros?.limit) params.append('limit', filtros.limit.toString());
      if (filtros?.q) params.append('q', filtros.q);
      if (filtros?.status) params.append('status', filtros.status);
      if (filtros?.categoria_id) params.append('categoria_id', filtros.categoria_id);
      
      const queryString = params.toString();
      const url = queryString ? `/produtos?${queryString}` : '/produtos';
      
      const response = await makeRequest(url, { method: 'GET' });
      if (response.produtos) {
        setProdutos(response.produtos);
        return response;
      }
    } catch (err) {
      console.error('Erro ao buscar produtos:', err);
      setError('Erro ao carregar produtos');
      throw err;
    }
  };

  // Buscar produto por ID
  const buscarProduto = async (id: number) => {
    try {
      const response = await makeRequest(`/produtos/${id}`, { method: 'GET' });
      return response.produto;
    } catch (err) {
      console.error('Erro ao buscar produto:', err);
      throw err;
    }
  };

  // Criar produto
  const criarProduto = async (dados: Omit<Produto, 'id'>) => {
    try {
      // Garantir que estoque e estoque_minimo sejam sempre inteiros
      const dadosProcessados = {
        ...dados,
        estoque: Math.round(dados.estoque || 0),
        estoque_minimo: Math.round(dados.estoque_minimo || 0)
      };

      const response = await makeRequest('/produtos', {
        method: 'POST',
        body: dadosProcessados
      });
      
      if (response.produto) {
        setProdutos(prev => [response.produto, ...prev]);
      }
      
      return response;
    } catch (err) {
      console.error('Erro ao criar produto:', err);
      throw err;
    }
  };

  // Atualizar produto
  const atualizarProduto = async (id: number, dados: Partial<Produto>) => {
    try {
      // Garantir que estoque e estoque_minimo sejam sempre inteiros
      const dadosProcessados = {
        ...dados,
        estoque: dados.estoque !== undefined ? Math.round(dados.estoque) : undefined,
        estoque_minimo: dados.estoque_minimo !== undefined ? Math.round(dados.estoque_minimo) : undefined
      };

      const response = await makeRequest(`/produtos/${id}`, {
        method: 'PUT',
        body: dadosProcessados
      });
      
      if (response.produto) {
        setProdutos(prev => 
          prev.map(produto => produto.id === id ? response.produto : produto)
        );
      }
      
      return response;
    } catch (err) {
      console.error('Erro ao atualizar produto:', err);
      throw err;
    }
  };

  // Deletar produto
  const deletarProduto = async (id: number) => {
    try {
      const response = await makeRequest(`/produtos/${id}`, {
        method: 'DELETE'
      });
      
      setProdutos(prev => prev.filter(produto => produto.id !== id));
      return response;
    } catch (err) {
      console.error('Erro ao deletar produto:', err);
      throw err;
    }
  };

  // Buscar categorias
  const buscarCategorias = async () => {
    try {
      const response = await makeRequest('/catalogo/categorias', { method: 'GET' });
      if (response.categorias) {
        setCategorias(response.categorias);
        return response.categorias;
      }
    } catch (err) {
      console.error('Erro ao buscar categorias:', err);
      throw err;
    }
  };

  // Buscar fornecedores
  const buscarFornecedores = async () => {
    try {
      const response = await makeRequest('/fornecedores', { method: 'GET' });
      if (response.data) {
        setFornecedores(response.data);
        return response.data;
      }
    } catch (err) {
      console.error('Erro ao buscar fornecedores:', err);
      throw err;
    }
  };

  // Upload de imagens de produto (Base64) - Cloudinary
  const uploadImagensProduto = async (files: File[]) => {
    return new Promise<string[]>((resolve, reject) => {
      const promises = files.map(file => {
        return new Promise<string>((resolveFile, rejectFile) => {
          const reader = new FileReader();
          
          reader.onload = (e) => {
            const base64String = e.target?.result as string;
            resolveFile(base64String);
          };
          
          reader.onerror = () => {
            rejectFile(new Error('Erro ao ler o arquivo'));
          };
          
          reader.readAsDataURL(file);
        });
      });

      Promise.all(promises)
        .then(resolve)
        .catch(reject);
    });
  };

  // Redimensionar imagem
  const redimensionarImagem = (file: File, maxWidth: number = 800, maxHeight: number = 800, quality: number = 0.8): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calcular novas dimensões mantendo proporção
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }
        
        // Configurar canvas
        canvas.width = width;
        canvas.height = height;
        
        // Desenhar imagem redimensionada
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Converter para base64
        const dataURL = canvas.toDataURL('image/jpeg', quality);
        resolve(dataURL);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  // Processar imagens para upload
  const processarImagens = async (files: File[]) => {
    try {
      const promises = files.map(file => {
        // Validar tipo de arquivo
        if (!file.type.startsWith('image/')) {
          throw new Error(`Arquivo ${file.name} não é uma imagem válida`);
        }
        
        // Validar tamanho (máximo 5MB)
        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`Arquivo ${file.name} é muito grande. Máximo 5MB`);
        }
        
        return redimensionarImagem(file);
      });

      const resizedImages = await Promise.all(promises);
      return resizedImages;
    } catch (error) {
      console.error('Erro ao processar imagens:', error);
      throw error;
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
        buscarFornecedores()
      ]);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setError('Erro ao carregar dados');
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
    fornecedores,
    loading,
    error,
    buscarProdutos,
    buscarProduto,
    criarProduto,
    atualizarProduto,
    deletarProduto,
    buscarCategorias,
    buscarFornecedores,
    uploadImagensProduto,
    processarImagens,
    carregarDados
  };
};