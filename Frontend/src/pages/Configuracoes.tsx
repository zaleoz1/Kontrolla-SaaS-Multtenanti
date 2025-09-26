import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
import { usePermissions } from "@/hooks/usePermissions";
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
  MapPin as MapPinIcon,
  Phone as PhoneIcon,
  Mail as MailIcon,
  FileText,
  Check,
  X,
  ArrowLeft,
  LogOut,
  Users,
  XCircle,
  AlertCircle,
  Clock,
  UserCheck,
  UserCog,
  CheckCircle2,
  Menu
} from "lucide-react";

export default function Configuracoes() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { 
    dadosConta, 
    dadosTenant, 
    configuracoes, 
    metodosPagamento,
    pixConfiguracao,
    dadosBancarios,
    administradores,
    dadosContaEditando,
    dadosTenantEditando,
    configuracoesEditando,
    metodosPagamentoEditando,
    setDadosContaEditando,
    setDadosTenantEditando,
    setConfiguracoesEditando,
    setMetodosPagamentoEditando,
    loading, 
    error,
    atualizarDadosConta,
    atualizarDadosTenant,
    atualizarConfiguracoes,
    alterarSenha,
    uploadAvatar,
    uploadLogo,
    buscarMetodosPagamento,
    atualizarMetodosPagamento,
    adicionarParcela,
    deletarParcela,
    salvarPixConfiguracao,
    salvarDadosBancarios,
    buscarAdministradores,
    buscarAdministrador,
    criarAdministrador,
    atualizarAdministrador,
    deletarAdministrador,
    atualizarUltimoAcesso
  } = useConfiguracoes();


  const { toast } = useToast();
  const { hasPermission, operador } = usePermissions();
  
  // Função para determinar se uma aba deve ser visível
  const isTabVisible = (tabId: string) => {
    // Para vendedores com permissão de configurações, permite acesso apenas a métodos de pagamento
    if (operador?.role === 'vendedor' && hasPermission('configuracoes')) {
      // Vendedores com configurações podem ver apenas métodos de pagamento
      if (tabId === 'metodos-pagamento') {
        return true;
      }
    }

    // Para outras abas, verifica permissão específica
    switch (tabId) {
      case 'conta':
        return hasPermission('configuracoes_gerais');
      case 'administracao':
        return hasPermission('configuracoes_administradores');
      case 'pagamentos':
        return hasPermission('configuracoes_gerais');
      case 'metodos-pagamento':
        return hasPermission('configuracoes_pagamentos');
      case 'tema':
        return hasPermission('configuracoes_gerais');
      case 'notificacoes':
        return hasPermission('configuracoes_gerais');
      case 'seguranca':
        return hasPermission('configuracoes_gerais');
      case 'fornecedores':
        return hasPermission('fornecedores');
      case 'funcionarios':
        return hasPermission('funcionarios');
      default:
        return false;
    }
  };

  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mostrarSenhas, setMostrarSenhas] = useState(false);
  const [mostrarCodigo, setMostrarCodigo] = useState(false);
  const [salvando, setSalvando] = useState(false);

  // Estados para métodos de pagamento (agora usando dados do hook)
  const [metodosPagamentoLocal, setMetodosPagamentoLocal] = useState({
    cartao_credito: { ativo: true, taxa: 0, nome: "Cartão de Crédito", parcelas: [] as Array<{quantidade: number, taxa: number}> },
    cartao_debito: { ativo: true, taxa: 0, nome: "Cartão de Débito", parcelas: [] as Array<{quantidade: number, taxa: number}> },
    pix: { ativo: true, taxa: 0, nome: "PIX", parcelas: [] as Array<{quantidade: number, taxa: number}> },
    transferencia: { ativo: false, taxa: 0, nome: "Transferência Bancária", parcelas: [] as Array<{quantidade: number, taxa: number}> },
    dinheiro: { ativo: true, taxa: 0, nome: "Dinheiro", parcelas: [] as Array<{quantidade: number, taxa: number}> }
  });

  // Estados para modal de parcelas
  const [mostrarModalParcelas, setMostrarModalParcelas] = useState(false);
  const [parcelasEditando, setParcelasEditando] = useState<Array<{quantidade: number, taxa: number}>>([]);

  // Estados locais para edição de PIX e dados bancários
  const [dadosPixEditando, setDadosPixEditando] = useState({
    chave_pix: "",
    qr_code: "",
    nome_titular: "",
    cpf_cnpj: ""
  });

  const [dadosBancariosEditando, setDadosBancariosEditando] = useState({
    banco: "",
    agencia: "",
    conta: "",
    digito: "",
    tipo_conta: "corrente" as "corrente" | "poupanca",
    nome_titular: "",
    cpf_cnpj: ""
  });


  const [abaAtiva, setAbaAtiva] = useState("conta");

  // Ler parâmetro da URL para definir a aba ativa
  useEffect(() => {
    const abaParam = searchParams.get('aba');
    if (abaParam) {
      setAbaAtiva(abaParam);
      // Limpar o parâmetro da URL após definir a aba
      setSearchParams({}, { replace: true });
    } else {
      // Se não há parâmetro de aba na URL, verificar se é vendedor com configurações
      if (operador?.role === 'vendedor' && hasPermission('configuracoes')) {
        // Vendedores com configurações abrem automaticamente na aba de métodos de pagamento
        setAbaAtiva('metodos-pagamento');
      }
    }
  }, [searchParams, setSearchParams, operador, hasPermission]);

  // Estados para administração
  const [usuarios, setUsuarios] = useState([]);
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [mostrarFormUsuario, setMostrarFormUsuario] = useState(false);
  const [buscaUsuario, setBuscaUsuario] = useState("");
  const [filtroRoleUsuario, setFiltroRoleUsuario] = useState("todos");
  const [filtroStatusUsuario, setFiltroStatusUsuario] = useState("todos");
  const [carregandoUsuarios, setCarregandoUsuarios] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Carregar dados quando o componente montar
  useEffect(() => {
    carregarUsuarios();
  }, []);

  // Recarregar usuários quando filtros mudarem
  useEffect(() => {
    carregarUsuarios();
  }, [buscaUsuario, filtroRoleUsuario, filtroStatusUsuario]);

  // Carregar usuários quando a aba de administração for ativada
  useEffect(() => {
    if (abaAtiva === "administracao") {
      carregarUsuarios();
    }
  }, [abaAtiva]);

  // Sincronizar métodos de pagamento do banco com estado local
  useEffect(() => {
    if (metodosPagamentoEditando && metodosPagamentoEditando.length > 0) {
      console.log('Dados carregados da API:', metodosPagamentoEditando);
      const metodosFormatados = metodosPagamentoEditando.reduce((acc, metodo) => {
        const tipo = metodo.tipo as keyof typeof metodosPagamentoLocal;
        const parcelasValidas = (metodo.parcelas || [])
          .filter(p => p.quantidade && p.quantidade > 0 && p.taxa !== undefined && p.taxa !== null);
        
        console.log(`Método ${tipo} - parcelas originais:`, metodo.parcelas, 'parcelas válidas:', parcelasValidas);
        
        acc[tipo] = {
          ativo: metodo.ativo,
          taxa: metodo.taxa || 0, // Garantir que taxa seja 0 se não definida
          nome: metodo.nome,
          parcelas: parcelasValidas.map(p => ({ quantidade: p.quantidade, taxa: p.taxa }))
        };
        return acc;
      }, {} as typeof metodosPagamentoLocal);
      
      console.log('Métodos formatados:', metodosFormatados);
      setMetodosPagamentoLocal(prev => ({ ...prev, ...metodosFormatados }));
    } else {
      // Se não há dados do banco, manter taxas zeradas
      console.log('Nenhum método de pagamento encontrado no banco, mantendo taxas zeradas');
      setMetodosPagamentoLocal(prev => ({
        ...prev,
        cartao_credito: { ...prev.cartao_credito, taxa: 0 },
        cartao_debito: { ...prev.cartao_debito, taxa: 0 },
        pix: { ...prev.pix, taxa: 0 },
        transferencia: { ...prev.transferencia, taxa: 0 },
        dinheiro: { ...prev.dinheiro, taxa: 0 }
      }));
    }
  }, [metodosPagamentoEditando]);

  // Sincronizar dados PIX do hook com estado local
  useEffect(() => {
    if (pixConfiguracao) {
      setDadosPixEditando({
        chave_pix: pixConfiguracao.chave_pix || "",
        qr_code: pixConfiguracao.qr_code || "",
        nome_titular: pixConfiguracao.nome_titular || "",
        cpf_cnpj: pixConfiguracao.cpf_cnpj || ""
      });
    }
  }, [pixConfiguracao]);

  // Sincronizar dados bancários do hook com estado local
  useEffect(() => {
    if (dadosBancarios) {
      setDadosBancariosEditando({
        banco: dadosBancarios.banco || "",
        agencia: dadosBancarios.agencia || "",
        conta: dadosBancarios.conta || "",
        digito: dadosBancarios.digito || "",
        tipo_conta: dadosBancarios.tipo_conta || "corrente",
        nome_titular: dadosBancarios.nome_titular || "",
        cpf_cnpj: dadosBancarios.cpf_cnpj || ""
      });
    }
  }, [dadosBancarios]);


  // Função para buscar dados do CEP
  const buscarCep = async (cep: string) => {
    // Remove caracteres não numéricos
    const cepLimpo = cep.replace(/\D/g, '');
    
    // Verifica se o CEP tem 8 dígitos
    if (cepLimpo.length === 8) {
      try {
        // Implementar busca de CEP aqui se necessário
        // Por enquanto, apenas atualiza o CEP
        setDadosTenantEditando(prev => prev ? {
          ...prev,
          cep: cep
        } : null);
        
        toast({
          title: "Aviso",
          description: "Funcionalidade de busca de CEP será implementada",
          variant: "default"
        });
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
      // Converter dados locais para formato da API
      const metodosParaSalvar = Object.entries(metodosPagamentoLocal).map(([tipo, metodo], index) => {
        const metodoData: any = {
          tipo: tipo as any,
          nome: metodo.nome,
          taxa: metodo.taxa,
          ativo: metodo.ativo,
          ordem: index
        };

        // Só incluir parcelas se houver parcelas válidas
        if (metodo.parcelas && metodo.parcelas.length > 0) {
          const parcelasValidas = metodo.parcelas.filter(p => 
            p.quantidade && 
            p.quantidade > 0 && 
            p.quantidade <= 24 &&
            p.taxa !== undefined && 
            p.taxa !== null &&
            p.taxa >= 0 &&
            p.taxa <= 100
          );
          
          if (parcelasValidas.length > 0) {
            metodoData.parcelas = parcelasValidas.map(p => ({
              quantidade: p.quantidade,
              taxa: p.taxa,
              ativo: true
            }));
          }
        }

        return metodoData;
      });

      console.log('Dados que serão enviados para a API:', metodosParaSalvar);
      await atualizarMetodosPagamento(metodosParaSalvar);
      
      // Recarregar dados para sincronizar
      await buscarMetodosPagamento();
      
      toast({
        title: "Sucesso",
        description: "Métodos de pagamento atualizados com sucesso!",
        variant: "default"
      });
    } catch (error) {
      console.error('Erro ao salvar métodos de pagamento:', error);
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
      await salvarPixConfiguracao(dadosPixEditando);
      
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
      await salvarDadosBancarios(dadosBancariosEditando);
      
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

  // Funções para gerenciar parcelas
  const handleAbrirModalParcelas = () => {
    setParcelasEditando([...metodosPagamentoLocal.cartao_credito.parcelas]);
    setMostrarModalParcelas(true);
  };

  const handleAdicionarParcela = () => {
    setParcelasEditando(prev => [...prev, { quantidade: prev.length + 1, taxa: 0 }]);
  };

  const handleRemoverParcela = (index: number) => {
    setParcelasEditando(prev => prev.filter((_, i) => i !== index));
  };

  const handleAtualizarParcela = (index: number, campo: 'quantidade' | 'taxa', valor: number) => {
    setParcelasEditando(prev => prev.map((parcela, i) => 
      i === index ? { ...parcela, [campo]: valor } : parcela
    ));
  };

  const handleSalvarParcelas = async () => {
    try {
      // Encontrar o método de cartão de crédito nos dados originais
      const metodoCartaoCredito = metodosPagamento?.find(m => m.tipo === 'cartao_credito');
      
      if (metodoCartaoCredito && metodoCartaoCredito.id) {
        // Deletar parcelas existentes
        for (const parcela of metodoCartaoCredito.parcelas) {
          if (parcela.id) {
            await deletarParcela(metodoCartaoCredito.id, parcela.id);
          }
        }
        
        // Adicionar novas parcelas
        for (const parcela of parcelasEditando) {
          await adicionarParcela(metodoCartaoCredito.id, {
            quantidade: parcela.quantidade,
            taxa: parcela.taxa,
            ativo: true
          });
        }
      }
      
      // Atualizar estado local
      setMetodosPagamentoLocal(prev => ({
        ...prev,
        cartao_credito: {
          ...prev.cartao_credito,
          parcelas: parcelasEditando
        }
      }));
      
      // Recarregar dados do hook para sincronizar
      await buscarMetodosPagamento();
      
      toast({
        title: "Sucesso",
        description: "Configuração de parcelas atualizada com sucesso!",
        variant: "default"
      });
      
      setMostrarModalParcelas(false);
    } catch (error) {
      console.error('Erro ao salvar parcelas:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar parcelas",
        variant: "destructive"
      });
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
        setDadosPixEditando(prev => ({ ...prev, qr_code: e.target?.result as string }));
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



  // Funções para gerenciar usuários e sistema de roles
  const carregarUsuarios = async () => {
    setCarregandoUsuarios(true);
    try {
      const filtros = {
        busca: buscaUsuario || undefined,
        role: filtroRoleUsuario !== 'todos' ? filtroRoleUsuario : undefined,
        status: filtroStatusUsuario !== 'todos' ? filtroStatusUsuario : undefined
      };
      
      const administradoresData = await buscarAdministradores(filtros);
      setUsuarios(administradoresData || []);
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
    const rolePadrao = "vendedor";
    setUsuarioEditando({
      nome: "",
      sobrenome: "",
      codigo: "",
      role: rolePadrao,
      status: "ativo",
      permissoes: obterPermissoesPorRole(rolePadrao)
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
      if (usuarioEditando.id) {
        await atualizarAdministrador(usuarioEditando.id, usuarioEditando);
      } else {
        await criarAdministrador(usuarioEditando);
      }
      
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
      await deletarAdministrador(id);
      
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

  // Os usuários já vêm filtrados da API, então usamos diretamente
  const usuariosFiltrados = usuarios;

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
        return ["vendas", "estoque", "relatorios", "funcionarios", "clientes", "financeiro"];
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
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Conteúdo principal */}
      <div className="flex-1 overflow-y-auto w-full max-w-full overflow-x-hidden">
        {/* Header mobile com botão de menu */}
        <div className="lg:hidden flex items-center justify-between p-3 sm:p-4 border-b bg-background">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden"
          >
            <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <h1 className="text-base sm:text-lg font-semibold">Configurações</h1>
          <div className="w-9" /> {/* Espaçador para centralizar o título */}
        </div>
        
        <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">

      {/* Conteúdo das configurações baseado na aba ativa */}

        {/* Dados da Conta */}
        {abaAtiva === "conta" && isTabVisible('conta') && (
          <div className="space-y-6 sm:space-y-8">
            {/* Header da Página */}
            <div className="w-full">
              <div className="mb-4 md:mb-0">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Configurações da Conta</h1>
                <p className="text-sm sm:text-base text-muted-foreground mt-2">
                  Gerencie suas informações pessoais e da empresa
                </p>
              </div>
              <div className="hidden md:flex items-center space-x-2 justify-end">
                <Button 
                  onClick={async () => {
                    await handleSalvarDadosConta();
                    await handleSalvarDadosTenant();
                  }} 
                  className="px-6 py-2 text-xs sm:text-sm" 
                  disabled={salvando}
                >
                  <Save className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  {salvando ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
              <div className="md:hidden w-full">
                <Button 
                  onClick={async () => {
                    await handleSalvarDadosConta();
                    await handleSalvarDadosTenant();
                  }} 
                  className="w-full text-xs sm:text-sm" 
                  disabled={salvando}
                >
                  <Save className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  {salvando ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </div>

            {/* Cards de Resumo - Design Moderno */}
            <div className="grid gap-3 sm:gap-6 grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
              <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50">
                <CardContent className="p-3 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                    <div className="space-y-1 flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400">Plano Atual</p>
                      <div className="flex items-center space-x-2">
                        {obterBadgePlano(dadosTenant.plano)}
                      </div>
                    </div>
                    <div className="p-2 sm:p-3 rounded-full bg-blue-500/20 flex-shrink-0 self-start sm:self-auto">
                      <Crown className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/50">
                <CardContent className="p-3 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                    <div className="space-y-1 flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-green-600 dark:text-green-400">Status da Conta</p>
                      <div className="flex items-center space-x-2">
                        {obterBadgeStatus(dadosTenant.status)}
                      </div>
                    </div>
                    <div className="p-2 sm:p-3 rounded-full bg-green-500/20 flex-shrink-0 self-start sm:self-auto">
                      <CheckCircle className="h-4 w-4 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/50">
                <CardContent className="p-3 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                    <div className="space-y-1 flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-purple-600 dark:text-purple-400">Membro Desde</p>
                      <p className="text-sm sm:text-lg font-bold text-purple-700 dark:text-purple-300 break-words">
                        {new Date(dadosTenant.data_criacao).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <div className="p-2 sm:p-3 rounded-full bg-purple-500/20 flex-shrink-0 self-start sm:self-auto">
                      <Calendar className="h-4 w-4 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/50 dark:to-orange-900/50">
                <CardContent className="p-3 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                    <div className="space-y-1 flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-orange-600 dark:text-orange-400">Tema Atual</p>
                      <p className="text-sm sm:text-lg font-bold text-orange-700 dark:text-orange-300 capitalize break-words">
                        {configuracoes.tema}
                      </p>
                    </div>
                    <div className="p-2 sm:p-3 rounded-full bg-orange-500/20 flex-shrink-0 self-start sm:self-auto">
                      <Palette className="h-4 w-4 sm:h-6 sm:w-6 text-orange-600 dark:text-orange-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Seção Principal - Layout em 2 Colunas */}
            <div className="grid gap-4 sm:gap-8 grid-cols-1 lg:grid-cols-2">
              {/* Coluna Esquerda - Informações Pessoais */}
              <div className="space-y-4 sm:space-y-6">
                <Card className="border-0 shadow-lg">
                  <CardHeader className="pb-3 sm:pb-4">
                    <CardTitle className="flex items-center text-lg sm:text-xl">
                      <div className="p-1.5 sm:p-2 rounded-lg bg-blue-500/10 mr-2 sm:mr-3">
                        <User className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      Informações Pessoais
                    </CardTitle>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Atualize seus dados pessoais e de contato
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4 sm:space-y-6">
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="nome" className="text-xs sm:text-sm font-medium">Nome</Label>
                        <Input
                          id="nome"
                          value={dadosContaEditando?.nome ?? ''}
                          onChange={(e) => {
                            setDadosContaEditando(prev => prev ? { ...prev, nome: e.target.value } : null);
                          }}
                          className="h-9 sm:h-11 text-xs sm:text-sm"
                          placeholder="Seu nome"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sobrenome" className="text-xs sm:text-sm font-medium">Sobrenome</Label>
                        <Input
                          id="sobrenome"
                          value={dadosContaEditando?.sobrenome ?? ''}
                          onChange={(e) => {
                            setDadosContaEditando(prev => prev ? { ...prev, sobrenome: e.target.value } : null);
                          }}
                          className="h-9 sm:h-11 text-xs sm:text-sm"
                          placeholder="Seu sobrenome"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-xs sm:text-sm font-medium">Email</Label>
                      <Input
                        id="email"
                        type="email"
                          value={dadosContaEditando?.email ?? ''}
                        onChange={(e) => {
                          setDadosContaEditando(prev => prev ? { ...prev, email: e.target.value } : null);
                        }}
                        className="h-9 sm:h-11 text-xs sm:text-sm"
                        placeholder="seu@email.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="telefone" className="text-xs sm:text-sm font-medium">Telefone</Label>
                      <Input
                        id="telefone"
                          value={dadosContaEditando?.telefone ?? ''}
                        onChange={(e) => {
                          setDadosContaEditando(prev => prev ? { ...prev, telefone: e.target.value } : null);
                        }}
                        className="h-9 sm:h-11 text-xs sm:text-sm"
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Endereço da Empresa */}
                <Card className="border-0 shadow-lg">
                  <CardHeader className="pb-3 sm:pb-4">
                    <CardTitle className="flex items-center text-lg sm:text-xl">
                      <div className="p-1.5 sm:p-2 rounded-lg bg-green-500/10 mr-2 sm:mr-3">
                        <MapPinIcon className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
                      </div>
                      Endereço da Empresa
                    </CardTitle>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Informações de localização da sua empresa
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4 sm:space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="endereco_empresa" className="text-xs sm:text-sm font-medium">Endereço Completo</Label>
                      <Textarea
                        id="endereco_empresa"
                        value={dadosTenantEditando?.endereco ?? ''}
                        onChange={(e) => {
                          setDadosTenantEditando(prev => prev ? { ...prev, endereco: e.target.value } : null);
                        }}
                        placeholder="Rua, número, bairro, complemento"
                        rows={3}
                        className="resize-none text-xs sm:text-sm"
                      />
                    </div>
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="cep_empresa" className="text-xs sm:text-sm font-medium">CEP</Label>
                        <Input
                          id="cep_empresa"
                          value={dadosTenantEditando?.cep ?? ''}
                          onChange={(e) => {
                            const valor = e.target.value;
                            setDadosTenantEditando(prev => prev ? { ...prev, cep: valor } : null);
                            buscarCep(valor);
                          }}
                          placeholder="00000-000"
                          maxLength={9}
                          className="h-9 sm:h-11 text-xs sm:text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cidade_empresa" className="text-xs sm:text-sm font-medium">Cidade</Label>
                        <Input
                          id="cidade_empresa"
                          value={dadosTenantEditando?.cidade ?? ''}
                          onChange={(e) => {
                            setDadosTenantEditando(prev => prev ? { ...prev, cidade: e.target.value } : null);
                          }}
                          placeholder="Nome da cidade"
                          className="h-9 sm:h-11 text-xs sm:text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="estado_empresa" className="text-xs sm:text-sm font-medium">Estado</Label>
                        <Select 
                          value={dadosTenantEditando?.estado ?? ''} 
                          onValueChange={(value) => setDadosTenantEditando(prev => prev ? { ...prev, estado: value } : null)}
                        >
                          <SelectTrigger className="h-9 sm:h-11 text-xs sm:text-sm">
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
              <div className="space-y-4 sm:space-y-6">
                <Card className="border-0 shadow-lg">
                  <CardHeader className="pb-3 sm:pb-4">
                    <CardTitle className="flex items-center text-lg sm:text-xl">
                      <div className="p-1.5 sm:p-2 rounded-lg bg-purple-500/10 mr-2 sm:mr-3">
                        <Building className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      Dados da Empresa
                    </CardTitle>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Informações fiscais e comerciais da empresa
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4 sm:space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="nome_empresa" className="text-xs sm:text-sm font-medium">Nome da Empresa</Label>
                      <Input
                        id="nome_empresa"
                        value={dadosTenantEditando?.nome ?? ''}
                        onChange={(e) => {
                          setDadosTenantEditando(prev => prev ? { ...prev, nome: e.target.value } : null);
                        }}
                        className="h-9 sm:h-11 text-xs sm:text-sm"
                        placeholder="Nome fantasia da empresa"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="razao_social" className="text-xs sm:text-sm font-medium">Razão Social</Label>
                      <Input
                        id="razao_social"
                        value={dadosTenantEditando?.razao_social ?? ''}
                        onChange={(e) => {
                          setDadosTenantEditando(prev => prev ? { ...prev, razao_social: e.target.value } : null);
                        }}
                        className="h-9 sm:h-11 text-xs sm:text-sm"
                        placeholder="Razão social completa"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cnpj" className="text-xs sm:text-sm font-medium">CNPJ/CPF</Label>
                      <Input
                        id="cnpj"
                        value={dadosTenantEditando?.cnpj ?? dadosTenantEditando?.cpf ?? ''}
                        onChange={(e) => {
                          setDadosTenantEditando(prev => prev ? { ...prev, cnpj: e.target.value } : null);
                        }}
                        className="h-9 sm:h-11 text-xs sm:text-sm"
                        placeholder="00.000.000/0000-00"
                      />
                    </div>
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="email_empresa" className="text-xs sm:text-sm font-medium">Email da Empresa</Label>
                        <Input
                          id="email_empresa"
                          type="email"
                          value={dadosTenantEditando?.email ?? ''}
                          onChange={(e) => {
                            setDadosTenantEditando(prev => prev ? { ...prev, email: e.target.value } : null);
                          }}
                          className="h-9 sm:h-11 text-xs sm:text-sm"
                          placeholder="contato@empresa.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="telefone_empresa" className="text-xs sm:text-sm font-medium">Telefone da Empresa</Label>
                        <Input
                          id="telefone_empresa"
                          value={dadosTenantEditando?.telefone ?? ''}
                          onChange={(e) => {
                            setDadosTenantEditando(prev => prev ? { ...prev, telefone: e.target.value } : null);
                          }}
                          className="h-9 sm:h-11 text-xs sm:text-sm"
                          placeholder="(11) 3333-4444"
                        />
                      </div>
                    </div>
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="inscricao_estadual" className="text-xs sm:text-sm font-medium">Inscrição Estadual</Label>
                        <Input
                          id="inscricao_estadual"
                          value={dadosTenantEditando?.inscricao_estadual ?? ''}
                          onChange={(e) => {
                            setDadosTenantEditando(prev => prev ? { ...prev, inscricao_estadual: e.target.value } : null);
                          }}
                          className="h-9 sm:h-11 text-xs sm:text-sm"
                          placeholder="123.456.789.012"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="inscricao_municipal" className="text-xs sm:text-sm font-medium">Inscrição Municipal</Label>
                        <Input
                          id="inscricao_municipal"
                          value={dadosTenantEditando?.inscricao_municipal ?? ''}
                          onChange={(e) => {
                            setDadosTenantEditando(prev => prev ? { ...prev, inscricao_municipal: e.target.value } : null);
                          }}
                          className="h-9 sm:h-11 text-xs sm:text-sm"
                          placeholder="12345678"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Upload da Logo */}
                <Card className="border-0 shadow-lg">
                  <CardHeader className="pb-3 sm:pb-4">
                    <CardTitle className="flex items-center text-lg sm:text-xl">
                      <div className="p-1.5 sm:p-2 rounded-lg bg-orange-500/10 mr-2 sm:mr-3">
                        <Upload className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 dark:text-orange-400" />
                      </div>
                      Logo da Empresa
                    </CardTitle>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Faça upload da logo da sua empresa (PNG, JPG até 2MB)
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="border-2 border-dashed border-border rounded-xl p-4 sm:p-8 text-center hover:border-primary/50 transition-colors">
                      {dadosTenantEditando?.logo ? (
                        <div className="space-y-3 sm:space-y-4">
                          <div className="relative inline-block">
                            <img 
                              src={dadosTenantEditando?.logo} 
                              alt="Logo da empresa" 
                              className="h-16 w-16 sm:h-20 sm:w-20 mx-auto object-contain rounded-lg shadow-md"
                            />
                            <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 p-0.5 sm:p-1 bg-green-500 rounded-full">
                              <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                            </div>
                          </div>
                          <p className="text-xs sm:text-sm font-medium text-green-600 dark:text-green-400">Logo carregada com sucesso</p>
                        </div>
                      ) : (
                        <div className="space-y-3 sm:space-y-4">
                          <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-muted rounded-full flex items-center justify-center">
                            <Upload className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-xs sm:text-sm font-medium">Clique para fazer upload</p>
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
                        className="mt-3 sm:mt-4 text-xs sm:text-sm"
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
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="flex items-center text-lg sm:text-xl">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-red-500/10 mr-2 sm:mr-3">
                    <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 dark:text-red-400" />
                  </div>
                  Segurança da Conta
                </CardTitle>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Mantenha sua conta segura alterando sua senha regularmente
                </p>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6">
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="senhaAtual" className="text-xs sm:text-sm font-medium">Senha Atual</Label>
                    <div className="relative">
                      <Input
                        id="senhaAtual"
                        type={mostrarSenhas ? "text" : "password"}
                        value={senhaAtual}
                        onChange={(e) => setSenhaAtual(e.target.value)}
                        className="h-9 sm:h-11 pr-8 sm:pr-10 text-xs sm:text-sm"
                        placeholder="Digite sua senha atual"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-2 sm:px-3 hover:bg-transparent"
                        onClick={() => setMostrarSenhas(!mostrarSenhas)}
                      >
                        {mostrarSenhas ? <EyeOff className="h-3 w-3 sm:h-4 sm:w-4" /> : <Eye className="h-3 w-3 sm:h-4 sm:w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="novaSenha" className="text-xs sm:text-sm font-medium">Nova Senha</Label>
                    <Input
                      id="novaSenha"
                      type={mostrarSenhas ? "text" : "password"}
                      value={novaSenha}
                      onChange={(e) => setNovaSenha(e.target.value)}
                      className="h-9 sm:h-11 text-xs sm:text-sm"
                      placeholder="Digite a nova senha"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmarSenha" className="text-xs sm:text-sm font-medium">Confirmar Senha</Label>
                    <Input
                      id="confirmarSenha"
                      type={mostrarSenhas ? "text" : "password"}
                      value={confirmarSenha}
                      onChange={(e) => setConfirmarSenha(e.target.value)}
                      className="h-9 sm:h-11 text-xs sm:text-sm"
                      placeholder="Confirme a nova senha"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button 
                    onClick={handleAlterarSenha} 
                    className="px-4 sm:px-6 py-2 text-xs sm:text-sm" 
                    disabled={salvando}
                    variant="destructive"
                  >
                    <Key className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    {salvando ? 'Alterando...' : 'Alterar Senha'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}


        {/* Administração */}
        {abaAtiva === "administracao" && isTabVisible('administracao') && (
          <div className="space-y-6 sm:space-y-8">
            {/* Header da Página */}
            <div className="w-full">
              <div className="mb-4 md:mb-0">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Administração do Sistema</h1>
                <p className="text-sm sm:text-base text-muted-foreground mt-2">
                  Gerencie usuários, roles e permissões do sistema
                </p>
              </div>
              <div className="hidden md:flex items-center space-x-2 justify-end">
                <Button onClick={handleNovoUsuario} className="px-6 py-2 text-xs sm:text-sm">
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Novo Usuário
                </Button>
              </div>
              <div className="md:hidden w-full">
                <Button onClick={handleNovoUsuario} className="w-full text-xs sm:text-sm">
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Novo Usuário
                </Button>
              </div>
            </div>

            {/* Cards de Resumo - Design Moderno */}
            <div className="grid gap-3 sm:gap-6 grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
              <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50">
                <CardContent className="p-3 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                    <div className="space-y-1 flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400">Total de Usuários</p>
                      <p className="text-lg sm:text-2xl font-bold text-blue-700 dark:text-blue-300 break-words">{usuarios.length}</p>
                    </div>
                    <div className="p-2 sm:p-3 rounded-full bg-blue-500/20 flex-shrink-0 self-start sm:self-auto">
                      <Users className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/50 dark:to-red-900/50">
                <CardContent className="p-3 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                    <div className="space-y-1 flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-red-600 dark:text-red-400">Administradores</p>
                      <p className="text-lg sm:text-2xl font-bold text-red-700 dark:text-red-300 break-words">{usuarios.filter(u => u.role === "administrador").length}</p>
                    </div>
                    <div className="p-2 sm:p-3 rounded-full bg-red-500/20 flex-shrink-0 self-start sm:self-auto">
                      <Crown className="h-4 w-4 sm:h-6 sm:w-6 text-red-600 dark:text-red-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/50">
                <CardContent className="p-3 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                    <div className="space-y-1 flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-purple-600 dark:text-purple-400">Gerentes</p>
                      <p className="text-lg sm:text-2xl font-bold text-purple-700 dark:text-purple-300 break-words">{usuarios.filter(u => u.role === "gerente").length}</p>
                    </div>
                    <div className="p-2 sm:p-3 rounded-full bg-purple-500/20 flex-shrink-0 self-start sm:self-auto">
                      <Star className="h-4 w-4 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/50">
                <CardContent className="p-3 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                    <div className="space-y-1 flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-green-600 dark:text-green-400">Vendedores</p>
                      <p className="text-lg sm:text-2xl font-bold text-green-700 dark:text-green-300 break-words">{usuarios.filter(u => u.role === "vendedor").length}</p>
                    </div>
                    <div className="p-2 sm:p-3 rounded-full bg-green-500/20 flex-shrink-0 self-start sm:self-auto">
                      <UserCheck className="h-4 w-4 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filtros e Busca */}
            <Card className="border-0 shadow-lg">
              <CardContent className="p-3 sm:p-6">
                <div className="flex flex-col space-y-3 sm:space-y-4 md:flex-row md:items-center md:space-y-0 md:space-x-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-3 w-3 sm:h-4 sm:w-4" />
                      <Input
                        placeholder="Buscar usuários..."
                        value={buscaUsuario}
                        onChange={(e) => setBuscaUsuario(e.target.value)}
                        className="pl-8 sm:pl-10 text-xs sm:text-sm h-9 sm:h-10"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                    <div className="flex items-center space-x-2">
                      <Filter className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                      <Select value={filtroRoleUsuario} onValueChange={setFiltroRoleUsuario}>
                        <SelectTrigger className="w-full sm:w-40 text-xs sm:text-sm h-9 sm:h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Todos os Roles</SelectItem>
                          <SelectItem value="administrador">Administrador</SelectItem>
                          <SelectItem value="gerente">Gerente</SelectItem>
                          <SelectItem value="vendedor">Vendedor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Select value={filtroStatusUsuario} onValueChange={setFiltroStatusUsuario}>
                      <SelectTrigger className="w-full sm:w-40 text-xs sm:text-sm h-9 sm:h-10">
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
            {carregandoUsuarios ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">Carregando usuários...</p>
                </div>
              </div>
            ) : usuariosFiltrados.length === 0 ? (
              <Card className="bg-gradient-card shadow-card">
                <CardContent className="p-6 sm:p-12 text-center">
                  <UserCog className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                  <h3 className="text-base sm:text-lg font-semibold mb-2">Nenhum usuário encontrado</h3>
                  <p className="text-sm sm:text-base text-muted-foreground mb-4">
                    {buscaUsuario || filtroRoleUsuario !== 'todos' || filtroStatusUsuario !== 'todos' 
                      ? "Tente ajustar sua busca ou filtros" 
                      : "Adicione seu primeiro usuário"
                    }
                  </p>
                  <Button 
                    className="bg-gradient-primary text-xs sm:text-sm"
                    onClick={handleNovoUsuario}
                  >
                    <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Adicionar Usuário</span>
                    <span className="sm:hidden">Adicionar</span>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {usuariosFiltrados.map((usuario) => (
                  <Card key={usuario.id} className="bg-gradient-card shadow-card hover:shadow-lg transition-shadow duration-300">
                    <CardHeader className="pb-3 sm:pb-4">
                      <div className="flex items-center justify-between">
                        <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10">
                          <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-gradient-primary flex items-center justify-center">
                            <span className="text-xs sm:text-sm font-bold text-white">
                              {usuario.nome.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="scale-90 sm:scale-100">
                          {obterBadgeRole(usuario.role)}
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-3 sm:space-y-4">
                      <div>
                        <h3 className="font-semibold text-base sm:text-lg line-clamp-2 flex items-center space-x-2">
                          <span>{usuario.nome} {usuario.sobrenome}</span>
                        </h3>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Código: {usuario.codigo}
                        </p>
                      </div>

                      <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                        <div className="flex items-center space-x-2 text-muted-foreground">
                          <Shield className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                          <span className="truncate capitalize">{usuario.role}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-muted-foreground">
                          <Clock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                          <span className="truncate text-xs">
                            Último acesso: {new Date(usuario.ultimo_acesso).toLocaleDateString("pt-BR")}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-muted-foreground">
                          <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                          <span className="truncate text-xs">
                            Criado: {new Date(usuario.data_criacao).toLocaleDateString("pt-BR")}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1.5 sm:space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs sm:text-sm text-muted-foreground">Status:</span>
                          <Badge variant={usuario.status === "ativo" ? "default" : "secondary"} className="text-xs">
                            {usuario.status === "ativo" ? "Ativo" : "Inativo"}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs sm:text-sm text-muted-foreground">Permissões:</span>
                          <span className="font-semibold text-primary text-xs sm:text-sm">
                            {usuario.permissoes.length}
                          </span>
                        </div>
                      </div>

                      {/* Permissões - Layout compacto */}
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">Permissões:</p>
                        <div className="flex flex-wrap gap-1">
                          {usuario.permissoes.slice(0, 3).map((permissao) => {
                            const permissaoInfo = permissoesDisponiveis.find(p => p.id === permissao);
                            return (
                              <Badge key={permissao} variant="outline" className="text-xs">
                                {permissaoInfo ? permissaoInfo.nome : permissao}
                              </Badge>
                            );
                          })}
                          {usuario.permissoes.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{usuario.permissoes.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex space-x-1.5 sm:space-x-2 pt-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1 text-xs sm:text-sm"
                          onClick={() => handleEditarUsuario(usuario)}
                        >
                          <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                          <span className="hidden sm:inline">Editar</span>
                          <span className="sm:hidden">Ed.</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="px-2 sm:px-3"
                          onClick={() => handleExcluirUsuario(usuario.id)}
                          disabled={carregandoUsuarios}
                        >
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}


        {/* Pagamentos e Assinatura */}
        {abaAtiva === "pagamentos" && isTabVisible('pagamentos') && (
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
        {abaAtiva === "metodos-pagamento" && isTabVisible('metodos-pagamento') && (
          <div className="space-y-4 sm:space-y-6">
          <div className="grid gap-4 sm:gap-6">
            {/* Configuração de Métodos de Pagamento */}
            <Card className="bg-gradient-card shadow-card">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="flex items-center text-lg sm:text-xl">
                  <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  Métodos de Pagamento Disponíveis
                </CardTitle>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Configure quais métodos de pagamento estarão disponíveis para suas vendas
                </p>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                {Object.entries(metodosPagamentoLocal).map(([key, metodo]) => (
                  <div key={key} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border rounded-lg space-y-3 sm:space-y-0">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10">
                        {key === 'cartao_credito' && <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />}
                        {key === 'cartao_debito' && <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />}
                        {key === 'pix' && <QrCode className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />}
                        {key === 'transferencia' && <Banknote className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />}
                        {key === 'dinheiro' && <Banknote className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm sm:text-base">{metodo.nome}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {key === 'cartao_credito' ? (
                            'parcelas' in metodo && metodo.parcelas && metodo.parcelas.length > 0 ? (
                              <span className="text-blue-600">
                                {metodo.parcelas.length} parcela(s) configurada(s)
                              </span>
                            ) : (
                              'Configure as parcelas disponíveis'
                            )
                          ) : (
                            `Taxa: ${metodo.taxa}%`
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                      {key !== 'cartao_credito' && (
                        <div className="flex items-center space-x-2">
                          <Label htmlFor={`taxa-${key}`} className="text-xs sm:text-sm">Taxa (%)</Label>
                          <Input
                            id={`taxa-${key}`}
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            value={metodo.taxa}
                            onChange={(e) => {
                              setMetodosPagamentoLocal(prev => ({
                                ...prev,
                                [key]: { ...prev[key as keyof typeof prev], taxa: parseFloat(e.target.value) || 0 }
                              }));
                            }}
                            className="w-16 sm:w-20 h-8 sm:h-9 text-xs sm:text-sm"
                            readOnly={operador?.role === 'vendedor' && hasPermission('configuracoes')}
                            disabled={key === 'pix' || key === 'dinheiro'}
                          />
                        </div>
                      )}
                      {key === 'cartao_credito' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleAbrirModalParcelas}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-xs sm:text-sm h-8 sm:h-9"
                        >
                          <Percent className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          Parcelas
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setMetodosPagamentoLocal(prev => ({
                            ...prev,
                            [key]: { ...prev[key as keyof typeof prev], ativo: !prev[key as keyof typeof prev].ativo }
                          }));
                        }}
                        className="h-8 sm:h-9 w-full sm:w-auto"
                        disabled={operador?.role === 'vendedor' && hasPermission('configuracoes')}
                      >
                        {metodo.ativo ? (
                          <ToggleRight className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                        ) : (
                          <ToggleLeft className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
                {/* Ocultar botão de salvar para vendedores */}
                {!(operador?.role === 'vendedor' && hasPermission('configuracoes')) && (
                  <Button onClick={handleSalvarMetodosPagamento} className="w-full text-xs sm:text-sm h-8 sm:h-10" disabled={salvando}>
                    <Save className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    {salvando ? 'Salvando...' : 'Salvar Métodos de Pagamento'}
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Configuração PIX */}
            <Card className="bg-gradient-card shadow-card">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="flex items-center text-lg sm:text-xl">
                  <QrCode className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  Configuração PIX
                </CardTitle>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Configure suas chaves PIX e QR Code para recebimentos
                </p>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="chave_pix" className="text-xs sm:text-sm">Chave PIX</Label>
                    <Input
                      id="chave_pix"
                      placeholder="Digite sua chave PIX"
                      value={dadosPixEditando.chave_pix}
                      onChange={(e) => setDadosPixEditando(prev => ({ ...prev, chave_pix: e.target.value }))}
                      className="h-8 sm:h-10 text-xs sm:text-sm"
                      readOnly={operador?.role === 'vendedor' && hasPermission('configuracoes')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nome_titular_pix" className="text-xs sm:text-sm">Nome do Titular</Label>
                    <Input
                      id="nome_titular_pix"
                      placeholder="Nome do titular da conta"
                      value={dadosPixEditando.nome_titular}
                      onChange={(e) => setDadosPixEditando(prev => ({ ...prev, nome_titular: e.target.value }))}
                      className="h-8 sm:h-10 text-xs sm:text-sm"
                      readOnly={operador?.role === 'vendedor' && hasPermission('configuracoes')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cpf_cnpj_pix" className="text-xs sm:text-sm">CPF/CNPJ</Label>
                    <Input
                      id="cpf_cnpj_pix"
                      placeholder="CPF ou CNPJ do titular"
                      value={dadosPixEditando.cpf_cnpj}
                      onChange={(e) => setDadosPixEditando(prev => ({ ...prev, cpf_cnpj: e.target.value }))}
                      className="h-8 sm:h-10 text-xs sm:text-sm"
                      readOnly={operador?.role === 'vendedor' && hasPermission('configuracoes')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs sm:text-sm">QR Code PIX</Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-3 sm:p-6 text-center">
                      {dadosPixEditando.qr_code ? (
                        <div className="space-y-2">
                          <img 
                            src={dadosPixEditando.qr_code} 
                            alt="QR Code PIX" 
                            className="h-16 w-16 sm:h-24 sm:w-24 mx-auto object-contain"
                          />
                          <p className="text-xs sm:text-sm text-muted-foreground">QR Code atual</p>
                        </div>
                      ) : (
                        <>
                          <QrCode className="h-6 w-6 sm:h-8 sm:w-8 mx-auto text-muted-foreground mb-2" />
                          <p className="text-xs sm:text-sm text-muted-foreground mb-2">
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
                      <Button 
                        variant="outline" 
                        size="sm" 
                        asChild 
                        className="text-xs sm:text-sm h-8 sm:h-9"
                        disabled={operador?.role === 'vendedor' && hasPermission('configuracoes')}
                      >
                        <label htmlFor="qr-code-upload">
                          {dadosPixEditando.qr_code ? 'Alterar QR Code' : 'Selecionar Arquivo'}
                        </label>
                      </Button>
                    </div>
                  </div>
                </div>
                {/* Ocultar botão de salvar para vendedores */}
                {!(operador?.role === 'vendedor' && hasPermission('configuracoes')) && (
                  <Button onClick={handleSalvarDadosPix} className="w-full text-xs sm:text-sm h-8 sm:h-10" disabled={salvando}>
                    <Save className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    {salvando ? 'Salvando...' : 'Salvar Configuração PIX'}
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Dados Bancários para Transferência */}
            <Card className="bg-gradient-card shadow-card">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="flex items-center text-lg sm:text-xl">
                  <Banknote className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  Dados Bancários para Transferência
                </CardTitle>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Configure os dados bancários para recebimento via transferência
                </p>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="banco" className="text-xs sm:text-sm">Banco</Label>
                    <Input
                      id="banco"
                      placeholder="Nome do banco"
                      value={dadosBancariosEditando.banco}
                      onChange={(e) => setDadosBancariosEditando(prev => ({ ...prev, banco: e.target.value }))}
                      className="h-8 sm:h-10 text-xs sm:text-sm"
                      readOnly={operador?.role === 'vendedor' && hasPermission('configuracoes')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="agencia" className="text-xs sm:text-sm">Agência</Label>
                    <Input
                      id="agencia"
                      placeholder="Número da agência"
                      value={dadosBancariosEditando.agencia}
                      onChange={(e) => setDadosBancariosEditando(prev => ({ ...prev, agencia: e.target.value }))}
                      className="h-8 sm:h-10 text-xs sm:text-sm"
                      readOnly={operador?.role === 'vendedor' && hasPermission('configuracoes')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="conta" className="text-xs sm:text-sm">Conta</Label>
                    <Input
                      id="conta"
                      placeholder="Número da conta"
                      value={dadosBancariosEditando.conta}
                      onChange={(e) => setDadosBancariosEditando(prev => ({ ...prev, conta: e.target.value }))}
                      className="h-8 sm:h-10 text-xs sm:text-sm"
                      readOnly={operador?.role === 'vendedor' && hasPermission('configuracoes')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="digito" className="text-xs sm:text-sm">Dígito</Label>
                    <Input
                      id="digito"
                      placeholder="Dígito da conta"
                      value={dadosBancariosEditando.digito}
                      onChange={(e) => setDadosBancariosEditando(prev => ({ ...prev, digito: e.target.value }))}
                      maxLength={1}
                      className="h-8 sm:h-10 text-xs sm:text-sm"
                      readOnly={operador?.role === 'vendedor' && hasPermission('configuracoes')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tipo_conta" className="text-xs sm:text-sm">Tipo de Conta</Label>
                    <Select 
                      value={dadosBancariosEditando.tipo_conta} 
                      onValueChange={(value: "corrente" | "poupanca") => setDadosBancariosEditando(prev => ({ ...prev, tipo_conta: value }))}
                      disabled={operador?.role === 'vendedor' && hasPermission('configuracoes')}
                    >
                      <SelectTrigger className="h-8 sm:h-10 text-xs sm:text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="corrente">Conta Corrente</SelectItem>
                        <SelectItem value="poupanca">Conta Poupança</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nome_titular_banco" className="text-xs sm:text-sm">Nome do Titular</Label>
                    <Input
                      id="nome_titular_banco"
                      placeholder="Nome do titular da conta"
                      value={dadosBancariosEditando.nome_titular}
                      onChange={(e) => setDadosBancariosEditando(prev => ({ ...prev, nome_titular: e.target.value }))}
                      className="h-8 sm:h-10 text-xs sm:text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cpf_cnpj_banco" className="text-xs sm:text-sm">CPF/CNPJ</Label>
                    <Input
                      id="cpf_cnpj_banco"
                      placeholder="CPF ou CNPJ do titular"
                      value={dadosBancariosEditando.cpf_cnpj}
                      onChange={(e) => setDadosBancariosEditando(prev => ({ ...prev, cpf_cnpj: e.target.value }))}
                      className="h-8 sm:h-10 text-xs sm:text-sm"
                      readOnly={operador?.role === 'vendedor' && hasPermission('configuracoes')}
                    />
                  </div>
                </div>
                {/* Ocultar botão de salvar para vendedores */}
                {!(operador?.role === 'vendedor' && hasPermission('configuracoes')) && (
                  <Button onClick={handleSalvarDadosBancarios} className="w-full text-xs sm:text-sm h-8 sm:h-10" disabled={salvando}>
                    <Save className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    {salvando ? 'Salvando...' : 'Salvar Dados Bancários'}
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Resumo dos Métodos Ativos */}
            <Card className="bg-gradient-card shadow-card">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="flex items-center text-lg sm:text-xl">
                  <Activity className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  Resumo dos Métodos Ativos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {Object.entries(metodosPagamentoLocal)
                    .filter(([_, metodo]) => metodo.ativo)
                    .map(([key, metodo]) => (
                    <div key={key} className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 border rounded-lg">
                      <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10">
                        {key === 'cartao_credito' && <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />}
                        {key === 'cartao_debito' && <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />}
                        {key === 'pix' && <QrCode className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />}
                        {key === 'transferencia' && <Banknote className="h-3 w-3 sm:h-4 sm:w-4 text-purple-500" />}
                        {key === 'dinheiro' && <Banknote className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-xs sm:text-sm truncate">{metodo.nome}</p>
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
        {abaAtiva === "tema" && isTabVisible('tema') && (
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
                    value={configuracoesEditando?.tema ?? 'sistema'} 
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
                    value={configuracoesEditando?.idioma ?? 'pt-BR'} 
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
                    value={configuracoesEditando?.fuso_horario ?? 'America/Sao_Paulo'} 
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
                    value={configuracoesEditando?.moeda ?? 'BRL'} 
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
        {abaAtiva === "notificacoes" && isTabVisible('notificacoes') && (
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
        {abaAtiva === "seguranca" && isTabVisible('seguranca') && (
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


        {/* Modal de Parcelas */}
        {mostrarModalParcelas && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
            <div className="w-full max-w-5xl h-[95vh] sm:h-[90vh] overflow-hidden">
              <Card className="bg-background border-0 shadow-2xl h-full flex flex-col">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b flex-shrink-0 p-3 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10">
                        <Percent className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg sm:text-xl font-bold">Configuração de Parcelas</CardTitle>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Configure as parcelas disponíveis para cartão de crédito
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setMostrarModalParcelas(false)}
                      className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                    >
                      <X className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden p-0">
                  <div className="h-full flex flex-col">
                    <div className="flex-1 p-3 sm:p-4 space-y-3 sm:space-y-4 overflow-hidden">
                      {/* Seção Principal - Layout Responsivo */}
                      <div className="space-y-3 sm:space-y-4">
                        {/* Header com Botão de Adicionar */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 pb-2 sm:pb-3 border-b">
                          <div className="flex items-center space-x-2">
                            <div className="p-1 sm:p-1.5 rounded bg-primary/10">
                              <Percent className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                            </div>
                            <h3 className="text-base sm:text-lg font-semibold">Parcelas Configuradas</h3>
                          </div>
                          {/* Ocultar botão de adicionar parcela para vendedores */}
                          {!(operador?.role === 'vendedor' && hasPermission('configuracoes')) && (
                            <Button
                              onClick={handleAdicionarParcela}
                              size="sm"
                              className="w-full sm:w-auto h-8 sm:h-9 text-xs sm:text-sm"
                            >
                              <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                              Adicionar Parcela
                            </Button>
                          )}
                        </div>
                        
                        {/* Lista de Parcelas - Scrollable */}
                        <div className="flex-1 overflow-y-auto space-y-2 sm:space-y-3 max-h-80 sm:max-h-96">
                          {parcelasEditando.length === 0 ? (
                            <div className="text-center py-6 sm:py-8 text-muted-foreground">
                              <Percent className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2 sm:mb-3 opacity-50" />
                              <p className="font-medium mb-1 text-sm sm:text-base">Nenhuma parcela configurada</p>
                              <p className="text-xs sm:text-sm">Clique em "Adicionar Parcela" para começar</p>
                            </div>
                          ) : (
                            <div className="space-y-2 sm:space-y-3">
                              {parcelasEditando.map((parcela, index) => (
                                <div key={index} className="p-2 sm:p-3 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                                  <div className="flex flex-col lg:flex-row lg:items-center gap-2 sm:gap-3">
                                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                                      <div className="space-y-1">
                                        <Label htmlFor={`quantidade-${index}`} className="text-xs font-medium text-muted-foreground">
                                          Quantidade de Parcelas
                                        </Label>
                                        <Input
                                          id={`quantidade-${index}`}
                                          type="number"
                                          min="1"
                                          max="24"
                                          value={parcela.quantidade}
                                          onChange={(e) => handleAtualizarParcela(index, 'quantidade', parseInt(e.target.value) || 1)}
                                          className="h-8 sm:h-9 text-xs sm:text-sm [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                                          placeholder="Ex: 3"
                                          readOnly={operador?.role === 'vendedor' && hasPermission('configuracoes')}
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <Label htmlFor={`taxa-${index}`} className="text-xs font-medium text-muted-foreground">
                                          Taxa de Juros (%)
                                        </Label>
                                        <Input
                                          id={`taxa-${index}`}
                                          type="number"
                                          step="0.1"
                                          min="0"
                                          max="100"
                                          value={parcela.taxa}
                                          onChange={(e) => handleAtualizarParcela(index, 'taxa', parseFloat(e.target.value) || 0)}
                                          className="h-8 sm:h-9 text-xs sm:text-sm"
                                          placeholder="Ex: 2.5"
                                          readOnly={operador?.role === 'vendedor' && hasPermission('configuracoes')}
                                        />
                                      </div>
                                    </div>
                                    <div className="flex items-center justify-end lg:justify-start">
                                      {/* Ocultar botão de remover parcela para vendedores */}
                                      {!(operador?.role === 'vendedor' && hasPermission('configuracoes')) && (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleRemoverParcela(index)}
                                          className="text-destructive hover:text-destructive hover:bg-destructive/10 w-full sm:w-auto h-8 sm:h-9 px-2 sm:px-3 text-xs"
                                        >
                                          <Trash2 className="h-3 w-3 mr-1" />
                                          <span className="text-xs">Remover</span>
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                    </div>
                  </div>
                </CardContent>
                <div className="bg-muted/30 px-3 sm:px-6 py-3 sm:py-4 border-t flex-shrink-0">
                  <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
                    {/* Ocultar botões de cancelar e salvar para vendedores */}
                    {!(operador?.role === 'vendedor' && hasPermission('configuracoes')) ? (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => setMostrarModalParcelas(false)}
                          className="w-full sm:w-auto px-4 sm:px-6 text-xs sm:text-sm h-8 sm:h-10"
                        >
                          <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                          Cancelar
                        </Button>
                        <Button 
                          onClick={handleSalvarParcelas}
                          className="w-full sm:w-auto px-4 sm:px-6 text-xs sm:text-sm h-8 sm:h-10"
                        >
                          <Save className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                          Salvar Parcelas
                        </Button>
                      </>
                    ) : (
                      /* Para vendedores, mostrar apenas botão de fechar */
                      <Button
                        variant="outline"
                        onClick={() => setMostrarModalParcelas(false)}
                        className="w-full sm:w-auto px-4 sm:px-6 text-xs sm:text-sm h-8 sm:h-10"
                      >
                        <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        Fechar
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Modal de Usuário */}
        {mostrarFormUsuario && usuarioEditando && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
            <div className="w-full max-w-5xl h-[95vh] sm:h-[90vh] overflow-hidden">
              <Card className="bg-background border-0 shadow-2xl h-full flex flex-col">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b flex-shrink-0 p-3 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10">
                        <UserCog className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg sm:text-xl font-bold">
                          {usuarioEditando.id ? "Editar Usuário" : "Novo Usuário"}
                        </CardTitle>
                        <p className="text-xs sm:text-sm text-muted-foreground">
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
                      className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                    >
                      <X className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden p-0">
                  <div className="h-full flex flex-col">
                    <div className="flex-1 p-3 sm:p-6 space-y-4 sm:space-y-6 overflow-hidden">
                      {/* Informações Básicas e Role/Status */}
                      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
                        {/* Informações Básicas */}
                        <div className="space-y-3 sm:space-y-4">
                          <div className="flex items-center space-x-2 pb-2 border-b">
                            <div className="p-1 sm:p-1.5 rounded bg-blue-500/10">
                              <User className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h3 className="text-base sm:text-lg font-semibold">Informações Básicas</h3>
                          </div>
                          <div className="space-y-3 sm:space-y-4">
                            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                              <div className="space-y-2">
                                <Label htmlFor="nome_usuario" className="text-xs sm:text-sm font-medium">Nome *</Label>
                                <Input
                                  id="nome_usuario"
                                  value={usuarioEditando.nome}
                                  onChange={(e) => setUsuarioEditando(prev => prev ? { ...prev, nome: e.target.value } : null)}
                                  placeholder="Nome do usuário"
                                  className="h-8 sm:h-10 text-xs sm:text-sm"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="sobrenome_usuario" className="text-xs sm:text-sm font-medium">Sobrenome *</Label>
                                <Input
                                  id="sobrenome_usuario"
                                  value={usuarioEditando.sobrenome}
                                  onChange={(e) => setUsuarioEditando(prev => prev ? { ...prev, sobrenome: e.target.value } : null)}
                                  placeholder="Sobrenome do usuário"
                                  className="h-8 sm:h-10 text-xs sm:text-sm"
                                />
                              </div>
                            </div>
                            {/* Campo de email removido - administradores não precisam de email */}
                            <div className="space-y-2">
                              <Label htmlFor="codigo_usuario" className="text-xs sm:text-sm font-medium">
                                Código de Acesso
                              </Label>
                              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                                <div className="relative flex-1">
                                  <Input
                                    id="codigo_usuario"
                                    type={mostrarCodigo ? "text" : "password"}
                                    value={usuarioEditando.codigo ?? ""}
                                    onChange={(e) => setUsuarioEditando(prev => prev ? { ...prev, codigo: e.target.value } : null)}
                                    placeholder="Código será gerado automaticamente"
                                    className="h-8 sm:h-10 pr-8 sm:pr-10 text-xs sm:text-sm"
                                    readOnly={!!usuarioEditando.id}
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-2 sm:px-3 hover:bg-transparent"
                                    onClick={() => setMostrarCodigo(!mostrarCodigo)}
                                  >
                                    {mostrarCodigo ? <EyeOff className="h-3 w-3 sm:h-4 sm:w-4" /> : <Eye className="h-3 w-3 sm:h-4 sm:w-4" />}
                                  </Button>
                                </div>
                                {usuarioEditando.id && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      // Gerar novo código
                                      const novoCodigo = Math.random().toString(36).substring(2, 10).toUpperCase();
                                      setUsuarioEditando(prev => prev ? { ...prev, codigo: novoCodigo, gerarNovoCodigo: true } : null);
                                    }}
                                    className="h-8 sm:h-10 px-2 sm:px-3 text-xs sm:text-sm"
                                  >
                                    <Key className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                    Novo
                                  </Button>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {usuarioEditando.id 
                                  ? "Clique em 'Novo' para gerar um novo código" 
                                  : "Um código será gerado automaticamente ao salvar"
                                }
                              </p>
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
                                onValueChange={(value: 'administrador' | 'gerente' | 'vendedor') => {
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
                                onValueChange={(value: 'ativo' | 'inativo' | 'suspenso') => setUsuarioEditando(prev => prev ? { ...prev, status: value } : null)}
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
                <div className="bg-muted/30 px-3 sm:px-6 py-3 sm:py-4 border-t flex-shrink-0">
                  <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setMostrarFormUsuario(false);
                        setUsuarioEditando(null);
                      }}
                      className="w-full sm:w-auto px-4 sm:px-6 text-xs sm:text-sm h-8 sm:h-10"
                    >
                      <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      Cancelar
                    </Button>
                    <Button 
                      onClick={handleSalvarUsuario} 
                      disabled={salvando}
                      className="w-full sm:w-auto px-4 sm:px-6 text-xs sm:text-sm h-8 sm:h-10 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                    >
                      <Save className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      {salvando ? 'Salvando...' : 'Salvar Usuário'}
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Mensagem de acesso negado */}
        {!isTabVisible('conta') && !isTabVisible('fornecedores') && !isTabVisible('funcionarios') && !isTabVisible('administracao') && !isTabVisible('metodos-pagamento') && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Acesso Negado</h3>
              <p className="text-muted-foreground">
                Você não tem permissão para acessar as configurações do sistema.
              </p>
            </div>
          </div>
        )}

        </div>
      </div>
    </div>
  );
}
