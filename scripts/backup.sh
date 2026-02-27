#!/bin/sh

# =========================================================================
# KONTROLLAPRO - SCRIPT DE BACKUP AUTOMÁTICO
# =========================================================================

set -eu

# =====================================================
# CONFIGURAÇÕES
# =====================================================
BACKUP_DIR="${BACKUP_DIR:-/backups}"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-30}
DB_HOST="${MYSQL_HOST:-mysql}"
DB_NAME="${MYSQL_DATABASE:-kontrollapro_prod}"
DB_USER="${BACKUP_DB_USER:-root}"
DB_PASSWORD="${BACKUP_DB_PASSWORD:-${MYSQL_ROOT_PASSWORD:-${MYSQL_PASSWORD:-}}}"

if [ -z "${DB_PASSWORD}" ]; then
  echo "❌ Senha do MySQL não definida (MYSQL_PASSWORD ou MYSQL_ROOT_PASSWORD)."
  exit 1
fi

# =====================================================
# CRIAR DIRETÓRIOS
# =====================================================
mkdir -p "$BACKUP_DIR/mysql"
mkdir -p "$BACKUP_DIR/uploads"
mkdir -p "$BACKUP_DIR/logs"

# =====================================================
# BACKUP DO BANCO DE DADOS
# =====================================================
echo "🗄️ Fazendo backup do banco de dados..."
export MYSQL_PWD="$DB_PASSWORD"

DB_DUMP_FILE="$BACKUP_DIR/mysql/backup_${DB_NAME}_${DATE}.sql"
if mysqldump \
  -h "$DB_HOST" \
  -u "$DB_USER" \
  --single-transaction \
  --quick \
  --routines \
  --triggers \
  --events \
  --databases "$DB_NAME" > "$DB_DUMP_FILE"; then
  echo "✅ Backup do banco concluído: $(basename "$DB_DUMP_FILE")"
  gzip -9 "$DB_DUMP_FILE"
  echo "✅ Backup comprimido: $(basename "$DB_DUMP_FILE").gz"
else
  echo "❌ Erro no backup do banco de dados"
  rm -f "$DB_DUMP_FILE" 2>/dev/null || true
  exit 1
fi
unset MYSQL_PWD

# =====================================================
# BACKUP DOS UPLOADS
# =====================================================
echo "📁 Fazendo backup dos uploads..."
if [ -d "/uploads-data" ]; then
  UPLOADS_FILE="$BACKUP_DIR/uploads/uploads_${DATE}.tar.gz"
  if tar -czf "$UPLOADS_FILE" -C /uploads-data .; then
    echo "✅ Backup dos uploads concluído: $(basename "$UPLOADS_FILE")"
  else
    echo "❌ Erro no backup dos uploads"
    rm -f "$UPLOADS_FILE" 2>/dev/null || true
  fi
else
  echo "⚠️ Diretório de uploads não encontrado"
fi

# =====================================================
# BACKUP DOS LOGS (OPCIONAL)
# =====================================================
echo "🧾 Fazendo backup dos logs (se disponível)..."
if [ -d "/logs-data" ]; then
  LOGS_FILE="$BACKUP_DIR/logs/logs_${DATE}.tar.gz"
  if tar -czf "$LOGS_FILE" -C /logs-data .; then
    echo "✅ Backup dos logs concluído: $(basename "$LOGS_FILE")"
  else
    echo "❌ Erro no backup dos logs"
    rm -f "$LOGS_FILE" 2>/dev/null || true
  fi
else
  echo "ℹ️ Diretório de logs não montado; pulando."
fi

# =====================================================
# LIMPEZA DE BACKUPS ANTIGOS
# =====================================================
echo "🧹 Limpando backups antigos (>$RETENTION_DAYS dias)..."

# Limpar backups do banco
find "$BACKUP_DIR/mysql" -type f -name "backup_*.sql.gz" -mtime "+$RETENTION_DAYS" -exec rm -f {} \;
echo "✅ Backups antigos do banco removidos"

# Limpar backups de uploads
find "$BACKUP_DIR/uploads" -type f -name "uploads_*.tar.gz" -mtime "+$RETENTION_DAYS" -exec rm -f {} \;
echo "✅ Backups antigos de uploads removidos"

# Limpar backups de logs
find "$BACKUP_DIR/logs" -type f -name "logs_*.tar.gz" -mtime "+$RETENTION_DAYS" -exec rm -f {} \;
echo "✅ Backups antigos de logs removidos"

# =====================================================
# ESTATÍSTICAS
# =====================================================
echo "📊 Estatísticas de backup:"
echo "📁 Backups de banco: $(find "$BACKUP_DIR/mysql" -maxdepth 1 -type f -name "backup_*.sql.gz" 2>/dev/null | wc -l | tr -d ' ')"
echo "📁 Backups de uploads: $(find "$BACKUP_DIR/uploads" -maxdepth 1 -type f -name "uploads_*.tar.gz" 2>/dev/null | wc -l | tr -d ' ')"
echo "📁 Backups de logs: $(find "$BACKUP_DIR/logs" -maxdepth 1 -type f -name "logs_*.tar.gz" 2>/dev/null | wc -l | tr -d ' ')"
echo "💾 Espaço usado: $(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1 || du -s "$BACKUP_DIR" | awk '{print $1 \"K\"}')"

echo "✅ Processo de backup concluído com sucesso!"