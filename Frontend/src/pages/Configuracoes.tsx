import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Settings, 
  User, 
  CreditCard, 
  Palette, 
  Bell, 
  Shield, 
  Building,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Save,
  Upload,
  Download,
  Eye,
  EyeOff,
  CheckCircle,
  AlertTriangle,
  Crown,
  Star,
  Globe,
  Lock,
  Key,
  Smartphone,
  Monitor,
  Moon,
  Sun,
  Laptop,
  Activity
} from "lucide-react";

export default function Configuracoes() {
  const [dadosConta, setDadosConta] = useState({
    nome: "João Silva",
    email: "joao@minhaloja.com",
    telefone: "(11) 99999-8888",
    empresa: "Minha Loja Ltda",
    cnpj: "12.345.678/0001-90",
    endereco: "Rua das Flores, 123 - São Paulo, SP",
    dataCriacao: "2024-01-01",
    plano: "Pro",
    status: "ativo"
  });

  const [configuracoes, setConfiguracoes] = useState({
    tema: "sistema",
    idioma: "pt-BR",
    fusoHorario: "America/Sao_Paulo",
    moeda: "BRL",
    formatoData: "DD/MM/YYYY",
    notificacoes: {
      email: true,
      push: true,
      sms: false,
      vendas: true,
      estoque: true,
      financeiro: true,
      clientes: false
    },
    seguranca: {
      autenticacao2FA: false,
      sessaoLonga: true,
      logAtividade: true,
      backupAutomatico: true
    }
  });

  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mostrarSenhas, setMostrarSenhas] = useState(false);

  const atualizarDadosConta = (campo: string, valor: string) => {
    setDadosConta(prev => ({ ...prev, [campo]: valor }));
  };

  const atualizarConfiguracao = (categoria: string, campo: string, valor: any) => {
    setConfiguracoes(prev => ({
      ...prev,
      [categoria]: {
        ...prev[categoria as keyof typeof prev],
        [campo]: valor
      }
    }));
  };

  const salvarDadosConta = () => {
    // Implementar salvamento
    console.log("Salvando dados da conta:", dadosConta);
  };

  const salvarConfiguracoes = () => {
    // Implementar salvamento
    console.log("Salvando configurações:", configuracoes);
  };

  const alterarSenha = () => {
    if (novaSenha !== confirmarSenha) {
      alert("As senhas não coincidem");
      return;
    }
    // Implementar alteração de senha
    console.log("Alterando senha...");
  };

  const obterBadgePlano = (plano: string) => {
    switch (plano) {
      case "Pro":
        return <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white"><Crown className="h-3 w-3 mr-1" /> Pro</Badge>;
      case "Premium":
        return <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white"><Star className="h-3 w-3 mr-1" /> Premium</Badge>;
      default:
        return <Badge variant="secondary">Básico</Badge>;
    }
  };

  const obterBadgeStatus = (status: string) => {
    switch (status) {
      case "ativo":
        return <Badge className="bg-success hover:bg-success/90">Ativo</Badge>;
      case "suspenso":
        return <Badge variant="destructive">Suspenso</Badge>;
      default:
        return <Badge variant="secondary">Desconhecido</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold">Configurações</h1>
          <p className="text-muted-foreground">
            Gerencie as configurações da sua conta e sistema
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar Dados
          </Button>
          <Button className="bg-gradient-primary">
            <Save className="h-4 w-4 mr-2" />
            Salvar Tudo
          </Button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Plano Atual</p>
                <div className="flex items-center space-x-2 mt-1">
                  {obterBadgePlano(dadosConta.plano)}
                </div>
              </div>
              <div className="p-2 rounded-lg bg-primary/10">
                <Crown className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status da Conta</p>
                <div className="flex items-center space-x-2 mt-1">
                  {obterBadgeStatus(dadosConta.status)}
                </div>
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
                <p className="text-sm font-medium text-muted-foreground">Membro Desde</p>
                <p className="text-lg font-bold">{new Date(dadosConta.dataCriacao).toLocaleDateString("pt-BR")}</p>
              </div>
              <div className="p-2 rounded-lg bg-accent/10">
                <Calendar className="h-5 w-5 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tema Atual</p>
                <p className="text-lg font-bold capitalize">{configuracoes.tema}</p>
              </div>
              <div className="p-2 rounded-lg bg-warning/10">
                <Palette className="h-5 w-5 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Abas de Configurações */}
      <Tabs defaultValue="conta" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="conta">Conta</TabsTrigger>
          <TabsTrigger value="pagamentos">Pagamentos</TabsTrigger>
          <TabsTrigger value="tema">Tema</TabsTrigger>
          <TabsTrigger value="notificacoes">Notificações</TabsTrigger>
          <TabsTrigger value="seguranca">Segurança</TabsTrigger>
        </TabsList>

        {/* Dados da Conta */}
        <TabsContent value="conta" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="bg-gradient-card shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Informações Pessoais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome Completo</Label>
                  <Input
                    id="nome"
                    value={dadosConta.nome}
                    onChange={(e) => atualizarDadosConta("nome", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={dadosConta.email}
                    onChange={(e) => atualizarDadosConta("email", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={dadosConta.telefone}
                    onChange={(e) => atualizarDadosConta("telefone", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endereco">Endereço</Label>
                  <Textarea
                    id="endereco"
                    value={dadosConta.endereco}
                    onChange={(e) => atualizarDadosConta("endereco", e.target.value)}
                    rows={3}
                  />
                </div>
                <Button onClick={salvarDadosConta} className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Informações
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building className="h-5 w-5 mr-2" />
                  Dados da Empresa
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="empresa">Razão Social</Label>
                  <Input
                    id="empresa"
                    value={dadosConta.empresa}
                    onChange={(e) => atualizarDadosConta("empresa", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    value={dadosConta.cnpj}
                    onChange={(e) => atualizarDadosConta("cnpj", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Logo da Empresa</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">
                      Clique para fazer upload da logo
                    </p>
                    <Button variant="outline" size="sm">
                      Selecionar Arquivo
                    </Button>
                  </div>
                </div>
                <Button onClick={salvarDadosConta} className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Empresa
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Alteração de Senha */}
          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lock className="h-5 w-5 mr-2" />
                Alterar Senha
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="senhaAtual">Senha Atual</Label>
                  <div className="relative">
                    <Input
                      id="senhaAtual"
                      type={mostrarSenhas ? "text" : "password"}
                      value={senhaAtual}
                      onChange={(e) => setSenhaAtual(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setMostrarSenhas(!mostrarSenhas)}
                    >
                      {mostrarSenhas ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="novaSenha">Nova Senha</Label>
                  <Input
                    id="novaSenha"
                    type={mostrarSenhas ? "text" : "password"}
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmarSenha">Confirmar Senha</Label>
                  <Input
                    id="confirmarSenha"
                    type={mostrarSenhas ? "text" : "password"}
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                  />
                </div>
              </div>
              <Button onClick={alterarSenha} className="w-full md:w-auto">
                <Key className="h-4 w-4 mr-2" />
                Alterar Senha
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pagamentos e Assinatura */}
        <TabsContent value="pagamentos" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="bg-gradient-card shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Plano Atual
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-6 bg-muted/30 rounded-lg">
                  <div className="flex items-center justify-center mb-4">
                    {obterBadgePlano(dadosConta.plano)}
                  </div>
                  <h3 className="text-2xl font-bold mb-2">R$ 97,00/mês</h3>
                  <p className="text-muted-foreground mb-4">
                    Plano Pro com todas as funcionalidades
                  </p>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center justify-between">
                      <span>Vendas ilimitadas</span>
                      <CheckCircle className="h-4 w-4 text-success" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Estoque completo</span>
                      <CheckCircle className="h-4 w-4 text-success" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span>NF-e integrada</span>
                      <CheckCircle className="h-4 w-4 text-success" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Suporte prioritário</span>
                      <CheckCircle className="h-4 w-4 text-success" />
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button className="flex-1">Atualizar Plano</Button>
                  <Button variant="outline">Cancelar</Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Método de Pagamento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
                        <CreditCard className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="font-medium">**** **** **** 1234</p>
                        <p className="text-sm text-muted-foreground">Visa • Expira 12/25</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">Alterar</Button>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>Próxima cobrança: 18/02/2024</p>
                  <p>Valor: R$ 97,00</p>
                </div>
                <Button className="w-full">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Adicionar Método de Pagamento
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Histórico de Pagamentos */}
          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle>Histórico de Pagamentos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { data: "2024-01-18", valor: "R$ 97,00", status: "Pago", metodo: "Visa ****1234" },
                  { data: "2023-12-18", valor: "R$ 97,00", status: "Pago", metodo: "Visa ****1234" },
                  { data: "2023-11-18", valor: "R$ 97,00", status: "Pago", metodo: "Visa ****1234" }
                ].map((pagamento, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{pagamento.data}</p>
                      <p className="text-sm text-muted-foreground">{pagamento.metodo}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{pagamento.valor}</p>
                      <Badge className="bg-success hover:bg-success/90">{pagamento.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tema e Personalização */}
        <TabsContent value="tema" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="bg-gradient-card shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Palette className="h-5 w-5 mr-2" />
                  Tema do Sistema
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Tema</Label>
                  <Select value={configuracoes.tema} onValueChange={(value) => setConfiguracoes(prev => ({ ...prev, tema: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="claro">
                        <div className="flex items-center space-x-2">
                          <Sun className="h-4 w-4" />
                          <span>Claro</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="escuro">
                        <div className="flex items-center space-x-2">
                          <Moon className="h-4 w-4" />
                          <span>Escuro</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="sistema">
                        <div className="flex items-center space-x-2">
                          <Monitor className="h-4 w-4" />
                          <span>Sistema</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Cor Primária</Label>
                  <div className="flex space-x-2">
                    {["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"].map((cor) => (
                      <button
                        key={cor}
                        className="w-8 h-8 rounded-full border-2 border-border hover:border-primary"
                        style={{ backgroundColor: cor }}
                      />
                    ))}
                  </div>
                </div>
                <Button onClick={salvarConfiguracoes} className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Tema
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="h-5 w-5 mr-2" />
                  Localização
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Idioma</Label>
                  <Select value={configuracoes.idioma} onValueChange={(value) => setConfiguracoes(prev => ({ ...prev, idioma: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                      <SelectItem value="en-US">English (US)</SelectItem>
                      <SelectItem value="es-ES">Español</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Fuso Horário</Label>
                  <Select value={configuracoes.fusoHorario} onValueChange={(value) => setConfiguracoes(prev => ({ ...prev, fusoHorario: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/Sao_Paulo">São Paulo (GMT-3)</SelectItem>
                      <SelectItem value="America/New_York">New York (GMT-5)</SelectItem>
                      <SelectItem value="Europe/London">London (GMT+0)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Moeda</Label>
                  <Select value={configuracoes.moeda} onValueChange={(value) => setConfiguracoes(prev => ({ ...prev, moeda: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BRL">Real (R$)</SelectItem>
                      <SelectItem value="USD">Dólar ($)</SelectItem>
                      <SelectItem value="EUR">Euro (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={salvarConfiguracoes} className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Localização
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Notificações */}
        <TabsContent value="notificacoes" className="space-y-4">
          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                Configurações de Notificações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold">Canais de Notificação</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Email</Label>
                      <p className="text-sm text-muted-foreground">Receber notificações por email</p>
                    </div>
                    <Switch
                      checked={configuracoes.notificacoes.email}
                      onCheckedChange={(checked) => atualizarConfiguracao("notificacoes", "email", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Push</Label>
                      <p className="text-sm text-muted-foreground">Notificações no navegador</p>
                    </div>
                    <Switch
                      checked={configuracoes.notificacoes.push}
                      onCheckedChange={(checked) => atualizarConfiguracao("notificacoes", "push", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>SMS</Label>
                      <p className="text-sm text-muted-foreground">Notificações por SMS</p>
                    </div>
                    <Switch
                      checked={configuracoes.notificacoes.sms}
                      onCheckedChange={(checked) => atualizarConfiguracao("notificacoes", "sms", checked)}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Tipos de Notificação</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Vendas</Label>
                      <p className="text-sm text-muted-foreground">Novas vendas e pedidos</p>
                    </div>
                    <Switch
                      checked={configuracoes.notificacoes.vendas}
                      onCheckedChange={(checked) => atualizarConfiguracao("notificacoes", "vendas", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Estoque</Label>
                      <p className="text-sm text-muted-foreground">Produtos com estoque baixo</p>
                    </div>
                    <Switch
                      checked={configuracoes.notificacoes.estoque}
                      onCheckedChange={(checked) => atualizarConfiguracao("notificacoes", "estoque", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Financeiro</Label>
                      <p className="text-sm text-muted-foreground">Pagamentos e recebimentos</p>
                    </div>
                    <Switch
                      checked={configuracoes.notificacoes.financeiro}
                      onCheckedChange={(checked) => atualizarConfiguracao("notificacoes", "financeiro", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Clientes</Label>
                      <p className="text-sm text-muted-foreground">Novos clientes e atualizações</p>
                    </div>
                    <Switch
                      checked={configuracoes.notificacoes.clientes}
                      onCheckedChange={(checked) => atualizarConfiguracao("notificacoes", "clientes", checked)}
                    />
                  </div>
                </div>
              </div>

              <Button onClick={salvarConfiguracoes} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                Salvar Notificações
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Segurança */}
        <TabsContent value="seguranca" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="bg-gradient-card shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Autenticação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Autenticação 2FA</Label>
                    <p className="text-sm text-muted-foreground">Adicionar camada extra de segurança</p>
                  </div>
                  <Switch
                    checked={configuracoes.seguranca.autenticacao2FA}
                    onCheckedChange={(checked) => atualizarConfiguracao("seguranca", "autenticacao2FA", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Sessão Longa</Label>
                    <p className="text-sm text-muted-foreground">Manter login por mais tempo</p>
                  </div>
                  <Switch
                    checked={configuracoes.seguranca.sessaoLonga}
                    onCheckedChange={(checked) => atualizarConfiguracao("seguranca", "sessaoLonga", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Log de Atividade</Label>
                    <p className="text-sm text-muted-foreground">Registrar ações na conta</p>
                  </div>
                  <Switch
                    checked={configuracoes.seguranca.logAtividade}
                    onCheckedChange={(checked) => atualizarConfiguracao("seguranca", "logAtividade", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Backup Automático</Label>
                    <p className="text-sm text-muted-foreground">Backup diário dos dados</p>
                  </div>
                  <Switch
                    checked={configuracoes.seguranca.backupAutomatico}
                    onCheckedChange={(checked) => atualizarConfiguracao("seguranca", "backupAutomatico", checked)}
                  />
                </div>
                <Button onClick={salvarConfiguracoes} className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Segurança
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  Atividade Recente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { acao: "Login realizado", data: "18/01/2024 14:30", ip: "192.168.1.1", status: "Sucesso" },
                    { acao: "Senha alterada", data: "15/01/2024 10:15", ip: "192.168.1.1", status: "Sucesso" },
                    { acao: "Tentativa de login", data: "12/01/2024 22:45", ip: "192.168.1.100", status: "Falha" },
                    { acao: "Configurações alteradas", data: "10/01/2024 16:20", ip: "192.168.1.1", status: "Sucesso" }
                  ].map((atividade, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{atividade.acao}</p>
                        <p className="text-xs text-muted-foreground">{atividade.data} • {atividade.ip}</p>
                      </div>
                      <Badge variant={atividade.status === "Sucesso" ? "default" : "destructive"}>
                        {atividade.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

      </Tabs>
    </div>
  );
}
