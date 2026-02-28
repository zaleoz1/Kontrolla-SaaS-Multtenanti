import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  let connection;
  try {
    console.log('🔄 Iniciando migração do banco de dados...');

    // Configuração sem database para criar o banco primeiro
    const dbConfigWithoutDB = {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '12435687',
      multipleStatements: true,
      charset: 'utf8mb4'
    };

    // Conectar sem banco de dados
    console.log('🔗 Conectando ao MySQL...');
    connection = await mysql.createConnection(dbConfigWithoutDB);
    console.log('✅ Conexão com MySQL estabelecida com sucesso');

    // Ler arquivo de schema
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Executar schema (inclui CREATE DATABASE e USE)
    console.log('📝 Executando schema do banco de dados...');
    await connection.query(schema);
    console.log('✅ Schema executado com sucesso!');

    // Aplicar migrações incrementais (se existirem)
    const migrationsDir = path.join(__dirname, 'migrations');
    if (fs.existsSync(migrationsDir)) {
      console.log('🧩 Verificando migrações incrementais...');

      // Tabela de controle de migrações
      await connection.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          filename VARCHAR(255) PRIMARY KEY,
          applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      const files = fs
        .readdirSync(migrationsDir)
        .filter((f) => f.endsWith('.sql'))
        .sort();

      for (const file of files) {
        const [rows] = await connection.query(
          'SELECT filename FROM schema_migrations WHERE filename = ? LIMIT 1',
          [file]
        );
        if (Array.isArray(rows) && rows.length > 0) {
          continue; // já aplicada
        }

        const filePath = path.join(migrationsDir, file);
        const sql = fs.readFileSync(filePath, 'utf8');
        console.log(`➡️ Aplicando migração: ${file}`);
        await connection.query(sql);
        await connection.query('INSERT INTO schema_migrations (filename) VALUES (?)', [file]);
        console.log(`✅ Migração aplicada: ${file}`);
      }
    }

    console.log('✅ Migração concluída com sucesso!');
    console.log('📊 Banco de dados criado e configurado');
    
  } catch (error) {
    console.error('❌ Erro durante a migração:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔒 Conexão fechada');
    }
  }
}

// Executar se chamado diretamente
const isMainModule = import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/').split('/').pop());
if (isMainModule) {
  runMigrations().then(() => {
    process.exit(0);
  }).catch((err) => {
    console.error('Erro fatal:', err);
    process.exit(1);
  });
}

export default runMigrations;
