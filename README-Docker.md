# 🐳 Docker Setup para KontrollaPro

Este documento explica como configurar e executar o KontrollaPro usando Docker.

## 📋 Pré-requisitos

- [Docker](https://docs.docker.com/get-docker/) instalado
- [Docker Compose](https://docs.docker.com/compose/install/) instalado
- Pelo menos 4GB de RAM disponível
- Portas 80, 3000 e 3306 livres

## 🚀 Início Rápido

### 1. Configuração Inicial

```bash
# Clone o repositório (se ainda não fez)
git clone <seu-repositorio>
cd Kontrolla-SaaS-Multtenanti

# Copie o arquivo de configuração
cp docker.env.example .env

# Edite as configurações conforme necessário
nano .env
```

### 2. Executar em Produção

```bash
# Usando script (Linux/Mac)
./scripts/docker-start.sh

# Usando script (Windows)
scripts\docker-start.bat

# Ou manualmente
docker-compose up --build -d
```

### 3. Executar em Desenvolvimento

```bash
# Usando script (Linux/Mac)
./scripts/docker-dev.sh

# Usando script (Windows)
scripts\docker-dev.bat

# Ou manualmente
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

## 🌐 Acessos

Após iniciar os containers:

- **Frontend**: http://localhost
- **Backend API**: http://localhost:3000
- **MySQL**: localhost:3306
- **Redis**: localhost:6379

## 📊 Comandos Úteis

### Ver logs
```bash
# Todos os serviços
docker-compose logs -f

# Serviço específico
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mysql
```

### Parar serviços
```bash
# Parar containers
docker-compose down

# Parar e remover volumes
docker-compose down -v
```

### Limpeza completa
```bash
# Usando script
./scripts/docker-clean.sh

# Ou manualmente
docker-compose down -v --rmi all
docker system prune -f
```

## 🔧 Configurações

### Variáveis de Ambiente

Edite o arquivo `.env` para configurar:

```env
# Banco de dados
MYSQL_ROOT_PASSWORD=sua_senha_segura
MYSQL_DATABASE=kontrollapro
MYSQL_USER=kontrolla
MYSQL_PASSWORD=sua_senha_segura

# Backend
JWT_SECRET=sua_chave_jwt_muito_segura
NODE_ENV=production

# Cloudinary (opcional)
CLOUDINARY_CLOUD_NAME=seu_cloud_name
CLOUDINARY_API_KEY=sua_api_key
CLOUDINARY_API_SECRET=seu_api_secret

# Email (opcional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=seu_email@gmail.com
EMAIL_PASS=sua_senha_app
```

### Portas Personalizadas

Para alterar as portas, edite o `docker-compose.yml`:

```yaml
services:
  frontend:
    ports:
      - "8080:80"  # Frontend na porta 8080
  backend:
    ports:
      - "3001:3000"  # Backend na porta 3001
  mysql:
    ports:
      - "3307:3306"  # MySQL na porta 3307
```

## 🏗️ Estrutura dos Containers

### Backend (Node.js)
- **Imagem**: node:18-alpine
- **Porta**: 3000
- **Volumes**: `./Backend/uploads:/app/uploads`
- **Dependências**: MySQL, Redis

### Frontend (React + Nginx)
- **Imagem**: nginx:alpine
- **Porta**: 80
- **Build**: Multi-stage com Node.js
- **Proxy**: API requests para backend

### MySQL
- **Imagem**: mysql:8.0
- **Porta**: 3306
- **Volumes**: Dados persistentes
- **Inicialização**: Schema e seed automáticos

### Redis (Opcional)
- **Imagem**: redis:7-alpine
- **Porta**: 6379
- **Uso**: Cache e sessões

## 🔍 Troubleshooting

### Problemas Comuns

1. **Porta já em uso**
   ```bash
   # Verificar processos usando as portas
   netstat -tulpn | grep :80
   netstat -tulpn | grep :3000
   netstat -tulpn | grep :3306
   ```

2. **Erro de permissão**
   ```bash
   # Linux/Mac
   sudo chmod +x scripts/*.sh
   ```

3. **Banco não conecta**
   ```bash
   # Verificar logs do MySQL
   docker-compose logs mysql
   
   # Testar conexão
   docker-compose exec mysql mysql -u root -p
   ```

4. **Frontend não carrega**
   ```bash
   # Verificar logs do frontend
   docker-compose logs frontend
   
   # Verificar se o build foi feito
   docker-compose exec frontend ls -la /usr/share/nginx/html
   ```

### Reset Completo

```bash
# Parar tudo
docker-compose down -v

# Remover imagens
docker-compose down --rmi all

# Limpar sistema
docker system prune -f

# Reconstruir
docker-compose up --build -d
```

## 📈 Monitoramento

### Health Checks

Os containers possuem health checks automáticos:

```bash
# Verificar status
docker-compose ps

# Verificar health
docker inspect kontrolla-backend | grep Health
```

### Logs em Tempo Real

```bash
# Todos os serviços
docker-compose logs -f

# Apenas erros
docker-compose logs --tail=100 | grep ERROR
```

## 🚀 Deploy em Produção

### 1. Configurar Variáveis

```bash
# Copiar arquivo de exemplo
cp docker.env.example .env

# Editar configurações de produção
nano .env
```

### 2. Configurar Domínio

```yaml
# docker-compose.yml
services:
  frontend:
    environment:
      - VITE_API_URL=https://api.seudominio.com
```

### 3. SSL/HTTPS

Para produção, configure um proxy reverso (Nginx/Traefik) com SSL.

### 4. Backup

```bash
# Backup do banco
docker-compose exec mysql mysqldump -u root -p kontrollapro > backup.sql

# Backup dos uploads
tar -czf uploads.tar.gz Backend/uploads/
```

## 📚 Scripts Disponíveis

- `docker-start.sh` - Iniciar em produção
- `docker-dev.sh` - Iniciar em desenvolvimento
- `docker-stop.sh` - Parar serviços
- `docker-logs.sh` - Ver logs
- `docker-clean.sh` - Limpeza completa

## 🤝 Contribuição

Para contribuir com melhorias no Docker:

1. Teste as mudanças localmente
2. Documente as alterações
3. Crie um PR com descrição detalhada

## 📞 Suporte

Em caso de problemas:

1. Verifique os logs: `docker-compose logs -f`
2. Consulte este README
3. Abra uma issue no repositório
