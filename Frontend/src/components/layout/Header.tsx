import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Bell, Plus, Menu, User, ChevronDown, Shield, Crown, Star, UserCheck, Eye, EyeOff, Key } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { useConfiguracoes } from "@/hooks/useConfiguracoes";
import { useToast } from "@/hooks/use-toast";

interface PropsCabecalho {
  onMenuClick: () => void;
}

/**
 * Componente Header
 * Renderiza o cabeçalho da aplicação com barra de busca, botão de nova venda,
 * ícone de notificações e informações da loja.
 */
export function Header({ onMenuClick }: PropsCabecalho) {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<any>(null);
  const [operadorAtual, setOperadorAtual] = useState<any>(null);
  const [mostrarSelecaoOperador, setMostrarSelecaoOperador] = useState(false);
  const [administradores, setAdministradores] = useState<any[]>([]);
  const [senhaOperador, setSenhaOperador] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [operadorSelecionado, setOperadorSelecionado] = useState<any>(null);
  const [mostrarModalSenha, setMostrarModalSenha] = useState(false);
  
  const { buscarAdministradores, validarSenhaOperador } = useConfiguracoes();
  const { toast } = useToast();

  useEffect(() => {
    // Carregar dados do usuário do localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      const userParsed = JSON.parse(userData);
      setUser(userParsed);
    }

    // Carregar operador atual do localStorage se existir
    const operadorData = localStorage.getItem('operadorAtual');
    if (operadorData) {
      const operadorParsed = JSON.parse(operadorData);
      setOperadorAtual(operadorParsed);
    }
  }, []);

  useEffect(() => {
    // Carregar administradores quando o modal for aberto
    if (mostrarSelecaoOperador) {
      carregarAdministradores();
    }
  }, [mostrarSelecaoOperador]);

  // Salvar operador no localStorage sempre que ele mudar
  useEffect(() => {
    if (operadorAtual) {
      localStorage.setItem('operadorAtual', JSON.stringify(operadorAtual));
    } else {
      localStorage.removeItem('operadorAtual');
    }
  }, [operadorAtual]);

  const carregarAdministradores = async () => {
    try {
      const admins = await buscarAdministradores({});
      setAdministradores(admins || []);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar administradores",
        variant: "destructive"
      });
    }
  };

  const handleSelecionarOperador = (admin: any) => {
    setOperadorSelecionado(admin);
    setMostrarSelecaoOperador(false);
    setMostrarModalSenha(true);
  };

  const handleConfirmarSenha = async () => {
    if (!operadorSelecionado || !senhaOperador) {
      toast({
        title: "Erro",
        description: "Senha é obrigatória",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await validarSenhaOperador(operadorSelecionado.id, senhaOperador);
      
      if (response.success) {
        setOperadorAtual(response.administrador);
        setMostrarModalSenha(false);
        setSenhaOperador("");
        toast({
          title: "Sucesso",
          description: `Operador alterado para ${response.administrador.nome} ${response.administrador.sobrenome}`,
          variant: "default"
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao validar senha",
        variant: "destructive"
      });
    }
  };

  const obterIconeRole = (role: string) => {
    switch (role) {
      case "administrador":
        return <Crown className="h-4 w-4 text-red-500" />;
      case "gerente":
        return <Star className="h-4 w-4 text-blue-500" />;
      case "vendedor":
        return <UserCheck className="h-4 w-4 text-green-500" />;
      default:
        return <User className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const obterNomeRole = (role: string) => {
    switch (role) {
      case "administrador":
        return "Administrador";
      case "gerente":
        return "Gerente";
      case "vendedor":
        return "Vendedor";
      default:
        return "Desconhecido";
    }
  };

  const obterIconeComNomeRole = (role: string) => {
    switch (role) {
      case "administrador":
        return (
          <div className="flex items-center space-x-2">
            <Crown className="h-4 w-4 text-red-500" />
            <span className="text-sm text-muted-foreground">Administrador</span>
          </div>
        );
      case "gerente":
        return (
          <div className="flex items-center space-x-2">
            <Star className="h-4 w-4 text-blue-500" />
            <span className="text-sm text-muted-foreground">Gerente</span>
          </div>
        );
      case "vendedor":
        return (
          <div className="flex items-center space-x-2">
            <UserCheck className="h-4 w-4 text-green-500" />
            <span className="text-sm text-muted-foreground">Vendedor</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center space-x-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Desconhecido</span>
          </div>
        );
    }
  };


  // Verificar se está em páginas que não devem mostrar o header
  const isNovaVendaPage = location.pathname === '/dashboard/nova-venda';
  const isNovoFuncionarioPage = location.pathname === '/dashboard/novo-funcionario' || location.pathname.startsWith('/dashboard/novo-funcionario/');
  const isConfiguracoesPage = location.pathname === '/dashboard/configuracoes';
  const isNovoFornecedorPage = location.pathname === '/dashboard/novo-fornecedor' || location.pathname.startsWith('/dashboard/novo-fornecedor/');
  const isPagamentosPage = location.pathname === '/dashboard/pagamentos';
  
  // Se estiver em páginas que usam layout próprio, não renderizar o header
  if (isNovaVendaPage || isNovoFuncionarioPage || isConfiguracoesPage || isNovoFornecedorPage || isPagamentosPage) {
    return null;
  }

  return (
    // Header principal com fundo e borda inferior
    <header className="h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex-shrink-0">
      <div className="flex h-full items-center justify-between px-6">
        {/* Botão de menu para mobile */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onMenuClick}
          className="lg:hidden mr-2"
        >
          <Menu className="h-5 w-5" />
        </Button>


        {/* Área de ações e informações - alinhada à direita */}
        <div className="flex items-center space-x-4 ml-auto">   
          {/* Botão para criar nova venda */}
          <Button variant="outline" size="sm" className="gap-2" onClick={() => navigate("/dashboard/nova-venda")}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nova Venda</span>
          </Button>

          {/* Informações do usuário e operador */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                {/* Informações do operador atual ou botão de seleção */}
              <div className="text-right hidden sm:block">
                  {operadorAtual ? (
                    <Dialog open={mostrarSelecaoOperador} onOpenChange={setMostrarSelecaoOperador}>
                      <DialogTrigger asChild>
                        <Card className="p-1.5 bg-muted/30 border-muted cursor-pointer hover:bg-muted/50 transition-colors">
                          <CardContent className="p-0">
                            <div className="flex items-center space-x-2">
                              {obterIconeRole(operadorAtual.role)}
                              <p className="text-base font-medium">{operadorAtual.nome} {operadorAtual.sobrenome}</p>
                              <ChevronDown className="h-3 w-3 text-muted-foreground" />
                            </div>
                          </CardContent>
                        </Card>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            Selecionar Operador do Sistema
                          </DialogTitle>
                        </DialogHeader>
                        <div className="overflow-y-auto max-h-[60vh]">
                          <div className="grid gap-3">
                            {administradores.map((admin) => (
                              <Card 
                                key={admin.id} 
                                className="cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() => handleSelecionarOperador(admin)}
                              >
                                <CardContent className="p-4">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                      <div className="p-2 rounded-lg bg-primary/10">
                                        <User className="h-5 w-5 text-primary" />
                                      </div>
                                      <div>
                                        <h3 className="font-semibold">{admin.nome} {admin.sobrenome}</h3>
                                        <p className="text-sm text-muted-foreground">{admin.email}</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      {obterIconeComNomeRole(admin.role)}
                                      <Badge variant={admin.status === "ativo" ? "default" : "secondary"}>
                                        {admin.status}
                                      </Badge>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  ) : (
                    <Dialog open={mostrarSelecaoOperador} onOpenChange={setMostrarSelecaoOperador}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2">
                          <User className="h-4 w-4" />
                          <span className="hidden sm:inline">Trocar Operador</span>
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            Selecionar Operador do Sistema
                          </DialogTitle>
                        </DialogHeader>
                        <div className="overflow-y-auto max-h-[60vh]">
                          <div className="grid gap-3">
                            {administradores.map((admin) => (
                              <Card 
                                key={admin.id} 
                                className="cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() => handleSelecionarOperador(admin)}
                              >
                                <CardContent className="p-4">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                      <div className="p-2 rounded-lg bg-primary/10">
                                        <User className="h-5 w-5 text-primary" />
                                      </div>
                                      <div>
                                        <h3 className="font-semibold">{admin.nome} {admin.sobrenome}</h3>
                                        <p className="text-sm text-muted-foreground">{admin.email}</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      {obterIconeComNomeRole(admin.role)}
                                      <Badge variant={admin.status === "ativo" ? "default" : "secondary"}>
                                        {admin.status}
                                      </Badge>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
                
                {/* Ícone de notificações com badge */}
                <div className="relative">
                  <Button variant="ghost" size="sm" className="relative">
                    <Bell className="h-5 w-5" />
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                    >
                      3
                    </Badge>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/login")}
                >
                  Entrar
                </Button>
                <Button
                  size="sm"
                  onClick={() => navigate("/signup")}
                >
                  Cadastrar
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de confirmação de senha */}
      <Dialog open={mostrarModalSenha} onOpenChange={setMostrarModalSenha}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Confirmar Senha do Operador
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {operadorSelecionado && (
              <div className="p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{operadorSelecionado.nome} {operadorSelecionado.sobrenome}</h3>
                    <p className="text-sm text-muted-foreground">{operadorSelecionado.email}</p>
                    {obterIconeRole(operadorSelecionado.role)}
                  </div>
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="senha-operador">Senha do Operador</Label>
              <div className="relative">
                <Input
                  id="senha-operador"
                  type={mostrarSenha ? "text" : "password"}
                  value={senhaOperador}
                  onChange={(e) => setSenhaOperador(e.target.value)}
                  placeholder="Digite a senha do operador"
                  className="pr-10"
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
            
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setMostrarModalSenha(false);
                  setOperadorSelecionado(null);
                  setSenhaOperador("");
                }}
              >
                Cancelar
              </Button>
              <Button onClick={handleConfirmarSenha}>
                Confirmar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
}