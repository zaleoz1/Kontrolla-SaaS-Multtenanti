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
import { useState } from "react";

export default function Dashboard() {
  const navigate = useNavigate();
  const [periodo, setPeriodo] = useState<'hoje' | 'semana' | 'mes' | 'ano'>('hoje');
  const [mudandoPeriodo, setMudandoPeriodo] = useState(false);
  
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
    formatVariation
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
      <div className="space-y-6">
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
          <div className="flex items-center space-x-2">
            <Skeleton className="h-8 w-32" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="md:col-span-2 h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Bem-vindo de volta! Aqui está o resumo da sua loja.
            </p>
          </div>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-4"
              onClick={() => refreshData(periodo)}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Bem-vindo de volta! Aqui está o resumo da sua loja {periodo === 'hoje' ? 'hoje' : `no ${periodo}`}.
          </p>
        </div>
        <div className="flex items-center space-x-2">
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
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button size="sm" className="bg-gradient-primary" onClick={() => navigate("/dashboard/relatorios")}>
            <TrendingUp className="h-4 w-4 mr-2" />
            Ver Relatórios
          </Button>
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metricas.map((metrica, index) => (
          <CartaoMetrica key={index} {...metrica} />
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Vendas Recentes */}
        <Card className="md:col-span-2 bg-gradient-card shadow-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Vendas Recentes</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/vendas")}>
                <Eye className="h-4 w-4 mr-2" />
                Ver Todas
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {vendasRecentes.length > 0 ? (
                vendasRecentes.map((venda) => {
                  const statusInfo = getStatusBadge(venda.status);
                  return (
                    <div key={venda.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border">
                      <div className="space-y-1">
                        <p className="font-medium">
                          {venda.cliente_nome || 'Cliente não informado'}
                        </p>
                        <p className="text-sm text-muted-foreground">
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
                                      src={getPaymentIcon(metodo.metodo)} 
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
                                  className="w-4 h-4"
                                />
                              ) : (
                                <span>{getPaymentIcon(venda.forma_pagamento)}</span>
                              )}
                              <span>{getPaymentText(venda.forma_pagamento)}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="font-semibold">{formatCurrency(venda.total)}</p>
                        <Badge 
                          variant={statusInfo.variant as any}
                          className={statusInfo.className}
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
                <div className="text-center py-8 text-muted-foreground">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma venda encontrada</p>
                  <p className="text-sm">As vendas aparecerão aqui quando forem realizadas</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Alerta de Estoque Baixo */}
        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-warning" />
              Estoque Baixo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {produtosEstoqueBaixo.length > 0 ? (
                <>
                  {produtosEstoqueBaixo.map((produto, index) => (
                    <div key={produto.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm">{produto.nome}</p>
                        <Badge 
                          variant={produto.estoque === 0 ? "destructive" : "secondary"}
                          className={produto.estoque === 0 ? "" : "bg-warning/20 text-warning-foreground border-warning/30"}
                        >
                          {produto.estoque} un.
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Mín: {produto.estoque_minimo}</span>
                        <span>{formatCurrency(produto.preco)}</span>
                      </div>
                      {produto.categoria_nome && (
                        <div className="text-xs text-muted-foreground">
                          {produto.categoria_nome}
                        </div>
                      )}
                      {index < produtosEstoqueBaixo.length - 1 && (
                        <div className="border-t border-border/50" />
                      )}
                    </div>
                  ))}
                  <Button size="sm" variant="outline" className="w-full mt-4" onClick={() => navigate("/dashboard/produtos")}>
                    Gerenciar Estoque
                  </Button>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Estoque em dia!</p>
                  <p className="text-sm">Todos os produtos estão com estoque adequado</p>
                  <Button size="sm" variant="outline" className="w-full mt-4" onClick={() => navigate("/dashboard/produtos")}>
                    Ver Produtos
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}