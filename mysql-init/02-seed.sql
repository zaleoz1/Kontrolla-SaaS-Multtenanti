-- Dados iniciais para o sistema KontrollaPro (SaaS Multitenanti)
USE kontrollapro_prod;

-- Inserir tenant inicial para testes se não existir
INSERT IGNORE INTO tenants (
    nome, 
    slug, 
    cnpj, 
    tipo_pessoa, 
    email, 
    telefone, 
    razao_social, 
    nome_fantasia, 
    status, 
    plano
) VALUES (
    'Empresa Demo',
    'empresa-demo',
    '12.345.678/0001-99',
    'juridica',
    'admin@empresademo.com',
    '(11) 99999-9999',
    'Empresa Demo LTDA',
    'Empresa Demo',
    'ativo',
    'premium'
);

-- Inserir usuário administrador inicial se não existir
-- Senha: admin123 (hash bcrypt)
INSERT IGNORE INTO usuarios (
    tenant_id,
    nome,
    sobrenome,
    email,
    senha,
    role,
    status,
    email_verificado
) VALUES (
    1,
    'Administrador',
    'Sistema',
    'admin@empresademo.com',
    '$2b$10$WrHzw7l0M4jAQBz0qFQAWO6QvYGfk/r8K1PZYv2ZxRzRQZWLKJ8.2',
    'admin',
    'ativo',
    TRUE
);

-- Inserir configurações iniciais de métodos de pagamento
INSERT IGNORE INTO metodos_pagamento (tenant_id, tipo, nome, taxa, ativo) VALUES
(1, 'dinheiro', 'Dinheiro', 0.00, TRUE),
(1, 'pix', 'PIX', 0.00, TRUE),
(1, 'cartao_debito', 'Cartão de Débito', 2.50, TRUE),
(1, 'cartao_credito', 'Cartão de Crédito', 3.99, TRUE);

-- Inserir categorias de produtos básicas
INSERT IGNORE INTO categorias (tenant_id, nome, descricao) VALUES
(1, 'Eletrônicos', 'Produtos eletrônicos diversos'),
(1, 'Roupas', 'Vestuário e acessórios'),
(1, 'Casa e Jardim', 'Produtos para casa e jardim'),
(1, 'Esportes', 'Artigos esportivos');

-- Inserir produtos de exemplo
INSERT IGNORE INTO produtos (
    tenant_id, 
    categoria_id, 
    nome, 
    descricao, 
    codigo_barras, 
    preco, 
    estoque, 
    estoque_minimo
) VALUES
(1, 1, 'Smartphone XYZ', 'Smartphone Android com 128GB', '7891234567890', 899.99, 10, 2),
(1, 2, 'Camiseta Básica', 'Camiseta 100% algodão', '7891234567891', 29.99, 50, 10),
(1, 3, 'Vaso Decorativo', 'Vaso de cerâmica para plantas', '7891234567892', 45.50, 15, 5);

-- Inserir cliente de exemplo
INSERT IGNORE INTO clientes (
    tenant_id,
    nome,
    email,
    telefone,
    cpf_cnpj,
    tipo_pessoa
) VALUES (
    1,
    'Cliente Exemplo',
    'cliente@exemplo.com',
    '(11) 98888-8888',
    '123.456.789-00',
    'fisica'
);