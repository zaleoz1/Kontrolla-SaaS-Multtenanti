import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
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
  Loader2,
  Pencil,
  X,
  EyeOff,
  FlaskConical,
  Rocket
} from "lucide-react";
import { useNfe, Nfe, NfeCreate, FocusNfeConfig } from "@/hooks/useNfe";
import { useClientes, Cliente } from "@/hooks/useClientes";
import { useProdutos, Produto } from "@/hooks/useProdutos";
import { useTenant } from "@/hooks/useTenant";
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
    marcarNfeComoAutorizada,
    downloadXml,
    downloadDanfe,
    updateNfeStatus,
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
  const { tenant } = useTenant();

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
  const [nfeParaMarcarAutorizada, setNfeParaMarcarAutorizada] = useState<Nfe | null>(null);
  const [chaveMarcarAutorizada, setChaveMarcarAutorizada] = useState("");
  
  // Erro de duplicidade na SEFAZ = nota pode já estar autorizada; reprocessar não é permitido
  const isErroDuplicidadeNfe = (motivo: string | null | undefined) =>
    !!motivo && /duplicidade de nf-?e/i.test(motivo);
  // Extrair chave de acesso da mensagem de rejeição (ex.: [chNFe: 21240752390958000130550010000000091199820007])
  const extrairChaveDoMotivo = (motivo: string | null | undefined) => {
    if (!motivo) return "";
    const m = motivo.match(/\[chNFe:\s*(\d+)\]/i);
    return m ? m[1] : "";
  };
  
  // Estados de configurações Focus NFe
  const [focusNfeConfig, setFocusNfeConfig] = useState<FocusNfeConfig | null>(null);
  const [configTokenHomologacao, setConfigTokenHomologacao] = useState("");
  const [configTokenProducao, setConfigTokenProducao] = useState("");
  const [configCnpjEmitente, setConfigCnpjEmitente] = useState("");
  const [configAmbiente, setConfigAmbiente] = useState<"homologacao" | "producao">("homologacao");
  const [configSeriePadrao, setConfigSeriePadrao] = useState("001");
  const [configNaturezaOperacao, setConfigNaturezaOperacao] = useState("Venda de mercadoria");
  const [configProximoNumero, setConfigProximoNumero] = useState("");
  const [configSalvando, setConfigSalvando] = useState(false);
  const [validacaoConfig, setValidacaoConfig] = useState<{ valid: boolean; errors: string[]; warnings?: string[] } | null>(null);
  const [editandoCnpj, setEditandoCnpj] = useState(false);
  const [cnpjOriginal, setCnpjOriginal] = useState("");
  const [editandoTokenHomologacao, setEditandoTokenHomologacao] = useState(false);
  const [tokenHomologacaoOriginal, setTokenHomologacaoOriginal] = useState("");
  const [editandoTokenProducao, setEditandoTokenProducao] = useState(false);
  const [tokenProducaoOriginal, setTokenProducaoOriginal] = useState("");
  const [mostrarTokenHomologacao, setMostrarTokenHomologacao] = useState(false);
  const [mostrarTokenProducao, setMostrarTokenProducao] = useState(false);

  // Carregar dados iniciais
  useEffect(() => {
    fetchNfes();
    fetchStats();
    buscarClientes({ limit: 100 });
    buscarProdutos({ limit: 100, status: 'ativo' });
    carregarConfigFocusNfe();
  }, []);

  // Função para formatar CNPJ
  const formatarCNPJ = (cnpj: string): string => {
    if (!cnpj) return "";
    // Remove tudo que não é dígito
    const apenasNumeros = cnpj.replace(/\D/g, '');
    // Aplica a máscara
    if (apenasNumeros.length <= 14) {
      return apenasNumeros
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    }
    return apenasNumeros;
  };

  // Carregar configurações da Focus NFe
  const carregarConfigFocusNfe = async () => {
    const config = await fetchFocusNfeConfig();
    if (config) {
      setFocusNfeConfig(config);
      setConfigAmbiente(config.ambiente || "homologacao");
      setConfigSeriePadrao(config.serie_padrao || "001");
      setConfigNaturezaOperacao(config.natureza_operacao || "Venda de mercadoria");
      setConfigProximoNumero(config.proximo_numero ?? "");
      // Aplicar máscara ao CNPJ ao carregar do banco
      setConfigCnpjEmitente(config.cnpj_emitente ? formatarCNPJ(config.cnpj_emitente) : "");
      // Preencher tokens completos quando configurados (não mascarados)
      if (config.token_homologacao_configurado && config.token_homologacao) {
        setConfigTokenHomologacao(config.token_homologacao);
      }
      if (config.token_producao_configurado && config.token_producao) {
        setConfigTokenProducao(config.token_producao);
      }
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
      const msgSefaz = String(resultado.mensagem_sefaz || '');
      const isDuplicidade = /duplicidade\s+de\s+nf-?e/i.test(msgSefaz);
      const isJaCancelada = resultado.status_sefaz === '218' || /já está cancelada|já cancelada na base/i.test(msgSefaz);
      if (resultado.status === "autorizado") {
        toast({ title: "NF-e autorizada!", description: resultado.mensagem_sefaz || `Protocolo: ${resultado.protocolo || "N/A"}` });
      } else if (resultado.status === "erro_autorizacao" && isDuplicidade) {
        toast({
          title: "Duplicidade na SEFAZ (539)",
          description: "A nota pode já estar autorizada. O status foi atualizado. Use \"Marcar como autorizada\" — a chave será preenchida automaticamente se estiver na mensagem.",
          variant: "default"
        });
      } else if (resultado.status === "erro_autorizacao" && isJaCancelada) {
        toast({
          title: "NF-e já cancelada na SEFAZ (218)",
          description: "Esta NF-e consta como cancelada na SEFAZ. A sequência foi ajustada; a próxima emissão usará o número seguinte.",
          variant: "default"
        });
      } else {
        toast({
          title: `Status: ${resultado.status}`,
          description: resultado.mensagem_sefaz || `Protocolo: ${resultado.protocolo || "N/A"}`
        });
      }
      fetchStats();
      // Atualizar detalhes se o painel estiver aberto para esta NF-e
      if (nfeSelecionada?.id === nfe.id) {
        const atualizada = await fetchNfe(nfe.id);
        if (atualizada) setNfeSelecionada(atualizada);
      }
    } catch (err) {
      toast({
        title: "Erro ao consultar",
        description: err instanceof Error ? err.message : "Erro ao consultar NF-e. Verifique se a nota foi enviada à Focus NFe.",
        variant: "destructive"
      });
    }
  };

  // Marcar NF-e como autorizada (para notas com erro de duplicidade que já estão autorizadas na SEFAZ)
  const handleConfirmarMarcarAutorizada = async () => {
    if (!nfeParaMarcarAutorizada) return;
    try {
      await marcarNfeComoAutorizada(
        nfeParaMarcarAutorizada.id,
        chaveMarcarAutorizada.trim() || undefined
      );
      toast({
        title: "NF-e marcada como autorizada",
        description: `A NF-e #${nfeParaMarcarAutorizada.numero} foi atualizada. Você pode imprimir o DANFE se tiver a chave.`
      });
      setNfeParaMarcarAutorizada(null);
      setChaveMarcarAutorizada("");
      if (nfeSelecionada?.id === nfeParaMarcarAutorizada.id) {
        const atualizada = await fetchNfe(nfeParaMarcarAutorizada.id);
        if (atualizada) setNfeSelecionada(atualizada);
      }
    } catch (err) {
      toast({
        title: "Erro",
        description: err instanceof Error ? err.message : "Não foi possível atualizar o status.",
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
        natureza_operacao: configNaturezaOperacao,
        proximo_numero: configProximoNumero.trim()
      };

      // Salvar os tokens apenas se foram informados novos valores
      // Se estava editando e tem valor, salvar (se vazio, mantém o token atual)
      if (editandoTokenHomologacao && configTokenHomologacao) {
        configToSave.token_homologacao = configTokenHomologacao;
      } else if (!focusNfeConfig?.token_homologacao_configurado && configTokenHomologacao) {
        // Se não estava configurado e agora tem valor, salvar
        configToSave.token_homologacao = configTokenHomologacao;
      }
      
      if (editandoTokenProducao && configTokenProducao) {
        configToSave.token_producao = configTokenProducao;
      } else if (!focusNfeConfig?.token_producao_configurado && configTokenProducao) {
        // Se não estava configurado e agora tem valor, salvar
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
      // Limpar estados de edição
      setEditandoCnpj(false);
      setEditandoTokenHomologacao(false);
      setEditandoTokenProducao(false);
      // Limpar campos dos tokens apenas se não estiverem configurados
      if (!focusNfeConfig?.token_homologacao_configurado) {
      setConfigTokenHomologacao("");
      }
      if (!focusNfeConfig?.token_producao_configurado) {
      setConfigTokenProducao("");
      }
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
                                onClick={async () => {
                                  try {
                                    await downloadXml(nfe.id, nfe.numero, nfe.chave_acesso);
                                    toast({
                                      title: "XML baixado com sucesso!",
                                      description: `O arquivo XML da NF-e #${nfe.numero} foi baixado.`,
                                    });
                                  } catch (error) {
                                    toast({
                                      title: "Erro ao baixar XML",
                                      description: error instanceof Error ? error.message : "Não foi possível baixar o XML da NF-e.",
                                      variant: "destructive",
                                    });
                                  }
                                }}
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
                                onClick={() => handleConsultarSefaz(nfe)}
                                title="Consultar status na SEFAZ"
                              >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Verificar
                              </Button>
                              {isErroDuplicidadeNfe(nfe.motivo_status) && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="bg-success/10 hover:bg-success/20"
                                  onClick={() => {
                                    setNfeParaMarcarAutorizada(nfe);
                                    setChaveMarcarAutorizada(extrairChaveDoMotivo(nfe.motivo_status));
                                  }}
                                  title="A nota pode já estar autorizada na SEFAZ. Marque como autorizada para corrigir o status."
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Marcar como autorizada
                                </Button>
                              )}
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => !isErroDuplicidadeNfe(nfe.motivo_status) && setNfeParaReprocessar(nfe)}
                                className="bg-warning/10 hover:bg-warning/20"
                                title={isErroDuplicidadeNfe(nfe.motivo_status) 
                                  ? "Não é possível reprocessar: a SEFAZ indicou duplicidade (a nota pode já estar autorizada). Use Verificar para consultar o status." 
                                  : "Tentar emitir novamente"}
                                disabled={isErroDuplicidadeNfe(nfe.motivo_status)}
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
                      <Input value={configSeriePadrao || "001"} disabled />
                      <p className="text-xs text-muted-foreground mt-1">
                        Série padrão configurada
                      </p>
                    </div>
                    <div>
                      <Label>Ambiente</Label>
                      <div className="flex items-center gap-2">
                        <Input 
                          value={configAmbiente === "homologacao" ? "Homologação (Testes)" : "Produção (Real)"} 
                          disabled 
                        />
                        {configAmbiente === "homologacao" ? (
                          <FlaskConical className="h-4 w-4 text-orange-500" />
                        ) : (
                          <Rocket className="h-4 w-4 text-success" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        {configAmbiente === "homologacao" ? (
                          <>
                            <AlertTriangle className="h-3 w-3 text-orange-500" />
                            Notas sem validade fiscal
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-3 w-3 text-success" />
                            Notas com validade fiscal
                          </>
                        )}
                      </p>
                    </div>
                    <div>
                      <Label>Natureza da Operação</Label>
                      <Input value={configNaturezaOperacao || "Venda de mercadoria"} disabled />
                      <p className="text-xs text-muted-foreground mt-1">
                        Natureza da operação configurada
                      </p>
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

          {/* Tokens da API Focus NFe (Por Tenant) */}
          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Dados da Empresa
              </CardTitle>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button 
                    className="bg-gradient-primary text-white"
                    onClick={handleSalvarConfigFocusNfe}
                    disabled={configSalvando}
                    size="sm"
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
                    onClick={handleValidarConfig}
                    disabled={loading}
                    size="sm"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Validar Configurações
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Configure os dados e tokens da sua empresa para emitir notas fiscais.
              </p>
              
              {/* CNPJ do Emitente */}
              <div>
                <div className="mb-2">
                  <Label className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    CNPJ do Emitente
                  </Label>
                </div>
                <div className="flex items-center gap-1 mb-2">
                  {configCnpjEmitente && (
                    <Badge variant="outline" className="text-xs bg-success/20 text-success border-success">
                      ✓ Configurado
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 max-w-xs">
                <Input 
                  type="text"
                  placeholder="00.000.000/0000-00"
                  value={configCnpjEmitente}
                  onChange={(e) => {
                      // Aplicar máscara ao CNPJ
                      const valorFormatado = formatarCNPJ(e.target.value);
                      setConfigCnpjEmitente(valorFormatado);
                  }}
                  maxLength={18}
                    readOnly={!editandoCnpj}
                    className={!editandoCnpj ? "bg-muted/50" : ""}
                  />
                  {!editandoCnpj ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        setCnpjOriginal(configCnpjEmitente);
                        setEditandoCnpj(true);
                      }}
                      className="h-10 w-10 flex-shrink-0"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  ) : (
                    <div className="flex gap-1 flex-shrink-0">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setConfigCnpjEmitente(cnpjOriginal);
                          setEditandoCnpj(false);
                        }}
                        className="h-10 w-10"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setEditandoCnpj(false);
                        }}
                        className="h-10 w-10 bg-success/10 hover:bg-success/20 border-success/30"
                      >
                        <CheckCircle className="h-4 w-4 text-success" />
                      </Button>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3 text-orange-500" />
                  O CNPJ deve ser o mesmo cadastrado na empresa da Focus NFe
                </p>
              </div>
              
              {/* Tokens */}
              <div className="grid gap-4 md:grid-cols-2">
              {/* Token de Homologação */}
                <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="flex items-center gap-2">
                      <FlaskConical className="h-4 w-4" />
                      Token de Homologação
                    </Label>
                    <div className="flex items-center gap-1">
                    {configAmbiente === 'homologacao' && (
                      <Badge variant="outline" className="text-xs bg-warning/20 text-warning border-warning">
                        Ambiente Atual
                      </Badge>
                    )}
                  {focusNfeConfig?.token_homologacao_configurado && (
                    <Badge variant="outline" className="text-xs bg-success/20 text-success border-success">
                      ✓ Configurado
                    </Badge>
                  )}
                </div>
                  </div>
                  <div className="flex items-center gap-2">
                <Input 
                      type={mostrarTokenHomologacao ? "text" : "password"}
                      placeholder="Cole o token de homologação aqui"
                  value={configTokenHomologacao}
                  onChange={(e) => setConfigTokenHomologacao(e.target.value)}
                      readOnly={!editandoTokenHomologacao && focusNfeConfig?.token_homologacao_configurado}
                      className={!editandoTokenHomologacao && focusNfeConfig?.token_homologacao_configurado ? "bg-muted/50" : ""}
                    />
                    {!editandoTokenHomologacao && focusNfeConfig?.token_homologacao_configurado && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setMostrarTokenHomologacao(!mostrarTokenHomologacao)}
                        className="h-10 w-10 flex-shrink-0"
                      >
                        {mostrarTokenHomologacao ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                    {!editandoTokenHomologacao && focusNfeConfig?.token_homologacao_configurado ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setTokenHomologacaoOriginal(configTokenHomologacao);
                          setConfigTokenHomologacao(""); // Limpar campo para permitir digitar novo token
                          setEditandoTokenHomologacao(true);
                          setMostrarTokenHomologacao(false);
                        }}
                        className="h-10 w-10 flex-shrink-0"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    ) : (
                      <div className="flex gap-1 flex-shrink-0">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            if (focusNfeConfig?.token_homologacao_configurado) {
                              setConfigTokenHomologacao(tokenHomologacaoOriginal);
                            } else {
                              setConfigTokenHomologacao("");
                            }
                            setEditandoTokenHomologacao(false);
                            setMostrarTokenHomologacao(false);
                          }}
                          className="h-10 w-10"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            setEditandoTokenHomologacao(false);
                            setMostrarTokenHomologacao(false);
                          }}
                          className="h-10 w-10 bg-success/10 hover:bg-success/20 border-success/30"
                        >
                          <CheckCircle className="h-4 w-4 text-success" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 text-orange-500" />
                    Notas emitidas em homologação não têm validade fiscal (para testes)
                </p>
              </div>

              {/* Token de Produção */}
                <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="flex items-center gap-2">
                      <Rocket className="h-4 w-4" />
                      Token de Produção
                    </Label>
                    <div className="flex items-center gap-1">
                    {configAmbiente === 'producao' && (
                      <Badge variant="outline" className="text-xs bg-success/20 text-success border-success">
                        Ambiente Atual
                      </Badge>
                    )}
                  {focusNfeConfig?.token_producao_configurado && (
                    <Badge variant="outline" className="text-xs bg-success/20 text-success border-success">
                      ✓ Configurado
                    </Badge>
                  )}
                </div>
                  </div>
                  <div className="flex items-center gap-2">
                <Input 
                      type={mostrarTokenProducao ? "text" : "password"}
                      placeholder="Cole o token de produção aqui"
                  value={configTokenProducao}
                  onChange={(e) => setConfigTokenProducao(e.target.value)}
                      readOnly={!editandoTokenProducao && focusNfeConfig?.token_producao_configurado}
                      className={!editandoTokenProducao && focusNfeConfig?.token_producao_configurado ? "bg-muted/50" : ""}
                    />
                    {!editandoTokenProducao && focusNfeConfig?.token_producao_configurado && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setMostrarTokenProducao(!mostrarTokenProducao)}
                        className="h-10 w-10 flex-shrink-0"
                      >
                        {mostrarTokenProducao ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                    {!editandoTokenProducao && focusNfeConfig?.token_producao_configurado ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setTokenProducaoOriginal(configTokenProducao);
                          setConfigTokenProducao(""); // Limpar campo para permitir digitar novo token
                          setEditandoTokenProducao(true);
                          setMostrarTokenProducao(false);
                        }}
                        className="h-10 w-10 flex-shrink-0"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    ) : (
                      <div className="flex gap-1 flex-shrink-0">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            if (focusNfeConfig?.token_producao_configurado) {
                              setConfigTokenProducao(tokenProducaoOriginal);
                            } else {
                              setConfigTokenProducao("");
                            }
                            setEditandoTokenProducao(false);
                            setMostrarTokenProducao(false);
                          }}
                          className="h-10 w-10"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            setEditandoTokenProducao(false);
                            setMostrarTokenProducao(false);
                          }}
                          className="h-10 w-10 bg-success/10 hover:bg-success/20 border-success/30"
                        >
                          <CheckCircle className="h-4 w-4 text-success" />
                        </Button>
              </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 text-success" />
                    Notas emitidas em produção têm validade fiscal (para uso real)
                  </p>
                </div>
              </div>
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
                      <SelectItem value="homologacao">
                        <span className="flex items-center gap-2">
                          <FlaskConical className="h-4 w-4" />
                          Homologação (Testes)
                        </span>
                      </SelectItem>
                      <SelectItem value="producao">
                        <span className="flex items-center gap-2">
                          <Rocket className="h-4 w-4" />
                          Produção (Real)
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    {configAmbiente === "homologacao" ? (
                      <>
                        <AlertTriangle className="h-3 w-3 text-orange-500" />
                        Notas sem validade fiscal
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-3 w-3 text-success" />
                        Notas com validade fiscal
                      </>
                    )}
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
                <div>
                  <Label>Próximo número da NF-e (opcional)</Label>
                  <Input 
                    type="number"
                    min={1}
                    placeholder="Deixe vazio para automático"
                    value={configProximoNumero}
                    onChange={(e) => setConfigProximoNumero(e.target.value.replace(/\D/g, ''))}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Para evitar duplicidade: informe o próximo número que a SEFAZ deve usar para o ambiente atual (ex.: se a última nota em Produção é 20, coloque 21). O valor é salvo por ambiente. Deixe vazio para o sistema definir automaticamente.
                  </p>
                </div>
              </div>
              
              {/* Dados da Empresa */}
              <div className="pt-4 border-t border-border/60">
                <div className="flex items-center gap-2 mb-4">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-base font-semibold">Dados da Empresa</Label>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Nome / Razão Social</Label>
                    <p className="text-sm font-medium mt-1">
                      {tenant?.razao_social || tenant?.nome || "Não informado"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Nome Fantasia</Label>
                    <p className="text-sm font-medium mt-1">
                      {tenant?.nome_fantasia || tenant?.nome || "Não informado"}
                    </p>
              </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">CNPJ/CPF</Label>
                    <p className="text-sm font-medium mt-1">
                      {tenant?.cnpj || tenant?.cpf || "Não informado"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Inscrição Estadual</Label>
                    <p className="text-sm font-medium mt-1">
                      {tenant?.inscricao_estadual || "Não informado"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Inscrição Municipal</Label>
                    <p className="text-sm font-medium mt-1">
                      {tenant?.inscricao_municipal || "Não informado"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Email</Label>
                    <p className="text-sm font-medium mt-1">
                      {tenant?.email || "Não informado"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Telefone</Label>
                    <p className="text-sm font-medium mt-1">
                      {tenant?.telefone || "Não informado"}
                    </p>
                  </div>
                  <div className="md:col-span-2 lg:col-span-1">
                    <Label className="text-xs text-muted-foreground">Endereço</Label>
                    <p className="text-sm font-medium mt-1">
                      {tenant?.endereco ? (
                        <>
                          {tenant.endereco}
                          {tenant.cidade && `, ${tenant.cidade}`}
                          {tenant.estado && ` - ${tenant.estado}`}
                          {tenant.cep && ` (CEP: ${tenant.cep})`}
                        </>
                      ) : (
                        "Não informado"
                      )}
                    </p>
                  </div>
                </div>
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
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-xs text-blue-600 dark:text-blue-400 flex items-start gap-2">
                  <Building className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Importante:</strong> Para emissão de NF-e, certifique-se de que os dados da empresa estão completos e corretos. 
                    Você pode atualizar essas informações na página de <Link to="/dashboard/configuracoes" className="underline">Configurações</Link>.
                    O cadastro completo da empresa (CNPJ, endereço, IE, regime tributário) também deve estar configurado no <a href="https://app.focusnfe.com.br" target="_blank" rel="noopener noreferrer" className="underline">painel Focus NFe</a>.
                  </span>
                </p>
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
                  {isErroDuplicidadeNfe(nfeSelecionada.motivo_status) && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Esta nota pode já estar autorizada na SEFAZ. Use o botão abaixo para consultar o status.
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        if (!nfeSelecionada) return;
                        try {
                          const resultado = await consultarNfeSefaz(nfeSelecionada.id);
                          const msgSefaz = String(resultado.mensagem_sefaz || '');
                          const isDuplicidade = /duplicidade\s+de\s+nf-?e/i.test(msgSefaz);
                          const isJaCancelada = resultado.status_sefaz === '218' || /já está cancelada|já cancelada na base/i.test(msgSefaz);
                          if (resultado.status === "autorizado") {
                            toast({ title: "NF-e autorizada!", description: resultado.mensagem_sefaz || `Protocolo: ${resultado.protocolo || "N/A"}` });
                          } else if (resultado.status === "erro_autorizacao" && isDuplicidade) {
                            toast({
                              title: "Duplicidade na SEFAZ (539)",
                              description: "A nota pode já estar autorizada. Use \"Marcar como autorizada\" — a chave será preenchida automaticamente.",
                              variant: "default"
                            });
                          } else if (resultado.status === "erro_autorizacao" && isJaCancelada) {
                            toast({
                              title: "NF-e já cancelada na SEFAZ (218)",
                              description: "Esta NF-e consta como cancelada na SEFAZ. A sequência foi ajustada; a próxima emissão usará o número seguinte.",
                              variant: "default"
                            });
                          } else {
                            toast({ title: `Status: ${resultado.status}`, description: resultado.mensagem_sefaz || `Protocolo: ${resultado.protocolo || "N/A"}` });
                          }
                          const atualizada = await fetchNfe(nfeSelecionada.id);
                          if (atualizada) setNfeSelecionada(atualizada);
                          fetchStats();
                        } catch (err) {
                          toast({
                            title: "Erro ao consultar",
                            description: err instanceof Error ? err.message : "Erro ao consultar NF-e.",
                            variant: "destructive"
                          });
                        }
                      }}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Verificar status na SEFAZ
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="bg-success/10 hover:bg-success/20"
                      onClick={() => {
                        if (!nfeSelecionada) return;
                        setNfeParaMarcarAutorizada(nfeSelecionada);
                        setChaveMarcarAutorizada(extrairChaveDoMotivo(nfeSelecionada.motivo_status) || nfeSelecionada.chave_acesso || "");
                        setModalDetalhesAberto(false);
                      }}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Marcar como autorizada
                    </Button>
                  </div>
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

      {/* Dialog - Marcar como autorizada (duplicidade) */}
      <Dialog open={!!nfeParaMarcarAutorizada} onOpenChange={(open) => { if (!open) { setNfeParaMarcarAutorizada(null); setChaveMarcarAutorizada(""); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Marcar NF-e como autorizada</DialogTitle>
            <DialogDescription>
              Em caso de duplicidade, a nota pode já estar autorizada na SEFAZ. Ao marcar como autorizada, o sistema passa a tratar esta NF-e como emitida (relatórios, impressão, etc.). Use apenas se você confirmou na SEFAZ ou no painel da Focus NFe que a nota está autorizada.
            </DialogDescription>
          </DialogHeader>
          {nfeParaMarcarAutorizada && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                NF-e #{nfeParaMarcarAutorizada.numero}
              </p>
              <div>
                <Label className="text-sm">Chave de acesso (opcional)</Label>
                <Input
                  className="font-mono text-xs mt-1"
                  placeholder="44 dígitos da chave (pode colar do erro)"
                  value={chaveMarcarAutorizada}
                  onChange={(e) => setChaveMarcarAutorizada(e.target.value.replace(/\D/g, "").slice(0, 44))}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  A chave aparece na mensagem de rejeição [chNFe: ...]. Preencha para poder baixar XML/DANFE depois.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setNfeParaMarcarAutorizada(null); setChaveMarcarAutorizada(""); }}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmarMarcarAutorizada}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Marcar como autorizada
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação - Reprocessar */}
      <AlertDialog open={!!nfeParaReprocessar} onOpenChange={() => setNfeParaReprocessar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {nfeParaReprocessar && isErroDuplicidadeNfe(nfeParaReprocessar.motivo_status)
                ? "Reprocessamento não permitido"
                : "Reprocessar NF-e"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {nfeParaReprocessar && isErroDuplicidadeNfe(nfeParaReprocessar.motivo_status) ? (
                <>
                  A SEFAZ rejeitou esta NF-e por <strong>duplicidade</strong>: pode ser que a nota já esteja autorizada (em uma tentativa anterior). Reprocessar não é possível nesse caso. Use o botão &quot;Verificar&quot; para consultar o status na SEFAZ ou confira na lista de notas autorizadas.
                </>
              ) : (
                <>
                  A NF-e #{nfeParaReprocessar?.numero} teve um erro na emissão.
                  Deseja tentar emitir novamente?
                </>
              )}
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
            <AlertDialogCancel>{nfeParaReprocessar && isErroDuplicidadeNfe(nfeParaReprocessar.motivo_status) ? "Entendi" : "Cancelar"}</AlertDialogCancel>
            {(!nfeParaReprocessar || !isErroDuplicidadeNfe(nfeParaReprocessar.motivo_status)) && (
              <AlertDialogAction onClick={handleConfirmarReprocessamento}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Reprocessar
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
