import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query, testConnection } from './connection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  try {
    console.log('🔄 Iniciando migração do banco de dados...');

    // Testar conexão
    const connected = await testConnection();
    if (!connected) {
      console.error('❌ Não foi possível conectar ao banco de dados');
      process.exit(1);
    }

    // Ler arquivo de schema
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Executar schema
    console.log('📝 Executando schema do banco de dados...');
    await query(schema);

    // Verificar se precisa executar migração adicional para funcionários
    try {
      console.log('🔍 Verificando se precisa executar migração de funcionários...');
      const [columns] = await query("SHOW COLUMNS FROM contas_pagar LIKE 'funcionario_id'");
      
      if (columns.length === 0) {
        console.log('📝 Executando migração adicional para funcionários...');
        const migrationPath = path.join(__dirname, 'migration_funcionarios_contas_pagar.sql');
        const migration = fs.readFileSync(migrationPath, 'utf8');
        await query(migration);
        console.log('✅ Migração de funcionários concluída!');
      } else {
        console.log('✅ Migração de funcionários já aplicada!');
      }
    } catch (migrationError) {
      console.log('⚠️ Erro na migração de funcionários (pode ser normal se já aplicada):', migrationError.message);
    }

    // Verificar se precisa executar migração de pagamentos a prazo para contas a receber
    try {
      console.log('🔍 Verificando se precisa executar migração de pagamentos a prazo...');
      const [tables] = await query("SHOW TABLES LIKE 'venda_pagamentos_prazo'");
      
      if (tables.length > 0) {
        console.log('📝 Executando migração de pagamentos a prazo para contas a receber...');
        const migrationPath = path.join(__dirname, 'migration_prazo_to_contas_receber.sql');
        const migration = fs.readFileSync(migrationPath, 'utf8');
        await query(migration);
        console.log('✅ Migração de pagamentos a prazo concluída!');
      } else {
        console.log('✅ Migração de pagamentos a prazo já aplicada!');
      }
    } catch (migrationError) {
      console.log('⚠️ Erro na migração de pagamentos a prazo (pode ser normal se já aplicada):', migrationError.message);
    }

    // Verificar se precisa executar migração de venda_id na tabela transacoes
    try {
      console.log('🔍 Verificando se precisa executar migração de venda_id em transacoes...');
      const [columns] = await query("SHOW COLUMNS FROM transacoes LIKE 'venda_id'");
      
      if (columns.length === 0) {
        console.log('📝 Executando migração de venda_id em transacoes...');
        const { default: migrateVendaIdTransacoes } = await import('./migrate_venda_id_transacoes.js');
        await migrateVendaIdTransacoes();
        console.log('✅ Migração de venda_id em transacoes concluída!');
      } else {
        console.log('✅ Migração de venda_id em transacoes já aplicada!');
      }
    } catch (migrationError) {
      console.log('⚠️ Erro na migração de venda_id em transacoes (pode ser normal se já aplicada):', migrationError.message);
    }

    // Verificar se precisa executar migração de estoque decimal para inteiro
    try {
      console.log('🔍 Verificando se precisa executar migração de estoque decimal...');
      const [columns] = await query("SHOW COLUMNS FROM produtos WHERE Field = 'estoque' AND Type LIKE '%decimal%'");
      
      if (columns.length > 0) {
        console.log('📝 Executando migração de estoque decimal para inteiro...');
        const migrationPath = path.join(__dirname, 'migrate_estoque_decimal.sql');
        const migration = fs.readFileSync(migrationPath, 'utf8');
        await query(migration);
        console.log('✅ Migração de estoque decimal concluída!');
      } else {
        console.log('✅ Migração de estoque decimal já aplicada!');
      }
    } catch (migrationError) {
      console.log('⚠️ Erro na migração de estoque decimal (pode ser normal se já aplicada):', migrationError.message);
    }

    console.log('✅ Migração concluída com sucesso!');
    console.log('📊 Banco de dados criado e configurado');
    
  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations();
}

export default runMigrations;
