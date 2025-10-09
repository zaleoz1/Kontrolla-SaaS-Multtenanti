#!/bin/bash

# =========================================================================
# KONTROLLAPRO - SCRIPT DE BACKUP AUTOMÁTICO
# =========================================================================

set -e

# =====================================================
# CONFIGURAÇÕES
# =====================================================
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-30}
DB_NAME=${MYSQL_DATABASE:-kontrollapro_prod}
DB_PASSWORD=${MYSQL_ROOT_PASSWORD}

# =====================================================
# CRIAR DIRETÓRIOS
# =====================================================
mkdir -p $BACKUP_DIR/mysql $BACKUP_DIR/uploads $BACKUP_DIR/logs

# =====================================================
# BACKUP DO BANCO DE DADOS
# =====================================================
echo "🗄️ Fazendo backup do banco de dados..."
mysqldump -h mysql -u root -p$DB_PASSWORD $DB_NAME > $BACKUP_DIR/mysql/backup_$DATE.sql

if [ $? -eq 0 ]; then
    echo "✅ Backup do banco concluído: backup_$DATE.sql"
    gzip $BACKUP_DIR/mysql/backup_$DATE.sql
    echo "✅ Backup comprimido: backup_$DATE.sql.gz"
else
    echo "❌ Erro no backup do banco de dados"
    exit 1
fi

# =====================================================
# BACKUP DOS UPLOADS
# =====================================================
echo "📁 Fazendo backup dos uploads..."
if [ -d "/uploads-data" ]; then
    tar -czf $BACKUP_DIR/uploads/uploads_$DATE.tar.gz -C /uploads-data .
    if [ $? -eq 0 ]; then
        echo "✅ Backup dos uploads concluído: uploads_$DATE.tar.gz"
    else
        echo "❌ Erro no backup dos uploads"
    fi
else
    echo "⚠️ Diretório de uploads não encontrado"
fi

# =====================================================
# LIMPEZA DE BACKUPS ANTIGOS
# =====================================================
echo "🧹 Limpando backups antigos (>$RETENTION_DAYS dias)..."

# Limpar backups do banco
find $BACKUP_DIR/mysql -name "backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete
echo "✅ Backups antigos do banco removidos"

# Limpar backups de uploads
find $BACKUP_DIR/uploads -name "uploads_*.tar.gz" -mtime +$RETENTION_DAYS -delete
echo "✅ Backups antigos de uploads removidos"

# =====================================================
# ESTATÍSTICAS
# =====================================================
echo "📊 Estatísticas de backup:"
echo "📁 Backups de banco: $(ls -1 $BACKUP_DIR/mysql/*.gz 2>/dev/null | wc -l)"
echo "📁 Backups de uploads: $(ls -1 $BACKUP_DIR/uploads/*.tar.gz 2>/dev/null | wc -l)"
echo "💾 Espaço usado: $(du -sh $BACKUP_DIR | cut -f1)"

echo "✅ Processo de backup concluído com sucesso!"