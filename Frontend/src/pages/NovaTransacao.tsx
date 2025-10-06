import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useTransacoes, Transacao } from "@/hooks/useTransacoes";
import { useBuscaClientes } from "@/hooks/useBuscaClientes";
import { useBuscaFornecedores } from "@/hooks/useBuscaFornecedores";
import { api } from "@/lib/api";
import { 
  Save, 
  X, 
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  CreditCard,
  Receipt,
  Building,
  User,
  AlertCircle,
  CheckCircle,
  Plus,
  Minus,
  Loader2,
  Upload,
  File,
  Image,
  FileText,
  Trash2
} from "lucide-react";

// Removido interface Transacao duplicada - usando a do hook

export default function NovaTransacao() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { criarTransacao, loading } = useTransacoes();
  const { clientesFiltrados: clientes, carregando: loadingClientes } = useBuscaClientes();
  const { fornecedoresFiltrados: fornecedores, carregando: loadingFornecedores } = useBuscaFornecedores();
  const [abaAtiva, setAbaAtiva] = useState("basico");
  const [transacao, setTransacao] = useState<Partial<Transacao>>({
    tipo: "entrada",
    categoria: "",
    descricao: "",
    valor: 0,
    data_transacao: new Date().toISOString().split('T')[0],
    metodo_pagamento: "pix",
    conta: "caixa",
    observacoes: "",
    anexos: [],
    status: undefined
  });
  const [clienteSelecionado, setClienteSelecionado] = useState<string>("");
  const [fornecedorSelecionado, setFornecedorSelecionado] = useState<string>("");
  const [uploadingAnexos, setUploadingAnexos] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Verificar se a aba detalhes deve estar disponível
  const detalhesDisponivel = (transacao.tipo === "saida" && transacao.categoria === "Fornecedores") || 
                            (transacao.tipo === "entrada" && transacao.categoria === "Vendas");

  // Redirecionar para aba básico se detalhes não estiver disponível e estiver ativa
  useEffect(() => {
    if (!detalhesDisponivel && abaAtiva === "detalhes") {
      setAbaAtiva("basico");
    }
  }, [detalhesDisponivel, abaAtiva]);

  const categoriasEntrada = [
    "Vendas",
    "Recebimentos",
    "Investimentos",
    "Reembolsos",
    "Outros"
  ];

  const categoriasSaida = [
    "Compras",
    "Fornecedores",
    "Salários",
    "Impostos",
    "Serviços",
    "Marketing",
    "Despesas Administrativas",
    "Outros"
  ];

  const metodosPagamento = [
    { label: "PIX", value: "pix" },
    { label: "Cartão de Crédito", value: "cartao_credito" },
    { label: "Cartão de Débito", value: "cartao_debito" },
    { label: "Dinheiro", value: "dinheiro" },
    { label: "Transferência", value: "transferencia" },
    { label: "Boleto", value: "boleto" },
    { label: "Cheque", value: "cheque" }
  ];


  // Os fornecedores são carregados automaticamente pelo hook useBuscaFornecedores

  // Os clientes são carregados automaticamente pelo hook useBuscaClientes

  const atualizarTransacao = (campo: keyof Transacao, valor: any) => {
    setTransacao(prev => ({ ...prev, [campo]: valor }));
  };

  const adicionarAnexo = (url: string) => {
    setTransacao(prev => ({
      ...prev,
      anexos: [...prev.anexos, url]
    }));
  };

  const removerAnexo = (index: number) => {
    setTransacao(prev => ({
      ...prev,
      anexos: prev.anexos.filter((_, i) => i !== index)
    }));
  };

  const converterArquivoParaBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Manter o prefixo completo para o Cloudinary
        resolve(result);
      };
      reader.onerror = error => reject(error);
    });
  };

  const uploadAnexo = async (file: File) => {
    try {
      setUploadingAnexos(true);
      
      const base64 = await converterArquivoParaBase64(file);
      
      const response = await api.post('/financeiro/upload-anexo', {
        fileBase64: base64,
        fileName: file.name,
        fileType: file.type
      });

      if (response.data.success) {
        adicionarAnexo(response.data.url);
        toast({
          title: "Sucesso!",
          description: "Arquivo anexado com sucesso.",
        });
      } else {
        throw new Error(response.data.error || 'Erro no upload');
      }
    } catch (error) {
      console.error('Erro no upload:', error);
      toast({
        title: "Erro",
        description: "Erro ao anexar arquivo. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setUploadingAnexos(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      
      // Validar tamanho do arquivo (máximo 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Erro",
          description: "Arquivo muito grande. Tamanho máximo: 10MB",
          variant: "destructive",
        });
        return;
      }

      // Validar tipo de arquivo
      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf', 'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain'
      ];

      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Erro",
          description: "Tipo de arquivo não permitido.",
          variant: "destructive",
        });
        return;
      }

      uploadAnexo(file);
    }
    
    // Limpar o input para permitir selecionar o mesmo arquivo novamente
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFileIcon = (url: string) => {
    const extension = url.split('.').pop()?.toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
      return <Image className="h-4 w-4" />;
    } else if (extension === 'pdf') {
      return <FileText className="h-4 w-4" />;
    } else {
      return <File className="h-4 w-4" />;
    }
  };

  const salvarTransacao = async () => {
    try {
      // Mapear dados do frontend para o formato da API
      const dadosTransacao: Partial<Transacao> = {
        tipo: transacao.tipo,
        categoria: transacao.categoria,
        descricao: transacao.descricao,
        valor: transacao.valor,
        data_transacao: transacao.data_transacao,
        metodo_pagamento: transacao.metodo_pagamento,
        conta: transacao.conta,
        observacoes: transacao.observacoes || null,
        anexos: transacao.anexos || [],
        status: transacao.status,
        // Campos opcionais - usar null em vez de undefined
        cliente_id: null,
        fornecedor_id: null
      };

      // Adicionar cliente ou fornecedor baseado no tipo
      if (transacao.tipo === "entrada" && clienteSelecionado) {
        dadosTransacao.cliente_id = parseInt(clienteSelecionado);
      } else if (transacao.tipo === "saida" && fornecedorSelecionado) {
        dadosTransacao.fornecedor_id = parseInt(fornecedorSelecionado);
      }

      // Converter campos vazios para null
      Object.keys(dadosTransacao).forEach(key => {
        const value = dadosTransacao[key as keyof Transacao];
        if (value === "" || value === undefined) {
          (dadosTransacao as any)[key] = null;
        }
      });

      console.log("📤 Dados da transação a serem enviados:", dadosTransacao);

      await criarTransacao(dadosTransacao);
      
      // Mensagem específica para transações pendentes
      let mensagem = "Transação criada com sucesso.";
      
      if (transacao.tipo === "saida" && transacao.status === "pendente") {
        mensagem = "Conta a pagar criada com sucesso. A transação foi salva diretamente em contas a pagar.";
        if (transacao.anexos && transacao.anexos.length > 0) {
          mensagem += ` ${transacao.anexos.length} anexo(s) foi(ram) salvo(s) junto com a conta.`;
        }
      } else if (transacao.tipo === "entrada" && transacao.status === "pendente") {
        mensagem = "Conta a receber criada com sucesso. A transação foi salva diretamente em contas a receber.";
        if (transacao.anexos && transacao.anexos.length > 0) {
          mensagem += ` ${transacao.anexos.length} anexo(s) foi(ram) salvo(s) junto com a conta.`;
        }
      }
      
      toast({
        title: "Sucesso!",
        description: mensagem,
      });
      
      navigate("/dashboard/financeiro");
    } catch (error) {
      console.error("Erro ao salvar transação:", error);
      toast({
        title: "Erro",
        description: "Erro ao salvar transação. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const formularioValido = transacao.categoria && 
                          transacao.descricao && 
                          transacao.valor && 
                          transacao.valor > 0 &&
                          transacao.status &&
                          (transacao.tipo === "entrada" || (transacao.tipo === "saida" && (transacao.categoria !== "Fornecedores" || fornecedorSelecionado)));

  return (
    <div className="w-full max-w-full overflow-x-hidden space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="w-full flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Nova Transação</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Registre uma nova transação financeira
          </p>
        </div>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
          <Button 
            variant="outline" 
            onClick={() => navigate("/dashboard/financeiro")}
            className="h-8 sm:h-10 text-xs sm:text-sm w-full sm:w-auto"
          >
            <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Cancelar</span>
            <span className="sm:hidden">Cancelar</span>
          </Button>
          <Button 
            className="bg-gradient-primary h-8 sm:h-10 text-xs sm:text-sm w-full sm:w-auto" 
            onClick={salvarTransacao}
            disabled={!formularioValido || loading}
          >
            {loading ? (
              <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 animate-spin" />
            ) : (
              <Save className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            )}
            <span className="hidden sm:inline">
              {loading ? "Salvando..." : "Salvar Transação"}
            </span>
            <span className="sm:hidden">
              {loading ? "Salvando..." : "Salvar"}
            </span>
          </Button>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Coluna Esquerda - Formulário */}
        <div className="lg:col-span-2">
          <Tabs value={abaAtiva} onValueChange={setAbaAtiva} className="space-y-3 sm:space-y-4">
            <TabsList className={`grid w-full h-auto ${(transacao.tipo === "saida" && transacao.categoria === "Fornecedores") || (transacao.tipo === "entrada" && transacao.categoria === "Vendas") ? "grid-cols-3" : "grid-cols-2"}`}>
              <TabsTrigger value="basico" className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2 py-2 sm:py-1">
                <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm">Básico</span>
              </TabsTrigger>
              {((transacao.tipo === "saida" && transacao.categoria === "Fornecedores") || (transacao.tipo === "entrada" && transacao.categoria === "Vendas")) && (
                <TabsTrigger value="detalhes" className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2 py-2 sm:py-1">
                  <Receipt className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="text-xs sm:text-sm">Detalhes</span>
                </TabsTrigger>
              )}
              <TabsTrigger value="anexos" className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2 py-2 sm:py-1">
                <CreditCard className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm">Anexos</span>
              </TabsTrigger>
            </TabsList>

            {/* Aba Básico */}
            <TabsContent value="basico" className="space-y-3 sm:space-y-4">
              <Card className="bg-gradient-card shadow-card">
                <CardHeader className="pb-3 sm:pb-6">
                  <CardTitle className="text-base sm:text-lg">Informações Básicas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  <div>
                    <label className="text-xs sm:text-sm font-medium">Tipo de Transação</label>
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 mt-1">
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="tipo"
                          value="entrada"
                          checked={transacao.tipo === "entrada"}
                          onChange={(e) => atualizarTransacao("tipo", e.target.value)}
                          className="rounded"
                        />
                        <span className="text-xs sm:text-sm flex items-center space-x-1">
                          <ArrowUpRight className="h-3 w-3 sm:h-4 sm:w-4 text-success" />
                          <span>Entrada</span>
                        </span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="tipo"
                          value="saida"
                          checked={transacao.tipo === "saida"}
                          onChange={(e) => atualizarTransacao("tipo", e.target.value)}
                          className="rounded"
                        />
                        <span className="text-xs sm:text-sm flex items-center space-x-1">
                          <ArrowDownRight className="h-3 w-3 sm:h-4 sm:w-4 text-destructive" />
                          <span>Saída</span>
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                    <div>
                      <label className="text-xs sm:text-sm font-medium">Categoria *</label>
                      <select
                        value={transacao.categoria}
                        onChange={(e) => atualizarTransacao("categoria", e.target.value)}
                        className="w-full mt-1 p-2 border rounded-md bg-background h-8 sm:h-10 text-xs sm:text-sm"
                      >
                        <option value="">Selecione uma categoria</option>
                        {(transacao.tipo === "entrada" ? categoriasEntrada : categoriasSaida).map(categoria => (
                          <option key={categoria} value={categoria}>
                            {categoria}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs sm:text-sm font-medium">Valor *</label>
                      <Input
                        type="text"
                        placeholder="0,00"
                        value={transacao.valor}
                        onChange={(e) => {
                          // Permitir apenas números, vírgula e ponto
                          let valor = e.target.value.replace(/[^0-9,.]/g, '');
                          
                          // Remover zeros à esquerda, exceto se for "0," ou "0."
                          if (valor.length > 1 && valor.startsWith('0') && !valor.startsWith('0,') && !valor.startsWith('0.')) {
                            valor = valor.replace(/^0+/, '');
                          }
                          
                          // Se ficou vazio após remover zeros, permitir apenas "0"
                          if (valor === '') {
                            valor = '0';
                          }
                          
                          // Evitar múltiplas vírgulas ou pontos
                          const virgulas = (valor.match(/,/g) || []).length;
                          const pontos = (valor.match(/\./g) || []).length;
                          
                          if (virgulas > 1) {
                            valor = valor.replace(/,/g, '');
                            valor = valor.replace(/(\d+)(\d{2})$/, '$1,$2');
                          }
                          
                          if (pontos > 1) {
                            valor = valor.replace(/\./g, '');
                            valor = valor.replace(/(\d+)(\d{2})$/, '$1.$2');
                          }
                          
                          // Converter vírgula para ponto para cálculo
                          const valorNumerico = parseFloat(valor.replace(',', '.')) || 0;
                          atualizarTransacao("valor", valorNumerico);
                        }}
                        className="mt-1 h-8 sm:h-10 text-xs sm:text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs sm:text-sm font-medium">Descrição *</label>
                    <Input
                      placeholder="Descreva a transação..."
                      value={transacao.descricao}
                      onChange={(e) => atualizarTransacao("descricao", e.target.value)}
                      className="mt-1 h-8 sm:h-10 text-xs sm:text-sm"
                    />
                  </div>

                  <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                    <div>
                      <label className="text-xs sm:text-sm font-medium">Data de pagamento</label>
                      <Input
                        type="date"
                        value={transacao.data_transacao}
                        onChange={(e) => atualizarTransacao("data_transacao", e.target.value)}
                        className="mt-1 h-8 sm:h-10 text-xs sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="text-xs sm:text-sm font-medium">Método de Pagamento</label>
                      <select
                        value={transacao.metodo_pagamento}
                        onChange={(e) => atualizarTransacao("metodo_pagamento", e.target.value)}
                        className="w-full mt-1 p-2 border rounded-md bg-background h-8 sm:h-10 text-xs sm:text-sm"
                      >
                        {metodosPagamento.map(metodo => (
                          <option key={metodo.value} value={metodo.value}>
                            {metodo.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs sm:text-sm font-medium">Conta</label>
                    <Input
                      placeholder="Digite o nome da conta..."
                      value={transacao.conta}
                      onChange={(e) => atualizarTransacao("conta", e.target.value)}
                      className="mt-1 h-8 sm:h-10 text-xs sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-xs sm:text-sm font-medium">Status *</label>
                    <select
                      value={transacao.status || ""}
                      onChange={(e) => atualizarTransacao("status", e.target.value)}
                      className={`w-full mt-1 p-2 border rounded-md bg-background h-8 sm:h-10 text-xs sm:text-sm ${
                        !transacao.status ? "border-red-500 focus:border-red-500" : ""
                      }`}
                    >
                      <option value="">Selecione o status</option>
                      <option value="pendente">Pendente</option>
                      <option value="concluida">Concluída</option>
                    </select>
                    {transacao.tipo === "saida" && transacao.status === "pendente" && (
                      <p className="text-xs text-blue-600 mt-1 flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Será salva diretamente em contas a pagar
                      </p>
                    )}
                    {transacao.tipo === "entrada" && transacao.status === "pendente" && (
                      <p className="text-xs text-green-600 mt-1 flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Será salva diretamente em contas a receber
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Aba Detalhes - Só aparece para Fornecedores (saída) ou Vendas (entrada) */}
            {detalhesDisponivel && (
              <TabsContent value="detalhes" className="space-y-3 sm:space-y-4">
                <Card className="bg-gradient-card shadow-card">
                  <CardHeader className="pb-3 sm:pb-6">
                    <CardTitle className="text-base sm:text-lg">Detalhes Adicionais</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4">
                    {transacao.tipo === "saida" && transacao.categoria === "Fornecedores" && (
                      <div>
                        <label className="text-xs sm:text-sm font-medium">Fornecedor *</label>
                        <select
                          value={fornecedorSelecionado}
                          onChange={(e) => setFornecedorSelecionado(e.target.value)}
                          className={`w-full mt-1 p-2 border rounded-md bg-background h-8 sm:h-10 text-xs sm:text-sm ${
                            !fornecedorSelecionado 
                              ? "border-red-500 focus:border-red-500" 
                              : ""
                          }`}
                          disabled={loadingFornecedores}
                        >
                          <option value="">Selecione um fornecedor</option>
                          {fornecedores.map(fornecedor => (
                            <option key={fornecedor.id} value={fornecedor.id}>
                              {fornecedor.nome}
                            </option>
                          ))}
                        </select>
                        {loadingFornecedores && (
                          <div className="flex items-center mt-1 text-xs sm:text-sm text-muted-foreground">
                            <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2 animate-spin" />
                            Carregando fornecedores...
                          </div>
                        )}
                      </div>
                    )}

                    {transacao.tipo === "entrada" && transacao.categoria === "Vendas" && (
                      <div>
                        <label className="text-xs sm:text-sm font-medium">Cliente</label>
                        <select
                          value={clienteSelecionado}
                          onChange={(e) => setClienteSelecionado(e.target.value)}
                          className="w-full mt-1 p-2 border rounded-md bg-background h-8 sm:h-10 text-xs sm:text-sm"
                          disabled={loadingClientes}
                        >
                          <option value="">Selecione um cliente</option>
                          {clientes.map(cliente => (
                            <option key={cliente.id} value={cliente.id}>
                              {cliente.nome}
                            </option>
                          ))}
                        </select>
                        {loadingClientes && (
                          <div className="flex items-center mt-1 text-xs sm:text-sm text-muted-foreground">
                            <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2 animate-spin" />
                            Carregando clientes...
                          </div>
                        )}
                      </div>
                    )}

                    <div>
                      <label className="text-xs sm:text-sm font-medium">Observações</label>
                      <textarea
                        placeholder="Observações sobre a transação..."
                        value={transacao.observacoes}
                        onChange={(e) => atualizarTransacao("observacoes", e.target.value)}
                        className="w-full mt-1 p-2 border rounded-md bg-background min-h-[60px] sm:min-h-[80px] resize-none text-xs sm:text-sm"
                      />
                    </div>

                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {/* Aba Anexos */}
            <TabsContent value="anexos" className="space-y-3 sm:space-y-4">
              <Card className="bg-gradient-card shadow-card">
                <CardHeader className="pb-3 sm:pb-6">
                  <CardTitle className="text-base sm:text-lg">Anexos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-3 sm:p-4 text-center">
                    <Upload className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                      Arraste arquivos aqui ou clique para selecionar
                    </p>
                    <p className="text-xs text-muted-foreground mb-3">
                      Formatos permitidos: JPG, PNG, GIF, PDF, DOC, DOCX, XLS, XLSX, TXT (máx. 10MB)
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 sm:h-9 text-xs sm:text-sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingAnexos}
                    >
                      {uploadingAnexos ? (
                        <>
                          <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Upload className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                          Selecionar Arquivos
                        </>
                      )}
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>

                  {transacao.anexos.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-xs sm:text-sm">Arquivos Anexados ({transacao.anexos.length})</h4>
                      {transacao.anexos.map((anexo, index) => (
                        <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border">
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            {getFileIcon(anexo)}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs sm:text-sm font-medium truncate">
                                {anexo.split('/').pop()?.split('?')[0] || 'Anexo'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {anexo.includes('cloudinary') ? 'Armazenado no Cloudinary' : 'URL externa'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(anexo, '_blank')}
                              className="h-7 sm:h-8 w-7 sm:w-8 p-0"
                              title="Visualizar arquivo"
                            >
                              <File className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => removerAnexo(index)}
                              className="h-7 sm:h-8 w-7 sm:w-8 p-0 text-destructive hover:text-destructive"
                              title="Remover anexo"
                            >
                              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {transacao.anexos.length === 0 && (
                    <div className="text-center py-4">
                      <File className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Nenhum arquivo anexado ainda
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Coluna Direita - Preview */}
        <div className="space-y-3 sm:space-y-4">
          {/* Preview da Transação */}
          <Card className="bg-gradient-card shadow-card">
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="text-base sm:text-lg">Preview da Transação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              {transacao.descricao ? (
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 sm:p-3 rounded-lg ${transacao.tipo === "entrada" ? "bg-success/10" : "bg-destructive/10"}`}>
                      {transacao.tipo === "entrada" ? (
                        <ArrowUpRight className="h-4 w-4 sm:h-6 sm:w-6 text-success" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 sm:h-6 sm:w-6 text-destructive" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm sm:text-base truncate">{transacao.descricao}</h3>
                      {transacao.categoria && (
                        <Badge variant="outline" className="mt-1 text-xs">
                          {transacao.categoria}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 text-xs sm:text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Valor:</span>
                      <span className={`text-base sm:text-lg font-bold ${transacao.tipo === "entrada" ? "text-success" : "text-destructive"}`}>
                        {transacao.tipo === "entrada" ? "+" : "-"}
                        {transacao.valor > 0 ? transacao.valor.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL"
                        }) : "R$ 0,00"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Data:</span>
                      <span className="truncate">{transacao.data_transacao ? new Date(transacao.data_transacao).toLocaleDateString("pt-BR") : ""}</span>
                    </div>

                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Método:</span>
                      <span className="truncate">{metodosPagamento.find(m => m.value === transacao.metodo_pagamento)?.label || transacao.metodo_pagamento}</span>
                    </div>

                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Conta:</span>
                      <span className="truncate">{transacao.conta || "Não informado"}</span>
                    </div>

                    {fornecedorSelecionado && (
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span>Fornecedor:</span>
                        <span className="truncate">{fornecedores.find(f => f.id === parseInt(fornecedorSelecionado))?.nome || ""}</span>
                      </div>
                    )}

                    {clienteSelecionado && (
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span>Cliente:</span>
                        <span className="truncate">{clientes.find(c => c.id === parseInt(clienteSelecionado))?.nome || ""}</span>
                      </div>
                    )}

                    {transacao.anexos.length > 0 && (
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span>Anexos:</span>
                        <span className="truncate">{transacao.anexos.length} arquivo(s)</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <Badge 
                      variant={transacao.status === "concluida" ? "default" : "secondary"}
                      className={`text-xs ${transacao.status === "concluida" ? "bg-success" : ""}`}
                    >
                      {transacao.status === "concluida" ? "Concluída" : 
                       transacao.status === "pendente" ? "Pendente" : "Cancelada"}
                    </Badge>
                    
                    {transacao.anexos.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {transacao.anexos.length} anexo(s)
                      </Badge>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  <DollarSign className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2" />
                  <p className="text-xs sm:text-sm">Preencha as informações básicas para ver o preview</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Validação do Formulário */}
          <Card className="bg-gradient-card shadow-card">
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="text-base sm:text-lg">Status do Formulário</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center space-x-2">
                {transacao.categoria ? (
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-success" />
                ) : (
                  <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                )}
                <span className="text-xs sm:text-sm">Categoria</span>
              </div>

              <div className="flex items-center space-x-2">
                {transacao.descricao ? (
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-success" />
                ) : (
                  <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                )}
                <span className="text-xs sm:text-sm">Descrição</span>
              </div>

              <div className="flex items-center space-x-2">
                {transacao.valor > 0 ? (
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-success" />
                ) : (
                  <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                )}
                <span className="text-xs sm:text-sm">Valor</span>
              </div>

              <div className="flex items-center space-x-2">
                {transacao.data_transacao ? (
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-success" />
                ) : (
                  <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                )}
                <span className="text-xs sm:text-sm">Data de Pagamento</span>
              </div>

              <div className="flex items-center space-x-2">
                {transacao.status ? (
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-success" />
                ) : (
                  <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                )}
                <span className="text-xs sm:text-sm">Status</span>
              </div>

              {transacao.tipo === "saida" && transacao.categoria === "Fornecedores" && (
                <div className="flex items-center space-x-2">
                  {fornecedorSelecionado ? (
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-success" />
                  ) : (
                    <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                  )}
                  <span className="text-xs sm:text-sm">Fornecedor</span>
                </div>
              )}

              {formularioValido && (
                <div className="pt-2 border-t">
                  <div className="flex items-center space-x-2 text-success">
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="text-xs sm:text-sm font-medium">Formulário válido</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dicas */}
          <Card className="bg-gradient-card shadow-card">
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="text-base sm:text-lg">Dicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs sm:text-sm text-muted-foreground">
              <p>• Preencha todos os campos obrigatórios marcados com *</p>
              <p>• Use categorias específicas para melhor organização</p>
              <p>• Anexe comprovantes quando necessário</p>
              <p>• Mantenha as observações claras e objetivas</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
