// Teste simples para verificar a migração
import { query, testConnection } from './src/database/connection.js';

console.log('🚀 Iniciando teste simples...');

try {
  // Testar conexão
  console.log('📡 Testando conexão...');
  const connected = await testConnection();
  console.log('Conexão:', connected ? '✅ OK' : '❌ FALHOU');
  
  if (!connected) {
    console.log('❌ Não foi possível conectar ao banco');
    process.exit(1);
  }

  // Verificar estrutura da tabela
  console.log('📋 Verificando estrutura da tabela...');
  const columns = await query("SHOW COLUMNS FROM produtos WHERE Field IN ('estoque', 'estoque_minimo')");
  
  console.log('Campos encontrados:');
  columns.forEach(col => {
    console.log(`- ${col.Field}: ${col.Type}`);
  });

  // Verificar se são INT
  const estoqueColumn = columns.find(col => col.Field === 'estoque');
  const estoqueMinimoColumn = columns.find(col => col.Field === 'estoque_minimo');

  console.log('Estoque é INT:', estoqueColumn?.Type.includes('int') ? '✅ SIM' : '❌ NÃO');
  console.log('Estoque mínimo é INT:', estoqueMinimoColumn?.Type.includes('int') ? '✅ SIM' : '❌ NÃO');

  // Testar inserção
  console.log('🧪 Testando inserção...');
  const result = await query(
    `INSERT INTO produtos (tenant_id, nome, preco, estoque, estoque_minimo, status) 
     VALUES (?, ?, ?, ?, ?, 'ativo')`,
    [1, 'Teste Migração', 10.50, 100.75, 5.25]
  );

  const produtoId = result.insertId;
  console.log('Produto inserido com ID:', produtoId);

  // Verificar como foi salvo
  const produtos = await query(
    'SELECT estoque, estoque_minimo FROM produtos WHERE id = ?',
    [produtoId]
  );
  const produto = produtos[0];

  console.log('Estoque salvo:', produto.estoque, '(tipo:', typeof produto.estoque, ')');
  console.log('Estoque mínimo salvo:', produto.estoque_minimo, '(tipo:', typeof produto.estoque_minimo, ')');

  // Verificar se foram arredondados
  console.log('Arredondamento correto:');
  console.log('- Estoque 100.75 → 101:', produto.estoque === 101 ? '✅' : '❌');
  console.log('- Estoque mínimo 5.25 → 5:', produto.estoque_minimo === 5 ? '✅' : '❌');

  // Limpar
  await query('DELETE FROM produtos WHERE id = ?', [produtoId]);
  console.log('🧹 Produto de teste removido');

  console.log('✅ Teste concluído com sucesso!');

} catch (error) {
  console.error('❌ Erro durante o teste:', error.message);
  process.exit(1);
}
