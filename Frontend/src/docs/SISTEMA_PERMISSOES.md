# Sistema de Permissões - KontrollaPro

## Visão Geral

O sistema de permissões do KontrollaPro permite controlar o acesso de diferentes operadores (administradores, gerentes, vendedores) às funcionalidades do sistema baseado em suas roles e permissões específicas.

## Estrutura do Sistema

### 1. Tabela `administradores`

A tabela `administradores` no banco de dados contém:
- `role`: Tipo de operador (administrador, gerente, vendedor)
- `permissoes`: Campo JSON com permissões específicas do operador
- `status`: Status do operador (ativo, inativo, suspenso)

### 2. Hook `usePermissions`

O hook `usePermissions` fornece:
- `permissions`: Objeto com todas as permissões do operador atual
- `hasPermission(permission)`: Verifica se tem uma permissão específica
- `hasAllPermissions(...permissions)`: Verifica se tem todas as permissões listadas
- `hasAnyPermission(...permissions)`: Verifica se tem pelo menos uma das permissões listadas
- `operador`: Dados do operador atual

## Permissões Disponíveis

### Dashboard e Relatórios
- `dashboard`: Acesso ao dashboard principal
- `relatorios`: Acesso aos relatórios

### Gestão de Clientes
- `clientes`: Acesso à listagem de clientes
- `clientes_criar`: Criar novos clientes
- `clientes_editar`: Editar clientes existentes
- `clientes_excluir`: Excluir clientes

### Gestão de Produtos
- `produtos`: Acesso à listagem de produtos
- `produtos_criar`: Criar novos produtos
- `produtos_editar`: Editar produtos existentes
- `produtos_excluir`: Excluir produtos
- `catalogo`: Acesso ao catálogo de produtos

### Gestão de Fornecedores
- `fornecedores`: Acesso à listagem de fornecedores
- `fornecedores_criar`: Criar novos fornecedores
- `fornecedores_editar`: Editar fornecedores existentes
- `fornecedores_excluir`: Excluir fornecedores

### Gestão de Funcionários
- `funcionarios`: Acesso à listagem de funcionários
- `funcionarios_criar`: Criar novos funcionários
- `funcionarios_editar`: Editar funcionários existentes
- `funcionarios_excluir`: Excluir funcionários

### Vendas
- `vendas`: Acesso à listagem de vendas
- `vendas_criar`: Criar novas vendas
- `vendas_editar`: Editar vendas existentes
- `vendas_cancelar`: Cancelar vendas
- `vendas_devolver`: Processar devoluções

### Financeiro
- `financeiro`: Acesso ao módulo financeiro
- `contas_receber`: Gerenciar contas a receber
- `contas_pagar`: Gerenciar contas a pagar
- `transacoes`: Gerenciar transações financeiras
- `pagamentos`: Gerenciar pagamentos

### NF-e
- `nfe`: Acesso ao módulo de NF-e
- `nfe_emitir`: Emitir notas fiscais
- `nfe_cancelar`: Cancelar notas fiscais

### Configurações
- `configuracoes`: Acesso às configurações
- `configuracoes_gerais`: Configurações gerais do sistema
- `configuracoes_pagamentos`: Configurações de pagamento
- `configuracoes_administradores`: Gerenciar administradores

### Permissão Especial
- `todos`: Acesso total ao sistema (apenas para administradores)

## Permissões Padrão por Role

### Administrador
- Tem acesso total (`todos: true`)
- Todas as permissões são verdadeiras

### Gerente
- Acesso a todas as funcionalidades exceto:
  - Exclusão de registros (`*_excluir`)
  - Configurações de pagamento (`configuracoes_pagamentos`)
  - Gerenciamento de administradores (`configuracoes_administradores`)

### Vendedor
- Acesso limitado a:
  - Dashboard
  - Clientes (visualizar, criar, editar)
  - Produtos (apenas visualizar)
  - Catálogo
  - Vendas (apenas criar)

## Como Usar

### 1. Importar o Hook

```typescript
import { usePermissions } from '@/hooks/usePermissions';
```

### 2. Usar em Componentes

```typescript
function MeuComponente() {
  const { hasPermission, hasAllPermissions, hasAnyPermission } = usePermissions();

  return (
    <div>
      {/* Renderizar botão apenas se tiver permissão */}
      {hasPermission('vendas_criar') && (
        <Button onClick={() => criarVenda()}>
          Nova Venda
        </Button>
      )}

      {/* Verificar múltiplas permissões */}
      {hasAllPermissions('produtos', 'produtos_editar') && (
        <Button onClick={() => editarProduto()}>
          Editar Produto
        </Button>
      )}

      {/* Verificar pelo menos uma permissão */}
      {hasAnyPermission('financeiro', 'vendas') && (
        <div>Conteúdo para usuários com acesso financeiro ou de vendas</div>
      )}
    </div>
  );
}
```

### 3. Exemplo Prático no Header

```typescript
// No Header.tsx
{hasPermission('vendas_criar') && (
  <Button onClick={() => navigate("/dashboard/nova-venda")}>
    Nova Venda
  </Button>
)}
```

### 4. Exemplo Prático no Sidebar

```typescript
// No Sidebar.tsx - Filtrar itens de navegação
{navegacao
  .filter((item) => hasPermission(item.permissao))
  .map((item) => (
    <NavLink key={item.nome} to={item.href}>
      <item.icone className="mr-3 h-5 w-5" />
      {item.nome}
    </NavLink>
  ))}

// Botão de configurações condicional
{hasPermission('configuracoes') && (
  <NavLink to="/dashboard/configuracoes">
    <Settings className="mr-3 h-4 w-4" />
    Configurações
  </NavLink>
)}
```

### 5. Exemplo Prático no Dashboard

```typescript
// No Dashboard.tsx - Botão Ver Relatórios condicional
{hasPermission('relatorios') && (
  <Button onClick={() => navigate("/dashboard/relatorios")}>
    <TrendingUp className="h-4 w-4 mr-2" />
    Ver Relatórios
  </Button>
)}

// Botão Ver Todas (Vendas) condicional
{hasPermission('vendas') && (
  <Button onClick={() => navigate("/dashboard/vendas")}>
    <Eye className="h-4 w-4 mr-2" />
    Ver Todas
  </Button>
)}

// Botão Gerenciar Estoque condicional
{hasPermission('produtos') && (
  <Button onClick={() => navigate("/dashboard/produtos")}>
    <Package className="h-4 w-4 mr-2" />
    Gerenciar Estoque
  </Button>
)}
```

### 6. Exemplo Prático no Configuracoes

```typescript
// No ConfiguracoesSidebar.tsx - Filtrar abas baseado em permissões
{configuracoesTabs
  .filter((tab) => hasPermission(tab.permissao))
  .map((tab) => (
    <button key={tab.id} onClick={handleClick}>
      <tab.icone className="h-5 w-5" />
      {tab.nome}
    </button>
  ))}

// No Configuracoes.tsx - Conteúdo condicional por aba
{abaAtiva === "conta" && hasPermission('configuracoes_gerais') && (
  <div>Conteúdo da aba Conta</div>
)}

{abaAtiva === "administracao" && hasPermission('configuracoes_administradores') && (
  <div>Conteúdo da aba Administração</div>
)}

{abaAtiva === "metodos-pagamento" && hasPermission('configuracoes_pagamentos') && (
  <div>Conteúdo da aba Métodos de Pagamento</div>
)}

// Lógica especial para vendedores com permissão de configurações
const isTabVisible = (tabId: string) => {
  // Para vendedores com permissão de configurações, permite acesso a abas específicas
  if (operador?.role === 'vendedor' && hasPermission('configuracoes')) {
    if (tabId === 'fornecedores' || tabId === 'funcionarios' || tabId === 'metodos-pagamento') {
      return true;
    }
  }
  
  // Para outras abas, verifica permissão específica
  return hasPermission(tabId as any);
};

// Redirecionamento automático para vendedores
useEffect(() => {
  const abaParam = searchParams.get('aba');
  if (abaParam) {
    setAbaAtiva(abaParam);
    setSearchParams({}, { replace: true });
  } else {
    // Vendedores com configurações abrem automaticamente na aba de métodos de pagamento
    if (operador?.role === 'vendedor' && hasPermission('configuracoes')) {
      setAbaAtiva('metodos-pagamento');
    }
  }
}, [searchParams, setSearchParams, operador, hasPermission]);
```

## Modo Visualização para Vendedores

### Funcionalidade
Vendedores com permissão de configurações têm acesso **somente para visualização** na aba de métodos de pagamento, sem poder editar ou salvar alterações.

### Implementação
```typescript
// Ocultar botões de salvar para vendedores
{!(operador?.role === 'vendedor' && hasPermission('configuracoes')) && (
  <Button onClick={handleSalvarMetodosPagamento}>
    <Save className="h-4 w-4 mr-2" />
    Salvar Métodos de Pagamento
  </Button>
)}

// Desabilitar campos de entrada para vendedores
<Input
  value={metodo.taxa}
  onChange={handleChange}
  readOnly={operador?.role === 'vendedor' && hasPermission('configuracoes')}
  disabled={key === 'pix' || key === 'dinheiro'}
/>

// Desabilitar toggles de ativação
<Button
  onClick={handleToggle}
  disabled={operador?.role === 'vendedor' && hasPermission('configuracoes')}
>
  {metodo.ativo ? <ToggleRight /> : <ToggleLeft />}
</Button>
```

### Elementos Desabilitados
- **Botões de Salvar**: Todos os botões de salvar são ocultos
- **Campos de Entrada**: Inputs ficam em modo `readOnly`
- **Toggles**: Botões de ativar/desativar ficam `disabled`
- **Upload de Arquivos**: Botões de upload ficam `disabled`
- **Selects**: Dropdowns ficam `disabled`
- **Modal de Parcelas**: Botões de adicionar, remover e salvar parcelas ocultos

### Comportamento
1. **Visualização Completa**: Vendedores podem ver todas as configurações
2. **Sem Edição**: Não podem modificar nenhum valor
3. **Sem Salvamento**: Não podem salvar alterações
4. **Acesso Limitado**: Apenas visualização das configurações existentes

## Modal de Parcelas - Modo Visualização

### Funcionalidade
O modal de parcelas também segue o modo visualização para vendedores, permitindo apenas visualizar as configurações existentes sem poder editá-las.

### Implementação
```typescript
// Ocultar botão de adicionar parcela para vendedores
{!(operador?.role === 'vendedor' && hasPermission('configuracoes')) && (
  <Button onClick={handleAdicionarParcela}>
    <Plus className="h-4 w-4 mr-2" />
    Adicionar Parcela
  </Button>
)}

// Ocultar botão de remover parcela para vendedores
{!(operador?.role === 'vendedor' && hasPermission('configuracoes')) && (
  <Button onClick={() => handleRemoverParcela(index)}>
    <Trash2 className="h-3 w-3 mr-1" />
    Remover
  </Button>
)}

// Desabilitar campos de entrada para vendedores
<Input
  value={parcela.quantidade}
  onChange={handleChange}
  readOnly={operador?.role === 'vendedor' && hasPermission('configuracoes')}
/>

// Botões do rodapé do modal
{!(operador?.role === 'vendedor' && hasPermission('configuracoes')) ? (
  <>
    <Button onClick={handleCancel}>Cancelar</Button>
    <Button onClick={handleSalvarParcelas}>Salvar Parcelas</Button>
  </>
) : (
  <Button onClick={handleFechar}>Fechar</Button>
)}
```

### Elementos Desabilitados no Modal
- **Botão Adicionar Parcela**: Oculto para vendedores
- **Botão Remover Parcela**: Oculto para vendedores
- **Campos de Quantidade**: Modo `readOnly`
- **Campos de Taxa**: Modo `readOnly`
- **Botão Salvar Parcelas**: Oculto para vendedores
- **Botão Cancelar**: Substituído por "Fechar"

### Comportamento
1. **Visualização**: Vendedores podem ver todas as parcelas configuradas
2. **Sem Edição**: Não podem adicionar, remover ou modificar parcelas
3. **Sem Salvamento**: Não podem salvar alterações
4. **Fechar**: Apenas botão "Fechar" disponível no rodapé

## Página de Produtos - Controle de Acesso

### Funcionalidade
A página de produtos implementa controle granular de acesso baseado nas permissões do operador, ocultando botões de ação para vendedores.

### Implementação
```typescript
import { usePermissions } from "@/hooks/usePermissions";

export default function Produtos() {
  const { hasPermission } = usePermissions();
  
  return (
    <div>
      {/* Botão Novo Produto - Desktop */}
      <div className="hidden md:flex items-center justify-end">
        {hasPermission('produtos_criar') && (
          <Button onClick={() => navigate("/dashboard/novo-produto")}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Produto
          </Button>
        )}
      </div>

      {/* Botão Novo Produto - Mobile */}
      <div className="md:hidden w-full">
        {hasPermission('produtos_criar') && (
          <Button onClick={() => navigate("/dashboard/novo-produto")}>
            <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            Novo Produto
          </Button>
        )}
      </div>

      {/* Botões de Ação nos Cards de Produtos */}
      {(hasPermission('produtos_editar') || hasPermission('produtos_excluir')) && (
        <div className="flex space-x-2 pt-2">
          {hasPermission('produtos_editar') && (
            <Button onClick={() => navigate(`/dashboard/novo-produto/${produto.id}`)}>
              <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Editar
            </Button>
          )}
          {hasPermission('produtos_excluir') && (
            <Button onClick={() => handleExcluirProduto(produto.id, produto.nome)}>
              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          )}
        </div>
      )}

      {/* Empty State */}
      {hasPermission('produtos_criar') && (
        <Button onClick={() => navigate("/dashboard/novo-produto")}>
          <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
          Adicionar Produto
        </Button>
      )}
    </div>
  );
}
```

### Elementos Controlados por Permissão
- **Botão Novo Produto**: Oculto se `produtos_criar` for `false`
- **Botão Editar**: Oculto se `produtos_editar` for `false`
- **Botão Excluir**: Oculto se `produtos_excluir` for `false`
- **Empty State**: Botão de adicionar oculto se `produtos_criar` for `false`

### Comportamento por Role
- **Administrador**: Todos os botões visíveis
- **Gerente**: Todos os botões visíveis
- **Vendedor**: Apenas visualização (botões ocultos)

## Página de Clientes - Controle de Acesso

### Funcionalidade
A página de clientes implementa controle granular de acesso baseado nas permissões do operador, ocultando botões de ação para vendedores.

### Implementação
```typescript
import { usePermissions } from "@/hooks/usePermissions";

export default function Clientes() {
  const { hasPermission } = usePermissions();
  
  return (
    <div>
      {/* Botão Novo Cliente - Desktop */}
      <div className="hidden md:flex items-center justify-end">
        {hasPermission('clientes_criar') && (
          <Button onClick={() => navigate("/dashboard/novo-cliente")}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Cliente
          </Button>
        )}
      </div>

      {/* Botão Novo Cliente - Mobile */}
      <div className="md:hidden w-full">
        {hasPermission('clientes_criar') && (
          <Button onClick={() => navigate("/dashboard/novo-cliente")}>
            <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            Novo Cliente
          </Button>
        )}
      </div>

      {/* Botões de Ação nos Cards de Clientes */}
      {(hasPermission('clientes_editar') || hasPermission('clientes_excluir')) && (
        <div className="flex space-x-1.5 sm:space-x-2 pt-2">
          {hasPermission('clientes_editar') && (
            <Button onClick={() => navigate(`/dashboard/novo-cliente/${cliente.id}`)}>
              <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Editar
            </Button>
          )}
          {hasPermission('clientes_excluir') && (
            <Button onClick={() => deletarCliente(cliente.id)}>
              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          )}
        </div>
      )}

      {/* Empty State */}
      {hasPermission('clientes_criar') && (
        <Button onClick={() => navigate("/dashboard/novo-cliente")}>
          <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
          Adicionar Cliente
        </Button>
      )}
    </div>
  );
}
```

### Elementos Controlados por Permissão
- **Botão Novo Cliente**: Oculto se `clientes_criar` for `false`
- **Botão Editar**: Oculto se `clientes_editar` for `false`
- **Botão Excluir**: Oculto se `clientes_excluir` for `false`
- **Empty State**: Botão de adicionar oculto se `clientes_criar` for `false`

### Comportamento por Role
- **Administrador**: Todos os botões visíveis
- **Gerente**: Todos os botões visíveis
- **Vendedor**: Apenas visualização (botões ocultos)

## Implementação no Backend

### Estrutura da Tabela

```sql
CREATE TABLE administradores (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tenant_id INT NOT NULL,
    nome VARCHAR(255) NOT NULL,
    sobrenome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    senha VARCHAR(255) NOT NULL,
    role ENUM('administrador', 'gerente', 'vendedor') NOT NULL DEFAULT 'vendedor',
    status ENUM('ativo', 'inativo', 'suspenso') NOT NULL DEFAULT 'ativo',
    permissoes JSON, -- Array de strings com permissões específicas
    ultimo_acesso TIMESTAMP NULL,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    criado_por INT,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (criado_por) REFERENCES administradores(id) ON DELETE SET NULL,
    UNIQUE KEY unique_tenant_email (tenant_id, email)
);
```

### Exemplo de Dados

```json
{
  "id": 1,
  "nome": "João",
  "sobrenome": "Silva",
  "role": "gerente",
  "status": "ativo",
  "permissoes": ["dashboard", "vendas", "vendas_criar", "clientes", "produtos"]
}
```

## Comportamento do Sidebar por Role

### Administrador
- **Todos os itens visíveis**: Dashboard, Produtos, Vendas, Catálogo, Clientes, Relatórios, Financeiro, NF-e, Configurações
- **Acesso completo**: Pode navegar para qualquer seção do sistema

### Gerente
- **Itens visíveis**: Dashboard, Produtos, Vendas, Catálogo, Clientes, Relatórios, Financeiro, NF-e, Configurações
- **Acesso amplo**: Pode acessar todas as funcionalidades principais, exceto algumas configurações sensíveis

### Vendedor
- **Itens visíveis**: Dashboard, Catálogo, Clientes, Vendas
- **Itens ocultos**: Produtos, Relatórios, Financeiro, NF-e, Configurações
- **Acesso limitado**: Focado apenas em vendas e atendimento ao cliente

## Comportamento do Dashboard por Role

### Administrador
- **Todos os botões visíveis**: Ver Relatórios, Ver Todas (Vendas), Gerenciar Estoque, Ver Produtos
- **Acesso completo**: Pode navegar para todas as seções do sistema

### Gerente
- **Botões visíveis**: Ver Relatórios, Ver Todas (Vendas), Gerenciar Estoque, Ver Produtos
- **Acesso amplo**: Pode acessar todas as funcionalidades principais do dashboard

### Vendedor
- **Botões visíveis**: Ver Todas (Vendas)
- **Botões ocultos**: Ver Relatórios, Gerenciar Estoque, Ver Produtos
- **Acesso limitado**: Focado apenas em vendas, sem acesso a relatórios ou gestão de produtos

## Comportamento do Configuracoes por Role

### Administrador
- **Todas as abas visíveis**: Conta, Fornecedores, Funcionários, Administração, Meu Plano, Métodos de Pagamento, Tema, Notificações, Segurança
- **Acesso completo**: Pode configurar todos os aspectos do sistema

### Gerente
- **Abas visíveis**: Fornecedores, Funcionários, Métodos de Pagamento
- **Abas ocultas**: Conta, Administração, Meu Plano, Tema, Notificações, Segurança
- **Acesso limitado**: Focado em gestão operacional, sem acesso a configurações administrativas

### Vendedor
- **Sem permissão de configurações**:
  - **Abas visíveis**: Nenhuma (acesso negado)
  - **Abas ocultas**: Todas as abas de configurações
  - **Acesso limitado**: Apenas vendas e clientes

- **Com permissão de configurações**:
  - **Abas visíveis**: Apenas Métodos de Pagamento
  - **Abas ocultas**: Conta, Administração, Meu Plano, Tema, Notificações, Segurança, Fornecedores, Funcionários
  - **Acesso limitado**: Apenas visualização de métodos de pagamento (modo visualização)
  - **Comportamento especial**: Abre automaticamente na aba de Métodos de Pagamento
  - **Modo visualização**: Campos de edição desabilitados, botões de salvar ocultos
  - **Produtos**: Botões de criar, editar e excluir produtos ocultos
  - **Clientes**: Botões de criar, editar e excluir clientes ocultos

## Benefícios

1. **Segurança**: Controle granular de acesso às funcionalidades
2. **Flexibilidade**: Permissões personalizáveis por operador
3. **Escalabilidade**: Fácil adição de novas permissões
4. **UX**: Interface adapta-se automaticamente às permissões do usuário
5. **Manutenibilidade**: Sistema centralizado e reutilizável
6. **Navegação Intuitiva**: Sidebar mostra apenas funcionalidades relevantes para cada operador

## Considerações

- Sempre verificar permissões antes de renderizar elementos sensíveis
- Usar permissões tanto no frontend quanto no backend para segurança completa
- Documentar novas permissões quando adicionadas ao sistema
- Testar diferentes roles para garantir funcionamento correto
