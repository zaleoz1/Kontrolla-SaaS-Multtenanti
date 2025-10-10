# 🔧 Correção de Problemas de Rotas - KontrollaPro

## ❌ Problema Identificado

**Erro:** `{"error":"Rota não encontrada: /api/auth/send-verification-code"}`

Este erro indica que as rotas da API não estão sendo direcionadas corretamente pelo nginx para o backend.

## 🚀 Soluções Implementadas

### 1. ⚙️ Correção na Configuração do Nginx

**Problema:** Configuração incorreta do `proxy_pass` no nginx.

**Solução:** Corrigido em `/nginx/conf.d/kontrollapro.conf`:
```nginx
location /api/ {
    proxy_pass http://backend/;  # ✅ Com barra no final
    # ... outras configurações
}
```

### 2. 🌐 Melhoria no CORS do Backend

**Problema:** CORS bloqueando requisições vindas do proxy nginx.

**Solução:** Adicionada lógica para permitir requisições internas:
```javascript
// Em produção, permitir proxy interno do nginx
if (process.env.NODE_ENV === 'production' && !origin) {
  callback(null, true);
}
```

### 3. 📊 Logs de Debug Adicionados

**Melhorias:**
- Logs detalhados no middleware `notFound`
- Debug de requisições em produção
- Headers de debug no nginx

## 🛠️ Scripts de Correção Criados

### Windows (PowerShell)
```powershell
.\scripts\fix-routes.ps1
```

### Linux/Mac (Bash)
```bash
chmod +x scripts/test-routes.sh
chmod +x scripts/debug-production.sh

# Testar rotas localmente
./scripts/test-routes.sh local

# Testar rotas em produção
./scripts/test-routes.sh prod

# Debug completo da produção
./scripts/debug-production.sh
```

## 🔍 Como Diagnosticar Problemas

### 1. Verificar Containers
```bash
docker ps
docker-compose logs -f backend
docker-compose logs -f nginx
```

### 2. Testar Conectividade
```bash
# Testar health check
curl http://localhost/health

# Testar rota da API diretamente no backend
curl http://localhost:3000/health

# Testar através do nginx
curl http://localhost/api/auth/send-verification-code \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"teste@exemplo.com"}'
```

### 3. Verificar Configuração do Nginx
```bash
# Entrar no container nginx
docker exec -it kontrolla-nginx sh

# Verificar configuração
nginx -t

# Ver logs
tail -f /var/log/nginx/error.log
```

## 🏥 Soluções de Emergência

### Configuração Nginx Simplificada

Se a configuração principal não funcionar, use a configuração simplificada:

1. Renomeie o arquivo atual:
```bash
mv nginx/conf.d/kontrollapro.conf nginx/conf.d/kontrollapro.conf.backup
```

2. Use a configuração simplificada:
```bash
mv nginx/conf.d/kontrollapro-simple.conf nginx/conf.d/kontrollapro.conf
```

3. Reinicie o nginx:
```bash
docker-compose restart nginx
```

### Reset Completo

Se nada funcionar:
```bash
# Parar tudo
docker-compose down -v

# Limpar imagens
docker-compose down --rmi all

# Reconstruir do zero
docker-compose up -d --build
```

## 📋 Checklist de Verificação

- [ ] Containers estão rodando (`docker ps`)
- [ ] Nginx não tem erros de configuração (`nginx -t`)
- [ ] Backend responde no health check (`curl localhost:3000/health`)
- [ ] Nginx redireciona corretamente (`curl localhost/health`)
- [ ] API aceita requisições (`curl localhost/api/auth/send-verification-code`)
- [ ] Frontend consegue fazer chamadas para API

## 🆘 Se Ainda Não Funcionar

1. **Verifique os logs:**
   ```bash
   docker-compose logs backend | grep -i error
   docker-compose logs nginx | grep -i error
   ```

2. **Teste diretamente no backend:**
   ```bash
   docker exec -it kontrolla-backend curl localhost:3000/api/auth/send-verification-code
   ```

3. **Verifique variáveis de ambiente:**
   ```bash
   docker exec -it kontrolla-backend env | grep -E "(NODE_ENV|PORT|DB_)"
   ```

4. **Reporte o problema com:**
   - Logs do backend
   - Logs do nginx
   - Resultado dos comandos de teste
   - Configuração do ambiente (local/produção)

## ✅ Resultado Esperado

Após aplicar as correções:
- ✅ Todas as rotas `/api/*` devem funcionar
- ✅ Frontend consegue se comunicar com o backend
- ✅ Não mais erros de "Rota não encontrada"
- ✅ Logs mostram requisições sendo processadas corretamente