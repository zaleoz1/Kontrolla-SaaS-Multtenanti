import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePermissions } from '@/hooks/usePermissions';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  BarChart3, 
  Settings,
  Store,
  Users,
  Receipt,
  TrendingUp
} from 'lucide-react';

/**
 * Componente de exemplo demonstrando como o Sidebar se comporta com diferentes permissões
 */
export function SidebarPermissionsExample() {
  const { permissions, operador } = usePermissions();

  // Se não há operador selecionado, não renderiza nada
  if (!operador) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sidebar - Sistema de Permissões</CardTitle>
          <CardDescription>
            Selecione um operador para ver como o Sidebar se adapta às suas permissões
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

  // Simulação dos itens de navegação do Sidebar
  const navegacao = [
    { nome: "Dashboard", href: "/dashboard", icone: LayoutDashboard, permissao: "dashboard" },
    { nome: "Produtos", href: "/dashboard/produtos", icone: Package, permissao: "produtos" },
    { nome: "Vendas", href: "/dashboard/vendas", icone: ShoppingCart, permissao: "vendas" },
    { nome: "Catálogo", href: "/dashboard/catalogo", icone: Store, permissao: "catalogo" },
    { nome: "Clientes", href: "/dashboard/clientes", icone: Users, permissao: "clientes" },
    { nome: "Relatórios", href: "/dashboard/relatorios", icone: BarChart3, permissao: "relatorios" },
    { nome: "Financeiro", href: "/dashboard/financeiro", icone: TrendingUp, permissao: "financeiro" },
    { nome: "NF-e", href: "/dashboard/nfe", icone: Receipt, permissao: "nfe" },
  ];

  // Filtrar itens baseado nas permissões (igual ao Sidebar real)
  const itensVisiveis = navegacao.filter(item => permissions[item.permissao as keyof typeof permissions]);
  const itensOcultos = navegacao.filter(item => !permissions[item.permissao as keyof typeof permissions]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Sidebar - Sistema de Permissões
          </CardTitle>
          <CardDescription>
            Demonstração de como o Sidebar se adapta às permissões do operador selecionado
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

          {/* Itens visíveis no Sidebar */}
          <div className="space-y-3">
            <h3 className="font-semibold text-green-700">✅ Itens Visíveis no Sidebar:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {itensVisiveis.map((item) => (
                <div key={item.nome} className="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg">
                  <item.icone className="h-5 w-5 text-green-600 mr-3" />
                  <div>
                    <p className="font-medium text-green-800">{item.nome}</p>
                    <p className="text-sm text-green-600">Permissão: {item.permissao}</p>
                  </div>
                </div>
              ))}
            </div>
            
            {itensVisiveis.length === 0 && (
              <p className="text-muted-foreground italic">Nenhum item de navegação visível</p>
            )}
          </div>

          {/* Itens ocultos do Sidebar */}
          <div className="space-y-3">
            <h3 className="font-semibold text-red-700">❌ Itens Ocultos do Sidebar:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {itensOcultos.map((item) => (
                <div key={item.nome} className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg opacity-60">
                  <item.icone className="h-5 w-5 text-red-400 mr-3" />
                  <div>
                    <p className="font-medium text-red-600">{item.nome}</p>
                    <p className="text-sm text-red-500">Sem permissão: {item.permissao}</p>
                  </div>
                </div>
              ))}
            </div>
            
            {itensOcultos.length === 0 && (
              <p className="text-green-600 italic">Todos os itens de navegação estão visíveis</p>
            )}
          </div>

          {/* Configurações */}
          <div className="space-y-3">
            <h3 className="font-semibold">Configurações:</h3>
            <div className="flex items-center p-3 bg-slate-50 border rounded-lg">
              <Settings className="h-5 w-5 mr-3" />
              <div>
                <p className="font-medium">Configurações</p>
                <Badge variant={permissions.configuracoes ? 'default' : 'destructive'} className="mt-1">
                  {permissions.configuracoes ? 'Visível' : 'Oculto'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Resumo */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">Resumo:</h3>
            <p className="text-blue-700">
              <strong>{itensVisiveis.length}</strong> de <strong>{navegacao.length}</strong> itens de navegação estão visíveis
            </p>
            <p className="text-blue-700">
              Configurações: <strong>{permissions.configuracoes ? 'Visível' : 'Oculto'}</strong>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
