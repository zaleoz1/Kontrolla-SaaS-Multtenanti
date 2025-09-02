-- Schema do banco de dados para o sistema KontrollaPro (SaaS Multitenanti)

-- Criar banco de dados se não existir
CREATE DATABASE IF NOT EXISTS kontrollapro CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE kontrollapro;

-- Tabela de tenants (empresas/lojas)
CREATE TABLE IF NOT EXISTS tenants (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    cnpj VARCHAR(18) UNIQUE,
    email VARCHAR(255) NOT NULL,
    telefone VARCHAR(20),
    endereco TEXT,
    cidade VARCHAR(100),
    estado VARCHAR(2),
    cep VARCHAR(10),
    status ENUM('ativo', 'inativo', 'suspenso') DEFAULT 'ativo',
    plano VARCHAR(50) DEFAULT 'basico',
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS usuarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tenant_id INT NOT NULL,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    senha VARCHAR(255) NOT NULL,
    telefone VARCHAR(20),
    avatar VARCHAR(255),
    role ENUM('admin', 'vendedor', 'gerente', 'financeiro') DEFAULT 'vendedor',
    status ENUM('ativo', 'inativo') DEFAULT 'ativo',
    ultimo_login TIMESTAMP NULL,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    UNIQUE KEY unique_email_tenant (email, tenant_id)
);

-- Tabela de clientes
CREATE TABLE IF NOT EXISTS clientes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tenant_id INT NOT NULL,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    telefone VARCHAR(20),
    cpf_cnpj VARCHAR(18),
    tipo_pessoa ENUM('fisica', 'juridica') DEFAULT 'fisica',
    endereco TEXT,
    cidade VARCHAR(100),
    estado VARCHAR(2),
    cep VARCHAR(10),
    data_nascimento DATE,
    sexo ENUM('masculino', 'feminino', 'outro'),
    razao_social VARCHAR(255),
    inscricao_estadual VARCHAR(20),
    inscricao_municipal VARCHAR(20),
    nome_fantasia VARCHAR(255),
    observacoes TEXT,
    status ENUM('ativo', 'inativo') DEFAULT 'ativo',
    vip BOOLEAN DEFAULT FALSE,
    limite_credito DECIMAL(10,2) DEFAULT 0.00,
    total_compras DECIMAL(10,2) DEFAULT 0.00,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Tabela de categorias de produtos
CREATE TABLE IF NOT EXISTS categorias (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tenant_id INT NOT NULL,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    status ENUM('ativo', 'inativo') DEFAULT 'ativo',
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Tabela de produtos
CREATE TABLE IF NOT EXISTS produtos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tenant_id INT NOT NULL,
    categoria_id INT,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    codigo_barras VARCHAR(50),
    sku VARCHAR(100),
    preco DECIMAL(10,2) NOT NULL,
    preco_promocional DECIMAL(10,2),
    estoque INT DEFAULT 0,
    estoque_minimo INT DEFAULT 0,
    peso DECIMAL(8,3),
    largura DECIMAL(8,2),
    altura DECIMAL(8,2),
    comprimento DECIMAL(8,2),
    fornecedor VARCHAR(255),
    marca VARCHAR(100),
    modelo VARCHAR(100),
    garantia VARCHAR(100),
    status ENUM('ativo', 'inativo', 'rascunho') DEFAULT 'ativo',
    destaque BOOLEAN DEFAULT FALSE,
    imagens JSON,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL
);

-- Tabela de vendas
CREATE TABLE IF NOT EXISTS vendas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tenant_id INT NOT NULL,
    cliente_id INT,
    usuario_id INT NOT NULL,
    numero_venda VARCHAR(50) NOT NULL,
    data_venda TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pendente', 'pago', 'cancelado', 'devolvido') DEFAULT 'pendente',
    subtotal DECIMAL(10,2) NOT NULL,
    desconto DECIMAL(10,2) DEFAULT 0.00,
    total DECIMAL(10,2) NOT NULL,
    forma_pagamento ENUM('dinheiro', 'cartao_credito', 'cartao_debito', 'pix', 'transferencia', 'boleto', 'cheque') NOT NULL,
    parcelas INT DEFAULT 1,
    observacoes TEXT,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Tabela de itens da venda
CREATE TABLE IF NOT EXISTS venda_itens (
    id INT PRIMARY KEY AUTO_INCREMENT,
    venda_id INT NOT NULL,
    produto_id INT NOT NULL,
    quantidade INT NOT NULL,
    preco_unitario DECIMAL(10,2) NOT NULL,
    preco_total DECIMAL(10,2) NOT NULL,
    desconto DECIMAL(10,2) DEFAULT 0.00,
    FOREIGN KEY (venda_id) REFERENCES vendas(id) ON DELETE CASCADE,
    FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE
);

-- Tabela de transações financeiras
CREATE TABLE IF NOT EXISTS transacoes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tenant_id INT NOT NULL,
    tipo ENUM('entrada', 'saida') NOT NULL,
    categoria VARCHAR(100) NOT NULL,
    descricao VARCHAR(255) NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    data_transacao DATE NOT NULL,
    metodo_pagamento ENUM('pix', 'cartao_credito', 'cartao_debito', 'dinheiro', 'transferencia', 'boleto', 'cheque') NOT NULL,
    conta VARCHAR(100) NOT NULL,
    fornecedor VARCHAR(255),
    cliente_id INT,
    observacoes TEXT,
    anexos JSON,
    status ENUM('pendente', 'concluida', 'cancelada') DEFAULT 'pendente',
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL
);

-- Tabela de contas a receber
CREATE TABLE IF NOT EXISTS contas_receber (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tenant_id INT NOT NULL,
    cliente_id INT,
    venda_id INT,
    descricao VARCHAR(255) NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    data_vencimento DATE NOT NULL,
    data_pagamento DATE,
    status ENUM('pendente', 'pago', 'vencido', 'cancelado') DEFAULT 'pendente',
    parcela VARCHAR(10),
    observacoes TEXT,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL,
    FOREIGN KEY (venda_id) REFERENCES vendas(id) ON DELETE SET NULL
);

-- Tabela de contas a pagar
CREATE TABLE IF NOT EXISTS contas_pagar (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tenant_id INT NOT NULL,
    fornecedor VARCHAR(255) NOT NULL,
    descricao VARCHAR(255) NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    data_vencimento DATE NOT NULL,
    data_pagamento DATE,
    status ENUM('pendente', 'pago', 'vencido', 'cancelado') DEFAULT 'pendente',
    categoria VARCHAR(100),
    observacoes TEXT,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Tabela de NF-e
CREATE TABLE IF NOT EXISTS nfe (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tenant_id INT NOT NULL,
    venda_id INT,
    numero VARCHAR(50) NOT NULL,
    serie VARCHAR(10) NOT NULL,
    chave_acesso VARCHAR(50),
    cliente_id INT,
    cnpj_cpf VARCHAR(18),
    data_emissao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    valor_total DECIMAL(10,2) NOT NULL,
    status ENUM('pendente', 'autorizada', 'cancelada', 'erro') DEFAULT 'pendente',
    ambiente ENUM('homologacao', 'producao') DEFAULT 'homologacao',
    xml_path VARCHAR(255),
    pdf_path VARCHAR(255),
    observacoes TEXT,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (venda_id) REFERENCES vendas(id) ON DELETE SET NULL,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL
);

-- Tabela de itens da NF-e
CREATE TABLE IF NOT EXISTS nfe_itens (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nfe_id INT NOT NULL,
    produto_id INT NOT NULL,
    quantidade INT NOT NULL,
    preco_unitario DECIMAL(10,2) NOT NULL,
    preco_total DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (nfe_id) REFERENCES nfe(id) ON DELETE CASCADE,
    FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE
);

-- Tabela de configurações do tenant
CREATE TABLE IF NOT EXISTS tenant_configuracoes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tenant_id INT NOT NULL,
    chave VARCHAR(100) NOT NULL,
    valor TEXT,
    tipo ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    UNIQUE KEY unique_tenant_key (tenant_id, chave)
);

-- Índices para melhor performance
CREATE INDEX idx_usuarios_tenant ON usuarios(tenant_id);
CREATE INDEX idx_clientes_tenant ON clientes(tenant_id);
CREATE INDEX idx_produtos_tenant ON produtos(tenant_id);
CREATE INDEX idx_vendas_tenant ON vendas(tenant_id);
CREATE INDEX idx_transacoes_tenant ON transacoes(tenant_id);
CREATE INDEX idx_nfe_tenant ON nfe(tenant_id);

-- Índices para busca
CREATE INDEX idx_clientes_nome ON clientes(nome);
CREATE INDEX idx_produtos_nome ON produtos(nome);
CREATE INDEX idx_produtos_codigo_barras ON produtos(codigo_barras);
CREATE INDEX idx_vendas_numero ON vendas(numero_venda);
CREATE INDEX idx_vendas_data ON vendas(data_venda);
