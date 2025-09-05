import { useState, useEffect } from "react";
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
  AlertCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useVendas, VendasFilters } from "@/hooks/useVendas";

export default function Vendas() {
  const [termoBusca, setTermoBusca] = useState("");
  const [filtros, setFiltros] = useState<VendasFilters>({
    page: 1,
    limit: 10,
    q: "",
    status: ""
  });
  const [stats, setStats] = useState<any>(null);
  const [vendaSelecionada, setVendaSelecionada] = useState<any>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const navigate = useNavigate();

  const {
    vendas,
    loading,
    error,
    pagination,
    fetchVendas,
    fetchVendasStats,
    formatCurrency,
    formatDateTime,
    getStatusBadge,
    getPaymentIcon,
    getPaymentText
  } = useVendas();

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
  const handleSearch = () => {
    const novosFiltros = {
      ...filtros,
      q: termoBusca,
      page: 1
    };
    setFiltros(novosFiltros);
    fetchVendas(novosFiltros);
  };

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

  // Calcular totais
  const totalVendas = vendas.reduce((acc, venda) => acc + venda.total, 0);
  const totalClientes = new Set(vendas.map(v => v.cliente_id).filter(Boolean)).size;

  // Abrir modal com detalhes da venda
  const abrirDetalhesVenda = (venda: any) => {
    setVendaSelecionada(venda);
    setModalAberto(true);
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
                  {stats ? formatCurrency(stats.receita_total) : formatCurrency(totalVendas)}
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
                <p className="text-sm font-medium text-muted-foreground">Vendas</p>
                <p className="text-2xl font-bold">
                  {stats ? stats.total_vendas : vendas.length}
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
                <p className="text-sm font-medium text-muted-foreground">Ticket Médio</p>
                <p className="text-2xl font-bold">
                  {stats ? formatCurrency(stats.ticket_medio) : 
                   vendas.length > 0 ? formatCurrency(totalVendas / vendas.length) : 
                   formatCurrency(0)}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-accent/10">
                <Receipt className="h-5 w-5 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Clientes</p>
                <p className="text-2xl font-bold">{totalClientes}</p>
              </div>
              <div className="p-2 rounded-lg bg-info/10">
                <User className="h-5 w-5 text-info" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="bg-gradient-card shadow-card">
        <CardContent className="p-6">
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-y-0 md:space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente ou número da venda..."
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button variant="outline" onClick={handleSearch}>
              <Search className="h-4 w-4 mr-2" />
              Buscar
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
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={() => fetchVendas(filtros)}>
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Lista de Vendas */}
      {!loading && !error && (
        <div className="space-y-4">
          {vendas.map((venda) => {
            const statusBadge = getStatusBadge(venda.status);
            const paymentIcon = getPaymentIcon(venda.forma_pagamento);
            const paymentText = getPaymentText(venda.forma_pagamento);
            
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
                          {formatCurrency(venda.total)}
                        </p>
                        <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                          <span>{paymentIcon}</span>
                          <span>{paymentText}</span>
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
      {!loading && !error && vendas.length === 0 && (
        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-12 text-center">
            <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma venda encontrada</h3>
            <p className="text-muted-foreground mb-4">
              {termoBusca || filtros.status ? "Tente ajustar sua busca ou filtros" : "Registre sua primeira venda"}
            </p>
            <Button className="bg-gradient-primary" onClick={() => navigate("/dashboard/nova-venda")}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Venda
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Paginação */}
      {!loading && !error && vendas.length > 0 && pagination.totalPages > 1 && (
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Receipt className="h-5 w-5" />
              <span>Detalhes da Venda #{vendaSelecionada?.numero_venda}</span>
            </DialogTitle>
            <DialogDescription>
              Informações completas da venda e itens
            </DialogDescription>
          </DialogHeader>

          {vendaSelecionada && (
            <div className="space-y-6">
              {/* Informações da Venda */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Informações da Venda</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Número:</span>
                      <span className="font-medium">#{vendaSelecionada.numero_venda}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Data:</span>
                      <span className="font-medium">{formatDateTime(vendaSelecionada.data_venda)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Status:</span>
                      <Badge className={getStatusBadge(vendaSelecionada.status).className}>
                        {getStatusBadge(vendaSelecionada.status).text}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Forma de Pagamento:</span>
                      <div className="flex items-center space-x-1">
                        <span>{getPaymentIcon(vendaSelecionada.forma_pagamento)}</span>
                        <span className="font-medium">{getPaymentText(vendaSelecionada.forma_pagamento)}</span>
                      </div>
                    </div>
                    {vendaSelecionada.parcelas > 1 && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Parcelas:</span>
                        <span className="font-medium">{vendaSelecionada.parcelas}x</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Cliente</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Nome:</span>
                      <span className="font-medium">{vendaSelecionada.cliente_nome || 'Cliente não informado'}</span>
                    </div>
                    {vendaSelecionada.cliente_email && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Email:</span>
                        <span className="font-medium">{vendaSelecionada.cliente_email}</span>
                      </div>
                    )}
                    {vendaSelecionada.vendedor_nome && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Vendedor:</span>
                        <span className="font-medium">{vendaSelecionada.vendedor_nome}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Itens da Venda */}
              {vendaSelecionada.itens && vendaSelecionada.itens.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Itens da Venda ({vendaSelecionada.itens.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {vendaSelecionada.itens.map((item: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{item.produto_nome}</p>
                            <div className="flex items-center space-x-4 text-xs text-muted-foreground mt-1">
                              <span>Qtd: {item.quantidade}</span>
                              <span>•</span>
                              <span>Unit: {formatCurrency(item.preco_unitario)}</span>
                              {item.desconto > 0 && (
                                <>
                                  <span>•</span>
                                  <span className="text-green-600">Desc: {formatCurrency(item.desconto)}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-primary">
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
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Resumo Financeiro</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Subtotal:</span>
                    <span className="font-medium">{formatCurrency(vendaSelecionada.subtotal)}</span>
                  </div>
                  {vendaSelecionada.desconto > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span className="text-sm">Desconto:</span>
                      <span className="font-medium">-{formatCurrency(vendaSelecionada.desconto)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold pt-2 border-t">
                    <span>Total:</span>
                    <span className="text-primary">{formatCurrency(vendaSelecionada.total)}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Observações */}
              {vendaSelecionada.observacoes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Observações</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{vendaSelecionada.observacoes}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}