import { useState, useCallback } from 'react';
import { useApi } from './useApi';

// Interface para NF-e importada
export interface NfeImportada {
  id: number;
  tenant_id: number;
  chave_acesso: string;
  numero: string;
  serie: string;
  data_emissao: string;
  valor_total: number;
  emitente_cnpj: string;
  emitente_nome: string;
  emitente_uf: string;
  destinatario_cnpj: string;
  destinatario_nome: string;
  xml_content?: string;
  itens_json?: string;
  itens?: NfeImportadaItem[];
  data_importacao: string;
  status: 'importada' | 'processada' | 'erro';
}

// Interface para itens da NF-e importada
export interface NfeImportadaItem {
  codigo?: string;
  descricao: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  ncm?: string;
  cfop?: string;
  unidade?: string;
}

// Interface para configuração do MeuDanfe
export interface MeuDanfeConfig {
  api_key_configurada: boolean;
  api_key_masked?: string;
}

// Interface para resultado de consulta
export interface ConsultaNfeResult {
  success: boolean;
  status?: string;
  mensagem?: string;
  aguardando?: boolean;
  tipo?: string;
  xml?: string; // XML pode estar no nível raiz da resposta
  nfe?: {
    chave_acesso?: string;
    numero?: string;
    serie?: string;
    data_emissao?: string;
    valor_total?: number | string;
    xml_disponivel?: boolean;
    emitente?: {
      cnpj?: string;
      nome?: string;
      razao_social?: string;
      fantasia?: string;
      uf?: string;
    };
    destinatario?: {
      cnpj?: string;
      cpf?: string;
      nome?: string;
      razao_social?: string;
    };
    itens?: NfeImportadaItem[];
    xml?: string;
  };
  chave_acesso: string;
}

// Interface para estatísticas de uso
export interface MeuDanfeStats {
  total_consultas: number;
  custo_total: number;
  periodo: string;
}

// Interface para paginação
export interface NfeImportadaPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function useMeuDanfe() {
  const { makeRequest } = useApi();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nfesImportadas, setNfesImportadas] = useState<NfeImportada[]>([]);
  const [pagination, setPagination] = useState<NfeImportadaPagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  // ==========================================
  // CONFIGURAÇÕES
  // ==========================================

  /**
   * Buscar configurações do MeuDanfe
   */
  const fetchConfig = useCallback(async (): Promise<MeuDanfeConfig | null> => {
    try {
      setLoading(true);
      setError(null);

      const response = await makeRequest('/meudanfe/config') as { config: MeuDanfeConfig };
      return response.config;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar configurações');
      console.error('Erro ao buscar configurações MeuDanfe:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [makeRequest]);

  /**
   * Validar configurações
   */
  const validarConfig = useCallback(async (): Promise<{ valid: boolean; errors: string[]; config: MeuDanfeConfig } | null> => {
    try {
      setLoading(true);
      setError(null);

      const response = await makeRequest('/meudanfe/config/validar') as { valid: boolean; errors: string[]; config: MeuDanfeConfig };
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao validar configurações');
      console.error('Erro ao validar configurações MeuDanfe:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [makeRequest]);

  // ==========================================
  // CONSULTA DE NF-e
  // ==========================================

  /**
   * Consultar NF-e por chave de acesso
   * ATENÇÃO: Este serviço é PAGO - R$ 0,03 por consulta
   */
  const consultarNfe = useCallback(async (chaveAcesso: string): Promise<ConsultaNfeResult> => {
    try {
      setLoading(true);
      setError(null);

      const response = await makeRequest('/meudanfe/consultar', {
        method: 'POST',
        body: { chave_acesso: chaveAcesso }
      }) as ConsultaNfeResult;

      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao consultar NF-e');
      console.error('Erro ao consultar NF-e:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [makeRequest]);

  /**
   * Download do XML por chave de acesso
   */
  const downloadXml = useCallback(async (chaveAcesso: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      // Fazer requisição autenticada para obter o XML
      const response = await makeRequest(`/meudanfe/xml/${chaveAcesso}`, {
        responseType: 'text'
      }) as string;

      // Criar blob e fazer download
      const blob = new Blob([response], { type: 'application/xml' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nfe_${chaveAcesso}.xml`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao baixar XML');
      console.error('Erro ao baixar XML:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [makeRequest]);

  /**
   * Obter DANFE PDF por chave de acesso
   */
  const downloadDanfe = useCallback(async (chaveAcesso: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const response = await makeRequest(`/meudanfe/danfe/${chaveAcesso}`) as {
        success: boolean;
        pdf_base64?: string;
        pdf_url?: string;
        filename: string;
      };

      // Se tiver base64, criar blob e fazer download
      if (response.pdf_base64) {
        const byteCharacters = atob(response.pdf_base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = response.filename || `danfe_${chaveAcesso}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else if (response.pdf_url) {
        // Se tiver URL, abrir em nova aba
        window.open(response.pdf_url, '_blank');
      } else {
        throw new Error('DANFE não disponível para esta NF-e. A nota pode não ter sido adicionada à área do cliente ainda.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao baixar DANFE');
      console.error('Erro ao baixar DANFE:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [makeRequest]);

  /**
   * Converter XML para DANFE PDF (gratuito)
   */
  const converterXmlParaDanfe = useCallback(async (xml: string): Promise<{ pdf_url?: string; pdf_base64?: string }> => {
    try {
      setLoading(true);
      setError(null);

      const response = await makeRequest('/meudanfe/converter-xml', {
        method: 'POST',
        body: { xml }
      }) as {
        success: boolean;
        pdf_url?: string;
        pdf_base64?: string;
      };

      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao converter XML');
      console.error('Erro ao converter XML:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [makeRequest]);

  // ==========================================
  // NF-e IMPORTADAS
  // ==========================================

  /**
   * Importar NF-e consultada para o sistema
   */
  const importarNfe = useCallback(async (nfeData: Partial<NfeImportada> & { chave_acesso: string }): Promise<{ id: number; message: string }> => {
    try {
      setLoading(true);
      setError(null);

      const response = await makeRequest('/meudanfe/importar', {
        method: 'POST',
        body: nfeData
      }) as { success: boolean; id: number; message: string };

      // Atualizar lista
      await fetchNfesImportadas();

      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao importar NF-e');
      console.error('Erro ao importar NF-e:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [makeRequest]);

  /**
   * Listar NF-e importadas
   */
  const fetchNfesImportadas = useCallback(async (params?: { page?: number; limit?: number; q?: string }): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.q) queryParams.append('q', params.q);

      const response = await makeRequest(`/meudanfe/importadas?${queryParams.toString()}`) as {
        nfes: NfeImportada[];
        pagination: NfeImportadaPagination;
      };

      setNfesImportadas(response.nfes);
      setPagination(response.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao listar NF-e importadas');
      console.error('Erro ao listar NF-e importadas:', err);
    } finally {
      setLoading(false);
    }
  }, [makeRequest]);

  /**
   * Obter detalhes de uma NF-e importada
   */
  const fetchNfeImportada = useCallback(async (id: number): Promise<NfeImportada | null> => {
    try {
      setLoading(true);
      setError(null);

      const response = await makeRequest(`/meudanfe/importadas/${id}`) as { nfe: NfeImportada };
      return response.nfe;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar NF-e');
      console.error('Erro ao buscar NF-e importada:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [makeRequest]);

  // ==========================================
  // ESTATÍSTICAS
  // ==========================================

  /**
   * Obter estatísticas de uso da API
   */
  const fetchEstatisticas = useCallback(async (periodo: 'hoje' | 'semana' | 'mes' | 'ano' = 'mes'): Promise<MeuDanfeStats | null> => {
    try {
      setLoading(true);
      setError(null);

      const response = await makeRequest(`/meudanfe/estatisticas?periodo=${periodo}`) as { stats: MeuDanfeStats };
      return response.stats;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar estatísticas');
      console.error('Erro ao buscar estatísticas:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [makeRequest]);

  // ==========================================
  // UTILITÁRIOS
  // ==========================================

  /**
   * Formatar chave de acesso (44 dígitos) para exibição
   */
  const formatarChaveAcesso = (chave: string): string => {
    const clean = chave.replace(/\D/g, '');
    // Formato: 0000 0000 0000 0000 0000 0000 0000 0000 0000 0000 0000
    return clean.replace(/(.{4})/g, '$1 ').trim();
  };

  /**
   * Validar chave de acesso
   */
  const validarChaveAcesso = (chave: string): { valid: boolean; error?: string } => {
    const clean = chave.replace(/\D/g, '');
    if (clean.length !== 44) {
      return { valid: false, error: 'Chave de acesso deve conter 44 dígitos' };
    }
    return { valid: true };
  };

  /**
   * Formatar valor monetário
   */
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  /**
   * Formatar data
   */
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  return {
    // Estado
    loading,
    error,
    nfesImportadas,
    pagination,

    // Configurações
    fetchConfig,
    validarConfig,

    // Consulta
    consultarNfe,
    downloadXml,
    downloadDanfe,
    converterXmlParaDanfe,

    // NF-e Importadas
    importarNfe,
    fetchNfesImportadas,
    fetchNfeImportada,

    // Estatísticas
    fetchEstatisticas,

    // Utilitários
    formatarChaveAcesso,
    validarChaveAcesso,
    formatCurrency,
    formatDate
  };
}

