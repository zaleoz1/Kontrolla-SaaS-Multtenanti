# Kontrolla SaaS - Sistema de Gestão Empresarial

Sistema completo de gestão empresarial desenvolvido como SaaS multitenant, oferecendo funcionalidades de controle de estoque, vendas, clientes, financeiro e emissão de NF-e.

## 🚀 Tecnologias

### Frontend
- **React 18** com TypeScript
- **Vite** para build e desenvolvimento
- **Tailwind CSS** para estilização
- **Radix UI** para componentes
- **React Router** para navegação
- **TanStack Query** para gerenciamento de estado
- **React Hook Form** para formulários
- **Zod** para validação

### Backend
- **Node.js** com TypeScript
- **Express.js** para API REST
- **Prisma** como ORM
- **PostgreSQL** como banco de dados
- **JWT** para autenticação
- **Bcrypt** para hash de senhas
- **Swagger** para documentação da API

## 📁 Estrutura do Projeto

```
kontrolla-saas/
├── frontend/                 # Aplicação React
│   ├── src/
│   │   ├── components/       # Componentes reutilizáveis
│   │   │   ├── ui/          # Componentes base (shadcn/ui)
│   │   │   ├── layout/      # Componentes de layout
│   │   │   └── dashboard/   # Componentes específicos do dashboard
│   │   ├── pages/           # Páginas da aplicação
│   │   ├── hooks/           # Custom hooks
│   │   ├── lib/             # Utilitários e configurações
│   │   ├── config/          # Configurações da aplicação
│   │   └── types/           # Tipos TypeScript
│   ├── public/              # Arquivos estáticos
│   └── package.json
├── backend/                  # API Node.js
│   ├── src/
│   │   ├── controllers/     # Controladores da API
│   │   ├── middleware/      # Middlewares
│   │   ├── routes/          # Rotas da API
│   │   ├── services/        # Lógica de negócio
│   │   ├── models/          # Modelos de dados
│   │   ├── utils/           # Utilitários
│   │   ├── config/          # Configurações
│   │   └── types/           # Tipos TypeScript
│   ├── prisma/              # Schema e migrações do banco
│   └── package.json
└── package.json             # Configuração do workspace
```

## 🛠️ Instalação e Configuração

### Pré-requisitos
- Node.js 18+ 
- PostgreSQL 14+
- npm 8+

### 1. Clone o repositório
```bash
git clone <repository-url>
cd kontrolla-saas
```

### 2. Instale as dependências
```bash
npm run install:all
```

### 3. Configure as variáveis de ambiente

#### Backend
```bash
cd backend
cp env.example .env
```

Edite o arquivo `.env` com suas configurações:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/kontrolla_db"
JWT_SECRET="your-super-secret-jwt-key"
PORT=8000
NODE_ENV=development
```

#### Frontend
```bash
cd frontend
cp .env.example .env.local
```

Edite o arquivo `.env.local`:
```env
VITE_API_URL=http://localhost:8000/api
VITE_APP_NAME=Kontrolla
```

### 4. Configure o banco de dados
```bash
npm run db:migrate
npm run db:seed
```

### 5. Execute o projeto
```bash
npm run dev
```

O frontend estará disponível em `http://localhost:3000` e o backend em `http://localhost:8000`.

## 📚 Scripts Disponíveis

### Desenvolvimento
- `npm run dev` - Executa frontend e backend simultaneamente
- `npm run dev:frontend` - Executa apenas o frontend
- `npm run dev:backend` - Executa apenas o backend

### Build
- `npm run build` - Build completo (frontend + backend)
- `npm run build:frontend` - Build do frontend
- `npm run build:backend` - Build do backend

### Banco de Dados
- `npm run db:migrate` - Executa migrações
- `npm run db:generate` - Gera cliente Prisma
- `npm run db:seed` - Popula banco com dados iniciais
- `npm run db:studio` - Abre Prisma Studio

### Qualidade de Código
- `npm run lint` - Executa linter em todo o projeto
- `npm run test` - Executa testes

## 🏗️ Arquitetura

### Multitenancy
O sistema implementa multitenancy por banco de dados compartilhado com isolamento por `tenant_id`. Cada tenant possui:
- Dados isolados
- Configurações personalizáveis
- Planos de assinatura
- Usuários próprios

### Autenticação
- JWT tokens para autenticação
- Middleware de autenticação em todas as rotas protegidas
- Middleware de tenant para isolamento de dados
- Refresh tokens para renovação automática

### API REST
- Endpoints RESTful seguindo convenções
- Documentação automática com Swagger
- Validação de dados com express-validator
- Tratamento de erros padronizado
- Rate limiting para segurança

## 🔧 Desenvolvimento

### Adicionando Novas Funcionalidades

#### Frontend
1. Crie os componentes em `frontend/src/components/`
2. Adicione as páginas em `frontend/src/pages/`
3. Configure as rotas em `frontend/src/config/routes.ts`
4. Adicione os tipos em `frontend/src/lib/types.ts`

#### Backend
1. Crie o modelo no schema Prisma
2. Execute a migração: `npm run db:migrate`
3. Crie o controller em `backend/src/controllers/`
4. Crie as rotas em `backend/src/routes/`
5. Adicione middleware se necessário

### Convenções de Código
- Use TypeScript em todo o projeto
- Siga as convenções do ESLint configurado
- Use nomes descritivos para variáveis e funções
- Documente APIs com Swagger
- Escreva testes para funcionalidades críticas

## 📖 Documentação da API

A documentação da API está disponível em `http://localhost:8000/api-docs` quando o backend estiver rodando.

## 🚀 Deploy

### Frontend (Vercel/Netlify)
```bash
npm run build:frontend
```

### Backend (Railway/Heroku)
```bash
npm run build:backend
```

### Docker
```bash
docker-compose up -d
```

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📞 Suporte

Para suporte, entre em contato através do email: suporte@kontrolla.com