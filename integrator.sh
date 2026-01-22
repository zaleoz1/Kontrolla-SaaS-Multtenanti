#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
#                    KONTROLLAPRO - PAINEL DE GERENCIAMENTO
# ═══════════════════════════════════════════════════════════════════════════════
# Script de gerenciamento do servidor - Linux/Unix Bash
# ═══════════════════════════════════════════════════════════════════════════════

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
GRAY='\033[0;90m'
NC='\033[0m' # No Color

# Diretório do script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

show_header() {
    clear
    echo ""
    echo -e "  ${MAGENTA}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "  ${MAGENTA}║                                                                ║${NC}"
    echo -e "  ${MAGENTA}║${CYAN}          🚀 KONTROLLAPRO - PAINEL INTEGRATOR 🚀             ${MAGENTA}║${NC}"
    echo -e "  ${MAGENTA}║                                                                ║${NC}"
    echo -e "  ${MAGENTA}║${YELLOW}           Sistema de Gerenciamento do Servidor              ${MAGENTA}║${NC}"
    echo -e "  ${MAGENTA}║${GRAY}                      KontrollaPro Team                        ${MAGENTA}║${NC}"
    echo -e "  ${MAGENTA}║                                                                ║${NC}"
    echo -e "  ${MAGENTA}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

show_menu() {
    echo -e "  ${GRAY}┌────────────────────────────────────────────────────────────────┐${NC}"
    echo -e "  ${GRAY}│                    OPÇÕES PRINCIPAIS                           │${NC}"
    echo -e "  ${GRAY}├────────────────────────────────────────────────────────────────┤${NC}"
    echo ""
    echo -e "    ${GRAY}[${GREEN} 1${GRAY}]${NC}  🚀  ${WHITE}Deploy Completo${NC}"
    echo -e "              ${GRAY}Build e inicia todos os containers${NC}"
    echo ""
    echo -e "    ${GRAY}[${GREEN} 2${GRAY}]${NC}  📦  ${WHITE}Build do Projeto Completo${NC}"
    echo -e "              ${GRAY}Build do Frontend + Backend (sem iniciar)${NC}"
    echo ""
    echo -e "    ${GRAY}[${GREEN} 3${GRAY}]${NC}  🎨  ${WHITE}Build do Frontend${NC}"
    echo -e "              ${GRAY}Apenas build do React/Vite${NC}"
    echo ""
    echo -e "    ${GRAY}[${GREEN} 4${GRAY}]${NC}  ⚙️   ${WHITE}Build do Backend${NC}"
    echo -e "              ${GRAY}Apenas build do Node.js/Express${NC}"
    echo ""
    echo -e "    ${GRAY}[${RED} 5${GRAY}]${NC}  ⏸️   ${WHITE}Pausar Sistema${NC}"
    echo -e "              ${GRAY}Para todos os containers (docker-compose down)${NC}"
    echo ""
    echo -e "  ${GRAY}├────────────────────────────────────────────────────────────────┤${NC}"
    echo -e "  ${GRAY}│                    OPÇÕES EXTRAS                               │${NC}"
    echo -e "  ${GRAY}├────────────────────────────────────────────────────────────────┤${NC}"
    echo ""
    echo -e "    ${GRAY}[${CYAN} 6${GRAY}]${NC}  📊  ${WHITE}Status dos Containers${NC}"
    echo -e "    ${GRAY}[${CYAN} 7${GRAY}]${NC}  📜  ${WHITE}Ver Logs (tempo real)${NC}"
    echo -e "    ${GRAY}[${CYAN} 8${GRAY}]${NC}  🔄  ${WHITE}Reiniciar Sistema${NC}"
    echo -e "    ${GRAY}[${CYAN} 9${GRAY}]${NC}  🗃️   ${WHITE}Executar Migrations do Banco${NC}"
    echo ""
    echo -e "  ${GRAY}├────────────────────────────────────────────────────────────────┤${NC}"
    echo -e "  ${GRAY}│                         GIT                                    │${NC}"
    echo -e "  ${GRAY}├────────────────────────────────────────────────────────────────┤${NC}"
    echo ""
    echo -e "    ${GRAY}[${GREEN}10${GRAY}]${NC}  📥  ${WHITE}Git Pull - Atualizar Código${NC}"
    echo -e "              ${GRAY}Baixa as últimas alterações do repositório${NC}"
    echo ""
    echo -e "  ${GRAY}├────────────────────────────────────────────────────────────────┤${NC}"
    echo ""
    echo -e "    ${GRAY}[${YELLOW} 0${GRAY}]${NC}  ❌  ${WHITE}Sair${NC}"
    echo ""
    echo -e "  ${GRAY}└────────────────────────────────────────────────────────────────┘${NC}"
    echo ""
}

show_loading() {
    echo ""
    echo -e "  ${YELLOW}⏳${NC} ${CYAN}$1${NC}"
    echo ""
}

show_success() {
    echo ""
    echo -e "  ${GREEN}✅ $1${NC}"
    echo ""
}

show_error() {
    echo ""
    echo -e "  ${RED}❌ $1${NC}"
    echo ""
}

wait_for_key() {
    echo ""
    echo -e "  ${GRAY}Pressione ENTER para continuar...${NC}"
    read -r
}

deploy_complete() {
    show_loading "Iniciando Deploy Completo..."
    echo -e "  ${GRAY}═══════════════════════════════════════════════════════════════${NC}"
    docker-compose -f docker-compose.prod.yml down 2>/dev/null
    
    # Limpar cache do Docker
    echo ""
    echo -e "  ${YELLOW}🧹 Limpando cache do Docker...${NC}"
    docker builder prune -f 2>/dev/null
    
    # Remover imagens antigas do projeto
    echo -e "  ${YELLOW}🗑️  Removendo imagens antigas...${NC}"
    docker rmi kontrolla-backend:latest kontrolla-frontend:latest 2>/dev/null
    
    # Reconstruir e iniciar
    echo -e "  ${YELLOW}🔨 Reconstruindo imagens...${NC}"
    docker-compose -f docker-compose.prod.yml build --no-cache --pull
    if [ $? -eq 0 ]; then
        docker-compose -f docker-compose.prod.yml up -d
        if [ $? -eq 0 ]; then
            show_success "Deploy realizado com sucesso!"
            echo ""
            echo -e "  ${CYAN}🌐 Frontend: ${WHITE}http://localhost:80${NC}"
            echo -e "  ${CYAN}🔧 Backend:  ${WHITE}http://localhost:3000${NC}"
            echo -e "  ${CYAN}🗄️  Database: ${WHITE}localhost:3307${NC}"
        else
            show_error "Erro ao iniciar os containers!"
        fi
    else
        show_error "Erro durante o build!"
    fi
    wait_for_key
}

build_project() {
    show_loading "Iniciando Build do Projeto Completo..."
    echo -e "  ${GRAY}═══════════════════════════════════════════════════════════════${NC}"
    
    # Build do Frontend
    echo -e "  ${YELLOW}🎨 Build do Frontend...${NC}"
    cd Frontend
    npm run build
    if [ $? -ne 0 ]; then
        cd ..
        show_error "Erro durante o build do Frontend!"
        wait_for_key
        return
    fi
    cd ..
    
    # Build do Backend
    echo -e "  ${YELLOW}⚙️  Build do Backend...${NC}"
    cd Backend
    npm install --production
    if [ $? -ne 0 ]; then
        cd ..
        show_error "Erro durante o build do Backend!"
        wait_for_key
        return
    fi
    cd ..
    
    show_success "Build do projeto completo realizado com sucesso!"
    wait_for_key
}

build_frontend() {
    show_loading "Iniciando Build do Frontend..."
    echo -e "  ${GRAY}═══════════════════════════════════════════════════════════════${NC}"
    cd Frontend
    npm run build
    if [ $? -eq 0 ]; then
        show_success "Build do Frontend realizado com sucesso!"
    else
        show_error "Erro durante o build do Frontend!"
    fi
    cd ..
    wait_for_key
}

build_backend() {
    show_loading "Iniciando Build do Backend..."
    echo -e "  ${GRAY}═══════════════════════════════════════════════════════════════${NC}"
    cd Backend
    npm install --production
    if [ $? -eq 0 ]; then
        show_success "Build do Backend realizado com sucesso!"
    else
        show_error "Erro durante o build do Backend!"
    fi
    cd ..
    wait_for_key
}

stop_system() {
    show_loading "Pausando o Sistema..."
    echo -e "  ${GRAY}═══════════════════════════════════════════════════════════════${NC}"
    docker-compose -f docker-compose.prod.yml down
    if [ $? -eq 0 ]; then
        show_success "Sistema pausado com sucesso!"
    else
        show_error "Erro ao pausar o sistema!"
    fi
    wait_for_key
}

show_status() {
    show_loading "Verificando Status dos Containers..."
    echo -e "  ${GRAY}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
    docker-compose -f docker-compose.prod.yml ps
    echo ""
    wait_for_key
}

show_logs() {
    show_loading "Exibindo Logs (Ctrl+C para sair)..."
    echo -e "  ${GRAY}═══════════════════════════════════════════════════════════════${NC}"
    docker-compose -f docker-compose.prod.yml logs -f
}

restart_system() {
    show_loading "Reiniciando o Sistema..."
    echo -e "  ${GRAY}═══════════════════════════════════════════════════════════════${NC}"
    docker-compose -f docker-compose.prod.yml restart
    if [ $? -eq 0 ]; then
        show_success "Sistema reiniciado com sucesso!"
    else
        show_error "Erro ao reiniciar o sistema!"
    fi
    wait_for_key
}

run_migrations() {
    show_loading "Executando Migrations do Banco de Dados..."
    echo -e "  ${GRAY}═══════════════════════════════════════════════════════════════${NC}"
    docker-compose -f docker-compose.prod.yml exec backend node src/database/migrate.js
    if [ $? -eq 0 ]; then
        show_success "Migrations executadas com sucesso!"
    else
        show_error "Erro ao executar migrations!"
    fi
    wait_for_key
}

git_pull() {
    show_loading "Atualizando código do repositório (git pull)..."
    echo -e "  ${GRAY}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
    
    # Verificar se é um repositório git
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        show_error "Este diretório não é um repositório Git!"
        wait_for_key
        return
    fi
    
    # Obter branch atual
    CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "master")
    echo -e "  ${CYAN}📍 Branch atual: ${WHITE}${CURRENT_BRANCH}${NC}"
    
    # Verificar se há remote configurado
    REMOTE=$(git remote | head -n 1)
    if [ -z "$REMOTE" ]; then
        REMOTE="origin"
    fi
    
    echo ""
    echo -e "  ${CYAN}🔗 Remote: ${WHITE}${REMOTE}${NC}"
    echo ""
    
    # Tentar fazer pull
    # Primeiro tenta pull normal
    if git pull 2>/dev/null; then
        show_success "Código atualizado com sucesso!"
        echo ""
        echo -e "  ${YELLOW}💡 Dica: Execute o Deploy (opção 1) para aplicar as mudanças${NC}"
    else
        # Se falhar, tenta com origin/branch
        echo -e "  ${YELLOW}⚠️  Tentando pull com ${REMOTE}/${CURRENT_BRANCH}...${NC}"
        if git pull "${REMOTE}" "${CURRENT_BRANCH}" 2>/dev/null; then
            show_success "Código atualizado com sucesso!"
            echo ""
            echo -e "  ${YELLOW}💡 Dica: Execute o Deploy (opção 1) para aplicar as mudanças${NC}"
        else
            # Se ainda falhar, tenta configurar upstream e fazer pull
            echo -e "  ${YELLOW}⚠️  Configurando upstream e tentando novamente...${NC}"
            git branch --set-upstream-to="${REMOTE}/${CURRENT_BRANCH}" "${CURRENT_BRANCH}" 2>/dev/null
            if git pull 2>/dev/null; then
                show_success "Código atualizado com sucesso!"
                echo ""
                echo -e "  ${YELLOW}💡 Dica: Execute o Deploy (opção 1) para aplicar as mudanças${NC}"
            else
                show_error "Erro ao atualizar o código!"
                echo ""
                echo -e "  ${YELLOW}💡 Dica: Configure o remote manualmente com:${NC}"
                echo -e "  ${GRAY}     git remote add origin <url-do-repositorio>${NC}"
                echo -e "  ${GRAY}     git branch --set-upstream-to=origin/${CURRENT_BRANCH} ${CURRENT_BRANCH}${NC}"
            fi
        fi
    fi
    wait_for_key
}

# Loop Principal
while true; do
    show_header
    show_menu
    
    echo -ne "  ${YELLOW}Digite a opção desejada: ${NC}"
    read -r choice
    
    case $choice in
        1) deploy_complete ;;
        2) build_project ;;
        3) build_frontend ;;
        4) build_backend ;;
        5) stop_system ;;
        6) show_status ;;
        7) show_logs ;;
        8) restart_system ;;
        9) run_migrations ;;
        10) git_pull ;;
        0)
            echo ""
            echo -e "  ${CYAN}👋 Até logo!${NC}"
            echo ""
            exit 0
            ;;
        *)
            show_error "Opção inválida! Tente novamente."
            sleep 1
            ;;
    esac
done
