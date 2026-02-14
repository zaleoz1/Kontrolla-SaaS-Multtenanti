-- Migration: Adicionar campo preco_compra à tabela produtos
-- Execute este script no banco de dados de produção

-- Verificar se a coluna já existe antes de adicionar
SET @column_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'produtos' 
    AND COLUMN_NAME = 'preco_compra'
);

SET @sql = IF(@column_exists = 0, 
    'ALTER TABLE produtos ADD COLUMN preco_compra DECIMAL(10,2) COMMENT "Preco de compra/custo do produto" AFTER preco',
    'SELECT "Coluna preco_compra ja existe" AS resultado'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

