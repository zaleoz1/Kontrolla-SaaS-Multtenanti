#!/bin/bash

# Script para iniciar o KontrollaPro em modo desenvolvimento

echo "🚀 Iniciando KontrollaPro em modo desenvolvimento..."

# Verificar se o Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não está instalado. Por favor, instale o Docker primeiro."
    exit 1
fi

# Verificar se o Docker Compose está instalado
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose não está instalado. Por favor, instale o Docker Compose primeiro."
    exit 1
fi

# Parar containers existentes
echo "🛑 Parando containers existentes..."
docker-compose -f docker-compose.yml -f docker-compose.dev.yml down

# Construir e iniciar containers em modo desenvolvimento
echo "🔨 Construindo e iniciando containers em modo desenvolvimento..."
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build

echo ""
echo "✅ KontrollaPro em modo desenvolvimento!"
echo ""
echo "🌐 Acesse:"
echo "   Frontend: http://localhost:5173 (com hot reload)"
echo "   Backend:  http://localhost:3000"
echo "   MySQL:    localhost:3306"
echo ""
echo "📝 Para ver logs:"
echo "   docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs -f"
echo ""
echo "🛑 Para parar:"
echo "   Ctrl+C ou docker-compose -f docker-compose.yml -f docker-compose.dev.yml down"
