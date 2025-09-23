import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export interface RelatorioVendasPeriodo {
  periodo: string;
  total_vendas: number;
  vendas_pagas: number;
  vendas_pendentes: number;
  receita_total: number;
  ticket_medio: number;
}

export interface RelatorioProdutosVendidos {
  id: number;
  nome: string;
  codigo_barras: string;
  sku: string;
  preco: number;
  categoria_nome: string;
  total_vendido: number;
  total_vendas: number;
  receita_total: number;
  preco_medio_venda: number;
}

export interface RelatorioAnaliseClientes {
  id: number;
  nome: string;
  email: string;
  telefone: string;
  vip: boolean;
  total_vendas: number;
  valor_total: number;
  ticket_medio: number;
  ultima_compra: string;
  primeira_compra: string;
}

export interface RelatorioFinanceiro {
  transacoes?: Array<{
    id: number;
    tipo: 'entrada' | 'saida';
    categoria: string;
    descricao: string;
    valor: number;
    data_transacao: string;
    metodo_pagamento: string;
    status: string;
    cliente_nome?: string;
  }>;
  contas_receber?: Array<{
    id: number;
    descricao: string;
    valor: number;
    data_vencimento: string;
    data_pagamento?: string;
    status: string;
    parcela?: string;
    cliente_nome?: string;
  }>;
  contas_pagar?: Array<{
    id: number;
    descricao: string;
    valor: number;
    data_vencimento: string;
    data_pagamento?: string;
    status: string;
    categoria?: string;
  }>;
  resumo?: {
    total_transacoes: number;
    total_entradas: number;
    total_saidas: number;
    valor_entradas: number;
    valor_saidas: number;
  };
}

export interface RelatorioControleEstoque {
  id: number;
  nome: string;
  codigo_barras: string;
  sku: string;
  estoque: number;
  estoque_minimo: number;
  preco: number;
  categoria_nome: string;
  valor_estoque: number;
  status_estoque: 'Sem estoque' | 'Estoque baixo' | 'Normal';
}

export interface RelatorioPerformanceVendas {
  id: number;
  nome_agrupamento: string;
  total_vendas: number;
  vendas_pagas: number;
  receita_total: number;
  ticket_medio: number;
}

export interface MetricasRapidas {
  vendas_hoje: {
    valor: number;
    mudanca: number;
  };
  pedidos_hoje: {
    valor: number;
    mudanca: number;
  };
  produtos_vendidos: {
    valor: number;
    mudanca: number;
  };
  novos_clientes: {
    valor: number;
    mudanca: number;
  };
}

export const useRelatorios = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hook para métricas rápidas
  const useMetricasRapidas = () => {
    const [metricas, setMetricas] = useState<MetricasRapidas | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchMetricas = async () => {
      try {
        setLoading(true);
        const response = await api.get('/dashboard/metricas?periodo=hoje');
        const data = response.data as any;

        setMetricas({
          vendas_hoje: {
            valor: data?.metricas?.vendas?.receita_total || 0,
            mudanca: data?.metricas?.comparacao?.vendas?.variacao_percentual || 0
          },
          pedidos_hoje: {
            valor: data?.metricas?.vendas?.total_vendas || 0,
            mudanca: data?.metricas?.comparacao?.vendas?.variacao_quantidade || 0
          },
          produtos_vendidos: {
            valor: data?.metricas?.produtos?.total_vendido || 0,
            mudanca: data?.metricas?.comparacao?.produtos?.variacao_percentual || 0
          },
          novos_clientes: {
            valor: data?.metricas?.clientes?.novos_clientes || 0,
            mudanca: data?.metricas?.comparacao?.clientes?.variacao_percentual || 0
          }
        });
      } catch (err) {
        console.error('Erro ao buscar métricas:', err);
        // Definir valores padrão em caso de erro
        setMetricas({
          vendas_hoje: { valor: 0, mudanca: 0 },
          pedidos_hoje: { valor: 0, mudanca: 0 },
          produtos_vendidos: { valor: 0, mudanca: 0 },
          novos_clientes: { valor: 0, mudanca: 0 }
        });
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      fetchMetricas();
    }, []);

    return { metricas, loading, refetch: fetchMetricas };
  };

  // Hook para relatório de vendas por período
  const useRelatorioVendasPeriodo = (dataInicio: string, dataFim: string, agrupamento: string = 'diario') => {
    const [dados, setDados] = useState<{
      vendas: RelatorioVendasPeriodo[];
      total_geral: any;
    } | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchDados = async () => {
      try {
        setLoading(true);
        const response = await api.get('/relatorios/vendas-periodo', {
          params: {
            data_inicio: dataInicio,
            data_fim: dataFim,
            agrupamento
          }
        });
        setDados(response.data as { vendas: RelatorioVendasPeriodo[]; total_geral: any });
      } catch (err) {
        console.error('Erro ao buscar relatório de vendas:', err);
        setError('Erro ao carregar relatório de vendas');
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      if (dataInicio && dataFim) {
        fetchDados();
      }
    }, [dataInicio, dataFim, agrupamento]);

    return { dados, loading, refetch: fetchDados };
  };

  // Hook para relatório de produtos mais vendidos
  const useRelatorioProdutosVendidos = (dataInicio: string, dataFim: string, categoriaId?: string) => {
    const [dados, setDados] = useState<{
      produtos: RelatorioProdutosVendidos[];
      pagination: any;
    } | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchDados = async () => {
      try {
        setLoading(true);
        const response = await api.get('/relatorios/produtos-vendidos', {
          params: {
            data_inicio: dataInicio,
            data_fim: dataFim,
            categoria_id: categoriaId || ''
          }
        });
        setDados(response.data as { produtos: RelatorioProdutosVendidos[]; pagination: any });
      } catch (err) {
        console.error('Erro ao buscar relatório de produtos:', err);
        setError('Erro ao carregar relatório de produtos');
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      if (dataInicio && dataFim) {
        fetchDados();
      }
    }, [dataInicio, dataFim, categoriaId]);

    return { dados, loading, refetch: fetchDados };
  };

  // Hook para relatório de análise de clientes
  const useRelatorioAnaliseClientes = (dataInicio: string, dataFim: string, tipoAnalise: string = 'compras') => {
    const [dados, setDados] = useState<{
      clientes: RelatorioAnaliseClientes[];
      estatisticas: any;
    } | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchDados = async () => {
      try {
        setLoading(true);
        const response = await api.get('/relatorios/analise-clientes', {
          params: {
            data_inicio: dataInicio,
            data_fim: dataFim,
            tipo_analise: tipoAnalise
          }
        });
        setDados(response.data as { clientes: RelatorioAnaliseClientes[]; estatisticas: any });
      } catch (err) {
        console.error('Erro ao buscar relatório de clientes:', err);
        setError('Erro ao carregar relatório de clientes');
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      if (dataInicio && dataFim) {
        fetchDados();
      }
    }, [dataInicio, dataFim, tipoAnalise]);

    return { dados, loading, refetch: fetchDados };
  };

  // Hook para relatório financeiro
  const useRelatorioFinanceiro = (dataInicio: string, dataFim: string, tipo: string = 'transacoes') => {
    const [dados, setDados] = useState<RelatorioFinanceiro | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchDados = async () => {
      try {
        setLoading(true);
        const response = await api.get('/relatorios/financeiro', {
          params: {
            data_inicio: dataInicio,
            data_fim: dataFim,
            tipo
          }
        });
        setDados(response.data);
      } catch (err) {
        console.error('Erro ao buscar relatório financeiro:', err);
        setError('Erro ao carregar relatório financeiro');
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      if (dataInicio && dataFim) {
        fetchDados();
      }
    }, [dataInicio, dataFim, tipo]);

    return { dados, loading, refetch: fetchDados };
  };

  // Hook para relatório de controle de estoque
  const useRelatorioControleEstoque = (tipo: string = 'geral', categoriaId?: string) => {
    const [dados, setDados] = useState<{
      produtos: RelatorioControleEstoque[];
      estatisticas: any;
    } | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchDados = async () => {
      try {
        setLoading(true);
        const response = await api.get('/relatorios/controle-estoque', {
          params: {
            tipo,
            categoria_id: categoriaId || ''
          }
        });
        setDados(response.data as { produtos: RelatorioControleEstoque[]; estatisticas: any });
      } catch (err) {
        console.error('Erro ao buscar relatório de estoque:', err);
        setError('Erro ao carregar relatório de estoque');
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      fetchDados();
    }, [tipo, categoriaId]);

    return { dados, loading, refetch: fetchDados };
  };

  // Hook para relatório de performance de vendas
  const useRelatorioPerformanceVendas = (dataInicio: string, dataFim: string, agrupamento: string = 'vendedor') => {
    const [dados, setDados] = useState<{
      performance: RelatorioPerformanceVendas[];
    } | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchDados = async () => {
      try {
        setLoading(true);
        const response = await api.get('/relatorios/performance-vendas', {
          params: {
            data_inicio: dataInicio,
            data_fim: dataFim,
            agrupamento
          }
        });
        setDados(response.data as { performance: RelatorioPerformanceVendas[] });
      } catch (err) {
        console.error('Erro ao buscar relatório de performance:', err);
        setError('Erro ao carregar relatório de performance');
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      if (dataInicio && dataFim) {
        fetchDados();
      }
    }, [dataInicio, dataFim, agrupamento]);

    return { dados, loading, refetch: fetchDados };
  };

  // Hook para relatório detalhado de vendas por período
  const useRelatorioVendasDetalhado = (dataInicio: string, dataFim: string) => {
    const [dados, setDados] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const fetchDados = async () => {
      try {
        setLoading(true);
        const response = await api.get('/relatorios/vendas-periodo-detalhado', {
          params: {
            data_inicio: dataInicio,
            data_fim: dataFim
          }
        });
        setDados(response.data);
      } catch (err) {
        console.error('Erro ao buscar relatório detalhado de vendas:', err);
        setError('Erro ao carregar relatório detalhado de vendas');
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      if (dataInicio && dataFim) {
        fetchDados();
      }
    }, [dataInicio, dataFim]);

    return { dados, loading, refetch: fetchDados };
  };

  // Hook para buscar categorias
  const useCategorias = () => {
    const [categorias, setCategorias] = useState<Array<{id: number, nome: string}>>([]);
    const [loading, setLoading] = useState(false);

    const fetchCategorias = async () => {
      try {
        setLoading(true);
        const response = await api.get('/catalogo/categorias');
        const data = response.data as any;
        setCategorias(data.categorias || []);
      } catch (err) {
        console.error('Erro ao buscar categorias:', err);
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      fetchCategorias();
    }, []);

    return { categorias, loading, refetch: fetchCategorias };
  };

  return {
    loading,
    error,
    useMetricasRapidas,
    useRelatorioVendasPeriodo,
    useRelatorioVendasDetalhado,
    useRelatorioProdutosVendidos,
    useRelatorioAnaliseClientes,
    useRelatorioFinanceiro,
    useRelatorioControleEstoque,
    useRelatorioPerformanceVendas,
    useCategorias
  };
};
