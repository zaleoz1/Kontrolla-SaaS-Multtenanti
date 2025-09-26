import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePermissions } from '@/hooks/usePermissions';
import { 
  User, 
  Building2, 
  CreditCard, 
  Palette, 
  Bell, 
  Shield,
  Users,
  UserCog,
  Settings
} from 'lucide-react';

/**
 * Componente de exemplo demonstrando como o Configuracoes se comporta com diferentes permissões
 */
export function ConfiguracoesPermissionsExample() {
  const { permissions, operador } = usePermissions();

  // Se não há operador selecionado, não renderiza nada
  if (!operador) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Configurações - Sistema de Permissões</CardTitle>
          <CardDescription>
            Selecione um operador para ver como as configurações se adaptam às suas permissões
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Nenhum operador selecionado. Use o seletor de operador no header para ver as permissões.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Definição das abas de configurações com permissões
  const configuracoesTabs = [
    { 
      id: "conta", 
      nome: "Conta", 
      icone: User, 
      descricao: "Dados pessoais e da empresa",
      permissao: "configuracoes_gerais"
    },
    { 
      id: "fornecedores", 
      nome: "Fornecedores", 
      icone: Building2, 
      descricao: "Gerenciar fornecedores",
      permissao: "fornecedores"
    },
    { 
      id: "funcionarios", 
      nome: "Funcionários", 
      icone: Users, 
      descricao: "Gerenciar funcionários",
      permissao: "funcionarios"
    },
    { 
      id: "administracao", 
      nome: "Administração", 
      icone: UserCog, 
      descricao: "Gerenciar usuários e permissões",
      permissao: "configuracoes_administradores"
    },
    { 
      id: "pagamentos", 
      nome: "Meu Plano", 
      icone: CreditCard, 
      descricao: "Planos e assinatura",
      permissao: "configuracoes_gerais"
    },
    { 
      id: "metodos-pagamento", 
      nome: "Métodos De Pagamentos", 
      icone: CreditCard, 
      descricao: "Formas de pagamento",
      permissao: "configuracoes_pagamentos"
    },
    { 
      id: "tema", 
      nome: "Tema", 
      icone: Palette, 
      descricao: "Personalização visual",
      permissao: "configuracoes_gerais"
    },
    { 
      id: "notificacoes", 
      nome: "Notificações", 
      icone: Bell, 
      descricao: "Alertas e notificações",
      permissao: "configuracoes_gerais"
    },
    { 
      id: "seguranca", 
      nome: "Segurança", 
      icone: Shield, 
      descricao: "Configurações de segurança",
      permissao: "configuracoes_gerais"
    }
  ];

  // Função para determinar se uma aba deve ser visível (mesma lógica do ConfiguracoesSidebar)
  const isTabVisible = (tab: typeof configuracoesTabs[0]) => {
    // Se tem permissão específica da aba, mostra
    if (permissions[tab.permissao as keyof typeof permissions]) {
      return true;
    }

    // Para vendedores com permissão de configurações, mostra abas específicas
    if (operador?.role === 'vendedor' && permissions.configuracoes) {
      // Vendedores com configurações podem ver: fornecedores, funcionários e métodos de pagamento
      if (tab.id === 'fornecedores' || tab.id === 'funcionarios' || tab.id === 'metodos-pagamento') {
        return true;
      }
    }

    return false;
  };

  // Filtrar abas baseado nas permissões
  const abasVisiveis = configuracoesTabs.filter(aba => isTabVisible(aba));
  const abasOcultas = configuracoesTabs.filter(aba => !isTabVisible(aba));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurações - Sistema de Permissões
          </CardTitle>
          <CardDescription>
            Demonstração de como as configurações se adaptam às permissões do operador selecionado
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Informações do operador */}
          <div className="p-4 bg-slate-50 rounded-lg">
            <h3 className="font-semibold mb-2">Operador Atual:</h3>
            <p><strong>Nome:</strong> {operador.nome} {operador.sobrenome}</p>
            <p><strong>Role:</strong> <Badge variant="outline">{operador.role}</Badge></p>
            <p><strong>Status:</strong> <Badge variant="secondary">{operador.status}</Badge></p>
          </div>

          {/* Abas visíveis no Configuracoes */}
          <div className="space-y-3">
            <h3 className="font-semibold text-green-700">✅ Abas Visíveis no Configuracoes:</h3>
            <div className="space-y-3">
              {abasVisiveis.map((aba) => (
                <div key={aba.id} className="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg">
                  <aba.icone className="h-5 w-5 text-green-600 mr-3" />
                  <div className="flex-1">
                    <p className="font-medium text-green-800">{aba.nome}</p>
                    <p className="text-sm text-green-600">{aba.descricao}</p>
                    <p className="text-xs text-green-500">Permissão: {aba.permissao}</p>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Visível
                  </Badge>
                </div>
              ))}
            </div>
            
            {abasVisiveis.length === 0 && (
              <p className="text-muted-foreground italic">Nenhuma aba visível</p>
            )}
          </div>

          {/* Abas ocultas do Configuracoes */}
          <div className="space-y-3">
            <h3 className="font-semibold text-red-700">❌ Abas Ocultas do Configuracoes:</h3>
            <div className="space-y-3">
              {abasOcultas.map((aba) => (
                <div key={aba.id} className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg opacity-60">
                  <aba.icone className="h-5 w-5 text-red-400 mr-3" />
                  <div className="flex-1">
                    <p className="font-medium text-red-600">{aba.nome}</p>
                    <p className="text-sm text-red-500">{aba.descricao}</p>
                    <p className="text-xs text-red-400">Permissão: {aba.permissao}</p>
                  </div>
                  <Badge variant="destructive">
                    Oculto
                  </Badge>
                </div>
              ))}
            </div>
            
            {abasOcultas.length === 0 && (
              <p className="text-green-600 italic">Todas as abas estão visíveis</p>
            )}
          </div>

          {/* Simulação de layout do Configuracoes */}
          <div className="space-y-3">
            <h3 className="font-semibold">Simulação do Layout:</h3>
            <div className="p-4 bg-gray-50 border rounded-lg">
              <div className="space-y-4">
                {/* Sidebar simulado */}
                <div className="flex space-x-4">
                  <div className="w-64 bg-white border rounded-lg p-4">
                    <h4 className="font-semibold mb-3">Configurações</h4>
                    <div className="space-y-2">
                      {abasVisiveis.map((aba) => (
                        <div key={aba.id} className="flex items-center space-x-2 p-2 rounded hover:bg-gray-100">
                          <aba.icone className="h-4 w-4" />
                          <span className="text-sm">{aba.nome}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Conteúdo simulado */}
                  <div className="flex-1 bg-white border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">Conteúdo da Aba</h4>
                    <p className="text-sm text-muted-foreground">
                      {abasVisiveis.length > 0 
                        ? `Mostrando conteúdo da aba "${abasVisiveis[0].nome}"`
                        : "Nenhuma aba disponível"
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Resumo por Role */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">Comportamento por Role:</h3>
            {operador.role === 'administrador' && (
              <p className="text-blue-700">
                <strong>Administrador:</strong> Acesso completo a todas as configurações
              </p>
            )}
            {operador.role === 'gerente' && (
              <p className="text-blue-700">
                <strong>Gerente:</strong> Acesso a configurações gerais, fornecedores, funcionários e métodos de pagamento
              </p>
            )}
            {operador.role === 'vendedor' && (
              <p className="text-blue-700">
                <strong>Vendedor:</strong> {permissions.configuracoes 
                  ? "Acesso a fornecedores, funcionários e métodos de pagamento. Abre automaticamente na aba de métodos de pagamento. Campos de edição desabilitados (somente visualização). Modal de parcelas em modo visualização. Botões de produtos e clientes ocultos."
                  : "Acesso limitado apenas a vendas e clientes (sem permissão de configurações)"
                }
              </p>
            )}
            <p className="text-blue-700 mt-2">
              <strong>{abasVisiveis.length}</strong> de <strong>{configuracoesTabs.length}</strong> abas estão visíveis
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
