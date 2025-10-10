import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFornecedores } from "@/hooks/useFornecedores";
import { useToast } from "@/hooks/use-toast";
import { ConfiguracoesSidebar } from "@/components/layout/ConfiguracoesSidebar";
import { 
  Building2,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  MailIcon,
  PhoneIcon,
  MapPinIcon,
  FileText,
  User,
  Eye,
  EyeOff,
  Menu
} from "lucide-react";

export default function Fornecedores() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const {
    fornecedores,
    carregando: carregandoFornecedores,
    salvando: salvandoFornecedor,
    carregarFornecedores,
    excluirFornecedor
  } = useFornecedores();

  // Estados para filtros e busca
  const [buscaFornecedor, setBuscaFornecedor] = useState("");
  const [filtroStatusFornecedor, setFiltroStatusFornecedor] = useState("todos");
  const [abaAtiva, setAbaAtiva] = useState("fornecedores");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Carregar fornecedores quando o componente montar
  useEffect(() => {
    carregarFornecedores();
  }, []);

  // Funções para gerenciar fornecedores
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

  const handleVisualizarFornecedor = (fornecedor: any) => {
    // Implementar modal de visualização se necessário
    console.log('Visualizar fornecedor:', fornecedor);
  };

  // Filtrar fornecedores
  const fornecedoresFiltrados = fornecedores.filter(fornecedor => {
    const matchBusca = fornecedor.nome.toLowerCase().includes(buscaFornecedor.toLowerCase()) ||
                      fornecedor.razao_social?.toLowerCase().includes(buscaFornecedor.toLowerCase()) ||
                      fornecedor.cnpj?.includes(buscaFornecedor);
    
    const matchStatus = filtroStatusFornecedor === "todos" || fornecedor.status === filtroStatusFornecedor;
    
    return matchBusca && matchStatus;
  });

  // Funções para o sidebar
  const handleMudarAba = (aba: string) => {
    setAbaAtiva(aba);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-background prevent-zoom touch-optimized mobile-scroll overflow-x-hidden">
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
          <h1 className="text-base sm:text-lg font-semibold">Fornecedores</h1>
          <div className="w-8 sm:w-9" /> {/* Espaçador para centralizar o título */}
        </div>
        
        <div className="w-full max-w-full overflow-x-hidden p-3 sm:p-6 space-y-4 sm:space-y-6">
          {/* Header da Página */}
          <div className="w-full flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Fornecedores</h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-2">
                Gerencie seus fornecedores e parceiros comerciais
              </p>
            </div>
            <Button onClick={handleNovoFornecedor} className="bg-gradient-primary text-xs sm:text-sm h-8 sm:h-10">
              <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Novo Fornecedor</span>
              <span className="sm:hidden">Novo</span>
            </Button>
          </div>

          {/* Cards de Resumo - Design Moderno */}
          <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
            <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50">
              <CardContent className="p-2 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                  <div className="space-y-1">
                    <p className="text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400">Total de Fornecedores</p>
                    <p className="text-sm sm:text-2xl font-bold text-blue-700 dark:text-blue-300 break-words">{fornecedores.length}</p>
                  </div>
                  <div className="p-1 sm:p-3 rounded-full bg-blue-500/20 self-start sm:self-auto">
                    <Building2 className="h-3 w-3 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/50">
              <CardContent className="p-2 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                  <div className="space-y-1">
                    <p className="text-xs sm:text-sm font-medium text-green-600 dark:text-green-400">Fornecedores Ativos</p>
                    <p className="text-sm sm:text-2xl font-bold text-green-700 dark:text-green-300 break-words">
                      {fornecedores.filter(f => f.status === "ativo").length}
                    </p>
                  </div>
                  <div className="p-1 sm:p-3 rounded-full bg-green-500/20 self-start sm:self-auto">
                    <Building2 className="h-3 w-3 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/50 dark:to-orange-900/50">
              <CardContent className="p-2 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                  <div className="space-y-1">
                    <p className="text-xs sm:text-sm font-medium text-orange-600 dark:text-orange-400">Fornecedores Inativos</p>
                    <p className="text-sm sm:text-2xl font-bold text-orange-700 dark:text-orange-300 break-words">
                      {fornecedores.filter(f => f.status === "inativo").length}
                    </p>
                  </div>
                  <div className="p-1 sm:p-3 rounded-full bg-orange-500/20 self-start sm:self-auto">
                    <Building2 className="h-3 w-3 sm:h-6 sm:w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/50">
              <CardContent className="p-2 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                  <div className="space-y-1">
                    <p className="text-xs sm:text-sm font-medium text-purple-600 dark:text-purple-400">Com CNPJ</p>
                    <p className="text-sm sm:text-2xl font-bold text-purple-700 dark:text-purple-300 break-words">
                      {fornecedores.filter(f => f.cnpj).length}
                    </p>
                  </div>
                  <div className="p-1 sm:p-3 rounded-full bg-purple-500/20 self-start sm:self-auto">
                    <FileText className="h-3 w-3 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400" />
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
                      placeholder="Buscar fornecedores..."
                      value={buscaFornecedor}
                      onChange={(e) => setBuscaFornecedor(e.target.value)}
                      className="pl-8 sm:pl-10 h-8 sm:h-10 text-xs sm:text-sm"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Filter className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                  <Select value={filtroStatusFornecedor} onValueChange={setFiltroStatusFornecedor}>
                    <SelectTrigger className="w-full sm:w-40 h-8 sm:h-10 text-xs sm:text-sm">
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
          {carregandoFornecedores ? (
            <div className="flex items-center justify-center h-24 sm:h-32">
              <div className="text-center">
                <div className="animate-spin rounded-full h-4 w-4 sm:h-6 sm:w-6 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-xs sm:text-sm text-muted-foreground">Carregando fornecedores...</p>
              </div>
            </div>
          ) : fornecedoresFiltrados.length === 0 ? (
            <Card className="bg-gradient-card shadow-card">
              <CardContent className="p-6 sm:p-12 text-center">
                <Building2 className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                <h3 className="text-base sm:text-lg font-semibold mb-2">Nenhum fornecedor encontrado</h3>
                <p className="text-sm sm:text-base text-muted-foreground mb-4">
                  {buscaFornecedor || filtroStatusFornecedor !== 'todos' 
                    ? "Tente ajustar sua busca ou filtros" 
                    : "Adicione seu primeiro fornecedor"
                  }
                </p>
                <Button 
                  className="bg-gradient-primary text-xs sm:text-sm h-8 sm:h-10"
                  onClick={handleNovoFornecedor}
                >
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Adicionar Fornecedor</span>
                  <span className="sm:hidden">Adicionar</span>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {fornecedoresFiltrados.map((fornecedor) => (
                <Card key={fornecedor.id} className="bg-gradient-card shadow-card hover:shadow-lg transition-shadow duration-300">
                  <CardHeader className="pb-2 sm:pb-3">
                    <div className="flex items-center justify-between">
                      <div className="p-1 sm:p-1.5 rounded-lg bg-primary/10">
                        <div className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 rounded-full bg-gradient-primary flex items-center justify-center">
                          <span className="text-xs font-bold text-white">
                            {fornecedor.nome.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="scale-90 sm:scale-100">
                        <Badge variant={fornecedor.status === "ativo" ? "default" : "secondary"} className="text-xs">
                          {fornecedor.status === "ativo" ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-2 sm:space-y-3">
                    <div>
                      <h3 className="font-semibold text-sm sm:text-base lg:text-lg line-clamp-2 flex items-center space-x-2">
                        <span className="truncate">{fornecedor.nome}</span>
                      </h3>
                      {fornecedor.razao_social && (
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">
                          {fornecedor.razao_social}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1 sm:space-y-1.5 text-xs sm:text-sm">
                      {fornecedor.cnpj && (
                        <div className="flex items-center space-x-1.5 sm:space-x-2 text-muted-foreground">
                          <FileText className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                          <span className="truncate text-xs">{fornecedor.cnpj}</span>
                        </div>
                      )}
                      {fornecedor.email && (
                        <div className="flex items-center space-x-1.5 sm:space-x-2 text-muted-foreground">
                          <MailIcon className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                          <span className="truncate text-xs">{fornecedor.email}</span>
                        </div>
                      )}
                      {fornecedor.telefone && (
                        <div className="flex items-center space-x-1.5 sm:space-x-2 text-muted-foreground">
                          <PhoneIcon className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                          <span className="truncate text-xs">{fornecedor.telefone}</span>
                        </div>
                      )}
                      {(fornecedor.cidade || fornecedor.estado) && (
                        <div className="flex items-center space-x-1.5 sm:space-x-2 text-muted-foreground">
                          <MapPinIcon className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                          <span className="truncate text-xs">
                            {[fornecedor.cidade, fornecedor.estado].filter(Boolean).join(', ')}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1 sm:space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Status:</span>
                        <Badge variant={fornecedor.status === "ativo" ? "default" : "secondary"} className="text-xs scale-90 sm:scale-100">
                          {fornecedor.status === "ativo" ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                      {fornecedor.contato && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Contato:</span>
                          <span className="font-semibold text-primary text-xs truncate">
                            {fornecedor.contato}
                          </span>
                        </div>
                      )}
                    </div>

                    {fornecedor.observacoes && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">Observações:</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {fornecedor.observacoes}
                        </p>
                      </div>
                    )}

                    <div className="flex space-x-1 sm:space-x-1.5 pt-1 sm:pt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 text-xs h-7 sm:h-8"
                        onClick={() => handleEditarFornecedor(fornecedor)}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        <span className="hidden sm:inline">Editar</span>
                        <span className="sm:hidden">Ed.</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="px-2 h-7 sm:h-8"
                        onClick={() => handleExcluirFornecedor(fornecedor.id!)}
                        disabled={carregandoFornecedores}
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