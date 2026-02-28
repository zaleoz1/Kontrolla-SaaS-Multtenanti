import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ConfiguracoesSidebar } from "@/components/layout/ConfiguracoesSidebar";
import { useToast } from "@/hooks/use-toast";
import { useBilling } from "@/hooks/useBilling";
import { useConfiguracoes } from "@/hooks/useConfiguracoes";
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
  Menu
} from "lucide-react";

const PLANOS = [
  {
    id: 'starter' as const,
    nome: 'Starter',
    descricao: 'Ideal para quem está começando',
    icone: Zap,
    cor: 'blue',
    recursos: ['Até 100 produtos', 'Relatórios básicos', '1 usuário', 'Suporte por email'],
  },
  {
    id: 'professional' as const,
    nome: 'Professional',
    descricao: 'Para negócios em crescimento',
    icone: Crown,
    cor: 'primary',
    destaque: true,
    recursos: ['Produtos ilimitados', 'Relatórios avançados', 'Até 5 usuários', 'Suporte prioritário', 'Catálogo online'],
  },
  {
    id: 'enterprise' as const,
    nome: 'Enterprise',
    descricao: 'Solução completa para grandes operações',
    icone: Building2,
    cor: 'purple',
    recursos: ['Tudo do Professional', 'Usuários ilimitados', 'API dedicada', 'Suporte 24/7', 'Gerente de conta'],
  },
];

export default function Assinatura() {
  const { toast } = useToast();
  const billing = useBilling();
  const { dadosTenant, dadosConta } = useConfiguracoes();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [planoSelecionado, setPlanoSelecionado] = useState<'starter' | 'professional' | 'enterprise'>('professional');

  const canManageBilling = useMemo(() => {
    return dadosConta?.role === 'admin';
  }, [dadosConta?.role]);

  const planoAtualId = useMemo(() => {
    return (dadosTenant?.plano || billing.status?.plano || '').toString().toLowerCase();
  }, [dadosTenant?.plano, billing.status?.plano]);

  const stripeStatusLabel = (status: string | null) => {
    if (!status) return { label: 'Sem assinatura', variant: 'secondary' as const, cor: 'text-muted-foreground' };
    const s = status.toLowerCase();
    if (s === 'active' || s === 'trialing') return { label: s === 'trialing' ? 'Em teste' : 'Ativa', variant: 'default' as const, cor: 'text-green-600 dark:text-green-400' };
    if (s === 'past_due' || s === 'unpaid') return { label: 'Pagamento pendente', variant: 'destructive' as const, cor: 'text-red-600 dark:text-red-400' };
    if (s === 'canceled' || s === 'incomplete' || s === 'incomplete_expired') return { label: 'Inativa', variant: 'secondary' as const, cor: 'text-muted-foreground' };
    return { label: status, variant: 'secondary' as const, cor: 'text-muted-foreground' };
  };

  useEffect(() => {
    billing.fetchStatus();
    const planoAtual = (dadosTenant?.plano || '').toLowerCase();
    if (planoAtual === 'starter' || planoAtual === 'professional' || planoAtual === 'enterprise') {
      setPlanoSelecionado(planoAtual as any);
    }
  }, [billing.fetchStatus, dadosTenant?.plano]);

  const handleAssinarOuAlterarPlano = async () => {
    if (!canManageBilling) {
      toast({
        title: "Permissão insuficiente",
        description: "Somente o usuário admin do tenant pode gerenciar a assinatura.",
        variant: "default"
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

  const statusInfo = stripeStatusLabel(billing.status?.subscription_status || null);

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
                  {billing.status?.subscription_current_period_end
                    ? new Date(billing.status.subscription_current_period_end).toLocaleDateString('pt-BR')
                    : '—'}
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
                className={`relative cursor-pointer overflow-hidden transition-all duration-300 ease-out rounded-2xl border ${
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
                {plano.destaque && (
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
                    <Badge className="bg-gradient-to-r from-primary to-primary/90 text-white shadow-lg text-[10px] sm:text-xs px-3 py-0.5 font-medium border-0">
                      Mais popular
                    </Badge>
                  </div>
                )}
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
                    <div className="min-w-0">
                      <CardTitle className="text-lg sm:text-xl font-bold tracking-tight">{plano.nome}</CardTitle>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-snug">{plano.descricao}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-5 sm:px-6 pb-5 sm:pb-6 pt-0">
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
                  {isSelecionado && (
                    <div className="mt-5 pt-4 border-t border-border/60">
                      <div className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-primary/10 text-primary text-sm font-semibold">
                        <Check className="h-4 w-4" strokeWidth={2.5} />
                        Selecionado
                      </div>
                    </div>
                  )}
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
