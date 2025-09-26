import { useState, useEffect } from "react";
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
  Loader2
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
    status: "pendente"
  });
  const [clienteSelecionado, setClienteSelecionado] = useState<string>("");
  const [fornecedorSelecionado, setFornecedorSelecionado] = useState<string>("");

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

  const contas = [
    { label: "Caixa", value: "caixa" },
    { label: "Banco Principal", value: "banco_principal" },
    { label: "Banco Secundário", value: "banco_secundario" },
    { label: "Poupança", value: "poupanca" },
    { label: "Investimentos", value: "investimentos" }
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
      
      // Mensagem específica para transações de saída pendentes
      const mensagem = transacao.tipo === "saida" && transacao.status === "pendente" 
        ? "Conta a pagar criada com sucesso. A transação foi salva diretamente em contas a pagar."
        : "Transação criada com sucesso.";
      
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

  const formularioValido = transacao.categoria && transacao.descricao && transacao.valor && transacao.valor > 0;

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
            <TabsList className="grid w-full grid-cols-3 h-auto">
              <TabsTrigger value="basico" className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2 py-2 sm:py-1">
                <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm">Básico</span>
              </TabsTrigger>
              <TabsTrigger value="detalhes" className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2 py-2 sm:py-1">
                <Receipt className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm">Detalhes</span>
              </TabsTrigger>
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
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0,00"
                        value={transacao.valor}
                        onChange={(e) => atualizarTransacao("valor", parseFloat(e.target.value) || 0)}
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
                      <label className="text-xs sm:text-sm font-medium">Data</label>
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
                    <select
                      value={transacao.conta}
                      onChange={(e) => atualizarTransacao("conta", e.target.value)}
                      className="w-full mt-1 p-2 border rounded-md bg-background h-8 sm:h-10 text-xs sm:text-sm"
                    >
                      {contas.map(conta => (
                        <option key={conta.value} value={conta.value}>
                          {conta.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Aba Detalhes */}
            <TabsContent value="detalhes" className="space-y-3 sm:space-y-4">
              <Card className="bg-gradient-card shadow-card">
                <CardHeader className="pb-3 sm:pb-6">
                  <CardTitle className="text-base sm:text-lg">Detalhes Adicionais</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  {transacao.tipo === "saida" && (
                    <div>
                      <label className="text-xs sm:text-sm font-medium">Fornecedor</label>
                      <select
                        value={fornecedorSelecionado}
                        onChange={(e) => setFornecedorSelecionado(e.target.value)}
                        className="w-full mt-1 p-2 border rounded-md bg-background h-8 sm:h-10 text-xs sm:text-sm"
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

                  {transacao.tipo === "entrada" && (
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

                  <div>
                    <label className="text-xs sm:text-sm font-medium">Status</label>
                    <select
                      value={transacao.status}
                      onChange={(e) => atualizarTransacao("status", e.target.value)}
                      className="w-full mt-1 p-2 border rounded-md bg-background h-8 sm:h-10 text-xs sm:text-sm"
                    >
                      <option value="pendente">Pendente</option>
                      <option value="concluida">Concluída</option>
                      <option value="cancelada">Cancelada</option>
                    </select>
                    {transacao.tipo === "saida" && transacao.status === "pendente" && (
                      <p className="text-xs text-blue-600 mt-1 flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Será salva diretamente em contas a pagar
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Aba Anexos */}
            <TabsContent value="anexos" className="space-y-3 sm:space-y-4">
              <Card className="bg-gradient-card shadow-card">
                <CardHeader className="pb-3 sm:pb-6">
                  <CardTitle className="text-base sm:text-lg">Anexos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-3 sm:p-4 text-center">
                    <CreditCard className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                      Arraste arquivos aqui ou clique para selecionar
                    </p>
                    <Button variant="outline" size="sm" className="h-8 sm:h-9 text-xs sm:text-sm">
                      Selecionar Arquivos
                    </Button>
                  </div>

                  {transacao.anexos.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-xs sm:text-sm">Arquivos Anexados</h4>
                      {transacao.anexos.map((anexo, index) => (
                        <div key={index} className="flex items-center justify-between p-2 rounded bg-muted/30">
                          <span className="text-xs sm:text-sm truncate flex-1 mr-2">{anexo}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removerAnexo(index)}
                            className="h-7 sm:h-8 w-7 sm:w-8 p-0"
                          >
                            <X className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                        </div>
                      ))}
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
                        {transacao.valor.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL"
                        })}
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
                      <span className="truncate">{contas.find(c => c.value === transacao.conta)?.label || transacao.conta}</span>
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
                  </div>

                  <Badge 
                    variant={transacao.status === "concluida" ? "default" : "secondary"}
                    className={`text-xs ${transacao.status === "concluida" ? "bg-success" : ""}`}
                  >
                    {transacao.status === "concluida" ? "Concluída" : 
                     transacao.status === "pendente" ? "Pendente" : "Cancelada"}
                  </Badge>
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
                <span className="text-xs sm:text-sm">Data</span>
              </div>

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
              <p>• Transações de saída pendentes são salvas diretamente em contas a pagar</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
