import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Minus
} from "lucide-react";

interface Transacao {
  tipo: "entrada" | "saida";
  categoria: string;
  descricao: string;
  valor: number;
  data: string;
  metodoPagamento: string;
  conta: string;
  fornecedor?: string;
  cliente?: string;
  observacoes: string;
  anexos: string[];
  status: "pendente" | "concluida" | "cancelada";
}

export default function NovaTransacao() {
  const navigate = useNavigate();
  const [abaAtiva, setAbaAtiva] = useState("basico");
  const [transacao, setTransacao] = useState<Transacao>({
    tipo: "entrada",
    categoria: "",
    descricao: "",
    valor: 0,
    data: new Date().toISOString().split('T')[0],
    metodoPagamento: "pix",
    conta: "caixa",
    observacoes: "",
    anexos: [],
    status: "pendente"
  });

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
    "PIX",
    "Cartão de Crédito",
    "Cartão de Débito",
    "Dinheiro",
    "Transferência",
    "Boleto",
    "Cheque"
  ];

  const contas = [
    "Caixa",
    "Banco Principal",
    "Banco Secundário",
    "Poupança",
    "Investimentos"
  ];

  const fornecedores = [
    "Fornecedor Tech Ltda",
    "Loja de Acessórios",
    "Energia Elétrica SP",
    "Água e Esgoto",
    "Internet e Telefone",
    "Limpeza e Higiene",
    "Outros"
  ];

  const clientes = [
    "João Silva",
    "Maria Santos",
    "Carlos Lima",
    "Ana Costa",
    "Empresa XYZ Ltda",
    "Outros"
  ];

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

  const salvarTransacao = () => {
    // Aqui seria implementada a lógica para salvar a transação
    console.log("Transação salva:", transacao);
    navigate("/dashboard/financeiro");
  };

  const formularioValido = transacao.categoria && transacao.descricao && transacao.valor > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold">Nova Transação</h1>
          <p className="text-muted-foreground">
            Registre uma nova transação financeira
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => navigate("/dashboard/financeiro")}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button 
            className="bg-gradient-primary" 
            onClick={salvarTransacao}
            disabled={!formularioValido}
          >
            <Save className="h-4 w-4 mr-2" />
            Salvar Transação
          </Button>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Coluna Esquerda - Formulário */}
        <div className="lg:col-span-2">
          <Tabs value={abaAtiva} onValueChange={setAbaAtiva} className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basico" className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4" />
                <span>Básico</span>
              </TabsTrigger>
              <TabsTrigger value="detalhes" className="flex items-center space-x-2">
                <Receipt className="h-4 w-4" />
                <span>Detalhes</span>
              </TabsTrigger>
              <TabsTrigger value="anexos" className="flex items-center space-x-2">
                <CreditCard className="h-4 w-4" />
                <span>Anexos</span>
              </TabsTrigger>
            </TabsList>

            {/* Aba Básico */}
            <TabsContent value="basico" className="space-y-4">
              <Card className="bg-gradient-card shadow-card">
                <CardHeader>
                  <CardTitle>Informações Básicas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Tipo de Transação</label>
                    <div className="flex space-x-4 mt-1">
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="tipo"
                          value="entrada"
                          checked={transacao.tipo === "entrada"}
                          onChange={(e) => atualizarTransacao("tipo", e.target.value)}
                          className="rounded"
                        />
                        <span className="text-sm flex items-center space-x-1">
                          <ArrowUpRight className="h-4 w-4 text-success" />
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
                        <span className="text-sm flex items-center space-x-1">
                          <ArrowDownRight className="h-4 w-4 text-destructive" />
                          <span>Saída</span>
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium">Categoria *</label>
                      <select
                        value={transacao.categoria}
                        onChange={(e) => atualizarTransacao("categoria", e.target.value)}
                        className="w-full mt-1 p-2 border rounded-md bg-background"
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
                      <label className="text-sm font-medium">Valor *</label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0,00"
                        value={transacao.valor}
                        onChange={(e) => atualizarTransacao("valor", parseFloat(e.target.value) || 0)}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Descrição *</label>
                    <Input
                      placeholder="Descreva a transação..."
                      value={transacao.descricao}
                      onChange={(e) => atualizarTransacao("descricao", e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium">Data</label>
                      <Input
                        type="date"
                        value={transacao.data}
                        onChange={(e) => atualizarTransacao("data", e.target.value)}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">Método de Pagamento</label>
                      <select
                        value={transacao.metodoPagamento}
                        onChange={(e) => atualizarTransacao("metodoPagamento", e.target.value)}
                        className="w-full mt-1 p-2 border rounded-md bg-background"
                      >
                        {metodosPagamento.map(metodo => (
                          <option key={metodo} value={metodo}>
                            {metodo}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Conta</label>
                    <select
                      value={transacao.conta}
                      onChange={(e) => atualizarTransacao("conta", e.target.value)}
                      className="w-full mt-1 p-2 border rounded-md bg-background"
                    >
                      {contas.map(conta => (
                        <option key={conta} value={conta.toLowerCase()}>
                          {conta}
                        </option>
                      ))}
                    </select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Aba Detalhes */}
            <TabsContent value="detalhes" className="space-y-4">
              <Card className="bg-gradient-card shadow-card">
                <CardHeader>
                  <CardTitle>Detalhes Adicionais</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {transacao.tipo === "saida" && (
                    <div>
                      <label className="text-sm font-medium">Fornecedor</label>
                      <select
                        value={transacao.fornecedor || ""}
                        onChange={(e) => atualizarTransacao("fornecedor", e.target.value)}
                        className="w-full mt-1 p-2 border rounded-md bg-background"
                      >
                        <option value="">Selecione um fornecedor</option>
                        {fornecedores.map(fornecedor => (
                          <option key={fornecedor} value={fornecedor}>
                            {fornecedor}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {transacao.tipo === "entrada" && (
                    <div>
                      <label className="text-sm font-medium">Cliente</label>
                      <select
                        value={transacao.cliente || ""}
                        onChange={(e) => atualizarTransacao("cliente", e.target.value)}
                        className="w-full mt-1 p-2 border rounded-md bg-background"
                      >
                        <option value="">Selecione um cliente</option>
                        {clientes.map(cliente => (
                          <option key={cliente} value={cliente}>
                            {cliente}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium">Observações</label>
                    <textarea
                      placeholder="Observações sobre a transação..."
                      value={transacao.observacoes}
                      onChange={(e) => atualizarTransacao("observacoes", e.target.value)}
                      className="w-full mt-1 p-2 border rounded-md bg-background min-h-[80px] resize-none"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Status</label>
                    <select
                      value={transacao.status}
                      onChange={(e) => atualizarTransacao("status", e.target.value)}
                      className="w-full mt-1 p-2 border rounded-md bg-background"
                    >
                      <option value="pendente">Pendente</option>
                      <option value="concluida">Concluída</option>
                      <option value="cancelada">Cancelada</option>
                    </select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Aba Anexos */}
            <TabsContent value="anexos" className="space-y-4">
              <Card className="bg-gradient-card shadow-card">
                <CardHeader>
                  <CardTitle>Anexos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center">
                    <CreditCard className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-2">
                      Arraste arquivos aqui ou clique para selecionar
                    </p>
                    <Button variant="outline" size="sm">
                      Selecionar Arquivos
                    </Button>
                  </div>

                  {transacao.anexos.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Arquivos Anexados</h4>
                      {transacao.anexos.map((anexo, index) => (
                        <div key={index} className="flex items-center justify-between p-2 rounded bg-muted/30">
                          <span className="text-sm">{anexo}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removerAnexo(index)}
                          >
                            <X className="h-4 w-4" />
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
        <div className="space-y-4">
          {/* Preview da Transação */}
          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle>Preview da Transação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {transacao.descricao ? (
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className={`p-3 rounded-lg ${transacao.tipo === "entrada" ? "bg-success/10" : "bg-destructive/10"}`}>
                      {transacao.tipo === "entrada" ? (
                        <ArrowUpRight className="h-6 w-6 text-success" />
                      ) : (
                        <ArrowDownRight className="h-6 w-6 text-destructive" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold">{transacao.descricao}</h3>
                      {transacao.categoria && (
                        <Badge variant="outline" className="mt-1">
                          {transacao.categoria}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Valor:</span>
                      <span className={`text-lg font-bold ${transacao.tipo === "entrada" ? "text-success" : "text-destructive"}`}>
                        {transacao.tipo === "entrada" ? "+" : "-"}
                        {transacao.valor.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL"
                        })}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Data:</span>
                      <span>{new Date(transacao.data).toLocaleDateString("pt-BR")}</span>
                    </div>

                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Método:</span>
                      <span>{transacao.metodoPagamento}</span>
                    </div>

                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Conta:</span>
                      <span className="capitalize">{transacao.conta}</span>
                    </div>

                    {transacao.fornecedor && (
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>Fornecedor:</span>
                        <span>{transacao.fornecedor}</span>
                      </div>
                    )}

                    {transacao.cliente && (
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>Cliente:</span>
                        <span>{transacao.cliente}</span>
                      </div>
                    )}
                  </div>

                  <Badge 
                    variant={transacao.status === "concluida" ? "default" : "secondary"}
                    className={transacao.status === "concluida" ? "bg-success" : ""}
                  >
                    {transacao.status === "concluida" ? "Concluída" : 
                     transacao.status === "pendente" ? "Pendente" : "Cancelada"}
                  </Badge>
                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  <DollarSign className="h-12 w-12 mx-auto mb-2" />
                  <p>Preencha as informações básicas para ver o preview</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Validação do Formulário */}
          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle>Status do Formulário</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center space-x-2">
                {transacao.categoria ? (
                  <CheckCircle className="h-4 w-4 text-success" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-sm">Categoria</span>
              </div>

              <div className="flex items-center space-x-2">
                {transacao.descricao ? (
                  <CheckCircle className="h-4 w-4 text-success" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-sm">Descrição</span>
              </div>

              <div className="flex items-center space-x-2">
                {transacao.valor > 0 ? (
                  <CheckCircle className="h-4 w-4 text-success" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-sm">Valor</span>
              </div>

              <div className="flex items-center space-x-2">
                {transacao.data ? (
                  <CheckCircle className="h-4 w-4 text-success" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-sm">Data</span>
              </div>

              {formularioValido && (
                <div className="pt-2 border-t">
                  <div className="flex items-center space-x-2 text-success">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Formulário válido</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dicas */}
          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle>Dicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
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
