// Script de teste para verificar se o estoque está sendo salvo como inteiro
import { query, testConnection } from './src/database/connection.js';

async function testEstoqueInteiro() {
  try {
    console.log('🧪 Testando se o estoque está sendo salvo como inteiro...');
    
    // Testar conexão
    const connected = await testConnection();
    if (!connected) {
      console.error('❌ Não foi possível conectar ao banco de dados');
      return;
    }

    // Verificar estrutura da tabela produtos
    console.log('📋 Verificando estrutura da tabela produtos...');
    const [columns] = await query("SHOW COLUMNS FROM produtos WHERE Field IN ('estoque', 'estoque_minimo')");
    
    console.log('Colunas encontradas:');
    columns.forEach(col => {
      console.log(`- ${col.Field}: ${col.Type} (Default: ${col.Default})`);
    });

    // Verificar se os campos são INT
    const estoqueColumn = columns.find(col => col.Field === 'estoque');
    const estoqueMinimoColumn = columns.find(col => col.Field === 'estoque_minimo');

    if (estoqueColumn && estoqueColumn.Type.includes('int')) {
      console.log('✅ Campo estoque está como INT');
    } else {
      console.log('❌ Campo estoque NÃO está como INT');
    }

    if (estoqueMinimoColumn && estoqueMinimoColumn.Type.includes('int')) {
      console.log('✅ Campo estoque_minimo está como INT');
    } else {
      console.log('❌ Campo estoque_minimo NÃO está como INT');
    }

    // Testar inserção de produto com valores decimais
    console.log('\n🧪 Testando inserção com valores decimais...');
    
    const testProduto = {
      tenant_id: 1,
      nome: 'Produto Teste Estoque',
      preco: 10.50,
      estoque: 100.75, // Valor decimal
      estoque_minimo: 5.25 // Valor decimal
    };

    console.log('Dados de teste:', testProduto);

    // Inserir produto de teste
    const result = await query(
      `INSERT INTO produtos (tenant_id, nome, preco, estoque, estoque_minimo, status) 
       VALUES (?, ?, ?, ?, ?, 'ativo')`,
      [testProduto.tenant_id, testProduto.nome, testProduto.preco, testProduto.estoque, testProduto.estoque_minimo]
    );

    const produtoId = result.insertId;
    console.log(`✅ Produto inserido com ID: ${produtoId}`);

    // Verificar como foi salvo
    const [produtoSalvo] = await query(
      'SELECT id, nome, estoque, estoque_minimo FROM produtos WHERE id = ?',
      [produtoId]
    );

    console.log('Produto salvo no banco:');
    console.log(`- ID: ${produtoSalvo.id}`);
    console.log(`- Nome: ${produtoSalvo.nome}`);
    console.log(`- Estoque: ${produtoSalvo.estoque} (tipo: ${typeof produtoSalvo.estoque})`);
    console.log(`- Estoque Mínimo: ${produtoSalvo.estoque_minimo} (tipo: ${typeof produtoSalvo.estoque_minimo})`);

    // Verificar se os valores foram arredondados
    if (produtoSalvo.estoque === 101) {
      console.log('✅ Estoque foi arredondado corretamente (100.75 → 101)');
    } else {
      console.log('❌ Estoque NÃO foi arredondado corretamente');
    }

    if (produtoSalvo.estoque_minimo === 5) {
      console.log('✅ Estoque mínimo foi arredondado corretamente (5.25 → 5)');
    } else {
      console.log('❌ Estoque mínimo NÃO foi arredondado corretamente');
    }

    // Limpar produto de teste
    await query('DELETE FROM produtos WHERE id = ?', [produtoId]);
    console.log('🧹 Produto de teste removido');

    console.log('\n✅ Teste concluído com sucesso!');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar teste se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  testEstoqueInteiro();
}

export default testEstoqueInteiro;
