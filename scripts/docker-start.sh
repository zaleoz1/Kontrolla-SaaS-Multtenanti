#!/bin/bash

# Script para iniciar o KontrollaPro com Docker

echo "🚀 Iniciando KontrollaPro com Docker..."

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

# Verificar se o arquivo .env existe
if [ ! -f "docker.env.example" ]; then
    echo "❌ Arquivo docker.env.example não encontrado."
    exit 1
fi

# Copiar arquivo de exemplo se não existir
if [ ! -f ".env" ]; then
    echo "📋 Copiando arquivo de configuração..."
    cp docker.env.example .env
    echo "✅ Arquivo .env criado. Configure as variáveis conforme necessário."
fi

# Parar containers existentes
echo "🛑 Parando containers existentes..."
docker-compose down

# Construir e iniciar containers
echo "🔨 Construindo e iniciando containers..."
docker-compose up --build -d

# Aguardar serviços ficarem prontos
echo "⏳ Aguardando serviços ficarem prontos..."
sleep 30

# Verificar status dos serviços
echo "📊 Status dos serviços:"
docker-compose ps

echo ""
echo "✅ KontrollaPro iniciado com sucesso!"
echo ""
echo "🌐 Acesse:"
echo "   Frontend: http://localhost"
echo "   Backend:  http://localhost:3000"
echo "   MySQL:    localhost:3306"
echo ""
echo "📝 Para ver logs:"
echo "   docker-compose logs -f"
echo ""
echo "🛑 Para parar:"
echo "   docker-compose down"
