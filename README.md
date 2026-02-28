# 🚀 KontrollaPro - Sistema SaaS Multitenant

Sistema completo de gestão de vendas e estoque para pequenas e médias empresas, desenvolvido com arquitetura  multitenanti.

## ✨ Funcionalidades 

### 🏢 **Gestão Multitenanti**
- Isolamento completo de dados por empresa
- Sistema de autenticação JWT com sessões
- Controle de acesso baseado em roles

### 📦 **Gestão de Produtos**
- CRUD completo de produtos
- Controle de estoque em tempo real
- Categorias e busca avançada
- Código de barras e SKU
- Produtos em destaque

### 🛒 **Gestão de Vendas**
- Criação de vendas com múltiplos itens
- Controle de status (pendente, pago, cancelado)
- Geração automática de números de venda
- Atualização automática de estoque
- Histórico completo de vendas

### 👥 **Gestão de Clientes**
- Cadastro completo de clientes
- Dados pessoais e empresariais
- Sistema VIP com benefícios
- Histórico de compras
- Limite de crédito

### 💰 **Módulo Financeiro**
- Transações de entrada e saída
- Contas a receber e pagar
- Relatórios financeiros detalhados
- Controle de fluxo de caixa

### 📊 **Relatórios Avançados**
- Vendas por período
- Produtos mais vendidos
- Análise de clientes
- Controle de estoque
- Performance de vendas
- Exportação de dados

### 🏪 **Catálogo Público**
- Visualização pública de produtos
- Filtros por categoria e preço
- Produtos em destaque
- Busca por código de barras

## 🛠️ **Tecnologias**

### Backend
- **Node.js** com Express
- **MySQL** com pool de conexões
- **JWT** para autenticação
- **Bcrypt** para criptografia
- **Express Validator** para validações
- **Helmet** para segurança

### Frontend
- **React 18** com TypeScript
- **Vite** para build
- **Tailwind CSS** para estilização
- **Radix UI** para componentes
- **React Router** para navegação
- **React Query** para cache
- **Framer Motion** para animações

## 🚀 **Instalação e Configuração**

### Pré-requisitos
- Node.js 18+ 
- MySQL 8.0+
- npm ou yarn

### 1. Clone o repositório
```bash
git clone https://github.com/seu-usuario/kontrolla-saas.git
cd kontrolla-saas
```

### 2. Configure o Backend
```bash
cd Backend
npm install
npm run setup
```

### 3. Configure o Frontend
```bash
cd ../Frontend
npm install
npm run dev
```

### 4. Configure as variáveis de ambiente

Crie um arquivo `.env` na pasta `Backend` baseado no `env.example`:

```env
# Configurações do Servidor
PORT=3000
NODE_ENV=development

# Configurações do Banco de Dados MySQL
DB_HOST=localhost
DB_PORT=3306
DB_NAME=kontrollapro
DB_USER=root
DB_PASSWORD=sua_senha_mysql

# Configurações de Autenticação
JWT_SECRET=seu_jwt_secret_muito_seguro_aqui

# Configurações de CORS
CORS_ORIGIN=http://localhost:5173
```

### Stripe (assinaturas dos planos)

Para habilitar pagamentos recorrentes por assinatura via Stripe, configure no `.env` do Backend:

```env
# Stripe
STRIPE_SECRET_KEY=sk_live_xxx_ou_sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Price IDs (um por plano do seu sistema)
STRIPE_PRICE_STARTER=price_xxx
STRIPE_PRICE_PROFESSIONAL=price_xxx
STRIPE_PRICE_ENTERPRISE=price_xxx

# URLs de retorno do Checkout (web)
STRIPE_SUCCESS_URL=https://pvd.kontrollapro.com.br/dashboard?stripe=success
STRIPE_CANCEL_URL=https://pvd.kontrollapro.com.br/signup?stripe=cancel

# Billing Portal (opcional)
STRIPE_BILLING_PORTAL_RETURN_URL=https://pvd.kontrollapro.com.br/dashboard/configuracoes
```

Se você também for usar **Stripe.js no Frontend** (ex.: para Elements), configure no `Frontend/.env.production`:

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxx_ou_pk_test_xxx
```

#### Webhook Stripe

Crie um endpoint de webhook no Stripe apontando para:
- `POST /api/billing/webhook` (ex.: `https://pvd.kontrollapro.com.br/api/billing/webhook`)

Eventos recomendados:
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

Depois rode as migrações do banco (local/servidor) para adicionar os campos de billing no tenant:

```bash
cd Backend
npm run migrate
```

### 5. Execute o projeto

**Backend:**
```bash
cd Backend
npm start
```

**Frontend:**
```bash
cd Frontend
npm run dev
```

## 📱 **Acesso ao Sistema**

### 🏠 **Desenvolvimento Local**
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000
- **Health Check:** http://localhost:3000/health

### 🌐 **Produção**
- **Aplicação:** https://pvd.kontrollapro.com.br
- **API:** https://pvd.kontrollapro.com.br/api
- **Health Check:** https://pvd.kontrollapro.com.br/api/health

### 🔑 **Credenciais de Teste**
- **Email:** admin@lojaexemplo.com.br
- **Senha:** admin123

## 📚 **Documentação da API**

### Autenticação
- `POST /api/auth/signup` - Cadastro de novo usuário
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Dados do usuário logado
- `POST /api/auth/logout` - Logout

### Produtos
- `GET /api/produtos` - Listar produtos
- `POST /api/produtos` - Criar produto
- `GET /api/produtos/:id` - Buscar produto
- `PUT /api/produtos/:id` - Atualizar produto
- `DELETE /api/produtos/:id` - Deletar produto

### Vendas
- `GET /api/vendas` - Listar vendas
- `POST /api/vendas` - Criar venda
- `GET /api/vendas/:id` - Buscar venda
- `PATCH /api/vendas/:id/status` - Atualizar status

### Clientes
- `GET /api/clientes` - Listar clientes
- `POST /api/clientes` - Criar cliente
- `GET /api/clientes/:id` - Buscar cliente
- `PUT /api/clientes/:id` - Atualizar cliente
- `DELETE /api/clientes/:id` - Deletar cliente

### Relatórios
- `GET /api/relatorios/vendas-periodo` - Relatório de vendas
- `GET /api/relatorios/produtos-vendidos` - Produtos mais vendidos
- `GET /api/relatorios/analise-clientes` - Análise de clientes
- `GET /api/relatorios/controle-estoque` - Controle de estoque

## 🏗️ **Arquitetura**

### Backend
```
Backend/
├── src/
│   ├── database/          # Configuração do banco
│   ├── middleware/        # Middlewares de autenticação e validação
│   ├── routes/           # Rotas da API
│   └── server.js         # Servidor principal
├── uploads/              # Arquivos enviados
└── package.json
```

### Frontend
```
Frontend/
├── src/
│   ├── components/       # Componentes reutilizáveis
│   ├── pages/           # Páginas da aplicação
│   ├── hooks/           # Hooks customizados
│   ├── lib/             # Utilitários
│   └── config/          # Configurações
├── public/              # Arquivos estáticos
└── package.json
```

## 🔒 **Segurança**

- Autenticação JWT com sessões
- Criptografia de senhas com bcrypt
- Rate limiting para prevenir ataques
- Validação rigorosa de entrada
- CORS configurado
- Headers de segurança com Helmet

## 🚀 **Deploy**

### Backend (Railway/Heroku)
```bash
# Configure as variáveis de ambiente
# Deploy automático via Git
```

### Frontend (Vercel/Netlify)
```bash
npm run build
# Deploy da pasta dist/
```

## 💾 **Backups (Produção com Docker)**

Este projeto usa **MySQL** + **uploads locais** (pasta/volume) e, em produção, o `docker-compose.prod.yml` já inclui um serviço `backup` que:

- Faz `mysqldump` diário do banco (compactado `.sql.gz`)
- Compacta os arquivos de `uploads` (e logs, se montados)
- Aplica retenção por dias (ex.: 30)
- Salva tudo na pasta `./backups` do host

### Onde ficam os backups
- **Banco**: `./backups/mysql/backup_<db>_<data>.sql.gz`
- **Uploads**: `./backups/uploads/uploads_<data>.tar.gz`
- **Logs**: `./backups/logs/logs_<data>.tar.gz` (se `logs_data` estiver montado)

### Variáveis úteis
No arquivo `.env.production`:
- `BACKUP_SCHEDULE` (cron, padrão `0 2 * * *`)
- `BACKUP_RETENTION_DAYS` (padrão `30`)

### Restaurar (emergência)
O container `backup` monta `scripts/restore.sh`. Para restaurar o **último dump**:

```bash
docker exec -e FORCE_RESTORE=1 kontrolla-backup sh /restore.sh
```

Para restaurar também os uploads (sobrescrevendo arquivos existentes):

```bash
docker exec -e FORCE_RESTORE=1 -e RESTORE_UPLOADS=1 -e FORCE_RESTORE_UPLOADS=1 kontrolla-backup sh /restore.sh
```

> Recomendação: mantenha cópia **fora do servidor** (S3/Backblaze/NAS) e teste restore periodicamente.

## 🤝 **Contribuição**

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 **Licença**

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📞 **Suporte**

Para suporte, envie um email para suporte@kontrollapro.com ou abra uma issue no GitHub.

---

**Desenvolvido com ❤️ pela equipe KontrollaPro**