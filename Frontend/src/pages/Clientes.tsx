import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useCrudApi } from "@/hooks/useApi";
import { API_ENDPOINTS, API_CONFIG } from "@/config/api";
import { 
  Plus, 
  Search, 
  Filter, 
  Users,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ShoppingBag,
  Edit,
  Trash2,
  Star,
  UserPlus,
  AlertCircle,
  RefreshCw
} from "lucide-react";

// Interface para o tipo Cliente
interface Cliente {
  id: number;
  nome: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  cpf_cnpj?: string;
  tipo_pessoa: 'fisica' | 'juridica';
  data_nascimento?: string;
  sexo?: 'masculino' | 'feminino' | 'outro';
  razao_social?: string;
  inscricao_estadual?: string;
  inscricao_municipal?: string;
  nome_fantasia?: string;
  observacoes?: string;
  status: 'ativo' | 'inativo';
  vip: boolean;
  total_compras: number;
  total_pagar?: number;
  quantidade_contas_pendentes?: number;
  data_criacao: string;
  data_atualizacao: string;
}

// Interface para resposta da API
interface ClientesResponse {
  clientes: Cliente[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Interface para estatísticas
interface ClientesStats {
  total_clientes: number;
  clientes_ativos: number;
  clientes_vip: number;
  receita_total: number;
}

export default function Clientes() {
  const [termoBusca, setTermoBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [totaisPagar, setTotaisPagar] = useState<Record<number, { total_pagar: number; quantidade_contas: number }>>({});
  const navigate = useNavigate();

  // Hooks para API
  const clientesApi = useCrudApi<ClientesResponse>(API_ENDPOINTS.CLIENTS.LIST);
  const statsApi = useCrudApi<{ stats: ClientesStats }>(API_ENDPOINTS.CLIENTS.STATS);

  // Carregar dados iniciais
  useEffect(() => {
    carregarClientes();
    carregarEstatisticas();
  }, [paginaAtual, termoBusca, filtroStatus]);

  // Dados dos clientes
  const clientes = clientesApi.data?.clientes || [];
  const pagination = clientesApi.data?.pagination;
  const stats = statsApi.data?.stats;

  // Carregar totais a pagar quando os clientes mudarem
  useEffect(() => {
    if (clientes.length > 0) {
      carregarTotaisPagar();
    }
  }, [clientes]);

  // Função para carregar clientes
  const carregarClientes = async () => {
    try {
      const params: Record<string, any> = {
        page: paginaAtual,
        limit: 12,
      };

      if (termoBusca) {
        params.q = termoBusca;
      }

      if (filtroStatus) {
        params.status = filtroStatus;
      }

      await clientesApi.list(params);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    }
  };

  // Função para carregar estatísticas
  const carregarEstatisticas = async () => {
    try {
      await statsApi.makeRequest(API_ENDPOINTS.CLIENTS.STATS);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  // Função para carregar totais a pagar dos clientes
  const carregarTotaisPagar = async () => {
    try {
      const promises = clientes.map(async (cliente) => {
        try {
          const url = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.CLIENTS.LIST}/${cliente.id}/total-pagar`;
          const token = localStorage.getItem('token');
          console.log(`🔗 Chamando URL: ${url}`);
          console.log(`🔑 Token: ${token ? 'Presente' : 'Ausente'}`);
          
          const response = await fetch(url, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log(`✅ Total a pagar para cliente ${cliente.id}:`, data);
            return { clienteId: cliente.id, data };
          } else {
            // Se a resposta não for ok, tentar ler o texto para debug
            const text = await response.text();
            console.error(`Erro ${response.status} ao buscar total a pagar do cliente ${cliente.id}:`, text);
            return { clienteId: cliente.id, data: { total_pagar: 0, quantidade_contas: 0 } };
          }
        } catch (error) {
          console.error(`Erro ao buscar total a pagar do cliente ${cliente.id}:`, error);
          return { clienteId: cliente.id, data: { total_pagar: 0, quantidade_contas: 0 } };
        }
      });

      const results = await Promise.all(promises);
      const novosTotais: Record<number, { total_pagar: number; quantidade_contas: number }> = {};
      
      results.forEach(({ clienteId, data }) => {
        novosTotais[clienteId] = data;
      });

      setTotaisPagar(novosTotais);
    } catch (error) {
      console.error('Erro ao carregar totais a pagar:', error);
    }
  };

  // Função para recarregar dados
  const recarregarDados = () => {
    carregarClientes();
    carregarEstatisticas();
  };

  // Função para deletar cliente
  const deletarCliente = async (id: number) => {
    if (!confirm('Tem certeza que deseja deletar este cliente?')) {
      return;
    }

    try {
      await clientesApi.remove(id);
      recarregarDados();
    } catch (error) {
      console.error('Erro ao deletar cliente:', error);
    }
  };

  const obterBadgeStatus = (status: string) => {
    switch (status) {
      case "ativo":
        return <Badge className="bg-success hover:bg-success/90">Ativo</Badge>;
      case "inativo":
        return <Badge variant="secondary">Inativo</Badge>;
      default:
        return <Badge variant="secondary">Desconhecido</Badge>;
    }
  };

  // Função para formatar endereço completo
  const formatarEndereco = (cliente: Cliente) => {
    const partes = [];
    if (cliente.endereco) partes.push(cliente.endereco);
    if (cliente.cidade) partes.push(cliente.cidade);
    if (cliente.estado) partes.push(cliente.estado);
    if (cliente.cep) partes.push(cliente.cep);
    return partes.join(', ') || 'Endereço não informado';
  };

  // Função para formatar data
  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString("pt-BR");
  };

  // Função para formatar moeda
  const formatarMoeda = (valor: number) => {
    const valorNumerico = Number(valor) || 0;
    return valorNumerico.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold">Clientes</h1>
          <p className="text-muted-foreground">
            Gerencie seus clientes e relacionamentos
          </p>
        </div>
        <Button className="bg-gradient-primary" onClick={() => navigate("/dashboard/novo-cliente")}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Cliente
        </Button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Clientes</p>
                {statsApi.loading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold">{stats?.total_clientes || 0}</p>
                )}
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
                <p className="text-sm font-medium text-muted-foreground">Clientes Ativos</p>
                {statsApi.loading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold">{stats?.clientes_ativos || 0}</p>
                )}
              </div>
              <div className="p-2 rounded-lg bg-success/10">
                <UserPlus className="h-5 w-5 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Clientes VIP</p>
                {statsApi.loading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold">{stats?.clientes_vip || 0}</p>
                )}
              </div>
              <div className="p-2 rounded-lg bg-warning/10">
                <Star className="h-5 w-5 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Receita Total</p>
                {statsApi.loading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <p className="text-2xl font-bold">
                    {formatarMoeda(Number(stats?.receita_total) || 0)}
                  </p>
                )}
              </div>
              <div className="p-2 rounded-lg bg-accent/10">
                <ShoppingBag className="h-5 w-5 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tratamento de Erro */}
      {(clientesApi.error || statsApi.error) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {clientesApi.error || statsApi.error}
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-2"
              onClick={recarregarDados}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Filtros */}
      <Card className="bg-gradient-card shadow-card">
        <CardContent className="p-6">
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-y-0 md:space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, email ou telefone..."
                value={termoBusca}
                onChange={(e) => {
                  setTermoBusca(e.target.value);
                  setPaginaAtual(1); // Reset para primeira página ao buscar
                }}
                className="pl-10"
              />
            </div>
            <div className="flex space-x-2">
              <select
                value={filtroStatus}
                onChange={(e) => {
                  setFiltroStatus(e.target.value);
                  setPaginaAtual(1); // Reset para primeira página ao filtrar
                }}
                className="px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                <option value="">Todos os status</option>
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
              </select>
              <Button variant="outline" onClick={recarregarDados}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Clientes */}
      {clientesApi.loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="bg-gradient-card shadow-card">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
                <div className="flex space-x-2 pt-2">
                  <Skeleton className="h-8 flex-1" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {clientes.map((cliente) => (
            <Card key={cliente.id} className="bg-gradient-card shadow-card hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
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
                      <div className="text-sm text-muted-foreground">
                        {cliente.tipo_pessoa === 'juridica' ? 'Pessoa Jurídica' : 'Pessoa Física'}
                      </div>
                    </div>
                  </div>
                  {obterBadgeStatus(cliente.status)}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
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
                  <div className="flex items-center space-x-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span className="truncate">{formatarEndereco(cliente)}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Cliente desde {formatarData(cliente.data_criacao)}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-border/50">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Total Gasto</p>
                      <p className="font-semibold text-primary text-lg">{formatarMoeda(Number(cliente.total_compras) || 0)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Total a Pagar</p>
                      <p className="font-semibold text-orange-600 text-lg">
                        {formatarMoeda(Number(totaisPagar[cliente.id]?.total_pagar) || 0)}
                      </p>
                      {totaisPagar[cliente.id]?.quantidade_contas > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {totaisPagar[cliente.id].quantidade_contas} {totaisPagar[cliente.id].quantidade_contas === 1 ? 'conta' : 'contas'} pendente{totaisPagar[cliente.id].quantidade_contas !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {cliente.cpf_cnpj && (
                  <div className="text-xs text-muted-foreground">
                    {cliente.tipo_pessoa === 'juridica' ? 'CNPJ' : 'CPF'}: {cliente.cpf_cnpj}
                  </div>
                )}

                <div className="flex space-x-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => navigate(`/dashboard/novo-cliente/${cliente.id}`)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => deletarCliente(cliente.id)}
                    disabled={clientesApi.loading}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Estado Vazio */}
      {!clientesApi.loading && clientes.length === 0 && (
        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum cliente encontrado</h3>
            <p className="text-muted-foreground mb-4">
              {termoBusca || filtroStatus ? "Tente ajustar sua busca ou filtros" : "Adicione seu primeiro cliente"}
            </p>
            <Button className="bg-gradient-primary" onClick={() => navigate("/dashboard/novo-cliente")}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Cliente
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Paginação */}
      {pagination && pagination.totalPages > 1 && (
        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Mostrando {((pagination.page - 1) * pagination.limit) + 1} a {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} clientes
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPaginaAtual(paginaAtual - 1)}
                  disabled={!pagination.hasPrev || clientesApi.loading}
                >
                  Anterior
                </Button>
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <Button
                        key={pageNum}
                        variant={pageNum === paginaAtual ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPaginaAtual(pageNum)}
                        disabled={clientesApi.loading}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPaginaAtual(paginaAtual + 1)}
                  disabled={!pagination.hasNext || clientesApi.loading}
                >
                  Próxima
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}