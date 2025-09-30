import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { 
  Plus, 
  Search, 
  Filter, 
  ShoppingCart,
  Calendar,
  DollarSign,
  User,
  Receipt,
  Eye,
  CreditCard,
  Banknote,
  Smartphone,
  Loader2,
  AlertCircle,
  Trash2,
  Package,
  FileText
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useVendas, VendasFilters } from "@/hooks/useVendas";
import { useMetodosPagamento } from "@/hooks/useMetodosPagamento";

export default function Vendas() {
  const [termoBusca, setTermoBusca] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [filtros, setFiltros] = useState<VendasFilters>({
    page: 1,
    limit: 10,
    q: "",
    status: "",
    data_inicio: "",
    data_fim: ""
  });
  const [stats, setStats] = useState<any>(null);
  const [vendaSelecionada, setVendaSelecionada] = useState<any>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [modalExclusaoAberto, setModalExclusaoAberto] = useState(false);
  const [excluindoVenda, setExcluindoVenda] = useState(false);
  const navigate = useNavigate();

  // Debounce para busca automática
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  const [buscandoAuto, setBuscandoAuto] = useState(false);

  const {
    vendas,
    loading,
    error,
    pagination,
    saldoEfetivo,
    fetchVendas,
    fetchVendasStats,
    deleteVenda,
    formatCurrency,
    formatDateTime,
    getStatusBadge,
    getPaymentIcon,
    getPaymentText,
    getPaymentColor,
    getDisplayPaymentMethod,
    calcularSaldoPendente,
    calcularEstatisticasPendentes
  } = useVendas();

  const { metodosPagamento } = useMetodosPagamento();

  // Função para separar vendas com pagamento múltiplo
  const separarVendasMultiplas = (vendas: any[], filtroStatus?: string) => {
    const vendasSeparadas: any[] = [];
    
    vendas.forEach(venda => {
      // Verificar se a venda tem pagamento múltiplo (métodos de pagamento + pagamento a prazo)
      const temMetodosPagamento = venda.metodos_pagamento && venda.metodos_pagamento.length > 0;
      const temPagamentoPrazo = venda.pagamento_prazo && venda.pagamento_prazo.status;
      
      if (temMetodosPagamento && temPagamentoPrazo) {
        // Calcular total dos métodos de pagamento (à vista)
        const totalAVista = venda.metodos_pagamento.reduce((sum: number, metodo: any) => 
          sum + (parseFloat(metodo.valor) - (metodo.troco || 0)), 0
        );
        
        // Criar venda à vista
        const vendaAVista = {
          ...venda,
          id: `${venda.id}-avista`,
          numero_venda: `${venda.numero_venda}-AV`,
          status: 'pago',
          total: totalAVista,
          metodos_pagamento: venda.metodos_pagamento,
          pagamento_prazo: null,
          forma_pagamento: 'multiplo_avista',
          observacoes: `${venda.observacoes || ''} - Pagamento à vista (parcial)`.trim()
        };
        
        // Criar venda a prazo
        const vendaPrazo = {
          ...venda,
          id: `${venda.id}-prazo`,
          numero_venda: `${venda.numero_venda}-PZ`,
          status: 'pendente',
          total: venda.pagamento_prazo.valor_com_juros,
          metodos_pagamento: [],
          forma_pagamento: 'prazo',
          observacoes: `${venda.observacoes || ''} - Pagamento a prazo (parcial)`.trim()
        };
        
        // Aplicar filtro de status se especificado
        if (!filtroStatus || filtroStatus === '') {
          // Sem filtro, adicionar ambas as vendas
          vendasSeparadas.push(vendaAVista, vendaPrazo);
        } else if (filtroStatus === 'pago') {
          // Filtro "pagas" - adicionar apenas a venda à vista
          vendasSeparadas.push(vendaAVista);
        } else if (filtroStatus === 'pendente') {
          // Filtro "pendentes" - adicionar apenas a venda a prazo
          vendasSeparadas.push(vendaPrazo);
        }
      } else {
        // Venda normal, adicionar como está (já vem filtrada do backend)
        vendasSeparadas.push(venda);
      }
    });
    return vendasSeparadas;
  };

  // Carregar dados iniciais
  useEffect(() => {
    fetchVendas(filtros);
    loadStats();
  }, []);

  // Carregar estatísticas
  const loadStats = async () => {
    const statsData = await fetchVendasStats('hoje');
    setStats(statsData);
  };

  // Buscar vendas com filtros
  const handleSearch = useCallback(() => {
    const novosFiltros = {
      ...filtros,
      q: termoBusca,
      page: 1
    };
    setFiltros(novosFiltros);
    fetchVendas(novosFiltros);
  }, [termoBusca, filtros, fetchVendas]);

  // Busca automática com debounce
  const handleAutoSearch = useCallback((searchTerm: string) => {
    // Limpar timer anterior
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // Se o termo estiver vazio, buscar imediatamente
    if (!searchTerm.trim()) {
      setBuscandoAuto(false);
      const novosFiltros = {
        ...filtros,
        q: "",
        page: 1
      };
      setFiltros(novosFiltros);
      fetchVendas(novosFiltros);
      return;
    }

    // Se tiver pelo menos 2 caracteres, fazer busca com debounce
    if (searchTerm.trim().length >= 2) {
      setBuscandoAuto(true);
      const timer = setTimeout(() => {
        const novosFiltros = {
          ...filtros,
          q: searchTerm.trim(),
          page: 1
        };
        setFiltros(novosFiltros);
        fetchVendas(novosFiltros).finally(() => {
          setBuscandoAuto(false);
        });
      }, 500); // 500ms de delay

      setDebounceTimer(timer);
    } else {
      setBuscandoAuto(false);
    }
  }, [debounceTimer, filtros, fetchVendas]);

  // Filtrar por data automaticamente
  const handleDataFilter = useCallback(() => {
    const novosFiltros = {
      ...filtros,
      data_inicio: dataInicio,
      data_fim: dataFim,
      page: 1
    };
    setFiltros(novosFiltros);
    fetchVendas(novosFiltros);
  }, [dataInicio, dataFim, filtros, fetchVendas]);

  // Limpar timer quando componente desmontar
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  // Busca automática por data (sem dependência de handleDataFilter para evitar loop)
  useEffect(() => {
    if (dataInicio || dataFim) {
      const novosFiltros = {
        ...filtros,
        data_inicio: dataInicio,
        data_fim: dataFim,
        page: 1
      };
      setFiltros(novosFiltros);
      fetchVendas(novosFiltros);
    }
  }, [dataInicio, dataFim]); // Removido handleDataFilter das dependências

  // Mudar página
  const handlePageChange = (newPage: number) => {
    const novosFiltros = {
      ...filtros,
      page: newPage
    };
    setFiltros(novosFiltros);
    fetchVendas(novosFiltros);
  };

  // Filtrar por status
  const handleStatusFilter = (status: string) => {
    const novosFiltros = {
      ...filtros,
      status: status,
      page: 1
    };
    setFiltros(novosFiltros);
    fetchVendas(novosFiltros);
  };

  // Limpar filtros de data
  const limparFiltrosData = () => {
    setDataInicio("");
    setDataFim("");
    const novosFiltros = {
      ...filtros,
      data_inicio: "",
      data_fim: "",
      page: 1
    };
    setFiltros(novosFiltros);
    fetchVendas(novosFiltros);
  };

  // Limpar pesquisa e filtros
  const limparPesquisa = () => {
    setTermoBusca("");
    setDataInicio("");
    setDataFim("");
    const novosFiltros = {
      page: 1,
      limit: 10,
      q: "",
      status: "",
      data_inicio: "",
      data_fim: ""
    };
    setFiltros(novosFiltros);
    fetchVendas(novosFiltros);
  };

  // Separar vendas com pagamento múltiplo
  const vendasSeparadas = separarVendasMultiplas(vendas, filtros.status);

  // Calcular totais
  const totalVendas = vendasSeparadas.reduce((acc, venda) => {
    // Se a venda tem pagamentos à vista, somar apenas esses valores (excluindo troco)
    if (venda.metodos_pagamento && venda.metodos_pagamento.length > 0) {
      return acc + venda.metodos_pagamento.reduce((sum: number, metodo: any) => 
        sum + (parseFloat(metodo.valor) - (metodo.troco || 0)), 0
      );
    }
    // Caso contrário, usar o total da venda (para compatibilidade)
    return acc + (typeof venda.total === 'number' ? venda.total : parseFloat(venda.total) || 0);
  }, 0);
  
  // Calcular estatísticas de vendas pendentes
  const estatisticasPendentes = calcularEstatisticasPendentes(vendasSeparadas);
  const saldoPendente = estatisticasPendentes.valorTotal;
  


  // Abrir modal com detalhes da venda
  const abrirDetalhesVenda = (venda: any) => {
    setVendaSelecionada(venda);
    setModalAberto(true);
  };

  // Abrir modal de confirmação de exclusão
  const abrirModalExclusao = () => {
    setModalExclusaoAberto(true);
  };

  // Fechar modal de confirmação de exclusão
  const fecharModalExclusao = () => {
    setModalExclusaoAberto(false);
  };

  // Excluir venda
  const handleExcluirVenda = async () => {
    if (!vendaSelecionada) return;

    try {
      setExcluindoVenda(true);
      await deleteVenda(vendaSelecionada.id);
      
      // Fechar modais
      setModalAberto(false);
      setModalExclusaoAberto(false);
      setVendaSelecionada(null);
      
      // Recarregar dados
      await fetchVendas(filtros);
      await loadStats();
      
      // Mostrar mensagem de sucesso
      // Aqui você pode adicionar um toast de sucesso se tiver implementado
      console.log('Venda excluída com sucesso');
    } catch (error) {
      console.error('Erro ao excluir venda:', error);
      // Aqui você pode adicionar um toast de erro se tiver implementado
    } finally {
      setExcluindoVenda(false);
    }
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold">Vendas</h1>
          <p className="text-muted-foreground">
            Gerencie suas vendas e transações
          </p>
        </div>
        <Button className="bg-gradient-primary" onClick={() => navigate("/dashboard/nova-venda")}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Venda
        </Button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Hoje</p>
                <p className="text-2xl font-bold">
                  {stats ? formatCurrency(stats.receita_total || 0) : formatCurrency(totalVendas || 0)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats ? `${stats.total_vendas || 0} vendas hoje` : `${vendas.length || 0} vendas hoje`}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-primary/10">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Vendas</p>
                <p className="text-2xl font-bold">
                  {pagination.total || 0}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats ? `${stats.total_vendas || 0} vendas hoje` : 'Carregando...'}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-secondary/10">
                <ShoppingCart className="h-5 w-5 text-secondary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">A Receber</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {formatCurrency(saldoPendente || 0)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {estatisticasPendentes?.quantidade || 0} {(estatisticasPendentes?.quantidade || 0) === 1 ? 'venda' : 'vendas'} pendente{(estatisticasPendentes?.quantidade || 0) !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-yellow-100">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Saldo Efetivo</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(saldoEfetivo || 0)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Valores já recebidos
                </p>
              </div>
              <div className="p-2 rounded-lg bg-green-100">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="bg-gradient-card shadow-card">
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Busca e Status */}
            <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-y-0 md:space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                {buscandoAuto && (
                  <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                )}
                <Input
                  placeholder="Buscar por nome do cliente, email ou código da venda..."
                  value={termoBusca}
                  onChange={(e) => {
                    setTermoBusca(e.target.value);
                    handleAutoSearch(e.target.value);
                  }}
                  className="pl-10"
                />
              </div>
              <Button 
                variant="outline" 
                onClick={limparPesquisa}
                disabled={!termoBusca && !dataInicio && !dataFim && !filtros.status}
              >
                Limpar
              </Button>
              <div className="flex space-x-2">
                <Button 
                  variant={filtros.status === '' ? "default" : "outline"}
                  onClick={() => handleStatusFilter('')}
                  size="sm"
                >
                  Todas
                </Button>
                <Button 
                  variant={filtros.status === 'pago' ? "default" : "outline"}
                  onClick={() => handleStatusFilter('pago')}
                  size="sm"
                >
                  Pagas
                </Button>
                <Button 
                  variant={filtros.status === 'pendente' ? "default" : "outline"}
                  onClick={() => handleStatusFilter('pendente')}
                  size="sm"
                >
                  Pendentes
                </Button>
              </div>
            </div>

            {/* Filtros de Data */}
            <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-y-0 md:space-x-4">
              <div className="flex space-x-2">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">De:</span>
                </div>
                <Input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  className="w-40"
                />
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">Até:</span>
                <Input
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                  className="w-40"
                />
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  onClick={limparFiltrosData}
                  disabled={!dataInicio && !dataFim}
                  size="sm"
                >
                  Limpar
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading e Error States */}
      {loading && (
        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando vendas...</p>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground mb-4">Venda não encontrada, atualize ou tente mais tarde!</p>
            <Button onClick={() => fetchVendas(filtros)}>
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Lista de Vendas */}
      {!loading && !error && (
        <div className="space-y-4">
          {vendasSeparadas.map((venda) => {
            const statusBadge = getStatusBadge(venda.status);
            const paymentMethod = getDisplayPaymentMethod(venda);
            
            return (
              <Card key={venda.id} className="bg-gradient-card shadow-card hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 rounded-lg bg-primary/10">
                        <ShoppingCart className="h-6 w-6 text-primary" />
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold">#{venda.numero_venda}</h3>
                          <Badge className={statusBadge.className}>
                            {statusBadge.text}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {venda.cliente_nome || 'Cliente não informado'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(venda.data_venda)} • {venda.itens?.length || 0} {venda.itens?.length === 1 ? 'item' : 'itens'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">
                          {venda.pagamento_prazo ? formatCurrency(venda.pagamento_prazo.valor_com_juros) : formatCurrency(venda.total)}
                        </p>
                        <div className="text-sm text-muted-foreground text-right">
                          {/* Exibir múltiplos métodos de pagamento se disponível */}
                          {venda.metodos_pagamento && venda.metodos_pagamento.length > 0 ? (
                            <div className="flex flex-wrap items-center justify-end gap-2">
                              {venda.metodos_pagamento.map((metodo: any, index: number) => (
                                <div key={index} className="flex items-center space-x-1">
                                  <span className={getPaymentColor(metodo.metodo)}>{getPaymentText(metodo.metodo)}</span>
                                </div>
                              ))}
                              {/* Exibir pagamento a prazo se houver */}
                              {venda.pagamento_prazo && (
                                <div className="flex items-center space-x-1">
                                  <span className="text-yellow-600">Prazo</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center justify-end space-x-1">
                              <span className={paymentMethod.color}>{paymentMethod.text}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => abrirDetalhesVenda(venda)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Detalhes
                      </Button>
                    </div>
                  </div>

                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Estado vazio */}
      {!loading && !error && vendasSeparadas.length === 0 && (
        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-12 text-center">
            <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma venda encontrada</h3>
            <p className="text-muted-foreground mb-4">
              {termoBusca || filtros.status || dataInicio || dataFim ? "Tente ajustar sua busca ou filtros. A busca é automática conforme você digita ou seleciona datas." : "Registre sua primeira venda"}
            </p>
            <Button className="bg-gradient-primary" onClick={() => navigate("/dashboard/nova-venda")}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Venda
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Paginação */}
      {!loading && !error && vendasSeparadas.length > 0 && pagination.totalPages > 1 && (
        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Mostrando {((pagination.page - 1) * pagination.limit) + 1} a {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} vendas
              </p>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={!pagination.hasPrev}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={!pagination.hasNext}
                >
                  Próxima
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal de Detalhes da Venda */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-3 border-b border-border/50">
            <DialogTitle className="flex items-center space-x-2 text-xl">
              <div className="p-1.5 rounded-md bg-primary/10">
                <Receipt className="h-5 w-5 text-primary" />
              </div>
              <div>
                <span>Detalhes da Venda</span>
                <span className="text-primary font-bold">#{vendaSelecionada?.numero_venda}</span>
              </div>
            </DialogTitle>
            <DialogDescription className="text-sm mt-1">
              Informações completas da venda, itens e pagamentos
            </DialogDescription>
          </DialogHeader>

          {vendaSelecionada && (
            <div className="space-y-4 py-2">
              {/* Header com Status e Data */}
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg border">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-base">{vendaSelecionada.cliente_nome || 'Cliente não informado'}</h3>
                    {vendaSelecionada.vendedor_nome && (
                      <p className="text-xs text-muted-foreground">Vendedor: {vendaSelecionada.vendedor_nome}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge className={getStatusBadge(vendaSelecionada.status).className + " text-xs px-2 py-1"}>
                    {getStatusBadge(vendaSelecionada.status).text}
                  </Badge>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(vendaSelecionada.data_venda)}
                  </p>
                </div>
              </div>

              {/* Layout em duas colunas */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Itens da Venda */}
                {vendaSelecionada.itens && vendaSelecionada.itens.length > 0 && (
                  <Card className="shadow-sm border-0 bg-gradient-to-br from-white to-slate-50/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center space-x-2 text-lg">
                        <Package className="h-4 w-4 text-primary" />
                        <span>Itens da Venda</span>
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {vendaSelecionada.itens.length} {vendaSelecionada.itens.length === 1 ? 'item' : 'itens'}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {vendaSelecionada.itens.map((item: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-white border border-slate-200 hover:border-primary/20 transition-colors">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm text-slate-900 truncate">
                                {item.produto_nome}
                              </h4>
                              <div className="flex items-center space-x-3 text-xs text-slate-600 mt-1">
                                <span>
                                  Qtd: {item.tipo_preco === 'kg' || item.tipo_preco === 'litros' 
                                    ? parseFloat(item.quantidade).toFixed(3).replace(/\.?0+$/, '')
                                    : Math.round(parseFloat(item.quantidade))}
                                  {item.tipo_preco === 'kg' && ' kg'}
                                  {item.tipo_preco === 'litros' && ' L'}
                                  {item.tipo_preco === 'unidade' && ' un'}
                                </span>
                                <span>•</span>
                                <span>
                                  Unit: {formatCurrency(item.preco_unitario)}
                                  {item.tipo_preco === 'kg' && '/kg'}
                                  {item.tipo_preco === 'litros' && '/L'}
                                  {item.tipo_preco === 'unidade' && '/un'}
                                </span>
                                {item.desconto > 0 && (
                                  <>
                                    <span>•</span>
                                    <span className="text-green-600">Desc: -{formatCurrency(item.desconto)}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="text-right ml-2">
                              <p className="font-semibold text-primary text-sm">
                                {formatCurrency(item.preco_total)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Resumo Financeiro */}
                <Card className="shadow-sm border-0 bg-gradient-to-br from-white to-slate-50/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center space-x-2 text-lg">
                      <DollarSign className="h-4 w-4 text-primary" />
                      <span>Resumo Financeiro</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center py-2 px-3 bg-slate-50 rounded-lg">
                        <span className="text-xs font-medium text-slate-600">Subtotal:</span>
                        <span className="font-semibold text-slate-900 text-sm">{formatCurrency(vendaSelecionada.subtotal)}</span>
                      </div>
                      {vendaSelecionada.desconto > 0 && (
                        <div className="flex justify-between items-center py-2 px-3 bg-green-50 rounded-lg border border-green-200">
                          <span className="text-xs font-medium text-green-700">Desconto:</span>
                          <span className="font-semibold text-green-700 text-sm">-{formatCurrency(vendaSelecionada.desconto)}</span>
                        </div>
                      )}
                  
                      {/* Exibir métodos de pagamento detalhados */}
                      {vendaSelecionada.metodos_pagamento && vendaSelecionada.metodos_pagamento.length > 0 && (
                        <div className="pt-2 border-t border-slate-200">
                          <h4 className="text-xs font-semibold mb-2 text-slate-700 flex items-center">
                            <CreditCard className="h-3 w-3 mr-1" />
                            Métodos de Pagamento
                          </h4>
                          <div className="space-y-2 max-h-32 overflow-y-auto">
                            {vendaSelecionada.metodos_pagamento.map((metodo: any, index: number) => {
                              // O valor que vem do banco já é o valor original (sem taxas)
                              const valorOriginal = parseFloat(metodo.valor) || 0;
                              const parcelas = metodo.parcelas || 1;
                              const taxaParcela = metodo.taxa_parcela || 0;
                              
                              // Para cartão de débito, sempre buscar a taxa do método de pagamento configurado
                              let taxaAplicar = taxaParcela;
                              if (metodo.metodo === 'cartao_debito') {
                                // Buscar a taxa do método de pagamento configurado
                                const metodoDebito = metodosPagamento.find(m => m.tipo === 'cartao_debito');
                                console.log('Método débito encontrado:', metodoDebito);
                                if (metodoDebito) {
                                  taxaAplicar = metodoDebito.taxa || 0;
                                  console.log('Taxa aplicada para débito:', taxaAplicar);
                                }
                              }
                              
                              // Calcular valor com taxa aplicando a taxa sobre o valor original
                              let valorComTaxa = valorOriginal;
                              console.log('Valor original:', valorOriginal, 'Taxa a aplicar:', taxaAplicar);
                              if (taxaAplicar > 0) {
                                // Aplicar taxa simples sobre o valor original
                                valorComTaxa = valorOriginal * (1 + taxaAplicar / 100);
                                console.log('Valor com taxa calculado:', valorComTaxa);
                              }
                              
                              const valorParcela = valorComTaxa / parcelas;
                              
                              return (
                                <div key={index} className="p-2 rounded-lg bg-white border border-slate-200">
                                  <div className="flex justify-between items-center">
                                    <div className="flex items-center space-x-2">
                                      <span className={`text-xs font-medium ${getPaymentColor(metodo.metodo)}`}>
                                        {getPaymentText(metodo.metodo)}
                                      </span>
                                      {parcelas > 1 && (
                                        <Badge variant="outline" className="text-xs px-1 py-0">
                                          {parcelas}x
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="text-right">
                                      <div className="text-sm font-bold text-primary">
                                        {formatCurrency(valorComTaxa)}
                                      </div>
                                      {parcelas > 1 && (
                                        <div className="text-xs text-slate-500">
                                          {formatCurrency(valorParcela)}/parcela
                                        </div>
                                      )}
                                      {metodo.troco > 0 && (
                                        <div className="text-xs text-green-600">
                                          Troco: {formatCurrency(metodo.troco)}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <div className="flex justify-between items-center py-2 px-3 bg-primary/5 rounded-lg border border-primary/20">
                        <span className="text-sm font-bold text-slate-900">Total:</span>
                        <span className="text-lg font-bold text-primary">
                          {vendaSelecionada.pagamento_prazo ? formatCurrency(vendaSelecionada.pagamento_prazo.valor_com_juros) : formatCurrency(vendaSelecionada.total)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Pagamento a Prazo e Observações em linha */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Pagamento a Prazo */}
                {vendaSelecionada.pagamento_prazo && (
                  <Card className="shadow-sm border-0 bg-gradient-to-br from-yellow-50/50 to-orange-50/50 border-yellow-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center space-x-2 text-lg text-yellow-700">
                        <Calendar className="h-4 w-4" />
                        <span>Pagamento a Prazo</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="p-2 bg-white rounded-lg border border-yellow-200">
                            <div className="text-xs text-slate-600">Valor Original:</div>
                            <div className="font-semibold text-sm">{formatCurrency(vendaSelecionada.pagamento_prazo.valor_original)}</div>
                          </div>
                          <div className="p-2 bg-white rounded-lg border border-yellow-200">
                            <div className="text-xs text-slate-600">Prazo:</div>
                            <div className="font-semibold text-sm">{vendaSelecionada.pagamento_prazo.dias} dias</div>
                          </div>
                        </div>
                        
                        <div className="p-2 bg-yellow-50 rounded-lg border border-yellow-300">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-medium text-yellow-700">Juros ({vendaSelecionada.pagamento_prazo.juros}%):</span>
                            <span className="font-semibold text-yellow-700 text-sm">
                              +{formatCurrency((vendaSelecionada.pagamento_prazo.valor_original * parseFloat(vendaSelecionada.pagamento_prazo.juros) / 100))}
                            </span>
                          </div>
                        </div>
                        
                        <div className="p-2 bg-white rounded-lg border border-yellow-200">
                          <div className="text-xs text-slate-600">Vencimento:</div>
                          <div className="font-semibold text-sm">
                            {new Date(vendaSelecionada.pagamento_prazo.data_vencimento).toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                        
                        <div className="p-2 bg-yellow-100 rounded-lg border border-yellow-300">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-bold text-yellow-800">Total a Pagar:</span>
                            <span className="text-lg font-bold text-yellow-800">{formatCurrency(vendaSelecionada.pagamento_prazo.valor_com_juros)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-yellow-700">Status:</span>
                            <Badge className={vendaSelecionada.pagamento_prazo.status === 'pago' ? 'bg-green-100 text-green-800 border-green-200 text-xs' : 'bg-yellow-100 text-yellow-800 border-yellow-200 text-xs'}>
                              {vendaSelecionada.pagamento_prazo.status === 'pago' ? 'Pago' : 'Pendente'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Observações */}
                {vendaSelecionada.observacoes && (
                  <Card className="shadow-sm border-0 bg-gradient-to-br from-white to-slate-50/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center space-x-2 text-lg">
                        <FileText className="h-4 w-4 text-primary" />
                        <span>Observações</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <p className="text-sm text-slate-700 leading-relaxed">{vendaSelecionada.observacoes}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Ações */}
              <Card className="shadow-sm border-0 bg-gradient-to-br from-white to-slate-50/50">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                    <Button 
                      variant="destructive" 
                      onClick={abrirModalExclusao}
                      disabled={vendaSelecionada.status !== 'pendente'}
                      className="w-full sm:w-auto"
                      size="sm"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Cancelar Venda
                    </Button>
                  </div>
                  {vendaSelecionada.status !== 'pendente' && (
                    <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-xs text-amber-700 text-center">
                        <AlertCircle className="h-3 w-3 inline mr-1" />
                        Apenas vendas pendentes podem ser excluídas
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Exclusão */}
      <Dialog open={modalExclusaoAberto} onOpenChange={setModalExclusaoAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <span>Confirmar Exclusão</span>
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir a venda #{vendaSelecionada?.numero_venda}? 
              Esta ação não pode ser desfeita e o estoque dos produtos será restaurado.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 mt-4">
            <Button 
              variant="outline" 
              onClick={fecharModalExclusao}
              disabled={excluindoVenda}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleExcluirVenda}
              disabled={excluindoVenda}
            >
              {excluindoVenda ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}