-- Migração para corrigir campo estoque de DECIMAL para INT
-- Esta migração garante que o estoque seja sempre um número inteiro

-- Verificar se a coluna estoque existe e se é do tipo DECIMAL
-- Se for DECIMAL, converter para INT
ALTER TABLE produtos 
MODIFY COLUMN estoque INT DEFAULT 0;

-- Verificar se a coluna estoque_minimo existe e se é do tipo DECIMAL  
-- Se for DECIMAL, converter para INT
ALTER TABLE produtos 
MODIFY COLUMN estoque_minimo INT DEFAULT 0;

-- Atualizar registros existentes que possam ter valores decimais
-- Arredondar para o inteiro mais próximo
UPDATE produtos 
SET estoque = ROUND(estoque) 
WHERE estoque IS NOT NULL;

UPDATE produtos 
SET estoque_minimo = ROUND(estoque_minimo) 
WHERE estoque_minimo IS NOT NULL;

-- Garantir que não há valores negativos
UPDATE produtos 
SET estoque = 0 
WHERE estoque < 0;

UPDATE produtos 
SET estoque_minimo = 0 
WHERE estoque_minimo < 0;