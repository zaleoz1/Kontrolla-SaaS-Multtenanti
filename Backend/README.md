# KontrollaPro Backend

Backend para o sistema SaaS multitenanti KontrollaPro - Sistema de gestão comercial completo.

## 🚀 Tecnologias

- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **MySQL** - Banco de dados
- **JWT** - Autenticação
- **bcryptjs** - Criptografia de senhas
- **express-validator** - Validação de dados

## 📋 Funcionalidades

### Módulos Principais
- **Autenticação** - Login, registro e gerenciamento de usuários
- **Clientes** - Cadastro e gestão de clientes
- **Produtos** - Catálogo de produtos com controle de estoque
- **Vendas** - Sistema completo de vendas
- **Financeiro** - Controle financeiro e transações
- **NF-e** - Emissão de notas fiscais eletrônicas
- **Relatórios** - Relatórios gerenciais
- **Dashboard** - Métricas e indicadores
- **Catálogo** - Catálogo público de produtos

### Características
- ✅ **Multitenant** - Suporte a múltiplas empresas
- ✅ **Autenticação JWT** - Sistema seguro de autenticação
- ✅ **Validação de dados** - Validação robusta de entrada
- ✅ **Rate limiting** - Proteção contra abuso
- ✅ **CORS configurado** - Integração com frontend
- ✅ **Logs estruturados** - Monitoramento e debugging
- ✅ **Tratamento de erros** - Respostas padronizadas

## 🛠️ Instalação

### Pré-requisitos
- Node.js 18+ 
- MySQL 8.0+
- npm ou yarn

### 1. Clone o repositório
```bash
git clone <repository-url>
cd Backend
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure as variáveis de ambiente
```bash
cp env.example .env
```

Edite o arquivo `.env` com suas configurações:
```env
# Configurações do Servidor
PORT=3000
NODE_ENV=development

# Configurações do Banco de Dados MySQL
DB_HOST=localhost
DB_PORT=3306
DB_NAME=kontrollapro
DB_USER=root
DB_PASSWORD=sua_senha

# Configurações de Autenticação
JWT_SECRET=seu_jwt_secret_muito_seguro_aqui
JWT_EXPIRES_IN=24h

# Configurações de CORS
CORS_ORIGIN=http://localhost:5173
```

### 4. Configure o banco de dados
```bash
# Execute as migrações
npm run migrate

# Execute o seed (dados de exemplo)
npm run seed
```

### 5. Inicie o servidor
```bash
# Desenvolvimento
npm run dev

# Produção
npm start
```

## 📚 API Endpoints

### Autenticação
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Dados do usuário logado
- `PUT /api/auth/change-password` - Alterar senha
- `POST /api/auth/logout` - Logout
- `GET /api/auth/verify` - Verificar token

### Clientes
- `GET /api/clientes` - Listar clientes
- `GET /api/clientes/:id` - Buscar cliente
- `POST /api/clientes` - Criar cliente
- `PUT /api/clientes/:id` - Atualizar cliente
- `DELETE /api/clientes/:id` - Deletar cliente
- `GET /api/clientes/stats/overview` - Estatísticas

### Produtos
- `GET /api/produtos` - Listar produtos
- `GET /api/produtos/:id` - Buscar produto
- `POST /api/produtos` - Criar produto
- `PUT /api/produtos/:id` - Atualizar produto
- `DELETE /api/produtos/:id` - Deletar produto
- `GET /api/produtos/buscar/codigo-barras/:codigo` - Buscar por código de barras
- `GET /api/produtos/stats/overview` - Estatísticas
- `GET /api/produtos/estoque/baixo` - Produtos com estoque baixo

### Vendas
- `GET /api/vendas` - Listar vendas
- `GET /api/vendas/:id` - Buscar venda
- `POST /api/vendas` - Criar venda
- `PATCH /api/vendas/:id/status` - Atualizar status
- `DELETE /api/vendas/:id` - Deletar venda
- `GET /api/vendas/stats/overview` - Estatísticas

### Financeiro
- `GET /api/financeiro/transacoes` - Listar transações
- `GET /api/financeiro/transacoes/:id` - Buscar transação
- `POST /api/financeiro/transacoes` - Criar transação
- `PUT /api/financeiro/transacoes/:id` - Atualizar transação
- `DELETE /api/financeiro/transacoes/:id` - Deletar transação
- `GET /api/financeiro/contas-receber` - Contas a receber
- `GET /api/financeiro/contas-pagar` - Contas a pagar
- `GET /api/financeiro/stats/overview` - Estatísticas

### NF-e
- `GET /api/nfe` - Listar NF-e
- `GET /api/nfe/:id` - Buscar NF-e
- `POST /api/nfe` - Criar NF-e
- `PATCH /api/nfe/:id/status` - Atualizar status
- `DELETE /api/nfe/:id` - Deletar NF-e
- `GET /api/nfe/stats/overview` - Estatísticas

### Relatórios
- `GET /api/relatorios/vendas-periodo` - Vendas por período
- `GET /api/relatorios/produtos-vendidos` - Produtos mais vendidos
- `GET /api/relatorios/analise-clientes` - Análise de clientes
- `GET /api/relatorios/financeiro` - Relatório financeiro
- `GET /api/relatorios/controle-estoque` - Controle de estoque
- `GET /api/relatorios/performance-vendas` - Performance de vendas

### Dashboard
- `GET /api/dashboard/metricas` - Métricas gerais
- `GET /api/dashboard/vendas-recentes` - Vendas recentes
- `GET /api/dashboard/estoque-baixo` - Produtos com estoque baixo
- `GET /api/dashboard/grafico-vendas` - Dados para gráficos
- `GET /api/dashboard/top-produtos` - Top produtos
- `GET /api/dashboard/resumo-financeiro` - Resumo financeiro

### Catálogo
- `GET /api/catalogo/produtos` - Listar produtos (público)
- `GET /api/catalogo/produtos/:id` - Buscar produto (público)
- `GET /api/catalogo/categorias` - Listar categorias (público)
- `GET /api/catalogo/destaques` - Produtos em destaque (público)
- `GET /api/catalogo/produtos/:id/relacionados` - Produtos relacionados (público)
- `GET /api/catalogo/buscar/codigo-barras/:codigo` - Buscar por código (público)
- `GET /api/catalogo/stats` - Estatísticas (autenticado)
- `GET /api/catalogo/configuracoes` - Configurações (autenticado)
- `PUT /api/catalogo/configuracoes` - Atualizar configurações (admin)

## 🔐 Autenticação

Todas as rotas (exceto catálogo público) requerem autenticação via JWT.

### Headers necessários:
```
Authorization: Bearer <token>
```

### Exemplo de login:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@lojaexemplo.com.br",
    "senha": "admin123"
  }'
```

## 📊 Banco de Dados

### Estrutura Multitenant
- Cada empresa (tenant) tem seus próprios dados isolados
- Todas as tabelas principais incluem `tenant_id`
- Middleware de autenticação garante acesso apenas aos dados do tenant

### Principais Tabelas
- `tenants` - Empresas/lojas
- `usuarios` - Usuários do sistema
- `clientes` - Clientes das empresas
- `produtos` - Catálogo de produtos
- `categorias` - Categorias de produtos
- `vendas` - Vendas realizadas
- `venda_itens` - Itens das vendas
- `transacoes` - Transações financeiras
- `contas_receber` - Contas a receber
- `contas_pagar` - Contas a pagar
- `nfe` - Notas fiscais eletrônicas
- `tenant_configuracoes` - Configurações por tenant

## 🚀 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev          # Inicia com nodemon

# Produção
npm start            # Inicia servidor

# Banco de dados
npm run migrate      # Executa migrações
npm run seed         # Popula com dados de exemplo
```

## 🔧 Configuração de Desenvolvimento

### Estrutura de Pastas
```
src/
├── database/          # Configuração do banco
│   ├── connection.js  # Conexão MySQL
│   ├── schema.sql     # Schema do banco
│   ├── migrate.js     # Migrações
│   └── seed.js        # Dados de exemplo
├── middleware/        # Middlewares
│   ├── auth.js        # Autenticação
│   ├── errorHandler.js # Tratamento de erros
│   ├── notFound.js    # Rota não encontrada
│   └── validation.js  # Validação de dados
├── routes/            # Rotas da API
│   ├── auth.js        # Autenticação
│   ├── clientes.js    # Clientes
│   ├── produtos.js    # Produtos
│   ├── vendas.js      # Vendas
│   ├── financeiro.js  # Financeiro
│   ├── nfe.js         # NF-e
│   ├── relatorios.js  # Relatórios
│   ├── dashboard.js   # Dashboard
│   └── catalogo.js    # Catálogo
└── server.js          # Servidor principal
```

## 📝 Logs e Monitoramento

O sistema inclui:
- Logs estruturados com Morgan
- Tratamento centralizado de erros
- Health check endpoint (`/health`)
- Rate limiting para proteção

## 🔒 Segurança

- Autenticação JWT
- Criptografia de senhas com bcrypt
- Rate limiting
- Validação de entrada
- CORS configurado
- Headers de segurança com Helmet

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique os logs do servidor
2. Confirme as configurações do banco de dados
3. Verifique as variáveis de ambiente
4. Consulte a documentação da API

## 📄 Licença

MIT License - veja o arquivo LICENSE para detalhes.
