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
import { useFornecedores } from "@/hooks/useFornecedores";
import { useFuncionarios } from "@/hooks/useFuncionarios";
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

  const {
    fornecedores,
    carregando: carregandoFornecedores,
    salvando: salvandoFornecedor,
    carregarFornecedores,
    criarFornecedor,
    atualizarFornecedor,
    excluirFornecedor,
    buscarCep: buscarCepFornecedor
  } = useFornecedores();

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
  const [buscaFornecedor, setBuscaFornecedor] = useState("");
  const [filtroStatusFornecedor, setFiltroStatusFornecedor] = useState("todos");

  // Estados para funcionários
  const [buscaFuncionario, setBuscaFuncionario] = useState("");
  const [filtroStatusFuncionario, setFiltroStatusFuncionario] = useState("todos");
  const [filtroCargoFuncionario, setFiltroCargoFuncionario] = useState("todos");
  
  // Hook para funcionários
  const { 
    funcionarios, 
    carregando: carregandoFuncionarios, 
    buscarFuncionarios, 
    excluirFuncionario 
  } = useFuncionarios();
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
    carregarFuncionarios();
    carregarUsuarios();
  }, []);

  // Carregar dados quando a aba for ativada
  useEffect(() => {
    if (abaAtiva === "fornecedores" && !carregandoFornecedores) {
      carregarFornecedores();
    } else if (abaAtiva === "funcionarios" && !carregandoFuncionarios) {
      carregarFuncionarios();
    }
  }, [abaAtiva]); // Removido carregarFornecedores das dependências

  // Recarregar funcionários quando os filtros mudarem (com debounce para busca)
  useEffect(() => {
    if (abaAtiva === "funcionarios") {
      const timeoutId = setTimeout(() => {
        carregarFuncionarios();
      }, buscaFuncionario ? 500 : 0); // Debounce de 500ms apenas para busca

      return () => clearTimeout(timeoutId);
    }
  }, [buscaFuncionario, filtroStatusFuncionario, filtroCargoFuncionario]);

  // Função para buscar dados do CEP
  const buscarCep = async (cep: string) => {
    // Remove caracteres não numéricos
    const cepLimpo = cep.replace(/\D/g, '');
    
    // Verifica se o CEP tem 8 dígitos
    if (cepLimpo.length === 8) {
      try {
        const data = await buscarCepFornecedor(cepLimpo);
        
        if (data) {
          // Atualiza os dados do tenant com as informações do CEP
          setDadosTenantEditando(prev => prev ? {
            ...prev,
            endereco: data.endereco || '',
            cidade: data.cidade || '',
            estado: data.estado || '',
            cep: cep
          } : null);
          
          toast({
            title: "Sucesso",
            description: "Endereço preenchido automaticamente!",
            variant: "default"
          });
        } else {
          toast({
            title: "Aviso",
            description: "CEP não encontrado",
            variant: "destructive"
          });
        }
      } catch (error) {
        toast({
          title: "Erro",
          description: "Erro ao buscar CEP",
          variant: "destructive"
        });
      }
    }
  };



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

  // Funções para gerenciar fornecedores (usando hook useFornecedores)

  const handleNovoFornecedor = () => {
    navigate('/dashboard/novo-fornecedor');
  };

  const handleEditarFornecedor = (fornecedor: any) => {
    navigate(`/dashboard/novo-fornecedor/${fornecedor.id}`);
  };


  const handleExcluirFornecedor = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este fornecedor?")) return;

    try {
      await excluirFornecedor(id);
      // O hook já atualiza a lista automaticamente
    } catch (error) {
      // O hook já exibe o toast de erro
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
    try {
      const params: any = {
        page: 1,
        limit: 100
      };

      if (buscaFuncionario) {
        params.q = buscaFuncionario;
      }

      if (filtroStatusFuncionario !== "todos") {
        params.filtroStatus = filtroStatusFuncionario;
      }

      if (filtroCargoFuncionario !== "todos") {
        params.filtroCargo = filtroCargoFuncionario;
      }

      await buscarFuncionarios(params);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar funcionários",
        variant: "destructive"
      });
    }
  };

  const handleNovoFuncionario = () => {
    navigate('/dashboard/novo-funcionario');
  };

  const handleEditarFuncionario = (funcionario: any) => {
    navigate(`/dashboard/novo-funcionario/${funcionario.id}`);
  };


  const handleExcluirFuncionario = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este funcionário?")) return;

    try {
      await excluirFuncionario(id);
      
      toast({
        title: "Sucesso",
        description: "Funcionário excluído com sucesso!",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir funcionário",
        variant: "destructive"
      });
    }
  };

  // Filtros são aplicados na API, então usamos os dados diretamente
  const funcionariosFiltrados = funcionarios;

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
          <div className="space-y-8">
            {/* Header da Página */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Configurações da Conta</h1>
                <p className="text-muted-foreground mt-2">
                  Gerencie suas informações pessoais e da empresa
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  onClick={async () => {
                    await handleSalvarDadosConta();
                    await handleSalvarDadosTenant();
                  }} 
                  className="px-6 py-2" 
                  disabled={salvando}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {salvando ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </div>

            {/* Cards de Resumo - Design Moderno */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Plano Atual</p>
                      <div className="flex items-center space-x-2">
                        {obterBadgePlano(dadosTenant.plano)}
                      </div>
                    </div>
                    <div className="p-3 rounded-full bg-blue-500/20">
                      <Crown className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-green-600 dark:text-green-400">Status da Conta</p>
                      <div className="flex items-center space-x-2">
                        {obterBadgeStatus(dadosTenant.status)}
                      </div>
                    </div>
                    <div className="p-3 rounded-full bg-green-500/20">
                      <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Membro Desde</p>
                      <p className="text-lg font-bold text-purple-700 dark:text-purple-300">
                        {new Date(dadosTenant.data_criacao).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <div className="p-3 rounded-full bg-purple-500/20">
                      <Calendar className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/50 dark:to-orange-900/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Tema Atual</p>
                      <p className="text-lg font-bold text-orange-700 dark:text-orange-300 capitalize">
                        {configuracoes.tema}
                      </p>
                    </div>
                    <div className="p-3 rounded-full bg-orange-500/20">
                      <Palette className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Seção Principal - Layout em 2 Colunas */}
            <div className="grid gap-8 lg:grid-cols-2">
              {/* Coluna Esquerda - Informações Pessoais */}
              <div className="space-y-6">
                <Card className="border-0 shadow-lg">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center text-xl">
                      <div className="p-2 rounded-lg bg-blue-500/10 mr-3">
                        <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      Informações Pessoais
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Atualize seus dados pessoais e de contato
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="nome" className="text-sm font-medium">Nome</Label>
                        <Input
                          id="nome"
                          value={dadosContaEditando?.nome || ''}
                          onChange={(e) => {
                            setDadosContaEditando(prev => prev ? { ...prev, nome: e.target.value } : null);
                          }}
                          className="h-11"
                          placeholder="Seu nome"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sobrenome" className="text-sm font-medium">Sobrenome</Label>
                        <Input
                          id="sobrenome"
                          value={dadosContaEditando?.sobrenome || ''}
                          onChange={(e) => {
                            setDadosContaEditando(prev => prev ? { ...prev, sobrenome: e.target.value } : null);
                          }}
                          className="h-11"
                          placeholder="Seu sobrenome"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={dadosContaEditando?.email || ''}
                        onChange={(e) => {
                          setDadosContaEditando(prev => prev ? { ...prev, email: e.target.value } : null);
                        }}
                        className="h-11"
                        placeholder="seu@email.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="telefone" className="text-sm font-medium">Telefone</Label>
                      <Input
                        id="telefone"
                        value={dadosContaEditando?.telefone || ''}
                        onChange={(e) => {
                          setDadosContaEditando(prev => prev ? { ...prev, telefone: e.target.value } : null);
                        }}
                        className="h-11"
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Endereço da Empresa */}
                <Card className="border-0 shadow-lg">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center text-xl">
                      <div className="p-2 rounded-lg bg-green-500/10 mr-3">
                        <MapPinIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      Endereço da Empresa
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Informações de localização da sua empresa
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="endereco_empresa" className="text-sm font-medium">Endereço Completo</Label>
                      <Textarea
                        id="endereco_empresa"
                        value={dadosTenantEditando?.endereco || ''}
                        onChange={(e) => {
                          setDadosTenantEditando(prev => prev ? { ...prev, endereco: e.target.value } : null);
                        }}
                        placeholder="Rua, número, bairro, complemento"
                        rows={3}
                        className="resize-none"
                      />
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="cep_empresa" className="text-sm font-medium">CEP</Label>
                        <Input
                          id="cep_empresa"
                          value={dadosTenantEditando?.cep || ''}
                          onChange={(e) => {
                            const valor = e.target.value;
                            setDadosTenantEditando(prev => prev ? { ...prev, cep: valor } : null);
                            buscarCep(valor);
                          }}
                          placeholder="00000-000"
                          maxLength={9}
                          className="h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cidade_empresa" className="text-sm font-medium">Cidade</Label>
                        <Input
                          id="cidade_empresa"
                          value={dadosTenantEditando?.cidade || ''}
                          onChange={(e) => {
                            setDadosTenantEditando(prev => prev ? { ...prev, cidade: e.target.value } : null);
                          }}
                          placeholder="Nome da cidade"
                          className="h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="estado_empresa" className="text-sm font-medium">Estado</Label>
                        <Select 
                          value={dadosTenantEditando?.estado || ''} 
                          onValueChange={(value) => setDadosTenantEditando(prev => prev ? { ...prev, estado: value } : null)}
                        >
                          <SelectTrigger className="h-11">
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
              </div>

              {/* Coluna Direita - Dados da Empresa */}
              <div className="space-y-6">
                <Card className="border-0 shadow-lg">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center text-xl">
                      <div className="p-2 rounded-lg bg-purple-500/10 mr-3">
                        <Building className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      Dados da Empresa
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Informações fiscais e comerciais da empresa
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="nome_empresa" className="text-sm font-medium">Nome da Empresa</Label>
                      <Input
                        id="nome_empresa"
                        value={dadosTenantEditando?.nome || ''}
                        onChange={(e) => {
                          setDadosTenantEditando(prev => prev ? { ...prev, nome: e.target.value } : null);
                        }}
                        className="h-11"
                        placeholder="Nome fantasia da empresa"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="razao_social" className="text-sm font-medium">Razão Social</Label>
                      <Input
                        id="razao_social"
                        value={dadosTenantEditando?.razao_social || ''}
                        onChange={(e) => {
                          setDadosTenantEditando(prev => prev ? { ...prev, razao_social: e.target.value } : null);
                        }}
                        className="h-11"
                        placeholder="Razão social completa"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cnpj" className="text-sm font-medium">CNPJ/CPF</Label>
                      <Input
                        id="cnpj"
                        value={dadosTenantEditando?.cnpj || dadosTenantEditando?.cpf || ''}
                        onChange={(e) => {
                          setDadosTenantEditando(prev => prev ? { ...prev, cnpj: e.target.value } : null);
                        }}
                        className="h-11"
                        placeholder="00.000.000/0000-00"
                      />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="email_empresa" className="text-sm font-medium">Email da Empresa</Label>
                        <Input
                          id="email_empresa"
                          type="email"
                          value={dadosTenantEditando?.email || ''}
                          onChange={(e) => {
                            setDadosTenantEditando(prev => prev ? { ...prev, email: e.target.value } : null);
                          }}
                          className="h-11"
                          placeholder="contato@empresa.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="telefone_empresa" className="text-sm font-medium">Telefone da Empresa</Label>
                        <Input
                          id="telefone_empresa"
                          value={dadosTenantEditando?.telefone || ''}
                          onChange={(e) => {
                            setDadosTenantEditando(prev => prev ? { ...prev, telefone: e.target.value } : null);
                          }}
                          className="h-11"
                          placeholder="(11) 3333-4444"
                        />
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="inscricao_estadual" className="text-sm font-medium">Inscrição Estadual</Label>
                        <Input
                          id="inscricao_estadual"
                          value={dadosTenantEditando?.inscricao_estadual || ''}
                          onChange={(e) => {
                            setDadosTenantEditando(prev => prev ? { ...prev, inscricao_estadual: e.target.value } : null);
                          }}
                          className="h-11"
                          placeholder="123.456.789.012"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="inscricao_municipal" className="text-sm font-medium">Inscrição Municipal</Label>
                        <Input
                          id="inscricao_municipal"
                          value={dadosTenantEditando?.inscricao_municipal || ''}
                          onChange={(e) => {
                            setDadosTenantEditando(prev => prev ? { ...prev, inscricao_municipal: e.target.value } : null);
                          }}
                          className="h-11"
                          placeholder="12345678"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Upload da Logo */}
                <Card className="border-0 shadow-lg">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center text-xl">
                      <div className="p-2 rounded-lg bg-orange-500/10 mr-3">
                        <Upload className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                      </div>
                      Logo da Empresa
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Faça upload da logo da sua empresa (PNG, JPG até 2MB)
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors">
                      {dadosTenantEditando?.logo ? (
                        <div className="space-y-4">
                          <div className="relative inline-block">
                            <img 
                              src={dadosTenantEditando?.logo} 
                              alt="Logo da empresa" 
                              className="h-20 w-20 mx-auto object-contain rounded-lg shadow-md"
                            />
                            <div className="absolute -top-2 -right-2 p-1 bg-green-500 rounded-full">
                              <CheckCircle className="h-4 w-4 text-white" />
                            </div>
                          </div>
                          <p className="text-sm font-medium text-green-600 dark:text-green-400">Logo carregada com sucesso</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                            <Upload className="h-8 w-8 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">Clique para fazer upload</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              ou arraste e solte o arquivo aqui
                            </p>
                          </div>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleUploadLogo}
                        className="hidden"
                        id="logo-upload"
                      />
                      <Button 
                        variant="outline" 
                        size="sm" 
                        asChild
                        className="mt-4"
                      >
                        <label htmlFor="logo-upload" className="cursor-pointer">
                          {dadosTenantEditando?.logo ? 'Alterar Logo' : 'Selecionar Arquivo'}
                        </label>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Seção de Segurança - Alteração de Senha */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-xl">
                  <div className="p-2 rounded-lg bg-red-500/10 mr-3">
                    <Lock className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                  Segurança da Conta
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Mantenha sua conta segura alterando sua senha regularmente
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="senhaAtual" className="text-sm font-medium">Senha Atual</Label>
                    <div className="relative">
                      <Input
                        id="senhaAtual"
                        type={mostrarSenhas ? "text" : "password"}
                        value={senhaAtual}
                        onChange={(e) => setSenhaAtual(e.target.value)}
                        className="h-11 pr-10"
                        placeholder="Digite sua senha atual"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setMostrarSenhas(!mostrarSenhas)}
                      >
                        {mostrarSenhas ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="novaSenha" className="text-sm font-medium">Nova Senha</Label>
                    <Input
                      id="novaSenha"
                      type={mostrarSenhas ? "text" : "password"}
                      value={novaSenha}
                      onChange={(e) => setNovaSenha(e.target.value)}
                      className="h-11"
                      placeholder="Digite a nova senha"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmarSenha" className="text-sm font-medium">Confirmar Senha</Label>
                    <Input
                      id="confirmarSenha"
                      type={mostrarSenhas ? "text" : "password"}
                      value={confirmarSenha}
                      onChange={(e) => setConfirmarSenha(e.target.value)}
                      className="h-11"
                      placeholder="Confirme a nova senha"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button 
                    onClick={handleAlterarSenha} 
                    className="px-6 py-2" 
                    disabled={salvando}
                    variant="destructive"
                  >
                    <Key className="h-4 w-4 mr-2" />
                    {salvando ? 'Alterando...' : 'Alterar Senha'}
                  </Button>
                </div>
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
          <div className="space-y-8">
            {/* Header da Página */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Administração do Sistema</h1>
                <p className="text-muted-foreground mt-2">
                  Gerencie usuários, roles e permissões do sistema
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Button onClick={handleNovoUsuario} className="px-6 py-2">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Usuário
                </Button>
              </div>
            </div>

            {/* Cards de Resumo - Design Moderno */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total de Usuários</p>
                      <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{usuarios.length}</p>
                    </div>
                    <div className="p-3 rounded-full bg-blue-500/20">
                      <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/50 dark:to-red-900/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-red-600 dark:text-red-400">Administradores</p>
                      <p className="text-2xl font-bold text-red-700 dark:text-red-300">{usuarios.filter(u => u.role === "administrador").length}</p>
                    </div>
                    <div className="p-3 rounded-full bg-red-500/20">
                      <Crown className="h-6 w-6 text-red-600 dark:text-red-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Gerentes</p>
                      <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{usuarios.filter(u => u.role === "gerente").length}</p>
                    </div>
                    <div className="p-3 rounded-full bg-purple-500/20">
                      <Star className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-green-600 dark:text-green-400">Vendedores</p>
                      <p className="text-2xl font-bold text-green-700 dark:text-green-300">{usuarios.filter(u => u.role === "vendedor").length}</p>
                    </div>
                    <div className="p-3 rounded-full bg-green-500/20">
                      <UserCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filtros e Busca */}
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
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
            <Card className="border-0 shadow-lg">
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


        {/* Modal de Usuário */}
        {mostrarFormUsuario && usuarioEditando && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="w-full max-w-5xl h-[90vh] overflow-hidden">
              <Card className="bg-background border-0 shadow-2xl h-full flex flex-col">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <UserCog className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-bold">
                          {usuarioEditando.id ? "Editar Usuário" : "Novo Usuário"}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {usuarioEditando.id ? "Atualize as informações do usuário" : "Preencha os dados para criar um novo usuário"}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setMostrarFormUsuario(false);
                        setUsuarioEditando(null);
                      }}
                      className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden p-0">
                  <div className="h-full flex flex-col">
                    <div className="flex-1 p-6 space-y-6 overflow-hidden">
                      {/* Informações Básicas e Role/Status */}
                      <div className="grid gap-6 lg:grid-cols-2">
                        {/* Informações Básicas */}
                        <div className="space-y-4">
                          <div className="flex items-center space-x-2 pb-2 border-b">
                            <div className="p-1.5 rounded bg-blue-500/10">
                              <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h3 className="text-lg font-semibold">Informações Básicas</h3>
                          </div>
                          <div className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                              <div className="space-y-2">
                                <Label htmlFor="nome_usuario" className="text-sm font-medium">Nome *</Label>
                                <Input
                                  id="nome_usuario"
                                  value={usuarioEditando.nome}
                                  onChange={(e) => setUsuarioEditando(prev => prev ? { ...prev, nome: e.target.value } : null)}
                                  placeholder="Nome do usuário"
                                  className="h-10"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="sobrenome_usuario" className="text-sm font-medium">Sobrenome *</Label>
                                <Input
                                  id="sobrenome_usuario"
                                  value={usuarioEditando.sobrenome}
                                  onChange={(e) => setUsuarioEditando(prev => prev ? { ...prev, sobrenome: e.target.value } : null)}
                                  placeholder="Sobrenome do usuário"
                                  className="h-10"
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="email_usuario" className="text-sm font-medium">Email *</Label>
                              <Input
                                id="email_usuario"
                                type="email"
                                value={usuarioEditando.email}
                                onChange={(e) => setUsuarioEditando(prev => prev ? { ...prev, email: e.target.value } : null)}
                                placeholder="email@exemplo.com"
                                className="h-10"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="senha_usuario" className="text-sm font-medium">
                                Senha {!usuarioEditando.id && "*"}
                              </Label>
                              <div className="relative">
                                <Input
                                  id="senha_usuario"
                                  type={mostrarSenha ? "text" : "password"}
                                  value={usuarioEditando.senha || ""}
                                  onChange={(e) => setUsuarioEditando(prev => prev ? { ...prev, senha: e.target.value } : null)}
                                  placeholder="Digite a senha"
                                  className="h-10 pr-10"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
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
                          <div className="flex items-center space-x-2 pb-2 border-b">
                            <div className="p-1.5 rounded bg-purple-500/10">
                              <Shield className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                            </div>
                            <h3 className="text-lg font-semibold">Role e Status</h3>
                          </div>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="role_usuario" className="text-sm font-medium">Role *</Label>
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
                                <SelectTrigger className="h-10">
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
                              <Label htmlFor="status_usuario" className="text-sm font-medium">Status</Label>
                              <Select 
                                value={usuarioEditando.status} 
                                onValueChange={(value) => setUsuarioEditando(prev => prev ? { ...prev, status: value } : null)}
                              >
                                <SelectTrigger className="h-10">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="ativo">
                                    <div className="flex items-center space-x-2">
                                      <CheckCircle className="h-4 w-4 text-green-500" />
                                      <span>Ativo</span>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="inativo">
                                    <div className="flex items-center space-x-2">
                                      <XCircle className="h-4 w-4 text-red-500" />
                                      <span>Inativo</span>
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="p-3 bg-muted/30 rounded-lg">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Permissões selecionadas:</span>
                                <Badge variant="outline" className="text-xs">
                                  {usuarioEditando.permissoes.length}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Permissões - Layout Compacto */}
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2 pb-2 border-b">
                          <div className="p-1.5 rounded bg-green-500/10">
                            <Key className="h-4 w-4 text-green-600 dark:text-green-400" />
                          </div>
                          <h3 className="text-lg font-semibold">Permissões</h3>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                          {permissoesDisponiveis.map((permissao) => (
                            <div key={permissao.id} className="group flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
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
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                              />
                              <Label 
                                htmlFor={`permissao-${permissao.id}`} 
                                className="font-medium text-sm cursor-pointer group-hover:text-primary transition-colors flex-1"
                              >
                                {permissao.nome}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <div className="bg-muted/30 px-6 py-4 border-t flex-shrink-0">
                  <div className="flex justify-end space-x-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setMostrarFormUsuario(false);
                        setUsuarioEditando(null);
                      }}
                      className="px-6"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancelar
                    </Button>
                    <Button 
                      onClick={handleSalvarUsuario} 
                      disabled={salvando}
                      className="px-6 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {salvando ? 'Salvando...' : 'Salvar Usuário'}
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        </div>
      </div>
    </div>
  );
}
