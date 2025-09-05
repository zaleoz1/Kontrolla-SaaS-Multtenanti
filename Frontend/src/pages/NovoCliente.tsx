import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useApi } from "@/hooks/useApi";
import { API_ENDPOINTS } from "@/config/api";
import { useToast } from "@/hooks/use-toast";
import { 
  Save, 
  X, 
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  CreditCard,
  Star,
  AlertCircle,
  CheckCircle,
  UserPlus,
  Loader2
} from "lucide-react";

interface Cliente {
  nome: string;
  email?: string;
  telefone?: string;
  cpf_cnpj?: string;
  tipo_pessoa: "fisica" | "juridica";
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  data_nascimento?: string;
  sexo?: "masculino" | "feminino" | "outro";
  razao_social?: string;
  inscricao_estadual?: string;
  inscricao_municipal?: string;
  nome_fantasia?: string;
  observacoes?: string;
  status: "ativo" | "inativo";
  vip: boolean;
  limite_credito: number;
}

export default function NovoCliente() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const api = useApi();
  const [abaAtiva, setAbaAtiva] = useState("basico");
  const [cliente, setCliente] = useState<Cliente>({
    nome: "",
    email: "",
    telefone: "",
    cpf_cnpj: "",
    tipo_pessoa: "fisica",
    endereco: "",
    cidade: "",
    estado: "",
    cep: "",
    observacoes: "",
    status: "ativo",
    vip: false,
    limite_credito: 0
  });

  const estados = [
    "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", 
    "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", 
    "RS", "RO", "RR", "SC", "SP", "SE", "TO"
  ];

  const atualizarCliente = (campo: keyof Cliente, valor: any) => {
    setCliente(prev => ({ ...prev, [campo]: valor }));
  };

  const atualizarEndereco = (campo: keyof Cliente, valor: string) => {
    setCliente(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  const buscarCep = async (cep: string) => {
    if (cep.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();
        
        if (!data.erro) {
          setCliente(prev => ({
            ...prev,
            endereco: `${data.logradouro}, ${data.bairro}`,
            cidade: data.localidade,
            estado: data.uf,
            cep: data.cep
          }));
          
          toast({
            title: "CEP encontrado",
            description: "Endereço preenchido automaticamente",
          });
        } else {
          toast({
            title: "CEP não encontrado",
            description: "Verifique o CEP digitado",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Erro ao buscar CEP:", error);
        toast({
          title: "Erro ao buscar CEP",
          description: "Tente novamente mais tarde",
          variant: "destructive",
        });
      }
    }
  };

  const salvarCliente = async () => {
    try {
      // Preparar dados para envio
      const dadosCliente = {
        nome: cliente.nome,
        email: cliente.email || null,
        telefone: cliente.telefone || null,
        cpf_cnpj: cliente.cpf_cnpj || null,
        tipo_pessoa: cliente.tipo_pessoa,
        endereco: cliente.endereco || null,
        cidade: cliente.cidade || null,
        estado: cliente.estado || null,
        cep: cliente.cep || null,
        data_nascimento: cliente.data_nascimento || null,
        sexo: cliente.sexo || null,
        razao_social: cliente.razao_social || null,
        inscricao_estadual: cliente.inscricao_estadual || null,
        inscricao_municipal: cliente.inscricao_municipal || null,
        nome_fantasia: cliente.nome_fantasia || null,
        observacoes: cliente.observacoes || null,
        status: cliente.status,
        vip: cliente.vip,
        limite_credito: cliente.limite_credito
      };

      await api.makeRequest(API_ENDPOINTS.CLIENTS.CREATE, {
        method: 'POST',
        body: dadosCliente
      });

      toast({
        title: "Cliente salvo",
        description: "Cliente cadastrado com sucesso!",
      });

      navigate("/dashboard/clientes");
    } catch (error: any) {
      console.error("Erro ao salvar cliente:", error);
      toast({
        title: "Erro ao salvar cliente",
        description: error.message || "Tente novamente mais tarde",
        variant: "destructive",
      });
    }
  };

  const formularioValido = cliente.nome && cliente.cpf_cnpj && cliente.telefone;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold">Novo Cliente</h1>
          <p className="text-muted-foreground">
            Cadastre um novo cliente no sistema
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => navigate("/dashboard/clientes")}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button 
            className="bg-gradient-primary" 
            onClick={salvarCliente}
            disabled={!formularioValido || api.loading}
          >
            {api.loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {api.loading ? "Salvando..." : "Salvar Cliente"}
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
                <User className="h-4 w-4" />
                <span>Básico</span>
              </TabsTrigger>
              <TabsTrigger value="endereco" className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>Endereço</span>
              </TabsTrigger>
              <TabsTrigger value="avancado" className="flex items-center space-x-2">
                <Building className="h-4 w-4" />
                <span>Avançado</span>
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
                    <label className="text-sm font-medium">Tipo de Pessoa</label>
                    <div className="flex space-x-4 mt-1">
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="tipo_pessoa"
                          value="fisica"
                          checked={cliente.tipo_pessoa === "fisica"}
                          onChange={(e) => atualizarCliente("tipo_pessoa", e.target.value)}
                          className="rounded"
                        />
                        <span className="text-sm">Pessoa Física</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="tipo_pessoa"
                          value="juridica"
                          checked={cliente.tipo_pessoa === "juridica"}
                          onChange={(e) => atualizarCliente("tipo_pessoa", e.target.value)}
                          className="rounded"
                        />
                        <span className="text-sm">Pessoa Jurídica</span>
                      </label>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium">
                        {cliente.tipo_pessoa === "fisica" ? "Nome Completo *" : "Razão Social *"}
                      </label>
                      <Input
                        placeholder={cliente.tipo_pessoa === "fisica" ? "Nome completo" : "Razão social"}
                        value={cliente.nome}
                        onChange={(e) => atualizarCliente("nome", e.target.value)}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">
                        {cliente.tipo_pessoa === "fisica" ? "CPF *" : "CNPJ *"}
                      </label>
                      <Input
                        placeholder={cliente.tipo_pessoa === "fisica" ? "000.000.000-00" : "00.000.000/0000-00"}
                        value={cliente.cpf_cnpj}
                        onChange={(e) => atualizarCliente("cpf_cnpj", e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  {cliente.tipo_pessoa === "juridica" && (
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="text-sm font-medium">Nome Fantasia</label>
                        <Input
                          placeholder="Nome fantasia"
                          value={cliente.nome_fantasia || ""}
                          onChange={(e) => atualizarCliente("nome_fantasia", e.target.value)}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium">Inscrição Estadual</label>
                        <Input
                          placeholder="Inscrição estadual"
                          value={cliente.inscricao_estadual || ""}
                          onChange={(e) => atualizarCliente("inscricao_estadual", e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  )}

                  {cliente.tipo_pessoa === "fisica" && (
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="text-sm font-medium">Data de Nascimento</label>
                        <Input
                          type="date"
                          value={cliente.data_nascimento || ""}
                          onChange={(e) => atualizarCliente("data_nascimento", e.target.value)}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium">Sexo</label>
                        <select
                          value={cliente.sexo || ""}
                          onChange={(e) => atualizarCliente("sexo", e.target.value)}
                          className="w-full mt-1 p-2 border rounded-md bg-background"
                        >
                          <option value="">Selecione</option>
                          <option value="masculino">Masculino</option>
                          <option value="feminino">Feminino</option>
                          <option value="outro">Outro</option>
                        </select>
                      </div>
                    </div>
                  )}

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium">Email *</label>
                      <Input
                        type="email"
                        placeholder="cliente@email.com"
                        value={cliente.email}
                        onChange={(e) => atualizarCliente("email", e.target.value)}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">Telefone *</label>
                      <Input
                        placeholder="(00) 00000-0000"
                        value={cliente.telefone}
                        onChange={(e) => atualizarCliente("telefone", e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Observações</label>
                    <textarea
                      placeholder="Observações sobre o cliente..."
                      value={cliente.observacoes}
                      onChange={(e) => atualizarCliente("observacoes", e.target.value)}
                      className="w-full mt-1 p-2 border rounded-md bg-background min-h-[80px] resize-none"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Aba Endereço */}
            <TabsContent value="endereco" className="space-y-4">
              <Card className="bg-gradient-card shadow-card">
                <CardHeader>
                  <CardTitle>Endereço</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium">CEP</label>
                      <Input
                        placeholder="00000-000"
                        value={cliente.cep}
                        onChange={(e) => {
                          atualizarEndereco("cep", e.target.value);
                          if (e.target.value.length === 8) {
                            buscarCep(e.target.value);
                          }
                        }}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">Endereço</label>
                      <Input
                        placeholder="Rua, Avenida, número, bairro"
                        value={cliente.endereco}
                        onChange={(e) => atualizarEndereco("endereco", e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium">Cidade</label>
                      <Input
                        placeholder="Nome da cidade"
                        value={cliente.cidade}
                        onChange={(e) => atualizarEndereco("cidade", e.target.value)}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">Estado</label>
                      <select
                        value={cliente.estado}
                        onChange={(e) => atualizarEndereco("estado", e.target.value)}
                        className="w-full mt-1 p-2 border rounded-md bg-background"
                      >
                        <option value="">Selecione o estado</option>
                        {estados.map(estado => (
                          <option key={estado} value={estado}>
                            {estado}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Aba Avançado */}
            <TabsContent value="avancado" className="space-y-4">
              <Card className="bg-gradient-card shadow-card">
                <CardHeader>
                  <CardTitle>Configurações Avançadas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium">Status</label>
                      <select
                        value={cliente.status}
                        onChange={(e) => atualizarCliente("status", e.target.value)}
                        className="w-full mt-1 p-2 border rounded-md bg-background"
                      >
                        <option value="ativo">Ativo</option>
                        <option value="inativo">Inativo</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Limite de Crédito</label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0,00"
                        value={cliente.limite_credito}
                        onChange={(e) => atualizarCliente("limite_credito", parseFloat(e.target.value) || 0)}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="vip"
                      checked={cliente.vip}
                      onChange={(e) => atualizarCliente("vip", e.target.checked)}
                      className="rounded"
                    />
                    <label htmlFor="vip" className="text-sm font-medium flex items-center space-x-1">
                      <Star className="h-4 w-4 text-warning" />
                      <span>Cliente VIP</span>
                    </label>
                  </div>

                  {cliente.vip && (
                    <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
                      <div className="flex items-center space-x-2">
                        <Star className="h-4 w-4 text-warning" />
                        <span className="text-sm text-warning-foreground">
                          Cliente VIP terá benefícios especiais como desconto e atendimento prioritário
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Coluna Direita - Preview */}
        <div className="space-y-4">
          {/* Preview do Cliente */}
          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle>Preview do Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cliente.nome ? (
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="h-12 w-12 rounded-full bg-gradient-primary flex items-center justify-center">
                      <span className="text-lg font-bold text-white">
                        {cliente.nome.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold flex items-center space-x-2">
                        <span>{cliente.nome}</span>
                        {cliente.vip && <Star className="h-4 w-4 text-warning fill-warning" />}
                      </h3>
                      <Badge variant={cliente.status === "ativo" ? "default" : "secondary"} 
                             className={cliente.status === "ativo" ? "bg-success" : ""}>
                        {cliente.status === "ativo" ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    {cliente.email && (
                      <div className="flex items-center space-x-2 text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        <span className="truncate">{cliente.email}</span>
                      </div>
                    )}
                    {cliente.telefone && (
                      <div className="flex items-center space-x-2 text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <span>{cliente.telefone}</span>
                      </div>
                    )}
                    {cliente.cpf_cnpj && (
                      <div className="flex items-center space-x-2 text-muted-foreground">
                        <User className="h-4 w-4" />
                        <span>{cliente.cpf_cnpj}</span>
                      </div>
                    )}
                    {cliente.cidade && cliente.estado && (
                      <div className="flex items-center space-x-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{cliente.cidade}, {cliente.estado}</span>
                      </div>
                    )}
                  </div>

                  {cliente.limite_credito > 0 && (
                    <div className="pt-2 border-t">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Limite de Crédito:</span>
                        <span className="font-medium text-primary">
                          {cliente.limite_credito.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL"
                          })}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  <UserPlus className="h-12 w-12 mx-auto mb-2" />
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
                {cliente.nome ? (
                  <CheckCircle className="h-4 w-4 text-success" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-sm">Nome</span>
              </div>

              <div className="flex items-center space-x-2">
                {cliente.cpf_cnpj ? (
                  <CheckCircle className="h-4 w-4 text-success" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-sm">
                  {cliente.tipo_pessoa === "fisica" ? "CPF" : "CNPJ"}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                {cliente.telefone ? (
                  <CheckCircle className="h-4 w-4 text-success" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-sm">Telefone</span>
              </div>

              <div className="flex items-center space-x-2">
                {cliente.email ? (
                  <CheckCircle className="h-4 w-4 text-success" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-sm">Email</span>
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
              <p>• Clientes VIP recebem benefícios especiais</p>
              <p>• O limite de crédito pode ser ajustado posteriormente</p>
              <p>• Use o CEP para preenchimento automático do endereço</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
