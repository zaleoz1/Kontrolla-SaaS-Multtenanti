import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useFuncionarios, Funcionario } from '@/hooks/useFuncionarios';
import { ConfiguracoesSidebar } from '@/components/layout/ConfiguracoesSidebar';
import { useAuth } from '@/hooks/useAuth';
import { 
  Users, 
  Save, 
  X, 
  Mail,
  Phone,
  MapPin,
  User,
  AlertCircle,
  CheckCircle,
  Loader2,
  DollarSign,
  Briefcase,
  CreditCard,
  Calendar,
  FileText
} from 'lucide-react';


export default function NovoFuncionario() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const { logout } = useAuth();
  const { 
    criarFuncionario, 
    atualizarFuncionario: atualizarFuncionarioHook, 
    buscarFuncionario, 
    buscarCep,
    salvando,
    carregando 
  } = useFuncionarios();
  
  const [abaAtiva, setAbaAtiva] = useState("pessoal");
  const [carregandoFuncionario, setCarregandoFuncionario] = useState(false);
  
  const [funcionario, setFuncionario] = useState<Funcionario>({
    nome: "",
    sobrenome: "",
    cpf: "",
    rg: "",
    email: "",
    telefone: "",
    endereco: "",
    cidade: "",
    estado: "",
    cep: "",
    data_nascimento: "",
    sexo: "masculino",
    estado_civil: "solteiro",
    cargo: "",
    departamento: "",
    data_admissao: "",
    data_demissao: null,
    salario: 0,
    tipo_salario: "mensal",
    valor_hora: null,
    comissao_percentual: null,
    banco: "",
    agencia: "",
    conta: "",
    digito: "",
    tipo_conta: "corrente",
    pix: "",
    observacoes: "",
    status: "ativo"
  });

  const isEditando = !!id;

  useEffect(() => {
    if (isEditando) {
      carregarFuncionario();
    }
  }, [id]);

  const carregarFuncionario = async () => {
    try {
      setCarregandoFuncionario(true);
      const funcionarioData = await buscarFuncionario(parseInt(id!));
      setFuncionario(funcionarioData);
    } catch (error) {
      // Erro já tratado no hook
    } finally {
      setCarregandoFuncionario(false);
    }
  };

  const atualizarFuncionario = (campo: keyof Funcionario, valor: string | number | null) => {
    setFuncionario(prev => ({ ...prev, [campo]: valor }));
  };

  const handleBuscarCep = async (cep: string) => {
    if (cep.length === 8) {
      try {
        const dadosCep = await buscarCep(cep);
        if (dadosCep) {
          setFuncionario(prev => ({
            ...prev,
            endereco: dadosCep.endereco,
            cidade: dadosCep.cidade,
            estado: dadosCep.estado,
            cep: cep
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

  const salvarFuncionario = async () => {
    try {
      // Preparar dados para envio
      const dadosFuncionario = {
        nome: funcionario.nome.trim(),
        sobrenome: funcionario.sobrenome.trim(),
        cpf: funcionario.cpf.trim(),
        rg: funcionario.rg?.trim() || null,
        email: funcionario.email?.trim() || null,
        telefone: funcionario.telefone?.trim() || null,
        endereco: funcionario.endereco?.trim() || null,
        cidade: funcionario.cidade?.trim() || null,
        estado: funcionario.estado?.trim() || null,
        cep: funcionario.cep?.trim() || null,
        data_nascimento: funcionario.data_nascimento || null,
        sexo: funcionario.sexo,
        estado_civil: funcionario.estado_civil,
        cargo: funcionario.cargo.trim(),
        departamento: funcionario.departamento?.trim() || null,
        data_admissao: funcionario.data_admissao,
        data_demissao: funcionario.data_demissao,
        salario: funcionario.salario,
        tipo_salario: funcionario.tipo_salario,
        valor_hora: funcionario.valor_hora,
        comissao_percentual: funcionario.comissao_percentual,
        banco: funcionario.banco?.trim() || null,
        agencia: funcionario.agencia?.trim() || null,
        conta: funcionario.conta?.trim() || null,
        digito: funcionario.digito?.trim() || null,
        tipo_conta: funcionario.tipo_conta,
        pix: funcionario.pix?.trim() || null,
        observacoes: funcionario.observacoes?.trim() || null,
        status: funcionario.status
      };

      if (isEditando && id) {
        await atualizarFuncionarioHook(parseInt(id), dadosFuncionario);
        navigate('/dashboard/funcionarios?success=updated');
      } else {
        await criarFuncionario(dadosFuncionario);
        navigate('/dashboard/funcionarios?success=created');
      }
    } catch (error) {
      // Erro já tratado no hook
    }
  };

  const formularioValido = funcionario.nome && funcionario.sobrenome && funcionario.cpf && funcionario.cargo && funcionario.data_admissao;

  // Funções de formatação
  const formatarCPF = (cpf: string) => {
    // Remove tudo que não é dígito
    const numeros = cpf.replace(/\D/g, '');
    
    // Aplica a máscara do CPF
    if (numeros.length <= 3) {
      return numeros;
    } else if (numeros.length <= 6) {
      return numeros.replace(/(\d{3})(\d+)/, '$1.$2');
    } else if (numeros.length <= 9) {
      return numeros.replace(/(\d{3})(\d{3})(\d+)/, '$1.$2.$3');
    } else {
      return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d+)/, '$1.$2.$3-$4');
    }
  };

  const formatarTelefone = (telefone: string) => {
    // Remove tudo que não é dígito
    const numeros = telefone.replace(/\D/g, '');
    
    // Aplica a máscara do telefone
    if (numeros.length <= 2) {
      return numeros;
    } else if (numeros.length <= 6) {
      return numeros.replace(/(\d{2})(\d+)/, '($1) $2');
    } else if (numeros.length <= 10) {
      return numeros.replace(/(\d{2})(\d{4})(\d+)/, '($1) $2-$3');
    } else {
      return numeros.replace(/(\d{2})(\d{5})(\d+)/, '($1) $2-$3');
    }
  };

  const formatarCEP = (cep: string) => {
    // Remove tudo que não é dígito
    const numeros = cep.replace(/\D/g, '');
    
    // Aplica a máscara do CEP
    if (numeros.length <= 5) {
      return numeros;
    } else {
      return numeros.replace(/(\d{5})(\d+)/, '$1-$2');
    }
  };

  // Funções de conversão de data
  const formatarDataParaInput = (data: string | null | undefined) => {
    if (!data) return '';
    
    // Se já está no formato YYYY-MM-DD, retorna como está
    if (/^\d{4}-\d{2}-\d{2}$/.test(data)) {
      return data;
    }
    
    // Se está no formato DD/MM/YYYY, converte para YYYY-MM-DD
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(data)) {
      const [dia, mes, ano] = data.split('/');
      return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
    }
    
    // Se é uma data ISO, converte para YYYY-MM-DD
    try {
      const dataObj = new Date(data);
      if (!isNaN(dataObj.getTime())) {
        return dataObj.toISOString().split('T')[0];
      }
    } catch (error) {
      console.error('Erro ao converter data:', error);
    }
    
    return '';
  };

  const formatarDataParaExibicao = (data: string | null | undefined) => {
    if (!data) return '';
    
    // Se já está no formato DD/MM/YYYY, retorna como está
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(data)) {
      return data;
    }
    
    // Se está no formato YYYY-MM-DD, converte para DD/MM/YYYY
    if (/^\d{4}-\d{2}-\d{2}$/.test(data)) {
      const [ano, mes, dia] = data.split('-');
      return `${dia}/${mes}/${ano}`;
    }
    
    // Se é uma data ISO, converte para DD/MM/YYYY
    try {
      const dataObj = new Date(data);
      if (!isNaN(dataObj.getTime())) {
        const dia = dataObj.getDate().toString().padStart(2, '0');
        const mes = (dataObj.getMonth() + 1).toString().padStart(2, '0');
        const ano = dataObj.getFullYear();
        return `${dia}/${mes}/${ano}`;
      }
    } catch (error) {
      console.error('Erro ao converter data:', error);
    }
    
    return '';
  };

  // Funções de formatação bancária
  const formatarAgencia = (agencia: string) => {
    // Remove tudo que não é dígito
    const numeros = agencia.replace(/\D/g, '');
    
    // Limita a 5 dígitos (padrão brasileiro)
    const agenciaLimitada = numeros.slice(0, 5);
    
    // Aplica formatação com hífen se tiver 4 ou 5 dígitos
    if (agenciaLimitada.length === 4) {
      return agenciaLimitada;
    } else if (agenciaLimitada.length === 5) {
      return agenciaLimitada;
    }
    
    return agenciaLimitada;
  };

  const formatarConta = (conta: string) => {
    // Remove tudo que não é dígito
    const numeros = conta.replace(/\D/g, '');
    
    // Limita a 8 dígitos (padrão brasileiro)
    const contaLimitada = numeros.slice(0, 8);
    
    // Aplica formatação com hífen se tiver 6 ou mais dígitos
    if (contaLimitada.length >= 6) {
      return contaLimitada;
    }
    
    return contaLimitada;
  };

  const formatarDigito = (digito: string) => {
    // Remove tudo que não é dígito
    const numeros = digito.replace(/\D/g, '');
    
    // Limita a 2 dígitos (padrão brasileiro)
    return numeros.slice(0, 2);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-background prevent-zoom touch-optimized mobile-scroll overflow-x-hidden">
      {/* Sidebar de configurações */}
      <ConfiguracoesSidebar
        activeTab="funcionarios"
        onTabChange={(tab) => {
          if (tab === "conta") {
            navigate("/dashboard/configuracoes");
          }
        }}
        isOpen={false}
        onClose={() => {}}
      />

      {/* Conteúdo principal */}
      <div className="flex-1 overflow-y-auto">
        <div className="w-full max-w-full overflow-x-hidden p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="w-full flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">
            {isEditando ? 'Editar Funcionário' : 'Novo Funcionário'}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {isEditando 
              ? 'Edite as informações do funcionário' 
              : 'Cadastre um novo funcionário no sistema'
            }
          </p>
        </div>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
          <Button 
            variant="outline" 
            onClick={() => navigate("/dashboard/configuracoes")}
            className="h-8 sm:h-10 text-xs sm:text-sm w-full sm:w-auto"
          >
            <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Cancelar</span>
            <span className="sm:hidden">Cancelar</span>
          </Button>
          <Button 
            className="bg-gradient-primary h-8 sm:h-10 text-xs sm:text-sm w-full sm:w-auto" 
            onClick={salvarFuncionario}
            disabled={!formularioValido || salvando || carregandoFuncionario}
          >
            {salvando ? (
              <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 animate-spin" />
            ) : (
              <Save className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            )}
            <span className="hidden sm:inline">
              {salvando 
                ? (isEditando ? 'Atualizando...' : 'Salvando...') 
                : (isEditando ? 'Atualizar Funcionário' : 'Salvar Funcionário')
              }
            </span>
            <span className="sm:hidden">
              {salvando 
                ? (isEditando ? 'Atualizando...' : 'Salvando...') 
                : (isEditando ? 'Atualizar' : 'Salvar')
              }
            </span>
          </Button>
        </div>
      </div>

      {/* Conteúdo Principal */}
      {carregandoFuncionario ? (
        <div className="flex items-center justify-center p-6 sm:p-12">
          <div className="text-center">
            <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin mx-auto mb-4" />
            <p className="text-sm sm:text-base text-muted-foreground">Carregando dados do funcionário...</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
          {/* Coluna Esquerda - Formulário */}
          <div className="lg:col-span-2">
            <Tabs value={abaAtiva} onValueChange={setAbaAtiva} className="space-y-3 sm:space-y-4">
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
                <TabsTrigger value="pessoal" className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2 py-2 sm:py-1">
                  <User className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="text-xs sm:text-sm">Pessoal</span>
                </TabsTrigger>
                <TabsTrigger value="profissional" className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2 py-2 sm:py-1">
                  <Briefcase className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="text-xs sm:text-sm">Profissional</span>
                </TabsTrigger>
                <TabsTrigger value="endereco" className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2 py-2 sm:py-1">
                  <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="text-xs sm:text-sm">Endereço</span>
                </TabsTrigger>
                <TabsTrigger value="bancario" className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2 py-2 sm:py-1">
                  <CreditCard className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="text-xs sm:text-sm">Bancário</span>
                </TabsTrigger>
              </TabsList>

              {/* Aba Pessoal */}
              <TabsContent value="pessoal" className="space-y-3 sm:space-y-4">
                <Card className="bg-gradient-card shadow-card">
                  <CardHeader className="pb-3 sm:pb-6">
                    <CardTitle className="text-base sm:text-lg">Informações Pessoais</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4">
                    <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                      <div>
                        <label className="text-xs sm:text-sm font-medium">Nome *</label>
                        <Input
                          placeholder="Nome do funcionário"
                          value={funcionario.nome}
                          onChange={(e) => atualizarFuncionario("nome", e.target.value)}
                          className="mt-1 h-8 sm:h-10 text-xs sm:text-sm"
                        />
                      </div>

                      <div>
                        <label className="text-xs sm:text-sm font-medium">Sobrenome *</label>
                        <Input
                          placeholder="Sobrenome do funcionário"
                          value={funcionario.sobrenome}
                          onChange={(e) => atualizarFuncionario("sobrenome", e.target.value)}
                          className="mt-1 h-8 sm:h-10 text-xs sm:text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                      <div>
                        <label className="text-xs sm:text-sm font-medium">CPF *</label>
                        <Input
                          placeholder="000.000.000-00"
                          value={formatarCPF(funcionario.cpf)}
                          onChange={(e) => {
                            const valorFormatado = formatarCPF(e.target.value);
                            // Remove formatação para salvar apenas números
                            const valorNumerico = valorFormatado.replace(/\D/g, '');
                            atualizarFuncionario("cpf", valorNumerico);
                          }}
                          maxLength={14}
                          className="mt-1 h-8 sm:h-10 text-xs sm:text-sm"
                        />
                      </div>

                      <div>
                        <label className="text-xs sm:text-sm font-medium">RG</label>
                        <Input
                          placeholder="00.000.000-0"
                          value={funcionario.rg || ""}
                          onChange={(e) => atualizarFuncionario("rg", e.target.value)}
                          className="mt-1 h-8 sm:h-10 text-xs sm:text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                      <div>
                        <label className="text-xs sm:text-sm font-medium">Email</label>
                        <Input
                          type="email"
                          placeholder="funcionario@email.com"
                          value={funcionario.email || ""}
                          onChange={(e) => atualizarFuncionario("email", e.target.value)}
                          className="mt-1 h-8 sm:h-10 text-xs sm:text-sm"
                        />
                      </div>

                      <div>
                        <label className="text-xs sm:text-sm font-medium">Telefone</label>
                        <Input
                          placeholder="(00) 00000-0000"
                          value={funcionario.telefone ? formatarTelefone(funcionario.telefone) : ""}
                          onChange={(e) => {
                            const valorFormatado = formatarTelefone(e.target.value);
                            // Remove formatação para salvar apenas números
                            const valorNumerico = valorFormatado.replace(/\D/g, '');
                            atualizarFuncionario("telefone", valorNumerico);
                          }}
                          maxLength={15}
                          className="mt-1 h-8 sm:h-10 text-xs sm:text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                      <div>
                        <label className="text-xs sm:text-sm font-medium">Data de Nascimento</label>
                        <Input
                          type="date"
                          value={formatarDataParaInput(funcionario.data_nascimento)}
                          onChange={(e) => atualizarFuncionario("data_nascimento", e.target.value)}
                          className="mt-1 h-8 sm:h-10 text-xs sm:text-sm"
                        />
                      </div>

                      <div>
                        <label className="text-xs sm:text-sm font-medium">Sexo</label>
                        <Select 
                          value={funcionario.sexo} 
                          onValueChange={(value) => atualizarFuncionario("sexo", value)}
                        >
                          <SelectTrigger className="mt-1 h-8 sm:h-10 text-xs sm:text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="masculino">Masculino</SelectItem>
                            <SelectItem value="feminino">Feminino</SelectItem>
                            <SelectItem value="outro">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-xs sm:text-sm font-medium">Estado Civil</label>
                        <Select 
                          value={funcionario.estado_civil} 
                          onValueChange={(value) => atualizarFuncionario("estado_civil", value)}
                        >
                          <SelectTrigger className="mt-1 h-8 sm:h-10 text-xs sm:text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="solteiro">Solteiro(a)</SelectItem>
                            <SelectItem value="casado">Casado(a)</SelectItem>
                            <SelectItem value="divorciado">Divorciado(a)</SelectItem>
                            <SelectItem value="viuvo">Viúvo(a)</SelectItem>
                            <SelectItem value="uniao_estavel">União Estável</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Aba Profissional */}
              <TabsContent value="profissional" className="space-y-3 sm:space-y-4">
                <Card className="bg-gradient-card shadow-card">
                  <CardHeader className="pb-3 sm:pb-6">
                    <CardTitle className="text-base sm:text-lg">Informações Profissionais</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4">
                    <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                      <div>
                        <label className="text-xs sm:text-sm font-medium">Cargo *</label>
                        <Input
                          placeholder="Cargo do funcionário"
                          value={funcionario.cargo}
                          onChange={(e) => atualizarFuncionario("cargo", e.target.value)}
                          className="mt-1 h-8 sm:h-10 text-xs sm:text-sm"
                        />
                      </div>

                      <div>
                        <label className="text-xs sm:text-sm font-medium">Departamento</label>
                        <Input
                          placeholder="Departamento"
                          value={funcionario.departamento || ""}
                          onChange={(e) => atualizarFuncionario("departamento", e.target.value)}
                          className="mt-1 h-8 sm:h-10 text-xs sm:text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                      <div>
                        <label className="text-xs sm:text-sm font-medium">Data de Admissão *</label>
                        <Input
                          type="date"
                          value={formatarDataParaInput(funcionario.data_admissao)}
                          onChange={(e) => atualizarFuncionario("data_admissao", e.target.value)}
                          className="mt-1 h-8 sm:h-10 text-xs sm:text-sm"
                        />
                      </div>

                      <div>
                        <label className="text-xs sm:text-sm font-medium">Data de Demissão</label>
                        <Input
                          type="date"
                          value={formatarDataParaInput(funcionario.data_demissao)}
                          onChange={(e) => atualizarFuncionario("data_demissao", e.target.value || null)}
                          className="mt-1 h-8 sm:h-10 text-xs sm:text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                      <div>
                        <label className="text-xs sm:text-sm font-medium">Tipo de Salário</label>
                        <Select 
                          value={funcionario.tipo_salario} 
                          onValueChange={(value) => atualizarFuncionario("tipo_salario", value)}
                        >
                          <SelectTrigger className="mt-1 h-8 sm:h-10 text-xs sm:text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mensal">Mensal</SelectItem>
                            <SelectItem value="horista">Horista</SelectItem>
                            <SelectItem value="comissionado">Comissionado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-xs sm:text-sm font-medium">Salário *</label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={funcionario.salario}
                          onChange={(e) => atualizarFuncionario("salario", parseFloat(e.target.value) || 0)}
                          className="mt-1 h-8 sm:h-10 text-xs sm:text-sm"
                        />
                      </div>
                    </div>

                    {funcionario.tipo_salario === "horista" && (
                      <div>
                        <label className="text-xs sm:text-sm font-medium">Valor por Hora</label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={funcionario.valor_hora || ""}
                          onChange={(e) => atualizarFuncionario("valor_hora", parseFloat(e.target.value) || null)}
                          className="mt-1 h-8 sm:h-10 text-xs sm:text-sm"
                        />
                      </div>
                    )}

                    {funcionario.tipo_salario === "comissionado" && (
                      <div>
                        <label className="text-xs sm:text-sm font-medium">Comissão (%)</label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          placeholder="0.00"
                          value={funcionario.comissao_percentual || ""}
                          onChange={(e) => atualizarFuncionario("comissao_percentual", parseFloat(e.target.value) || null)}
                          className="mt-1 h-8 sm:h-10 text-xs sm:text-sm"
                        />
                      </div>
                    )}

                    <div>
                      <label className="text-xs sm:text-sm font-medium">Status</label>
                      <Select 
                        value={funcionario.status} 
                        onValueChange={(value) => atualizarFuncionario("status", value)}
                      >
                        <SelectTrigger className="mt-1 h-8 sm:h-10 text-xs sm:text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ativo">Ativo</SelectItem>
                          <SelectItem value="inativo">Inativo</SelectItem>
                          <SelectItem value="afastado">Afastado</SelectItem>
                          <SelectItem value="demitido">Demitido</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Aba Endereço */}
              <TabsContent value="endereco" className="space-y-3 sm:space-y-4">
                <Card className="bg-gradient-card shadow-card">
                  <CardHeader className="pb-3 sm:pb-6">
                    <CardTitle className="text-base sm:text-lg">Endereço</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4">
                    <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                      <div>
                        <label className="text-xs sm:text-sm font-medium">CEP</label>
                        <Input
                          placeholder="00000-000"
                          value={funcionario.cep ? formatarCEP(funcionario.cep) : ""}
                          onChange={(e) => {
                            const valorFormatado = formatarCEP(e.target.value);
                            // Remove formatação para salvar apenas números
                            const valorNumerico = valorFormatado.replace(/\D/g, '');
                            atualizarFuncionario("cep", valorNumerico);
                            if (valorNumerico.length === 8) {
                              handleBuscarCep(valorNumerico);
                            }
                          }}
                          maxLength={9}
                          className="mt-1 h-8 sm:h-10 text-xs sm:text-sm"
                        />
                      </div>

                      <div>
                        <label className="text-xs sm:text-sm font-medium">Endereço</label>
                        <Input
                          placeholder="Rua, Avenida, número, bairro"
                          value={funcionario.endereco || ""}
                          onChange={(e) => atualizarFuncionario("endereco", e.target.value)}
                          className="mt-1 h-8 sm:h-10 text-xs sm:text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                      <div>
                        <label className="text-xs sm:text-sm font-medium">Cidade</label>
                        <Input
                          placeholder="Nome da cidade"
                          value={funcionario.cidade || ""}
                          onChange={(e) => atualizarFuncionario("cidade", e.target.value)}
                          className="mt-1 h-8 sm:h-10 text-xs sm:text-sm"
                        />
                      </div>

                      <div>
                        <label className="text-xs sm:text-sm font-medium">Estado</label>
                        <Select 
                          value={funcionario.estado || ""} 
                          onValueChange={(value) => atualizarFuncionario("estado", value)}
                        >
                          <SelectTrigger className="mt-1 h-8 sm:h-10 text-xs sm:text-sm">
                            <SelectValue placeholder="Selecione o estado" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="AC">Acre</SelectItem>
                            <SelectItem value="AL">Alagoas</SelectItem>
                            <SelectItem value="AP">Amapá</SelectItem>
                            <SelectItem value="AM">Amazonas</SelectItem>
                            <SelectItem value="BA">Bahia</SelectItem>
                            <SelectItem value="CE">Ceará</SelectItem>
                            <SelectItem value="DF">Distrito Federal</SelectItem>
                            <SelectItem value="ES">Espírito Santo</SelectItem>
                            <SelectItem value="GO">Goiás</SelectItem>
                            <SelectItem value="MA">Maranhão</SelectItem>
                            <SelectItem value="MT">Mato Grosso</SelectItem>
                            <SelectItem value="MS">Mato Grosso do Sul</SelectItem>
                            <SelectItem value="MG">Minas Gerais</SelectItem>
                            <SelectItem value="PA">Pará</SelectItem>
                            <SelectItem value="PB">Paraíba</SelectItem>
                            <SelectItem value="PR">Paraná</SelectItem>
                            <SelectItem value="PE">Pernambuco</SelectItem>
                            <SelectItem value="PI">Piauí</SelectItem>
                            <SelectItem value="RJ">Rio de Janeiro</SelectItem>
                            <SelectItem value="RN">Rio Grande do Norte</SelectItem>
                            <SelectItem value="RS">Rio Grande do Sul</SelectItem>
                            <SelectItem value="RO">Rondônia</SelectItem>
                            <SelectItem value="RR">Roraima</SelectItem>
                            <SelectItem value="SC">Santa Catarina</SelectItem>
                            <SelectItem value="SP">São Paulo</SelectItem>
                            <SelectItem value="SE">Sergipe</SelectItem>
                            <SelectItem value="TO">Tocantins</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Aba Bancário */}
              <TabsContent value="bancario" className="space-y-3 sm:space-y-4">
                <Card className="bg-gradient-card shadow-card">
                  <CardHeader className="pb-3 sm:pb-6">
                    <CardTitle className="text-base sm:text-lg">Dados Bancários</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4">
                    <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                      <div>
                        <label className="text-xs sm:text-sm font-medium">Banco</label>
                        <Input
                          placeholder="Nome do banco"
                          value={funcionario.banco || ""}
                          onChange={(e) => atualizarFuncionario("banco", e.target.value)}
                          className="mt-1 h-8 sm:h-10 text-xs sm:text-sm"
                        />
                      </div>

                      <div>
                        <label className="text-xs sm:text-sm font-medium">Agência</label>
                        <Input
                          placeholder="Número da agência"
                          value={funcionario.agencia ? formatarAgencia(funcionario.agencia) : ""}
                          onChange={(e) => {
                            const valorFormatado = formatarAgencia(e.target.value);
                            // Remove formatação para salvar apenas números
                            const valorNumerico = valorFormatado.replace(/\D/g, '');
                            atualizarFuncionario("agencia", valorNumerico);
                          }}
                          maxLength={5}
                          className="mt-1 h-8 sm:h-10 text-xs sm:text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                      <div>
                        <label className="text-xs sm:text-sm font-medium">Conta</label>
                        <Input
                          placeholder="Número da conta"
                          value={funcionario.conta ? formatarConta(funcionario.conta) : ""}
                          onChange={(e) => {
                            const valorFormatado = formatarConta(e.target.value);
                            // Remove formatação para salvar apenas números
                            const valorNumerico = valorFormatado.replace(/\D/g, '');
                            atualizarFuncionario("conta", valorNumerico);
                          }}
                          maxLength={8}
                          className="mt-1 h-8 sm:h-10 text-xs sm:text-sm"
                        />
                      </div>

                      <div>
                        <label className="text-xs sm:text-sm font-medium">Dígito</label>
                        <Input
                          placeholder="Dígito da conta"
                          maxLength={2}
                          value={funcionario.digito ? formatarDigito(funcionario.digito) : ""}
                          onChange={(e) => {
                            const valorFormatado = formatarDigito(e.target.value);
                            // Remove formatação para salvar apenas números
                            const valorNumerico = valorFormatado.replace(/\D/g, '');
                            atualizarFuncionario("digito", valorNumerico);
                          }}
                          className="mt-1 h-8 sm:h-10 text-xs sm:text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                      <div>
                        <label className="text-xs sm:text-sm font-medium">Tipo de Conta</label>
                        <Select 
                          value={funcionario.tipo_conta} 
                          onValueChange={(value) => atualizarFuncionario("tipo_conta", value)}
                        >
                          <SelectTrigger className="mt-1 h-8 sm:h-10 text-xs sm:text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="corrente">Conta Corrente</SelectItem>
                            <SelectItem value="poupanca">Conta Poupança</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-xs sm:text-sm font-medium">PIX</label>
                        <Input
                          placeholder="Chave PIX"
                          value={funcionario.pix || ""}
                          onChange={(e) => atualizarFuncionario("pix", e.target.value)}
                          className="mt-1 h-8 sm:h-10 text-xs sm:text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs sm:text-sm font-medium">Observações</label>
                      <Textarea
                        placeholder="Observações sobre o funcionário..."
                        value={funcionario.observacoes || ""}
                        onChange={(e) => atualizarFuncionario("observacoes", e.target.value)}
                        className="mt-1 min-h-[60px] sm:min-h-[80px] resize-none text-xs sm:text-sm"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Coluna Direita - Preview */}
          <div className="space-y-3 sm:space-y-4">
            {/* Preview do Funcionário */}
            <Card className="bg-gradient-card shadow-card">
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="text-base sm:text-lg">Preview do Funcionário</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                {funcionario.nome ? (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-gradient-primary flex items-center justify-center">
                        <span className="text-sm sm:text-lg font-bold text-white">
                          {funcionario.nome.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm sm:text-base truncate">{funcionario.nome} {funcionario.sobrenome}</h3>
                        <Badge variant={funcionario.status === "ativo" ? "default" : "secondary"} 
                               className={`text-xs ${funcionario.status === "ativo" ? "bg-success" : ""}`}>
                          {funcionario.status === "ativo" ? "Ativo" : 
                           funcionario.status === "inativo" ? "Inativo" :
                           funcionario.status === "afastado" ? "Afastado" : "Demitido"}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs sm:text-sm">
                      {funcionario.cargo && (
                        <div className="flex items-center space-x-2 text-muted-foreground">
                          <Briefcase className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                          <span className="truncate">{funcionario.cargo}</span>
                        </div>
                      )}
                      {funcionario.email && (
                        <div className="flex items-center space-x-2 text-muted-foreground">
                          <Mail className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                          <span className="truncate">{funcionario.email}</span>
                        </div>
                      )}
                      {funcionario.telefone && (
                        <div className="flex items-center space-x-2 text-muted-foreground">
                          <Phone className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                          <span className="truncate">{formatarTelefone(funcionario.telefone)}</span>
                        </div>
                      )}
                      {funcionario.cpf && (
                        <div className="flex items-center space-x-2 text-muted-foreground">
                          <FileText className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                          <span className="truncate">{formatarCPF(funcionario.cpf)}</span>
                        </div>
                      )}
                      {funcionario.cidade && funcionario.estado && (
                        <div className="flex items-center space-x-2 text-muted-foreground">
                          <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                          <span className="truncate">{funcionario.cidade}, {funcionario.estado}</span>
                        </div>
                      )}
                      {funcionario.salario > 0 && (
                        <div className="flex items-center space-x-2 text-muted-foreground">
                          <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                          <span className="truncate">R$ {funcionario.salario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground">
                    <Users className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2" />
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
                  {funcionario.nome ? (
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-success" />
                  ) : (
                    <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                  )}
                  <span className="text-xs sm:text-sm">Nome</span>
                </div>

                <div className="flex items-center space-x-2">
                  {funcionario.sobrenome ? (
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-success" />
                  ) : (
                    <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                  )}
                  <span className="text-xs sm:text-sm">Sobrenome</span>
                </div>

                <div className="flex items-center space-x-2">
                  {funcionario.cpf ? (
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-success" />
                  ) : (
                    <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                  )}
                  <span className="text-xs sm:text-sm">CPF</span>
                </div>

                <div className="flex items-center space-x-2">
                  {funcionario.cargo ? (
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-success" />
                  ) : (
                    <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                  )}
                  <span className="text-xs sm:text-sm">Cargo</span>
                </div>

                <div className="flex items-center space-x-2">
                  {funcionario.data_admissao ? (
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-success" />
                  ) : (
                    <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                  )}
                  <span className="text-xs sm:text-sm">Data de Admissão</span>
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
                <p>• Use o CEP para preenchimento automático do endereço</p>
                <p>• O CPF é obrigatório para funcionários</p>
                <p>• Mantenha as informações de contato sempre atualizadas</p>
                <p>• Configure os dados bancários para pagamentos</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  );
}
