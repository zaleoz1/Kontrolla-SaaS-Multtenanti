# 🚀 Configuração das Variáveis de Ambiente no Railway

## 📋 Passo a Passo

### 1. Acesse o Railway Dashboard
- Vá para [railway.app](https://railway.app)
- Selecione seu projeto
- Clique em **Settings** → **Variables**

### 2. Adicione as Variáveis de Ambiente

Copie e cole as seguintes variáveis uma por uma:

#### 🔧 Configurações Básicas
```
NODE_ENV=production
PORT=3001
```

#### 🗄️ Banco de Dados (Substitua pelos valores do seu MySQL no Railway)
```
DB_HOST=${{MySQL.MYSQL_HOST}}
DB_PORT=${{MySQL.MYSQL_PORT}}
DB_USER=${{MySQL.MYSQL_USER}}
DB_PASSWORD=${{MySQL.MYSQL_PASSWORD}}
DB_NAME=${{MySQL.MYSQL_DATABASE}}
```

#### 🔐 Autenticação (Secrets seguros gerados)
```
JWT_SECRET=bc6085c889947f913d3350dacf73c3a6a60d3de2881c8859d8ce91e0311b0d21
JWT_EXPIRES_IN=24h
SESSION_SECRET=95afa7405003aff76a08306415347ffb7cf5bf62af324628757d5368e6f8bab2
API_KEY=42bdfc0247cc03aa296c0827811d09b3
ENCRYPTION_KEY=5841a990f35b902cc23973cff5ba1438be9c3b432615092dfa0f054e1f49557d
```

#### 📧 Email
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=kontrollapro@gmail.com
EMAIL_PASS=kbuz yhdu hdku htaq
EMAIL_FROM=noreply@kontrollapro.com
```

#### ☁️ Cloudinary
```
CLOUDINARY_CLOUD_NAME=dko7s3u3j
CLOUDINARY_API_KEY=754366869343179
CLOUDINARY_API_SECRET=1uMokyb2NhuzefxNt1ocJm3yfAU
```

#### 🔗 Google OAuth
```
GOOGLE_CLIENT_ID=505635879481-974u3cn4qac3eeti5i9gjsreo3o315dp.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_REDIRECT_URI=https://seu-dominio.railway.app/api/auth/google/callback
```

#### 🌐 CORS (Atualize com seu domínio)
```
CORS_ORIGIN=https://seu-dominio.railway.app
```

#### ⚙️ Configurações Adicionais
```
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
HELMET_CSP_ENABLED=true
HELMET_HSTS_ENABLED=true
LOG_LEVEL=info
LOG_FORMAT=combined
CACHE_TTL=3600
BACKUP_ENABLED=true
HEALTH_CHECK_ENABLED=true
METRICS_ENABLED=true
SSL_ENABLED=true
SSL_REDIRECT=true
COMPRESSION_ENABLED=true
COMPRESSION_LEVEL=6
REQUEST_TIMEOUT=30000
KEEP_ALIVE_TIMEOUT=5000
WORKERS=1
CLUSTER_MODE=false
```

### 3. ⚠️ IMPORTANTE: Altere os Secrets!

**NUNCA** use os secrets padrão em produção! Gere novos secrets seguros:

```bash
# Gere um JWT_SECRET seguro (32+ caracteres)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Gere um SESSION_SECRET seguro (32+ caracteres)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. 🔄 Atualize o CORS_ORIGIN

Após o deploy, atualize a variável `CORS_ORIGIN` com a URL real do seu projeto:
```
CORS_ORIGIN=https://seu-projeto.railway.app
```

### 5. 🔄 Atualize o GOOGLE_REDIRECT_URI

No Google Cloud Console, atualize a URI de redirecionamento:
```
https://seu-projeto.railway.app/api/auth/google/callback
```

## ✅ Verificação

Após configurar todas as variáveis:

1. **Deploy**: O Railway fará deploy automático
2. **Health Check**: Acesse `https://seu-projeto.railway.app/api/health`
3. **Logs**: Verifique os logs no Railway Dashboard
4. **Banco**: Execute as migrações: `railway run npm run migrate`

## 🚨 Troubleshooting

### Erro: "Variáveis obrigatórias não encontradas"
- Verifique se todas as variáveis foram adicionadas
- Certifique-se de que não há espaços extras

### Erro: "JWT_SECRET deve ter pelo menos 32 caracteres"
- Gere um novo JWT_SECRET com 32+ caracteres
- Use o comando Node.js acima

### Erro: "CORS não permitido"
- Atualize `CORS_ORIGIN` com a URL correta
- Verifique se não há `/` no final da URL

### Erro: "Banco de dados não conecta"
- Verifique se o MySQL está configurado no Railway
- Confirme se as variáveis do banco estão corretas

## 📞 Suporte

- **Railway Docs**: [docs.railway.app](https://docs.railway.app)
- **Railway Discord**: [discord.gg/railway](https://discord.gg/railway)
