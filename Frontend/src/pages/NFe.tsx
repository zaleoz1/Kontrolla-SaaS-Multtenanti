import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Settings
} from "lucide-react";

export default function NFe() {
  const [termoBusca, setTermoBusca] = useState("");

  const nfes = [
    {
      id: 1,
      numero: "000001234",
      serie: "001",
      cliente: "João Silva",
      cnpjCpf: "123.456.789-00",
      data: "2024-01-18",
      valor: "R$ 2.499,00",
      status: "autorizada",
      chaveAcesso: "35240101234567000123550010000012341000012341",
      produtos: ["Smartphone Galaxy S24"],
      tipo: "Venda"
    },
    {
      id: 2,
      numero: "000001235", 
      serie: "001",
      cliente: "Maria Santos",
      cnpjCpf: "987.654.321-00",
      data: "2024-01-17",
      valor: "R$ 299,90",
      status: "pendente",
      chaveAcesso: "35240101234567000123550010000012351000012351",
      produtos: ["Fone Bluetooth Premium"],
      tipo: "Venda"
    },
    {
      id: 3,
      numero: "000001236",
      serie: "001", 
      cliente: "Empresa XYZ Ltda",
      cnpjCpf: "12.345.678/0001-90",
      data: "2024-01-16",
      valor: "R$ 5.999,00",
      status: "cancelada",
      chaveAcesso: "35240101234567000123550010000012361000012361",
      produtos: ["Tablet Android", "Smartphone Galaxy", "Acessórios"],
      tipo: "Venda"
    },
    {
      id: 4,
      numero: "000001237",
      serie: "001",
      cliente: "Carlos Lima",
      cnpjCpf: "456.789.123-00", 
      data: "2024-01-15",
      valor: "R$ 189,80",
      status: "erro",
      chaveAcesso: "",
      produtos: ["Carregador USB-C", "Cabo Lightning"],
      tipo: "Venda"
    }
  ];

  const obterBadgeStatus = (status: string) => {
    switch (status) {
      case "autorizada":
        return <Badge className="bg-success hover:bg-success/90">Autorizada</Badge>;
      case "pendente":
        return <Badge className="bg-warning/80 text-warning-foreground">Pendente</Badge>;
      case "cancelada":
        return <Badge variant="secondary">Cancelada</Badge>;
      case "erro":
        return <Badge variant="destructive">Erro</Badge>;
      default:
        return <Badge variant="secondary">Desconhecido</Badge>;
    }
  };

  const obterIconeStatus = (status: string) => {
    switch (status) {
      case "autorizada":
        return <CheckCircle className="h-4 w-4 text-success" />;
      case "pendente":
        return <Clock className="h-4 w-4 text-warning" />;
      case "cancelada":
        return <XCircle className="h-4 w-4 text-muted-foreground" />;
      case "erro":
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const nfesFiltradas = nfes.filter(nfe =>
    nfe.cliente.toLowerCase().includes(termoBusca.toLowerCase()) ||
    nfe.numero.includes(termoBusca) ||
    nfe.cnpjCpf.includes(termoBusca)
  );

  const autorizadasCount = nfes.filter(n => n.status === "autorizada").length;
  const pendentesCount = nfes.filter(n => n.status === "pendente").length;
  const valorTotal = nfes
    .filter(n => n.status === "autorizada")
    .reduce((acc, nfe) => {
      const valor = parseFloat(nfe.valor.replace("R$ ", "").replace(".", "").replace(",", "."));
      return acc + valor;
    }, 0);

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

      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de NF-e</p>
                <p className="text-2xl font-bold">{nfes.length}</p>
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
                <p className="text-2xl font-bold text-success">{autorizadasCount}</p>
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
                <p className="text-2xl font-bold text-warning">{pendentesCount}</p>
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
                  {valorTotal.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL"
                  })}
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
      <Tabs defaultValue="lista" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="lista">Lista de NF-e</TabsTrigger>
          <TabsTrigger value="emitir">Emitir NF-e</TabsTrigger>
          <TabsTrigger value="configuracoes">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="lista" className="space-y-4">
          {/* Busca */}
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
                <Button variant="outline">
                  <Calendar className="h-4 w-4 mr-2" />
                  Período
                </Button>
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtros
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Lista de NF-e */}
          <div className="space-y-4">
            {nfesFiltradas.map((nfe) => (
              <Card key={nfe.id} className="bg-gradient-card shadow-card hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 rounded-lg bg-muted/30">
                        {obterIconeStatus(nfe.status)}
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold">NF-e #{nfe.numero}</h3>
                          {obterBadgeStatus(nfe.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">{nfe.cliente}</p>
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          <span>{nfe.cnpjCpf}</span>
                          <span>•</span>
                          <span>Série: {nfe.serie}</span>
                          <span>•</span>
                          <span>{new Date(nfe.data).toLocaleDateString("pt-BR")}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-foreground">{nfe.valor}</p>
                        <p className="text-sm text-muted-foreground">{nfe.tipo}</p>
                      </div>

                      <div className="flex items-center space-x-2">
                        {nfe.status === "autorizada" && (
                          <>
                            <Button variant="outline" size="sm">
                              <Download className="h-4 w-4 mr-2" />
                              PDF
                            </Button>
                            <Button variant="outline" size="sm">
                              <Download className="h-4 w-4 mr-2" />
                              XML
                            </Button>
                            <Button variant="outline" size="sm">
                              <Printer className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        
                        {nfe.status === "pendente" && (
                          <Button variant="outline" size="sm">
                            <Send className="h-4 w-4 mr-2" />
                            Transmitir
                          </Button>
                        )}
                        
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          Ver
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border/50 space-y-2">
                    <p className="text-sm text-muted-foreground">
                      <strong>Produtos:</strong> {nfe.produtos.join(", ")}
                    </p>
                    
                    {nfe.chaveAcesso && (
                      <p className="text-xs text-muted-foreground font-mono">
                        <strong>Chave:</strong> {nfe.chaveAcesso}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {nfesFiltradas.length === 0 && (
            <Card className="bg-gradient-card shadow-card">
              <CardContent className="p-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma NF-e encontrada</h3>
                <p className="text-muted-foreground mb-4">
                  {termoBusca ? "Tente ajustar sua busca" : "Emita sua primeira nota fiscal"}
                </p>
                <Button className="bg-gradient-primary text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Emitir NF-e
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="emitir" className="space-y-4">
          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle>Emitir Nova NF-e</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <Card className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Dados do Cliente
                  </h3>
                  <div className="space-y-3">
                    <Input placeholder="Nome / Razão Social" />
                    <Input placeholder="CPF / CNPJ" />
                    <Input placeholder="Email" />
                    <Input placeholder="Endereço completo" />
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Dados da Nota
                  </h3>
                  <div className="space-y-3">
                    <Input placeholder="Número da NF-e" />
                    <Input placeholder="Série" value="001" />
                    <Input type="date" />
                    <Input placeholder="Observações" />
                  </div>
                </Card>
              </div>

              <div className="mt-6">
                <h3 className="font-semibold mb-4">Produtos / Serviços</h3>
                <Card className="p-4 bg-muted/30">
                  <p className="text-center text-muted-foreground">
                    Selecione os produtos da venda ou adicione manualmente
                  </p>
                  <div className="flex justify-center mt-4">
                    <Button variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Produto
                    </Button>
                  </div>
                </Card>
              </div>

              <div className="flex justify-end space-x-2 mt-6">
                <Button variant="outline">Salvar Rascunho</Button>
                <Button className="bg-gradient-primary text-white">
                  <Send className="h-4 w-4 mr-2" />
                  Emitir NF-e
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
                <Input placeholder="Razão Social" value="Minha Loja Ltda" />
                <Input placeholder="CNPJ" value="12.345.678/0001-90" />
                <Input placeholder="Inscrição Estadual" value="123456789" />
                <Input placeholder="Endereço" value="Rua das Flores, 123" />
                <Input placeholder="Regime Tributário" value="Simples Nacional" />
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
                <Input placeholder="Série Padrão" value="001" />
                <Input placeholder="Próximo Número" value="000001238" />
                <Input placeholder="Ambiente" value="Produção" />
                <Input placeholder="Certificado Digital" value="Instalado" />
                <div className="text-xs text-muted-foreground">
                  <p>• Certificado válido até: 15/08/2025</p>
                  <p>• Último backup: 18/01/2024</p>
                </div>
                <Button className="w-full">Atualizar Configurações</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}