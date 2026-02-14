import { CartaoMetrica } from "@/components/dashboard/MetricsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  DollarSign, 
  ShoppingCart, 
  Package, 
  Users,
  AlertTriangle,
  Eye,
  TrendingUp,
  Calendar,
  RefreshCw,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Trophy
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDashboard, TopProduto } from "@/hooks/useDashboard";
import { usePermissions } from "@/hooks/usePermissions";
import { useApi } from "@/hooks/useApi";
import { API_ENDPOINTS } from "@/config/api";
import { useNotificationContext } from "@/contexts/NotificationContext";
import { useImagePath } from "@/hooks/useImagePath";
import { useState, useEffect, useCallback, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

export default function Dashboard() {
  const navigate = useNavigate();
  const [periodo, setPeriodo] = useState<'hoje' | 'semana' | 'mes' | 'ano'>('hoje');
  const [mudandoPeriodo, setMudandoPeriodo] = useState(false);
  const [filtroEstoque, setFiltroEstoque] = useState<'todos' | 'baixo' | 'zerado'>('todos');
  const [estoqueExpandido, setEstoqueExpandido] = useState(false);
  const [periodoProdutos, setPeriodoProdutos] = useState<'7' | '30' | '90' | '365'>('30');
  const [topProdutosFiltrados, setTopProdutosFiltrados] = useState<TopProduto[]>([]);
  const [loadingTopProdutos, setLoadingTopProdutos] = useState(false);
  const [topProdutosExpandido, setTopProdutosExpandido] = useState(false);
  const [vendasExpandido, setVendasExpandido] = useState(false);
  const { hasPermission } = usePermissions();
  const { makeRequest } = useApi();
  const { triggerNovaVenda, triggerEstoqueBaixo, triggerContaVencida } = useNotificationContext();
  const logopixPath = useImagePath('logopix.png');
  
  const { 
    data, 
    loading, 
    error, 
    refreshData, 
    formatCurrency, 
    formatDateTime, 
    getStatusBadge, 
    getPaymentIcon, 
    getPaymentText,
    calculateVariation,
    getVariationColor,
    getVariationIcon,
    formatVariation,
    obterUnidadeEstoque,
    formatarEstoque,
    obterTipoEstoqueTexto
  } = useDashboard();

  // Atualizar dados quando o período mudar
  const handlePeriodoChange = (novoPeriodo: 'hoje' | 'semana' | 'mes' | 'ano') => {
    if (novoPeriodo === periodo) return; // Evitar requisições desnecessárias
    
    setMudandoPeriodo(true);
    setPeriodo(novoPeriodo);
    refreshData(novoPeriodo);
    
    // Resetar estado de mudança após um tempo
    setTimeout(() => setMudandoPeriodo(false), 1000);
  };

  // Função para determinar se há dados de comparação válidos
  const hasValidComparison = (comparacao: any) => {
    return comparacao && 
           comparacao.receita && 
           comparacao.vendas && 
           (comparacao.receita.anterior > 0 || comparacao.vendas.anterior > 0);
  };

  // Dados das métricas baseados nos dados reais
  const metricas = data ? [
    {
      titulo: periodo === 'hoje' ? "Total Hoje" : `Vendas ${periodo === 'semana' ? 'da Semana' : periodo === 'mes' ? 'do Mês' : 'do Ano'}`,
      valor: formatCurrency(data.metricas.vendas.receita_total),
      mudanca: hasValidComparison(data.metricas.comparacao) ? 
        `${getVariationIcon(data.metricas.comparacao.receita.variacao)} ${formatVariation(data.metricas.comparacao.receita.variacao)}` : 
        data.metricas.comparacao?.receita.anterior === 0 ? "Novo" : "N/A",
      tipoMudanca: hasValidComparison(data.metricas.comparacao) ? 
        (data.metricas.comparacao.receita.variacao >= 0 ? "positiva" : "negativa") as "positiva" | "negativa" : 
        data.metricas.comparacao?.receita.anterior === 0 ? "positiva" as "positiva" : "neutra" as "neutra",
      icone: DollarSign,
      descricao: hasValidComparison(data.metricas.comparacao) ? 
        `vs. ${periodo === 'hoje' ? 'ontem' : periodo === 'semana' ? 'semana anterior' : periodo === 'mes' ? 'mês anterior' : 'ano anterior'}` : 
        data.metricas.comparacao?.receita.anterior === 0 ? "primeira vez" : "sem comparação"
    },
    {
      titulo: periodo === 'hoje' ? "Vendas Hoje" : `Pedidos ${periodo === 'semana' ? 'da Semana' : periodo === 'mes' ? 'do Mês' : 'do Ano'}`,
      valor: data.metricas.vendas.total_vendas.toString(),
      mudanca: hasValidComparison(data.metricas.comparacao) ? 
        `${getVariationIcon(data.metricas.comparacao.vendas.variacao)} ${formatVariation(data.metricas.comparacao.vendas.variacao)}` : 
        data.metricas.comparacao?.vendas.anterior === 0 ? "Novo" : "N/A",
      tipoMudanca: hasValidComparison(data.metricas.comparacao) ? 
        (data.metricas.comparacao.vendas.variacao >= 0 ? "positiva" : "negativa") as "positiva" | "negativa" : 
        data.metricas.comparacao?.vendas.anterior === 0 ? "positiva" as "positiva" : "neutra" as "neutra",
      icone: ShoppingCart,
      descricao: hasValidComparison(data.metricas.comparacao) ? 
        `vs. ${periodo === 'hoje' ? 'ontem' : periodo === 'semana' ? 'semana anterior' : periodo === 'mes' ? 'mês anterior' : 'ano anterior'}` : 
        data.metricas.comparacao?.vendas.anterior === 0 ? "primeira vez" : "sem comparação"
    },
    {
      titulo: "Produtos",
      valor: data.metricas.produtos.produtos_ativos.toString(),
      mudancas: (() => {
        const items: { texto: string; tipo: "positiva" | "negativa" | "neutra" }[] = [];
        const semEstoque = data.metricas.produtos.sem_estoque || 0;
        const estoqueBaixo = data.metricas.produtos.estoque_baixo || 0;
        
        if (semEstoque > 0) {
          items.push({ texto: `${semEstoque} sem estoque`, tipo: "negativa" });
        }
        if (estoqueBaixo > 0) {
          items.push({ texto: `${estoqueBaixo} estoque baixo`, tipo: "neutra" });
        }
        if (items.length === 0) {
          items.push({ texto: "Estoque OK", tipo: "positiva" });
        }
        return items;
      })(),
      icone: Package,
      descricao: "no estoque"
    },
    {
      titulo: "Clientes",
      valor: data.metricas.clientes.clientes_ativos.toString(),
      mudanca: `+${data.metricas.clientes.clientes_vip} VIP`,
      tipoMudanca: "positiva" as "positiva",
      icone: Users,
      descricao: "clientes ativos"
    }
  ] : [];

  const vendasRecentes = data?.vendas_recentes || [];
  const produtosEstoqueBaixoOriginal = data?.estoque_baixo || [];
  const produtosMaisVendidosOriginal = data?.top_produtos || [];
  const graficoVendasOriginal = data?.grafico_vendas || [];
  
  // Preparar dados do gráfico (últimos 7 dias - incluindo dias sem vendas)
  const dadosGrafico = useMemo(() => {
    const hoje = new Date();
    const ultimos7Dias: { data: string; valor: number; valorReal: number; periodo: string; temVenda: boolean }[] = [];
    
    // Encontrar o valor máximo para calcular o mínimo visual
    const maxValor = Math.max(...graficoVendasOriginal.map(item => item.receita_total), 1);
    const minBarraVisual = maxValor * 0.03; // 3% do máximo para barras vazias
    
    // Criar array com os últimos 7 dias
    for (let i = 6; i >= 0; i--) {
      const dia = new Date(hoje);
      dia.setDate(hoje.getDate() - i);
      const dataFormatada = dia.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      const periodoISO = dia.toISOString().split('T')[0];
      
      // Buscar se existe venda nesse dia
      const vendaDia = graficoVendasOriginal.find((item) => {
        const itemData = new Date(item.periodo).toISOString().split('T')[0];
        return itemData === periodoISO;
      });
      
      const valorReal = vendaDia ? vendaDia.receita_total : 0;
      
      ultimos7Dias.push({
        data: dataFormatada,
        valor: valorReal > 0 ? valorReal : minBarraVisual, // Valor mínimo para visualização
        valorReal: valorReal, // Valor real para tooltip
        periodo: periodoISO,
        temVenda: valorReal > 0
      });
    }
    
    return ultimos7Dias;
  }, [graficoVendasOriginal]);
  
  // Buscar produtos mais vendidos quando o período mudar
  const fetchTopProdutos = useCallback(async (dias: string) => {
    try {
      setLoadingTopProdutos(true);
      const response = await makeRequest(`${API_ENDPOINTS.DASHBOARD.TOP_PRODUCTS}?limit=10&periodo=${dias}`);
      setTopProdutosFiltrados(response.produtos || []);
    } catch (err) {
      console.error('Erro ao buscar produtos mais vendidos:', err);
      setTopProdutosFiltrados([]);
    } finally {
      setLoadingTopProdutos(false);
    }
  }, [makeRequest]);

  // Efeito para buscar quando o período mudar
  useEffect(() => {
    if (periodoProdutos !== '30') {
      fetchTopProdutos(periodoProdutos);
    } else {
      setTopProdutosFiltrados(produtosMaisVendidosOriginal);
    }
  }, [periodoProdutos, produtosMaisVendidosOriginal, fetchTopProdutos]);

  // Usar os produtos filtrados ou os originais
  const produtosMaisVendidos = periodoProdutos === '30' ? produtosMaisVendidosOriginal : topProdutosFiltrados;
  
  // Filtrar produtos com base no filtro selecionado
  const produtosEstoqueBaixo = produtosEstoqueBaixoOriginal.filter((produto: any) => {
    const estoqueAtual = Number(produto.estoque_atual) || 0;
    if (filtroEstoque === 'todos') return true;
    if (filtroEstoque === 'zerado') return estoqueAtual === 0;
    if (filtroEstoque === 'baixo') return estoqueAtual > 0;
    return true;
  });
  
  // Contadores para os badges
  const countZerado = produtosEstoqueBaixoOriginal.filter((p: any) => (Number(p.estoque_atual) || 0) === 0).length;
  const countBaixo = produtosEstoqueBaixoOriginal.filter((p: any) => (Number(p.estoque_atual) || 0) > 0).length;

  // Loading state
  if (loading) {
    return (
      <div className="w-full max-w-full overflow-x-hidden space-y-4 sm:space-y-6">
        <div className="w-full">
          <div className="mb-4 md:mb-0">
            <Skeleton className="h-6 w-32 sm:h-8 sm:w-48" />
            <Skeleton className="h-3 w-48 sm:h-4 sm:w-64 mt-2" />
          </div>
          <div className="hidden md:flex items-center space-x-2 justify-end">
            <Skeleton className="h-8 w-32" />
          </div>
          <div className="md:hidden space-y-3 w-full">
            <Skeleton className="h-8 w-full" />
            <div className="flex gap-2 w-full">
              <Skeleton className="h-8 flex-1" />
              <Skeleton className="h-8 flex-1" />
            </div>
          </div>
        </div>
        <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 sm:h-32" />
          ))}
        </div>
        <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="md:col-span-2 h-80 sm:h-96" />
          <Skeleton className="h-80 sm:h-96" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="w-full max-w-full overflow-x-hidden space-y-4 sm:space-y-6">
        <div className="w-full">
          <div className="mb-4 md:mb-0">
            <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Bem-vindo de volta! Aqui está o resumo da sua loja.
            </p>
          </div>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs sm:text-sm">
            {error}
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-2 sm:ml-4 text-xs sm:text-sm"
              onClick={() => refreshData(periodo)}
            >
              <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Tentar Novamente
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full overflow-x-hidden space-y-4 sm:space-y-6 prevent-zoom touch-optimized mobile-scroll">
      {/* Header */}
      <div className="w-full">
        <div className="mb-4 md:mb-0">
          <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Bem-vindo de volta! Aqui está o resumo da sua loja {periodo === 'hoje' ? 'hoje' : `no ${periodo}`}.
          </p>
        </div>
        
        {/* Desktop Controls */}
        <div className="hidden md:flex items-center space-x-2 justify-end">
          {/* Controles de período */}
          <div className="flex items-center space-x-1 bg-muted rounded-lg p-1">
            {(['hoje', 'semana', 'mes', 'ano'] as const).map((p) => (
              <Button
                key={p}
                variant={periodo === p ? "default" : "ghost"}
                size="sm"
                onClick={() => handlePeriodoChange(p)}
                disabled={mudandoPeriodo || loading}
                className={`text-xs ${periodo === p ? 'text-white' : ''}`}
              >
                {mudandoPeriodo && periodo === p ? (
                  <>
                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                    {p === 'hoje' ? 'Hoje' : 
                     p === 'semana' ? 'Semana' : 
                     p === 'mes' ? 'Mês' : 'Ano'}
                  </>
                ) : (
                  p === 'hoje' ? 'Hoje' : 
                  p === 'semana' ? 'Semana' : 
                  p === 'mes' ? 'Mês' : 'Ano'
                )}
              </Button>
            ))}
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refreshData(periodo)}
            disabled={loading}
            className="text-xs sm:text-sm"
          >
            <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Atualizar</span>
            <span className="sm:hidden">Atualizar</span>
          </Button>
          {/* Botão Ver Relatórios - só aparece se tiver permissão */}
          {hasPermission('relatorios') && (
            <Button size="sm" className="bg-gradient-primary text-white text-xs sm:text-sm" onClick={() => navigate("/dashboard/relatorios")}>
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Ver Relatórios</span>
              <span className="sm:hidden">Relatórios</span>
            </Button>
          )}
        </div>

        {/* Mobile Controls */}
        <div className="md:hidden space-y-3 w-full">
          {/* Controles de período */}
          <div className="flex items-center space-x-1 bg-muted rounded-lg p-1 w-full">
            {(['hoje', 'semana', 'mes', 'ano'] as const).map((p) => (
              <Button
                key={p}
                variant={periodo === p ? "default" : "ghost"}
                size="sm"
                onClick={() => handlePeriodoChange(p)}
                disabled={mudandoPeriodo || loading}
                className={`flex-1 text-xs ${periodo === p ? 'text-white' : ''}`}
              >
                {mudandoPeriodo && periodo === p ? (
                  <>
                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                    {p === 'hoje' ? 'Hoje' : 
                     p === 'semana' ? 'Semana' : 
                     p === 'mes' ? 'Mês' : 'Ano'}
                  </>
                ) : (
                  p === 'hoje' ? 'Hoje' : 
                  p === 'semana' ? 'Semana' : 
                  p === 'mes' ? 'Mês' : 'Ano'
                )}
              </Button>
            ))}
          </div>
          
          {/* Botões de ação mobile */}
          <div className="flex gap-2 w-full">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refreshData(periodo)}
              disabled={loading}
              className="flex-1 text-xs"
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            {/* Botão Relatórios mobile - só aparece se tiver permissão */}
            {hasPermission('relatorios') && (
              <Button size="sm" className="bg-gradient-primary text-white flex-1 text-xs" onClick={() => navigate("/dashboard/relatorios")}>
                <TrendingUp className="h-3 w-3 mr-1" />
                Relatórios
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="grid gap-2 sm:gap-3 lg:gap-4 grid-cols-2 xl:grid-cols-4">
        {metricas.map((metrica, index) => (
          <CartaoMetrica key={index} {...metrica} />
        ))}
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {/* Vendas Recentes */}
        <Card className="md:col-span-2 bg-gradient-card shadow-card">
          <CardHeader className="pb-2 sm:pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm sm:text-lg font-semibold">Vendas Recentes</CardTitle>
              {/* Botão Ver Todas - só aparece se tiver permissão de vendas */}
              {hasPermission('vendas') && (
                <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/vendas")} className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground">
                  <Eye className="h-3 w-3 mr-1" />
                  Ver Todas
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
            <div className="space-y-2">
              {vendasRecentes.length > 0 ? (
                <>
                   {(vendasExpandido ? vendasRecentes : vendasRecentes.slice(0, 7)).map((venda, index, arr) => {
                    const statusInfo = getStatusBadge(venda.status);
                    return (
                      <div key={venda.id}>
                        <div className="flex items-center justify-between py-2">
                          <div className="flex-1 min-w-0 mr-3">
                            <p className="font-medium text-xs truncate">
                              {venda.cliente_nome || 'Cliente não informado'}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-muted-foreground">
                              <span>{venda.numero_venda}</span>
                              <span>•</span>
                              <span>{formatDateTime(venda.data_venda)}</span>
                              <span>•</span>
                              {venda.forma_pagamento === 'multiplo_avista' && venda.metodos_pagamento ? (
                                <span className="flex items-center gap-0.5">
                                  {venda.metodos_pagamento.map((metodo: any, idx: number) => (
                                    <span key={idx} className="flex items-center gap-0.5">
                                      {metodo.metodo === 'pix' ? (
                                        <img src={logopixPath} alt="PIX" className="w-2.5 h-2.5" />
                                      ) : (
                                        <span>{getPaymentIcon(metodo.metodo)}</span>
                                      )}
                                      {idx < venda.metodos_pagamento.length - 1 && <span>+</span>}
                                    </span>
                                  ))}
                                </span>
                              ) : venda.forma_pagamento === 'pix' ? (
                                <img src={getPaymentIcon(venda.forma_pagamento)} alt="PIX" className="w-2.5 h-2.5" />
                              ) : (
                                <span>{getPaymentIcon(venda.forma_pagamento)}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-0.5">
                            <Badge 
                              variant={statusInfo.variant as any}
                              className={`${statusInfo.className} text-[10px] h-4 px-1.5 ${venda.status === 'pago' ? 'text-white' : ''}`}
                            >
                              {venda.status === 'pago' ? 'Pago' : 
                               venda.status === 'pendente' ? 'Pendente' : 
                               venda.status.charAt(0).toUpperCase() + venda.status.slice(1)}
                            </Badge>
                            <p className="font-semibold text-xs whitespace-nowrap">
                              {venda.status === 'pendente' && venda.saldo_pendente && venda.saldo_pendente > 0
                                ? formatCurrency(venda.saldo_pendente)
                                : formatCurrency(venda.total)}
                            </p>
                          </div>
                        </div>
                        {index < arr.length - 1 && (
                          <div className="border-t border-border/40" />
                        )}
                      </div>
                    );
                  })}
                  {/* Botão Expandir/Recolher - só aparece se tiver mais de 7 vendas */}
                  {vendasRecentes.length > 7 && (
                    <button
                      onClick={() => setVendasExpandido(!vendasExpandido)}
                      className="w-full flex items-center justify-center gap-1 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors border-t border-border/50 mt-2"
                    >
                      {vendasExpandido ? (
                        <>
                          <ChevronUp className="h-3 w-3" />
                          Mostrar menos
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-3 w-3" />
                          Ver mais {vendasRecentes.length - 7} vendas
                        </>
                      )}
                    </button>
                  )}
                </>
              ) : (
                <div className="text-center py-6 sm:py-8 text-muted-foreground">
                  <ShoppingCart className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
                  <p className="text-sm sm:text-base">Nenhuma venda encontrada</p>
                  <p className="text-xs sm:text-sm">As vendas aparecerão aqui quando forem realizadas</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Alerta de Estoque Baixo */}
        <Card className="bg-gradient-card shadow-card">
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="text-sm sm:text-lg font-semibold flex items-center">
              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-warning" />
              Estoque Baixo
            </CardTitle>
            {/* Filtros de Estoque */}
            {produtosEstoqueBaixoOriginal.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                <button
                  onClick={() => setFiltroEstoque('todos')}
                  className={`h-6 px-2 text-[10px] sm:text-xs rounded-md border transition-colors ${
                    filtroEstoque === 'todos' 
                      ? 'bg-muted border-border text-foreground' 
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  Todos <span className="text-muted-foreground ml-0.5">{produtosEstoqueBaixoOriginal.length}</span>
                </button>
                <button
                  onClick={() => setFiltroEstoque('zerado')}
                  className={`h-6 px-2 text-[10px] sm:text-xs rounded-md border transition-colors ${
                    filtroEstoque === 'zerado' 
                      ? 'bg-muted border-border text-foreground' 
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  Sem Estoque <span className="text-muted-foreground ml-0.5">{countZerado}</span>
                </button>
                <button
                  onClick={() => setFiltroEstoque('baixo')}
                  className={`h-6 px-2 text-[10px] sm:text-xs rounded-md border transition-colors ${
                    filtroEstoque === 'baixo' 
                      ? 'bg-muted border-border text-foreground' 
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  Baixo <span className="text-muted-foreground ml-0.5">{countBaixo}</span>
                </button>
              </div>
            )}
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
            <div className="space-y-3 sm:space-y-4">
              {produtosEstoqueBaixo.length > 0 ? (
                <>
                  {(estoqueExpandido ? produtosEstoqueBaixo : produtosEstoqueBaixo.slice(0, 3)).map((produto, index, arr) => (
                    <div key={produto.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-xs sm:text-sm truncate">{produto.nome}</p>
                        <Badge 
                          variant={Number(produto.estoque_atual) === 0 ? "destructive" : "secondary"}
                          className={`${Number(produto.estoque_atual) === 0 ? "" : "bg-warning/20 border-warning/30 text-black dark:text-black"} text-xs`}
                        >
                          {formatarEstoque(produto)}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Mín: {formatarEstoque({...produto, estoque_atual: produto.estoque_minimo_atual})}</span>
                        <span className="break-words">{formatCurrency(produto.preco)}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{obterTipoEstoqueTexto(produto.tipo_preco)}</span>
                        {produto.categoria_nome && (
                          <span className="truncate">{produto.categoria_nome}</span>
                        )}
                      </div>
                      {index < arr.length - 1 && (
                        <div className="border-t border-border/50" />
                      )}
                    </div>
                  ))}
                  {/* Botão Expandir/Recolher - só aparece se tiver mais de 3 produtos */}
                  {produtosEstoqueBaixo.length > 3 && (
                    <button
                      onClick={() => setEstoqueExpandido(!estoqueExpandido)}
                      className="w-full flex items-center justify-center gap-1 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors border-t border-border/50 mt-2"
                    >
                      {estoqueExpandido ? (
                        <>
                          <ChevronUp className="h-3 w-3" />
                          Mostrar menos
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-3 w-3" />
                          Ver mais {produtosEstoqueBaixo.length - 3} produtos
                        </>
                      )}
                    </button>
                  )}
                  {/* Botão Gerenciar Estoque - só aparece se tiver permissão de produtos */}
                  {hasPermission('produtos') && (
                    <Button size="sm" variant="outline" className="w-full mt-3 sm:mt-4 text-xs sm:text-sm" onClick={() => navigate("/dashboard/produtos")}>
                      Gerenciar Estoque
                    </Button>
                  )}
                </>
              ) : (
                <div className="text-center py-6 sm:py-8 text-muted-foreground">
                  <Package className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
                  {produtosEstoqueBaixoOriginal.length > 0 ? (
                    // Mensagem quando há produtos mas o filtro não retorna resultados
                    <>
                      <p className="text-sm sm:text-base">Nenhum produto encontrado</p>
                      <p className="text-xs sm:text-sm">
                        {filtroEstoque === 'zerado' 
                          ? 'Não há produtos sem estoque' 
                          : 'Não há produtos com estoque baixo'}
                      </p>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="mt-3 sm:mt-4 text-xs sm:text-sm" 
                        onClick={() => setFiltroEstoque('todos')}
                      >
                        Ver Todos
                      </Button>
                    </>
                  ) : (
                    // Mensagem quando realmente não há problemas de estoque
                    <>
                      <p className="text-sm sm:text-base">Estoque em dia!</p>
                      <p className="text-xs sm:text-sm">Todos os produtos estão com estoque adequado</p>
                      {/* Botão Ver Produtos - só aparece se tiver permissão de produtos */}
                      {hasPermission('produtos') && (
                        <Button size="sm" variant="outline" className="w-full mt-3 sm:mt-4 text-xs sm:text-sm" onClick={() => navigate("/dashboard/produtos")}>
                          Ver Produtos
                        </Button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Produtos Mais Vendidos */}
      <Card className="bg-gradient-card shadow-card">
        <CardHeader className="pb-2 sm:pb-4">
          <CardTitle className="text-sm sm:text-lg font-semibold flex items-center">
            <Trophy className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-amber-500" />
            Produtos Mais Vendidos
          </CardTitle>
          {/* Filtros de Período */}
          <div className="flex flex-wrap gap-1 mt-2">
            <button
              onClick={() => setPeriodoProdutos('7')}
              className={`h-6 px-2 text-[10px] sm:text-xs rounded-md border transition-colors ${
                periodoProdutos === '7' 
                  ? 'bg-muted border-border text-foreground' 
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              7 dias
            </button>
            <button
              onClick={() => setPeriodoProdutos('30')}
              className={`h-6 px-2 text-[10px] sm:text-xs rounded-md border transition-colors ${
                periodoProdutos === '30' 
                  ? 'bg-muted border-border text-foreground' 
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              30 dias
            </button>
            <button
              onClick={() => setPeriodoProdutos('90')}
              className={`h-6 px-2 text-[10px] sm:text-xs rounded-md border transition-colors ${
                periodoProdutos === '90' 
                  ? 'bg-muted border-border text-foreground' 
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              3 meses
            </button>
            <button
              onClick={() => setPeriodoProdutos('365')}
              className={`h-6 px-2 text-[10px] sm:text-xs rounded-md border transition-colors ${
                periodoProdutos === '365' 
                  ? 'bg-muted border-border text-foreground' 
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              1 ano
            </button>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
          {loadingTopProdutos ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-lg" />
              ))}
            </div>
          ) : produtosMaisVendidos.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                {(topProdutosExpandido ? produtosMaisVendidos : produtosMaisVendidos.slice(0, 5)).map((produto, index) => (
                  <div 
                    key={produto.id} 
                    className="relative p-3 rounded-lg bg-muted/30 border hover:bg-muted/50 transition-colors"
                  >
                    {/* Ranking Badge */}
                    <div className={`absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      index === 0 ? 'bg-amber-500 text-white' :
                      index === 1 ? 'bg-slate-400 text-white' :
                      index === 2 ? 'bg-amber-700 text-white' :
                      'bg-muted-foreground/20 text-muted-foreground'
                    }`}>
                      {index + 1}
                    </div>
                    
                    <div className="pt-1">
                      <p className="font-medium text-xs truncate" title={produto.nome}>
                        {produto.nome}
                      </p>
                      {produto.categoria_nome && (
                        <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                          {produto.categoria_nome}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
                        <div className="text-[10px] text-muted-foreground">
                          <span className="font-medium text-foreground">{produto.total_vendido}</span> vendidos
                        </div>
                        <p className="font-semibold text-xs text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(produto.receita_total)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Botão Expandir/Recolher - só aparece se tiver mais de 5 produtos */}
              {produtosMaisVendidos.length > 5 && (
                <button
                  onClick={() => setTopProdutosExpandido(!topProdutosExpandido)}
                  className="w-full flex items-center justify-center gap-1 py-2 mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors border-t border-border/50"
                >
                  {topProdutosExpandido ? (
                    <>
                      <ChevronUp className="h-3 w-3" />
                      Mostrar menos
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3 w-3" />
                      Ver mais {produtosMaisVendidos.length - 5} produtos
                    </>
                  )}
                </button>
              )}
            </>
          ) : (
            <div className="text-center py-6 sm:py-8 text-muted-foreground">
              <Trophy className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
              <p className="text-sm sm:text-base">Nenhum produto vendido ainda</p>
              <p className="text-xs sm:text-sm">Os produtos mais vendidos aparecerão aqui</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gráfico de Vendas Diárias */}
      <Card className="bg-gradient-card shadow-card">
        <CardHeader className="pb-2 sm:pb-4">
          <CardTitle className="text-sm sm:text-lg font-semibold flex items-center">
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-emerald-500" />
            Vendas Diárias
          </CardTitle>
          <p className="text-[10px] text-muted-foreground mt-1">Últimos 7 dias</p>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
          {dadosGrafico.length > 0 ? (
            <div className="h-48 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosGrafico} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <XAxis 
                    dataKey="data" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    tickFormatter={(value) => `${value}`}
                    domain={[0, 'dataMax']}
                  />
                  <Tooltip
                    cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                    formatter={(_, __, props: any) => [formatCurrency(props.payload.valorReal), 'Receita']}
                    labelFormatter={(label) => `Data: ${label}`}
                  />
                  <Bar 
                    dataKey="valor" 
                    radius={[4, 4, 0, 0]}
                    maxBarSize={50}
                  >
                    {dadosGrafico.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.temVenda ? "hsl(142, 76%, 45%)" : "hsl(var(--muted-foreground))"}
                        opacity={entry.temVenda ? 1 : 0.2}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-6 sm:py-8 text-muted-foreground">
              <TrendingUp className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
              <p className="text-sm sm:text-base">Nenhum dado disponível</p>
              <p className="text-xs sm:text-sm">O gráfico aparecerá quando houver vendas</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}