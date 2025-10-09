# 🚀 Guia de Deploy no Railway - KontrollaPro SaaS

## 📋 Pré-requisitos

1. **Conta no Railway**: [railway.app](https://railway.app)
2. **Conta no Cloudinary**: [cloudinary.com](https://cloudinary.com) (para upload de imagens)
3. **Conta no Gmail**: Para configuração de email
4. **Repositório no GitHub**: Com o código do projeto

## 🗄️ Passo 1: Configurar Banco de Dados MySQL

### Opção A: MySQL no Railway (Recomendado)
1. No Railway, vá para **"New Project"**
2. Selecione **"Provision MySQL"**
3. Anote as credenciais do banco:
   - `MYSQL_HOST`
   - `MYSQL_PORT`
   - `MYSQL_USER`
   - `MYSQL_PASSWORD`
   - `MYSQL_DATABASE`

### Opção B: PlanetScale (Alternativa)
1. Crie conta no [PlanetScale](https://planetscale.com)
2. Crie um novo banco de dados
3. Anote as credenciais de conexão

## 🔧 Passo 2: Configurar Cloudinary

1. Acesse [cloudinary.com](https://cloudinary.com)
2. Crie uma conta gratuita
3. No Dashboard, anote:
   - **Cloud Name**
   - **API Key**
   - **API Secret**

## 📧 Passo 3: Configurar Email (Gmail)

1. Ative a **Verificação em 2 etapas** na sua conta Google
2. Gere uma **Senha de app**:
   - Google Account → Segurança → Senhas de app
   - Selecione "Mail" e "Outro"
   - Digite "KontrollaPro"
   - Copie a senha gerada

## 🚀 Passo 4: Deploy no Railway

### 4.1 Conectar Repositório
1. No Railway, clique **"New Project"**
2. Selecione **"Deploy from GitHub repo"**
3. Conecte sua conta GitHub
4. Selecione o repositório do KontrollaPro

### 4.2 Configurar Variáveis de Ambiente

No Railway, vá para **Settings → Variables** e adicione:

```bash
# ===========================================
# CONFIGURAÇÕES DO BANCO DE DADOS
# ===========================================
DB_HOST=${{MySQL.MYSQL_HOST}}
DB_PORT=${{MySQL.MYSQL_PORT}}
DB_USER=${{MySQL.MYSQL_USER}}
DB_PASSWORD=${{MySQL.MYSQL_PASSWORD}}
DB_NAME=${{MySQL.MYSQL_DATABASE}}

# ===========================================
# CONFIGURAÇÕES DO SERVIDOR
# ===========================================
NODE_ENV=production
PORT=3001
JWT_SECRET=seu_jwt_secret_super_seguro_aqui_32_caracteres_minimo
SESSION_SECRET=seu_session_secret_super_seguro_aqui_32_caracteres_minimo

# ===========================================
# CONFIGURAÇÕES DE EMAIL
# ===========================================
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=seu_email@gmail.com
EMAIL_PASS=sua_senha_de_app_do_gmail
EMAIL_FROM=noreply@kontrollapro.com

# ===========================================
# CONFIGURAÇÕES DO CLOUDINARY
# ===========================================
CLOUDINARY_CLOUD_NAME=seu_cloud_name
CLOUDINARY_API_KEY=sua_api_key
CLOUDINARY_API_SECRET=sua_api_secret

# ===========================================
# CONFIGURAÇÕES DO GOOGLE OAUTH (Opcional)
# ===========================================
GOOGLE_CLIENT_ID=seu_google_client_id
GOOGLE_CLIENT_SECRET=seu_google_client_secret

# ===========================================
# CONFIGURAÇÕES DO FRONTEND
# ===========================================
VITE_API_URL=https://seu-dominio.railway.app/api
VITE_APP_NAME=KontrollaPro
VITE_APP_VERSION=1.0.0

# ===========================================
# CONFIGURAÇÕES DE SEGURANÇA
# ===========================================
CORS_ORIGIN=https://seu-dominio.railway.app
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 4.3 Configurar Build Settings

No Railway, vá para **Settings → Build**:

- **Build Command**: `npm run build`
- **Start Command**: `npm run start:prod`
- **Root Directory**: `/`

### 4.4 Deploy

1. Clique em **"Deploy"**
2. Aguarde o build completar
3. Anote a URL gerada (ex: `https://seu-projeto.railway.app`)

## 🗃️ Passo 5: Configurar Banco de Dados

### 5.1 Executar Migrações
Após o deploy, execute as migrações:

```bash
# Via Railway CLI
railway run npm run migrate

# Ou via terminal do Railway
# Acesse o terminal do serviço e execute:
cd Backend && npm run migrate
```

### 5.2 Executar Seed (Opcional)
Para dados de exemplo:

```bash
railway run npm run seed
```

## 🌐 Passo 6: Configurar Domínio Personalizado (Opcional)

1. No Railway, vá para **Settings → Domains**
2. Adicione seu domínio personalizado
3. Configure os registros DNS conforme instruções

## 🔍 Passo 7: Verificar Deploy

### 7.1 Health Check
Acesse: `https://seu-dominio.railway.app/api/health`

Deve retornar:
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456,
  "environment": "production"
}
```

### 7.2 Testar API
Acesse: `https://seu-dominio.railway.app/`

Deve retornar informações da API.

## 📱 Passo 8: Configurar Frontend

### 8.1 Atualizar URL da API
No arquivo `Frontend/src/config/api.ts`, atualize:

```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://seu-dominio.railway.app/api';
```

### 8.2 Build do Frontend
```bash
cd Frontend
npm run build
```

### 8.3 Deploy do Frontend
Você pode usar:
- **Vercel** (recomendado)
- **Netlify**
- **Railway** (serviço separado)

## 🛠️ Troubleshooting

### Problema: Erro de CORS
**Solução**: Verifique se `CORS_ORIGIN` está configurado corretamente.

### Problema: Banco não conecta
**Solução**: 
1. Verifique as variáveis de ambiente do banco
2. Teste a conexão: `railway run npm run migrate`

### Problema: Upload de imagens falha
**Solução**: Verifique as credenciais do Cloudinary.

### Problema: Email não envia
**Solução**: 
1. Verifique as credenciais do Gmail
2. Use senha de app, não senha normal

## 📊 Monitoramento

### Logs
No Railway, vá para **Deployments → Logs** para ver logs em tempo real.

### Métricas
Railway fornece métricas básicas de CPU, memória e rede.

## 🔒 Segurança

### Variáveis Sensíveis
- Nunca commite arquivos `.env`
- Use Railway Variables para dados sensíveis
- Rotacione secrets regularmente

### Rate Limiting
O sistema já inclui rate limiting configurado.

### CORS
Configure `CORS_ORIGIN` apenas com domínios confiáveis.

## 📈 Escalabilidade

### Auto-scaling
Railway escala automaticamente baseado na demanda.

### Database
Para alta demanda, considere:
- **PlanetScale** (MySQL serverless)
- **Supabase** (PostgreSQL)
- **Railway MySQL** (até 1GB gratuito)

## 💰 Custos

### Railway
- **Hobby Plan**: $5/mês
- **Pro Plan**: $20/mês
- **Team Plan**: $99/mês

### Recursos Externos
- **Cloudinary**: 25GB gratuito
- **Gmail**: Gratuito
- **MySQL**: Incluído no Railway

## 🎯 Próximos Passos

1. ✅ Configure monitoramento avançado
2. ✅ Implemente backup automático
3. ✅ Configure CDN para assets
4. ✅ Implemente cache Redis
5. ✅ Configure SSL/TLS
6. ✅ Implemente CI/CD

## 📞 Suporte

- **Railway Docs**: [docs.railway.app](https://docs.railway.app)
- **Railway Discord**: [discord.gg/railway](https://discord.gg/railway)
- **KontrollaPro Issues**: [GitHub Issues](https://github.com/seu-usuario/kontrollapro/issues)

---

**🎉 Parabéns! Seu sistema SaaS KontrollaPro está no ar!**
