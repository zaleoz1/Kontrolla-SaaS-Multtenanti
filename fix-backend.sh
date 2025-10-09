#!/bin/bash

echo "🔧 Aplicando correções no backend..."

# Navegar para o diretório do projeto
cd /opt/kontrollapro || { echo "Erro: Não foi possível navegar para /opt/kontrollapro"; exit 1; }

# 1. Parar containers existentes
echo "Parando containers existentes..."
docker-compose -f docker-compose.prod.yml down || { echo "Erro ao parar containers"; exit 1; }

# 2. Limpar containers e imagens antigas
echo "Limpando containers e imagens antigas..."
docker container prune -f
docker image prune -f

# 3. Garantir que as variáveis de ambiente estejam corretas
echo "Copiando env.production para .env..."
cp env.production .env || { echo "Erro ao copiar env.production para .env"; exit 1; }

# 4. Rebuild do backend com as novas configurações
echo "Reconstruindo imagem do backend com --no-cache..."
docker-compose -f docker-compose.prod.yml build --no-cache backend || { echo "Erro ao reconstruir backend"; exit 1; }

# 5. Iniciar containers novamente
echo "Iniciando containers novamente..."
docker-compose -f docker-compose.prod.yml up -d || { echo "Erro ao iniciar containers"; exit 1; }

# 6. Aguardar um pouco para os containers iniciarem
echo "Aguardando containers iniciarem..."
sleep 30

echo "✅ Correções do backend aplicadas com sucesso!"

echo "Verificando status dos containers..."
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo "Testando o backend..."
curl -f http://vps6150.panel.icontainer.run/api/health || echo "Backend ainda não está respondendo"

echo "Verificando logs do backend..."
docker-compose -f docker-compose.prod.yml logs backend --tail=50
