# Sistema de Autenticação e Isolamento por Tenant

## Visão Geral

Este sistema implementa autenticação segura com isolamento completo de dados entre diferentes tenants (empresas/lojas). Cada usuário pertence a um tenant específico e não pode acessar dados de outros tenants.

## Estrutura do Banco de Dados

### Tabelas Principais

1. **tenants** - Armazena informações das empresas/lojas
2. **usuarios** - Usuários do sistema com isolamento por tenant
3. **cadastros_pendentes** - Cadastros em processo de validação
4. **sessoes_usuario** - Controle de sessões ativas

### Isolamento de Dados

- Todos os dados são isolados por `tenant_id`
- Usuários só podem acessar dados do seu próprio tenant
- Middleware de autenticação verifica automaticamente o tenant do usuário

## Fluxo de Autenticação

### 1. Cadastro de Usuário

```javascript
POST /api/auth/signup
{
  "firstName": "João",
  "lastName": "Silva", 
  "email": "joao@empresa.com",
  "phone": "(11) 99999-9999",
  "company": "Minha Empresa Ltda",
  "password": "senha123",
  "confirmPassword": "senha123",
  "selectedPlan": "professional",
  "acceptTerms": true
}
```

**Processo:**
1. Validação dos dados de entrada
2. Verificação se email já existe
3. Criação automática de um novo tenant
4. Criação do usuário como admin do tenant
5. Geração de sessão e token JWT
6. Retorno dos dados do usuário e token

### 2. Login de Usuário

```javascript
POST /api/auth/login
{
  "email": "joao@empresa.com",
  "senha": "senha123",
  "rememberMe": false
}
```

**Processo:**
1. Validação das credenciais
2. Verificação do status do usuário e tenant
3. Criação de nova sessão
4. Geração de token JWT
5. Retorno dos dados do usuário e token

### 3. Middleware de Autenticação

O middleware `authenticateToken` verifica:
- Validade do token JWT
- Existência e validade da sessão
- Status ativo do usuário e tenant
- Isolamento por tenant

## Sistema de Sessões

### Características
- Sessões com expiração de 7 dias
- Controle de IP e User-Agent
- Possibilidade de invalidar sessões específicas
- Logout invalida a sessão atual

### Gerenciamento de Sessões

```javascript
// Criar sessão
const sessionToken = await createUserSession(usuarioId, tenantId, ipAddress, userAgent);

// Invalidar sessão específica
await invalidateSession(sessionToken);

// Invalidar todas as sessões de um usuário
await invalidateAllUserSessions(usuarioId);
```

## Segurança

### Isolamento de Dados
- Todos os queries incluem filtro por `tenant_id`
- Middleware `requireTenant` verifica acesso ao tenant
- Usuários não podem acessar dados de outros tenants

### Validações
- Senhas criptografadas com bcrypt
- Tokens JWT com expiração
- Validação de sessões ativas
- Verificação de status de usuário e tenant

## Frontend

### Armazenamento Local
- Token JWT armazenado no localStorage
- Dados do usuário armazenados no localStorage
- Logout limpa todos os dados locais

### Componentes Atualizados
- **Signup.tsx**: Integração com API de cadastro
- **Login.tsx**: Integração com API de login
- **Header.tsx**: Exibição de dados do usuário e logout

## Configuração

### Variáveis de Ambiente
```env
JWT_SECRET=sua-chave-secreta-aqui
JWT_EXPIRES_IN=7d
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=sua-senha
DB_NAME=kontrollapro
```

### Migração do Banco
```bash
# Executar migração
node src/database/migrate.js

# Executar seed (dados de exemplo)
node src/database/seed.js
```

## Exemplo de Uso

### 1. Cadastro
```javascript
const response = await fetch('/api/auth/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    firstName: 'João',
    lastName: 'Silva',
    email: 'joao@empresa.com',
    company: 'Minha Empresa',
    password: 'senha123',
    confirmPassword: 'senha123',
    selectedPlan: 'professional',
    acceptTerms: true
  })
});
```

### 2. Login
```javascript
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'joao@empresa.com',
    senha: 'senha123'
  })
});
```

### 3. Requisições Autenticadas
```javascript
const response = await fetch('/api/dashboard/metrics', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

## Benefícios

1. **Isolamento Completo**: Cada tenant tem seus dados completamente isolados
2. **Segurança**: Sistema robusto de autenticação e autorização
3. **Escalabilidade**: Suporte a múltiplos tenants
4. **Flexibilidade**: Fácil adição de novos tenants
5. **Controle de Sessões**: Gerenciamento avançado de sessões de usuário
