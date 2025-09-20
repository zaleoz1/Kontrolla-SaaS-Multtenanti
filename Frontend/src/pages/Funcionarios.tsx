import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  DollarSign,
  Calendar,
  Briefcase,
  UserCheck,
  UserCog
} from "lucide-react";

export default function Funcionarios() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { 
    funcionarios, 
    carregando: carregandoFuncionarios, 
    buscarFuncionarios, 
    excluirFuncionario 
  } = useFuncionarios();

  // Estados para filtros e busca
  const [buscaFuncionario, setBuscaFuncionario] = useState("");
  const [filtroStatusFuncionario, setFiltroStatusFuncionario] = useState("todos");
  const [filtroCargoFuncionario, setFiltroCargoFuncionario] = useState("todos");
  const [abaAtiva, setAbaAtiva] = useState("funcionarios");

  // Carregar funcionários quando o componente montar
  useEffect(() => {
    carregarFuncionarios();
  }, []);

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

  const handleGerarContasSalario = async () => {
    if (!confirm("Deseja gerar contas de salário para todos os funcionários ativos?")) return;

    try {
      const response = await fetch('/api/funcionarios/gerar-contas-salario', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({})
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Sucesso",
          description: `${data.contasCriadas} contas de salário criadas! ${data.contasExistentes} já existiam.`,
          variant: "default"
        });
      } else {
        toast({
          title: "Erro",
          description: data.error || "Erro ao gerar contas de salário",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao gerar contas de salário",
        variant: "destructive"
      });
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
        onLogout={handleLogout}
      />

      {/* Conteúdo principal */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Header da Página */}
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Funcionários</h1>
              <p className="text-muted-foreground mt-2">
                Gerencie os dados dos funcionários, salários e informações de pagamento
              </p>
            </div>
            <div className="flex space-x-2">
              <Button 
                onClick={handleGerarContasSalario} 
                variant="outline"
                className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Gerar Contas de Salário
              </Button>
              <Button onClick={handleNovoFuncionario} className="bg-gradient-primary">
                <Plus className="h-4 w-4 mr-2" />
                Novo Funcionário
              </Button>
            </div>
          </div>

          {/* Cards de Resumo - Design Moderno */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total de Funcionários</p>
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{funcionarios.length}</p>
                  </div>
                  <div className="p-3 rounded-full bg-blue-500/20">
                    <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-green-600 dark:text-green-400">Funcionários Ativos</p>
                    <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                      {funcionarios.filter(f => f.status === "ativo").length}
                    </p>
                  </div>
                  <div className="p-3 rounded-full bg-green-500/20">
                    <UserCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/50 dark:to-orange-900/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Funcionários Inativos</p>
                    <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                      {funcionarios.filter(f => f.status === "inativo").length}
                    </p>
                  </div>
                  <div className="p-3 rounded-full bg-orange-500/20">
                    <UserCog className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Vendedores</p>
                    <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                      {funcionarios.filter(f => f.cargo === "Vendedor").length}
                    </p>
                  </div>
                  <div className="p-3 rounded-full bg-purple-500/20">
                    <Briefcase className="h-6 w-6 text-purple-600 dark:text-purple-400" />
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
          {carregandoFuncionarios ? (
            <Card className="bg-gradient-card shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-center h-32">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-sm text-muted-foreground">Carregando funcionários...</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : funcionariosFiltrados.length === 0 ? (
            <Card className="bg-gradient-card shadow-card">
              <CardContent className="p-6">
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
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {funcionariosFiltrados.map((funcionario) => (
                <Card key={funcionario.id} className="bg-gradient-card shadow-card hover:shadow-lg transition-all duration-200">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
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
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
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
                          <div className="mt-4">
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
