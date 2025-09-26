import { useMemo } from 'react';
import { useOperador } from '@/contexts/OperadorContext';
import { useAdministradores } from '@/hooks/useAdministradores';

// Definição das permissões disponíveis no sistema
export interface Permissions {
  // Dashboard e relatórios
  dashboard: boolean;
  relatorios: boolean;
  
  // Gestão de clientes
  clientes: boolean;
  clientes_criar: boolean;
  clientes_editar: boolean;
  clientes_excluir: boolean;
  
  // Gestão de produtos
  produtos: boolean;
  produtos_criar: boolean;
  produtos_editar: boolean;
  produtos_excluir: boolean;
  catalogo: boolean;
  
  // Gestão de fornecedores
  fornecedores: boolean;
  fornecedores_criar: boolean;
  fornecedores_editar: boolean;
  fornecedores_excluir: boolean;
  
  // Gestão de funcionários
  funcionarios: boolean;
  funcionarios_criar: boolean;
  funcionarios_editar: boolean;
  funcionarios_excluir: boolean;
  
  // Vendas
  vendas: boolean;
  vendas_criar: boolean;
  vendas_editar: boolean;
  vendas_cancelar: boolean;
  vendas_devolver: boolean;
  
  // Financeiro
  financeiro: boolean;
  contas_receber: boolean;
  contas_pagar: boolean;
  transacoes: boolean;
  pagamentos: boolean;
  
  // NF-e
  nfe: boolean;
  nfe_emitir: boolean;
  nfe_cancelar: boolean;
  
  // Configurações
  configuracoes: boolean;
  configuracoes_gerais: boolean;
  configuracoes_pagamentos: boolean;
  configuracoes_administradores: boolean;
  
  // Acesso total (para administradores)
  todos: boolean;
}

// Permissões padrão por role
const DEFAULT_PERMISSIONS_BY_ROLE: Record<string, Partial<Permissions>> = {
  administrador: {
    todos: true,
    dashboard: true,
    relatorios: true,
    clientes: true,
    clientes_criar: true,
    clientes_editar: true,
    clientes_excluir: true,
    produtos: true,
    produtos_criar: true,
    produtos_editar: true,
    produtos_excluir: true,
    catalogo: true,
    fornecedores: true,
    fornecedores_criar: true,
    fornecedores_editar: true,
    fornecedores_excluir: true,
    funcionarios: true,
    funcionarios_criar: true,
    funcionarios_editar: true,
    funcionarios_excluir: true,
    vendas: true,
    vendas_criar: true,
    vendas_editar: true,
    vendas_cancelar: true,
    vendas_devolver: true,
    financeiro: true,
    contas_receber: true,
    contas_pagar: true,
    transacoes: true,
    pagamentos: true,
    nfe: true,
    nfe_emitir: true,
    nfe_cancelar: true,
    configuracoes: true,
    configuracoes_gerais: true,
    configuracoes_pagamentos: true,
    configuracoes_administradores: true,
  },
  gerente: {
    todos: false,
    dashboard: true,
    relatorios: true,
    clientes: true,
    clientes_criar: true,
    clientes_editar: true,
    clientes_excluir: false,
    produtos: true,
    produtos_criar: true,
    produtos_editar: true,
    produtos_excluir: false,
    catalogo: true,
    fornecedores: true,
    fornecedores_criar: true,
    fornecedores_editar: true,
    fornecedores_excluir: false,
    funcionarios: true,
    funcionarios_criar: true,
    funcionarios_editar: true,
    funcionarios_excluir: false,
    vendas: true,
    vendas_criar: true,
    vendas_editar: true,
    vendas_cancelar: true,
    vendas_devolver: true,
    financeiro: true,
    contas_receber: true,
    contas_pagar: true,
    transacoes: true,
    pagamentos: true,
    nfe: true,
    nfe_emitir: true,
    nfe_cancelar: true,
    configuracoes: true,
    configuracoes_gerais: true,
    configuracoes_pagamentos: false,
    configuracoes_administradores: false,
  },
  vendedor: {
    todos: false,
    dashboard: true,
    relatorios: false,
    clientes: true,
    clientes_criar: false,
    clientes_editar: false,
    clientes_excluir: false,
    produtos: true,
    produtos_criar: false,
    produtos_editar: false,
    produtos_excluir: false,
    catalogo: true,
    fornecedores: false,
    fornecedores_criar: false,
    fornecedores_editar: false,
    fornecedores_excluir: false,
    funcionarios: false,
    funcionarios_criar: false,
    funcionarios_editar: false,
    funcionarios_excluir: false,
    vendas: true,
    vendas_criar: true,
    vendas_editar: false,
    vendas_cancelar: false,
    vendas_devolver: false,
    financeiro: false,
    contas_receber: false,
    contas_pagar: false,
    transacoes: false,
    pagamentos: false,
    nfe: false,
    nfe_emitir: false,
    nfe_cancelar: false,
    configuracoes: false,
    configuracoes_gerais: false,
    configuracoes_pagamentos: false,
    configuracoes_administradores: false,
  },
};

export function usePermissions() {
  const { operadorSelecionado } = useOperador();
  const { administradores } = useAdministradores();

  const permissions = useMemo(() => {
    // Se não há operador selecionado, retorna permissões vazias
    if (!operadorSelecionado) {
      return {} as Permissions;
    }

    // Busca o operador selecionado
    const operador = administradores.find(adm => adm.id === operadorSelecionado);
    
    if (!operador) {
      return {} as Permissions;
    }

    // Se o operador tem permissão "todos", retorna todas as permissões
    if (operador.permissoes && Array.isArray(operador.permissoes) && operador.permissoes.includes('todos')) {
      return DEFAULT_PERMISSIONS_BY_ROLE.administrador as Permissions;
    }

    // Combina permissões padrão do role com permissões específicas do operador
    const defaultPermissions = DEFAULT_PERMISSIONS_BY_ROLE[operador.role] || {};
    const customPermissions = operador.permissoes || [];

    // Cria objeto de permissões combinando padrões e customizações
    const combinedPermissions: Permissions = {
      // Permissões padrão do role
      ...defaultPermissions,
      
      // Permissões específicas do operador (sobrescrevem as padrão)
      ...Object.fromEntries(
        customPermissions.map(permission => [permission, true])
      ),
    } as Permissions;

    return combinedPermissions;
  }, [operadorSelecionado, administradores]);

  // Função auxiliar para verificar se tem uma permissão específica
  const hasPermission = (permission: keyof Permissions): boolean => {
    return permissions[permission] === true;
  };

  // Função auxiliar para verificar múltiplas permissões (todas devem ser verdadeiras)
  const hasAllPermissions = (...permissionList: (keyof Permissions)[]): boolean => {
    return permissionList.every(permission => permissions[permission] === true);
  };

  // Função auxiliar para verificar múltiplas permissões (pelo menos uma deve ser verdadeira)
  const hasAnyPermission = (...permissionList: (keyof Permissions)[]): boolean => {
    return permissionList.some(permission => permissions[permission] === true);
  };

  return {
    permissions,
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
    operador: administradores.find(adm => adm.id === operadorSelecionado),
  };
}
