import { useState, useCallback } from 'react';
import { useApi } from './useApi';

// Interface para itens da NF-e
export interface NfeItem {
  id?: number;
  nfe_id?: number;
  produto_id: number;
  produto_nome?: string;
  codigo_barras?: string;
  sku?: string;
  quantidade: number;
  preco_unitario: number;
  preco_total: number;
}

// Interface para NF-e
export interface Nfe {
  id: number;
  numero: string;
  serie: string;
  chave_acesso?: string;
  cliente_id?: number;
  cliente_nome?: string;
  cliente_cnpj_cpf?: string;
  cnpj_cpf?: string;
  venda_id?: number;
  data_emissao: string;
  valor_total: number;
  status: 'pendente' | 'autorizada' | 'cancelada' | 'erro' | 'processando';
  ambiente: 'homologacao' | 'producao';
  // Campos de integração Focus NFe
  focus_nfe_ref?: string;
  protocolo?: string;
  motivo_status?: string;
  data_autorizacao?: string;
  protocolo_cancelamento?: string;
  data_cancelamento?: string;
  xml_path?: string;
  pdf_path?: string;
  observacoes?: string;
  itens?: NfeItem[];
  data_criacao: string;
  data_atualizacao: string;
}

// Interface para configurações da Focus NFe
export interface FocusNfeConfig {
  // Token Principal (Master) - Fixo no backend (.env)
  token_principal_configurado: boolean;
  // Tokens separados por ambiente - Configuráveis pelo usuário
  token_homologacao_configurado: boolean;
  token_homologacao_masked?: string;
  token_homologacao?: string; // Token completo
  token_producao_configurado: boolean;
  token_producao_masked?: string;
  token_producao?: string; // Token completo
  // Compatibilidade com versões anteriores
  token_configurado: boolean;
  token_masked?: string;
  // Configurações gerais
  ambiente: 'homologacao' | 'producao';
  serie_padrao: string;
  natureza_operacao: string;
  regime_tributario: string;
  cnpj_emitente: string;
  inscricao_estadual: string;
  informacoes_complementares?: string;
  /** Próximo número da NF-e (quando SEFAZ já tem números à frente; deixe vazio para automático) */
  proximo_numero?: string;
}

// Interface para resultado de validação de configurações
export interface FocusNfeValidacao {
  valid: boolean;
  errors: string[];
  config: {
    token_configurado: boolean;
    ambiente: string;
    cnpj_emitente: string;
    inscricao_estadual: string;
    serie_padrao: string;
    natureza_operacao: string;
    regime_tributario: string;
  };
}

// Interface para estatísticas de NF-e
export interface NfeStats {
  total_nfe: number;
  nfe_autorizadas: number;
  nfe_pendentes: number;
  nfe_canceladas: number;
  nfe_erro: number;
  valor_total_autorizado: number;
}

// Interface para filtros de NF-e
export interface NfeFilters {
  page?: number;
  limit?: number;
  q?: string;
  status?: string;
  data_inicio?: string;
  data_fim?: string;
}

// Interface para resposta de listagem
export interface NfeResponse {
  nfes: Nfe[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Interface para criação de NF-e
export interface NfeCreate {
  venda_id?: number;
  cliente_id?: number;
  cnpj_cpf?: string;
  itens: {
    produto_id: number;
    quantidade: number;
    preco_unitario: number;
  }[];
  observacoes?: string;
}

export function useNfe() {
  const { makeRequest } = useApi();
  const [nfes, setNfes] = useState<Nfe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<NfeStats | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });

  // Buscar lista de NF-e
  const fetchNfes = useCallback(async (filters: NfeFilters = {}) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.q) params.append('q', filters.q);
      if (filters.status) params.append('status', filters.status);
      if (filters.data_inicio) params.append('data_inicio', filters.data_inicio);
      if (filters.data_fim) params.append('data_fim', filters.data_fim);

      const response = await makeRequest(`/nfe?${params.toString()}`) as NfeResponse;
      
      setNfes(response.nfes);
      setPagination(response.pagination);
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar NF-e');
      console.error('Erro ao buscar NF-e:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [makeRequest]);

  // Buscar NF-e por ID
  const fetchNfe = useCallback(async (id: number): Promise<Nfe | null> => {
    try {
      setLoading(true);
      setError(null);

      const response = await makeRequest(`/nfe/${id}`) as { nfe: Nfe };
      return response.nfe;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar NF-e');
      console.error('Erro ao buscar NF-e:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [makeRequest]);

  // Criar nova NF-e
  const createNfe = useCallback(async (dados: NfeCreate): Promise<Nfe> => {
    try {
      setLoading(true);
      setError(null);

      const response = await makeRequest('/nfe', {
        method: 'POST',
        body: dados
      }) as { nfe: Nfe; message: string };

      // Atualizar lista
      await fetchNfes({ page: pagination.page, limit: pagination.limit });

      return response.nfe;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar NF-e');
      console.error('Erro ao criar NF-e:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [makeRequest, fetchNfes, pagination.page, pagination.limit]);

  // Atualizar status da NF-e
  const updateNfeStatus = useCallback(async (id: number, status: Nfe['status'], chave_acesso?: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      await makeRequest(`/nfe/${id}/status`, {
        method: 'PATCH',
        body: { status, chave_acesso }
      });

      // Atualizar lista
      await fetchNfes({ page: pagination.page, limit: pagination.limit });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar status da NF-e');
      console.error('Erro ao atualizar status da NF-e:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [makeRequest, fetchNfes, pagination.page, pagination.limit]);

  // Marcar NF-e como autorizada (POST dedicado; evita "failed to fetch" com PATCH em alguns ambientes)
  const marcarNfeComoAutorizada = useCallback(async (id: number, chave_acesso?: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await makeRequest(`/nfe/${id}/marcar-autorizada`, {
        method: 'POST',
        body: chave_acesso ? { chave_acesso: chave_acesso.trim() } : {}
      });
      await fetchNfes({ page: pagination.page, limit: pagination.limit });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao marcar NF-e como autorizada');
      console.error('Erro ao marcar NF-e como autorizada:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [makeRequest, fetchNfes, pagination.page, pagination.limit]);

  // Deletar NF-e
  const deleteNfe = useCallback(async (id: number): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      await makeRequest(`/nfe/${id}`, {
        method: 'DELETE'
      });

      // Atualizar lista
      await fetchNfes({ page: pagination.page, limit: pagination.limit });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar NF-e');
      console.error('Erro ao deletar NF-e:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [makeRequest, fetchNfes, pagination.page, pagination.limit]);

  // Buscar estatísticas
  const fetchStats = useCallback(async (periodo: 'hoje' | 'semana' | 'mes' | 'ano' = 'mes'): Promise<NfeStats | null> => {
    try {
      setLoading(true);
      setError(null);

      const response = await makeRequest(`/nfe/stats/overview?periodo=${periodo}`) as { stats: NfeStats; periodo: string };
      setStats(response.stats);
      return response.stats;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar estatísticas');
      console.error('Erro ao buscar estatísticas:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [makeRequest]);

  // Formatar valor monetário
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Formatar data
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  // Formatar data e hora
  const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR');
  };

  // Obter label do status
  const getStatusLabel = (status: Nfe['status']): string => {
    const labels: Record<Nfe['status'], string> = {
      pendente: 'Pendente',
      processando: 'Processando',
      autorizada: 'Autorizada',
      cancelada: 'Cancelada',
      erro: 'Erro'
    };
    return labels[status] || 'Desconhecido';
  };

  // Obter cor do badge de status
  const getStatusBadgeClass = (status: Nfe['status']): string => {
    const classes: Record<Nfe['status'], string> = {
      autorizada: 'bg-success hover:bg-success/90',
      pendente: 'bg-warning/80 text-warning-foreground',
      processando: 'bg-blue-500/80 text-white',
      cancelada: 'bg-secondary',
      erro: 'bg-destructive'
    };
    return classes[status] || 'bg-secondary';
  };

  // Obter cor do ícone de status
  const getStatusIconClass = (status: Nfe['status']): string => {
    const classes: Record<Nfe['status'], string> = {
      autorizada: 'text-success',
      pendente: 'text-warning',
      processando: 'text-blue-500',
      cancelada: 'text-muted-foreground',
      erro: 'text-destructive'
    };
    return classes[status] || 'text-muted-foreground';
  };

  // Transmitir NF-e para SEFAZ via Focus NFe
  const transmitirNfe = useCallback(async (id: number): Promise<{
    success: boolean;
    status: string;
    protocolo?: string;
    chave_acesso?: string;
    mensagem?: string;
  }> => {
    try {
      setLoading(true);
      setError(null);

      const response = await makeRequest(`/nfe/${id}/emitir`, {
        method: 'POST'
      }) as {
        success: boolean;
        status: string;
        protocolo?: string;
        chave_acesso?: string;
        mensagem?: string;
        message?: string;
      };

      // Atualizar lista
      await fetchNfes({ page: pagination.page, limit: pagination.limit });

      return {
        success: response.success,
        status: response.status,
        protocolo: response.protocolo,
        chave_acesso: response.chave_acesso,
        mensagem: response.mensagem || response.message
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao transmitir NF-e');
      console.error('Erro ao transmitir NF-e:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [makeRequest, fetchNfes, pagination.page, pagination.limit]);

  // Consultar status da NF-e na SEFAZ
  const consultarNfeSefaz = useCallback(async (id: number): Promise<{
    status: string;
    status_sefaz?: string;
    mensagem_sefaz?: string;
    protocolo?: string;
    chave_acesso?: string;
    caminho_xml?: string;
    caminho_danfe?: string;
  }> => {
    try {
      setLoading(true);
      setError(null);

      const response = await makeRequest(`/nfe/${id}/consultar`) as {
        status: string;
        status_sefaz?: string;
        mensagem_sefaz?: string;
        protocolo?: string;
        chave_acesso?: string;
        caminho_xml?: string;
        caminho_danfe?: string;
      };

      // Atualizar lista
      await fetchNfes({ page: pagination.page, limit: pagination.limit });

      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao consultar NF-e');
      console.error('Erro ao consultar NF-e:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [makeRequest, fetchNfes, pagination.page, pagination.limit]);

  // Cancelar NF-e na SEFAZ
  const cancelarNfe = useCallback(async (id: number, justificativa: string): Promise<{
    success: boolean;
    status: string;
    protocolo?: string;
    mensagem?: string;
  }> => {
    try {
      setLoading(true);
      setError(null);

      const response = await makeRequest(`/nfe/${id}/cancelar`, {
        method: 'POST',
        body: { justificativa }
      }) as {
        success: boolean;
        status: string;
        protocolo?: string;
        mensagem?: string;
      };

      // Atualizar lista
      await fetchNfes({ page: pagination.page, limit: pagination.limit });

      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao cancelar NF-e');
      console.error('Erro ao cancelar NF-e:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [makeRequest, fetchNfes, pagination.page, pagination.limit]);

  // Reprocessar NF-e com erro
  const reprocessarNfe = useCallback(async (id: number): Promise<{
    success: boolean;
    status: string;
    protocolo?: string;
    chave_acesso?: string;
    mensagem?: string;
  }> => {
    try {
      setLoading(true);
      setError(null);

      const response = await makeRequest(`/nfe/${id}/reprocessar`, {
        method: 'POST'
      }) as {
        success: boolean;
        status: string;
        protocolo?: string;
        chave_acesso?: string;
        mensagem?: string;
      };

      // Atualizar lista
      await fetchNfes({ page: pagination.page, limit: pagination.limit });

      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao reprocessar NF-e');
      console.error('Erro ao reprocessar NF-e:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [makeRequest, fetchNfes, pagination.page, pagination.limit]);

  // Download XML da NF-e
  const downloadXml = useCallback(async (id: number, numero: string, chaveAcesso?: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      // Obter token para autenticação
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }

      // Importar configuração da API
      const { API_CONFIG } = await import('@/config/api');
      
      // Fazer requisição fetch diretamente para ter controle total sobre o blob
      const response = await fetch(`${API_CONFIG.BASE_URL}/nfe/${id}/xml`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro ao baixar XML' }));
        throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
      }

      // Verificar o tipo de conteúdo
      const contentType = response.headers.get('Content-Type') || '';
      
      // Sempre obter como texto primeiro para garantir encoding UTF-8 correto
      const xmlText = await response.text();
      
      // Verificar se o XML começa corretamente (remover BOM se existir)
      const cleanXml = xmlText.replace(/^\uFEFF/, '').trim();
      
      // Verificar se é um XML válido
      if (!cleanXml.startsWith('<?xml') && !cleanXml.startsWith('<nfeProc') && !cleanXml.startsWith('<NFe')) {
        throw new Error('Arquivo não é um XML válido de NF-e');
      }
      
      // Criar blob com encoding UTF-8 explícito
      const blob = new Blob([cleanXml], { 
        type: 'application/xml; charset=utf-8' 
      });
      
      // Obter o nome do arquivo - prioridade: chave de acesso passada, depois headers
      let filename = `nfe_${numero}.xml`;
      
      // Prioridade 1: Chave de acesso passada como parâmetro (mais confiável)
      if (chaveAcesso) {
        filename = `${chaveAcesso}.xml`;
      } else {
        // Prioridade 2: Header customizado X-Filename
        const customFilename = response.headers.get('X-Filename');
        if (customFilename) {
          filename = customFilename;
        } else {
          // Prioridade 3: Content-Disposition header
          const contentDisposition = response.headers.get('Content-Disposition');
          
          if (contentDisposition) {
            // Tentar obter do filename*=UTF-8'' primeiro (formato RFC 5987)
            const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
            if (utf8Match && utf8Match[1]) {
              try {
                filename = decodeURIComponent(utf8Match[1]);
              } catch (e) {
                console.warn('Erro ao decodificar filename UTF-8, tentando formato simples', e);
              }
            }
            
            // Se não encontrou no formato UTF-8, tentar formato simples filename="..."
            if (filename === `nfe_${numero}.xml`) {
              const simpleMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/i);
              if (simpleMatch && simpleMatch[1]) {
                filename = simpleMatch[1].replace(/['"]/g, '').trim();
              }
            }
            
            // Tentar também sem aspas
            if (filename === `nfe_${numero}.xml`) {
              const noQuotesMatch = contentDisposition.match(/filename=([^;]+)/i);
              if (noQuotesMatch && noQuotesMatch[1]) {
                filename = noQuotesMatch[1].trim();
              }
            }
          }
        }
      }

      // Criar URL do blob e fazer download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      
      // Limpar após um pequeno delay
      setTimeout(() => {
      window.URL.revokeObjectURL(url);
        if (document.body.contains(a)) {
      document.body.removeChild(a);
        }
      }, 100);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao baixar XML');
      console.error('Erro ao baixar XML:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Download DANFE (PDF) da NF-e
  const downloadDanfe = useCallback(async (id: number): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const response = await makeRequest(`/nfe/${id}/danfe`) as {
        url: string;
        filename: string;
      };

      // Abrir a URL do DANFE em uma nova aba
      window.open(response.url, '_blank');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao baixar DANFE');
      console.error('Erro ao baixar DANFE:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [makeRequest]);

  // Buscar configurações da Focus NFe
  const fetchFocusNfeConfig = useCallback(async (): Promise<FocusNfeConfig | null> => {
    try {
      setLoading(true);
      setError(null);

      const response = await makeRequest('/nfe/config/focus-nfe') as { config: FocusNfeConfig };
      return response.config;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar configurações');
      console.error('Erro ao buscar configurações Focus NFe:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [makeRequest]);

  // Salvar configurações da Focus NFe
  const saveFocusNfeConfig = useCallback(async (config: Partial<{
    token: string; // Legado
    token_homologacao: string; // Token para ambiente de homologação
    token_producao: string; // Token para ambiente de produção
    ambiente: 'homologacao' | 'producao';
    serie_padrao: string;
    natureza_operacao: string;
    regime_tributario: string;
    cnpj_emitente: string;
    inscricao_estadual: string;
    informacoes_complementares: string;
    proximo_numero: string;
  }>): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      await makeRequest('/nfe/config/focus-nfe', {
        method: 'POST',
        body: config
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar configurações');
      console.error('Erro ao salvar configurações Focus NFe:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [makeRequest]);

  // Validar configurações da Focus NFe
  const validarFocusNfeConfig = useCallback(async (): Promise<FocusNfeValidacao | null> => {
    try {
      setLoading(true);
      setError(null);

      const response = await makeRequest('/nfe/config/focus-nfe/validar') as FocusNfeValidacao;
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao validar configurações');
      console.error('Erro ao validar configurações Focus NFe:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [makeRequest]);

  return {
    // Estado
    nfes,
    loading,
    error,
    stats,
    pagination,
    
    // CRUD básico
    fetchNfes,
    fetchNfe,
    createNfe,
    updateNfeStatus,
    marcarNfeComoAutorizada,
    deleteNfe,
    fetchStats,
    
    // Integração Focus NFe
    transmitirNfe,
    consultarNfeSefaz,
    cancelarNfe,
    reprocessarNfe,
    downloadXml,
    downloadDanfe,
    
    // Configurações Focus NFe
    fetchFocusNfeConfig,
    saveFocusNfeConfig,
    validarFocusNfeConfig,
    
    // Utilitários
    formatCurrency,
    formatDate,
    formatDateTime,
    getStatusLabel,
    getStatusBadgeClass,
    getStatusIconClass
  };
}

