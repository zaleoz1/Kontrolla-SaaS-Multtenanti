#!/bin/bash

# =========================================================================
# KONTROLLAPRO - PAINEL SSH VPS
# =========================================================================
# Use este script NO VPS para automatizar processos por comandos.
#
# Como usar:
#   1. No VPS, vá ao diretório do projeto: cd /opt/kontrollapro
#   2. Execute: ./scripts/vps-panel.sh
#   3. Ou execute uma opção direto: ./scripts/vps-panel.sh 1   (só git pull)
#
# Se o projeto estiver em outro path:
#   KONTROLLA_PROJECT_DIR=/caminho/do/projeto ./scripts/vps-panel.sh
#
# Opções: 1=git pull, 2=deploy, 3=git pull+deploy, 4=logs, 5=status,
#         6=backup, 7=restart todos, 8=restart um, 9=parar, 10=iniciar,
#         11=health, 12=shell, 0=sair

set -e

# =====================================================
# CONFIGURAÇÕES (ajuste se seu projeto estiver em outro path)
# =====================================================
PROJECT_DIR="${KONTROLLA_PROJECT_DIR:-/opt/kontrollapro}"
COMPOSE_FILE="docker-compose.prod.yml"

# Cores e estilos
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
WHITE='\033[1;37m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'

# Tema: destaque (cyan), sucesso (verde), aviso (amarelo), erro (vermelho)
ACCENT="${CYAN}"

# =====================================================
# FUNÇÕES AUXILIARES
# =====================================================
log()  { echo -e "${GREEN}▶${NC} ${DIM}[$(date +'%H:%M:%S')]${NC} $1"; }
warn() { echo -e "${YELLOW}⚠${NC} ${DIM}[$(date +'%H:%M:%S')]${NC} $1"; }
err()  { echo -e "${RED}✗${NC} ${DIM}[$(date +'%H:%M:%S')]${NC} $1"; }

cd_project() {
    if [ ! -d "$PROJECT_DIR" ]; then
        err "Diretório do projeto não encontrado: $PROJECT_DIR"
        err "Defina KONTROLLA_PROJECT_DIR ou edite PROJECT_DIR no script."
        exit 1
    fi
    cd "$PROJECT_DIR" || exit 1
}

run_compose() {
    cd_project
    docker compose -f "$COMPOSE_FILE" "$@"
}

# =====================================================
# AÇÕES DO MENU
# =====================================================
action_git_pull() {
    log "📥 Git pull..."
    cd_project
    git pull origin main || git pull origin master || git pull
    log "✅ Git pull concluído."
}

action_deploy() {
    log "🚀 Iniciando deploy..."
    cd_project
    log "📦 Instalando dependências do frontend e build..."
    (cd Frontend && npm ci && npm run build -- --mode production)
    log "🐳 Build e subida dos containers..."
    docker compose -f "$COMPOSE_FILE" build --no-cache
    docker compose -f "$COMPOSE_FILE" up -d
    log "✅ Deploy concluído."
    run_compose ps
}

action_logs() {
    echo ""
    echo -e "  ${BOLD}${ACCENT}┌─────────────────────────────────────────┐${NC}"
    echo -e "  ${BOLD}${ACCENT}│${NC}  ${WHITE}Logs de qual serviço?${NC}                    ${BOLD}${ACCENT}│${NC}"
    echo -e "  ${BOLD}${ACCENT}├─────────────────────────────────────────┤${NC}"
    echo -e "  ${BOLD}${ACCENT}│${NC}  ${GREEN}1)${NC} backend    ${GREEN}2)${NC} nginx    ${GREEN}3)${NC} mysql    ${GREEN}4)${NC} redis  ${BOLD}${ACCENT}│${NC}"
    echo -e "  ${BOLD}${ACCENT}│${NC}  ${GREEN}5)${NC} todos      ${GREEN}6)${NC} backup   ${DIM}0) Voltar${NC}         ${BOLD}${ACCENT}│${NC}"
    echo -e "  ${BOLD}${ACCENT}└─────────────────────────────────────────┘${NC}"
    echo ""
    echo -en "  ${ACCENT}Opção:${NC} "
    read -r opt
    cd_project
    case "$opt" in
        1) docker compose -f "$COMPOSE_FILE" logs -f --tail=200 backend ;;
        2) docker compose -f "$COMPOSE_FILE" logs -f --tail=200 nginx ;;
        3) docker compose -f "$COMPOSE_FILE" logs -f --tail=200 mysql ;;
        4) docker compose -f "$COMPOSE_FILE" logs -f --tail=200 redis ;;
        5) docker compose -f "$COMPOSE_FILE" logs -f --tail=100 ;;
        6) docker compose -f "$COMPOSE_FILE" logs -f --tail=200 backup ;;
        0) ;;
        *) warn "Opção inválida." ;;
    esac
}

action_status() {
    log "📊 Status dos containers..."
    run_compose ps
    echo ""
    log "💾 Uso de disco (volumes):"
    docker system df -v 2>/dev/null | head -30 || true
}

action_backup() {
    log "💾 Executando backup manual (via container backup)..."
    cd_project
    if docker compose -f "$COMPOSE_FILE" run --rm backup /backup.sh; then
        log "✅ Backup concluído. Arquivos em ./backups/"
    else
        warn "Falha no backup. Verifique .env (MYSQL_*, BACKUP_*)."
    fi
}

action_restart() {
    log "🔄 Reiniciando todos os serviços..."
    run_compose restart
    log "✅ Reinício concluído."
    run_compose ps
}

action_restart_one() {
    echo ""
    echo -e "  ${BOLD}${ACCENT}┌────────────────────────────────────┐${NC}"
    echo -e "  ${BOLD}${ACCENT}│${NC}  ${WHITE}Reiniciar qual serviço?${NC}              ${BOLD}${ACCENT}│${NC}"
    echo -e "  ${BOLD}${ACCENT}├────────────────────────────────────┤${NC}"
    echo -e "  ${BOLD}${ACCENT}│${NC}  ${GREEN}1)${NC} backend  ${GREEN}2)${NC} nginx  ${GREEN}3)${NC} mysql  ${GREEN}4)${NC} redis  ${BOLD}${ACCENT}│${NC}"
    echo -e "  ${BOLD}${ACCENT}│${NC}  ${DIM}0) Voltar${NC}                          ${BOLD}${ACCENT}│${NC}"
    echo -e "  ${BOLD}${ACCENT}└────────────────────────────────────┘${NC}"
    echo ""
    echo -en "  ${ACCENT}Opção:${NC} "
    read -r opt
    [ "$opt" = "0" ] && return
    cd_project
    case "$opt" in
        1) docker compose -f "$COMPOSE_FILE" restart backend ;;
        2) docker compose -f "$COMPOSE_FILE" restart nginx ;;
        3) docker compose -f "$COMPOSE_FILE" restart mysql ;;
        4) docker compose -f "$COMPOSE_FILE" restart redis ;;
        *) warn "Opção inválida." ;;
    esac
}

action_pull_and_deploy() {
    action_git_pull
    action_deploy
}

action_stop() {
    echo ""
    echo -e "  ${YELLOW}⚠ Parar todos os containers?${NC} ${DIM}(s/N)${NC}"
    echo -en "  ${ACCENT}Confirmar:${NC} "
    read -r r
    if [ "$r" = "s" ] || [ "$r" = "S" ]; then
        run_compose down
        log "Containers parados."
    else
        log "Operação cancelada."
    fi
}

action_start() {
    log "Iniciando containers..."
    run_compose up -d
    run_compose ps
}

action_shell() {
    log "Abrindo shell no diretório do projeto: $PROJECT_DIR"
    cd_project
    exec $SHELL
}

action_health() {
    log "Verificando health..."
    cd_project
    curl -sf http://localhost:3000/health 2>/dev/null && echo "" && log "Backend OK" || warn "Backend não respondeu em :3000"
    curl -sf -o /dev/null http://localhost/health 2>/dev/null && log "Nginx OK" || warn "Nginx não respondeu em /health"
}

# =====================================================
# BANNER E MENU PRINCIPAL (largura fixa 52 chars)
# =====================================================
show_banner() {
    clear
    echo ""
}

show_menu() {
    show_banner
    echo -e "  ${BOLD}${ACCENT}┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓${NC}"
    echo -e "  ${BOLD}${ACCENT}┃${NC}  ${WHITE}${BOLD}KONTROLLAPRO${NC}  ${DIM}·${NC}  ${DIM}PAINEL VPS${NC}                         ${BOLD}${ACCENT}┃${NC}"
    echo -e "  ${BOLD}${ACCENT}┃${NC}  ${DIM}$PROJECT_DIR${NC}                                    ${BOLD}${ACCENT}┃${NC}"
    echo -e "  ${BOLD}${ACCENT}┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫${NC}"
    echo -e "  ${BOLD}${ACCENT}┃${NC}  ${DIM}Deploy${NC}                                                ${BOLD}${ACCENT}┃${NC}"
    echo -e "  ${BOLD}${ACCENT}┃${NC}    ${GREEN}1)${NC} Git pull    ${GREEN}2)${NC} Deploy     ${GREEN}3)${NC} Pull + Deploy  ${BOLD}${ACCENT}┃${NC}"
    echo -e "  ${BOLD}${ACCENT}┃${NC}  ${DIM}Monitoramento${NC}                                         ${BOLD}${ACCENT}┃${NC}"
    echo -e "  ${BOLD}${ACCENT}┃${NC}    ${GREEN}4)${NC} Logs       ${GREEN}5)${NC} Status     ${GREEN}11)${NC} Health check   ${BOLD}${ACCENT}┃${NC}"
    echo -e "  ${BOLD}${ACCENT}┃${NC}  ${DIM}Manutenção${NC}                                              ${BOLD}${ACCENT}┃${NC}"
    echo -e "  ${BOLD}${ACCENT}┃${NC}    ${GREEN}6)${NC} Backup     ${GREEN}7)${NC} Restart    ${GREEN}8)${NC} Restart one   ${BOLD}${ACCENT}┃${NC}"
    echo -e "  ${BOLD}${ACCENT}┃${NC}    ${GREEN}9)${NC} Parar      ${GREEN}10)${NC} Iniciar   ${GREEN}12)${NC} Shell         ${BOLD}${ACCENT}┃${NC}"
    echo -e "  ${BOLD}${ACCENT}┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫${NC}"
    echo -e "  ${BOLD}${ACCENT}┃${NC}  ${RED}0) Sair${NC}                                                  ${BOLD}${ACCENT}┃${NC}"
    echo -e "  ${BOLD}${ACCENT}┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛${NC}"
    echo ""
}

main() {
    # Se passou número como argumento, executa direto (ex: ./vps-panel.sh 1)
    if [ -n "${1:-}" ] && [ "$1" -eq "$1" ] 2>/dev/null; then
        case "$1" in
            1) action_git_pull ;;
            2) action_deploy ;;
            3) action_pull_and_deploy ;;
            4) action_logs ;;
            5) action_status ;;
            6) action_backup ;;
            7) action_restart ;;
            8) action_restart_one ;;
            9) action_stop ;;
            10) action_start ;;
            11) action_health ;;
            12) action_shell ;;
            *) err "Opção inválida: $1" ; exit 1 ;;
        esac
        exit 0
    fi

    while true; do
        show_menu
        echo -en "  ${BOLD}${ACCENT}▶${NC} ${DIM}Opção [0-12]:${NC} "
        read -r op
        case "$op" in
            1)  action_git_pull ;;
            2)  action_deploy ;;
            3)  action_pull_and_deploy ;;
            4)  action_logs ;;
            5)  action_status ;;
            6)  action_backup ;;
            7)  action_restart ;;
            8)  action_restart_one ;;
            9)  action_stop ;;
            10) action_start ;;
            11) action_health ;;
            12) action_shell ;;
            0)  echo "" ; echo -e "  ${GREEN}✓${NC} ${DIM}Até logo.${NC}" ; echo "" ; exit 0 ;;
            *)  warn "Opção inválida." ;;
        esac
        [ "$op" != "4" ] && echo "" && read -r -p "  Pressione Enter para continuar..."
    done
}

main "$@"
