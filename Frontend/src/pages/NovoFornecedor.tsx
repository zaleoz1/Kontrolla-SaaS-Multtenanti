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
import { useFornecedores } from '@/hooks/useFornecedores';
import { ConfiguracoesSidebar } from '@/components/layout/ConfiguracoesSidebar';
import { useAuth } from '@/hooks/useAuth';
import { 
  Building2, 
  Save, 
  X, 
  Mail,
  Phone,
  MapPin,
  Building,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';

interface Fornecedor {
  id?: number;
  nome: string;
  razao_social?: string;
  cnpj?: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  contato?: string;
  observacoes?: string;
  status: string;
}

export default function NovoFornecedor() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const { logout } = useAuth();
  const { 
    criarFornecedor, 
    atualizarFornecedor: atualizarFornecedorHook, 
    buscarFornecedor, 
    buscarCep,
    salvando,
    carregando 
  } = useFornecedores();
  
  const [abaAtiva, setAbaAtiva] = useState("basico");
  const [carregandoFornecedor, setCarregandoFornecedor] = useState(false);
  
  const [fornecedor, setFornecedor] = useState<Fornecedor>({
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

  const isEditando = !!id;

  useEffect(() => {
    if (isEditando) {
      carregarFornecedor();
    }
  }, [id]);

  const carregarFornecedor = async () => {
    try {
      setCarregandoFornecedor(true);
      const fornecedorData = await buscarFornecedor(parseInt(id!));
      setFornecedor(fornecedorData);
    } catch (error) {
      // Erro já tratado no hook
    } finally {
      setCarregandoFornecedor(false);
    }
  };

  const atualizarFornecedor = (campo: keyof Fornecedor, valor: string) => {
    setFornecedor(prev => ({ ...prev, [campo]: valor }));
  };

  const atualizarEndereco = (campo: keyof Fornecedor, valor: string) => {
    setFornecedor(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  const handleBuscarCep = async (cep: string) => {
    const cepLimpo = cep.replace(/\D/g, '');
    if (cepLimpo.length === 8) {
      try {
        const dadosCep = await buscarCep(cep);
        if (dadosCep) {
          setFornecedor(prev => ({
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

  const salvarFornecedor = async () => {
    try {
      // Preparar dados para envio
      const dadosFornecedor = {
        nome: fornecedor.nome.trim(),
        razao_social: fornecedor.razao_social?.trim() || null,
        cnpj: fornecedor.cnpj?.trim() || null,
        email: fornecedor.email?.trim() || null,
        telefone: fornecedor.telefone?.trim() || null,
        endereco: fornecedor.endereco?.trim() || null,
        cidade: fornecedor.cidade?.trim() || null,
        estado: fornecedor.estado?.trim() || null,
        cep: fornecedor.cep?.trim() || null,
        contato: fornecedor.contato?.trim() || null,
        observacoes: fornecedor.observacoes?.trim() || null,
        status: fornecedor.status
      };

      if (isEditando && id) {
        await atualizarFornecedorHook(parseInt(id), dadosFornecedor);
      } else {
        await criarFornecedor(dadosFornecedor);
      }
      
      navigate('/dashboard/configuracoes');
    } catch (error) {
      // Erro já tratado no hook
    }
  };

  const formularioValido = fornecedor.nome && fornecedor.telefone;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar de configurações */}
      <ConfiguracoesSidebar
        activeTab="fornecedores"
        onTabChange={(tab) => {
          if (tab === "conta") {
            navigate("/dashboard/configuracoes");
          }
        }}
        onLogout={handleLogout}
      />

      {/* Conteúdo principal */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold">
            {isEditando ? 'Editar Fornecedor' : 'Novo Fornecedor'}
          </h1>
          <p className="text-muted-foreground">
            {isEditando 
              ? 'Edite as informações do fornecedor' 
              : 'Cadastre um novo fornecedor no sistema'
            }
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => navigate("/dashboard/configuracoes")}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button 
            className="bg-gradient-primary" 
            onClick={salvarFornecedor}
            disabled={!formularioValido || salvando || carregandoFornecedor}
          >
            {salvando ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {salvando 
              ? (isEditando ? 'Atualizando...' : 'Salvando...') 
              : (isEditando ? 'Atualizar Fornecedor' : 'Salvar Fornecedor')
            }
          </Button>
        </div>
      </div>

      {/* Conteúdo Principal */}
      {carregandoFornecedor ? (
        <div className="flex items-center justify-center p-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando dados do fornecedor...</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Coluna Esquerda - Formulário */}
          <div className="lg:col-span-2">
            <Tabs value={abaAtiva} onValueChange={setAbaAtiva} className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basico" className="flex items-center space-x-2">
                  <Building2 className="h-4 w-4" />
                  <span>Básico</span>
                </TabsTrigger>
                <TabsTrigger value="endereco" className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4" />
                  <span>Endereço</span>
                </TabsTrigger>
                <TabsTrigger value="avancado" className="flex items-center space-x-2">
                  <Building className="h-4 w-4" />
                  <span>Avançado</span>
                </TabsTrigger>
              </TabsList>

              {/* Aba Básico */}
              <TabsContent value="basico" className="space-y-4">
                <Card className="bg-gradient-card shadow-card">
                  <CardHeader>
                    <CardTitle>Informações Básicas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="text-sm font-medium">Nome do Fornecedor *</label>
                        <Input
                          placeholder="Nome do fornecedor"
                          value={fornecedor.nome}
                          onChange={(e) => atualizarFornecedor("nome", e.target.value)}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium">Razão Social</label>
                        <Input
                          placeholder="Razão social"
                          value={fornecedor.razao_social || ""}
                          onChange={(e) => atualizarFornecedor("razao_social", e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="text-sm font-medium">CNPJ</label>
                        <Input
                          placeholder="00.000.000/0000-00"
                          value={fornecedor.cnpj || ""}
                          onChange={(e) => atualizarFornecedor("cnpj", e.target.value)}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium">Contato</label>
                        <Input
                          placeholder="Nome do contato"
                          value={fornecedor.contato || ""}
                          onChange={(e) => atualizarFornecedor("contato", e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="text-sm font-medium">Email</label>
                        <Input
                          type="email"
                          placeholder="fornecedor@email.com"
                          value={fornecedor.email || ""}
                          onChange={(e) => atualizarFornecedor("email", e.target.value)}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium">Telefone *</label>
                        <Input
                          placeholder="(00) 00000-0000"
                          value={fornecedor.telefone || ""}
                          onChange={(e) => atualizarFornecedor("telefone", e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Observações</label>
                      <textarea
                        placeholder="Observações sobre o fornecedor..."
                        value={fornecedor.observacoes || ""}
                        onChange={(e) => atualizarFornecedor("observacoes", e.target.value)}
                        className="w-full mt-1 p-2 border rounded-md bg-background min-h-[80px] resize-none"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Aba Endereço */}
              <TabsContent value="endereco" className="space-y-4">
                <Card className="bg-gradient-card shadow-card">
                  <CardHeader>
                    <CardTitle>Endereço</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="text-sm font-medium">CEP</label>
                        <Input
                          placeholder="00000-000"
                          value={fornecedor.cep || ""}
                          onChange={(e) => {
                            atualizarEndereco("cep", e.target.value);
                            if (e.target.value.length === 8) {
                              handleBuscarCep(e.target.value);
                            }
                          }}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium">Endereço</label>
                        <Input
                          placeholder="Rua, Avenida, número, bairro"
                          value={fornecedor.endereco || ""}
                          onChange={(e) => atualizarEndereco("endereco", e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="text-sm font-medium">Cidade</label>
                        <Input
                          placeholder="Nome da cidade"
                          value={fornecedor.cidade || ""}
                          onChange={(e) => atualizarEndereco("cidade", e.target.value)}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium">Estado</label>
                        <select
                          value={fornecedor.estado || ""}
                          onChange={(e) => atualizarEndereco("estado", e.target.value)}
                          className="w-full mt-1 p-2 border rounded-md bg-background"
                        >
                          <option value="">Selecione o estado</option>
                          <option value="AC">Acre</option>
                          <option value="AL">Alagoas</option>
                          <option value="AP">Amapá</option>
                          <option value="AM">Amazonas</option>
                          <option value="BA">Bahia</option>
                          <option value="CE">Ceará</option>
                          <option value="DF">Distrito Federal</option>
                          <option value="ES">Espírito Santo</option>
                          <option value="GO">Goiás</option>
                          <option value="MA">Maranhão</option>
                          <option value="MT">Mato Grosso</option>
                          <option value="MS">Mato Grosso do Sul</option>
                          <option value="MG">Minas Gerais</option>
                          <option value="PA">Pará</option>
                          <option value="PB">Paraíba</option>
                          <option value="PR">Paraná</option>
                          <option value="PE">Pernambuco</option>
                          <option value="PI">Piauí</option>
                          <option value="RJ">Rio de Janeiro</option>
                          <option value="RN">Rio Grande do Norte</option>
                          <option value="RS">Rio Grande do Sul</option>
                          <option value="RO">Rondônia</option>
                          <option value="RR">Roraima</option>
                          <option value="SC">Santa Catarina</option>
                          <option value="SP">São Paulo</option>
                          <option value="SE">Sergipe</option>
                          <option value="TO">Tocantins</option>
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
                    <CardTitle>Configurações Avançadas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="text-sm font-medium">Status</label>
                        <select
                          value={fornecedor.status}
                          onChange={(e) => atualizarFornecedor("status", e.target.value)}
                          className="w-full mt-1 p-2 border rounded-md bg-background"
                        >
                          <option value="ativo">Ativo</option>
                          <option value="inativo">Inativo</option>
                        </select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Coluna Direita - Preview */}
          <div className="space-y-4">
            {/* Preview do Fornecedor */}
            <Card className="bg-gradient-card shadow-card">
              <CardHeader>
                <CardTitle>Preview do Fornecedor</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {fornecedor.nome ? (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="h-12 w-12 rounded-full bg-gradient-primary flex items-center justify-center">
                        <span className="text-lg font-bold text-white">
                          {fornecedor.nome.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold">{fornecedor.nome}</h3>
                        <Badge variant={fornecedor.status === "ativo" ? "default" : "secondary"} 
                               className={fornecedor.status === "ativo" ? "bg-success" : ""}>
                          {fornecedor.status === "ativo" ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      {fornecedor.email && (
                        <div className="flex items-center space-x-2 text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          <span className="truncate">{fornecedor.email}</span>
                        </div>
                      )}
                      {fornecedor.telefone && (
                        <div className="flex items-center space-x-2 text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          <span>{fornecedor.telefone}</span>
                        </div>
                      )}
                      {fornecedor.cnpj && (
                        <div className="flex items-center space-x-2 text-muted-foreground">
                          <Building2 className="h-4 w-4" />
                          <span>{fornecedor.cnpj}</span>
                        </div>
                      )}
                      {fornecedor.cidade && fornecedor.estado && (
                        <div className="flex items-center space-x-2 text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{fornecedor.cidade}, {fornecedor.estado}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground">
                    <Building2 className="h-12 w-12 mx-auto mb-2" />
                    <p>Preencha as informações básicas para ver o preview</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Validação do Formulário */}
            <Card className="bg-gradient-card shadow-card">
              <CardHeader>
                <CardTitle>Status do Formulário</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center space-x-2">
                  {fornecedor.nome ? (
                    <CheckCircle className="h-4 w-4 text-success" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-sm">Nome do fornecedor</span>
                </div>

                <div className="flex items-center space-x-2">
                  {fornecedor.telefone ? (
                    <CheckCircle className="h-4 w-4 text-success" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-sm">Telefone</span>
                </div>

                <div className="flex items-center space-x-2">
                  {fornecedor.email ? (
                    <CheckCircle className="h-4 w-4 text-success" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-sm">Email (opcional)</span>
                </div>

                {formularioValido && (
                  <div className="pt-2 border-t">
                    <div className="flex items-center space-x-2 text-success">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Formulário válido</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Dicas */}
            <Card className="bg-gradient-card shadow-card">
              <CardHeader>
                <CardTitle>Dicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>• Preencha todos os campos obrigatórios marcados com *</p>
                <p>• Use o CEP para preenchimento automático do endereço</p>
                <p>• O CNPJ é opcional mas recomendado para fornecedores</p>
                <p>• Mantenha as informações de contato sempre atualizadas</p>
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
