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
import { useNfe, Nfe, NfeCreate, FocusNfeConfig } from "@/hooks/useNfe";
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
    consultarNfeSefaz,
    cancelarNfe,
    reprocessarNfe,
    downloadXml,
    downloadDanfe,
    deleteNfe,
    fetchStats,
    fetchFocusNfeConfig,
    saveFocusNfeConfig,
    validarFocusNfeConfig,
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
  const [justificativaCancelamento, setJustificativaCancelamento] = useState("");
  const [nfeParaDeletar, setNfeParaDeletar] = useState<Nfe | null>(null);
  const [nfeParaReprocessar, setNfeParaReprocessar] = useState<Nfe | null>(null);
  
  // Estados de configurações Focus NFe
  const [focusNfeConfig, setFocusNfeConfig] = useState<FocusNfeConfig | null>(null);
  const [configTokenHomologacao, setConfigTokenHomologacao] = useState("");
  const [configTokenProducao, setConfigTokenProducao] = useState("");
  const [configCnpjEmitente, setConfigCnpjEmitente] = useState("");
  const [configAmbiente, setConfigAmbiente] = useState<"homologacao" | "producao">("homologacao");
  const [configSeriePadrao, setConfigSeriePadrao] = useState("001");
  const [configNaturezaOperacao, setConfigNaturezaOperacao] = useState("Venda de mercadoria");
  const [configSalvando, setConfigSalvando] = useState(false);
  const [validacaoConfig, setValidacaoConfig] = useState<{ valid: boolean; errors: string[]; warnings?: string[] } | null>(null);

  // Carregar dados iniciais
  useEffect(() => {
    fetchNfes();
    fetchStats();
    buscarClientes({ limit: 100 });
    buscarProdutos({ limit: 100, status: 'ativo' });
    carregarConfigFocusNfe();
  }, []);

  // Carregar configurações da Focus NFe
  const carregarConfigFocusNfe = async () => {
    const config = await fetchFocusNfeConfig();
    if (config) {
      setFocusNfeConfig(config);
      setConfigAmbiente(config.ambiente || "homologacao");
      setConfigSeriePadrao(config.serie_padrao || "001");
      setConfigNaturezaOperacao(config.natureza_operacao || "Venda de mercadoria");
      setConfigCnpjEmitente(config.cnpj_emitente || "");
    }
  };

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
      case "processando":
        return <Loader2 className={`h-4 w-4 ${getStatusIconClass(status)} animate-spin`} />;
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

  // Transmitir NF-e via Focus NFe
  const handleConfirmarTransmissao = async () => {
    if (!nfeParaTransmitir) return;

    try {
      const resultado = await transmitirNfe(nfeParaTransmitir.id);
      
      if (resultado.success) {
        toast({
          title: "NF-e Autorizada!",
          description: `Protocolo: ${resultado.protocolo || 'Processando...'}`
        });
      } else {
        toast({
          title: "NF-e em Processamento",
          description: resultado.mensagem || "Aguarde a confirmação da SEFAZ"
        });
      }
      fetchStats();
    } catch (err) {
      toast({
        title: "Erro ao transmitir NF-e",
        description: err instanceof Error ? err.message : "Erro ao transmitir NF-e",
        variant: "destructive"
      });
    } finally {
      setNfeParaTransmitir(null);
    }
  };

  // Cancelar NF-e via Focus NFe
  const handleConfirmarCancelamento = async () => {
    if (!nfeParaCancelar) return;

    if (justificativaCancelamento.length < 15) {
      toast({
        title: "Erro",
        description: "A justificativa deve ter no mínimo 15 caracteres",
        variant: "destructive"
      });
      return;
    }

    try {
      const resultado = await cancelarNfe(nfeParaCancelar.id, justificativaCancelamento);
      
      if (resultado.success) {
        toast({
          title: "NF-e Cancelada!",
          description: `Protocolo de cancelamento: ${resultado.protocolo || 'Processando...'}`
        });
      } else {
        toast({
          title: "Erro",
          description: resultado.mensagem || "Erro ao cancelar NF-e",
          variant: "destructive"
        });
      }
      fetchStats();
    } catch (err) {
      toast({
        title: "Erro ao cancelar NF-e",
        description: err instanceof Error ? err.message : "Erro ao cancelar NF-e",
        variant: "destructive"
      });
    } finally {
      setNfeParaCancelar(null);
      setJustificativaCancelamento("");
    }
  };

  // Consultar status da NF-e na SEFAZ
  const handleConsultarSefaz = async (nfe: Nfe) => {
    try {
      const resultado = await consultarNfeSefaz(nfe.id);
      toast({
        title: `Status: ${resultado.status}`,
        description: resultado.mensagem_sefaz || `Protocolo: ${resultado.protocolo || 'N/A'}`
      });
      fetchStats();
    } catch (err) {
      toast({
        title: "Erro ao consultar",
        description: err instanceof Error ? err.message : "Erro ao consultar NF-e",
        variant: "destructive"
      });
    }
  };

  // Reprocessar NF-e com erro
  const handleConfirmarReprocessamento = async () => {
    if (!nfeParaReprocessar) return;

    try {
      const resultado = await reprocessarNfe(nfeParaReprocessar.id);
      
      if (resultado.success) {
        toast({
          title: "NF-e Reprocessada!",
          description: `Protocolo: ${resultado.protocolo || 'Processando...'}`
        });
      } else {
        toast({
          title: "NF-e enviada para processamento",
          description: resultado.mensagem || "Aguarde a confirmação da SEFAZ"
        });
      }
      fetchStats();
    } catch (err) {
      toast({
        title: "Erro ao reprocessar NF-e",
        description: err instanceof Error ? err.message : "Erro ao reprocessar NF-e",
        variant: "destructive"
      });
    } finally {
      setNfeParaReprocessar(null);
    }
  };

  // Salvar configurações Focus NFe
  const handleSalvarConfigFocusNfe = async () => {
    try {
      setConfigSalvando(true);
      
      const configToSave: Record<string, string> = {
        ambiente: configAmbiente,
        serie_padrao: configSeriePadrao,
        natureza_operacao: configNaturezaOperacao
      };

      // Salvar os tokens se foram informados
      if (configTokenHomologacao) {
        configToSave.token_homologacao = configTokenHomologacao;
      }
      if (configTokenProducao) {
        configToSave.token_producao = configTokenProducao;
      }
      
      // Salvar CNPJ do emitente (obrigatório)
      if (configCnpjEmitente) {
        configToSave.cnpj_emitente = configCnpjEmitente.replace(/\D/g, '');
      }

      await saveFocusNfeConfig(configToSave);
      
      toast({
        title: "Configurações salvas!",
        description: "As configurações da API Focus NFe foram salvas com sucesso"
      });

      // Recarregar configurações
      await carregarConfigFocusNfe();
      // Limpar campos dos tokens
      setConfigTokenHomologacao("");
      setConfigTokenProducao("");
    } catch (err) {
      toast({
        title: "Erro ao salvar",
        description: err instanceof Error ? err.message : "Erro ao salvar configurações",
        variant: "destructive"
      });
    } finally {
      setConfigSalvando(false);
    }
  };

  // Validar configurações
  const handleValidarConfig = async () => {
    const resultado = await validarFocusNfeConfig();
    setValidacaoConfig(resultado);
    
    if (resultado?.valid) {
      toast({
        title: "Configurações válidas!",
        description: "Todas as configurações estão corretas para emissão de NF-e"
      });
    } else {
      toast({
        title: "Problemas encontrados",
        description: `${resultado?.errors.length} problema(s) encontrado(s)`,
        variant: "destructive"
      });
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

                        <div className="flex items-center space-x-2 flex-wrap gap-1">
                          {nfe.status === "autorizada" && (
                            <>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                title="Download DANFE (PDF)"
                                onClick={() => downloadDanfe(nfe.id)}
                              >
                                <Download className="h-4 w-4 mr-1" />
                                PDF
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                title="Download XML"
                                onClick={() => downloadXml(nfe.id, nfe.numero)}
                              >
                                <Download className="h-4 w-4 mr-1" />
                                XML
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                title="Consultar na SEFAZ"
                                onClick={() => handleConsultarSefaz(nfe)}
                              >
                                <RefreshCw className="h-4 w-4" />
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
                                className="bg-primary/10 hover:bg-primary/20"
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

                          {nfe.status === "processando" && (
                            <>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleConsultarSefaz(nfe)}
                                title="Consultar status na SEFAZ"
                              >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Verificar
                              </Button>
                            </>
                          )}

                          {nfe.status === "erro" && (
                            <>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setNfeParaReprocessar(nfe)}
                                className="bg-warning/10 hover:bg-warning/20"
                                title="Tentar emitir novamente"
                              >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Reprocessar
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
                            <Eye className="h-4 w-4 mr-1" />
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
          {/* Alerta de validação - Erros */}
          {validacaoConfig && !validacaoConfig.valid && (
            <Card className="border-destructive bg-destructive/10">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-destructive">Problemas nas configurações:</h4>
                    <ul className="text-sm text-destructive/80 mt-1 space-y-1">
                      {validacaoConfig.errors.map((error: string, i: number) => (
                        <li key={i}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sucesso na validação */}
          {validacaoConfig && validacaoConfig.valid && (
            <Card className="border-success bg-success/10">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <p className="font-medium text-success">Configurações válidas! Pronto para emitir NF-e.</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Avisos (warnings) */}
          {validacaoConfig && (validacaoConfig as { warnings?: string[] }).warnings && (validacaoConfig as { warnings?: string[] }).warnings!.length > 0 && (
            <Card className="border-warning bg-warning/10">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <Clock className="h-5 w-5 text-warning mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-warning">Avisos (opcional):</h4>
                    <ul className="text-sm text-warning/80 mt-1 space-y-1">
                      {(validacaoConfig as { warnings?: string[] }).warnings!.map((warning: string, i: number) => (
                        <li key={i}>• {warning}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Status do Token Principal (Fixo no Sistema) */}
          <Card className={`shadow-card ${focusNfeConfig?.token_principal_configurado ? 'bg-success/10 border-success' : 'bg-destructive/10 border-destructive'}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${focusNfeConfig?.token_principal_configurado ? 'bg-success/20' : 'bg-destructive/20'}`}>
                    {focusNfeConfig?.token_principal_configurado ? (
                      <CheckCircle className="h-5 w-5 text-success" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold">🔑 Token Principal (Master)</p>
                    <p className="text-xs text-muted-foreground">
                      {focusNfeConfig?.token_principal_configurado 
                        ? "Configurado no servidor - usado para gerenciar empresas via API"
                        : "Não configurado - configure a variável FOCUS_NFE_TOKEN_PRINCIPAL no arquivo .env do backend"
                      }
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className={focusNfeConfig?.token_principal_configurado ? 'bg-success/20 text-success border-success' : 'bg-destructive/20 text-destructive border-destructive'}>
                  {focusNfeConfig?.token_principal_configurado ? '✓ Configurado' : '✗ Não configurado'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Tokens da API Focus NFe (Por Tenant) */}
          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Dados da Empresa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Configure os dados e tokens da sua empresa para emitir notas fiscais.
              </p>
              
              {/* CNPJ do Emitente */}
              <div className="p-4 rounded-lg border-2 border-primary/30 bg-primary/5">
                <div className="flex items-center justify-between mb-2">
                  <Label className="flex items-center gap-2">
                    🏢 CNPJ do Emitente
                    <Badge variant="outline" className="text-xs bg-destructive/20 text-destructive border-destructive">
                      Obrigatório
                    </Badge>
                  </Label>
                  {configCnpjEmitente && (
                    <Badge variant="outline" className="text-xs bg-success/20 text-success border-success">
                      ✓ Configurado
                    </Badge>
                  )}
                </div>
                <Input 
                  type="text"
                  placeholder="00.000.000/0000-00"
                  value={configCnpjEmitente}
                  onChange={(e) => {
                    // Formatar CNPJ
                    let value = e.target.value.replace(/\D/g, '');
                    if (value.length <= 14) {
                      value = value.replace(/^(\d{2})(\d)/, '$1.$2');
                      value = value.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
                      value = value.replace(/\.(\d{3})(\d)/, '.$1/$2');
                      value = value.replace(/(\d{4})(\d)/, '$1-$2');
                    }
                    setConfigCnpjEmitente(value);
                  }}
                  maxLength={18}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  ⚠️ O CNPJ deve ser o mesmo cadastrado na empresa da Focus NFe
                </p>
              </div>
              
              {/* Token de Homologação */}
              <div className={`p-4 rounded-lg border-2 ${configAmbiente === 'homologacao' ? 'border-warning bg-warning/5' : 'border-muted'}`}>
                <div className="flex items-center justify-between mb-2">
                  <Label className="flex items-center gap-2">
                    🧪 Token de Homologação
                    {configAmbiente === 'homologacao' && (
                      <Badge variant="outline" className="text-xs bg-warning/20 text-warning border-warning">
                        Ambiente Atual
                      </Badge>
                    )}
                  </Label>
                  {focusNfeConfig?.token_homologacao_configurado && (
                    <Badge variant="outline" className="text-xs bg-success/20 text-success border-success">
                      ✓ Configurado
                    </Badge>
                  )}
                </div>
                <Input 
                  type="password"
                  placeholder={focusNfeConfig?.token_homologacao_configurado ? "Token já configurado (deixe vazio para manter)" : "Cole o token de homologação aqui"}
                  value={configTokenHomologacao}
                  onChange={(e) => setConfigTokenHomologacao(e.target.value)}
                />
                {focusNfeConfig?.token_homologacao_configurado && focusNfeConfig.token_homologacao_masked && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Token atual: {focusNfeConfig.token_homologacao_masked}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  ⚠️ Notas emitidas em homologação não têm validade fiscal (para testes)
                </p>
              </div>

              {/* Token de Produção */}
              <div className={`p-4 rounded-lg border-2 ${configAmbiente === 'producao' ? 'border-success bg-success/5' : 'border-muted'}`}>
                <div className="flex items-center justify-between mb-2">
                  <Label className="flex items-center gap-2">
                    🚀 Token de Produção
                    {configAmbiente === 'producao' && (
                      <Badge variant="outline" className="text-xs bg-success/20 text-success border-success">
                        Ambiente Atual
                      </Badge>
                    )}
                  </Label>
                  {focusNfeConfig?.token_producao_configurado && (
                    <Badge variant="outline" className="text-xs bg-success/20 text-success border-success">
                      ✓ Configurado
                    </Badge>
                  )}
                </div>
                <Input 
                  type="password"
                  placeholder={focusNfeConfig?.token_producao_configurado ? "Token já configurado (deixe vazio para manter)" : "Cole o token de produção aqui"}
                  value={configTokenProducao}
                  onChange={(e) => setConfigTokenProducao(e.target.value)}
                />
                {focusNfeConfig?.token_producao_configurado && focusNfeConfig.token_producao_masked && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Token atual: {focusNfeConfig.token_producao_masked}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  ✅ Notas emitidas em produção têm validade fiscal (para uso real)
                </p>
              </div>

              <p className="text-xs text-muted-foreground">
                Obtenha seus tokens em <a href="https://focusnfe.com.br" target="_blank" rel="noopener noreferrer" className="text-primary underline">focusnfe.com.br</a>
              </p>
            </CardContent>
          </Card>

          {/* Configurações Gerais */}
          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Configurações de Emissão
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label>Ambiente Ativo</Label>
                  <Select value={configAmbiente} onValueChange={(v: "homologacao" | "producao") => setConfigAmbiente(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="homologacao">🧪 Homologação (Testes)</SelectItem>
                      <SelectItem value="producao">🚀 Produção (Real)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {configAmbiente === "homologacao" 
                      ? "⚠️ Notas sem validade fiscal"
                      : "✅ Notas com validade fiscal"
                    }
                  </p>
                </div>
                <div>
                  <Label>Série Padrão</Label>
                  <Input 
                    placeholder="001"
                    value={configSeriePadrao}
                    onChange={(e) => setConfigSeriePadrao(e.target.value)}
                    maxLength={3}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Série da NF-e (geralmente 001)
                  </p>
                </div>
                <div>
                  <Label>Natureza da Operação</Label>
                  <Input 
                    placeholder="Venda de mercadoria"
                    value={configNaturezaOperacao}
                    onChange={(e) => setConfigNaturezaOperacao(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Descrição da operação fiscal
                  </p>
                </div>
              </div>
              
              <div className="pt-4 flex flex-col sm:flex-row gap-2">
                <Button 
                  className="flex-1 bg-gradient-primary text-white"
                  onClick={handleSalvarConfigFocusNfe}
                  disabled={configSalvando}
                >
                  {configSalvando ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Settings className="h-4 w-4 mr-2" />
                  )}
                  Salvar Configurações
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={handleValidarConfig}
                  disabled={loading}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Validar Configurações
                </Button>
              </div>

              {/* Nota sobre cadastro da empresa */}
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-sm text-blue-600 dark:text-blue-400 flex items-start gap-2">
                  <Building className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Dados da empresa:</strong> O cadastro completo da empresa (CNPJ, endereço, IE, regime tributário) 
                    é feito diretamente no <a href="https://app.focusnfe.com.br" target="_blank" rel="noopener noreferrer" className="underline">painel Focus NFe</a>. 
                    Os tokens acima já estão vinculados aos dados da sua empresa.
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Informações sobre a Focus NFe */}
          <Card className="bg-muted/30">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-3 flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Sobre a Integração Focus NFe
              </h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                <div className="space-y-2">
                  <p>• <strong>Emissão de NF-e:</strong> Emita notas fiscais diretamente para a SEFAZ</p>
                  <p>• <strong>Consulta:</strong> Consulte o status das notas na SEFAZ</p>
                  <p>• <strong>Cancelamento:</strong> Cancele notas autorizadas (até 24h)</p>
                </div>
                <div className="space-y-2">
                  <p>• <strong>Download XML:</strong> Baixe o XML oficial da nota</p>
                  <p>• <strong>DANFE:</strong> Acesse o PDF do DANFE para impressão</p>
                  <p>• <strong>Documentação:</strong> <a href="https://doc.focusnfe.com.br" target="_blank" rel="noopener noreferrer" className="text-primary underline">doc.focusnfe.com.br</a></p>
                </div>
              </div>
            </CardContent>
          </Card>
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

              {/* Protocolo e Chave de Acesso */}
              {nfeSelecionada.protocolo && (
                <div className="p-3 bg-success/10 border border-success/20 rounded-lg">
                  <Label className="text-muted-foreground text-xs">Protocolo de Autorização</Label>
                  <p className="font-mono text-sm">{nfeSelecionada.protocolo}</p>
                  {nfeSelecionada.data_autorizacao && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Autorizada em: {formatDate(nfeSelecionada.data_autorizacao)}
                    </p>
                  )}
                </div>
              )}

              {nfeSelecionada.chave_acesso && (
                <div>
                  <Label className="text-muted-foreground">Chave de Acesso</Label>
                  <p className="font-mono text-xs bg-muted p-2 rounded break-all">
                    {nfeSelecionada.chave_acesso}
                  </p>
                </div>
              )}

              {/* Mensagem de erro ou status */}
              {nfeSelecionada.motivo_status && nfeSelecionada.status === 'erro' && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <Label className="text-destructive text-xs">Motivo do Erro</Label>
                  <p className="text-sm text-destructive">{nfeSelecionada.motivo_status}</p>
                </div>
              )}

              {/* Cancelamento */}
              {nfeSelecionada.status === 'cancelada' && (
                <div className="p-3 bg-muted border rounded-lg">
                  <Label className="text-muted-foreground text-xs">Cancelamento</Label>
                  {nfeSelecionada.protocolo_cancelamento && (
                    <p className="text-sm">Protocolo: {nfeSelecionada.protocolo_cancelamento}</p>
                  )}
                  {nfeSelecionada.data_cancelamento && (
                    <p className="text-xs text-muted-foreground">
                      Cancelada em: {formatDate(nfeSelecionada.data_cancelamento)}
                    </p>
                  )}
                  {nfeSelecionada.motivo_status && (
                    <p className="text-sm mt-1">Motivo: {nfeSelecionada.motivo_status}</p>
                  )}
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
      <Dialog open={!!nfeParaCancelar} onOpenChange={() => {
        setNfeParaCancelar(null);
        setJustificativaCancelamento("");
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar NF-e #{nfeParaCancelar?.numero}</DialogTitle>
            <DialogDescription>
              Informe a justificativa para o cancelamento da nota fiscal.
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Justificativa (mínimo 15 caracteres) *</Label>
              <Textarea
                placeholder="Informe o motivo do cancelamento..."
                value={justificativaCancelamento}
                onChange={(e) => setJustificativaCancelamento(e.target.value)}
                rows={3}
              />
              <p className={`text-xs mt-1 ${justificativaCancelamento.length < 15 ? 'text-destructive' : 'text-muted-foreground'}`}>
                {justificativaCancelamento.length}/15 caracteres mínimos
              </p>
            </div>

            {nfeParaCancelar?.chave_acesso && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">Chave de acesso:</p>
                <p className="text-xs font-mono">{nfeParaCancelar.chave_acesso}</p>
              </div>
            )}

            <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
              <p className="text-sm text-warning flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2" />
                O cancelamento deve ser feito em até 24 horas após a autorização
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setNfeParaCancelar(null);
              setJustificativaCancelamento("");
            }}>
              Voltar
            </Button>
            <Button 
              onClick={handleConfirmarCancelamento}
              variant="destructive"
              disabled={justificativaCancelamento.length < 15 || loading}
            >
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <XCircle className="h-4 w-4 mr-2" />}
              Cancelar NF-e
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação - Deletar */}
      <AlertDialog open={!!nfeParaDeletar} onOpenChange={() => setNfeParaDeletar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir NF-e</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a NF-e #{nfeParaDeletar?.numero}?
              Esta ação não pode ser desfeita. Só é possível excluir NF-e pendentes ou com erro.
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

      {/* Dialog de confirmação - Reprocessar */}
      <AlertDialog open={!!nfeParaReprocessar} onOpenChange={() => setNfeParaReprocessar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reprocessar NF-e</AlertDialogTitle>
            <AlertDialogDescription>
              A NF-e #{nfeParaReprocessar?.numero} teve um erro na emissão.
              Deseja tentar emitir novamente?
            </AlertDialogDescription>
          </AlertDialogHeader>
          {nfeParaReprocessar?.motivo_status && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">
                <strong>Erro anterior:</strong> {nfeParaReprocessar.motivo_status}
              </p>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmarReprocessamento}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Reprocessar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
