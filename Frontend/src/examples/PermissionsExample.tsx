import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePermissions } from '@/hooks/usePermissions';
import { 
  ShoppingCart, 
  Users, 
  Package, 
  DollarSign, 
  Settings, 
  FileText,
  Truck,
  UserCheck
} from 'lucide-react';

/**
 * Componente de exemplo demonstrando como usar o sistema de permissões
 * Este componente mostra como verificar permissões e renderizar conteúdo condicionalmente
 */
export function PermissionsExample() {
  const { permissions, hasPermission, hasAllPermissions, hasAnyPermission, operador } = usePermissions();

  // Se não há operador selecionado, não renderiza nada
  if (!operador) {
    return null;
  }

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Sistema de Permissões - Exemplo de Uso
          </CardTitle>
          <CardDescription>
            Demonstração de como usar o hook usePermissions para controlar acesso a funcionalidades
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Informações do operador atual */}
          <div className="p-4 bg-slate-50 rounded-lg">
            <h3 className="font-semibold mb-2">Operador Atual:</h3>
            <p><strong>Nome:</strong> {operador.nome} {operador.sobrenome}</p>
            <p><strong>Role:</strong> <Badge variant="outline">{operador.role}</Badge></p>
            <p><strong>Status:</strong> <Badge variant="secondary">{operador.status}</Badge></p>
          </div>

          {/* Botões condicionais baseados em permissões */}
          <div className="space-y-4">
            <h3 className="font-semibold">Funcionalidades Disponíveis:</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* Dashboard */}
              {hasPermission('dashboard') && (
                <Button variant="outline" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Dashboard
                </Button>
              )}

              {/* Vendas */}
              {hasPermission('vendas') && (
                <Button variant="outline" className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Vendas
                </Button>
              )}

              {/* Clientes */}
              {hasPermission('clientes') && (
                <Button variant="outline" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Clientes
                </Button>
              )}

              {/* Produtos */}
              {hasPermission('produtos') && (
                <Button variant="outline" className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Produtos
                </Button>
              )}

              {/* Financeiro */}
              {hasPermission('financeiro') && (
                <Button variant="outline" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Financeiro
                </Button>
              )}

              {/* Fornecedores */}
              {hasPermission('fornecedores') && (
                <Button variant="outline" className="flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Fornecedores
                </Button>
              )}

              {/* Configurações */}
              {hasPermission('configuracoes') && (
                <Button variant="outline" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Configurações
                </Button>
              )}
            </div>
          </div>

          {/* Exemplos de verificações de permissões */}
          <div className="space-y-4">
            <h3 className="font-semibold">Exemplos de Verificações:</h3>
            
            <div className="space-y-2 text-sm">
              <p>
                <strong>Pode criar vendas:</strong> 
                <Badge variant={hasPermission('vendas_criar') ? 'default' : 'destructive'} className="ml-2">
                  {hasPermission('vendas_criar') ? 'Sim' : 'Não'}
                </Badge>
              </p>
              
              <p>
                <strong>Pode editar produtos:</strong> 
                <Badge variant={hasPermission('produtos_editar') ? 'default' : 'destructive'} className="ml-2">
                  {hasPermission('produtos_editar') ? 'Sim' : 'Não'}
                </Badge>
              </p>
              
              <p>
                <strong>Tem acesso total:</strong> 
                <Badge variant={hasPermission('todos') ? 'default' : 'destructive'} className="ml-2">
                  {hasPermission('todos') ? 'Sim' : 'Não'}
                </Badge>
              </p>
              
              <p>
                <strong>Pode gerenciar funcionários:</strong> 
                <Badge variant={hasAllPermissions('funcionarios', 'funcionarios_criar') ? 'default' : 'destructive'} className="ml-2">
                  {hasAllPermissions('funcionarios', 'funcionarios_criar') ? 'Sim' : 'Não'}
                </Badge>
              </p>
              
              <p>
                <strong>Pode acessar financeiro ou vendas:</strong> 
                <Badge variant={hasAnyPermission('financeiro', 'vendas') ? 'default' : 'destructive'} className="ml-2">
                  {hasAnyPermission('financeiro', 'vendas') ? 'Sim' : 'Não'}
                </Badge>
              </p>
            </div>
          </div>

          {/* Lista de todas as permissões */}
          <div className="space-y-4">
            <h3 className="font-semibold">Todas as Permissões:</h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(permissions).map(([permission, hasAccess]) => (
                <Badge
                  key={permission}
                  variant={hasAccess ? 'default' : 'secondary'}
                  className={hasAccess ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}
                >
                  {permission.replace(/_/g, ' ')}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
