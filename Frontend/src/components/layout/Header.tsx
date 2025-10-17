import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Bell, Plus, Menu, User, ChevronDown, Crown, Shield, ShoppingBag, CheckCircle, X } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAdministradores } from "@/hooks/useAdministradores";
import { useOperador } from "@/contexts/OperadorContext";
import { usePermissions } from "@/hooks/usePermissions";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { ZoomControls } from "@/components/ui/ZoomControls";
import { NotificationCenter } from "@/components/ui/NotificationCenter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PropsCabecalho {
  onMenuClick: () => void;
}

/**
 * Componente Header
 * Renderiza o cabeçalho da aplicação com botão de menu e botão de nova venda.
 */
export function Header({ onMenuClick }: PropsCabecalho) {
  const navigate = useNavigate();
  const location = useLocation();
  const { administradores, loading } = useAdministradores();
  const { operadorSelecionado, setOperadorSelecionado } = useOperador();
  const { hasPermission } = usePermissions();
  
  // Estados para o modal de código de acesso
  const [showAccessCodeModal, setShowAccessCodeModal] = useState(false);
  const [selectedOperador, setSelectedOperador] = useState<any>(null);
  const [accessCode, setAccessCode] = useState("");
  const [accessCodeError, setAccessCodeError] = useState("");

  // Validar se o operador selecionado ainda existe e está ativo
  useEffect(() => {
    if (operadorSelecionado && administradores.length > 0) {
      const operadorExiste = administradores.find(
        adm => adm.id === operadorSelecionado && adm.status === 'ativo'
      );
      
      if (!operadorExiste) {
        // Se o operador não existe mais ou não está ativo, limpar a seleção
        setOperadorSelecionado(null);
      }
    }
  }, [administradores, operadorSelecionado, setOperadorSelecionado]);

  // Função auxiliar para obter o operador atual
  const getOperadorAtual = () => {
    return administradores.find(adm => adm.id === operadorSelecionado);
  };

  // Função para abrir modal de código de acesso
  const handleOperadorClick = (operador: any) => {
    setSelectedOperador(operador);
    setAccessCode("");
    setAccessCodeError("");
    setShowAccessCodeModal(true);
  };

  // Função para validar e trocar operador
  const handleAccessCodeSubmit = () => {
    if (!accessCode.trim()) {
      setAccessCodeError("Código de acesso é obrigatório");
      return;
    }

    if (!selectedOperador) {
      setAccessCodeError("Operador não selecionado");
      return;
    }

    // Validar o código de acesso contra o código do operador selecionado
    if (accessCode === selectedOperador.codigo) {
      setOperadorSelecionado(selectedOperador.id);
      setShowAccessCodeModal(false);
      setSelectedOperador(null);
      setAccessCode("");
      setAccessCodeError("");
    } else {
      setAccessCodeError("Código de acesso inválido");
    }
  };

  // Função para cancelar modal
  const handleCancelModal = () => {
    setShowAccessCodeModal(false);
    setSelectedOperador(null);
    setAccessCode("");
    setAccessCodeError("");
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
    <header className="h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex-shrink-0 dark:bg-background/98 dark:supports-[backdrop-filter]:bg-background/70 dark-light:bg-background/98 dark-light:supports-[backdrop-filter]:bg-background/75 windows-dark:bg-background/98 windows-dark:supports-[backdrop-filter]:bg-background/80 border-border/60 dark:border-border/70 dark-light:border-border/70 windows-dark:border-border/70">
      <div className="flex h-full items-center justify-between px-6">
        {/* Botão de menu para mobile e telas menores que 1378px */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onMenuClick}
          className="min-[1378px]:hidden mr-2"
        >
          <Menu className="h-5 w-5" />
        </Button>


        {/* Área de ações - alinhada à direita */}
        <div className="flex items-center space-x-4 ml-auto">   
          {/* Botão para criar nova venda - só aparece se tiver permissão */}
          {hasPermission('vendas_criar') && (
            <Button variant="outline" size="sm" className="gap-2 bg-primary hover:bg-primary/90 text-white hover:text-white border-primary hover:border-primary/80 shadow-sm" onClick={() => navigate("/dashboard/nova-venda")}>
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Nova Venda</span>
            </Button>
          )}

          {/* Seletor de Operador */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2"
              >
                {(() => {
                  const operador = getOperadorAtual();
                  if (operador) {
                    switch (operador.role) {
                      case 'administrador':
                        return <Crown className="h-4 w-4 text-red-500" />;
                      case 'gerente':
                        return <Shield className="h-4 w-4 text-blue-500" />;
                      case 'vendedor':
                        return <ShoppingBag className="h-4 w-4 text-green-500" />;
                      default:
                        return <User className="h-4 w-4" />;
                    }
                  }
                  return <User className="h-4 w-4" />;
                })()}
                <span className="hidden sm:inline">
                  {operadorSelecionado 
                    ? (() => {
                        const operador = getOperadorAtual();
                        return operador ? `${operador.nome} ${operador.sobrenome}` : 'Selecionar Operador';
                      })()
                    : 'Selecionar Operador'
                  }
                </span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Selecionar Operador</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {loading ? (
                <DropdownMenuItem disabled>
                  Carregando...
                </DropdownMenuItem>
              ) : (
                <>
                  {operadorSelecionado && (
                    <>
                      <DropdownMenuItem
                        onClick={() => setOperadorSelecionado(null)}
                        className="text-muted-foreground bg-red-500 hover:bg-red-600 text-white hover:text-white"
                      >
                        Fechar Caixa
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  {administradores
                    .filter(adm => adm.status === 'ativo')
                    .map((administrador) => (
                      <DropdownMenuItem
                        key={administrador.id}
                        onClick={() => handleOperadorClick(administrador)}
                        className="flex flex-col items-start"
                      >
                        <div className="font-medium">
                          {administrador.nome} {administrador.sobrenome}
                        </div>
                        <div className="text-xs text-muted-foreground capitalize">
                          {administrador.role}
                        </div>
                      </DropdownMenuItem>
                    ))}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Controles de zoom */}
          <ZoomControls compact={true} />

          {/* Toggle de tema */}
          <ThemeToggle />

          {/* Centro de notificações - só aparece se tiver permissão de dashboard */}
          {hasPermission('dashboard') && (
            <NotificationCenter />
          )}
        </div>
      </div>

      {/* Modal de Código de Acesso */}
      <Dialog open={showAccessCodeModal} onOpenChange={setShowAccessCodeModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Código de Acesso
            </DialogTitle>
            <DialogDescription>
              Digite o código de acesso para o operador{" "}
              <span className="font-semibold">
                {selectedOperador?.nome} {selectedOperador?.sobrenome}
              </span>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Código de acesso
              </label>
              <Input
                type="text"
                placeholder="Digite o código de acesso"
                value={accessCode}
                onChange={(e) => {
                  setAccessCode(e.target.value);
                  setAccessCodeError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAccessCodeSubmit();
                  }
                }}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                data-form-type="other"
                data-lpignore="true"
                className="text-center"
              />
              {accessCodeError && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <X className="h-3 w-3" />
                  {accessCodeError}
                </p>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleCancelModal}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleAccessCodeSubmit}
                disabled={!accessCode.trim()}
                className="flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirmar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
}