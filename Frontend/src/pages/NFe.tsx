import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Plus, 
  Search, 
  Filter, 
  FileText,
  Download,
  Eye,
  Send,
  Printer,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  Calendar,
  Building,
  User,
  DollarSign,
  Settings,
  Trash2,
  RefreshCw,
  Loader2
} from "lucide-react";
import { useNfe, Nfe, NfeItem, NfeCreate } from "@/hooks/useNfe";
import { useClientes, Cliente } from "@/hooks/useClientes";
import { useProdutos, Produto } from "@/hooks/useProdutos";
import { useToast } from "@/hooks/use-toast";

export default function NFe() {
  const { toast } = useToast();
  
  // Hooks de dados
  const {
    nfes,
    loading,
    error,
    stats,
    pagination,
    fetchNfes,
    fetchNfe,
    createNfe,
    transmitirNfe,
    cancelarNfe,
    deleteNfe,
    fetchStats,
    formatCurrency,
    formatDate,
    getStatusLabel,
    getStatusBadgeClass,
    getStatusIconClass
  } = useNfe();

  const { clientes, buscarClientes } = useClientes();
  const { produtos, buscarProdutos } = useProdutos();

  // Estados locais
  const [termoBusca, setTermoBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState<string>("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [tabAtual, setTabAtual] = useState("lista");

  // Estados do modal de detalhes
  const [nfeSelecionada, setNfeSelecionada] = useState<Nfe | null>(null);
  const [modalDetalhesAberto, setModalDetalhesAberto] = useState(false);

  // Estados do formulário de emissão
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);
  const [termoBuscaCliente, setTermoBuscaCliente] = useState("");
  const [mostrarListaClientes, setMostrarListaClientes] = useState(false);
  const [itensNfe, setItensNfe] = useState<{
    produto: Produto;
    quantidade: number;
    preco_unitario: number;
  }[]>([]);
  const [observacoes, setObservacoes] = useState("");
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null);
  const [quantidadeProduto, setQuantidadeProduto] = useState(1);

  // Estados de confirmação
  const [nfeParaTransmitir, setNfeParaTransmitir] = useState<Nfe | null>(null);
  const [nfeParaCancelar, setNfeParaCancelar] = useState<Nfe | null>(null);
  const [nfeParaDeletar, setNfeParaDeletar] = useState<Nfe | null>(null);

  // Carregar dados iniciais
  useEffect(() => {
    fetchNfes();
    fetchStats();
    buscarClientes({ limit: 100 });
    buscarProdutos({ limit: 100, status: 'ativo' });
  }, []);

  // Função de busca com debounce
  const handleBusca = useCallback(() => {
    fetchNfes({
      q: termoBusca,
      status: statusFiltro || undefined,
      data_inicio: dataInicio || undefined,
      data_fim: dataFim || undefined,
      page: 1,
      limit: pagination.limit
    });
  }, [termoBusca, statusFiltro, dataInicio, dataFim, fetchNfes, pagination.limit]);

  // Efeito de debounce para busca
  useEffect(() => {
    const timer = setTimeout(() => {
      handleBusca();
    }, 500);
    return () => clearTimeout(timer);
  }, [termoBusca, statusFiltro, dataInicio, dataFim]);

  // Obter ícone do status
  const getStatusIcon = (status: Nfe['status']) => {
    switch (status) {
      case "autorizada":
        return <CheckCircle className={`h-4 w-4 ${getStatusIconClass(status)}`} />;
      case "pendente":
        return <Clock className={`h-4 w-4 ${getStatusIconClass(status)}`} />;
      case "cancelada":
        return <XCircle className={`h-4 w-4 ${getStatusIconClass(status)}`} />;
      case "erro":
        return <AlertTriangle className={`h-4 w-4 ${getStatusIconClass(status)}`} />;
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  // Ver detalhes da NF-e
  const handleVerDetalhes = async (nfe: Nfe) => {
    const nfeCompleta = await fetchNfe(nfe.id);
    if (nfeCompleta) {
      setNfeSelecionada(nfeCompleta);
      setModalDetalhesAberto(true);
    }
  };

  // Adicionar produto à NF-e
  const handleAdicionarProduto = () => {
    if (!produtoSelecionado || quantidadeProduto <= 0) {
      toast({
        title: "Erro",
        description: "Selecione um produto e informe a quantidade",
        variant: "destructive"
      });
      return;
    }

    // Verificar se produto já está na lista
    const existe = itensNfe.find(item => item.produto.id === produtoSelecionado.id);
    if (existe) {
      toast({
        title: "Atenção",
        description: "Este produto já está na lista",
        variant: "destructive"
      });
      return;
    }

    setItensNfe(prev => [...prev, {
      produto: produtoSelecionado,
      quantidade: quantidadeProduto,
      preco_unitario: produtoSelecionado.preco
    }]);

    setProdutoSelecionado(null);
    setQuantidadeProduto(1);

    toast({
      title: "Sucesso",
      description: "Produto adicionado à NF-e"
    });
  };

  // Remover produto da NF-e
  const handleRemoverProduto = (index: number) => {
    setItensNfe(prev => prev.filter((_, i) => i !== index));
  };

  // Calcular total da NF-e
  const calcularTotal = () => {
    return itensNfe.reduce((total, item) => {
      return total + (item.quantidade * item.preco_unitario);
    }, 0);
  };

  // Emitir NF-e
  const handleEmitirNfe = async () => {
    if (itensNfe.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos um produto à NF-e",
        variant: "destructive"
      });
      return;
    }

    try {
      const dados: NfeCreate = {
        cliente_id: clienteSelecionado?.id,
        cnpj_cpf: clienteSelecionado?.cpf_cnpj,
        itens: itensNfe.map(item => ({
          produto_id: item.produto.id!,
          quantidade: item.quantidade,
          preco_unitario: item.preco_unitario
        })),
        observacoes
      };

      await createNfe(dados);

      toast({
        title: "Sucesso",
        description: "NF-e criada com sucesso! Você pode transmiti-la na lista."
      });

      // Limpar formulário
      setClienteSelecionado(null);
      setTermoBuscaCliente("");
      setItensNfe([]);
      setObservacoes("");
      setTabAtual("lista");
      
      // Atualizar estatísticas
      fetchStats();
    } catch (err) {
      toast({
        title: "Erro",
        description: err instanceof Error ? err.message : "Erro ao criar NF-e",
        variant: "destructive"
      });
    }
  };

  // Transmitir NF-e
  const handleConfirmarTransmissao = async () => {
    if (!nfeParaTransmitir) return;

    try {
      await transmitirNfe(nfeParaTransmitir.id);
      toast({
        title: "Sucesso",
        description: "NF-e transmitida e autorizada com sucesso!"
      });
      fetchStats();
    } catch (err) {
      toast({
        title: "Erro",
        description: err instanceof Error ? err.message : "Erro ao transmitir NF-e",
        variant: "destructive"
      });
    } finally {
      setNfeParaTransmitir(null);
    }
  };

  // Cancelar NF-e
  const handleConfirmarCancelamento = async () => {
    if (!nfeParaCancelar) return;

    try {
      await cancelarNfe(nfeParaCancelar.id);
      toast({
        title: "Sucesso",
        description: "NF-e cancelada com sucesso!"
      });
      fetchStats();
    } catch (err) {
      toast({
        title: "Erro",
        description: err instanceof Error ? err.message : "Erro ao cancelar NF-e",
        variant: "destructive"
      });
    } finally {
      setNfeParaCancelar(null);
    }
  };

  // Deletar NF-e
  const handleConfirmarDelecao = async () => {
    if (!nfeParaDeletar) return;

    try {
      await deleteNfe(nfeParaDeletar.id);
      toast({
        title: "Sucesso",
        description: "NF-e deletada com sucesso!"
      });
      fetchStats();
    } catch (err) {
      toast({
        title: "Erro",
        description: err instanceof Error ? err.message : "Erro ao deletar NF-e",
        variant: "destructive"
      });
    } finally {
      setNfeParaDeletar(null);
    }
  };

  // Filtrar clientes pelo termo de busca
  const clientesFiltrados = termoBuscaCliente.trim() 
    ? clientes.filter(c => 
        c.nome.toLowerCase().includes(termoBuscaCliente.toLowerCase()) ||
        c.cpf_cnpj?.includes(termoBuscaCliente)
      )
    : clientes;

  // Paginação
  const handlePaginacao = (pagina: number) => {
    fetchNfes({
      page: pagina,
      limit: pagination.limit,
      q: termoBusca,
      status: statusFiltro || undefined,
      data_inicio: dataInicio || undefined,
      data_fim: dataFim || undefined
    });
  };

  return (
    <div className="space-y-6 overflow-x-hidden prevent-zoom touch-optimized mobile-scroll">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold">Nota Fiscal Eletrônica</h1>
          <p className="text-muted-foreground">
            Emissão e gerenciamento de NF-e
          </p>
        </div>
        <Button 
          onClick={() => fetchNfes()} 
          variant="outline"
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de NF-e</p>
                <p className="text-2xl font-bold">{stats?.total_nfe || 0}</p>
              </div>
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Autorizadas</p>
                <p className="text-2xl font-bold text-success">{stats?.nfe_autorizadas || 0}</p>
              </div>
              <div className="p-2 rounded-lg bg-success/10">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold text-warning">{stats?.nfe_pendentes || 0}</p>
              </div>
              <div className="p-2 rounded-lg bg-warning/10">
                <Clock className="h-5 w-5 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Valor Total</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(stats?.valor_total_autorizado || 0)}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-accent/10">
                <DollarSign className="h-5 w-5 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Abas de NF-e */}
      <Tabs value={tabAtual} onValueChange={setTabAtual} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="lista">Lista de NF-e</TabsTrigger>
          <TabsTrigger value="emitir">Emitir NF-e</TabsTrigger>
          <TabsTrigger value="configuracoes">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="lista" className="space-y-4">
          {/* Busca e Filtros */}
          <Card className="bg-gradient-card shadow-card">
            <CardContent className="p-6">
              <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-y-0 md:space-x-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por cliente, número ou CPF/CNPJ..."
                    value={termoBusca}
                    onChange={(e) => setTermoBusca(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select 
                  value={statusFiltro || "todos"} 
                  onValueChange={(value) => setStatusFiltro(value === "todos" ? "" : value)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="autorizada">Autorizada</SelectItem>
                    <SelectItem value="cancelada">Cancelada</SelectItem>
                    <SelectItem value="erro">Erro</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  className="w-[150px]"
                  placeholder="Data início"
                />
                <Input
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                  className="w-[150px]"
                  placeholder="Data fim"
                />
              </div>
            </CardContent>
          </Card>

          {/* Lista de NF-e */}
          {loading ? (
            <Card className="bg-gradient-card shadow-card">
              <CardContent className="p-12 text-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Carregando NF-e...</p>
              </CardContent>
            </Card>
          ) : nfes.length === 0 ? (
            <Card className="bg-gradient-card shadow-card">
              <CardContent className="p-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma NF-e encontrada</h3>
                <p className="text-muted-foreground mb-4">
                  {termoBusca || statusFiltro ? "Tente ajustar sua busca" : "Emita sua primeira nota fiscal"}
                </p>
                <Button 
                  className="bg-gradient-primary text-white"
                  onClick={() => setTabAtual("emitir")}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Emitir NF-e
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {nfes.map((nfe) => (
                <Card key={nfe.id} className="bg-gradient-card shadow-card hover:shadow-lg transition-shadow duration-300">
                  <CardContent className="p-6">
                    <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
                      <div className="flex items-center space-x-4">
                        <div className="p-3 rounded-lg bg-muted/30">
                          {getStatusIcon(nfe.status)}
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold">NF-e #{nfe.numero}</h3>
                            <Badge className={getStatusBadgeClass(nfe.status)}>
                              {getStatusLabel(nfe.status)}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {nfe.cliente_nome || "Cliente não informado"}
                          </p>
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            <span>{nfe.cliente_cnpj_cpf || nfe.cnpj_cpf || "-"}</span>
                            <span>•</span>
                            <span>Série: {nfe.serie}</span>
                            <span>•</span>
                            <span>{formatDate(nfe.data_emissao)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-2xl font-bold text-foreground">
                            {formatCurrency(nfe.valor_total)}
                          </p>
                          <p className="text-sm text-muted-foreground capitalize">
                            {nfe.ambiente}
                          </p>
                        </div>

                        <div className="flex items-center space-x-2">
                          {nfe.status === "autorizada" && (
                            <>
                              <Button variant="outline" size="sm" title="Download PDF">
                                <Download className="h-4 w-4 mr-2" />
                                PDF
                              </Button>
                              <Button variant="outline" size="sm" title="Download XML">
                                <Download className="h-4 w-4 mr-2" />
                                XML
                              </Button>
                              <Button variant="outline" size="sm" title="Imprimir">
                                <Printer className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                title="Cancelar NF-e"
                                onClick={() => setNfeParaCancelar(nfe)}
                              >
                                <XCircle className="h-4 w-4 text-destructive" />
                              </Button>
                            </>
                          )}
                          
                          {nfe.status === "pendente" && (
                            <>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setNfeParaTransmitir(nfe)}
                              >
                                <Send className="h-4 w-4 mr-2" />
                                Transmitir
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setNfeParaDeletar(nfe)}
                                title="Excluir NF-e"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </>
                          )}
                          
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleVerDetalhes(nfe)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Ver
                          </Button>
                        </div>
                      </div>
                    </div>

                    {nfe.chave_acesso && (
                      <div className="mt-4 pt-4 border-t border-border/50">
                        <p className="text-xs text-muted-foreground font-mono">
                          <strong>Chave:</strong> {nfe.chave_acesso}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              {/* Paginação */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center space-x-2 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePaginacao(pagination.page - 1)}
                    disabled={!pagination.hasPrev}
                  >
                    Anterior
                  </Button>
                  <span className="flex items-center px-4 text-sm text-muted-foreground">
                    Página {pagination.page} de {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePaginacao(pagination.page + 1)}
                    disabled={!pagination.hasNext}
                  >
                    Próxima
                  </Button>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="emitir" className="space-y-4">
          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle>Emitir Nova NF-e</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                {/* Dados do Cliente */}
                <Card className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Dados do Cliente
                  </h3>
                  <div className="space-y-4">
                    {!clienteSelecionado ? (
                      <div className="relative">
                        <Label>Buscar Cliente</Label>
                        <Input
                          placeholder="Digite para buscar ou clique para ver todos..."
                          value={termoBuscaCliente}
                          onChange={(e) => setTermoBuscaCliente(e.target.value)}
                          onFocus={() => setMostrarListaClientes(true)}
                          onBlur={() => {
                            // Delay para permitir clique no item
                            setTimeout(() => setMostrarListaClientes(false), 200);
                          }}
                        />
                        
                        {mostrarListaClientes && clientesFiltrados.length > 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-background border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {clientesFiltrados.slice(0, 10).map(cliente => (
                              <div
                                key={cliente.id}
                                className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0 transition-colors"
                                onClick={() => {
                                  setClienteSelecionado(cliente);
                                  setTermoBuscaCliente("");
                                  setMostrarListaClientes(false);
                                }}
                              >
                                <p className="font-medium">{cliente.nome}</p>
                                <p className="text-sm text-muted-foreground">{cliente.cpf_cnpj || "Sem CPF/CNPJ"}</p>
                              </div>
                            ))}
                            {clientesFiltrados.length > 10 && (
                              <div className="p-2 text-center text-sm text-muted-foreground bg-muted/50">
                                +{clientesFiltrados.length - 10} clientes...
                              </div>
                            )}
                          </div>
                        )}
                        
                        {mostrarListaClientes && clientesFiltrados.length === 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-background border rounded-lg shadow-lg p-4 text-center">
                            <p className="text-sm text-muted-foreground">
                              {clientes.length === 0 ? "Nenhum cliente cadastrado" : "Nenhum cliente encontrado"}
                            </p>
                          </div>
                        )}
                        
                        <p className="text-xs text-muted-foreground mt-1">
                          {clientes.length} clientes disponíveis
                        </p>
                      </div>
                    ) : (
                      <div className="p-4 bg-muted/30 rounded-lg">
                        <Label className="text-xs text-muted-foreground mb-2 block">Cliente Selecionado</Label>
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{clienteSelecionado.nome}</p>
                            <p className="text-sm text-muted-foreground">{clienteSelecionado.cpf_cnpj || "Sem CPF/CNPJ"}</p>
                            <p className="text-sm text-muted-foreground">{clienteSelecionado.email || "Sem email"}</p>
                            {clienteSelecionado.telefone && (
                              <p className="text-sm text-muted-foreground">{clienteSelecionado.telefone}</p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setClienteSelecionado(null);
                              setTermoBuscaCliente("");
                            }}
                            title="Remover cliente"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    <p className="text-xs text-muted-foreground">
                      * Cliente opcional - deixe em branco para consumidor final
                    </p>
                  </div>
                </Card>

                {/* Observações */}
                <Card className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Dados da Nota
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <Label>Série</Label>
                      <Input value="001" disabled />
                    </div>
                    <div>
                      <Label>Ambiente</Label>
                      <Input value="Homologação" disabled />
                    </div>
                    <div>
                      <Label>Observações</Label>
                      <Textarea
                        placeholder="Observações da NF-e..."
                        value={observacoes}
                        onChange={(e) => setObservacoes(e.target.value)}
                        rows={3}
                      />
                    </div>
                  </div>
                </Card>
              </div>

              {/* Produtos */}
              <div className="mt-6">
                <h3 className="font-semibold mb-4">Produtos / Serviços</h3>
                
                {/* Adicionar produto */}
                <Card className="p-4 bg-muted/30 mb-4">
                  <div className="grid gap-4 md:grid-cols-4 items-end">
                    <div className="md:col-span-2">
                      <Label>Produto</Label>
                      <Select
                        value={produtoSelecionado?.id?.toString() || ""}
                        onValueChange={(value) => {
                          const produto = produtos.find(p => p.id?.toString() === value);
                          setProdutoSelecionado(produto || null);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um produto" />
                        </SelectTrigger>
                        <SelectContent>
                          {produtos
                            .filter(produto => produto.id !== undefined && produto.id !== null)
                            .map(produto => (
                              <SelectItem key={produto.id} value={produto.id!.toString()}>
                                {produto.nome} - {formatCurrency(produto.preco)}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Quantidade</Label>
                      <Input
                        type="number"
                        min="1"
                        value={quantidadeProduto}
                        onChange={(e) => setQuantidadeProduto(parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <Button onClick={handleAdicionarProduto}>
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar
                    </Button>
                  </div>
                </Card>

                {/* Lista de produtos */}
                {itensNfe.length === 0 ? (
                  <Card className="p-8 text-center bg-muted/20">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Nenhum produto adicionado. Selecione os produtos acima.
                    </p>
                  </Card>
                ) : (
                  <Card className="overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left p-4">Produto</th>
                          <th className="text-center p-4">Qtd</th>
                          <th className="text-right p-4">Preço Unit.</th>
                          <th className="text-right p-4">Total</th>
                          <th className="text-center p-4">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {itensNfe.map((item, index) => (
                          <tr key={index} className="border-t">
                            <td className="p-4">
                              <p className="font-medium">{item.produto.nome}</p>
                              <p className="text-sm text-muted-foreground">{item.produto.codigo_barras}</p>
                            </td>
                            <td className="text-center p-4">{item.quantidade}</td>
                            <td className="text-right p-4">{formatCurrency(item.preco_unitario)}</td>
                            <td className="text-right p-4 font-medium">
                              {formatCurrency(item.quantidade * item.preco_unitario)}
                            </td>
                            <td className="text-center p-4">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoverProduto(index)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                        <tr className="border-t bg-muted/30">
                          <td colSpan={3} className="p-4 text-right font-semibold">
                            Total da NF-e:
                          </td>
                          <td className="p-4 text-right text-xl font-bold text-primary">
                            {formatCurrency(calcularTotal())}
                          </td>
                          <td></td>
                        </tr>
                      </tbody>
                    </table>
                  </Card>
                )}
              </div>

              <div className="flex justify-end space-x-2 mt-6">
                <Button 
                  variant="outline"
                  onClick={() => {
                    setClienteSelecionado(null);
                    setTermoBuscaCliente("");
                    setItensNfe([]);
                    setObservacoes("");
                  }}
                >
                  Limpar
                </Button>
                <Button 
                  className="bg-gradient-primary text-white"
                  onClick={handleEmitirNfe}
                  disabled={loading || itensNfe.length === 0}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Criar NF-e
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configuracoes" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="bg-gradient-card shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building className="h-5 w-5 mr-2" />
                  Dados da Empresa
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Razão Social</Label>
                  <Input placeholder="Razão Social" defaultValue="Minha Loja Ltda" />
                </div>
                <div>
                  <Label>CNPJ</Label>
                  <Input placeholder="CNPJ" defaultValue="12.345.678/0001-90" />
                </div>
                <div>
                  <Label>Inscrição Estadual</Label>
                  <Input placeholder="Inscrição Estadual" defaultValue="123456789" />
                </div>
                <div>
                  <Label>Endereço</Label>
                  <Input placeholder="Endereço" defaultValue="Rua das Flores, 123" />
                </div>
                <div>
                  <Label>Regime Tributário</Label>
                  <Input placeholder="Regime Tributário" defaultValue="Simples Nacional" />
                </div>
                <Button className="w-full">Salvar Configurações</Button>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Configurações da NF-e
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Série Padrão</Label>
                  <Input placeholder="Série Padrão" defaultValue="001" />
                </div>
                <div>
                  <Label>Ambiente</Label>
                  <Select defaultValue="homologacao">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="homologacao">Homologação</SelectItem>
                      <SelectItem value="producao">Produção</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Certificado Digital</Label>
                  <Input placeholder="Certificado Digital" defaultValue="Não configurado" disabled />
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>• Ambiente atual: Homologação (testes)</p>
                  <p>• Para emissão em produção, configure o certificado digital A1</p>
                </div>
                <Button className="w-full">Atualizar Configurações</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal de Detalhes */}
      <Dialog open={modalDetalhesAberto} onOpenChange={setModalDetalhesAberto}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da NF-e #{nfeSelecionada?.numero}</DialogTitle>
            <DialogDescription>
              Informações completas da nota fiscal eletrônica
            </DialogDescription>
          </DialogHeader>
          
          {nfeSelecionada && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Número</Label>
                  <p className="font-medium">{nfeSelecionada.numero}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Série</Label>
                  <p className="font-medium">{nfeSelecionada.serie}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge className={getStatusBadgeClass(nfeSelecionada.status)}>
                    {getStatusLabel(nfeSelecionada.status)}
                  </Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">Data de Emissão</Label>
                  <p className="font-medium">{formatDate(nfeSelecionada.data_emissao)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Cliente</Label>
                  <p className="font-medium">{nfeSelecionada.cliente_nome || "-"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">CPF/CNPJ</Label>
                  <p className="font-medium">{nfeSelecionada.cliente_cnpj_cpf || nfeSelecionada.cnpj_cpf || "-"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Ambiente</Label>
                  <p className="font-medium capitalize">{nfeSelecionada.ambiente}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Valor Total</Label>
                  <p className="font-medium text-lg text-primary">
                    {formatCurrency(nfeSelecionada.valor_total)}
                  </p>
                </div>
              </div>

              {nfeSelecionada.chave_acesso && (
                <div>
                  <Label className="text-muted-foreground">Chave de Acesso</Label>
                  <p className="font-mono text-xs bg-muted p-2 rounded break-all">
                    {nfeSelecionada.chave_acesso}
                  </p>
                </div>
              )}

              {nfeSelecionada.itens && nfeSelecionada.itens.length > 0 && (
                <div>
                  <Label className="text-muted-foreground mb-2 block">Itens</Label>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left p-2">Produto</th>
                          <th className="text-center p-2">Qtd</th>
                          <th className="text-right p-2">Preço</th>
                          <th className="text-right p-2">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {nfeSelecionada.itens.map((item, index) => (
                          <tr key={index} className="border-t">
                            <td className="p-2">{item.produto_nome}</td>
                            <td className="text-center p-2">{item.quantidade}</td>
                            <td className="text-right p-2">{formatCurrency(item.preco_unitario)}</td>
                            <td className="text-right p-2">{formatCurrency(item.preco_total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {nfeSelecionada.observacoes && (
                <div>
                  <Label className="text-muted-foreground">Observações</Label>
                  <p className="text-sm">{nfeSelecionada.observacoes}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalDetalhesAberto(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação - Transmitir */}
      <AlertDialog open={!!nfeParaTransmitir} onOpenChange={() => setNfeParaTransmitir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Transmitir NF-e</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja transmitir a NF-e #{nfeParaTransmitir?.numero} para a SEFAZ?
              Esta ação simulará a autorização da nota fiscal.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmarTransmissao}>
              Transmitir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de confirmação - Cancelar */}
      <AlertDialog open={!!nfeParaCancelar} onOpenChange={() => setNfeParaCancelar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar NF-e</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar a NF-e #{nfeParaCancelar?.numero}?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmarCancelamento}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Cancelar NF-e
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de confirmação - Deletar */}
      <AlertDialog open={!!nfeParaDeletar} onOpenChange={() => setNfeParaDeletar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir NF-e</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a NF-e #{nfeParaDeletar?.numero}?
              Esta ação não pode ser desfeita. Só é possível excluir NF-e pendentes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmarDelecao}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
