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
  AlertCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDashboard } from "@/hooks/useDashboard";
import { usePermissions } from "@/hooks/usePermissions";
import { useNotificationContext } from "@/contexts/NotificationContext";
import { useImagePath } from "@/hooks/useImagePath";
import { useState } from "react";

export default function Dashboard() {
  const navigate = useNavigate();
  const [periodo, setPeriodo] = useState<'hoje' | 'semana' | 'mes' | 'ano'>('hoje');
  const [mudandoPeriodo, setMudandoPeriodo] = useState(false);
  const { hasPermission } = usePermissions();
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
      titulo: periodo === 'hoje' ? "Vendas Hoje" : `Vendas ${periodo === 'semana' ? 'da Semana' : periodo === 'mes' ? 'do Mês' : 'do Ano'}`,
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
      titulo: periodo === 'hoje' ? "Pedidos Hoje" : `Pedidos ${periodo === 'semana' ? 'da Semana' : periodo === 'mes' ? 'do Mês' : 'do Ano'}`,
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
      mudanca: data.metricas.produtos.estoque_baixo > 0 ? 
        `${data.metricas.produtos.estoque_baixo} em falta` : 
        "Estoque OK",
      tipoMudanca: (data.metricas.produtos.estoque_baixo > 0 ? "negativa" : "positiva") as "positiva" | "negativa",
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
  const produtosEstoqueBaixo = data?.estoque_baixo || [];

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
                className="text-xs"
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
            <Button size="sm" className="bg-gradient-primary text-xs sm:text-sm" onClick={() => navigate("/dashboard/relatorios")}>
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
                className="flex-1 text-xs"
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
              <Button size="sm" className="bg-gradient-primary flex-1 text-xs" onClick={() => navigate("/dashboard/relatorios")}>
                <TrendingUp className="h-3 w-3 mr-1" />
                Relatórios
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
        {metricas.map((metrica, index) => (
          <CartaoMetrica key={index} {...metrica} />
        ))}
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {/* Vendas Recentes */}
        <Card className="md:col-span-2 bg-gradient-card shadow-card">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
              <CardTitle className="text-sm sm:text-lg font-semibold">Vendas Recentes</CardTitle>
              {/* Botão Ver Todas - só aparece se tiver permissão de vendas */}
              {hasPermission('vendas') && (
                <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/vendas")} className="w-full sm:w-auto text-xs sm:text-sm">
                  <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Ver Todas</span>
                  <span className="sm:hidden">Ver Todas</span>
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-6">
            <div className="space-y-3 sm:space-y-4">
              {vendasRecentes.length > 0 ? (
                vendasRecentes.map((venda) => {
                  const statusInfo = getStatusBadge(venda.status);
                  return (
                    <div key={venda.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 rounded-lg bg-muted/30 border space-y-2 sm:space-y-0">
                      <div className="space-y-1 flex-1 min-w-0">
                        <p className="font-medium text-sm sm:text-base truncate">
                          {venda.cliente_nome || 'Cliente não informado'}
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {venda.numero_venda} • {formatDateTime(venda.data_venda)}
                        </p>
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                          {venda.forma_pagamento === 'multiplo_avista' && venda.metodos_pagamento ? (
                            // Para vendas múltiplas à vista, mostrar os métodos de pagamento usados
                            <div className="flex flex-wrap items-center gap-1">
                              {venda.metodos_pagamento.map((metodo: any, index: number) => (
                                <div key={index} className="flex items-center space-x-1">
                                  {metodo.metodo === 'pix' ? (
                                    <img 
                                      src={logopixPath} 
                                      alt="PIX" 
                                      className="w-3 h-3"
                                    />
                                  ) : (
                                    <span className="text-xs">{getPaymentIcon(metodo.metodo)}</span>
                                  )}
                                  <span className="text-xs">{getPaymentText(metodo.metodo)}</span>
                                  {index < venda.metodos_pagamento.length - 1 && (
                                    <span className="text-xs">+</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : venda.forma_pagamento === 'prazo' ? (
                            // Para vendas a prazo, mostrar ícone e texto de prazo
                            <>
                              <span>{getPaymentIcon(venda.forma_pagamento)}</span>
                              <span>{getPaymentText(venda.forma_pagamento)}</span>
                            </>
                          ) : (
                            // Para vendas normais, mostrar forma de pagamento padrão
                            <>
                              {venda.forma_pagamento === 'pix' ? (
                                <img 
                                  src={getPaymentIcon(venda.forma_pagamento)} 
                                  alt="PIX" 
                                  className="w-3 h-3 sm:w-4 sm:h-4"
                                />
                              ) : (
                                <span>{getPaymentIcon(venda.forma_pagamento)}</span>
                              )}
                              <span>{getPaymentText(venda.forma_pagamento)}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:flex-col sm:items-end sm:space-y-1">
                        <p className="font-semibold text-sm sm:text-base break-words">{formatCurrency(venda.total)}</p>
                        <Badge 
                          variant={statusInfo.variant as any}
                          className={`${statusInfo.className} text-xs`}
                        >
                          {venda.status === 'pago' ? 'Pago' : 
                           venda.status === 'pendente' ? 'Pendente' : 
                           venda.status.charAt(0).toUpperCase() + venda.status.slice(1)}
                        </Badge>
                      </div>
                    </div>
                  );
                })
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
          <CardHeader>
            <CardTitle className="text-sm sm:text-lg font-semibold flex items-center">
              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-warning" />
              Estoque Baixo
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6">
            <div className="space-y-3 sm:space-y-4">
              {produtosEstoqueBaixo.length > 0 ? (
                <>
                  {produtosEstoqueBaixo.map((produto, index) => (
                    <div key={produto.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-xs sm:text-sm truncate">{produto.nome}</p>
                        <Badge 
                          variant={produto.estoque_atual === 0 ? "destructive" : "secondary"}
                          className={`${produto.estoque_atual === 0 ? "" : "bg-warning/20 text-warning-foreground border-warning/30"} text-xs`}
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
                      {index < produtosEstoqueBaixo.length - 1 && (
                        <div className="border-t border-border/50" />
                      )}
                    </div>
                  ))}
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
                  <p className="text-sm sm:text-base">Estoque em dia!</p>
                  <p className="text-xs sm:text-sm">Todos os produtos estão com estoque adequado</p>
                  {/* Botão Ver Produtos - só aparece se tiver permissão de produtos */}
                  {hasPermission('produtos') && (
                    <Button size="sm" variant="outline" className="w-full mt-3 sm:mt-4 text-xs sm:text-sm" onClick={() => navigate("/dashboard/produtos")}>
                      Ver Produtos
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}