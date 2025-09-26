import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePermissions } from '@/hooks/usePermissions';
import { 
  TrendingUp, 
  Eye, 
  Package, 
  RefreshCw,
  ShoppingCart,
  BarChart3
} from 'lucide-react';

/**
 * Componente de exemplo demonstrando como o Dashboard se comporta com diferentes permissões
 */
export function DashboardPermissionsExample() {
  const { permissions, operador } = usePermissions();

  // Se não há operador selecionado, não renderiza nada
  if (!operador) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Dashboard - Sistema de Permissões</CardTitle>
          <CardDescription>
            Selecione um operador para ver como o Dashboard se adapta às suas permissões
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

  // Simulação dos botões do Dashboard
  const botoesDashboard = [
    {
      nome: "Ver Relatórios",
      icone: TrendingUp,
      permissao: "relatorios",
      localizacao: "Header (Desktop e Mobile)",
      descricao: "Acesso aos relatórios detalhados do sistema"
    },
    {
      nome: "Ver Todas (Vendas)",
      icone: Eye,
      permissao: "vendas",
      localizacao: "Card Vendas Recentes",
      descricao: "Visualizar todas as vendas realizadas"
    },
    {
      nome: "Gerenciar Estoque",
      icone: Package,
      permissao: "produtos",
      localizacao: "Card Estoque Baixo",
      descricao: "Gerenciar produtos e estoque"
    },
    {
      nome: "Ver Produtos",
      icone: Package,
      permissao: "produtos",
      localizacao: "Card Estoque Baixo (quando estoque OK)",
      descricao: "Visualizar catálogo de produtos"
    }
  ];

  // Filtrar botões baseado nas permissões
  const botoesVisiveis = botoesDashboard.filter(botao => permissions[botao.permissao as keyof typeof permissions]);
  const botoesOcultos = botoesDashboard.filter(botao => !permissions[botao.permissao as keyof typeof permissions]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Dashboard - Sistema de Permissões
          </CardTitle>
          <CardDescription>
            Demonstração de como o Dashboard se adapta às permissões do operador selecionado
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

          {/* Botões visíveis no Dashboard */}
          <div className="space-y-3">
            <h3 className="font-semibold text-green-700">✅ Botões Visíveis no Dashboard:</h3>
            <div className="space-y-3">
              {botoesVisiveis.map((botao) => (
                <div key={botao.nome} className="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg">
                  <botao.icone className="h-5 w-5 text-green-600 mr-3" />
                  <div className="flex-1">
                    <p className="font-medium text-green-800">{botao.nome}</p>
                    <p className="text-sm text-green-600">{botao.localizacao}</p>
                    <p className="text-xs text-green-500">{botao.descricao}</p>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Visível
                  </Badge>
                </div>
              ))}
            </div>
            
            {botoesVisiveis.length === 0 && (
              <p className="text-muted-foreground italic">Nenhum botão adicional visível</p>
            )}
          </div>

          {/* Botões ocultos do Dashboard */}
          <div className="space-y-3">
            <h3 className="font-semibold text-red-700">❌ Botões Ocultos do Dashboard:</h3>
            <div className="space-y-3">
              {botoesOcultos.map((botao) => (
                <div key={botao.nome} className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg opacity-60">
                  <botao.icone className="h-5 w-5 text-red-400 mr-3" />
                  <div className="flex-1">
                    <p className="font-medium text-red-600">{botao.nome}</p>
                    <p className="text-sm text-red-500">{botao.localizacao}</p>
                    <p className="text-xs text-red-400">{botao.descricao}</p>
                  </div>
                  <Badge variant="destructive">
                    Oculto
                  </Badge>
                </div>
              ))}
            </div>
            
            {botoesOcultos.length === 0 && (
              <p className="text-green-600 italic">Todos os botões estão visíveis</p>
            )}
          </div>

          {/* Simulação de layout do Dashboard */}
          <div className="space-y-3">
            <h3 className="font-semibold">Simulação do Layout:</h3>
            <div className="p-4 bg-gray-50 border rounded-lg">
              <div className="space-y-4">
                {/* Header simulado */}
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-semibold">Dashboard</h4>
                    <p className="text-sm text-muted-foreground">Bem-vindo de volta!</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Atualizar
                    </Button>
                    {permissions.relatorios && (
                      <Button size="sm" className="bg-blue-600">
                        <TrendingUp className="h-4 w-4 mr-1" />
                        Ver Relatórios
                      </Button>
                    )}
                  </div>
                </div>

                {/* Cards simulado */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Card Vendas Recentes */}
                  <div className="p-4 border rounded-lg">
                    <div className="flex justify-between items-center mb-3">
                      <h5 className="font-medium">Vendas Recentes</h5>
                      {permissions.vendas && (
                        <Button size="sm" variant="ghost">
                          <Eye className="h-4 w-4 mr-1" />
                          Ver Todas
                        </Button>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">Últimas vendas realizadas...</p>
                  </div>

                  {/* Card Estoque Baixo */}
                  <div className="p-4 border rounded-lg">
                    <h5 className="font-medium mb-3">Estoque Baixo</h5>
                    <p className="text-sm text-muted-foreground mb-3">Produtos com estoque baixo...</p>
                    {permissions.produtos && (
                      <Button size="sm" variant="outline" className="w-full">
                        <Package className="h-4 w-4 mr-1" />
                        Gerenciar Estoque
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Resumo */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">Resumo:</h3>
            <p className="text-blue-700">
              <strong>{botoesVisiveis.length}</strong> de <strong>{botoesDashboard.length}</strong> botões estão visíveis
            </p>
            <p className="text-blue-700">
              Dashboard adaptado para: <strong>{operador.role}</strong>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
