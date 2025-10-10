#!/bin/bash

# =========================================================================
# KONTROLLAPRO - SCRIPT DE DEBUG PARA PRODUÇÃO
# =========================================================================

echo "🔍 Debug KontrollaPro - Produção VPS"
echo "===================================="
echo ""

# Configurações
VPS_IP="207.58.174.116"
DOMAIN="vps6150.panel.icontainer.run"

echo "📋 INFORMAÇÕES DO SERVIDOR"
echo "========================="
echo "🌐 Domínio: $DOMAIN"
echo "🔗 IP: $VPS_IP"
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Função para testar conectividade
test_connectivity() {
    echo "🌐 TESTE DE CONECTIVIDADE"
    echo "========================"
    
    echo "📡 Ping para o servidor..."
    if ping -c 4 $VPS_IP > /dev/null 2>&1; then
        echo -e "✅ ${GREEN}Ping OK${NC}"
    else
        echo -e "❌ ${RED}Ping FALHOU${NC}"
    fi
    
    echo ""
    echo "🔗 Teste HTTP..."
    curl_response=$(curl -s -w "%{http_code}" "http://$DOMAIN" -o /dev/null)
    if [ "$curl_response" = "200" ] || [ "$curl_response" = "301" ] || [ "$curl_response" = "302" ]; then
        echo -e "✅ ${GREEN}HTTP OK${NC} - Status: $curl_response"
    else
        echo -e "❌ ${RED}HTTP FALHOU${NC} - Status: $curl_response"
    fi
    echo ""
}

# Função para testar API
test_api_routes() {
    echo "🔧 TESTE DE ROTAS DA API"
    echo "======================="
    
    routes=(
        "/"
        "/health"
        "/api/auth/send-verification-code"
        "/api/dashboard"
        "/api/produtos"
        "/api/clientes"
    )
    
    for route in "${routes[@]}"; do
        echo "🔍 Testando: $route"
        response=$(curl -s -w "%{http_code}" -X GET "http://$DOMAIN$route" -o /tmp/debug_response 2>/dev/null)
        
        if [ "$response" = "200" ] || [ "$response" = "401" ] || [ "$response" = "404" ]; then
            echo -e "   ✅ ${GREEN}OK${NC} - Status: $response"
        else
            echo -e "   ❌ ${RED}ERRO${NC} - Status: $response"
            if [ -f /tmp/debug_response ]; then
                echo "   📄 Resposta:"
                head -3 /tmp/debug_response | sed 's/^/      /'
            fi
        fi
        echo ""
    done
}

# Função para testar Docker containers
test_docker_containers() {
    echo "🐳 TESTE DOS CONTAINERS DOCKER"
    echo "=============================="
    
    echo "📋 Containers em execução:"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(kontrolla|NAMES)"
    echo ""
    
    echo "🔍 Logs recentes do backend:"
    echo "------------------------"
    docker logs kontrolla-backend --tail=10 2>/dev/null || echo "Container backend não encontrado"
    echo ""
    
    echo "🔍 Logs recentes do nginx:"
    echo "----------------------"
    docker logs kontrolla-nginx --tail=10 2>/dev/null || echo "Container nginx não encontrado"
    echo ""
}

# Função para testar configurações
test_configurations() {
    echo "⚙️ TESTE DE CONFIGURAÇÕES"
    echo "========================"
    
    echo "📄 Verificando arquivos de configuração..."
    
    # Verificar nginx
    if [ -f "./nginx/conf.d/kontrollapro.conf" ]; then
        echo -e "✅ ${GREEN}nginx config OK${NC}"
    else
        echo -e "❌ ${RED}nginx config NÃO ENCONTRADO${NC}"
    fi
    
    # Verificar .env.production
    if [ -f "./.env.production" ]; then
        echo -e "✅ ${GREEN}.env.production OK${NC}"
        echo "📋 Variáveis importantes:"
        grep -E "(API_URL|DOMAIN|MYSQL)" .env.production | sed 's/^/   /'
    else
        echo -e "❌ ${RED}.env.production NÃO ENCONTRADO${NC}"
    fi
    
    echo ""
}

# Função para sugestões de correção
show_suggestions() {
    echo "💡 SUGESTÕES DE CORREÇÃO"
    echo "======================="
    echo ""
    echo "Se houver problemas com as rotas da API:"
    echo ""
    echo "1. 🔄 Reiniciar containers:"
    echo "   docker-compose restart"
    echo ""
    echo "2. 🔍 Verificar logs em tempo real:"
    echo "   docker-compose logs -f backend"
    echo "   docker-compose logs -f nginx"
    echo ""
    echo "3. ⚙️ Verificar configuração do nginx:"
    echo "   docker exec kontrolla-nginx nginx -t"
    echo ""
    echo "4. 🌐 Testar rota específica:"
    echo "   curl -v http://$DOMAIN/api/auth/send-verification-code"
    echo ""
    echo "5. 🔧 Recriar containers:"
    echo "   docker-compose down && docker-compose up -d --build"
    echo ""
}

# Executar todos os testes
test_connectivity
test_api_routes
test_docker_containers
test_configurations
show_suggestions

echo "🏁 Debug concluído!"
echo "=================="