import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useConfiguracoes } from "@/hooks/useConfiguracoes";
import { useToast } from "@/hooks/use-toast";
import { ConfiguracoesSidebar } from "@/components/layout/ConfiguracoesSidebar";
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
  Activity,
  QrCode,
  Banknote,
  Smartphone as SmartphoneIcon,
  Percent,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Plus,
  Edit,
  Search,
  Filter,
  MoreHorizontal,
  Building2,
  MapPin as MapPinIcon,
  Phone as PhoneIcon,
  Mail as MailIcon,
  FileText,
  Check,
  X,
  ArrowLeft,
  LogOut,
  Users,
  DollarSign,
  Briefcase,
  XCircle,
  AlertCircle,
  Clock,
  UserCheck,
  UserCog,
  CheckCircle2
} from "lucide-react";

export default function Configuracoes() {
  const navigate = useNavigate();
  const { 
    dadosConta, 
    dadosTenant, 
    configuracoes, 
    dadosContaEditando,
    dadosTenantEditando,
    configuracoesEditando,
    setDadosContaEditando,
    setDadosTenantEditando,
    setConfiguracoesEditando,
    loading, 
    error,
    atualizarDadosConta,
    atualizarDadosTenant,
    atualizarConfiguracoes,
    alterarSenha,
    uploadAvatar,
    uploadLogo
  } = useConfiguracoes();

  const { toast } = useToast();
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mostrarSenhas, setMostrarSenhas] = useState(false);
  const [salvando, setSalvando] = useState(false);

  // Estados para métodos de pagamento
  const [metodosPagamento, setMetodosPagamento] = useState({
    cartao_credito: { ativo: true, taxa: 3.5, nome: "Cartão de Crédito" },
    cartao_debito: { ativo: true, taxa: 2.5, nome: "Cartão de Débito" },
    pix: { ativo: true, taxa: 0, nome: "PIX" },
    transferencia: { ativo: false, taxa: 0, nome: "Transferência Bancária" },
    dinheiro: { ativo: true, taxa: 0, nome: "Dinheiro" }
  });

  const [dadosPix, setDadosPix] = useState({
    chave_pix: "",
    qr_code: "",
    nome_titular: "",
    cpf_cnpj: ""
  });

  const [dadosBancarios, setDadosBancarios] = useState({
    banco: "",
    agencia: "",
    conta: "",
    digito: "",
    tipo_conta: "corrente",
    nome_titular: "",
    cpf_cnpj: ""
  });

  // Estados para fornecedores
  const [fornecedores, setFornecedores] = useState([]);
  const [fornecedorEditando, setFornecedorEditando] = useState(null);
  const [mostrarFormFornecedor, setMostrarFormFornecedor] = useState(false);
  const [buscaFornecedor, setBuscaFornecedor] = useState("");
  const [filtroStatusFornecedor, setFiltroStatusFornecedor] = useState("todos");
  const [carregandoFornecedores, setCarregandoFornecedores] = useState(false);

  // Estados para funcionários
  const [funcionarios, setFuncionarios] = useState([]);
  const [funcionarioEditando, setFuncionarioEditando] = useState(null);
  const [mostrarFormFuncionario, setMostrarFormFuncionario] = useState(false);
  const [buscaFuncionario, setBuscaFuncionario] = useState("");
  const [filtroStatusFuncionario, setFiltroStatusFuncionario] = useState("todos");
  const [filtroCargoFuncionario, setFiltroCargoFuncionario] = useState("todos");
  const [carregandoFuncionarios, setCarregandoFuncionarios] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState("conta");

  // Estados para administração
  const [usuarios, setUsuarios] = useState([]);
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [mostrarFormUsuario, setMostrarFormUsuario] = useState(false);
  const [buscaUsuario, setBuscaUsuario] = useState("");
  const [filtroRoleUsuario, setFiltroRoleUsuario] = useState("todos");
  const [filtroStatusUsuario, setFiltroStatusUsuario] = useState("todos");
  const [carregandoUsuarios, setCarregandoUsuarios] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);

  // Carregar fornecedores e funcionários quando o componente montar
  useEffect(() => {
    carregarFornecedores();
    carregarFuncionarios();
    carregarUsuarios();
  }, []);

  const handleSalvarDadosConta = async () => {
    if (!dadosContaEditando) return;
    
    setSalvando(true);
    try {
      await atualizarDadosConta({
        nome: dadosContaEditando.nome,
        sobrenome: dadosContaEditando.sobrenome,
        email: dadosContaEditando.email,
        telefone: dadosContaEditando.telefone
      });
      
      toast({
        title: "Sucesso",
        description: "Dados da conta atualizados com sucesso!",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar dados da conta",
        variant: "destructive"
      });
    } finally {
      setSalvando(false);
    }
  };

  const handleSalvarDadosTenant = async () => {
    if (!dadosTenantEditando) return;
    
    setSalvando(true);
    try {
      await atualizarDadosTenant({
        nome: dadosTenantEditando.nome,
        cnpj: dadosTenantEditando.cnpj,
        cpf: dadosTenantEditando.cpf,
        tipo_pessoa: dadosTenantEditando.tipo_pessoa,
        email: dadosTenantEditando.email,
        telefone: dadosTenantEditando.telefone,
        endereco: dadosTenantEditando.endereco,
        cidade: dadosTenantEditando.cidade,
        estado: dadosTenantEditando.estado,
        cep: dadosTenantEditando.cep,
        razao_social: dadosTenantEditando.razao_social,
        nome_fantasia: dadosTenantEditando.nome_fantasia,
        inscricao_estadual: dadosTenantEditando.inscricao_estadual,
        inscricao_municipal: dadosTenantEditando.inscricao_municipal
      });
      
      toast({
        title: "Sucesso",
        description: "Dados da empresa atualizados com sucesso!",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar dados da empresa",
        variant: "destructive"
      });
    } finally {
      setSalvando(false);
    }
  };

  const handleSalvarConfiguracoes = async () => {
    if (!configuracoesEditando) return;
    
    setSalvando(true);
    try {
      await atualizarConfiguracoes(configuracoesEditando);
      
      toast({
        title: "Sucesso",
        description: "Configurações atualizadas com sucesso!",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar configurações",
        variant: "destructive"
      });
    } finally {
      setSalvando(false);
    }
  };

  const handleAlterarSenha = async () => {
    if (novaSenha !== confirmarSenha) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem",
        variant: "destructive"
      });
      return;
    }

    if (novaSenha.length < 6) {
      toast({
        title: "Erro",
        description: "A nova senha deve ter pelo menos 6 caracteres",
        variant: "destructive"
      });
      return;
    }

    setSalvando(true);
    try {
      await alterarSenha(senhaAtual, novaSenha);
      
      toast({
        title: "Sucesso",
        description: "Senha alterada com sucesso!",
        variant: "default"
      });
      
      setSenhaAtual("");
      setNovaSenha("");
      setConfirmarSenha("");
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao alterar senha",
        variant: "destructive"
      });
    } finally {
      setSalvando(false);
    }
  };

  const handleUploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Erro",
        description: "Apenas arquivos de imagem são permitidos",
        variant: "destructive"
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Erro",
        description: "O arquivo deve ter no máximo 5MB",
        variant: "destructive"
      });
      return;
    }

    try {
      await uploadAvatar(file);
      toast({
        title: "Sucesso",
        description: "Avatar atualizado com sucesso!",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao fazer upload do avatar",
        variant: "destructive"
      });
    }
  };

  const handleUploadLogo = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Erro",
        description: "Apenas arquivos de imagem são permitidos",
        variant: "destructive"
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Erro",
        description: "O arquivo deve ter no máximo 5MB",
        variant: "destructive"
      });
      return;
    }

    try {
      await uploadLogo(file);
      toast({
        title: "Sucesso",
        description: "Logo da empresa atualizada com sucesso!",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao fazer upload da logo",
        variant: "destructive"
      });
    }
  };

  const handleSalvarMetodosPagamento = async () => {
    setSalvando(true);
    try {
      // Aqui você implementaria a chamada para a API
      // await api.put('/configuracoes/metodos-pagamento', metodosPagamento);
      
      toast({
        title: "Sucesso",
        description: "Métodos de pagamento atualizados com sucesso!",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar métodos de pagamento",
        variant: "destructive"
      });
    } finally {
      setSalvando(false);
    }
  };

  const handleSalvarDadosPix = async () => {
    setSalvando(true);
    try {
      // Aqui você implementaria a chamada para a API
      // await api.put('/configuracoes/pix', dadosPix);
      
      toast({
        title: "Sucesso",
        description: "Dados PIX atualizados com sucesso!",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar dados PIX",
        variant: "destructive"
      });
    } finally {
      setSalvando(false);
    }
  };

  const handleSalvarDadosBancarios = async () => {
    setSalvando(true);
    try {
      // Aqui você implementaria a chamada para a API
      // await api.put('/configuracoes/dados-bancarios', dadosBancarios);
      
      toast({
        title: "Sucesso",
        description: "Dados bancários atualizados com sucesso!",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar dados bancários",
        variant: "destructive"
      });
    } finally {
      setSalvando(false);
    }
  };

  const handleUploadQrCodePix = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Erro",
        description: "Apenas arquivos de imagem são permitidos",
        variant: "destructive"
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Erro",
        description: "O arquivo deve ter no máximo 2MB",
        variant: "destructive"
      });
      return;
    }

    try {
      // Aqui você implementaria o upload do QR code
      const reader = new FileReader();
      reader.onload = (e) => {
        setDadosPix(prev => ({ ...prev, qr_code: e.target?.result as string }));
      };
      reader.readAsDataURL(file);
      
      toast({
        title: "Sucesso",
        description: "QR Code PIX atualizado com sucesso!",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao fazer upload do QR Code PIX",
        variant: "destructive"
      });
    }
  };

  // Funções para gerenciar fornecedores
  const carregarFornecedores = async () => {
    setCarregandoFornecedores(true);
    try {
      // Aqui você implementaria a chamada para a API
      // const response = await api.get('/fornecedores');
      // setFornecedores(response.data);
      
      // Dados mock para demonstração
      const fornecedoresMock = [
        {
          id: 1,
          nome: "Fornecedor ABC Ltda",
          razao_social: "ABC Fornecedores Ltda",
          cnpj: "12.345.678/0001-90",
          email: "contato@abc.com.br",
          telefone: "(11) 99999-9999",
          endereco: "Rua das Flores, 123",
          cidade: "São Paulo",
          estado: "SP",
          cep: "01234-567",
          contato: "João Silva",
          observacoes: "Fornecedor principal de produtos eletrônicos",
          status: "ativo",
          data_criacao: "2024-01-15T10:30:00Z"
        },
        {
          id: 2,
          nome: "Distribuidora XYZ",
          razao_social: "XYZ Distribuidora S.A.",
          cnpj: "98.765.432/0001-10",
          email: "vendas@xyz.com.br",
          telefone: "(11) 88888-8888",
          endereco: "Av. Paulista, 456",
          cidade: "São Paulo",
          estado: "SP",
          cep: "01310-100",
          contato: "Maria Santos",
          observacoes: "Especializada em produtos de limpeza",
          status: "ativo",
          data_criacao: "2024-01-10T14:20:00Z"
        }
      ];
      setFornecedores(fornecedoresMock);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar fornecedores",
        variant: "destructive"
      });
    } finally {
      setCarregandoFornecedores(false);
    }
  };

  const handleNovoFornecedor = () => {
    setFornecedorEditando({
      nome: "",
      razao_social: "",
      cnpj: "",
      email: "",
      telefone: "",
      endereco: "",
      cidade: "",
      estado: "",
      cep: "",
      contato: "",
      observacoes: "",
      status: "ativo"
    });
    setMostrarFormFornecedor(true);
  };

  const handleEditarFornecedor = (fornecedor: any) => {
    setFornecedorEditando(fornecedor);
    setMostrarFormFornecedor(true);
  };

  const handleSalvarFornecedor = async () => {
    if (!fornecedorEditando) return;

    setSalvando(true);
    try {
      // Aqui você implementaria a chamada para a API
      // if (fornecedorEditando.id) {
      //   await api.put(`/fornecedores/${fornecedorEditando.id}`, fornecedorEditando);
      // } else {
      //   await api.post('/fornecedores', fornecedorEditando);
      // }
      
      toast({
        title: "Sucesso",
        description: fornecedorEditando.id ? "Fornecedor atualizado com sucesso!" : "Fornecedor criado com sucesso!",
        variant: "default"
      });
      
      setMostrarFormFornecedor(false);
      setFornecedorEditando(null);
      carregarFornecedores();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar fornecedor",
        variant: "destructive"
      });
    } finally {
      setSalvando(false);
    }
  };

  const handleExcluirFornecedor = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este fornecedor?")) return;

    setSalvando(true);
    try {
      // Aqui você implementaria a chamada para a API
      // await api.delete(`/fornecedores/${id}`);
      
      toast({
        title: "Sucesso",
        description: "Fornecedor excluído com sucesso!",
        variant: "default"
      });
      
      carregarFornecedores();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir fornecedor",
        variant: "destructive"
      });
    } finally {
      setSalvando(false);
    }
  };

  const fornecedoresFiltrados = fornecedores.filter(fornecedor => {
    const matchBusca = fornecedor.nome.toLowerCase().includes(buscaFornecedor.toLowerCase()) ||
                      fornecedor.razao_social?.toLowerCase().includes(buscaFornecedor.toLowerCase()) ||
                      fornecedor.cnpj?.includes(buscaFornecedor);
    
    const matchStatus = filtroStatusFornecedor === "todos" || fornecedor.status === filtroStatusFornecedor;
    
    return matchBusca && matchStatus;
  });

  // Funções para gerenciar funcionários
  const carregarFuncionarios = async () => {
    setCarregandoFuncionarios(true);
    try {
      // Aqui você implementaria a chamada para a API
      // const response = await api.get('/funcionarios');
      // setFuncionarios(response.data);
      
      // Dados mock para demonstração
      const funcionariosMock = [
        {
          id: 1,
          nome: "João",
          sobrenome: "Silva",
          cpf: "123.456.789-00",
          rg: "12.345.678-9",
          email: "joao.silva@empresa.com",
          telefone: "(11) 99999-9999",
          endereco: "Rua das Flores, 123",
          cidade: "São Paulo",
          estado: "SP",
          cep: "01234-567",
          data_nascimento: "1990-05-15",
          sexo: "masculino",
          estado_civil: "casado",
          cargo: "Vendedor",
          departamento: "Vendas",
          data_admissao: "2023-01-15",
          data_demissao: null,
          salario: 3500.00,
          tipo_salario: "mensal",
          valor_hora: null,
          comissao_percentual: 2.5,
          banco: "Banco do Brasil",
          agencia: "1234",
          conta: "12345-6",
          digito: "7",
          tipo_conta: "corrente",
          pix: "joao.silva@empresa.com",
          observacoes: "Funcionário dedicado e pontual",
          status: "ativo",
          data_criacao: "2023-01-15T10:30:00Z"
        },
        {
          id: 2,
          nome: "Maria",
          sobrenome: "Santos",
          cpf: "987.654.321-00",
          rg: "98.765.432-1",
          email: "maria.santos@empresa.com",
          telefone: "(11) 88888-8888",
          endereco: "Av. Paulista, 456",
          cidade: "São Paulo",
          estado: "SP",
          cep: "01310-100",
          data_nascimento: "1985-08-22",
          sexo: "feminino",
          estado_civil: "solteira",
          cargo: "Gerente",
          departamento: "Administrativo",
          data_admissao: "2022-06-01",
          data_demissao: null,
          salario: 6500.00,
          tipo_salario: "mensal",
          valor_hora: null,
          comissao_percentual: null,
          banco: "Itaú",
          agencia: "5678",
          conta: "98765-4",
          digito: "3",
          tipo_conta: "corrente",
          pix: "maria.santos@empresa.com",
          observacoes: "Excelente liderança e organização",
          status: "ativo",
          data_criacao: "2022-06-01T14:20:00Z"
        }
      ];
      setFuncionarios(funcionariosMock);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar funcionários",
        variant: "destructive"
      });
    } finally {
      setCarregandoFuncionarios(false);
    }
  };

  const handleNovoFuncionario = () => {
    setFuncionarioEditando({
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
      valor_hora: 0,
      comissao_percentual: 0,
      banco: "",
      agencia: "",
      conta: "",
      digito: "",
      tipo_conta: "corrente",
      pix: "",
      observacoes: "",
      status: "ativo"
    });
    setMostrarFormFuncionario(true);
  };

  const handleEditarFuncionario = (funcionario: any) => {
    setFuncionarioEditando(funcionario);
    setMostrarFormFuncionario(true);
  };

  const handleSalvarFuncionario = async () => {
    if (!funcionarioEditando) return;

    setSalvando(true);
    try {
      // Aqui você implementaria a chamada para a API
      // if (funcionarioEditando.id) {
      //   await api.put(`/funcionarios/${funcionarioEditando.id}`, funcionarioEditando);
      // } else {
      //   await api.post('/funcionarios', funcionarioEditando);
      // }
      
      toast({
        title: "Sucesso",
        description: funcionarioEditando.id ? "Funcionário atualizado com sucesso!" : "Funcionário criado com sucesso!",
        variant: "default"
      });
      
      setMostrarFormFuncionario(false);
      setFuncionarioEditando(null);
      carregarFuncionarios();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar funcionário",
        variant: "destructive"
      });
    } finally {
      setSalvando(false);
    }
  };

  const handleExcluirFuncionario = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este funcionário?")) return;

    setSalvando(true);
    try {
      // Aqui você implementaria a chamada para a API
      // await api.delete(`/funcionarios/${id}`);
      
      toast({
        title: "Sucesso",
        description: "Funcionário excluído com sucesso!",
        variant: "default"
      });
      
      carregarFuncionarios();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir funcionário",
        variant: "destructive"
      });
    } finally {
      setSalvando(false);
    }
  };

  const funcionariosFiltrados = funcionarios.filter(funcionario => {
    const matchBusca = funcionario.nome.toLowerCase().includes(buscaFuncionario.toLowerCase()) ||
                      funcionario.sobrenome.toLowerCase().includes(buscaFuncionario.toLowerCase()) ||
                      funcionario.cpf?.includes(buscaFuncionario) ||
                      funcionario.cargo?.toLowerCase().includes(buscaFuncionario.toLowerCase());
    
    const matchStatus = filtroStatusFuncionario === "todos" || funcionario.status === filtroStatusFuncionario;
    const matchCargo = filtroCargoFuncionario === "todos" || funcionario.cargo === filtroCargoFuncionario;
    
    return matchBusca && matchStatus && matchCargo;
  });

  // Funções para gerenciar usuários e sistema de roles
  const carregarUsuarios = async () => {
    setCarregandoUsuarios(true);
    try {
      // Aqui você implementaria a chamada para a API
      // const response = await api.get('/usuarios');
      // setUsuarios(response.data);
      
      // Dados mock para demonstração
      const usuariosMock = [
        {
          id: 1,
          nome: "Admin",
          sobrenome: "Sistema",
          email: "admin@sistema.com",
          role: "administrador",
          status: "ativo",
          ultimo_acesso: "2024-01-18T14:30:00Z",
          data_criacao: "2024-01-01T10:00:00Z",
          permissoes: ["todos"]
        },
        {
          id: 2,
          nome: "Maria",
          sobrenome: "Santos",
          email: "maria@empresa.com",
          role: "gerente",
          status: "ativo",
          ultimo_acesso: "2024-01-18T12:15:00Z",
          data_criacao: "2024-01-05T09:30:00Z",
          permissoes: ["vendas", "estoque", "relatorios", "funcionarios"]
        },
        {
          id: 3,
          nome: "João",
          sobrenome: "Silva",
          email: "joao@empresa.com",
          role: "vendedor",
          status: "ativo",
          ultimo_acesso: "2024-01-18T11:45:00Z",
          data_criacao: "2024-01-10T14:20:00Z",
          permissoes: ["vendas", "clientes"]
        },
        {
          id: 4,
          nome: "Ana",
          sobrenome: "Costa",
          email: "ana@empresa.com",
          role: "vendedor",
          status: "inativo",
          ultimo_acesso: "2024-01-15T16:30:00Z",
          data_criacao: "2024-01-12T11:10:00Z",
          permissoes: ["vendas", "clientes"]
        }
      ];
      setUsuarios(usuariosMock);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar usuários",
        variant: "destructive"
      });
    } finally {
      setCarregandoUsuarios(false);
    }
  };

  const handleNovoUsuario = () => {
    setUsuarioEditando({
      nome: "",
      sobrenome: "",
      email: "",
      role: "vendedor",
      status: "ativo",
      permissoes: []
    });
    setMostrarFormUsuario(true);
  };

  const handleEditarUsuario = (usuario: any) => {
    setUsuarioEditando(usuario);
    setMostrarFormUsuario(true);
  };

  const handleSalvarUsuario = async () => {
    if (!usuarioEditando) return;

    setSalvando(true);
    try {
      // Aqui você implementaria a chamada para a API
      // if (usuarioEditando.id) {
      //   await api.put(`/usuarios/${usuarioEditando.id}`, usuarioEditando);
      // } else {
      //   await api.post('/usuarios', usuarioEditando);
      // }
      
      toast({
        title: "Sucesso",
        description: usuarioEditando.id ? "Usuário atualizado com sucesso!" : "Usuário criado com sucesso!",
        variant: "default"
      });
      
      setMostrarFormUsuario(false);
      setUsuarioEditando(null);
      carregarUsuarios();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar usuário",
        variant: "destructive"
      });
    } finally {
      setSalvando(false);
    }
  };

  const handleExcluirUsuario = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este usuário?")) return;

    setSalvando(true);
    try {
      // Aqui você implementaria a chamada para a API
      // await api.delete(`/usuarios/${id}`);
      
      toast({
        title: "Sucesso",
        description: "Usuário excluído com sucesso!",
        variant: "default"
      });
      
      carregarUsuarios();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir usuário",
        variant: "destructive"
      });
    } finally {
      setSalvando(false);
    }
  };

  const usuariosFiltrados = usuarios.filter(usuario => {
    const matchBusca = usuario.nome.toLowerCase().includes(buscaUsuario.toLowerCase()) ||
                      usuario.sobrenome.toLowerCase().includes(buscaUsuario.toLowerCase()) ||
                      usuario.email.toLowerCase().includes(buscaUsuario.toLowerCase());
    
    const matchRole = filtroRoleUsuario === "todos" || usuario.role === filtroRoleUsuario;
    const matchStatus = filtroStatusUsuario === "todos" || usuario.status === filtroStatusUsuario;
    
    return matchBusca && matchRole && matchStatus;
  });

  const obterBadgeRole = (role: string) => {
    switch (role) {
      case "administrador":
        return <Badge className="bg-red-500 hover:bg-red-600 text-white"><Crown className="h-3 w-3 mr-1" /> Administrador</Badge>;
      case "gerente":
        return <Badge className="bg-blue-500 hover:bg-blue-600 text-white"><Star className="h-3 w-3 mr-1" /> Gerente</Badge>;
      case "vendedor":
        return <Badge className="bg-green-500 hover:bg-green-600 text-white"><UserCheck className="h-3 w-3 mr-1" /> Vendedor</Badge>;
      default:
        return <Badge variant="secondary">Desconhecido</Badge>;
    }
  };

  const obterPermissoesPorRole = (role: string) => {
    switch (role) {
      case "administrador":
        return ["todos"];
      case "gerente":
        return ["vendas", "estoque", "relatorios", "funcionarios", "clientes"];
      case "vendedor":
        return ["vendas", "clientes"];
      default:
        return [];
    }
  };

  const permissoesDisponiveis = [
    { id: "vendas", nome: "Vendas", descricao: "Gerenciar vendas e pedidos" },
    { id: "estoque", nome: "Estoque", descricao: "Gerenciar produtos e estoque" },
    { id: "clientes", nome: "Clientes", descricao: "Gerenciar clientes" },
    { id: "funcionarios", nome: "Funcionários", descricao: "Gerenciar funcionários" },
    { id: "relatorios", nome: "Relatórios", descricao: "Visualizar relatórios" },
    { id: "financeiro", nome: "Financeiro", descricao: "Gerenciar finanças" },
    { id: "configuracoes", nome: "Configurações", descricao: "Configurar sistema" },
    { id: "administracao", nome: "Administração", descricao: "Gerenciar usuários e permissões" }
  ];

  // Funções para o sidebar
  const handleMudarAba = (aba: string) => {
    setAbaAtiva(aba);
  };


  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const obterBadgePlano = (plano: string) => {
    switch (plano) {
      case "premium":
        return <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white"><Crown className="h-3 w-3 mr-1" /> Premium</Badge>;
      case "professional":
        return <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white"><Star className="h-3 w-3 mr-1" /> Professional</Badge>;
      case "enterprise":
        return <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white"><Star className="h-3 w-3 mr-1" /> Enterprise</Badge>;
      default:
        return <Badge variant="secondary">Básico</Badge>;
    }
  };

  const obterBadgeStatus = (status: string) => {
    switch (status) {
      case "ativo":
        return <Badge className="bg-green-500 hover:bg-green-600 text-white">Ativo</Badge>;
      case "suspenso":
        return <Badge variant="destructive">Suspenso</Badge>;
      case "inativo":
        return <Badge variant="secondary">Inativo</Badge>;
      default:
        return <Badge variant="secondary">Desconhecido</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  if (!dadosConta || !dadosTenant || !configuracoes || !dadosContaEditando || !dadosTenantEditando || !configuracoesEditando) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-muted-foreground">Dados não encontrados</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar de configurações */}
      <ConfiguracoesSidebar
        activeTab={abaAtiva}
        onTabChange={handleMudarAba}
        onLogout={handleLogout}
      />

      {/* Conteúdo principal */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">

      {/* Conteúdo das configurações baseado na aba ativa */}

        {/* Dados da Conta */}
        {abaAtiva === "conta" && (
          <div className="space-y-4">
      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Plano Atual</p>
                <div className="flex items-center space-x-2 mt-1">
                  {obterBadgePlano(dadosTenant.plano)}
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
                  {obterBadgeStatus(dadosTenant.status)}
                </div>
              </div>
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Membro Desde</p>
                <p className="text-lg font-bold">{new Date(dadosTenant.data_criacao).toLocaleDateString("pt-BR")}</p>
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
                  <Label htmlFor="nome">Nome</Label>
                  <Input
                    id="nome"
                    value={dadosContaEditando?.nome || ''}
                    onChange={(e) => {
                      setDadosContaEditando(prev => prev ? { ...prev, nome: e.target.value } : null);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sobrenome">Sobrenome</Label>
                  <Input
                    id="sobrenome"
                    value={dadosContaEditando?.sobrenome || ''}
                    onChange={(e) => {
                      setDadosContaEditando(prev => prev ? { ...prev, sobrenome: e.target.value } : null);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={dadosContaEditando?.email || ''}
                    onChange={(e) => {
                      setDadosContaEditando(prev => prev ? { ...prev, email: e.target.value } : null);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={dadosContaEditando?.telefone || ''}
                    onChange={(e) => {
                      setDadosContaEditando(prev => prev ? { ...prev, telefone: e.target.value } : null);
                    }}
                  />
                </div>
                <Button onClick={handleSalvarDadosConta} className="w-full" disabled={salvando}>
                  <Save className="h-4 w-4 mr-2" />
                  {salvando ? 'Salvando...' : 'Salvar Informações'}
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
                  <Label htmlFor="nome">Nome da Empresa</Label>
                  <Input
                    id="nome"
                    value={dadosTenantEditando?.nome || ''}
                    onChange={(e) => {
                      setDadosTenantEditando(prev => prev ? { ...prev, nome: e.target.value } : null);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="razao_social">Razão Social</Label>
                  <Input
                    id="razao_social"
                    value={dadosTenantEditando?.razao_social || ''}
                    onChange={(e) => {
                      setDadosTenantEditando(prev => prev ? { ...prev, razao_social: e.target.value } : null);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ/CPF</Label>
                  <Input
                    id="cnpj"
                    value={dadosTenantEditando?.cnpj || dadosTenantEditando?.cpf || ''}
                    onChange={(e) => {
                      setDadosTenantEditando(prev => prev ? { ...prev, cnpj: e.target.value } : null);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email_empresa">Email da Empresa</Label>
                  <Input
                    id="email_empresa"
                    type="email"
                    value={dadosTenantEditando?.email || ''}
                    onChange={(e) => {
                      setDadosTenantEditando(prev => prev ? { ...prev, email: e.target.value } : null);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefone_empresa">Telefone da Empresa</Label>
                  <Input
                    id="telefone_empresa"
                    value={dadosTenantEditando?.telefone || ''}
                    onChange={(e) => {
                      setDadosTenantEditando(prev => prev ? { ...prev, telefone: e.target.value } : null);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inscricao_estadual">Inscrição Estadual</Label>
                  <Input
                    id="inscricao_estadual"
                    value={dadosTenantEditando?.inscricao_estadual || ''}
                    onChange={(e) => {
                      setDadosTenantEditando(prev => prev ? { ...prev, inscricao_estadual: e.target.value } : null);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inscricao_municipal">Inscrição Municipal</Label>
                  <Input
                    id="inscricao_municipal"
                    value={dadosTenantEditando?.inscricao_municipal || ''}
                    onChange={(e) => {
                      setDadosTenantEditando(prev => prev ? { ...prev, inscricao_municipal: e.target.value } : null);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Logo da Empresa</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                    {dadosTenantEditando?.logo ? (
                      <div className="space-y-2">
                        <img 
                          src={dadosTenantEditando?.logo} 
                          alt="Logo da empresa" 
                          className="h-16 w-16 mx-auto object-contain"
                        />
                        <p className="text-sm text-muted-foreground">Logo atual</p>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground mb-2">
                          Clique para fazer upload da logo
                        </p>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadLogo}
                      className="hidden"
                      id="logo-upload"
                    />
                    <Button variant="outline" size="sm" asChild>
                      <label htmlFor="logo-upload">
                        {dadosTenantEditando?.logo ? 'Alterar Logo' : 'Selecionar Arquivo'}
                      </label>
                    </Button>
                  </div>
                </div>
                <Button onClick={handleSalvarDadosTenant} className="w-full" disabled={salvando}>
                  <Save className="h-4 w-4 mr-2" />
                  {salvando ? 'Salvando...' : 'Salvar Empresa'}
                </Button>
              </CardContent>
            </Card>

            {/* Dados de Endereço */}
            <Card className="bg-gradient-card shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPinIcon className="h-5 w-5 mr-2" />
                  Endereço da Empresa
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="endereco_empresa">Endereço Completo</Label>
                  <Textarea
                    id="endereco_empresa"
                    value={dadosTenantEditando?.endereco || ''}
                    onChange={(e) => {
                      setDadosTenantEditando(prev => prev ? { ...prev, endereco: e.target.value } : null);
                    }}
                    placeholder="Rua, número, bairro, complemento"
                    rows={3}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="cep_empresa">CEP</Label>
                    <Input
                      id="cep_empresa"
                      value={dadosTenantEditando?.cep || ''}
                      onChange={(e) => {
                        setDadosTenantEditando(prev => prev ? { ...prev, cep: e.target.value } : null);
                      }}
                      placeholder="00000-000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cidade_empresa">Cidade</Label>
                    <Input
                      id="cidade_empresa"
                      value={dadosTenantEditando?.cidade || ''}
                      onChange={(e) => {
                        setDadosTenantEditando(prev => prev ? { ...prev, cidade: e.target.value } : null);
                      }}
                      placeholder="Nome da cidade"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estado_empresa">Estado</Label>
                    <Select 
                      value={dadosTenantEditando?.estado || ''} 
                      onValueChange={(value) => setDadosTenantEditando(prev => prev ? { ...prev, estado: value } : null)}
                    >
                      <SelectTrigger>
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
                <Button onClick={handleSalvarDadosTenant} className="w-full" disabled={salvando}>
                  <Save className="h-4 w-4 mr-2" />
                  {salvando ? 'Salvando...' : 'Salvar Endereço'}
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
              <Button onClick={handleAlterarSenha} className="w-full md:w-auto" disabled={salvando}>
                <Key className="h-4 w-4 mr-2" />
                {salvando ? 'Alterando...' : 'Alterar Senha'}
              </Button>
            </CardContent>
          </Card>
          </div>
        )}

        {/* Fornecedores */}
        {abaAtiva === "fornecedores" && (
          <div className="space-y-4">
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
            <div>
              <h2 className="text-2xl font-bold">Fornecedores</h2>
              <p className="text-muted-foreground">
                Gerencie seus fornecedores e parceiros comerciais
              </p>
            </div>
            <Button onClick={handleNovoFornecedor} className="bg-gradient-primary">
              <Plus className="h-4 w-4 mr-2" />
              Novo Fornecedor
            </Button>
          </div>

          {/* Filtros e Busca */}
          <Card className="bg-gradient-card shadow-card">
            <CardContent className="p-4">
              <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-y-0 md:space-x-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Buscar fornecedores..."
                      value={buscaFornecedor}
                      onChange={(e) => setBuscaFornecedor(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={filtroStatusFornecedor} onValueChange={setFiltroStatusFornecedor}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="ativo">Ativos</SelectItem>
                      <SelectItem value="inativo">Inativos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Fornecedores */}
          <Card className="bg-gradient-card shadow-card">
            <CardContent className="p-0">
              {carregandoFornecedores ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-sm text-muted-foreground">Carregando fornecedores...</p>
                  </div>
                </div>
              ) : fornecedoresFiltrados.length === 0 ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-center">
                    <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Nenhum fornecedor encontrado</p>
                    <Button 
                      variant="outline" 
                      className="mt-2"
                      onClick={handleNovoFornecedor}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Primeiro Fornecedor
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="divide-y">
                  {fornecedoresFiltrados.map((fornecedor) => (
                    <div key={fornecedor.id} className="p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <div className="p-2 rounded-lg bg-primary/10">
                              <Building2 className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">{fornecedor.nome}</h3>
                              {fornecedor.razao_social && (
                                <p className="text-sm text-muted-foreground">{fornecedor.razao_social}</p>
                              )}
                            </div>
                            <Badge variant={fornecedor.status === "ativo" ? "default" : "secondary"}>
                              {fornecedor.status === "ativo" ? "Ativo" : "Inativo"}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-3">
                            {fornecedor.cnpj && (
                              <div className="flex items-center space-x-2 text-sm">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">CNPJ:</span>
                                <span>{fornecedor.cnpj}</span>
                              </div>
                            )}
                            {fornecedor.email && (
                              <div className="flex items-center space-x-2 text-sm">
                                <MailIcon className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Email:</span>
                                <span>{fornecedor.email}</span>
                              </div>
                            )}
                            {fornecedor.telefone && (
                              <div className="flex items-center space-x-2 text-sm">
                                <PhoneIcon className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Telefone:</span>
                                <span>{fornecedor.telefone}</span>
                              </div>
                            )}
                            {fornecedor.cidade && fornecedor.estado && (
                              <div className="flex items-center space-x-2 text-sm">
                                <MapPinIcon className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Local:</span>
                                <span>{fornecedor.cidade}, {fornecedor.estado}</span>
                              </div>
                            )}
                            {fornecedor.contato && (
                              <div className="flex items-center space-x-2 text-sm">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Contato:</span>
                                <span>{fornecedor.contato}</span>
                              </div>
                            )}
                          </div>
                          
                          {fornecedor.observacoes && (
                            <div className="mt-3">
                              <p className="text-sm text-muted-foreground">
                                <strong>Observações:</strong> {fornecedor.observacoes}
                              </p>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditarFornecedor(fornecedor)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleExcluirFornecedor(fornecedor.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          </div>
        )}

        {/* Administração */}
        {abaAtiva === "administracao" && (
          <div className="space-y-4">
            <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
              <div>
                <h2 className="text-2xl font-bold">Administração do Sistema</h2>
                <p className="text-muted-foreground">
                  Gerencie usuários, roles e permissões do sistema
                </p>
              </div>
              <Button onClick={handleNovoUsuario} className="bg-gradient-primary">
                <Plus className="h-4 w-4 mr-2" />
                Novo Usuário
              </Button>
            </div>

            {/* Estatísticas de Usuários */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card className="bg-gradient-card shadow-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total de Usuários</p>
                      <p className="text-2xl font-bold">{usuarios.length}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-card shadow-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Administradores</p>
                      <p className="text-2xl font-bold">{usuarios.filter(u => u.role === "administrador").length}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-red-500/10">
                      <Crown className="h-5 w-5 text-red-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-card shadow-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Gerentes</p>
                      <p className="text-2xl font-bold">{usuarios.filter(u => u.role === "gerente").length}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <Star className="h-5 w-5 text-blue-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-card shadow-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Vendedores</p>
                      <p className="text-2xl font-bold">{usuarios.filter(u => u.role === "vendedor").length}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-green-500/10">
                      <UserCheck className="h-5 w-5 text-green-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filtros e Busca */}
            <Card className="bg-gradient-card shadow-card">
              <CardContent className="p-4">
                <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-y-0 md:space-x-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        placeholder="Buscar usuários..."
                        value={buscaUsuario}
                        onChange={(e) => setBuscaUsuario(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <Select value={filtroRoleUsuario} onValueChange={setFiltroRoleUsuario}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos os Roles</SelectItem>
                        <SelectItem value="administrador">Administrador</SelectItem>
                        <SelectItem value="gerente">Gerente</SelectItem>
                        <SelectItem value="vendedor">Vendedor</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={filtroStatusUsuario} onValueChange={setFiltroStatusUsuario}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="ativo">Ativos</SelectItem>
                        <SelectItem value="inativo">Inativos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lista de Usuários */}
            <Card className="bg-gradient-card shadow-card">
              <CardContent className="p-0">
                {carregandoUsuarios ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                      <p className="text-sm text-muted-foreground">Carregando usuários...</p>
                    </div>
                  </div>
                ) : usuariosFiltrados.length === 0 ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="text-center">
                      <UserCog className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Nenhum usuário encontrado</p>
                      <Button 
                        variant="outline" 
                        className="mt-2"
                        onClick={handleNovoUsuario}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Primeiro Usuário
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="divide-y">
                    {usuariosFiltrados.map((usuario) => (
                      <div key={usuario.id} className="p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <div className="p-2 rounded-lg bg-primary/10">
                                <UserCog className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-lg">{usuario.nome} {usuario.sobrenome}</h3>
                                <p className="text-sm text-muted-foreground">{usuario.email}</p>
                              </div>
                              <div className="flex items-center space-x-2">
                                {obterBadgeRole(usuario.role)}
                                <Badge variant={usuario.status === "ativo" ? "default" : "secondary"}>
                                  {usuario.status === "ativo" ? "Ativo" : "Inativo"}
                                </Badge>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-3">
                              <div className="flex items-center space-x-2 text-sm">
                                <Shield className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Role:</span>
                                <span className="capitalize">{usuario.role}</span>
                              </div>
                              <div className="flex items-center space-x-2 text-sm">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Último acesso:</span>
                                <span>{new Date(usuario.ultimo_acesso).toLocaleDateString("pt-BR")}</span>
                              </div>
                              <div className="flex items-center space-x-2 text-sm">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Criado em:</span>
                                <span>{new Date(usuario.data_criacao).toLocaleDateString("pt-BR")}</span>
                              </div>
                            </div>

                            {/* Permissões */}
                            <div className="mt-3">
                              <p className="text-sm font-medium text-muted-foreground mb-2">Permissões:</p>
                              <div className="flex flex-wrap gap-1">
                                {usuario.permissoes.map((permissao) => {
                                  const permissaoInfo = permissoesDisponiveis.find(p => p.id === permissao);
                                  return permissaoInfo ? (
                                    <Badge key={permissao} variant="outline" className="text-xs">
                                      {permissaoInfo.nome}
                                    </Badge>
                                  ) : (
                                    <Badge key={permissao} variant="outline" className="text-xs">
                                      {permissao}
                                    </Badge>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2 ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditarUsuario(usuario)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleExcluirUsuario(usuario.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Funcionários */}
        {abaAtiva === "funcionarios" && (
          <div className="space-y-4">
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
            <div>
              <h2 className="text-2xl font-bold">Funcionários</h2>
              <p className="text-muted-foreground">
                Gerencie os dados dos funcionários, salários e informações de pagamento
              </p>
            </div>
            <Button onClick={handleNovoFuncionario} className="bg-gradient-primary">
              <Plus className="h-4 w-4 mr-2" />
              Novo Funcionário
            </Button>
          </div>

          {/* Filtros e Busca */}
          <Card className="bg-gradient-card shadow-card">
            <CardContent className="p-4">
              <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-y-0 md:space-x-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Buscar funcionários..."
                      value={buscaFuncionario}
                      onChange={(e) => setBuscaFuncionario(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={filtroStatusFuncionario} onValueChange={setFiltroStatusFuncionario}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="ativo">Ativos</SelectItem>
                      <SelectItem value="inativo">Inativos</SelectItem>
                      <SelectItem value="afastado">Afastados</SelectItem>
                      <SelectItem value="demitido">Demitidos</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filtroCargoFuncionario} onValueChange={setFiltroCargoFuncionario}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os Cargos</SelectItem>
                      <SelectItem value="Vendedor">Vendedor</SelectItem>
                      <SelectItem value="Gerente">Gerente</SelectItem>
                      <SelectItem value="Assistente">Assistente</SelectItem>
                      <SelectItem value="Diretor">Diretor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Funcionários */}
          <Card className="bg-gradient-card shadow-card">
            <CardContent className="p-0">
              {carregandoFuncionarios ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-sm text-muted-foreground">Carregando funcionários...</p>
                  </div>
                </div>
              ) : funcionariosFiltrados.length === 0 ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-center">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Nenhum funcionário encontrado</p>
                    <Button 
                      variant="outline" 
                      className="mt-2"
                      onClick={handleNovoFuncionario}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Primeiro Funcionário
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="divide-y">
                  {funcionariosFiltrados.map((funcionario) => (
                    <div key={funcionario.id} className="p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <div className="p-2 rounded-lg bg-primary/10">
                              <Users className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">{funcionario.nome} {funcionario.sobrenome}</h3>
                              <p className="text-sm text-muted-foreground">{funcionario.cargo} - {funcionario.departamento}</p>
                            </div>
                            <Badge variant={funcionario.status === "ativo" ? "default" : "secondary"}>
                              {funcionario.status === "ativo" ? "Ativo" : 
                               funcionario.status === "inativo" ? "Inativo" :
                               funcionario.status === "afastado" ? "Afastado" : "Demitido"}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-3">
                            <div className="flex items-center space-x-2 text-sm">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">CPF:</span>
                              <span>{funcionario.cpf}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm">
                              <MailIcon className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Email:</span>
                              <span>{funcionario.email}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm">
                              <PhoneIcon className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Telefone:</span>
                              <span>{funcionario.telefone}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm">
                              <DollarSign className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Salário:</span>
                              <span>R$ {funcionario.salario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Admissão:</span>
                              <span>{new Date(funcionario.data_admissao).toLocaleDateString("pt-BR")}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm">
                              <Briefcase className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Tipo:</span>
                              <span className="capitalize">{funcionario.tipo_salario}</span>
                            </div>
                          </div>
                          
                          {funcionario.observacoes && (
                            <div className="mt-3">
                              <p className="text-sm text-muted-foreground">
                                <strong>Observações:</strong> {funcionario.observacoes}
                              </p>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditarFuncionario(funcionario)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleExcluirFuncionario(funcionario.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          </div>
        )}

        {/* Pagamentos e Assinatura */}
        {abaAtiva === "pagamentos" && (
          <div className="space-y-4">
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
                    {obterBadgePlano(dadosTenant.plano)}
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
          </div>
        )}

        {/* Métodos de Pagamento */}
        {abaAtiva === "metodos-pagamento" && (
          <div className="space-y-4">
          <div className="grid gap-6">
            {/* Configuração de Métodos de Pagamento */}
            <Card className="bg-gradient-card shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Métodos de Pagamento Disponíveis
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Configure quais métodos de pagamento estarão disponíveis para suas vendas
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(metodosPagamento).map(([key, metodo]) => (
                  <div key={key} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        {key === 'cartao_credito' && <CreditCard className="h-5 w-5 text-primary" />}
                        {key === 'cartao_debito' && <CreditCard className="h-5 w-5 text-blue-500" />}
                        {key === 'pix' && <QrCode className="h-5 w-5 text-green-500" />}
                        {key === 'transferencia' && <Banknote className="h-5 w-5 text-purple-500" />}
                        {key === 'dinheiro' && <Banknote className="h-5 w-5 text-yellow-500" />}
                      </div>
                      <div>
                        <p className="font-medium">{metodo.nome}</p>
                        <p className="text-sm text-muted-foreground">
                          Taxa: {metodo.taxa}%
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Label htmlFor={`taxa-${key}`} className="text-sm">Taxa (%)</Label>
                        <Input
                          id={`taxa-${key}`}
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={metodo.taxa}
                          onChange={(e) => {
                            setMetodosPagamento(prev => ({
                              ...prev,
                              [key]: { ...prev[key as keyof typeof prev], taxa: parseFloat(e.target.value) || 0 }
                            }));
                          }}
                          className="w-20"
                          disabled={key === 'pix' || key === 'dinheiro'}
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setMetodosPagamento(prev => ({
                            ...prev,
                            [key]: { ...prev[key as keyof typeof prev], ativo: !prev[key as keyof typeof prev].ativo }
                          }));
                        }}
                      >
                        {metodo.ativo ? (
                          <ToggleRight className="h-5 w-5 text-primary" />
                        ) : (
                          <ToggleLeft className="h-5 w-5 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
                <Button onClick={handleSalvarMetodosPagamento} className="w-full" disabled={salvando}>
                  <Save className="h-4 w-4 mr-2" />
                  {salvando ? 'Salvando...' : 'Salvar Métodos de Pagamento'}
                </Button>
              </CardContent>
            </Card>

            {/* Configuração PIX */}
            <Card className="bg-gradient-card shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <QrCode className="h-5 w-5 mr-2" />
                  Configuração PIX
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Configure suas chaves PIX e QR Code para recebimentos
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="chave_pix">Chave PIX</Label>
                    <Input
                      id="chave_pix"
                      placeholder="Digite sua chave PIX"
                      value={dadosPix.chave_pix}
                      onChange={(e) => setDadosPix(prev => ({ ...prev, chave_pix: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nome_titular_pix">Nome do Titular</Label>
                    <Input
                      id="nome_titular_pix"
                      placeholder="Nome do titular da conta"
                      value={dadosPix.nome_titular}
                      onChange={(e) => setDadosPix(prev => ({ ...prev, nome_titular: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cpf_cnpj_pix">CPF/CNPJ</Label>
                    <Input
                      id="cpf_cnpj_pix"
                      placeholder="CPF ou CNPJ do titular"
                      value={dadosPix.cpf_cnpj}
                      onChange={(e) => setDadosPix(prev => ({ ...prev, cpf_cnpj: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>QR Code PIX</Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                      {dadosPix.qr_code ? (
                        <div className="space-y-2">
                          <img 
                            src={dadosPix.qr_code} 
                            alt="QR Code PIX" 
                            className="h-24 w-24 mx-auto object-contain"
                          />
                          <p className="text-sm text-muted-foreground">QR Code atual</p>
                        </div>
                      ) : (
                        <>
                          <QrCode className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground mb-2">
                            Faça upload do QR Code PIX
                          </p>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleUploadQrCodePix}
                        className="hidden"
                        id="qr-code-upload"
                      />
                      <Button variant="outline" size="sm" asChild>
                        <label htmlFor="qr-code-upload">
                          {dadosPix.qr_code ? 'Alterar QR Code' : 'Selecionar Arquivo'}
                        </label>
                      </Button>
                    </div>
                  </div>
                </div>
                <Button onClick={handleSalvarDadosPix} className="w-full" disabled={salvando}>
                  <Save className="h-4 w-4 mr-2" />
                  {salvando ? 'Salvando...' : 'Salvar Configuração PIX'}
                </Button>
              </CardContent>
            </Card>

            {/* Dados Bancários para Transferência */}
            <Card className="bg-gradient-card shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Banknote className="h-5 w-5 mr-2" />
                  Dados Bancários para Transferência
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Configure os dados bancários para recebimento via transferência
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="banco">Banco</Label>
                    <Input
                      id="banco"
                      placeholder="Nome do banco"
                      value={dadosBancarios.banco}
                      onChange={(e) => setDadosBancarios(prev => ({ ...prev, banco: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="agencia">Agência</Label>
                    <Input
                      id="agencia"
                      placeholder="Número da agência"
                      value={dadosBancarios.agencia}
                      onChange={(e) => setDadosBancarios(prev => ({ ...prev, agencia: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="conta">Conta</Label>
                    <Input
                      id="conta"
                      placeholder="Número da conta"
                      value={dadosBancarios.conta}
                      onChange={(e) => setDadosBancarios(prev => ({ ...prev, conta: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="digito">Dígito</Label>
                    <Input
                      id="digito"
                      placeholder="Dígito da conta"
                      value={dadosBancarios.digito}
                      onChange={(e) => setDadosBancarios(prev => ({ ...prev, digito: e.target.value }))}
                      maxLength={1}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tipo_conta">Tipo de Conta</Label>
                    <Select 
                      value={dadosBancarios.tipo_conta} 
                      onValueChange={(value) => setDadosBancarios(prev => ({ ...prev, tipo_conta: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="corrente">Conta Corrente</SelectItem>
                        <SelectItem value="poupanca">Conta Poupança</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nome_titular_banco">Nome do Titular</Label>
                    <Input
                      id="nome_titular_banco"
                      placeholder="Nome do titular da conta"
                      value={dadosBancarios.nome_titular}
                      onChange={(e) => setDadosBancarios(prev => ({ ...prev, nome_titular: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cpf_cnpj_banco">CPF/CNPJ</Label>
                    <Input
                      id="cpf_cnpj_banco"
                      placeholder="CPF ou CNPJ do titular"
                      value={dadosBancarios.cpf_cnpj}
                      onChange={(e) => setDadosBancarios(prev => ({ ...prev, cpf_cnpj: e.target.value }))}
                    />
                  </div>
                </div>
                <Button onClick={handleSalvarDadosBancarios} className="w-full" disabled={salvando}>
                  <Save className="h-4 w-4 mr-2" />
                  {salvando ? 'Salvando...' : 'Salvar Dados Bancários'}
                </Button>
              </CardContent>
            </Card>

            {/* Resumo dos Métodos Ativos */}
            <Card className="bg-gradient-card shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  Resumo dos Métodos Ativos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {Object.entries(metodosPagamento)
                    .filter(([_, metodo]) => metodo.ativo)
                    .map(([key, metodo]) => (
                    <div key={key} className="flex items-center space-x-3 p-3 border rounded-lg">
                      <div className="p-2 rounded-lg bg-primary/10">
                        {key === 'cartao_credito' && <CreditCard className="h-4 w-4 text-primary" />}
                        {key === 'cartao_debito' && <CreditCard className="h-4 w-4 text-blue-500" />}
                        {key === 'pix' && <QrCode className="h-4 w-4 text-green-500" />}
                        {key === 'transferencia' && <Banknote className="h-4 w-4 text-purple-500" />}
                        {key === 'dinheiro' && <Banknote className="h-4 w-4 text-yellow-500" />}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{metodo.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          Taxa: {metodo.taxa}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          </div>
        )}

        {/* Tema e Personalização */}
        {abaAtiva === "tema" && (
          <div className="space-y-4">
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
                  <Select 
                    value={configuracoesEditando?.tema || 'sistema'} 
                    onValueChange={(value: 'claro' | 'escuro' | 'sistema') => {
                      setConfiguracoesEditando(prev => prev ? { ...prev, tema: value } : null);
                    }}
                  >
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
                <Button onClick={handleSalvarConfiguracoes} className="w-full" disabled={salvando}>
                  <Save className="h-4 w-4 mr-2" />
                  {salvando ? 'Salvando...' : 'Salvar Tema'}
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
                  <Select 
                    value={configuracoesEditando?.idioma || 'pt-BR'} 
                    onValueChange={(value) => {
                      setConfiguracoesEditando(prev => prev ? { ...prev, idioma: value } : null);
                    }}
                  >
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
                  <Select 
                    value={configuracoesEditando?.fuso_horario || 'America/Sao_Paulo'} 
                    onValueChange={(value) => {
                      setConfiguracoesEditando(prev => prev ? { ...prev, fuso_horario: value } : null);
                    }}
                  >
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
                  <Select 
                    value={configuracoesEditando?.moeda || 'BRL'} 
                    onValueChange={(value) => {
                      setConfiguracoesEditando(prev => prev ? { ...prev, moeda: value } : null);
                    }}
                  >
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
                <Button onClick={handleSalvarConfiguracoes} className="w-full" disabled={salvando}>
                  <Save className="h-4 w-4 mr-2" />
                  {salvando ? 'Salvando...' : 'Salvar Localização'}
                </Button>
              </CardContent>
            </Card>
          </div>
          </div>
        )}

        {/* Notificações */}
        {abaAtiva === "notificacoes" && (
          <div className="space-y-4">
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
                      checked={configuracoesEditando?.notificacoes.email || false}
                      onCheckedChange={(checked) => {
                        setConfiguracoesEditando(prev => prev ? {
                          ...prev,
                          notificacoes: {
                            ...prev.notificacoes,
                            email: checked
                          }
                        } : null);
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Push</Label>
                      <p className="text-sm text-muted-foreground">Notificações no navegador</p>
                    </div>
                    <Switch
                      checked={configuracoesEditando?.notificacoes.push || false}
                      onCheckedChange={(checked) => {
                        setConfiguracoesEditando(prev => prev ? {
                          ...prev,
                          notificacoes: {
                            ...prev.notificacoes,
                            push: checked
                          }
                        } : null);
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>SMS</Label>
                      <p className="text-sm text-muted-foreground">Notificações por SMS</p>
                    </div>
                    <Switch
                      checked={configuracoesEditando?.notificacoes.sms || false}
                      onCheckedChange={(checked) => {
                        setConfiguracoesEditando(prev => prev ? {
                          ...prev,
                          notificacoes: {
                            ...prev.notificacoes,
                            sms: checked
                          }
                        } : null);
                      }}
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
                      checked={configuracoesEditando?.notificacoes.vendas || false}
                      onCheckedChange={(checked) => {
                        setConfiguracoesEditando(prev => prev ? {
                          ...prev,
                          notificacoes: {
                            ...prev.notificacoes,
                            vendas: checked
                          }
                        } : null);
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Estoque</Label>
                      <p className="text-sm text-muted-foreground">Produtos com estoque baixo</p>
                    </div>
                    <Switch
                      checked={configuracoesEditando?.notificacoes.estoque || false}
                      onCheckedChange={(checked) => {
                        setConfiguracoesEditando(prev => prev ? {
                          ...prev,
                          notificacoes: {
                            ...prev.notificacoes,
                            estoque: checked
                          }
                        } : null);
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Financeiro</Label>
                      <p className="text-sm text-muted-foreground">Pagamentos e recebimentos</p>
                    </div>
                    <Switch
                      checked={configuracoesEditando?.notificacoes.financeiro || false}
                      onCheckedChange={(checked) => {
                        setConfiguracoesEditando(prev => prev ? {
                          ...prev,
                          notificacoes: {
                            ...prev.notificacoes,
                            financeiro: checked
                          }
                        } : null);
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Clientes</Label>
                      <p className="text-sm text-muted-foreground">Novos clientes e atualizações</p>
                    </div>
                    <Switch
                      checked={configuracoesEditando?.notificacoes.clientes || false}
                      onCheckedChange={(checked) => {
                        setConfiguracoesEditando(prev => prev ? {
                          ...prev,
                          notificacoes: {
                            ...prev.notificacoes,
                            clientes: checked
                          }
                        } : null);
                      }}
                    />
                  </div>
                </div>
              </div>

              <Button onClick={handleSalvarConfiguracoes} className="w-full" disabled={salvando}>
                <Save className="h-4 w-4 mr-2" />
                {salvando ? 'Salvando...' : 'Salvar Notificações'}
              </Button>
            </CardContent>
          </Card>
          </div>
        )}

        {/* Segurança */}
        {abaAtiva === "seguranca" && (
          <div className="space-y-4">
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
                    checked={configuracoesEditando?.seguranca.autenticacao_2fa || false}
                    onCheckedChange={(checked) => {
                      setConfiguracoesEditando(prev => prev ? {
                        ...prev,
                        seguranca: {
                          ...prev.seguranca,
                          autenticacao_2fa: checked
                        }
                      } : null);
                    }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Sessão Longa</Label>
                    <p className="text-sm text-muted-foreground">Manter login por mais tempo</p>
                  </div>
                  <Switch
                    checked={configuracoesEditando?.seguranca.sessao_longa || false}
                    onCheckedChange={(checked) => {
                      setConfiguracoesEditando(prev => prev ? {
                        ...prev,
                        seguranca: {
                          ...prev.seguranca,
                          sessao_longa: checked
                        }
                      } : null);
                    }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Log de Atividade</Label>
                    <p className="text-sm text-muted-foreground">Registrar ações na conta</p>
                  </div>
                  <Switch
                    checked={configuracoesEditando?.seguranca.log_atividade || false}
                    onCheckedChange={(checked) => {
                      setConfiguracoesEditando(prev => prev ? {
                        ...prev,
                        seguranca: {
                          ...prev.seguranca,
                          log_atividade: checked
                        }
                      } : null);
                    }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Backup Automático</Label>
                    <p className="text-sm text-muted-foreground">Backup diário dos dados</p>
                  </div>
                  <Switch
                    checked={configuracoesEditando?.seguranca.backup_automatico || false}
                    onCheckedChange={(checked) => {
                      setConfiguracoesEditando(prev => prev ? {
                        ...prev,
                        seguranca: {
                          ...prev.seguranca,
                          backup_automatico: checked
                        }
                      } : null);
                    }}
                  />
                </div>
                <Button onClick={handleSalvarConfiguracoes} className="w-full" disabled={salvando}>
                  <Save className="h-4 w-4 mr-2" />
                  {salvando ? 'Salvando...' : 'Salvar Segurança'}
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
          </div>
        )}

        {/* Modal de Fornecedor */}
      {mostrarFormFornecedor && fornecedorEditando && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-card shadow-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Building2 className="h-5 w-5 mr-2" />
                  {fornecedorEditando.id ? "Editar Fornecedor" : "Novo Fornecedor"}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setMostrarFormFornecedor(false);
                    setFornecedorEditando(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nome_fornecedor">Nome *</Label>
                  <Input
                    id="nome_fornecedor"
                    value={fornecedorEditando.nome}
                    onChange={(e) => setFornecedorEditando(prev => prev ? { ...prev, nome: e.target.value } : null)}
                    placeholder="Nome do fornecedor"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="razao_social_fornecedor">Razão Social</Label>
                  <Input
                    id="razao_social_fornecedor"
                    value={fornecedorEditando.razao_social || ""}
                    onChange={(e) => setFornecedorEditando(prev => prev ? { ...prev, razao_social: e.target.value } : null)}
                    placeholder="Razão social"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cnpj_fornecedor">CNPJ</Label>
                  <Input
                    id="cnpj_fornecedor"
                    value={fornecedorEditando.cnpj || ""}
                    onChange={(e) => setFornecedorEditando(prev => prev ? { ...prev, cnpj: e.target.value } : null)}
                    placeholder="00.000.000/0000-00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email_fornecedor">Email</Label>
                  <Input
                    id="email_fornecedor"
                    type="email"
                    value={fornecedorEditando.email || ""}
                    onChange={(e) => setFornecedorEditando(prev => prev ? { ...prev, email: e.target.value } : null)}
                    placeholder="email@exemplo.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefone_fornecedor">Telefone</Label>
                  <Input
                    id="telefone_fornecedor"
                    value={fornecedorEditando.telefone || ""}
                    onChange={(e) => setFornecedorEditando(prev => prev ? { ...prev, telefone: e.target.value } : null)}
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contato_fornecedor">Contato</Label>
                  <Input
                    id="contato_fornecedor"
                    value={fornecedorEditando.contato || ""}
                    onChange={(e) => setFornecedorEditando(prev => prev ? { ...prev, contato: e.target.value } : null)}
                    placeholder="Nome do contato"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cep_fornecedor">CEP</Label>
                  <Input
                    id="cep_fornecedor"
                    value={fornecedorEditando.cep || ""}
                    onChange={(e) => setFornecedorEditando(prev => prev ? { ...prev, cep: e.target.value } : null)}
                    placeholder="00000-000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cidade_fornecedor">Cidade</Label>
                  <Input
                    id="cidade_fornecedor"
                    value={fornecedorEditando.cidade || ""}
                    onChange={(e) => setFornecedorEditando(prev => prev ? { ...prev, cidade: e.target.value } : null)}
                    placeholder="Cidade"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estado_fornecedor">Estado</Label>
                  <Select 
                    value={fornecedorEditando.estado || ""} 
                    onValueChange={(value) => setFornecedorEditando(prev => prev ? { ...prev, estado: value } : null)}
                  >
                    <SelectTrigger>
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
                <div className="space-y-2">
                  <Label htmlFor="status_fornecedor">Status</Label>
                  <Select 
                    value={fornecedorEditando.status || "ativo"} 
                    onValueChange={(value) => setFornecedorEditando(prev => prev ? { ...prev, status: value } : null)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="inativo">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="endereco_fornecedor">Endereço</Label>
                <Textarea
                  id="endereco_fornecedor"
                  value={fornecedorEditando.endereco || ""}
                  onChange={(e) => setFornecedorEditando(prev => prev ? { ...prev, endereco: e.target.value } : null)}
                  placeholder="Endereço completo"
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="observacoes_fornecedor">Observações</Label>
                <Textarea
                  id="observacoes_fornecedor"
                  value={fornecedorEditando.observacoes || ""}
                  onChange={(e) => setFornecedorEditando(prev => prev ? { ...prev, observacoes: e.target.value } : null)}
                  placeholder="Observações sobre o fornecedor"
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setMostrarFormFornecedor(false);
                    setFornecedorEditando(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button onClick={handleSalvarFornecedor} disabled={salvando}>
                  <Save className="h-4 w-4 mr-2" />
                  {salvando ? 'Salvando...' : 'Salvar Fornecedor'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

        {/* Modal de Usuário */}
        {mostrarFormUsuario && usuarioEditando && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-card shadow-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <UserCog className="h-5 w-5 mr-2" />
                    {usuarioEditando.id ? "Editar Usuário" : "Novo Usuário"}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setMostrarFormUsuario(false);
                      setUsuarioEditando(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Informações Básicas */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Informações Básicas
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="nome_usuario">Nome *</Label>
                      <Input
                        id="nome_usuario"
                        value={usuarioEditando.nome}
                        onChange={(e) => setUsuarioEditando(prev => prev ? { ...prev, nome: e.target.value } : null)}
                        placeholder="Nome do usuário"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sobrenome_usuario">Sobrenome *</Label>
                      <Input
                        id="sobrenome_usuario"
                        value={usuarioEditando.sobrenome}
                        onChange={(e) => setUsuarioEditando(prev => prev ? { ...prev, sobrenome: e.target.value } : null)}
                        placeholder="Sobrenome do usuário"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email_usuario">Email *</Label>
                      <Input
                        id="email_usuario"
                        type="email"
                        value={usuarioEditando.email}
                        onChange={(e) => setUsuarioEditando(prev => prev ? { ...prev, email: e.target.value } : null)}
                        placeholder="email@exemplo.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="senha_usuario">Senha {!usuarioEditando.id && "*"}</Label>
                      <div className="relative">
                        <Input
                          id="senha_usuario"
                          type={mostrarSenha ? "text" : "password"}
                          value={usuarioEditando.senha || ""}
                          onChange={(e) => setUsuarioEditando(prev => prev ? { ...prev, senha: e.target.value } : null)}
                          placeholder="Digite a senha"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setMostrarSenha(!mostrarSenha)}
                        >
                          {mostrarSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Role e Status */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center">
                    <Shield className="h-5 w-5 mr-2" />
                    Role e Status
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="role_usuario">Role *</Label>
                      <Select 
                        value={usuarioEditando.role} 
                        onValueChange={(value) => {
                          const permissoesPadrao = obterPermissoesPorRole(value);
                          setUsuarioEditando(prev => prev ? { 
                            ...prev, 
                            role: value,
                            permissoes: permissoesPadrao
                          } : null);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="administrador">
                            <div className="flex items-center space-x-2">
                              <Crown className="h-4 w-4 text-red-500" />
                              <span>Administrador</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="gerente">
                            <div className="flex items-center space-x-2">
                              <Star className="h-4 w-4 text-blue-500" />
                              <span>Gerente</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="vendedor">
                            <div className="flex items-center space-x-2">
                              <UserCheck className="h-4 w-4 text-green-500" />
                              <span>Vendedor</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status_usuario">Status</Label>
                      <Select 
                        value={usuarioEditando.status} 
                        onValueChange={(value) => setUsuarioEditando(prev => prev ? { ...prev, status: value } : null)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ativo">Ativo</SelectItem>
                          <SelectItem value="inativo">Inativo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Permissões */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center">
                    <Key className="h-5 w-5 mr-2" />
                    Permissões
                  </h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    {permissoesDisponiveis.map((permissao) => (
                      <div key={permissao.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                        <input
                          type="checkbox"
                          id={`permissao-${permissao.id}`}
                          checked={usuarioEditando.permissoes.includes(permissao.id)}
                          onChange={(e) => {
                            const novasPermissoes = e.target.checked
                              ? [...usuarioEditando.permissoes, permissao.id]
                              : usuarioEditando.permissoes.filter(p => p !== permissao.id);
                            setUsuarioEditando(prev => prev ? { ...prev, permissoes: novasPermissoes } : null);
                          }}
                          className="rounded border-gray-300"
                        />
                        <div className="flex-1">
                          <Label htmlFor={`permissao-${permissao.id}`} className="font-medium">
                            {permissao.nome}
                          </Label>
                          <p className="text-sm text-muted-foreground">{permissao.descricao}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setMostrarFormUsuario(false);
                      setUsuarioEditando(null);
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleSalvarUsuario} disabled={salvando}>
                    <Save className="h-4 w-4 mr-2" />
                    {salvando ? 'Salvando...' : 'Salvar Usuário'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Modal de Funcionário */}
        {mostrarFormFuncionario && funcionarioEditando && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-card shadow-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    {funcionarioEditando.id ? "Editar Funcionário" : "Novo Funcionário"}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setMostrarFormFuncionario(false);
                      setFuncionarioEditando(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Informações Pessoais */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Informações Pessoais
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="nome_funcionario">Nome *</Label>
                      <Input
                        id="nome_funcionario"
                        value={funcionarioEditando.nome}
                        onChange={(e) => setFuncionarioEditando(prev => prev ? { ...prev, nome: e.target.value } : null)}
                        placeholder="Nome do funcionário"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sobrenome_funcionario">Sobrenome *</Label>
                      <Input
                        id="sobrenome_funcionario"
                        value={funcionarioEditando.sobrenome}
                        onChange={(e) => setFuncionarioEditando(prev => prev ? { ...prev, sobrenome: e.target.value } : null)}
                        placeholder="Sobrenome do funcionário"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cpf_funcionario">CPF *</Label>
                      <Input
                        id="cpf_funcionario"
                        value={funcionarioEditando.cpf}
                        onChange={(e) => setFuncionarioEditando(prev => prev ? { ...prev, cpf: e.target.value } : null)}
                        placeholder="000.000.000-00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rg_funcionario">RG</Label>
                      <Input
                        id="rg_funcionario"
                        value={funcionarioEditando.rg || ""}
                        onChange={(e) => setFuncionarioEditando(prev => prev ? { ...prev, rg: e.target.value } : null)}
                        placeholder="00.000.000-0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email_funcionario">Email</Label>
                      <Input
                        id="email_funcionario"
                        type="email"
                        value={funcionarioEditando.email || ""}
                        onChange={(e) => setFuncionarioEditando(prev => prev ? { ...prev, email: e.target.value } : null)}
                        placeholder="email@exemplo.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="telefone_funcionario">Telefone</Label>
                      <Input
                        id="telefone_funcionario"
                        value={funcionarioEditando.telefone || ""}
                        onChange={(e) => setFuncionarioEditando(prev => prev ? { ...prev, telefone: e.target.value } : null)}
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="data_nascimento_funcionario">Data de Nascimento</Label>
                      <Input
                        id="data_nascimento_funcionario"
                        type="date"
                        value={funcionarioEditando.data_nascimento || ""}
                        onChange={(e) => setFuncionarioEditando(prev => prev ? { ...prev, data_nascimento: e.target.value } : null)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sexo_funcionario">Sexo</Label>
                      <Select 
                        value={funcionarioEditando.sexo || "masculino"} 
                        onValueChange={(value) => setFuncionarioEditando(prev => prev ? { ...prev, sexo: value } : null)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="masculino">Masculino</SelectItem>
                          <SelectItem value="feminino">Feminino</SelectItem>
                          <SelectItem value="outro">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="estado_civil_funcionario">Estado Civil</Label>
                      <Select 
                        value={funcionarioEditando.estado_civil || "solteiro"} 
                        onValueChange={(value) => setFuncionarioEditando(prev => prev ? { ...prev, estado_civil: value } : null)}
                      >
                        <SelectTrigger>
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
                </div>

                {/* Informações Profissionais */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center">
                    <Briefcase className="h-5 w-5 mr-2" />
                    Informações Profissionais
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="cargo_funcionario">Cargo *</Label>
                      <Input
                        id="cargo_funcionario"
                        value={funcionarioEditando.cargo}
                        onChange={(e) => setFuncionarioEditando(prev => prev ? { ...prev, cargo: e.target.value } : null)}
                        placeholder="Cargo do funcionário"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="departamento_funcionario">Departamento</Label>
                      <Input
                        id="departamento_funcionario"
                        value={funcionarioEditando.departamento || ""}
                        onChange={(e) => setFuncionarioEditando(prev => prev ? { ...prev, departamento: e.target.value } : null)}
                        placeholder="Departamento"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="data_admissao_funcionario">Data de Admissão *</Label>
                      <Input
                        id="data_admissao_funcionario"
                        type="date"
                        value={funcionarioEditando.data_admissao}
                        onChange={(e) => setFuncionarioEditando(prev => prev ? { ...prev, data_admissao: e.target.value } : null)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="data_demissao_funcionario">Data de Demissão</Label>
                      <Input
                        id="data_demissao_funcionario"
                        type="date"
                        value={funcionarioEditando.data_demissao || ""}
                        onChange={(e) => setFuncionarioEditando(prev => prev ? { ...prev, data_demissao: e.target.value || null } : null)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status_funcionario">Status</Label>
                      <Select 
                        value={funcionarioEditando.status || "ativo"} 
                        onValueChange={(value) => setFuncionarioEditando(prev => prev ? { ...prev, status: value } : null)}
                      >
                        <SelectTrigger>
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
                  </div>
                </div>

                {/* Informações Salariais */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center">
                    <DollarSign className="h-5 w-5 mr-2" />
                    Informações Salariais
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="tipo_salario_funcionario">Tipo de Salário</Label>
                      <Select 
                        value={funcionarioEditando.tipo_salario || "mensal"} 
                        onValueChange={(value) => setFuncionarioEditando(prev => prev ? { ...prev, tipo_salario: value } : null)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mensal">Mensal</SelectItem>
                          <SelectItem value="horista">Horista</SelectItem>
                          <SelectItem value="comissionado">Comissionado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="salario_funcionario">Salário *</Label>
                      <Input
                        id="salario_funcionario"
                        type="number"
                        step="0.01"
                        min="0"
                        value={funcionarioEditando.salario}
                        onChange={(e) => setFuncionarioEditando(prev => prev ? { ...prev, salario: parseFloat(e.target.value) || 0 } : null)}
                        placeholder="0.00"
                      />
                    </div>
                    {funcionarioEditando.tipo_salario === "horista" && (
                      <div className="space-y-2">
                        <Label htmlFor="valor_hora_funcionario">Valor por Hora</Label>
                        <Input
                          id="valor_hora_funcionario"
                          type="number"
                          step="0.01"
                          min="0"
                          value={funcionarioEditando.valor_hora || 0}
                          onChange={(e) => setFuncionarioEditando(prev => prev ? { ...prev, valor_hora: parseFloat(e.target.value) || 0 } : null)}
                          placeholder="0.00"
                        />
                      </div>
                    )}
                    {funcionarioEditando.tipo_salario === "comissionado" && (
                      <div className="space-y-2">
                        <Label htmlFor="comissao_funcionario">Comissão (%)</Label>
                        <Input
                          id="comissao_funcionario"
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={funcionarioEditando.comissao_percentual || 0}
                          onChange={(e) => setFuncionarioEditando(prev => prev ? { ...prev, comissao_percentual: parseFloat(e.target.value) || 0 } : null)}
                          placeholder="0.00"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Endereço */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center">
                    <MapPinIcon className="h-5 w-5 mr-2" />
                    Endereço
                  </h3>
                  <div className="space-y-2">
                    <Label htmlFor="endereco_funcionario">Endereço Completo</Label>
                    <Textarea
                      id="endereco_funcionario"
                      value={funcionarioEditando.endereco || ""}
                      onChange={(e) => setFuncionarioEditando(prev => prev ? { ...prev, endereco: e.target.value } : null)}
                      placeholder="Endereço completo"
                      rows={3}
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="cep_funcionario">CEP</Label>
                      <Input
                        id="cep_funcionario"
                        value={funcionarioEditando.cep || ""}
                        onChange={(e) => setFuncionarioEditando(prev => prev ? { ...prev, cep: e.target.value } : null)}
                        placeholder="00000-000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cidade_funcionario">Cidade</Label>
                      <Input
                        id="cidade_funcionario"
                        value={funcionarioEditando.cidade || ""}
                        onChange={(e) => setFuncionarioEditando(prev => prev ? { ...prev, cidade: e.target.value } : null)}
                        placeholder="Cidade"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="estado_funcionario">Estado</Label>
                      <Select 
                        value={funcionarioEditando.estado || ""} 
                        onValueChange={(value) => setFuncionarioEditando(prev => prev ? { ...prev, estado: value } : null)}
                      >
                        <SelectTrigger>
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
                </div>

                {/* Dados Bancários */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center">
                    <CreditCard className="h-5 w-5 mr-2" />
                    Dados Bancários
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="banco_funcionario">Banco</Label>
                      <Input
                        id="banco_funcionario"
                        value={funcionarioEditando.banco || ""}
                        onChange={(e) => setFuncionarioEditando(prev => prev ? { ...prev, banco: e.target.value } : null)}
                        placeholder="Nome do banco"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="agencia_funcionario">Agência</Label>
                      <Input
                        id="agencia_funcionario"
                        value={funcionarioEditando.agencia || ""}
                        onChange={(e) => setFuncionarioEditando(prev => prev ? { ...prev, agencia: e.target.value } : null)}
                        placeholder="Número da agência"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="conta_funcionario">Conta</Label>
                      <Input
                        id="conta_funcionario"
                        value={funcionarioEditando.conta || ""}
                        onChange={(e) => setFuncionarioEditando(prev => prev ? { ...prev, conta: e.target.value } : null)}
                        placeholder="Número da conta"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="digito_funcionario">Dígito</Label>
                      <Input
                        id="digito_funcionario"
                        value={funcionarioEditando.digito || ""}
                        onChange={(e) => setFuncionarioEditando(prev => prev ? { ...prev, digito: e.target.value } : null)}
                        placeholder="Dígito da conta"
                        maxLength={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tipo_conta_funcionario">Tipo de Conta</Label>
                      <Select 
                        value={funcionarioEditando.tipo_conta || "corrente"} 
                        onValueChange={(value) => setFuncionarioEditando(prev => prev ? { ...prev, tipo_conta: value } : null)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="corrente">Conta Corrente</SelectItem>
                          <SelectItem value="poupanca">Conta Poupança</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pix_funcionario">PIX</Label>
                      <Input
                        id="pix_funcionario"
                        value={funcionarioEditando.pix || ""}
                        onChange={(e) => setFuncionarioEditando(prev => prev ? { ...prev, pix: e.target.value } : null)}
                        placeholder="Chave PIX"
                      />
                    </div>
                  </div>
                </div>

                {/* Observações */}
                <div className="space-y-2">
                  <Label htmlFor="observacoes_funcionario">Observações</Label>
                  <Textarea
                    id="observacoes_funcionario"
                    value={funcionarioEditando.observacoes || ""}
                    onChange={(e) => setFuncionarioEditando(prev => prev ? { ...prev, observacoes: e.target.value } : null)}
                    placeholder="Observações sobre o funcionário"
                    rows={3}
                  />
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setMostrarFormFuncionario(false);
                      setFuncionarioEditando(null);
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleSalvarFuncionario} disabled={salvando}>
                    <Save className="h-4 w-4 mr-2" />
                    {salvando ? 'Salvando...' : 'Salvar Funcionário'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
