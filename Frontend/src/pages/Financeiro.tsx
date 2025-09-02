import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Search, 
  Filter, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  CreditCard,
  Receipt,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Building,
  FileText
} from "lucide-react";

export default function Financeiro() {
  const [termoBusca, setTermoBusca] = useState("");
  const navigate = useNavigate();

  const contasReceber = [
    {
      id: "REC001",
      cliente: "João Silva", 
      descricao: "Venda #VD001 - Smartphone Galaxy",
      valor: "R$ 2.499,00",
      dataVencimento: "2024-01-20",
      status: "pendente",
      dias: 2,
      parcela: "1/3"
    },
    {
      id: "REC002",
      cliente: "Maria Santos",
      descricao: "Venda #VD002 - Fone Bluetooth",  
      valor: "R$ 299,90",
      dataVencimento: "2024-01-25",
      status: "pendente",
      dias: 7,
      parcela: "1/1"
    },
    {
      id: "REC003", 
      cliente: "Carlos Lima",
      descricao: "Venda #VD003 - Tablet Android",
      valor: "R$ 649,50",
      dataVencimento: "2024-01-15",
      status: "vencido",
      dias: -3,
      parcela: "2/2"
    }
  ];

  const contasPagar = [
    {
      id: "PAG001",
      fornecedor: "Fornecedor Tech Ltda",
      descricao: "Compra de estoque - Smartphones",
      valor: "R$ 15.000,00", 
      dataVencimento: "2024-01-22",
      status: "pendente",
      dias: 4,
      categoria: "Estoque"
    },
    {
      id: "PAG002",
      fornecedor: "Loja de Acessórios",
      descricao: "Fones e carregadores",
      valor: "R$ 3.500,00",
      dataVencimento: "2024-01-28",
      status: "pendente", 
      dias: 10,
      categoria: "Estoque"
    },
    {
      id: "PAG003",
      fornecedor: "Energia Elétrica SP",
      descricao: "Conta de luz - Janeiro 2024",
      valor: "R$ 489,50",
      dataVencimento: "2024-01-18",
      status: "vencido",
      dias: 0,
      categoria: "Despesas"
    }
  ];

  const transacoes = [
    {
      id: "T001",
      tipo: "credito",
      descricao: "Venda - João Silva",
      valor: "R$ 2.499,00",
      data: "2024-01-18",
      hora: "14:30",
      metodo: "PIX",
      status: "concluida"
    },
    {
      id: "T002", 
      tipo: "debito",
      descricao: "Pagamento - Fornecedor Tech",
      valor: "R$ 5.000,00",
      data: "2024-01-18",
      hora: "10:15",
      metodo: "Transferência",
      status: "concluida"
    },
    {
      id: "T003",
      tipo: "credito", 
      descricao: "Venda - Maria Santos",
      valor: "R$ 299,90",
      data: "2024-01-17",
      hora: "16:45",
      metodo: "Cartão",
      status: "pendente"
    }
  ];

  const obterBadgeStatus = (status: string, dias?: number) => {
    switch (status) {
      case "pendente":
        return <Badge variant="secondary">Pendente</Badge>;
      case "vencido":
        return <Badge variant="destructive">Vencido</Badge>;
      case "pago":
      case "concluida":
        return <Badge className="bg-success hover:bg-success/90">Pago</Badge>;
      default:
        return <Badge variant="secondary">Desconhecido</Badge>;
    }
  };

  const totalReceber = contasReceber.reduce((acc, item) => {
    const valor = parseFloat(item.valor.replace("R$ ", "").replace(".", "").replace(",", "."));
    return acc + valor;
  }, 0);

  const totalPagar = contasPagar.reduce((acc, item) => {
    const valor = parseFloat(item.valor.replace("R$ ", "").replace(".", "").replace(",", "."));
    return acc + valor;
  }, 0);

  const fluxoCaixa = totalReceber - totalPagar;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold">Financeiro</h1>
          <p className="text-muted-foreground">
            Controle financeiro e fluxo de caixa
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Este Mês
          </Button>
          <Button className="bg-gradient-primary" onClick={() => navigate("/nova-transacao")}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Transação
          </Button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">A Receber</p>
                <p className="text-2xl font-bold text-success">
                  {totalReceber.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL"
                  })}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-success/10">
                <ArrowUpRight className="h-5 w-5 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">A Pagar</p>
                <p className="text-2xl font-bold text-destructive">
                  {totalPagar.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL"
                  })}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-destructive/10">
                <ArrowDownRight className="h-5 w-5 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Fluxo de Caixa</p>
                <p className={`text-2xl font-bold ${fluxoCaixa >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {fluxoCaixa.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL"
                  })}
                </p>
              </div>
              <div className={`p-2 rounded-lg ${fluxoCaixa >= 0 ? 'bg-success/10' : 'bg-destructive/10'}`}>
                <Wallet className={`h-5 w-5 ${fluxoCaixa >= 0 ? 'text-success' : 'text-destructive'}`} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Saldo Atual</p>
                <p className="text-2xl font-bold text-primary">R$ 12.847,30</p>
              </div>
              <div className="p-2 rounded-lg bg-primary/10">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Abas Financeiras */}
      <Tabs defaultValue="receber" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="receber">Contas a Receber</TabsTrigger>  
          <TabsTrigger value="pagar">Contas a Pagar</TabsTrigger>
          <TabsTrigger value="transacoes">Transações</TabsTrigger>
          <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
        </TabsList>

        <TabsContent value="receber" className="space-y-4">
          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Contas a Receber</CardTitle>
                <Badge variant="secondary">{contasReceber.length} pendentes</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {contasReceber.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <p className="font-semibold">{item.cliente}</p>
                        {obterBadgeStatus(item.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">{item.descricao}</p>
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <span>Vencimento: {new Date(item.dataVencimento).toLocaleDateString("pt-BR")}</span>
                        <span>Parcela: {item.parcela}</span>
                        {item.status === "vencido" && (
                          <span className="text-destructive font-medium">
                            {Math.abs(item.dias)} dias em atraso
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-lg font-bold text-success">{item.valor}</p>
                      <Button size="sm" variant="outline">
                        <Receipt className="h-4 w-4 mr-2" />
                        Receber
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pagar" className="space-y-4">
          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Contas a Pagar</CardTitle>
                <Badge variant="secondary">{contasPagar.length} pendentes</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {contasPagar.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <p className="font-semibold">{item.fornecedor}</p>
                        {obterBadgeStatus(item.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">{item.descricao}</p>
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <span>Vencimento: {new Date(item.dataVencimento).toLocaleDateString("pt-BR")}</span>
                        <Badge variant="outline" className="text-xs">{item.categoria}</Badge>
                        {item.status === "vencido" && (
                          <span className="text-destructive font-medium">
                            Vencido hoje
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-lg font-bold text-destructive">{item.valor}</p>
                      <Button size="sm" variant="outline">
                        <CreditCard className="h-4 w-4 mr-2" />
                        Pagar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transacoes" className="space-y-4">
          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle>Transações Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transacoes.map((transacao) => (
                  <div key={transacao.id} className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-lg ${transacao.tipo === 'credito' ? 'bg-success/10' : 'bg-destructive/10'}`}>
                        {transacao.tipo === 'credito' ? (
                          <ArrowUpRight className="h-5 w-5 text-success" />
                        ) : (
                          <ArrowDownRight className="h-5 w-5 text-destructive" />
                        )}
                      </div>
                      <div className="space-y-1">
                        <p className="font-semibold">{transacao.descricao}</p>
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          <span>{transacao.data} às {transacao.hora}</span>
                          <span>{transacao.metodo}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <p className={`text-lg font-bold ${transacao.tipo === 'credito' ? 'text-success' : 'text-destructive'}`}>
                        {transacao.tipo === 'credito' ? '+' : '-'}{transacao.valor}
                      </p>
                      {obterBadgeStatus(transacao.status)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="relatorios" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="bg-gradient-card shadow-card">
              <CardContent className="p-6 text-center">
                <FileText className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Fluxo de Caixa</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Relatório detalhado de entradas e saídas
                </p>
                <Button size="sm" className="bg-gradient-primary">Gerar Relatório</Button>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card shadow-card">
              <CardContent className="p-6 text-center">
                <TrendingUp className="h-12 w-12 text-success mx-auto mb-4" />
                <h3 className="font-semibold mb-2">DRE Mensal</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Demonstrativo de resultados do exercício
                </p>
                <Button size="sm" className="bg-gradient-primary">Gerar Relatório</Button>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card shadow-card">
              <CardContent className="p-6 text-center">
                <Building className="h-12 w-12 text-info mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Balanço</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Posição patrimonial da empresa  
                </p>
                <Button size="sm" className="bg-gradient-primary">Gerar Relatório</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}