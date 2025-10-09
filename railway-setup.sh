#!/bin/bash

# ===========================================
# Script de Setup Automático para Railway
# KontrollaPro SaaS
# ===========================================

echo "🚀 Iniciando setup do KontrollaPro no Railway..."

# Verificar se Railway CLI está instalado
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI não encontrado. Instalando..."
    npm install -g @railway/cli
fi

# Verificar se está logado no Railway
if ! railway whoami &> /dev/null; then
    echo "🔐 Faça login no Railway:"
    railway login
fi

echo "📦 Instalando dependências..."
npm run install:all

echo "🗄️ Configurando banco de dados..."
echo "⚠️  Certifique-se de ter um banco MySQL configurado no Railway"
echo "📝 Variáveis necessárias:"
echo "   - DB_HOST"
echo "   - DB_PORT" 
echo "   - DB_USER"
echo "   - DB_PASSWORD"
echo "   - DB_NAME"

echo "🔧 Executando migrações..."
railway run npm run migrate

echo "🌱 Executando seed (dados de exemplo)..."
railway run npm run seed

echo "🏗️ Fazendo build do frontend..."
cd Frontend && npm run build && cd ..

echo "🚀 Deploy realizado com sucesso!"
echo "🌐 Acesse sua aplicação no Railway Dashboard"
echo "📊 Health check: https://seu-dominio.railway.app/api/health"

echo "✅ Setup concluído!"
