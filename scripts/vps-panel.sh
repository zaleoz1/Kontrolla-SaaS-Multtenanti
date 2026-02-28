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

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# =====================================================
# FUNÇÕES AUXILIARES
# =====================================================
log()  { echo -e "${GREEN}[$(date +'%H:%M:%S')]${NC} $1"; }
warn() { echo -e "${YELLOW}[$(date +'%H:%M:%S')] ⚠${NC} $1"; }
err()  { echo -e "${RED}[$(date +'%H:%M:%S')] ✗${NC} $1"; }

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
    echo -e "${CYAN}  Logs de qual serviço?${NC}"
    echo "  1) backend    2) nginx    3) mysql    4) redis"
    echo "  5) todos (follow)    6) backup"
    echo "  0) Voltar"
    read -r -p "  Opção: " opt
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
    echo "  1) backend    2) nginx    3) mysql    4) redis"
    read -r -p "  Reiniciar qual? (0=voltar): " opt
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
    warn "Parar todos os containers? (s/N)"
    read -r -p "  " r
    if [ "$r" = "s" ] || [ "$r" = "S" ]; then
        run_compose down
        log "Containers parados."
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
# MENU PRINCIPAL
# =====================================================
show_menu() {
    echo ""
    echo -e "${BOLD}${BLUE}  ╔══════════════════════════════════════════════╗${NC}"
    echo -e "${BOLD}${BLUE}  ║     KONTROLLAPRO - PAINEL VPS                ║${NC}"
    echo -e "${BOLD}${BLUE}  ║     Diretório: $PROJECT_DIR${NC}"
    echo -e "${BOLD}${BLUE}  ╚══════════════════════════════════════════════╝${NC}"
    echo ""
    echo "  1)  Git pull"
    echo "  2)  Deploy (build frontend + containers)"
    echo "  3)  Git pull + Deploy"
    echo "  4)  Ver logs (backend/nginx/mysql/redis)"
    echo "  5)  Status dos containers"
    echo "  6)  Backup manual"
    echo "  7)  Reiniciar todos os serviços"
    echo "  8)  Reiniciar um serviço"
    echo "  9)  Parar containers"
    echo "  10) Iniciar containers"
    echo "  11) Health check (backend + nginx)"
    echo "  12) Abrir shell no diretório do projeto"
    echo ""
    echo "  0)  Sair"
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
        read -r -p "  Escolha uma opção: " op
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
            0)  log "Até logo." ; exit 0 ;;
            *)  warn "Opção inválida." ;;
        esac
        [ "$op" != "4" ] && echo "" && read -r -p "  Pressione Enter para continuar..."
    done
}

main "$@"
