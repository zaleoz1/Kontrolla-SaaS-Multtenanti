# Guia de Deploy - KontrollaPro no Integrator Host

Este guia detalha como hospedar o sistema KontrollaPro no Integrator Host usando Docker e Docker Compose.

## 📋 Pré-requisitos

- Servidor VPS com AlmaLinux 9 (Integrator Host)
- Acesso SSH como root
- Domínio configurado apontando para o IP do servidor
- Conhecimento básico de Linux e Docker

## 🚀 Passo a Passo

### 1. Conectar ao Servidor

```bash
ssh root@207.58.174.116
# Senha: ny59QZejCNOX7HZ4
```

### 2. Configurar o Servidor

Execute o script de configuração inicial:

```bash
# Baixar e executar o script de configuração
curl -O https://raw.githubusercontent.com/zaleoz1/Kontrolla-SaaS-Multtenanti/main/scripts/setup-server.sh
chmod +x setup-server.sh
./setup-server.sh
```

### 3. Clonar o Repositório

```bash
cd /opt
git clone https://github.com/zaleoz1/Kontrolla-SaaS-Multtenanti.git
cd Kontrolla-SaaS-Multtenanti
```

### 4. Configurar Variáveis de Ambiente

Copie e edite o arquivo de ambiente:

```bash
cp env.production .env
nano .env
```

**Configure as seguintes variáveis importantes:**

```bash
# Substitua pelos seus valores reais
DB_PASSWORD=sua_senha_super_segura
JWT_SECRET=sua_chave_jwt_super_segura
CLOUDINARY_CLOUD_NAME=seu_cloud_name
CLOUDINARY_API_KEY=sua_api_key
CLOUDINARY_API_SECRET=sua_api_secret
EMAIL_USER=seu-email@gmail.com
EMAIL_PASS=sua_senha_app_gmail
GOOGLE_CLIENT_ID=seu_google_client_id
GOOGLE_CLIENT_SECRET=seu_google_client_secret
CORS_ORIGIN=https://seudominio.com
```

### 5. Configurar Domínio

Atualize a configuração do Nginx com seu domínio:

```bash
nano nginx/conf.d/kontrolla.conf
```

Substitua `kontrollapro.com` pelo seu domínio real.

### 6. Deploy da Aplicação

Execute o script de deploy:

```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

### 7. Configurar SSL (Let's Encrypt)

```bash
chmod +x scripts/ssl-setup.sh
./scripts/ssl-setup.sh seudominio.com seu-email@dominio.com
```

## 🔧 Configurações Adicionais

### Configurar DNS

No seu provedor de domínio, configure:

```
Tipo: A
Nome: @
Valor: 207.58.174.116

Tipo: A  
Nome: www
Valor: 207.58.174.116
```

### Configurar Email

Para usar Gmail SMTP:

1. Ative a verificação em 2 etapas
2. Gere uma senha de app
3. Use a senha de app no arquivo `.env`

### Configurar Cloudinary

1. Crie uma conta em [cloudinary.com](https://cloudinary.com)
2. Obtenha suas credenciais no dashboard
3. Configure no arquivo `.env`

### Configurar Google OAuth

1. Acesse [Google Cloud Console](https://console.cloud.google.com)
2. Crie um projeto
3. Ative a Google+ API
4. Crie credenciais OAuth 2.0
5. Configure as URLs de redirecionamento

## 📊 Monitoramento

### Verificar Status dos Containers

```bash
docker-compose -f docker-compose.prod.yml ps
```

### Ver Logs

```bash
# Todos os serviços
docker-compose -f docker-compose.prod.yml logs -f

# Serviço específico
docker-compose -f docker-compose.prod.yml logs -f backend
```

### Backup Automático

O sistema já está configurado para fazer backup automático diário às 2h da manhã.

Para backup manual:

```bash
/usr/local/bin/kontrolla-backup.sh
```

## 🔄 Comandos Úteis

### Reiniciar Aplicação

```bash
docker-compose -f docker-compose.prod.yml restart
```

### Parar Aplicação

```bash
docker-compose -f docker-compose.prod.yml down
```

### Iniciar Aplicação

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Atualizar Aplicação

```bash
git pull
docker-compose -f docker-compose.prod.yml up --build -d
```

## 🛠️ Solução de Problemas

### Container não inicia

```bash
# Verificar logs
docker-compose -f docker-compose.prod.yml logs nome_do_container

# Verificar status
docker ps -a
```

### Banco de dados não conecta

```bash
# Verificar se MySQL está rodando
docker exec kontrolla-mysql-prod mysql -u root -p -e "SHOW DATABASES;"
```

### SSL não funciona

```bash
# Verificar certificados
certbot certificates

# Renovar manualmente
certbot renew
```

### Aplicação não carrega

```bash
# Verificar se todos os containers estão rodando
docker-compose -f docker-compose.prod.yml ps

# Verificar logs do Nginx
docker-compose -f docker-compose.prod.yml logs nginx
```

## 📈 Otimizações

### Configurar Cache Redis

O Redis já está configurado para cache. Para verificar:

```bash
docker exec kontrolla-redis-prod redis-cli ping
```

### Configurar CDN

Para melhor performance, configure um CDN como Cloudflare:

1. Adicione seu domínio no Cloudflare
2. Configure as DNS records
3. Ative o proxy (nuvem laranja)

### Monitoramento Avançado

Para monitoramento mais avançado, considere:

- Prometheus + Grafana
- ELK Stack (Elasticsearch, Logstash, Kibana)
- New Relic ou DataDog

## 🔒 Segurança

### Firewall

O firewall já está configurado com as portas necessárias:

- 22 (SSH)
- 80 (HTTP)
- 443 (HTTPS)
- 3000 (Backend - opcional)

### Backup

- Backup automático diário
- Retenção de 7 dias
- Backup do banco e arquivos

### SSL

- Certificado Let's Encrypt
- Renovação automática
- HSTS habilitado

## 📞 Suporte

Para problemas específicos do Integrator Host:

- **Painel ICP**: https://vps6150.panel.icontainer.run:2090/admin
- **Usuário**: vps6150
- **Senha**: kiu07SGHExnMt

Para problemas com a aplicação:

1. Verifique os logs: `docker-compose -f docker-compose.prod.yml logs`
2. Verifique o status: `docker-compose -f docker-compose.prod.yml ps`
3. Reinicie se necessário: `docker-compose -f docker-compose.prod.yml restart`

## 🎯 Checklist Final

- [ ] Servidor configurado
- [ ] Repositório clonado
- [ ] Variáveis de ambiente configuradas
- [ ] Domínio apontando para o servidor
- [ ] SSL configurado
- [ ] Aplicação rodando
- [ ] Backup configurado
- [ ] Monitoramento ativo

## 📝 Notas Importantes

1. **Nunca altere a senha do root** sem consultar o suporte
2. **Sempre faça backup** antes de grandes mudanças
3. **Monitore os logs** regularmente
4. **Mantenha o sistema atualizado** para segurança
5. **Configure alertas** para monitoramento

---

**Aplicação URL**: https://seudominio.com
**Painel Admin**: https://seudominio.com/admin
**API**: https://seudominio.com/api

Para mais informações, consulte a documentação do projeto no GitHub.
