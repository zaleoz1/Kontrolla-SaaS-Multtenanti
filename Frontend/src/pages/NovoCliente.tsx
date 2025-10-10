import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
  const { id } = useParams<{ id?: string }>();
  const { toast } = useToast();
  const api = useApi();
  const [abaAtiva, setAbaAtiva] = useState("basico");
  const [carregandoCliente, setCarregandoCliente] = useState(false);
  
  // Determinar se é modo de edição
  const isEditMode = Boolean(id);
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

  // Carregar dados do cliente se estiver em modo de edição
  useEffect(() => {
    if (isEditMode && id) {
      carregarCliente(parseInt(id));
    }
  }, [isEditMode, id]);

  const carregarCliente = async (clienteId: number) => {
    try {
      setCarregandoCliente(true);
      const response = await api.makeRequest(API_ENDPOINTS.CLIENTS.GET(clienteId));
      const clienteData = response.cliente;
      
      // Aplicar formatação aos dados carregados
      const telefoneFormatado = clienteData.telefone ? formatarTelefone(clienteData.telefone) : "";
      const cpfCnpjFormatado = clienteData.cpf_cnpj ? 
        (clienteData.tipo_pessoa === "fisica" ? formatarCPF(clienteData.cpf_cnpj) : formatarCNPJ(clienteData.cpf_cnpj)) : "";
      const cepFormatado = clienteData.cep ? formatarCEP(clienteData.cep) : "";
      const dataNascimentoFormatada = formatarDataParaInput(clienteData.data_nascimento || "");
      
      setCliente({
        nome: clienteData.nome || "",
        email: clienteData.email || "",
        telefone: telefoneFormatado,
        cpf_cnpj: cpfCnpjFormatado,
        tipo_pessoa: clienteData.tipo_pessoa || "fisica",
        endereco: clienteData.endereco || "",
        cidade: clienteData.cidade || "",
        estado: clienteData.estado || "",
        cep: cepFormatado,
        data_nascimento: dataNascimentoFormatada,
        sexo: clienteData.sexo || "",
        razao_social: clienteData.razao_social || "",
        inscricao_estadual: clienteData.inscricao_estadual || "",
        inscricao_municipal: clienteData.inscricao_municipal || "",
        nome_fantasia: clienteData.nome_fantasia || "",
        observacoes: clienteData.observacoes || "",
        status: clienteData.status || "ativo",
        vip: clienteData.vip || false,
        limite_credito: clienteData.limite_credito || 0
      });
    } catch (error) {
      console.error('Erro ao carregar cliente:', error);
      toast({
        title: "Erro ao carregar cliente",
        description: "Não foi possível carregar os dados do cliente",
        variant: "destructive",
      });
    } finally {
      setCarregandoCliente(false);
    }
  };

  const atualizarCliente = (campo: keyof Cliente, valor: any) => {
    setCliente(prev => ({ ...prev, [campo]: valor }));
  };

  const atualizarEndereco = (campo: keyof Cliente, valor: string) => {
    setCliente(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  // Função para formatar CPF
  const formatarCPF = (valor: string) => {
    const numeros = valor.replace(/\D/g, '');
    // Limitar a 11 dígitos para CPF
    const numerosLimitados = numeros.slice(0, 11);
    return numerosLimitados.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  // Função para formatar CNPJ
  const formatarCNPJ = (valor: string) => {
    const numeros = valor.replace(/\D/g, '');
    // Limitar a 14 dígitos para CNPJ
    const numerosLimitados = numeros.slice(0, 14);
    return numerosLimitados.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  };

  // Função para formatar telefone
  const formatarTelefone = (valor: string) => {
    const numeros = valor.replace(/\D/g, '');
    if (numeros.length <= 10) {
      return numeros.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    } else {
      return numeros.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
  };

  // Função para formatar CEP
  const formatarCEP = (valor: string) => {
    const numeros = valor.replace(/\D/g, '');
    return numeros.replace(/(\d{5})(\d{3})/, '$1-$2');
  };

  // Função para formatar data para input de tipo date (YYYY-MM-DD)
  const formatarDataParaInput = (data: string) => {
    if (!data) return "";
    
    // Se a data já está no formato YYYY-MM-DD, retorna como está
    if (data.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return data;
    }
    
    // Se a data está no formato ISO 8601 (YYYY-MM-DDTHH:mm:ss.sssZ), extrai apenas a data
    if (data.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
      return data.split('T')[0];
    }
    
    // Se a data está no formato DD/MM/YYYY, converte para YYYY-MM-DD
    if (data.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      const [dia, mes, ano] = data.split('/');
      return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
    }
    
    // Se a data está no formato DD-MM-YYYY, converte para YYYY-MM-DD
    if (data.match(/^\d{2}-\d{2}-\d{4}$/)) {
      const [dia, mes, ano] = data.split('-');
      return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
    }
    
    // Se a data está no formato YYYY/MM/DD, converte para YYYY-MM-DD
    if (data.match(/^\d{4}\/\d{2}\/\d{2}$/)) {
      const [ano, mes, dia] = data.split('/');
      return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
    }
    
    return data;
  };

  const buscarCep = async (cep: string) => {
    const cepLimpo = cep.replace(/\D/g, '');
    if (cepLimpo.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
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
      // Preparar dados para envio (removendo formatação)
      const dadosCliente = {
        nome: cliente.nome,
        email: cliente.email || null,
        telefone: cliente.telefone ? cliente.telefone.replace(/\D/g, '') : null,
        cpf_cnpj: cliente.cpf_cnpj ? cliente.cpf_cnpj.replace(/\D/g, '') : null,
        tipo_pessoa: cliente.tipo_pessoa,
        endereco: cliente.endereco || null,
        cidade: cliente.cidade || null,
        estado: cliente.estado || null,
        cep: cliente.cep ? cliente.cep.replace(/\D/g, '') : null,
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

      let response;
      if (isEditMode && id) {
        // Modo de edição - fazer PUT
        response = await api.makeRequest(API_ENDPOINTS.CLIENTS.UPDATE(parseInt(id)), {
          method: 'PUT',
          body: dadosCliente
        });
      } else {
        // Modo de criação - fazer POST
        response = await api.makeRequest(API_ENDPOINTS.CLIENTS.CREATE, {
          method: 'POST',
          body: dadosCliente
        });
      }

      toast({
        title: isEditMode ? "Cliente atualizado" : "Cliente salvo",
        description: isEditMode ? "Cliente atualizado com sucesso!" : "Cliente cadastrado com sucesso!",
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

  const formularioValido = 
    cliente.nome && 
    cliente.cpf_cnpj && 
    cliente.telefone &&
    cliente.cep &&
    cliente.endereco &&
    cliente.cidade &&
    cliente.estado &&
    (cliente.tipo_pessoa === "juridica" || (cliente.data_nascimento && cliente.sexo));

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden prevent-zoom touch-optimized mobile-scroll">
      {/* Header */}
      <div className="w-full">
        {/* Título e Descrição - Sempre no topo */}
        <div className="mb-4 md:mb-0">
          <h1 className="text-2xl sm:text-3xl font-bold">
            {isEditMode ? 'Editar Cliente' : 'Novo Cliente'}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {isEditMode 
              ? 'Edite as informações do cliente' 
              : 'Cadastre um novo cliente no sistema'
            }
          </p>
        </div>

        {/* Botões - Desktop */}
        <div className="hidden md:flex items-center space-x-2 justify-end">
          <Button variant="outline" onClick={() => navigate("/dashboard/clientes")}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button 
            className="bg-gradient-primary" 
            onClick={salvarCliente}
            disabled={!formularioValido || api.loading || carregandoCliente}
          >
            {api.loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {api.loading 
              ? (isEditMode ? 'Atualizando...' : 'Salvando...') 
              : (isEditMode ? 'Atualizar Cliente' : 'Salvar Cliente')
            }
          </Button>
        </div>

        {/* Botões - Mobile */}
        <div className="md:hidden flex gap-2 w-full">
          <Button 
            variant="outline" 
            onClick={() => navigate("/dashboard/clientes")}
            className="flex-1 text-xs sm:text-sm"
          >
            <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Cancelar</span>
            <span className="sm:hidden">Cancelar</span>
          </Button>
          <Button 
            className="flex-1 bg-gradient-primary text-xs sm:text-sm" 
            onClick={salvarCliente}
            disabled={!formularioValido || api.loading || carregandoCliente}
          >
            {api.loading ? (
              <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 animate-spin" />
            ) : (
              <Save className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            )}
            <span className="hidden sm:inline">
              {api.loading 
                ? (isEditMode ? 'Atualizando...' : 'Salvando...') 
                : (isEditMode ? 'Atualizar Cliente' : 'Salvar Cliente')
              }
            </span>
            <span className="sm:hidden">
              {api.loading 
                ? (isEditMode ? 'Atualizando...' : 'Salvando...') 
                : (isEditMode ? 'Atualizar' : 'Salvar')
              }
            </span>
          </Button>
        </div>
      </div>

      {/* Conteúdo Principal */}
      {carregandoCliente ? (
        <div className="flex items-center justify-center p-6 sm:p-12">
          <div className="text-center">
            <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin mx-auto mb-3 sm:mb-4" />
            <p className="text-sm sm:text-base text-muted-foreground">Carregando dados do cliente...</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Coluna Esquerda - Formulário */}
        <div className="lg:col-span-2 order-2 lg:order-1">
          <Tabs value={abaAtiva} onValueChange={setAbaAtiva} className="space-y-4">
            <TabsList className="grid w-full grid-cols-3 h-auto">
              <TabsTrigger value="basico" className="flex items-center space-x-1 sm:space-x-2 py-2 px-2 sm:px-3 text-xs sm:text-sm">
                <User className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Básico</span>
                <span className="sm:hidden">Básico</span>
              </TabsTrigger>
              <TabsTrigger value="endereco" className="flex items-center space-x-1 sm:space-x-2 py-2 px-2 sm:px-3 text-xs sm:text-sm">
                <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Endereço</span>
                <span className="sm:hidden">Endereço</span>
              </TabsTrigger>
              <TabsTrigger value="avancado" className="flex items-center space-x-1 sm:space-x-2 py-2 px-2 sm:px-3 text-xs sm:text-sm">
                <Building className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Avançado</span>
                <span className="sm:hidden">Avançado</span>
              </TabsTrigger>
            </TabsList>

            {/* Aba Básico */}
            <TabsContent value="basico" className="space-y-4">
              <Card className="bg-gradient-card shadow-card">
                <CardHeader>
                  <CardTitle className="text-sm sm:text-base">Informações Básicas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-xs sm:text-sm font-medium">Tipo de Pessoa</label>
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 mt-1">
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="tipo_pessoa"
                          value="fisica"
                          checked={cliente.tipo_pessoa === "fisica"}
                          onChange={(e) => atualizarCliente("tipo_pessoa", e.target.value)}
                          className="rounded"
                        />
                        <span className="text-xs sm:text-sm">Pessoa Física</span>
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
                        <span className="text-xs sm:text-sm">Pessoa Jurídica</span>
                      </label>
                    </div>
                  </div>

                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                    <div>
                      <label className="text-xs sm:text-sm font-medium">
                        {cliente.tipo_pessoa === "fisica" ? "Nome Completo *" : "Razão Social *"}
                      </label>
                      <Input
                        placeholder={cliente.tipo_pessoa === "fisica" ? "Nome completo" : "Razão social"}
                        value={cliente.nome}
                        onChange={(e) => atualizarCliente("nome", e.target.value)}
                        className="mt-1 text-xs sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="text-xs sm:text-sm font-medium">
                        {cliente.tipo_pessoa === "fisica" ? "CPF *" : "CNPJ *"}
                      </label>
                      <Input
                        placeholder={cliente.tipo_pessoa === "fisica" ? "000.000.000-00" : "00.000.000/0000-00"}
                        value={cliente.cpf_cnpj}
                        onChange={(e) => {
                          const valorFormatado = cliente.tipo_pessoa === "fisica" 
                            ? formatarCPF(e.target.value)
                            : formatarCNPJ(e.target.value);
                          atualizarCliente("cpf_cnpj", valorFormatado);
                        }}
                        maxLength={cliente.tipo_pessoa === "fisica" ? 14 : 18}
                        className="mt-1 text-xs sm:text-sm"
                      />
                    </div>
                  </div>

                  {cliente.tipo_pessoa === "juridica" && (
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                      <div>
                        <label className="text-xs sm:text-sm font-medium">Nome Fantasia</label>
                        <Input
                          placeholder="Nome fantasia"
                          value={cliente.nome_fantasia || ""}
                          onChange={(e) => atualizarCliente("nome_fantasia", e.target.value)}
                          className="mt-1 text-xs sm:text-sm"
                        />
                      </div>

                      <div>
                        <label className="text-xs sm:text-sm font-medium">Inscrição Estadual</label>
                        <Input
                          placeholder="Inscrição estadual"
                          value={cliente.inscricao_estadual || ""}
                          onChange={(e) => atualizarCliente("inscricao_estadual", e.target.value)}
                          className="mt-1 text-xs sm:text-sm"
                        />
                      </div>
                    </div>
                  )}

                  {cliente.tipo_pessoa === "fisica" && (
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                      <div>
                        <label className="text-xs sm:text-sm font-medium">Data de Nascimento *</label>
                        <Input
                          type="date"
                          value={cliente.data_nascimento || ""}
                          onChange={(e) => atualizarCliente("data_nascimento", e.target.value)}
                          className="mt-1 text-xs sm:text-sm"
                        />
                      </div>

                      <div>
                        <label className="text-xs sm:text-sm font-medium">Sexo *</label>
                        <select
                          value={cliente.sexo || ""}
                          onChange={(e) => atualizarCliente("sexo", e.target.value)}
                          className="w-full mt-1 p-2 border rounded-md bg-background text-xs sm:text-sm"
                        >
                          <option value="">Selecione</option>
                          <option value="masculino">Masculino</option>
                          <option value="feminino">Feminino</option>
                          <option value="outro">Outro</option>
                        </select>
                      </div>
                    </div>
                  )}

                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                    <div>
                      <label className="text-xs sm:text-sm font-medium">Email</label>
                      <Input
                        type="email"
                        placeholder="cliente@email.com"
                        value={cliente.email}
                        onChange={(e) => atualizarCliente("email", e.target.value)}
                        className="mt-1 text-xs sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="text-xs sm:text-sm font-medium">Telefone *</label>
                      <Input
                        placeholder="(00) 00000-0000"
                        value={cliente.telefone}
                        onChange={(e) => {
                          const valorFormatado = formatarTelefone(e.target.value);
                          atualizarCliente("telefone", valorFormatado);
                        }}
                        maxLength={15}
                        className="mt-1 text-xs sm:text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs sm:text-sm font-medium">Observações</label>
                    <textarea
                      placeholder="Observações sobre o cliente..."
                      value={cliente.observacoes}
                      onChange={(e) => atualizarCliente("observacoes", e.target.value)}
                      className="w-full mt-1 p-2 border rounded-md bg-background min-h-[60px] sm:min-h-[80px] resize-none text-xs sm:text-sm"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Aba Endereço */}
            <TabsContent value="endereco" className="space-y-4">
              <Card className="bg-gradient-card shadow-card">
                <CardHeader>
                  <CardTitle className="text-sm sm:text-base">Endereço</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                    <div>
                      <label className="text-xs sm:text-sm font-medium">CEP *</label>
                      <Input
                        placeholder="00000-000"
                        value={cliente.cep}
                        onChange={(e) => {
                          const valorFormatado = formatarCEP(e.target.value);
                          atualizarEndereco("cep", valorFormatado);
                          const cepLimpo = e.target.value.replace(/\D/g, '');
                          if (cepLimpo.length === 8) {
                            buscarCep(cepLimpo);
                          }
                        }}
                        maxLength={9}
                        className="mt-1 text-xs sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="text-xs sm:text-sm font-medium">Endereço *</label>
                      <Input
                        placeholder="Rua, Avenida, número, bairro"
                        value={cliente.endereco}
                        onChange={(e) => atualizarEndereco("endereco", e.target.value)}
                        className="mt-1 text-xs sm:text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                    <div>
                      <label className="text-xs sm:text-sm font-medium">Cidade *</label>
                      <Input
                        placeholder="Nome da cidade"
                        value={cliente.cidade}
                        onChange={(e) => atualizarEndereco("cidade", e.target.value)}
                        className="mt-1 text-xs sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="text-xs sm:text-sm font-medium">Estado *</label>
                      <select
                        value={cliente.estado}
                        onChange={(e) => atualizarEndereco("estado", e.target.value)}
                        className="w-full mt-1 p-2 border rounded-md bg-background text-xs sm:text-sm"
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
                  <CardTitle className="text-sm sm:text-base">Configurações Avançadas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-xs sm:text-sm font-medium">Status</label>
                    <select
                      value={cliente.status}
                      onChange={(e) => atualizarCliente("status", e.target.value)}
                      className="w-full mt-1 p-2 border rounded-md bg-background text-xs sm:text-sm"
                    >
                      <option value="ativo">Ativo</option>
                      <option value="inativo">Inativo</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="vip"
                      checked={cliente.vip}
                      onChange={(e) => atualizarCliente("vip", e.target.checked)}
                      className="rounded"
                    />
                    <label htmlFor="vip" className="text-xs sm:text-sm font-medium flex items-center space-x-1">
                      <Star className="h-3 w-3 sm:h-4 sm:w-4 text-warning" />
                      <span>Cliente VIP</span>
                    </label>
                  </div>

                  {cliente.vip && (
                    <div className="p-2 sm:p-3 rounded-lg bg-warning/10 border border-warning/20">
                      <div className="flex items-center space-x-2">
                        <Star className="h-3 w-3 sm:h-4 sm:w-4 text-warning flex-shrink-0" />
                        <span className="text-xs sm:text-sm text-warning-foreground">
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
        <div className="space-y-4 order-1 lg:order-2">
          {/* Preview do Cliente */}
          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle className="text-sm sm:text-base">Preview do Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              {cliente.nome ? (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="h-8 w-8 sm:h-12 sm:w-12 rounded-full bg-gradient-primary flex items-center justify-center">
                      <span className="text-sm sm:text-lg font-bold text-white">
                        {cliente.nome.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-sm sm:text-base flex items-center space-x-1 sm:space-x-2">
                        <span className="truncate">{cliente.nome}</span>
                        {cliente.vip && <Star className="h-3 w-3 sm:h-4 sm:w-4 text-warning fill-warning flex-shrink-0" />}
                      </h3>
                      <Badge variant={cliente.status === "ativo" ? "default" : "secondary"} 
                             className={`${cliente.status === "ativo" ? "bg-success" : ""} text-xs`}>
                        {cliente.status === "ativo" ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                    {cliente.email && (
                      <div className="flex items-center space-x-2 text-muted-foreground">
                        <Mail className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                        <span className="truncate">{cliente.email}</span>
                      </div>
                    )}
                    {cliente.telefone && (
                      <div className="flex items-center space-x-2 text-muted-foreground">
                        <Phone className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                        <span className="truncate">{cliente.telefone}</span>
                      </div>
                    )}
                    {cliente.cpf_cnpj && (
                      <div className="flex items-center space-x-2 text-muted-foreground">
                        <User className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                        <span className="truncate">{cliente.cpf_cnpj}</span>
                      </div>
                    )}
                    {cliente.cidade && cliente.estado && (
                      <div className="flex items-center space-x-2 text-muted-foreground">
                        <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                        <span className="truncate">{cliente.cidade}, {cliente.estado}</span>
                      </div>
                    )}
                  </div>

                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  <UserPlus className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2" />
                  <p className="text-xs sm:text-sm">Preencha as informações básicas para ver o preview</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Validação do Formulário */}
          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle className="text-sm sm:text-base">Status do Formulário</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 sm:space-y-2">
              <div className="flex items-center space-x-2">
                {cliente.nome ? (
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-success flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                )}
                <span className="text-xs sm:text-sm">Nome Completo *</span>
              </div>

              <div className="flex items-center space-x-2">
                {cliente.cpf_cnpj ? (
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-success flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                )}
                <span className="text-xs sm:text-sm">
                  {cliente.tipo_pessoa === "fisica" ? "CPF *" : "CNPJ *"}
                </span>
              </div>

              {cliente.tipo_pessoa === "fisica" && (
                <>
                  <div className="flex items-center space-x-2">
                    {cliente.data_nascimento ? (
                      <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-success flex-shrink-0" />
                    ) : (
                      <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                    )}
                    <span className="text-xs sm:text-sm">Data de Nascimento *</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {cliente.sexo ? (
                      <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-success flex-shrink-0" />
                    ) : (
                      <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                    )}
                    <span className="text-xs sm:text-sm">Sexo *</span>
                  </div>
                </>
              )}

              <div className="flex items-center space-x-2">
                {cliente.telefone ? (
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-success flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                )}
                <span className="text-xs sm:text-sm">Telefone *</span>
              </div>

              <div className="flex items-center space-x-2">
                {cliente.cep ? (
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-success flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                )}
                <span className="text-xs sm:text-sm">CEP *</span>
              </div>

              <div className="flex items-center space-x-2">
                {cliente.endereco ? (
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-success flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                )}
                <span className="text-xs sm:text-sm">Endereço *</span>
              </div>

              <div className="flex items-center space-x-2">
                {cliente.cidade ? (
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-success flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                )}
                <span className="text-xs sm:text-sm">Cidade *</span>
              </div>

              <div className="flex items-center space-x-2">
                {cliente.estado ? (
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-success flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                )}
                <span className="text-xs sm:text-sm">Estado *</span>
              </div>

              <div className="flex items-center space-x-2">
                {cliente.email ? (
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-success flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                )}
                <span className="text-xs sm:text-sm">Email</span>
              </div>

              {formularioValido && (
                <div className="pt-2 border-t">
                  <div className="flex items-center space-x-2 text-success">
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span className="text-xs sm:text-sm font-medium">Formulário válido</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
      )}
    </div>
  );
}
