const mysql = require('mysql2/promise');

async function checkAndCreateTables() {
  let connection;
  
  try {
    // Conectar ao banco
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'kontrollapro'
    });

    console.log('Conectado ao banco de dados...');

    // Verificar se as tabelas existem
    const [pixTables] = await connection.execute("SHOW TABLES LIKE 'pix_configuracoes'");
    const [bancariosTables] = await connection.execute("SHOW TABLES LIKE 'dados_bancarios'");

    console.log('Status das tabelas:');
    console.log('- pix_configuracoes:', pixTables.length > 0 ? 'EXISTE' : 'NÃO EXISTE');
    console.log('- dados_bancarios:', bancariosTables.length > 0 ? 'EXISTE' : 'NÃO EXISTE');

    // Se alguma tabela não existir, executar o schema
    if (pixTables.length === 0 || bancariosTables.length === 0) {
      console.log('\nExecutando criação das tabelas...');
      
      // Ler o arquivo schema.sql
      const fs = require('fs');
      const path = require('path');
      const schemaPath = path.join(__dirname, 'src', 'database', 'schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf8');
      
      // Executar o schema
      await connection.execute(schema);
      
      console.log('Tabelas criadas com sucesso!');
      
      // Verificar novamente
      const [pixTablesAfter] = await connection.execute("SHOW TABLES LIKE 'pix_configuracoes'");
      const [bancariosTablesAfter] = await connection.execute("SHOW TABLES LIKE 'dados_bancarios'");
      
      console.log('\nStatus após criação:');
      console.log('- pix_configuracoes:', pixTablesAfter.length > 0 ? 'EXISTE' : 'NÃO EXISTE');
      console.log('- dados_bancarios:', bancariosTablesAfter.length > 0 ? 'EXISTE' : 'NÃO EXISTE');
    } else {
      console.log('\nTodas as tabelas já existem!');
    }

  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\nConexão encerrada.');
    }
  }
}

checkAndCreateTables();
