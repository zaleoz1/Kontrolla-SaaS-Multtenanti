# 🚀 Deploy KontrollaPro no Integrator Host

## 📋 Resumo do Projeto

O **KontrollaPro** é um sistema SaaS multitenanti completo para gestão de vendas e estoque, desenvolvido com:

- **Backend**: Node.js + Express + MySQL
- **Frontend**: React + TypeScript + Vite
- **Infraestrutura**: Docker + Nginx + Redis
- **Autenticação**: JWT + Google OAuth
- **Upload**: Cloudinary
- **Email**: Nodemailer

## 🎯 Dados do Servidor

```
IP: 207.58.174.116
Usuário: root
Senha: ny59QZejCNOX7HZ4
Porta: 22
Domínio: vps6150.panel.icontainer.run
```

## ⚡ Deploy Rápido (Recomendado)

### 1. Conectar ao Servidor
```bash
ssh root@207.58.174.116
```

### 2. Executar Deploy Automático
```bash
# Baixar e executar script de deploy específico para Integrator Host
wget https://raw.githubusercontent.com/zaleoz1/Kontrolla-SaaS-Multtenanti/main/deploy-integrator.sh
chmod +x deploy-integrator.sh
./deploy-integrator.sh
```

### 3. Acessar a Aplicação
```
https://vps6150.panel.icontainer.run
```

## 🔧 Deploy Completo (Com SSL)

### 1. Configurar Servidor
```bash
# Baixar e executar configuração do servidor
wget https://raw.githubusercontent.com/zaleoz1/Kontrolla-SaaS-Multtenanti/main/setup-server.sh
chmod +x setup-server.sh
./setup-server.sh
```

### 2. Deploy da Aplicação
```bash
# Baixar e executar deploy completo
wget https://raw.githubusercontent.com/zaleoz1/Kontrolla-SaaS-Multtenanti/main/deploy.sh
chmod +x deploy.sh
./deploy.sh
```

### 3. SSL Automático
O SSL é configurado automaticamente com Let's Encrypt para o domínio `vps6150.panel.icontainer.run`

## 🐳 Estrutura dos Containers

| Container | Porta | Descrição |
|-----------|-------|-----------|
| `kontrolla-mysql-prod` | 3306 | Banco de dados MySQL |
| `kontrolla-backend-prod` | 3000 | API Node.js |
| `kontrolla-frontend-prod` | 80/443 | Interface React |
| `kontrolla-redis-prod` | 6379 | Cache Redis |
| `kontrolla-nginx-prod` | 80/443 | Proxy reverso |

## ⚙️ Configurações Principais

### Variáveis de Ambiente
```bash
# Banco de dados
MYSQL_ROOT_PASSWORD=KontrollaPro2024!Secure
MYSQL_DATABASE=kontrollapro
MYSQL_USER=kontrolla_user
MYSQL_PASSWORD=KontrollaUser2024!Secure

# JWT
JWT_SECRET=KontrollaPro_JWT_Secret_2024_Very_Secure_Key_For_Production_Environment

# Email (Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=kontrollapro@gmail.com
EMAIL_PASS=kbuz yhdu hdku htaq

# Cloudinary
CLOUDINARY_CLOUD_NAME=dko7s3u3j
CLOUDINARY_API_KEY=754366869343179
CLOUDINARY_API_SECRET=1uMokyb2NhuzefxNt1ocJm3yfAU

# Google OAuth
GOOGLE_CLIENT_ID=505635879481-974u3cn4qac3eeti5i9gjsreo3o315dp.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
```

## 🛠️ Comandos de Gerenciamento

### Script de Gerenciamento
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
```

### Comandos Docker
```bash
# Ver status dos containers
docker-compose -f docker-compose.prod.yml ps

# Ver logs em tempo real
docker-compose -f docker-compose.prod.yml logs -f

# Reiniciar um serviço específico
docker-compose -f docker-compose.prod.yml restart backend

# Parar todos os serviços
docker-compose -f docker-compose.prod.yml down

# Iniciar todos os serviços
docker-compose -f docker-compose.prod.yml up -d
```

## 🔒 Segurança Configurada

- ✅ Firewall (UFW) configurado
- ✅ Fail2ban para proteção SSH
- ✅ SSL/HTTPS com Let's Encrypt
- ✅ Headers de segurança
- ✅ Rate limiting
- ✅ Usuários não-root nos containers

## 📊 Monitoramento

### Scripts Disponíveis
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

### Logs
- **Nginx**: `/opt/kontrollapro/nginx/logs/`
- **Backend**: `docker-compose -f docker-compose.prod.yml logs backend`
- **Frontend**: `docker-compose -f docker-compose.prod.yml logs frontend`
- **MySQL**: `docker-compose -f docker-compose.prod.yml logs mysql`

## 💾 Backup Automático

- ✅ Backup diário do banco de dados
- ✅ Backup dos arquivos de upload
- ✅ Retenção de 30 dias
- ✅ Limpeza automática de logs antigos

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

#### Banco de dados não conecta
```bash
# Verificar se MySQL está rodando
docker-compose -f docker-compose.prod.yml logs mysql

# Testar conexão
docker exec -it kontrolla-mysql-prod mysql -u root -p
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

## 📁 Estrutura de Arquivos

```
/opt/kontrollapro/
├── Backend/                 # Código do backend
├── Frontend/                # Código do frontend
├── nginx/                   # Configurações Nginx
│   ├── nginx.conf
│   ├── nginx-ssl.conf
│   └── ssl/                 # Certificados SSL
├── mysql-init/              # Scripts de inicialização MySQL
├── backups/                 # Backups automáticos
├── docker-compose.prod.yml  # Configuração Docker
├── .env                     # Variáveis de ambiente
├── manage.sh                # Script de gerenciamento
├── ssl-setup.sh             # Script de configuração SSL
└── backup.sh                # Script de backup
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

## ✅ Checklist de Deploy

- [ ] Servidor configurado
- [ ] Docker e Docker Compose instalados
- [ ] Aplicação deployada
- [ ] Banco de dados funcionando
- [ ] Frontend acessível
- [ ] API respondendo
- [ ] SSL configurado (se aplicável)
- [ ] Backup configurado
- [ ] Monitoramento ativo
- [ ] Testes realizados

## 📞 Suporte

### Informações do Sistema
- **Diretório**: `/opt/kontrollapro`
- **Logs**: `/opt/kontrollapro/nginx/logs/`
- **Backups**: `/opt/kontrollapro/backups/`
- **SSL**: `/opt/kontrollapro/nginx/ssl/`

### Contatos
- **Email**: suporte@kontrollapro.com
- **GitHub**: https://github.com/zaleoz1/Kontrolla-SaaS-Multtenanti

---

## 🎉 Pronto para Produção!

Seu sistema KontrollaPro está configurado e pronto para uso em produção com todas as melhores práticas de segurança, performance e monitoramento implementadas.

**Acesse**: https://vps6150.panel.icontainer.run
**Gerenciar**: `/opt/kontrollapro/manage.sh`
