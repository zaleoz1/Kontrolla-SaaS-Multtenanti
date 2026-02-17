-- Migração: Adicionar tabelas para integração MeuDanfe
-- Data: 2026-02-17

-- Tabela para configurações do tenant (se não existir)
CREATE TABLE IF NOT EXISTS tenant_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    config_key VARCHAR(100) NOT NULL,
    config_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY idx_tenant_config_key (tenant_id, config_key),
    INDEX idx_tenant_config_tenant (tenant_id)
);

-- Tabela para NF-e importadas via MeuDanfe
CREATE TABLE IF NOT EXISTS nfe_importadas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    chave_acesso VARCHAR(44) NOT NULL,
    numero VARCHAR(20),
    serie VARCHAR(5) DEFAULT '1',
    data_emissao DATETIME,
    valor_total DECIMAL(15, 2) DEFAULT 0,
    emitente_cnpj VARCHAR(20),
    emitente_nome VARCHAR(255),
    emitente_uf VARCHAR(2),
    destinatario_cnpj VARCHAR(20),
    destinatario_nome VARCHAR(255),
    xml_content LONGTEXT,
    itens_json LONGTEXT,
    data_importacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('importada', 'processada', 'erro') DEFAULT 'importada',
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY idx_nfe_importadas_chave (tenant_id, chave_acesso),
    INDEX idx_nfe_importadas_tenant (tenant_id),
    INDEX idx_nfe_importadas_data (data_importacao),
    INDEX idx_nfe_importadas_emitente (emitente_cnpj)
);

-- Tabela para registro de consultas (auditoria e custos)
CREATE TABLE IF NOT EXISTS meudanfe_consultas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    chave_acesso VARCHAR(44) NOT NULL,
    tipo ENUM('nfe', 'cte', 'danfe', 'xml') DEFAULT 'nfe',
    resultado TEXT,
    custo DECIMAL(10, 4) DEFAULT 0.03,
    data_consulta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_meudanfe_consultas_tenant (tenant_id),
    INDEX idx_meudanfe_consultas_data (data_consulta)
);

-- Verificar se as tabelas foram criadas
SELECT 'Tabelas MeuDanfe criadas com sucesso!' AS status;

