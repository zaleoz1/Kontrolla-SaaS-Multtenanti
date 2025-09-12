import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Plus, 
  Search, 
  Filter, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  CreditCard,
  Receipt,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Building,
  FileText,
  RefreshCw,
  AlertCircle
} from "lucide-react";
import { useTransacoes } from "@/hooks/useTransacoes";
import { useContasReceber } from "@/hooks/useContasReceber";
import { useContasPagar } from "@/hooks/useContasPagar";
import { useFinanceiroStats } from "@/hooks/useFinanceiroStats";

export default function Financeiro() {
  const [termoBusca, setTermoBusca] = useState("");
  const [periodo, setPeriodo] = useState<'hoje' | 'semana' | 'mes' | 'ano'>('mes');
  const [filtroStatus, setFiltroStatus] = useState<string>('');
  const navigate = useNavigate();

  // Hooks para dados financeiros
  const { 
    transacoes, 
    loading: loadingTransacoes, 
    error: errorTransacoes,
    buscarTransacoes 
  } = useTransacoes();
  
  const { 
    contas: contasReceber, 
    loading: loadingContasReceber, 
    error: errorContasReceber,
    buscarContas: buscarContasReceber,
    marcarComoPago: marcarContaReceberComoPago
  } = useContasReceber();
  
  const { 
    contas: contasPagar, 
    loading: loadingContasPagar, 
    error: errorContasPagar,
    buscarContas: buscarContasPagar,
    marcarComoPago: marcarContaPagarComoPago
  } = useContasPagar();
  
  const { 
    stats, 
    loading: loadingStats, 
    error: errorStats,
    buscarStats 
  } = useFinanceiroStats();

  // Carregar dados iniciais
  useEffect(() => {
    const carregarDados = async () => {
      try {
        await Promise.all([
          buscarStats(periodo),
          buscarTransacoes({ limit: 10 }),
          buscarContasReceber({ limit: 10 }),
          buscarContasPagar({ limit: 10 })
        ]);
      } catch (error) {
        console.error('Erro ao carregar dados financeiros:', error);
      }
    };

    carregarDados();
  }, [periodo]); // Removido as funções das dependências para evitar loop infinito

  // Função para recarregar dados
  const recarregarDados = async () => {
    try {
      await Promise.all([
        buscarStats(periodo),
        buscarTransacoes({ limit: 10 }),
        buscarContasReceber({ limit: 10 }),
        buscarContasPagar({ limit: 10 })
      ]);
    } catch (error) {
      console.error('Erro ao recarregar dados:', error);
    }
  };

  const obterBadgeStatus = (status: string, dias?: number) => {
    switch (status) {
      case "pendente":
        return <Badge variant="secondary">Pendente</Badge>;
      case "vencido":
        return <Badge variant="destructive">Vencido</Badge>;
      case "pago":
      case "concluida":
        return <Badge className="bg-success hover:bg-success/90">Pago</Badge>;
      default:
        return <Badge variant="secondary">Desconhecido</Badge>;
    }
  };

  // Calcular totais dos dados reais
  const totalReceber = stats?.stats?.contas_receber?.valor_pendente || 0;
  const totalPagar = stats?.stats?.contas_pagar?.valor_pendente || 0;
  const fluxoCaixa = stats?.stats?.fluxo_caixa || 0;
  const saldoAtual = (stats?.stats?.total_entradas || 0) - (stats?.stats?.total_saidas || 0);

  // Função para calcular dias de vencimento
  const calcularDiasVencimento = (dataVencimento: string) => {
    const hoje = new Date();
    const vencimento = new Date(dataVencimento);
    const diffTime = vencimento.getTime() - hoje.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Função para formatar valor
  const formatarValor = (valor: number) => {
    return valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  };

  // Função para formatar data
  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString("pt-BR");
  };

  // Função para marcar conta como paga
  const handleMarcarComoPago = async (id: number, tipo: 'receber' | 'pagar', tipo_origem?: 'conta_pagar' | 'transacao' | 'conta_receber' | 'venda' | 'transacao_entrada') => {
    try {
      if (tipo === 'receber') {
        await marcarContaReceberComoPago(id, undefined, tipo_origem as 'conta_receber' | 'venda' | 'transacao_entrada');
      } else {
        await marcarContaPagarComoPago(id, undefined, tipo_origem as 'conta_pagar' | 'transacao');
      }
      await recarregarDados();
    } catch (error) {
      console.error('Erro ao marcar como pago:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold">Financeiro</h1>
          <p className="text-muted-foreground">
            Controle financeiro e fluxo de caixa
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={periodo} onValueChange={(value: 'hoje' | 'semana' | 'mes' | 'ano') => setPeriodo(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hoje">Hoje</SelectItem>
              <SelectItem value="semana">Esta Semana</SelectItem>
              <SelectItem value="mes">Este Mês</SelectItem>
              <SelectItem value="ano">Este Ano</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={recarregarDados} disabled={loadingStats}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loadingStats ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button className="bg-gradient-primary" onClick={() => navigate("/dashboard/nova-transacao")}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Transação
          </Button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">A Receber</p>
                {loadingStats ? (
                  <Skeleton className="h-8 w-32" />
                ) : (
                  <p className="text-2xl font-bold text-success">
                    {formatarValor(totalReceber)}
                  </p>
                )}
              </div>
              <div className="p-2 rounded-lg bg-success/10">
                <ArrowUpRight className="h-5 w-5 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">A Pagar</p>
                {loadingStats ? (
                  <Skeleton className="h-8 w-32" />
                ) : (
                  <p className="text-2xl font-bold text-destructive">
                    {formatarValor(totalPagar)}
                  </p>
                )}
              </div>
              <div className="p-2 rounded-lg bg-destructive/10">
                <ArrowDownRight className="h-5 w-5 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Fluxo de Caixa</p>
                {loadingStats ? (
                  <Skeleton className="h-8 w-32" />
                ) : (
                  <p className={`text-2xl font-bold ${fluxoCaixa >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {formatarValor(fluxoCaixa)}
                  </p>
                )}
              </div>
              <div className={`p-2 rounded-lg ${fluxoCaixa >= 0 ? 'bg-success/10' : 'bg-destructive/10'}`}>
                <Wallet className={`h-5 w-5 ${fluxoCaixa >= 0 ? 'text-success' : 'text-destructive'}`} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Saldo Atual</p>
                {loadingStats ? (
                  <Skeleton className="h-8 w-32" />
                ) : (
                  <p className="text-2xl font-bold text-primary">
                    {formatarValor(saldoAtual)}
                  </p>
                )}
              </div>
              <div className="p-2 rounded-lg bg-primary/10">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Abas Financeiras */}
      <Tabs defaultValue="receber" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="receber">Contas a Receber</TabsTrigger>  
          <TabsTrigger value="pagar">Contas a Pagar</TabsTrigger>
          <TabsTrigger value="transacoes">Transações</TabsTrigger>
          <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
        </TabsList>

        <TabsContent value="receber" className="space-y-4">
          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Contas a Receber</CardTitle>
                <Badge variant="secondary">
                  {loadingContasReceber ? '...' : contasReceber.length} pendentes
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {errorContasReceber && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Erro ao carregar contas a receber: {errorContasReceber}
                  </AlertDescription>
                </Alert>
              )}
              
              {loadingContasReceber ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                      <div className="text-right space-y-2">
                        <Skeleton className="h-6 w-20" />
                        <Skeleton className="h-8 w-24" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : contasReceber.length === 0 ? (
                <div className="text-center py-8">
                  <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhuma conta a receber encontrada</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {contasReceber.map((item) => {
                    const dias = calcularDiasVencimento(item.data_vencimento);
                    return (
                      <div key={item.id} className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <p className="font-semibold">{item.cliente_nome || 'Cliente não informado'}</p>
                            {obterBadgeStatus(item.status, dias)}
                            {item.tipo_origem === 'venda' && (
                              <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                                Venda
                              </Badge>
                            )}
                            {item.tipo_origem === 'transacao_entrada' && (
                              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                                Transação
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{item.descricao}</p>
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            <span>Vencimento: {formatarData(item.data_vencimento)}</span>
                            {item.parcela && <span>Parcela: {item.parcela}</span>}
                            {item.status === "vencido" && (
                              <span className="text-destructive font-medium">
                                {Math.abs(dias)} dias em atraso
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right space-y-1">
                          <p className="text-lg font-bold text-success">{formatarValor(item.valor)}</p>
                          {item.status === 'pendente' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleMarcarComoPago(item.id!, 'receber', item.tipo_origem)}
                            >
                              <Receipt className="h-4 w-4 mr-2" />
                              Receber
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pagar" className="space-y-4">
          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Contas a Pagar</CardTitle>
                <Badge variant="secondary">
                  {loadingContasPagar ? '...' : contasPagar.length} pendentes
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {errorContasPagar && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Erro ao carregar contas a pagar: {errorContasPagar}
                  </AlertDescription>
                </Alert>
              )}
              
              {loadingContasPagar ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                      <div className="text-right space-y-2">
                        <Skeleton className="h-6 w-20" />
                        <Skeleton className="h-8 w-24" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : contasPagar.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhuma conta a pagar encontrada</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {contasPagar.map((item) => {
                    const dias = calcularDiasVencimento(item.data_vencimento);
                    return (
                      <div key={item.id} className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <p className="font-semibold">{item.fornecedor}</p>
                            {obterBadgeStatus(item.status, dias)}
                            {item.tipo_origem === 'transacao' && (
                              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                                Transação
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{item.descricao}</p>
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            <span>Vencimento: {formatarData(item.data_vencimento)}</span>
                            {item.categoria && (
                              <Badge variant="outline" className="text-xs">{item.categoria}</Badge>
                            )}
                            {item.status === "vencido" && (
                              <span className="text-destructive font-medium">
                                {Math.abs(dias)} dias em atraso
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right space-y-1">
                          <p className="text-lg font-bold text-destructive">{formatarValor(item.valor)}</p>
                          {item.status === 'pendente' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleMarcarComoPago(item.id!, 'pagar', item.tipo_origem)}
                            >
                              <CreditCard className="h-4 w-4 mr-2" />
                              Pagar
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transacoes" className="space-y-4">
          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle>Transações Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              {errorTransacoes && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Erro ao carregar transações: {errorTransacoes}
                  </AlertDescription>
                </Alert>
              )}
              
              {loadingTransacoes ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                      <div className="flex items-center space-x-4">
                        <Skeleton className="h-10 w-10 rounded-lg" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-48" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                      </div>
                      <div className="text-right space-y-2">
                        <Skeleton className="h-6 w-20" />
                        <Skeleton className="h-6 w-16" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : transacoes.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhuma transação encontrada</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {transacoes.map((transacao) => {
                    const dataHora = new Date(transacao.data_transacao);
                    const data = dataHora.toLocaleDateString("pt-BR");
                    const hora = dataHora.toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' });
                    
                    return (
                      <div key={transacao.id} className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                        <div className="flex items-center space-x-4">
                          <div className={`p-2 rounded-lg ${transacao.tipo === 'entrada' ? 'bg-success/10' : 'bg-destructive/10'}`}>
                            {transacao.tipo === 'entrada' ? (
                              <ArrowUpRight className="h-5 w-5 text-success" />
                            ) : (
                              <ArrowDownRight className="h-5 w-5 text-destructive" />
                            )}
                          </div>
                          <div className="space-y-1">
                            <p className="font-semibold">{transacao.descricao}</p>
                            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                              <span>{data} às {hora}</span>
                              <span>{transacao.metodo_pagamento}</span>
                              {transacao.cliente_nome && <span>Cliente: {transacao.cliente_nome}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="text-right space-y-1">
                          <p className={`text-lg font-bold ${transacao.tipo === 'entrada' ? 'text-success' : 'text-destructive'}`}>
                            {transacao.tipo === 'entrada' ? '+' : '-'}{formatarValor(transacao.valor)}
                          </p>
                          {obterBadgeStatus(transacao.status)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="relatorios" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="bg-gradient-card shadow-card">
              <CardContent className="p-6 text-center">
                <FileText className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Fluxo de Caixa</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Relatório detalhado de entradas e saídas
                </p>
                <Button 
                  size="sm" 
                  className="bg-gradient-primary"
                  onClick={() => navigate('/relatorios/financeiro')}
                >
                  Gerar Relatório
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card shadow-card">
              <CardContent className="p-6 text-center">
                <TrendingUp className="h-12 w-12 text-success mx-auto mb-4" />
                <h3 className="font-semibold mb-2">DRE Mensal</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Demonstrativo de resultados do exercício
                </p>
                <Button 
                  size="sm" 
                  className="bg-gradient-primary"
                  onClick={() => navigate('/relatorios/financeiro?tipo=dre')}
                >
                  Gerar Relatório
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card shadow-card">
              <CardContent className="p-6 text-center">
                <Building className="h-12 w-12 text-info mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Balanço</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Posição patrimonial da empresa  
                </p>
                <Button 
                  size="sm" 
                  className="bg-gradient-primary"
                  onClick={() => navigate('/relatorios/financeiro?tipo=balanco')}
                >
                  Gerar Relatório
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}