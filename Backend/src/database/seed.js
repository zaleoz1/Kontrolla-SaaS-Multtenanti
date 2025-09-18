import bcrypt from 'bcryptjs';
import { query } from './connection.js';

async function seedDatabase() {
  try {
    console.log('🌱 Iniciando seed do banco de dados...');

    // Verificar se já existem dados
    const [tenantCount] = await query('SELECT COUNT(*) as count FROM tenants');
    if (tenantCount.count > 0) {
      console.log('⚠️  Banco de dados já possui dados. Pulando seed.');
      return;
    }

    // Criar tenant de exemplo
    console.log('🏢 Criando tenant de exemplo...');
    const [tenantResult] = await query(
      `INSERT INTO tenants (
        nome, slug, cnpj, email, telefone, endereco, cidade, estado, cep, 
        status, plano, tipo_pessoa, razao_social, nome_fantasia, 
        inscricao_estadual, inscricao_municipal
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'Loja Exemplo Ltda',
        'loja-exemplo',
        '12.345.678/0001-90',
        'contato@lojaexemplo.com.br',
        '(11) 99999-8888',
        'Rua das Flores, 123',
        'São Paulo',
        'SP',
        '01234-567',
        'ativo',
        'premium',
        'juridica',
        'Loja Exemplo Ltda',
        'Loja Exemplo',
        '123456789',
        '987654321'
      ]
    );

    const tenantId = tenantResult.insertId;

    // Criar usuário admin
    console.log('👤 Criando usuário administrador...');
    const senhaHash = await bcrypt.hash('admin123', 12);
    await query(
      `INSERT INTO usuarios (tenant_id, nome, sobrenome, email, senha, telefone, role, status, email_verificado) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tenantId,
        'Administrador',
        'Sistema',
        'admin@lojaexemplo.com.br',
        senhaHash,
        '(11) 99999-8888',
        'admin',
        'ativo',
        true
      ]
    );

    // Criar categorias
    console.log('📂 Criando categorias...');
    const categorias = [
      { nome: 'Eletrônicos', descricao: 'Produtos eletrônicos em geral' },
      { nome: 'Acessórios', descricao: 'Acessórios para dispositivos' },
      { nome: 'Informática', descricao: 'Produtos de informática' },
      { nome: 'Casa e Decoração', descricao: 'Itens para casa e decoração' }
    ];

    const categoriaIds = [];
    for (const categoria of categorias) {
      const [result] = await query(
        `INSERT INTO categorias (tenant_id, nome, descricao, status) 
         VALUES (?, ?, ?, ?)`,
        [tenantId, categoria.nome, categoria.descricao, 'ativo']
      );
      categoriaIds.push(result.insertId);
    }

    // Criar produtos
    console.log('📦 Criando produtos...');
    const produtos = [
      {
        nome: 'Smartphone Galaxy S24',
        descricao: 'Smartphone premium com câmera de alta resolução',
        categoria_id: categoriaIds[0],
        preco: 2499.00,
        preco_promocional: 2299.00,
        estoque: 15,
        estoque_minimo: 5,
        codigo_barras: '7891234567890',
        sku: 'SM-GALAXY-S24',
        marca: 'Samsung',
        modelo: 'Galaxy S24',
        destaque: true,
        status: 'ativo'
      },
      {
        nome: 'Fone Bluetooth Premium',
        descricao: 'Fone sem fio com cancelamento de ruído',
        categoria_id: categoriaIds[1],
        preco: 299.90,
        estoque: 25,
        estoque_minimo: 10,
        codigo_barras: '7891234567891',
        sku: 'FONE-BT-PREM',
        marca: 'TechSound',
        modelo: 'Premium BT',
        destaque: false,
        status: 'ativo'
      },
      {
        nome: 'Tablet Android 11',
        descricao: 'Tablet ideal para trabalho e entretenimento',
        categoria_id: categoriaIds[0],
        preco: 1299.00,
        preco_promocional: 1199.00,
        estoque: 8,
        estoque_minimo: 3,
        codigo_barras: '7891234567892',
        sku: 'TAB-ANDROID-11',
        marca: 'TechPad',
        modelo: 'Android 11',
        destaque: true,
        status: 'ativo'
      },
      {
        nome: 'Carregador USB-C 65W',
        descricao: 'Carregador rápido compatível com diversos dispositivos',
        categoria_id: categoriaIds[1],
        preco: 89.90,
        estoque: 0,
        estoque_minimo: 20,
        codigo_barras: '7891234567893',
        sku: 'CAR-USB-C-65W',
        marca: 'PowerTech',
        modelo: 'USB-C 65W',
        destaque: false,
        status: 'ativo'
      }
    ];

    const produtoIds = [];
    for (const produto of produtos) {
      const [result] = await query(
        `INSERT INTO produtos (
          tenant_id, categoria_id, nome, descricao, preco, preco_promocional,
          estoque, estoque_minimo, codigo_barras, sku, marca, modelo,
          destaque, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          tenantId, produto.categoria_id, produto.nome, produto.descricao,
          produto.preco, produto.preco_promocional, produto.estoque,
          produto.estoque_minimo, produto.codigo_barras, produto.sku,
          produto.marca, produto.modelo, produto.destaque, produto.status
        ]
      );
      produtoIds.push(result.insertId);
    }

    // Criar clientes
    console.log('👥 Criando clientes...');
    const clientes = [
      {
        nome: 'João Silva',
        email: 'joao.silva@email.com',
        telefone: '(11) 99999-8888',
        cpf_cnpj: '123.456.789-00',
        tipo_pessoa: 'fisica',
        endereco: 'Rua das Flores, 123',
        cidade: 'São Paulo',
        estado: 'SP',
        cep: '01234-567',
        status: 'ativo',
        vip: true,
        limite_credito: 5000.00,
        total_compras: 2847.50
      },
      {
        nome: 'Maria Santos',
        email: 'maria.santos@email.com',
        telefone: '(11) 98888-7777',
        cpf_cnpj: '987.654.321-00',
        tipo_pessoa: 'fisica',
        endereco: 'Av. Paulista, 456',
        cidade: 'São Paulo',
        estado: 'SP',
        cep: '01310-100',
        status: 'ativo',
        vip: false,
        limite_credito: 2000.00,
        total_compras: 1299.80
      },
      {
        nome: 'Carlos Lima',
        email: 'carlos.lima@email.com',
        telefone: '(11) 97777-6666',
        cpf_cnpj: '456.789.123-00',
        tipo_pessoa: 'fisica',
        endereco: 'Rua Augusta, 789',
        cidade: 'São Paulo',
        estado: 'SP',
        cep: '01305-000',
        status: 'ativo',
        vip: false,
        limite_credito: 1000.00,
        total_compras: 567.30
      }
    ];

    const clienteIds = [];
    for (const cliente of clientes) {
      const [result] = await query(
        `INSERT INTO clientes (
          tenant_id, nome, email, telefone, cpf_cnpj, tipo_pessoa,
          endereco, cidade, estado, cep, status, vip, limite_credito, total_compras
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          tenantId, cliente.nome, cliente.email, cliente.telefone,
          cliente.cpf_cnpj, cliente.tipo_pessoa, cliente.endereco,
          cliente.cidade, cliente.estado, cliente.cep, cliente.status,
          cliente.vip, cliente.limite_credito, cliente.total_compras
        ]
      );
      clienteIds.push(result.insertId);
    }

    // Criar algumas vendas de exemplo
    console.log('💰 Criando vendas de exemplo...');
    const vendas = [
      {
        cliente_id: clienteIds[0],
        numero_venda: 'V000001',
        subtotal: 2499.00,
        desconto: 0,
        total: 2499.00,
        forma_pagamento: 'pix',
        status: 'pago',
        itens: [
          { produto_id: produtoIds[0], quantidade: 1, preco_unitario: 2499.00, preco_total: 2499.00 }
        ]
      },
      {
        cliente_id: clienteIds[1],
        numero_venda: 'V000002',
        subtotal: 299.90,
        desconto: 0,
        total: 299.90,
        forma_pagamento: 'cartao_credito',
        status: 'pago',
        itens: [
          { produto_id: produtoIds[1], quantidade: 1, preco_unitario: 299.90, preco_total: 299.90 }
        ]
      }
    ];

    for (const venda of vendas) {
      const [vendaResult] = await query(
        `INSERT INTO vendas (
          tenant_id, cliente_id, usuario_id, numero_venda, subtotal, desconto, total,
          forma_pagamento, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          tenantId, venda.cliente_id, 1, venda.numero_venda, venda.subtotal,
          venda.desconto, venda.total, venda.forma_pagamento, venda.status
        ]
      );

      // Inserir itens da venda
      for (const item of venda.itens) {
        await query(
          `INSERT INTO venda_itens (venda_id, produto_id, quantidade, preco_unitario, preco_total)
           VALUES (?, ?, ?, ?, ?)`,
          [vendaResult.insertId, item.produto_id, item.quantidade, item.preco_unitario, item.preco_total]
        );
      }
    }

    // Criar algumas transações financeiras
    console.log('💳 Criando transações financeiras...');
    const transacoes = [
      {
        tipo: 'entrada',
        categoria: 'Vendas',
        descricao: 'Venda - João Silva',
        valor: 2499.00,
        data_transacao: '2024-01-18',
        metodo_pagamento: 'pix',
        conta: 'caixa',
        cliente_id: clienteIds[0],
        status: 'concluida'
      },
      {
        tipo: 'entrada',
        categoria: 'Vendas',
        descricao: 'Venda - Maria Santos',
        valor: 299.90,
        data_transacao: '2024-01-17',
        metodo_pagamento: 'cartao_credito',
        conta: 'banco_principal',
        cliente_id: clienteIds[1],
        status: 'concluida'
      },
      {
        tipo: 'saida',
        categoria: 'Compras',
        descricao: 'Compra de estoque - Smartphones',
        valor: 15000.00,
        data_transacao: '2024-01-15',
        metodo_pagamento: 'transferencia',
        conta: 'banco_principal',
        fornecedor: 'Fornecedor Tech Ltda',
        status: 'concluida'
      }
    ];

    for (const transacao of transacoes) {
      await query(
        `INSERT INTO transacoes (
          tenant_id, tipo, categoria, descricao, valor, data_transacao,
          metodo_pagamento, conta, fornecedor, cliente_id, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          tenantId, transacao.tipo, transacao.categoria, transacao.descricao,
          transacao.valor, transacao.data_transacao, transacao.metodo_pagamento,
          transacao.conta, transacao.fornecedor, transacao.cliente_id, transacao.status
        ]
      );
    }

    // Criar métodos de pagamento
    console.log('💳 Criando métodos de pagamento...');
    const metodosPagamento = [
      {
        tipo: 'dinheiro',
        nome: 'Dinheiro',
        taxa: 0,
        ativo: true,
        ordem: 1
      },
      {
        tipo: 'pix',
        nome: 'PIX',
        taxa: 0,
        ativo: true,
        ordem: 2
      },
      {
        tipo: 'cartao_credito',
        nome: 'Cartão de Crédito',
        taxa: 0,
        ativo: true,
        ordem: 3
      },
      {
        tipo: 'cartao_debito',
        nome: 'Cartão de Débito',
        taxa: 0,
        ativo: true,
        ordem: 4
      },
      {
        tipo: 'transferencia',
        nome: 'Transferência Bancária',
        taxa: 0,
        ativo: true,
        ordem: 5
      }
    ];

    const metodoIds = {};
    for (const metodo of metodosPagamento) {
      const [result] = await query(
        `INSERT INTO metodos_pagamento (tenant_id, tipo, nome, taxa, ativo, ordem)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [tenantId, metodo.tipo, metodo.nome, metodo.taxa, metodo.ativo, metodo.ordem]
      );
      metodoIds[metodo.tipo] = result.insertId;
    }

    // Criar parcelas para cartão de crédito
    console.log('📊 Criando parcelas para cartão de crédito...');
    const parcelasCredito = [
      { quantidade: 1, taxa: 0 },
      { quantidade: 2, taxa: 0 },
      { quantidade: 3, taxa: 2.5 },
      { quantidade: 4, taxa: 3.0 },
      { quantidade: 5, taxa: 3.5 },
      { quantidade: 6, taxa: 4.0 },
      { quantidade: 10, taxa: 5.0 },
      { quantidade: 12, taxa: 6.0 }
    ];

    for (const parcela of parcelasCredito) {
      await query(
        `INSERT INTO metodos_pagamento_parcelas (metodo_pagamento_id, quantidade, taxa, ativo)
         VALUES (?, ?, ?, ?)`,
        [metodoIds.cartao_credito, parcela.quantidade, parcela.taxa, true]
      );
    }

    // Criar configurações do tenant
    console.log('⚙️  Criando configurações...');
    const configuracoes = [
      { chave: 'catalogo_publico', valor: 'true', tipo: 'boolean' },
      { chave: 'catalogo_titulo', valor: 'Catálogo da Loja Exemplo', tipo: 'string' },
      { chave: 'catalogo_descricao', valor: 'Confira nossos produtos e ofertas especiais', tipo: 'string' },
      { chave: 'nfe_ambiente', valor: 'homologacao', tipo: 'string' },
      { chave: 'nfe_serie', valor: '001', tipo: 'string' }
    ];

    for (const config of configuracoes) {
      await query(
        `INSERT INTO tenant_configuracoes (tenant_id, chave, valor, tipo)
         VALUES (?, ?, ?, ?)`,
        [tenantId, config.chave, config.valor, config.tipo]
      );
    }

    console.log('✅ Seed concluído com sucesso!');
    console.log('📊 Dados de exemplo criados:');
    console.log(`   - 1 tenant: Loja Exemplo Ltda`);
    console.log(`   - 1 usuário admin: admin@lojaexemplo.com.br (senha: admin123)`);
    console.log(`   - ${categorias.length} categorias`);
    console.log(`   - ${produtos.length} produtos`);
    console.log(`   - ${clientes.length} clientes`);
    console.log(`   - ${vendas.length} vendas`);
    console.log(`   - ${transacoes.length} transações`);
    console.log(`   - ${metodosPagamento.length} métodos de pagamento`);
    console.log(`   - ${parcelasCredito.length} parcelas para cartão de crédito`);
    console.log(`   - ${configuracoes.length} configurações`);

  } catch (error) {
    console.error('❌ Erro durante o seed:', error);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase();
}

export default seedDatabase;
