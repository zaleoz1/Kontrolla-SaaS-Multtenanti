import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFuncionarios } from "@/hooks/useFuncionarios";
import { useToast } from "@/hooks/use-toast";
import { ConfiguracoesSidebar } from "@/components/layout/ConfiguracoesSidebar";
import { 
  Users,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  MailIcon,
  PhoneIcon,
  FileText,
  Calendar,
  Briefcase,
  UserCheck,
  UserCog,
  Menu
} from "lucide-react";

export default function Funcionarios() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  
  const { 
    funcionarios, 
    carregando: carregandoFuncionarios, 
    buscarFuncionarios, 
    excluirFuncionario,
    gerarContasMensais
  } = useFuncionarios();

  // Estados para filtros e busca
  const [buscaFuncionario, setBuscaFuncionario] = useState("");
  const [filtroStatusFuncionario, setFiltroStatusFuncionario] = useState("todos");
  const [filtroCargoFuncionario, setFiltroCargoFuncionario] = useState("todos");
  const [abaAtiva, setAbaAtiva] = useState("funcionarios");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [gerandoContas, setGerandoContas] = useState(false);
  

  // Carregar funcionários quando o componente montar
  useEffect(() => {
    carregarFuncionarios();
  }, []);

  // Verificar parâmetros da URL para exibir avisos de sucesso
  useEffect(() => {
    const successParam = searchParams.get('success');
    
    if (successParam === 'created' || successParam === 'updated') {
      // Exibir toast de sucesso
      toast({
        title: "Sucesso",
        description: successParam === 'created' 
          ? 'Funcionário cadastrado com sucesso!' 
          : 'Funcionário atualizado com sucesso!',
        variant: "default"
      });
      
      // Limpar o parâmetro da URL após exibir o aviso
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, toast]);

  // Recarregar funcionários quando os filtros mudarem (com debounce para busca)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      carregarFuncionarios();
    }, buscaFuncionario ? 500 : 0); // Debounce de 500ms apenas para busca

    return () => clearTimeout(timeoutId);
  }, [buscaFuncionario, filtroStatusFuncionario, filtroCargoFuncionario]);

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

  const handleGerarContasMensais = async () => {
    if (!confirm("Deseja gerar as contas de salário para este mês? Isso criará contas a pagar para todos os funcionários ativos.")) return;

    try {
      setGerandoContas(true);
      const resultado = await gerarContasMensais();
      
      toast({
        title: "Contas Geradas",
        description: `${resultado.contasCriadas} contas criadas, ${resultado.contasExistentes} já existiam`,
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao gerar contas mensais",
        variant: "destructive"
      });
    } finally {
      setGerandoContas(false);
    }
  };


  // Filtros são aplicados na API, então usamos os dados diretamente
  const funcionariosFiltrados = funcionarios;

  // Funções para o sidebar
  const handleMudarAba = (aba: string) => {
    setAbaAtiva(aba);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar de configurações */}
      <ConfiguracoesSidebar
        activeTab={abaAtiva}
        onTabChange={handleMudarAba}

        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Conteúdo principal */}
      <div className="flex-1 overflow-y-auto">
        {/* Header mobile com botão de menu */}
        <div className="min-[1378px]:hidden flex items-center justify-between p-3 sm:p-4 border-b bg-background">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(true)}
            className="min-[1378px]:hidden"
          >
            <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <h1 className="text-base sm:text-lg font-semibold">Funcionários</h1>
          <div className="w-8 sm:w-9" /> {/* Espaçador para centralizar o título */}
        </div>
        
        <div className="w-full max-w-full overflow-x-hidden p-3 sm:p-6 space-y-4 sm:space-y-6">
          {/* Header da Página */}
          <div className="w-full flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Funcionários</h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-2">
                Gerencie os dados dos funcionários, salários e informações de pagamento
              </p>
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
              <Button 
                onClick={handleGerarContasMensais} 
                disabled={gerandoContas}
                variant="outline"
                className="text-xs sm:text-sm h-8 sm:h-10 flex-1 sm:flex-none"
              >
                {gerandoContas ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-primary mr-1 sm:mr-2"></div>
                    <span className="hidden sm:inline">Gerando...</span>
                    <span className="sm:hidden">Gerando...</span>
                  </>
                ) : (
                  <>
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Gerar Contas Mensais</span>
                    <span className="sm:hidden">Contas</span>
                  </>
                )}
              </Button>
              <Button onClick={handleNovoFuncionario} className="bg-gradient-primary text-xs sm:text-sm h-8 sm:h-10 flex-1 sm:flex-none">
                <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Novo Funcionário</span>
                <span className="sm:hidden">Novo</span>
              </Button>
            </div>
          </div>


          {/* Cards de Resumo - Design Moderno */}
          <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
            <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50">
              <CardContent className="p-2 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                  <div className="space-y-1">
                    <p className="text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400">Total de Funcionários</p>
                    <p className="text-sm sm:text-2xl font-bold text-blue-700 dark:text-blue-300 break-words">{funcionarios.length}</p>
                  </div>
                  <div className="p-1 sm:p-3 rounded-full bg-blue-500/20 self-start sm:self-auto">
                    <Users className="h-3 w-3 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/50">
              <CardContent className="p-2 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                  <div className="space-y-1">
                    <p className="text-xs sm:text-sm font-medium text-green-600 dark:text-green-400">Funcionários Ativos</p>
                    <p className="text-sm sm:text-2xl font-bold text-green-700 dark:text-green-300 break-words">
                      {funcionarios.filter(f => f.status === "ativo").length}
                    </p>
                  </div>
                  <div className="p-1 sm:p-3 rounded-full bg-green-500/20 self-start sm:self-auto">
                    <UserCheck className="h-3 w-3 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/50 dark:to-orange-900/50">
              <CardContent className="p-2 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                  <div className="space-y-1">
                    <p className="text-xs sm:text-sm font-medium text-orange-600 dark:text-orange-400">Funcionários Inativos</p>
                    <p className="text-sm sm:text-2xl font-bold text-orange-700 dark:text-orange-300 break-words">
                      {funcionarios.filter(f => f.status === "inativo").length}
                    </p>
                  </div>
                  <div className="p-1 sm:p-3 rounded-full bg-orange-500/20 self-start sm:self-auto">
                    <UserCog className="h-3 w-3 sm:h-6 sm:w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/50">
              <CardContent className="p-2 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                  <div className="space-y-1">
                    <p className="text-xs sm:text-sm font-medium text-purple-600 dark:text-purple-400">Vendedores</p>
                    <p className="text-sm sm:text-2xl font-bold text-purple-700 dark:text-purple-300 break-words">
                      {funcionarios.filter(f => f.cargo === "Vendedor").length}
                    </p>
                  </div>
                  <div className="p-1 sm:p-3 rounded-full bg-purple-500/20 self-start sm:self-auto">
                    <Briefcase className="h-3 w-3 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filtros e Busca */}
          <Card className="bg-gradient-card shadow-card">
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-3 w-3 sm:h-4 sm:w-4" />
                    <Input
                      placeholder="Buscar funcionários..."
                      value={buscaFuncionario}
                      onChange={(e) => setBuscaFuncionario(e.target.value)}
                      className="pl-8 sm:pl-10 h-8 sm:h-10 text-xs sm:text-sm"
                    />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                  <div className="flex items-center space-x-2">
                    <Filter className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                    <Select value={filtroStatusFuncionario} onValueChange={setFiltroStatusFuncionario}>
                      <SelectTrigger className="w-full sm:w-40 h-8 sm:h-10 text-xs sm:text-sm">
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
                  </div>
                  <Select value={filtroCargoFuncionario} onValueChange={setFiltroCargoFuncionario}>
                    <SelectTrigger className="w-full sm:w-40 h-8 sm:h-10 text-xs sm:text-sm">
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
          {carregandoFuncionarios ? (
            <div className="flex items-center justify-center h-24 sm:h-32">
              <div className="text-center">
                <div className="animate-spin rounded-full h-4 w-4 sm:h-6 sm:w-6 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-xs sm:text-sm text-muted-foreground">Carregando funcionários...</p>
              </div>
            </div>
          ) : funcionariosFiltrados.length === 0 ? (
            <Card className="bg-gradient-card shadow-card">
              <CardContent className="p-6 sm:p-12 text-center">
                <Users className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                <h3 className="text-base sm:text-lg font-semibold mb-2">Nenhum funcionário encontrado</h3>
                <p className="text-sm sm:text-base text-muted-foreground mb-4">
                  {buscaFuncionario || filtroStatusFuncionario !== 'todos' || filtroCargoFuncionario !== 'todos' 
                    ? "Tente ajustar sua busca ou filtros" 
                    : "Adicione seu primeiro funcionário"
                  }
                </p>
                <Button 
                  className="bg-gradient-primary text-xs sm:text-sm h-8 sm:h-10"
                  onClick={handleNovoFuncionario}
                >
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Adicionar Funcionário</span>
                  <span className="sm:hidden">Adicionar</span>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {funcionariosFiltrados.map((funcionario) => (
                <Card key={funcionario.id} className="bg-gradient-card shadow-card hover:shadow-lg transition-shadow duration-300">
                  <CardHeader className="pb-2 sm:pb-3">
                    <div className="flex items-center justify-between">
                      <div className="p-1 sm:p-1.5 rounded-lg bg-primary/10">
                        <div className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 rounded-full bg-gradient-primary flex items-center justify-center">
                          <span className="text-xs font-bold text-white">
                            {funcionario.nome.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="scale-90 sm:scale-100">
                        <Badge variant={funcionario.status === "ativo" ? "default" : "secondary"} className="text-xs">
                          {funcionario.status === "ativo" ? "Ativo" : 
                           funcionario.status === "inativo" ? "Inativo" :
                           funcionario.status === "afastado" ? "Afastado" : "Demitido"}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-2 sm:space-y-3">
                    <div>
                      <h3 className="font-semibold text-sm sm:text-base lg:text-lg line-clamp-2 flex items-center space-x-2">
                        <span className="truncate">{funcionario.nome} {funcionario.sobrenome}</span>
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">
                        {funcionario.cargo} - {funcionario.departamento}
                      </p>
                    </div>

                    <div className="space-y-1 sm:space-y-1.5 text-xs sm:text-sm">
                      {funcionario.cpf && (
                        <div className="flex items-center space-x-1.5 sm:space-x-2 text-muted-foreground">
                          <FileText className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                          <span className="truncate text-xs">{funcionario.cpf}</span>
                        </div>
                      )}
                      {funcionario.email && (
                        <div className="flex items-center space-x-1.5 sm:space-x-2 text-muted-foreground">
                          <MailIcon className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                          <span className="truncate text-xs">{funcionario.email}</span>
                        </div>
                      )}
                      {funcionario.telefone && (
                        <div className="flex items-center space-x-1.5 sm:space-x-2 text-muted-foreground">
                          <PhoneIcon className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                          <span className="truncate text-xs">{funcionario.telefone}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-1.5 sm:space-x-2 text-muted-foreground">
                        <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                        <span className="truncate text-xs">
                          Admissão: {new Date(funcionario.data_admissao).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1 sm:space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Salário:</span>
                        <span className="font-semibold text-primary text-xs break-words">
                          R$ {funcionario.salario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Tipo:</span>
                        <span className="font-semibold text-primary text-xs capitalize truncate">
                          {funcionario.tipo_salario}
                        </span>
                      </div>
                    </div>

                    {funcionario.observacoes && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">Observações:</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {funcionario.observacoes}
                        </p>
                      </div>
                    )}

                    <div className="flex space-x-1 sm:space-x-1.5 pt-1 sm:pt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 text-xs h-7 sm:h-8"
                        onClick={() => handleEditarFuncionario(funcionario)}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        <span className="hidden sm:inline">Editar</span>
                        <span className="sm:hidden">Ed.</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="px-2 h-7 sm:h-8"
                        onClick={() => handleExcluirFuncionario(funcionario.id)}
                        disabled={carregandoFuncionarios}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


