-- Script de inicialização do MySQL para produção
-- KontrollaPro SaaS Multitenanti

-- Configurações de segurança
SET GLOBAL sql_mode = 'STRICT_TRANS_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO';
SET GLOBAL innodb_buffer_pool_size = 256M;
SET GLOBAL max_connections = 200;
SET GLOBAL wait_timeout = 28800;
SET GLOBAL interactive_timeout = 28800;

-- Criar usuário específico para aplicação
CREATE USER IF NOT EXISTS 'kontrolla_user'@'%' IDENTIFIED BY 'KontrollaUser2024!Secure';
GRANT ALL PRIVILEGES ON kontrollapro.* TO 'kontrolla_user'@'%';
FLUSH PRIVILEGES;

-- Configurações de performance
SET GLOBAL innodb_flush_log_at_trx_commit = 2;
SET GLOBAL sync_binlog = 0;
SET GLOBAL innodb_log_file_size = 256M;
SET GLOBAL innodb_log_buffer_size = 16M;

-- Configurações de charset
ALTER DATABASE kontrollapro CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
