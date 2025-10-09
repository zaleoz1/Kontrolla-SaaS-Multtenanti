# 🚀 Guia de Deploy - Integrator Host

## 📋 Informações do Servidor

```
IP: 207.58.174.116
Usuário: root
Senha: ny59QZejCNOX7HZ4
Porta: 22
Domínio: vps6150.panel.icontainer.run
UUID: 15174
```

## ⚡ Deploy Automático (Recomendado)

### 1. Conectar ao Servidor
```bash
ssh root@207.58.174.116
```

### 2. Executar Deploy
```bash
# Baixar e executar script específico para Integrator Host
wget https://raw.githubusercontent.com/zaleoz1/Kontrolla-SaaS-Multtenanti/main/deploy-integrator.sh
chmod +x deploy-integrator.sh
./deploy-integrator.sh
```

### 3. Acessar a Aplicação
```
https://vps6150.panel.icontainer.run
```

## 🔧 O que o Script Faz

### Configurações Automáticas
- ✅ **Sistema**: Atualização e dependências
- ✅ **Docker**: Instalação e configuração
- ✅ **Firewall**: UFW configurado
- ✅ **SSL**: Let's Encrypt automático
- ✅ **Backup**: Automático diário
- ✅ **Monitoramento**: Scripts de verificação

### Containers Criados
- `kontrolla-mysql-prod` - Banco de dados
- `kontrolla-backend-prod` - API Node.js
- `kontrolla-frontend-prod` - Interface React
- `kontrolla-redis-prod` - Cache Redis
- `kontrolla-nginx-prod` - Proxy reverso

## 🛠️ Comandos de Gerenciamento

### Script Principal
```bash
# Localização: /opt/kontrollapro/manage.sh

# Iniciar serviços
./manage.sh start

# Parar serviços
./manage.sh stop

# Reiniciar serviços
./manage.sh restart

# Ver logs
./manage.sh logs

# Ver status
./manage.sh status

# Atualizar aplicação
./manage.sh update

# Fazer backup
./manage.sh backup

# Renovar SSL
./manage.sh ssl-renew
```

### Comandos Docker
```bash
# Ver status dos containers
docker-compose -f docker-compose.prod.yml ps

# Ver logs em tempo real
docker-compose -f docker-compose.prod.yml logs -f

# Reiniciar um serviço específico
docker-compose -f docker-compose.prod.yml restart backend
```

## 🔒 Segurança Configurada

### Firewall (UFW)
- ✅ Porta 22 (SSH)
- ✅ Porta 80 (HTTP)
- ✅ Porta 443 (HTTPS)
- ✅ Porta 3000 (Backend - interno)

### SSL/HTTPS
- ✅ Certificado Let's Encrypt
- ✅ Renovação automática
- ✅ Redirecionamento HTTP → HTTPS
- ✅ Headers de segurança

### Fail2ban
- ✅ Proteção SSH
- ✅ Bloqueio automático de IPs suspeitos
- ✅ Configuração otimizada

## 📊 Monitoramento

### Scripts de Verificação
```bash
# Status geral do sistema
kontrolla-status

# Verificar logs de erro
docker-compose -f docker-compose.prod.yml logs --tail=100 | grep ERROR

# Verificar uso de recursos
htop
df -h
free -h
```

### Logs Disponíveis
- **Nginx**: `/opt/kontrollapro/nginx/logs/`
- **Backend**: `docker-compose -f docker-compose.prod.yml logs backend`
- **Frontend**: `docker-compose -f docker-compose.prod.yml logs frontend`
- **MySQL**: `docker-compose -f docker-compose.prod.yml logs mysql`

## 💾 Backup Automático

### Configuração
- ✅ Backup diário às 2:00 AM
- ✅ Banco de dados MySQL
- ✅ Arquivos de upload
- ✅ Retenção de 30 dias
- ✅ Limpeza automática

### Backup Manual
```bash
# Executar backup manual
/opt/kontrollapro/backup.sh

# Restaurar banco de dados
docker exec -i kontrolla-mysql-prod mysql -u root -p$MYSQL_ROOT_PASSWORD $MYSQL_DATABASE < backup.sql
```

## 🔄 Atualizações

### Atualizar Aplicação
```bash
cd /opt/kontrollapro
git pull origin main
./manage.sh update
```

### Atualizar Dependências
```bash
# Backend
cd /opt/kontrollapro/Backend
docker-compose -f ../docker-compose.prod.yml build backend --no-cache

# Frontend
cd /opt/kontrollapro/Frontend
docker-compose -f ../docker-compose.prod.yml build frontend --no-cache
```

## 🚨 Troubleshooting

### Problemas Comuns

#### Container não inicia
```bash
# Verificar logs
docker-compose -f docker-compose.prod.yml logs [nome-do-container]

# Verificar status
docker-compose -f docker-compose.prod.yml ps

# Reiniciar container
docker-compose -f docker-compose.prod.yml restart [nome-do-container]
```

#### SSL não funciona
```bash
# Verificar certificados
ls -la /opt/kontrollapro/nginx/ssl/

# Testar renovação
certbot renew --dry-run

# Verificar configuração Nginx
docker-compose -f docker-compose.prod.yml logs nginx
```

#### Banco de dados não conecta
```bash
# Verificar se MySQL está rodando
docker-compose -f docker-compose.prod.yml logs mysql

# Testar conexão
docker exec -it kontrolla-mysql-prod mysql -u root -p
```

## 📁 Estrutura de Arquivos

```
/opt/kontrollapro/
├── Backend/                 # Código do backend
├── Frontend/                # Código do frontend
├── nginx/                   # Configurações Nginx
│   ├── nginx-ssl.conf       # Configuração SSL
│   └── ssl/                 # Certificados SSL
├── mysql-init/              # Scripts de inicialização MySQL
├── backups/                 # Backups automáticos
├── docker-compose.prod.yml  # Configuração Docker
├── .env                     # Variáveis de ambiente
├── manage.sh                # Script de gerenciamento
├── backup.sh                # Script de backup
└── ssl-renew.sh             # Script de renovação SSL
```

## 🎯 Funcionalidades do Sistema

### Módulos Principais
- ✅ **Dashboard**: Métricas e KPIs
- ✅ **Produtos**: Gestão de estoque
- ✅ **Clientes**: CRM completo
- ✅ **Vendas**: PDV e gestão de vendas
- ✅ **Financeiro**: Contas a pagar/receber
- ✅ **Relatórios**: Análises detalhadas
- ✅ **Configurações**: Personalização
- ✅ **NF-e**: Emissão de notas fiscais

### Recursos Avançados
- ✅ **Multitenant**: Isolamento por empresa
- ✅ **Google OAuth**: Login social
- ✅ **Upload de Imagens**: Cloudinary
- ✅ **Email**: Notificações automáticas
- ✅ **Backup**: Automático e seguro
- ✅ **SSL**: HTTPS obrigatório
- ✅ **Responsivo**: Mobile-first

## 📞 Suporte

### Informações do Sistema
- **Diretório**: `/opt/kontrollapro`
- **Logs**: `/opt/kontrollapro/nginx/logs/`
- **Backups**: `/opt/kontrollapro/backups/`
- **SSL**: `/opt/kontrollapro/nginx/ssl/`

### Contatos
- **Email**: suporte@kontrollapro.com
- **GitHub**: https://github.com/zaleoz1/Kontrolla-SaaS-Multtenanti

## ✅ Checklist de Deploy

- [ ] Servidor configurado
- [ ] Docker e Docker Compose instalados
- [ ] Aplicação deployada
- [ ] Banco de dados funcionando
- [ ] Frontend acessível
- [ ] API respondendo
- [ ] SSL configurado
- [ ] Backup configurado
- [ ] Monitoramento ativo
- [ ] Testes realizados

---

## 🎉 Pronto para Produção!

Seu sistema KontrollaPro está configurado e pronto para uso em produção com todas as melhores práticas de segurança, performance e monitoramento implementadas.

**Acesse**: https://vps6150.panel.icontainer.run
**Gerenciar**: `/opt/kontrollapro/manage.sh`
