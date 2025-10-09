#!/bin/bash

echo "🚀 Aplicando correções completas no sistema..."

# Navegar para o diretório do projeto
cd /opt/kontrollapro || { echo "Erro: Não foi possível navegar para /opt/kontrollapro"; exit 1; }

# 1. Parar todos os containers
echo "Parando todos os containers..."
docker-compose -f docker-compose.prod.yml down

# 2. Limpar containers e imagens antigas
echo "Limpando containers e imagens antigas..."
docker container prune -f
docker image prune -f

# 3. Garantir que as variáveis de ambiente estejam corretas
echo "Configurando variáveis de ambiente..."
cp env.production .env

# 4. Verificar se o arquivo .env está correto
echo "Verificando arquivo .env..."
if [ ! -f .env ]; then
    echo "❌ Arquivo .env não encontrado!"
    exit 1
fi

# 5. Rebuild de todos os containers
echo "Reconstruindo todos os containers..."
docker-compose -f docker-compose.prod.yml build --no-cache

# 6. Iniciar containers em ordem
echo "Iniciando containers..."
docker-compose -f docker-compose.prod.yml up -d

# 7. Aguardar containers iniciarem
echo "Aguardando containers iniciarem..."
sleep 60

# 8. Verificar status
echo "Verificando status dos containers..."
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# 9. Testar conectividade
echo "Testando conectividade..."

# Testar backend diretamente
echo "Testando backend na porta 3000..."
curl -f http://localhost:3000/health && echo "✅ Backend OK" || echo "❌ Backend não responde"

# Testar nginx
echo "Testando nginx na porta 80..."
curl -f http://localhost/health && echo "✅ Nginx OK" || echo "❌ Nginx não responde"

# Testar API
echo "Testando API..."
curl -f http://localhost/api/health && echo "✅ API OK" || echo "❌ API não responde"

# Testar domínio externo
echo "Testando domínio externo..."
curl -f http://vps6150.panel.icontainer.run/api/health && echo "✅ Domínio externo OK" || echo "❌ Domínio externo não responde"

# 10. Mostrar logs se houver problemas
echo "Verificando logs do backend..."
docker-compose -f docker-compose.prod.yml logs backend --tail=20

echo "Verificando logs do nginx..."
docker-compose -f docker-compose.prod.yml logs nginx --tail=20

echo "✅ Correções aplicadas com sucesso!"
echo "🌐 Acesse: http://vps6150.panel.icontainer.run"
