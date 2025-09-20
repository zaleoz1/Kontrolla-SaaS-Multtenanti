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
  EyeOff
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
              <h1 className="text-3xl font-bold tracking-tight">Fornecedores</h1>
              <p className="text-muted-foreground mt-2">
                Gerencie seus fornecedores e parceiros comerciais
              </p>
            </div>
            <Button onClick={handleNovoFornecedor} className="bg-gradient-primary">
              <Plus className="h-4 w-4 mr-2" />
              Novo Fornecedor
            </Button>
          </div>

          {/* Cards de Resumo - Design Moderno */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total de Fornecedores</p>
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{fornecedores.length}</p>
                  </div>
                  <div className="p-3 rounded-full bg-blue-500/20">
                    <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-green-600 dark:text-green-400">Fornecedores Ativos</p>
                    <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                      {fornecedores.filter(f => f.status === "ativo").length}
                    </p>
                  </div>
                  <div className="p-3 rounded-full bg-green-500/20">
                    <Building2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/50 dark:to-orange-900/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Fornecedores Inativos</p>
                    <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                      {fornecedores.filter(f => f.status === "inativo").length}
                    </p>
                  </div>
                  <div className="p-3 rounded-full bg-orange-500/20">
                    <Building2 className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Com CNPJ</p>
                    <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                      {fornecedores.filter(f => f.cnpj).length}
                    </p>
                  </div>
                  <div className="p-3 rounded-full bg-purple-500/20">
                    <FileText className="h-6 w-6 text-purple-600 dark:text-purple-400" />
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
          {carregandoFornecedores ? (
            <Card className="bg-gradient-card shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-center h-32">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-sm text-muted-foreground">Carregando fornecedores...</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : fornecedoresFiltrados.length === 0 ? (
            <Card className="bg-gradient-card shadow-card">
              <CardContent className="p-6">
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
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {fornecedoresFiltrados.map((fornecedor) => (
                <Card key={fornecedor.id} className="bg-gradient-card shadow-card hover:shadow-lg transition-all duration-200">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
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
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
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
                          <div className="mt-4">
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
                          onClick={() => handleVisualizarFornecedor(fornecedor)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
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
                          onClick={() => handleExcluirFornecedor(fornecedor.id!)}
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