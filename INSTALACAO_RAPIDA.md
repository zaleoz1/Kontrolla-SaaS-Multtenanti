# 🚀 Instalação Rápida - KontrollaPro

## ⚡ Setup em 5 minutos

### 1. **Pré-requisitos**
- Node.js 18+ instalado
- MySQL 8.0+ rodando
- Git instalado

### 2. **Clone e Instale**
```bash
# Clone o repositório
git clone https://github.com/seu-usuario/kontrolla-saas.git
cd kontrolla-saas

# Instale dependências do backend
cd Backend
npm install

# Configure e execute o backend
npm run setup
npm start
```

### 3. **Em outro terminal, configure o frontend**
```bash
cd Frontend
npm install
npm run dev
```

### 4. **Acesse o sistema**
- **Frontend:** http://localhost:5173
- **Backend:** http://localhost:3000
- **Health Check:** http://localhost:3000/health

### 5. **Login de teste**
- **Email:** admin@lojaexemplo.com.br
- **Senha:** admin123

## 🔧 Configuração Manual (se necessário)

### Backend (.env)
```env
PORT=3000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_NAME=kontrollapro
DB_USER=root
DB_PASSWORD=sua_senha_mysql
JWT_SECRET=seu_jwt_secret_muito_seguro_aqui
CORS_ORIGIN=http://localhost:5173
```

### Frontend (env.example)
```env
VITE_API_URL=http://localhost:3000/api
VITE_APP_NAME=KontrollaPro
VITE_DEBUG=true
```

## 🐛 Problemas Comuns

### Erro de conexão com MySQL
```bash
# Verifique se o MySQL está rodando
mysql --version

# Crie o banco manualmente se necessário
mysql -u root -p
CREATE DATABASE kontrollapro;
```

### Erro de porta em uso
```bash
# Backend (porta 3000)
lsof -ti:3000 | xargs kill -9

# Frontend (porta 5173)
lsof -ti:5173 | xargs kill -9
```

### Erro de permissões
```bash
# Linux/Mac
sudo chown -R $USER:$USER .

# Windows (PowerShell como Admin)
icacls . /grant Everyone:F /T
```

## ✅ Verificação

1. Backend rodando: http://localhost:3000/health
2. Frontend carregando: http://localhost:5173
3. Login funcionando com credenciais de teste
4. Dashboard carregando dados

## 🆘 Suporte

Se encontrar problemas:
1. Verifique os logs do terminal
2. Confirme se MySQL está rodando
3. Verifique as variáveis de ambiente
4. Abra uma issue no GitHub

---

**🎉 Pronto! Seu sistema KontrollaPro está funcionando!**
