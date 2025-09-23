import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Download,
  Calendar,
  Filter,
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  Eye,
  FileText,
  PieChart,
  LineChart,
  Loader2,
  RefreshCw
} from "lucide-react";
import { useRelatorios } from "@/hooks/useRelatorios";
import { useState, useEffect } from "react";
import { gerarRelatorioVendasPDF } from "@/utils/gerarPDF";

export default function Relatorios() {
  const {
    useMetricasRapidas,
    useRelatorioVendasPeriodo,
    useRelatorioVendasDetalhado,
    useRelatorioProdutosVendidos,
    useRelatorioAnaliseClientes,
    useRelatorioFinanceiro,
    useRelatorioControleEstoque,
    useRelatorioPerformanceVendas,
    useCategorias
  } = useRelatorios();

  // Estados para filtros
  const [dataInicio, setDataInicio] = useState(() => {
    const hoje = new Date();
    const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    return primeiroDiaMes.toISOString().split('T')[0];
  });
  
  const [dataFim, setDataFim] = useState(() => {
    const hoje = new Date();
    return hoje.toISOString().split('T')[0];
  });

  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string>('todas');              
  const [agrupamentoSelecionado, setAgrupamentoSelecionado] = useState<string>('diario');
  const [tipoRelatorioSelecionado, setTipoRelatorioSelecionado] = useState<string>('vendas');

  // Hooks para buscar dados
  const { metricas, loading: loadingMetricas } = useMetricasRapidas();
  const { categorias, loading: loadingCategorias } = useCategorias();
  const { dados: dadosVendas, loading: loadingVendas } = useRelatorioVendasPeriodo(dataInicio, dataFim, agrupamentoSelecionado);
  const { dados: dadosVendasDetalhado, loading: loadingVendasDetalhado } = useRelatorioVendasDetalhado(dataInicio, dataFim);
  const { dados: dadosProdutos, loading: loadingProdutos } = useRelatorioProdutosVendidos(dataInicio, dataFim, categoriaSelecionada === 'todas' ? undefined : categoriaSelecionada);
  const { dados: dadosClientes, loading: loadingClientes } = useRelatorioAnaliseClientes(dataInicio, dataFim, 'compras');
  const { dados: dadosFinanceiro, loading: loadingFinanceiro } = useRelatorioFinanceiro(dataInicio, dataFim, 'transacoes');
  const { dados: dadosEstoque, loading: loadingEstoque } = useRelatorioControleEstoque('geral', categoriaSelecionada === 'todas' ? undefined : categoriaSelecionada);
  const { dados: dadosPerformance, loading: loadingPerformance } = useRelatorioPerformanceVendas(dataInicio, dataFim, 'vendedor');

  const relatorios = [
    {
      titulo: "Vendas por Período",
      descricao: "Análise detalhada das vendas por dia, semana ou mês",
      icone: BarChart3,
      tipo: "vendas",
      ultimaGeracao: new Date().toISOString().split('T')[0],
      cor: "bg-primary/10 text-primary",
      loading: loadingVendas,
      dados: dadosVendas
    },
    {
      titulo: "Produtos Mais Vendidos",
      descricao: "Ranking dos produtos com melhor performance",
      icone: Package,
      tipo: "produtos",
      ultimaGeracao: new Date().toISOString().split('T')[0],
      cor: "bg-success/10 text-success",
      loading: loadingProdutos,
      dados: dadosProdutos
    },
    {
      titulo: "Análise de Clientes",
      descricao: "Perfil e comportamento dos seus clientes",
      icone: Users,
      tipo: "clientes",
      ultimaGeracao: new Date().toISOString().split('T')[0],
      cor: "bg-info/10 text-info",
      loading: loadingClientes,
      dados: dadosClientes
    },
    {
      titulo: "Relatório Financeiro",
      descricao: "Receitas, despesas e fluxo de caixa",
      icone: DollarSign,
      tipo: "financeiro",
      ultimaGeracao: new Date().toISOString().split('T')[0],
      cor: "bg-warning/10 text-warning",
      loading: loadingFinanceiro,
      dados: dadosFinanceiro
    },
    {
      titulo: "Controle de Estoque",
      descricao: "Movimentação e níveis de estoque",
      icone: PieChart,
      tipo: "estoque",
      ultimaGeracao: new Date().toISOString().split('T')[0],
      cor: "bg-accent/10 text-accent",
      loading: loadingEstoque,
      dados: dadosEstoque
    },
    {
      titulo: "Performance de Vendas",
      descricao: "Métricas e KPIs de vendas",
      icone: LineChart,
      tipo: "performance",
      ultimaGeracao: new Date().toISOString().split('T')[0],
      cor: "bg-secondary/10 text-secondary",
      loading: loadingPerformance,
      dados: dadosPerformance
    }
  ];

  const relatoriosRecentes = [
    {
      nome: "Relatório de Vendas - Janeiro 2024",
      tipo: "PDF",
      tamanho: "2.4 MB",
      geradoEm: "2024-01-18 14:30",
      downloads: 3
    },
    {
      nome: "Análise de Produtos - Dezembro 2023", 
      tipo: "Excel",
      tamanho: "1.8 MB",
      geradoEm: "2024-01-15 10:15",
      downloads: 8
    },
    {
      nome: "Relatório Financeiro - 4º Trimestre",
      tipo: "PDF", 
      tamanho: "3.1 MB",
      geradoEm: "2024-01-10 16:45",
      downloads: 12
    }
  ];

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const formatarPercentual = (valor: number) => {
    return `${valor >= 0 ? '+' : ''}${valor.toFixed(1)}%`;
  };

  // Função para gerar relatório em CSV
  const gerarCSV = (dados: any[], nomeArquivo: string) => {
    if (!dados || dados.length === 0) return;

    const headers = Object.keys(dados[0]);
    const csvContent = [
      headers.join(','),
      ...dados.map(row => 
        headers.map(header => {
          const value = row[header];
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${nomeArquivo}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Função para gerar relatório em JSON
  const gerarJSON = (dados: any, nomeArquivo: string) => {
    const jsonContent = JSON.stringify(dados, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${nomeArquivo}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Função para gerar relatório em PDF (simulado)
  const gerarPDF = (dados: any, nomeArquivo: string, tipo: string) => {
    // Simulação de geração de PDF
    // Em uma implementação real, você usaria uma biblioteca como jsPDF ou Puppeteer
    const conteudo = `
      RELATÓRIO ${tipo.toUpperCase()}
      Período: ${dataInicio} a ${dataFim}
      
      ${JSON.stringify(dados, null, 2)}
    `;
    
    const blob = new Blob([conteudo], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${nomeArquivo}.txt`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Função para gerar relatório detalhado de vendas em PDF profissional
  const gerarRelatorioVendasDetalhado = () => {
    if (!dadosVendasDetalhado) return;

    gerarRelatorioVendasPDF(dadosVendasDetalhado, formatarMoeda);
  };


  // Função para baixar relatório
  const baixarRelatorio = (tipo: string, formato: string) => {
    const nomeArquivo = `relatorio_${tipo}_${new Date().toISOString().split('T')[0]}`;
    
    switch (tipo) {
      case 'vendas':
        // Usar o relatório detalhado em PDF
        gerarRelatorioVendasDetalhado();
        break;
      case 'produtos':
        if (dadosProdutos?.produtos) {
          if (formato === 'csv') {
            gerarCSV(dadosProdutos.produtos, nomeArquivo);
          } else if (formato === 'json') {
            gerarJSON(dadosProdutos, nomeArquivo);
          } else {
            gerarPDF(dadosProdutos, nomeArquivo, tipo);
          }
        }
        break;
      case 'clientes':
        if (dadosClientes?.clientes) {
          if (formato === 'csv') {
            gerarCSV(dadosClientes.clientes, nomeArquivo);
          } else if (formato === 'json') {
            gerarJSON(dadosClientes, nomeArquivo);
          } else {
            gerarPDF(dadosClientes, nomeArquivo, tipo);
          }
        }
        break;
      case 'financeiro':
        if (dadosFinanceiro?.transacoes) {
          if (formato === 'csv') {
            gerarCSV(dadosFinanceiro.transacoes, nomeArquivo);
          } else if (formato === 'json') {
            gerarJSON(dadosFinanceiro, nomeArquivo);
          } else {
            gerarPDF(dadosFinanceiro, nomeArquivo, tipo);
          }
        }
        break;
      case 'estoque':
        if (dadosEstoque?.produtos) {
          if (formato === 'csv') {
            gerarCSV(dadosEstoque.produtos, nomeArquivo);
          } else if (formato === 'json') {
            gerarJSON(dadosEstoque, nomeArquivo);
          } else {
            gerarPDF(dadosEstoque, nomeArquivo, tipo);
          }
        }
        break;
      case 'performance':
        if (dadosPerformance?.performance) {
          if (formato === 'csv') {
            gerarCSV(dadosPerformance.performance, nomeArquivo);
          } else if (formato === 'json') {
            gerarJSON(dadosPerformance, nomeArquivo);
          } else {
            gerarPDF(dadosPerformance, nomeArquivo, tipo);
          }
        }
        break;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold">Relatórios</h1>
          <p className="text-muted-foreground">
            Análises e insights sobre seu negócio
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2">
            <Label htmlFor="data-inicio" className="text-sm font-medium">De:</Label>
            <Input
              id="data-inicio"
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="w-40"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Label htmlFor="data-fim" className="text-sm font-medium">Até:</Label>
            <Input
              id="data-fim"
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="w-40"
            />
          </div>
          <Select value={categoriaSelecionada} onValueChange={setCategoriaSelecionada}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Todas as categorias" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as categorias</SelectItem>
              {categorias.map((categoria) => (
                <SelectItem key={categoria.id} value={categoria.id.toString()}>
                  {categoria.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              // Recarregar todos os dados
              window.location.reload();
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Métricas Rápidas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {loadingMetricas ? (
          Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="bg-gradient-card shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-center h-20">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          [
            {
              titulo: "Vendas Hoje",
              valor: metricas?.vendas_hoje?.valor ? formatarMoeda(metricas.vendas_hoje.valor) : "R$ 0,00",
              mudanca: metricas?.vendas_hoje?.mudanca ? formatarPercentual(metricas.vendas_hoje.mudanca) : "+0%",
              tipoMudanca: (metricas?.vendas_hoje?.mudanca || 0) >= 0 ? "positiva" as const : "negativa" as const,
              icone: DollarSign
            },
            {
              titulo: "Pedidos Hoje",
              valor: metricas?.pedidos_hoje?.valor?.toString() || "0",
              mudanca: metricas?.pedidos_hoje?.mudanca ? `+${metricas.pedidos_hoje.mudanca}` : "+0",
              tipoMudanca: (metricas?.pedidos_hoje?.mudanca || 0) >= 0 ? "positiva" as const : "negativa" as const,
              icone: ShoppingCart
            },
            {
              titulo: "Produtos Vendidos",
              valor: metricas?.produtos_vendidos?.valor?.toString() || "0",
              mudanca: metricas?.produtos_vendidos?.mudanca ? formatarPercentual(metricas.produtos_vendidos.mudanca) : "+0%",
              tipoMudanca: (metricas?.produtos_vendidos?.mudanca || 0) >= 0 ? "positiva" as const : "negativa" as const,
              icone: Package
            },
            {
              titulo: "Novos Clientes",
              valor: metricas?.novos_clientes?.valor?.toString() || "0",
              mudanca: metricas?.novos_clientes?.mudanca ? `+${metricas.novos_clientes.mudanca}` : "+0",
              tipoMudanca: (metricas?.novos_clientes?.mudanca || 0) >= 0 ? "positiva" as const : "negativa" as const,
              icone: Users
            }
          ].map((metrica, index) => (
            <Card key={index} className="bg-gradient-card shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{metrica.titulo}</p>
                    <p className="text-2xl font-bold">{metrica.valor}</p>
                    <div className="flex items-center space-x-1 mt-1">
                      {metrica.tipoMudanca === "positiva" ? (
                        <TrendingUp className="h-3 w-3 text-success" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-destructive" />
                      )}
                      <span className={`text-xs ${metrica.tipoMudanca === "positiva" ? "text-success" : "text-destructive"}`}>
                        {metrica.mudanca}
                      </span>
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-primary/10">
                    <metrica.icone className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Relatórios Disponíveis */}
        <div className="lg:col-span-2">
          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle>Relatórios Disponíveis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {relatorios.map((relatorio, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-lg ${relatorio.cor}`}>
                        {relatorio.loading ? (
                          <Loader2 className="h-6 w-6 animate-spin" />
                        ) : (
                          <relatorio.icone className="h-6 w-6" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{relatorio.titulo}</h3>
                        <p className="text-sm text-muted-foreground">{relatorio.descricao}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Última atualização: {new Date(relatorio.ultimaGeracao).toLocaleDateString("pt-BR")}
                        </p>
                        {relatorio.dados && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            {relatorio.tipo === 'vendas' && 'vendas' in relatorio.dados && (
                              <span>{relatorio.dados.vendas.length} registros encontrados</span>
                            )}
                            {relatorio.tipo === 'produtos' && 'produtos' in relatorio.dados && (
                              <span>{relatorio.dados.produtos.length} produtos</span>
                            )}
                            {relatorio.tipo === 'clientes' && 'clientes' in relatorio.dados && (
                              <span>{relatorio.dados.clientes.length} clientes</span>
                            )}
                            {relatorio.tipo === 'financeiro' && 'transacoes' in relatorio.dados && (
                              <span>{relatorio.dados.transacoes.length} transações</span>
                            )}
                            {relatorio.tipo === 'estoque' && 'produtos' in relatorio.dados && (
                              <span>{relatorio.dados.produtos.length} produtos</span>
                            )}
                            {relatorio.tipo === 'performance' && 'performance' in relatorio.dados && (
                              <span>{relatorio.dados.performance.length} registros</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" disabled={relatorio.loading}>
                        <Eye className="h-4 w-4 mr-2" />
                        Ver
                      </Button>
                      <Select onValueChange={(formato) => baixarRelatorio(relatorio.tipo, formato)}>
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Baixar" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="csv">CSV</SelectItem>
                          <SelectItem value="json">JSON</SelectItem>
                          <SelectItem value="pdf">PDF</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Relatórios Recentes */}
        <div>
          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Relatórios Recentes</span>
                <Badge variant="secondary">{relatoriosRecentes.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {relatoriosRecentes.map((relatorio, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="font-medium text-sm line-clamp-2">{relatorio.nome}</p>
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                          <FileText className="h-3 w-3" />
                          <span>{relatorio.tipo}</span>
                          <span>•</span>
                          <span>{relatorio.tamanho}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {relatorio.geradoEm}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                      <Download className="h-3 w-3" />
                      <span>{relatorio.downloads} downloads</span>
                    </div>
                    {index < relatoriosRecentes.length - 1 && (
                      <div className="border-t border-border/50" />
                    )}
                  </div>
                ))}
              </div>
              
              <Button variant="outline" size="sm" className="w-full mt-4">
                Ver Todos os Relatórios
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Relatório Detalhado de Vendas */}
      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Relatório Detalhado de Vendas por Período
            </span>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => gerarRelatorioVendasDetalhado()}
                disabled={loadingVendasDetalhado || !dadosVendasDetalhado}
              >
                <Download className="h-4 w-4 mr-2" />
                Baixar PDF
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingVendasDetalhado ? (
            <div className="h-64 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : dadosVendasDetalhado ? (
            <div className="space-y-6">
              {/* Resumo Geral */}
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <p className="text-2xl font-bold text-primary">
                    {formatarMoeda(dadosVendasDetalhado.resumo_geral.receita_total)}
                  </p>
                  <p className="text-sm text-muted-foreground">Total de Vendas</p>
                </div>
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <p className="text-2xl font-bold text-success">
                    {dadosVendasDetalhado.resumo_geral.total_vendas}
                  </p>
                  <p className="text-sm text-muted-foreground">Número de Vendas</p>
                </div>
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <p className="text-2xl font-bold text-info">
                    {formatarMoeda(dadosVendasDetalhado.resumo_geral.ticket_medio)}
                  </p>
                  <p className="text-sm text-muted-foreground">Ticket Médio</p>
                </div>
              </div>

              {/* Formas de Pagamento */}
              <div>
                <h4 className="font-semibold mb-3">Formas de Pagamento</h4>
                <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                  {dadosVendasDetalhado.formas_pagamento.map((forma: any, index: number) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-muted/30 rounded">
                      <span className="text-sm font-medium">{forma.metodo_pagamento}</span>
                      <span className="text-sm font-semibold">{formatarMoeda(forma.valor_total)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Vendas por Categoria */}
              <div>
                <h4 className="font-semibold mb-3">Vendas por Categoria</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {dadosVendasDetalhado.vendas_por_categoria.slice(0, 5).map((categoria: any, index: number) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-muted/30 rounded">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{categoria.categoria_nome || 'Sem categoria'}</p>
                        <p className="text-xs text-muted-foreground">{categoria.quantidade_vendida} unidades</p>
                      </div>
                      <div className="text-right ml-2">
                        <p className="text-sm font-semibold">{formatarMoeda(categoria.faturamento)}</p>
                        <p className="text-xs text-muted-foreground">{categoria.percentual.toFixed(1)}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Vendas por Data */}
              <div>
                <h4 className="font-semibold mb-3">Vendas por Data (Últimos 7 dias)</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {dadosVendasDetalhado.vendas_por_data.slice(0, 7).map((venda: any, index: number) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-muted/30 rounded">
                      <span className="text-sm font-medium">{new Date(venda.data_venda).toLocaleDateString('pt-BR')}</span>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{formatarMoeda(venda.valor_total)}</p>
                        <p className="text-xs text-muted-foreground">{venda.quantidade_vendas} vendas</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center bg-muted/30 rounded-lg">
              <div className="text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Nenhum dado encontrado</p>
                <p className="text-xs text-muted-foreground">Ajuste o período para ver o relatório detalhado</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gráficos com Dados Reais */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Vendas por Período
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingVendas ? (
              <div className="h-64 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : dadosVendas && dadosVendas.vendas.length > 0 ? (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">
                    {formatarMoeda(dadosVendas.total_geral.receita_total)}
                  </p>
                  <p className="text-sm text-muted-foreground">Receita Total</p>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {dadosVendas.vendas.slice(0, 10).map((venda, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-muted/30 rounded">
                      <span className="text-sm font-medium">{venda.periodo}</span>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{formatarMoeda(venda.receita_total)}</p>
                        <p className="text-xs text-muted-foreground">{venda.total_vendas} vendas</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center bg-muted/30 rounded-lg">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Nenhum dado encontrado</p>
                  <p className="text-xs text-muted-foreground">Ajuste o período para ver vendas</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChart className="h-5 w-5 mr-2" />
              Produtos Mais Vendidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingProdutos ? (
              <div className="h-64 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : dadosProdutos && dadosProdutos.produtos.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {dadosProdutos.produtos.slice(0, 8).map((produto, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-muted/30 rounded">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{produto.nome}</p>
                      <p className="text-xs text-muted-foreground">{produto.categoria_nome}</p>
                    </div>
                    <div className="text-right ml-2">
                      <p className="text-sm font-semibold">{produto.total_vendido} unid.</p>
                      <p className="text-xs text-muted-foreground">{formatarMoeda(produto.receita_total)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center bg-muted/30 rounded-lg">
                <div className="text-center">
                  <PieChart className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Nenhum produto vendido</p>
                  <p className="text-xs text-muted-foreground">Ajuste o período para ver vendas</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Resumo Financeiro */}
      {dadosFinanceiro && dadosFinanceiro.resumo && (
        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="h-5 w-5 mr-2" />
              Resumo Financeiro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <p className="text-2xl font-bold text-success">
                  {formatarMoeda(dadosFinanceiro.resumo.valor_entradas)}
                </p>
                <p className="text-sm text-muted-foreground">Entradas</p>
                <p className="text-xs text-muted-foreground">{dadosFinanceiro.resumo.total_entradas} transações</p>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <p className="text-2xl font-bold text-destructive">
                  {formatarMoeda(dadosFinanceiro.resumo.valor_saidas)}
                </p>
                <p className="text-sm text-muted-foreground">Saídas</p>
                <p className="text-xs text-muted-foreground">{dadosFinanceiro.resumo.total_saidas} transações</p>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <p className={`text-2xl font-bold ${(dadosFinanceiro.resumo.valor_entradas - dadosFinanceiro.resumo.valor_saidas) >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {formatarMoeda(dadosFinanceiro.resumo.valor_entradas - dadosFinanceiro.resumo.valor_saidas)}
                </p>
                <p className="text-sm text-muted-foreground">Saldo</p>
                <p className="text-xs text-muted-foreground">Período selecionado</p>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <p className="text-2xl font-bold text-primary">
                  {dadosFinanceiro.resumo.total_transacoes}
                </p>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-xs text-muted-foreground">Transações</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resumo de Estoque */}
      {dadosEstoque && dadosEstoque.estatisticas && (
        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="h-5 w-5 mr-2" />
              Resumo de Estoque
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <p className="text-2xl font-bold text-primary">
                  {dadosEstoque.estatisticas.total_produtos}
                </p>
                <p className="text-sm text-muted-foreground">Total de Produtos</p>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <p className="text-2xl font-bold text-destructive">
                  {dadosEstoque.estatisticas.sem_estoque}
                </p>
                <p className="text-sm text-muted-foreground">Sem Estoque</p>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <p className="text-2xl font-bold text-warning">
                  {dadosEstoque.estatisticas.estoque_baixo}
                </p>
                <p className="text-sm text-muted-foreground">Estoque Baixo</p>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <p className="text-2xl font-bold text-success">
                  {formatarMoeda(dadosEstoque.estatisticas.valor_total_estoque)}
                </p>
                <p className="text-sm text-muted-foreground">Valor Total</p>
                <p className="text-xs text-muted-foreground">{dadosEstoque.estatisticas.total_unidades} unidades</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}