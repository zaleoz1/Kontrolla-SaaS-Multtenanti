#!/bin/bash

# =========================================================================
# SCRIPT DE DEPLOY KONTROLLAPRO VPS
# =========================================================================

set -e

echo "🚀 Iniciando deploy KontrollaPro VPS..."

# 1. Parar containers existentes
echo "⏹️ Parando containers..."
docker-compose -f docker-compose.vps.yml down 2>/dev/null || true

# 2. Limpar imagens antigas
echo "🧹 Limpando imagens antigas..."
docker rmi kontrollapro-frontend kontrollapro-backend 2>/dev/null || true

# 3. Verificar se .env.production existe
if [ ! -f ".env.production" ]; then
    echo "❌ Arquivo .env.production não encontrado!"
    exit 1
fi

# 4. Verificar variáveis essenciais
echo "📋 Verificando variáveis essenciais..."
if ! grep -q "VITE_GOOGLE_CLIENT_ID" .env.production; then
    echo "❌ Variáveis VITE não encontradas no .env.production"
    exit 1
fi

# 5. Build e start
echo "🔨 Fazendo build dos containers..."
docker-compose -f docker-compose.vps.yml up --build -d

# 6. Aguardar inicialização
echo "⏳ Aguardando containers ficarem healthy..."
sleep 60

# 7. Verificar status
echo "📊 Status dos containers:"
docker ps --format "table {{.Names}}\t{{.Status}}"

# 8. Testar sistema
echo "🧪 Testando sistema..."
if curl -f -s http://localhost >/dev/null; then
    echo "✅ Sistema funcionando!"
    echo "🌐 Acesse: http://pvd.kontrollapro.com.br"
else
    echo "❌ Sistema não respondendo"
    echo "📋 Logs dos containers:"
    docker-compose -f docker-compose.vps.yml logs --tail=10
fi

echo "🎉 Deploy finalizado!"