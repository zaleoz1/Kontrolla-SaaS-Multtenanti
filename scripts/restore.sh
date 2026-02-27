#!/bin/sh

set -eu

BACKUP_DIR="${BACKUP_DIR:-/backups}"
DB_HOST="${MYSQL_HOST:-mysql}"
DB_NAME="${MYSQL_DATABASE:-kontrollapro_prod}"
DB_USER="${BACKUP_DB_USER:-root}"
DB_PASSWORD="${BACKUP_DB_PASSWORD:-${MYSQL_ROOT_PASSWORD:-${MYSQL_PASSWORD:-}}}"

if [ "${FORCE_RESTORE:-}" != "1" ]; then
  echo "❌ Restauração bloqueada por segurança."
  echo "   Defina FORCE_RESTORE=1 para permitir."
  exit 1
fi

if [ -z "${DB_PASSWORD}" ]; then
  echo "❌ Senha do MySQL não definida (MYSQL_PASSWORD ou MYSQL_ROOT_PASSWORD)."
  exit 1
fi

pick_latest() {
  pattern="$1"
  dir="$2"
  latest="$(ls -1t "$dir"/$pattern 2>/dev/null | head -n 1 || true)"
  if [ -z "$latest" ]; then
    return 1
  fi
  printf "%s" "$latest"
}

DB_DUMP="${1:-}"
if [ -z "$DB_DUMP" ]; then
  DB_DUMP="$(pick_latest "backup_${DB_NAME}_*.sql.gz" "$BACKUP_DIR/mysql" || true)"
fi
if [ -z "$DB_DUMP" ]; then
  DB_DUMP="$(pick_latest "backup_*.sql.gz" "$BACKUP_DIR/mysql" || true)"
fi

if [ -z "$DB_DUMP" ] || [ ! -f "$DB_DUMP" ]; then
  echo "❌ Nenhum dump de banco encontrado em $BACKUP_DIR/mysql."
  exit 1
fi

echo "🧩 Restaurando banco a partir de: $(basename "$DB_DUMP")"
export MYSQL_PWD="$DB_PASSWORD"

if ! gunzip -c "$DB_DUMP" | mysql -h "$DB_HOST" -u "$DB_USER"; then
  echo "❌ Falha ao restaurar o banco."
  exit 1
fi

unset MYSQL_PWD
echo "✅ Banco restaurado com sucesso."

# Uploads (opcional)
if [ "${RESTORE_UPLOADS:-0}" = "1" ]; then
  if [ "${FORCE_RESTORE_UPLOADS:-}" != "1" ]; then
    echo "❌ Restauração de uploads bloqueada."
    echo "   Defina FORCE_RESTORE_UPLOADS=1 junto com RESTORE_UPLOADS=1."
    exit 1
  fi

  UPLOADS_TAR="${2:-}"
  if [ -z "$UPLOADS_TAR" ]; then
    UPLOADS_TAR="$(pick_latest "uploads_*.tar.gz" "$BACKUP_DIR/uploads" || true)"
  fi

  if [ -z "$UPLOADS_TAR" ] || [ ! -f "$UPLOADS_TAR" ]; then
    echo "❌ Nenhum backup de uploads encontrado em $BACKUP_DIR/uploads."
    exit 1
  fi

  if [ ! -d "/uploads-data" ]; then
    echo "❌ Diretório /uploads-data não está montado no container."
    exit 1
  fi

  echo "📁 Restaurando uploads a partir de: $(basename "$UPLOADS_TAR")"
  if tar -xzf "$UPLOADS_TAR" -C /uploads-data; then
    echo "✅ Uploads restaurados com sucesso."
  else
    echo "❌ Falha ao restaurar uploads."
    exit 1
  fi
fi

echo "✅ Processo de restauração concluído."

