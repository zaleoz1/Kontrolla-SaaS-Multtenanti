import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ConfiguracoesSidebar } from "@/components/layout/ConfiguracoesSidebar";
import { useToast } from "@/hooks/use-toast";
import { useBilling } from "@/hooks/useBilling";
import { useConfiguracoes } from "@/hooks/useConfiguracoes";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PaymentMethodCard } from "@/components/assinatura/PaymentMethodCard";
import {
  DollarSign,
  RefreshCw,
  CreditCard,
  AlertTriangle,
  Sparkles,
  Crown,
  Zap,
  Building2,
  Check,
  ExternalLink,
  Shield,
  Calendar,
  Menu,
  Receipt,
  FileText,
  RotateCcw,
  XCircle,
  ChevronDown,
  ChevronUp,
  List,
} from "lucide-react";

const PLANOS = [
  {
    id: 'starter' as const,
    nome: 'Starter',
    descricao: 'Perfeito para pequenos negócios',
    preco: 'R$ 57',
    periodo: '/mês',
    icone: Zap,
    cor: 'blue',
    recursos: [
      'Até 100 produtos',
      'Até 500 vendas/mês',
      '1 usuário',
      'Relatórios básicos',
      'Suporte por email',
      'Catálogo online',
      'Backup diário',
    ],
  },
  {
    id: 'professional' as const,
    nome: 'Professional',
    descricao: 'Ideal para empresas em crescimento',
    preco: 'R$ 167',
    periodo: '/mês',
    icone: Crown,
    cor: 'primary',
    destaque: true,
    recursos: [
      'Produtos ilimitados',
      'Vendas ilimitadas',
      'Até 5 usuários',
      'Relatórios avançados',
      'NF-e integrada',
      'Suporte prioritário',
      'API completa',
      'Backup automático',
      'Integrações populares',
    ],
  },
  {
    id: 'enterprise' as const,
    nome: 'Enterprise',
    descricao: 'Para grandes empresas',
    preco: 'R$ 397',
    periodo: '/mês',
    icone: Building2,
    cor: 'purple',
    recursos: [
      'Tudo do Professional',
      'Usuários ilimitados',
      'Multi-empresas',
      'Integrações customizadas',
      'Suporte 24/7',
      'Treinamento dedicado',
      'SLA 99.9% garantido',
      'Consultoria incluída',
      'White-label disponível',
    ],
  },
];

export default function Assinatura() {
  const { toast } = useToast();
  const billing = useBilling();
  const { dadosTenant, dadosConta, carregarDados, atualizarPlanoTenant } = useConfiguracoes();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [planoSelecionado, setPlanoSelecionado] = useState<'starter' | 'professional' | 'enterprise'>('professional');
  const [recursosExpandidos, setRecursosExpandidos] = useState(false);

  const canManageBilling = useMemo(() => {
    return dadosConta?.role === 'admin';
  }, [dadosConta?.role]);

  // Priorizar dados do Stripe (billing.status) para plano, status e renovação
  const planoAtualId = useMemo(() => {
    const p = (billing.status?.plano || dadosTenant?.plano || '').toString().trim().toLowerCase();
    return p || '';
  }, [billing.status?.plano, dadosTenant?.plano]);

  const stripeStatusLabel = (status: string | null) => {
    if (!status) return { label: 'Sem assinatura', variant: 'secondary' as const, cor: 'text-muted-foreground' };
    const s = status.toLowerCase();
    if (s === 'active' || s === 'trialing') return { label: s === 'trialing' ? 'Em teste' : 'Ativa', variant: 'default' as const, cor: 'text-green-600 dark:text-green-400' };
    if (s === 'past_due' || s === 'unpaid') return { label: 'Pagamento pendente', variant: 'destructive' as const, cor: 'text-red-600 dark:text-red-400' };
    if (s === 'canceled' || s === 'incomplete' || s === 'incomplete_expired') return { label: 'Inativa', variant: 'secondary' as const, cor: 'text-muted-foreground' };
    return { label: status, variant: 'secondary' as const, cor: 'text-muted-foreground' };
  };

  // Normaliza e formata a data da próxima renovação (Stripe envia Unix; backend pode enviar ISO ou MySQL)
  const proximaRenovacaoLabel = (): string => {
    const raw = billing.status?.subscription_current_period_end;
    if (raw == null || raw === '') return '—';
    let date: Date;
    if (typeof raw === 'number') {
      date = new Date(raw * 1000);
    } else if (typeof raw === 'string') {
      const normalized = raw.trim().replace(' ', 'T');
      date = new Date(normalized);
    } else {
      return '—';
    }
    if (Number.isNaN(date.getTime())) return '—';
    return formatDate(date);
  };

  // Ao abrir a página, buscar sempre status do billing, tenant e histórico (faturas + cartões)
  useEffect(() => {
    billing.fetchStatus();
    carregarDados();
    billing.fetchBillingHistory();
  }, [billing.fetchStatus, billing.fetchBillingHistory, carregarDados]);

  // Atualizar plano selecionado quando tenant ou billing retornarem o plano atual
  useEffect(() => {
    const planoAtual = (dadosTenant?.plano || billing.status?.plano || '').toString().toLowerCase();
    if (planoAtual === 'starter' || planoAtual === 'professional' || planoAtual === 'enterprise') {
      setPlanoSelecionado(planoAtual as 'starter' | 'professional' | 'enterprise');
    }
  }, [dadosTenant?.plano, billing.status?.plano]);

  const handleAssinarOuAlterarPlano = async () => {
    if (!canManageBilling) {
      toast({
        title: "Permissão insuficiente",
        description: "Somente o usuário admin do tenant pode gerenciar a assinatura.",
        variant: "default"
      });
      return;
    }
    try {
      // Salvar o plano selecionado no banco antes de redirecionar ao Stripe
      await atualizarPlanoTenant(planoSelecionado);
    } catch {
      toast({
        title: "Erro ao salvar plano",
        description: "Não foi possível atualizar o plano. Tente novamente.",
        variant: "destructive"
      });
      return;
    }
    const { url } = await billing.createCheckoutSession(planoSelecionado);
    if (url) {
      window.location.href = url;
      return;
    }
    toast({
      title: "Erro",
      description: billing.error || "Não foi possível iniciar o checkout do Stripe.",
      variant: "default"
    });
  };

  const handleAbrirPortalStripe = async () => {
    if (!canManageBilling) {
      toast({
        title: "Permissão insuficiente",
        description: "Somente o usuário admin do tenant pode gerenciar a assinatura.",
        variant: "default"
      });
      return;
    }
    const { url } = await billing.createPortalSession();
    if (url) {
      window.location.href = url;
      return;
    }
    toast({
      title: "Erro",
      description: billing.error || "Não foi possível abrir o portal do Stripe.",
      variant: "default"
    });
  };

  const statusInfo = useMemo(
    () => stripeStatusLabel(billing.status?.subscription_status ?? null),
    [billing.status?.subscription_status]
  );

  return (
    <div className="flex h-screen bg-background prevent-zoom touch-optimized mobile-scroll overflow-x-hidden">
      <ConfiguracoesSidebar
        activeTab="assinatura"
        onTabChange={() => {}}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 overflow-y-auto w-full max-w-full overflow-x-hidden">
        <div className="lg:hidden flex items-center justify-between p-3 sm:p-4 border-b bg-background">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden"
          >
            <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <h1 className="text-base sm:text-lg font-semibold">Assinatura</h1>
          <div className="w-9" />
        </div>

        <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="w-full">
        <div className="mb-4 md:mb-0">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Assinatura</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-2">
            Gerencie seu plano, cobrança e dados da assinatura
          </p>
        </div>
      </div>

      {/* Status atual do plano */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-b">
          <CardHeader className="pb-3 sm:pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10">
                  <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg sm:text-xl">Plano Atual</CardTitle>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Visão geral da sua assinatura
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="text-xs sm:text-sm h-8 sm:h-9 w-fit"
                onClick={() => billing.fetchStatus()}
                disabled={billing.loading}
              >
                <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 mr-1.5 ${billing.loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>
          </CardHeader>
        </div>
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-start gap-3 p-3 sm:p-4 rounded-xl bg-muted/50 border border-border/50">
              <div className="p-1.5 rounded-lg bg-blue-500/10 mt-0.5">
                <Crown className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs text-muted-foreground font-medium uppercase tracking-wider">Plano</p>
                <p className="text-sm sm:text-base font-semibold capitalize truncate mt-0.5">
                  {planoAtualId || 'Não definido'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 sm:p-4 rounded-xl bg-muted/50 border border-border/50">
              <div className={`p-1.5 rounded-lg mt-0.5 ${
                statusInfo.variant === 'default' ? 'bg-green-500/10' : 
                statusInfo.variant === 'destructive' ? 'bg-red-500/10' : 'bg-muted'
              }`}>
                <Shield className={`h-4 w-4 ${statusInfo.cor}`} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs text-muted-foreground font-medium uppercase tracking-wider">Status</p>
                <div className="mt-0.5">
                  <Badge variant={statusInfo.variant as any} className="text-[10px] sm:text-xs">
                    {billing.loading ? 'Carregando...' : statusInfo.label}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 sm:p-4 rounded-xl bg-muted/50 border border-border/50">
              <div className="p-1.5 rounded-lg bg-orange-500/10 mt-0.5">
                <Calendar className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs text-muted-foreground font-medium uppercase tracking-wider">Próxima renovação</p>
                <p className="text-sm sm:text-base font-semibold mt-0.5">
                  {billing.loading ? '…' : proximaRenovacaoLabel()}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 sm:p-4 rounded-xl bg-muted/50 border border-border/50">
              <div className="p-1.5 rounded-lg bg-purple-500/10 mt-0.5">
                <CreditCard className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs text-muted-foreground font-medium uppercase tracking-wider">Gerenciar</p>
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-sm font-semibold mt-0.5"
                  onClick={handleAbrirPortalStripe}
                  disabled={billing.loading || !canManageBilling}
                >
                  Portal Stripe
                  <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cartão cadastrado */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <CardHeader className="pb-3 sm:pb-4 border-b bg-muted/20">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            Cartão cadastrado
          </CardTitle>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Forma de pagamento usada na assinatura
          </p>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {billing.loadingHistory ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Carregando…
            </div>
          ) : billing.paymentMethods.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {billing.paymentMethods.map((pm) => (
                <PaymentMethodCard
                  key={pm.id}
                  brand={pm.brand ?? "card"}
                  last4={pm.last4 ?? "****"}
                  expMonth={pm.exp_month ?? 0}
                  expYear={pm.exp_year ?? 0}
                  className="w-full max-w-[180px]"
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 py-4 text-muted-foreground">
              <p className="text-sm">Nenhum cartão cadastrado.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAbrirPortalStripe}
                disabled={!billing.status?.stripe_customer_id || !canManageBilling}
              >
                Gerenciar no Portal Stripe
                <ExternalLink className="h-3 w-3 ml-1.5" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Histórico de pagamentos, cancelamentos e reembolsos */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <CardHeader className="pb-3 sm:pb-4 border-b bg-muted/20">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Receipt className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                Histórico de pagamentos
              </CardTitle>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Faturas, reembolsos e cancelamentos
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => billing.fetchBillingHistory()}
              disabled={billing.loadingHistory}
            >
              <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 mr-1.5 ${billing.loadingHistory ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {billing.loadingHistory ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-6">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Carregando histórico…
            </div>
          ) : billing.invoices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Nenhuma fatura encontrada.</p>
              <p className="text-xs mt-1">O histórico aparecerá após a primeira cobrança.</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border/60">
                    <th className="text-left py-3 px-3 font-medium text-muted-foreground">Data</th>
                    <th className="text-left py-3 px-3 font-medium text-muted-foreground">Fatura</th>
                    <th className="text-right py-3 px-3 font-medium text-muted-foreground">Valor</th>
                    <th className="text-left py-3 px-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-right py-3 px-3 font-medium text-muted-foreground">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {billing.invoices.map((inv) => {
                    const isRefunded = inv.statusLabel === 'refunded' || inv.amount_refunded > 0;
                    const isVoid = (inv.status || '').toLowerCase() === 'void';
                    const isPaid = (inv.status || '').toLowerCase() === 'paid' && !isRefunded;
                    const statusBadge =
                      isRefunded ? { label: 'Reembolsado', variant: 'secondary' as const, icon: RotateCcw } :
                      isVoid ? { label: 'Cancelado', variant: 'outline' as const, icon: XCircle } :
                      isPaid ? { label: 'Pago', variant: 'default' as const, icon: Check } :
                      { label: inv.status || '—', variant: 'secondary' as const, icon: FileText };
                    const StatusIcon = statusBadge.icon;
                    return (
                      <tr key={inv.id} className="border-b border-border/40 hover:bg-muted/30">
                        <td className="py-3 px-3 whitespace-nowrap">
                          {inv.created ? formatDate(inv.created) : '—'}
                        </td>
                        <td className="py-3 px-3 font-medium">{inv.number}</td>
                        <td className="py-3 px-3 text-right">
                          {isRefunded && inv.amount_refunded > 0 ? (
                            <span className="text-red-600 dark:text-red-400">-{formatCurrency(inv.amount_refunded)}</span>
                          ) : (
                            formatCurrency(inv.amount_paid)
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <Badge variant={statusBadge.variant} className="text-[10px] sm:text-xs gap-1">
                            <StatusIcon className="h-3 w-3" />
                            {statusBadge.label}
                          </Badge>
                        </td>
                        <td className="py-3 px-3 text-right">
                          {(inv.invoice_pdf || inv.hosted_invoice_url) && (
                            <a
                              href={inv.invoice_pdf || inv.hosted_invoice_url || '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline text-xs font-medium inline-flex items-center gap-1"
                            >
                              PDF
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Seleção de Plano */}
      <div>
        <div className="mb-4">
          <h2 className="text-lg sm:text-xl font-semibold">Escolha seu plano</h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Selecione o plano que melhor se adapta ao seu negócio
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {PLANOS.map((plano) => {
            const Icon = plano.icone;
            const isAtual = planoAtualId === plano.id;
            const isSelecionado = planoSelecionado === plano.id;
            const corClasses = {
              blue: {
                bg: 'bg-blue-500/10 dark:bg-blue-500/20',
                icon: 'text-blue-600 dark:text-blue-400',
                ring: 'ring-blue-500/25',
                gradient: 'from-blue-500/5 to-transparent',
              },
              primary: {
                bg: 'bg-primary/10 dark:bg-primary/20',
                icon: 'text-primary',
                ring: 'ring-primary/25',
                gradient: 'from-primary/5 to-transparent',
              },
              purple: {
                bg: 'bg-purple-500/10 dark:bg-purple-500/20',
                icon: 'text-purple-600 dark:text-purple-400',
                ring: 'ring-purple-500/25',
                gradient: 'from-purple-500/5 to-transparent',
              },
            };
            const cores = corClasses[plano.cor as keyof typeof corClasses] ?? corClasses.primary;
            return (
              <Card
                key={plano.id}
                className={`relative cursor-pointer overflow-hidden transition-all duration-300 ease-out rounded-2xl border flex flex-col h-full ${
                  isSelecionado
                    ? `ring-1 ${cores.ring} shadow-lg border-primary/50 bg-gradient-to-b ${cores.gradient} scale-[1.01]`
                    : 'border-border/60 hover:border-border/80 hover:shadow-lg'
                } ${plano.destaque ? 'md:-mt-1 md:mb-1 shadow-lg' : ''}`}
                onClick={() => canManageBilling && setPlanoSelecionado(plano.id)}
              >
                {/* Faixa superior colorida */}
                <div className={`h-1 w-full ${
                  plano.cor === 'blue' ? 'bg-gradient-to-r from-blue-500 to-blue-400' :
                  plano.cor === 'purple' ? 'bg-gradient-to-r from-purple-500 to-purple-400' :
                  'bg-gradient-to-r from-primary to-primary/80'
                }`} />
                {isAtual && (
                  <div className="absolute top-4 right-4 z-10">
                    <Badge variant="secondary" className="bg-background/95 backdrop-blur text-[10px] sm:text-xs px-2.5 py-0.5 border border-primary/30 text-primary font-medium">
                      Atual
                    </Badge>
                  </div>
                )}
                <CardHeader className="pb-3 sm:pb-4 pt-6 sm:pt-8 px-5 sm:px-6">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                    <div className={`p-3 rounded-xl ${cores.bg} w-fit`}>
                      <Icon className={`h-6 w-6 sm:h-7 sm:w-7 ${cores.icon}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-lg sm:text-xl font-bold tracking-tight">{plano.nome}</CardTitle>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-snug">{plano.descricao}</p>
                      <p className="mt-2 text-lg sm:text-xl font-bold text-foreground">
                        {plano.preco}
                        <span className="text-sm font-normal text-muted-foreground ml-1">{plano.periodo}</span>
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-5 sm:px-6 pb-5 sm:pb-6 pt-0 flex flex-col flex-1 min-h-0">
                  {recursosExpandidos && (
                    <ul className="space-y-3">
                      {plano.recursos.map((recurso, i) => (
                        <li key={i} className="flex items-center gap-3 text-sm">
                          <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                            isSelecionado ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
                          }`}>
                            <Check className="h-3 w-3" strokeWidth={2.5} />
                          </span>
                          <span className={isSelecionado ? 'text-foreground/90' : 'text-muted-foreground'}>{recurso}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="mt-auto pt-4 border-t border-border/60">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full gap-2 text-muted-foreground hover:text-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        setRecursosExpandidos((prev) => !prev);
                      }}
                    >
                      <List className="h-4 w-4" />
                      {recursosExpandidos ? 'Ocultar recursos' : 'Ver recursos'}
                      {recursosExpandidos ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Ação de assinar */}
        <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <Button
            onClick={handleAssinarOuAlterarPlano}
            className="h-10 sm:h-11 px-6 sm:px-8 bg-gradient-primary text-white text-sm sm:text-base font-medium"
            disabled={billing.loading || !canManageBilling}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {planoAtualId === planoSelecionado ? 'Gerenciar assinatura' : 'Assinar / Alterar plano'}
          </Button>
          {!canManageBilling && (
            <p className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1.5">
              <Shield className="h-3 w-3" />
              Somente o usuário <b>admin</b> do tenant pode alterar a assinatura.
            </p>
          )}
        </div>
      </div>

      {/* Erro do billing */}
      {billing.error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-red-500/10 mt-0.5">
                <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm sm:text-base font-medium">Problema ao carregar dados de cobrança</p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">{billing.error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 text-xs h-8"
                  onClick={() => billing.fetchStatus()}
                  disabled={billing.loading}
                >
                  <RefreshCw className={`h-3 w-3 mr-1.5 ${billing.loading ? 'animate-spin' : ''}`} />
                  Tentar novamente
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
        </div>
      </div>
    </div>
  );
}
