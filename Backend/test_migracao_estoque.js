#!/usr/bin/env node

// Script de teste completo para verificar a migração do estoque
import { query, testConnection } from './src/database/connection.js';

// Cores para output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logHeader(message) {
  log(`\n${colors.bright}${colors.cyan}=== ${message} ===${colors.reset}\n`);
}

async function testDatabaseConnection() {
  logHeader('TESTANDO CONEXÃO COM BANCO DE DADOS');
  
  try {
    const connected = await testConnection();
    if (connected) {
      logSuccess('Conexão com banco de dados estabelecida');
      return true;
    } else {
      logError('Falha na conexão com banco de dados');
      return false;
    }
  } catch (error) {
    logError(`Erro na conexão: ${error.message}`);
    return false;
  }
}

async function testTableStructure() {
  logHeader('VERIFICANDO ESTRUTURA DA TABELA PRODUTOS');
  
  try {
    // Verificar se a tabela produtos existe
    const [tables] = await query("SHOW TABLES LIKE 'produtos'");
    if (tables.length === 0) {
      logError('Tabela produtos não encontrada');
      return false;
    }
    logSuccess('Tabela produtos encontrada');

    // Verificar estrutura dos campos de estoque
    const [columns] = await query("SHOW COLUMNS FROM produtos WHERE Field IN ('estoque', 'estoque_minimo')");
    
    logInfo('Campos de estoque encontrados:');
    columns.forEach(col => {
      const status = col.Type.includes('int') ? '✅' : '❌';
      log(`${status} ${col.Field}: ${col.Type} (Default: ${col.Default})`);
    });

    // Verificar se os campos são INT
    const estoqueColumn = columns.find(col => col.Field === 'estoque');
    const estoqueMinimoColumn = columns.find(col => col.Field === 'estoque_minimo');

    let allCorrect = true;

    if (estoqueColumn && estoqueColumn.Type.includes('int')) {
      logSuccess('Campo estoque está como INT');
    } else {
      logError('Campo estoque NÃO está como INT');
      allCorrect = false;
    }

    if (estoqueMinimoColumn && estoqueMinimoColumn.Type.includes('int')) {
      logSuccess('Campo estoque_minimo está como INT');
    } else {
      logError('Campo estoque_minimo NÃO está como INT');
      allCorrect = false;
    }

    return allCorrect;
  } catch (error) {
    logError(`Erro ao verificar estrutura: ${error.message}`);
    return false;
  }
}

async function testDataInsertion() {
  logHeader('TESTANDO INSERÇÃO DE DADOS COM VALORES DECIMAIS');
  
  try {
    // Dados de teste com valores decimais
    const testProduto = {
      tenant_id: 1,
      nome: 'Produto Teste Migração',
      preco: 15.75,
      estoque: 150.25, // Valor decimal
      estoque_minimo: 10.75 // Valor decimal
    };

    logInfo(`Dados de teste: ${JSON.stringify(testProduto, null, 2)}`);

    // Inserir produto de teste
    const result = await query(
      `INSERT INTO produtos (tenant_id, nome, preco, estoque, estoque_minimo, status) 
       VALUES (?, ?, ?, ?, ?, 'ativo')`,
      [testProduto.tenant_id, testProduto.nome, testProduto.preco, testProduto.estoque, testProduto.estoque_minimo]
    );

    const produtoId = result.insertId;
    logSuccess(`Produto inserido com ID: ${produtoId}`);

    // Verificar como foi salvo
    const [produtoSalvo] = await query(
      'SELECT id, nome, preco, estoque, estoque_minimo FROM produtos WHERE id = ?',
      [produtoId]
    );

    logInfo('Produto salvo no banco:');
    log(`- ID: ${produtoSalvo.id}`);
    log(`- Nome: ${produtoSalvo.nome}`);
    log(`- Preço: ${produtoSalvo.preco} (tipo: ${typeof produtoSalvo.preco})`);
    log(`- Estoque: ${produtoSalvo.estoque} (tipo: ${typeof produtoSalvo.estoque})`);
    log(`- Estoque Mínimo: ${produtoSalvo.estoque_minimo} (tipo: ${typeof produtoSalvo.estoque_minimo})`);

    // Verificar se os valores foram arredondados corretamente
    let testPassed = true;

    if (produtoSalvo.estoque === 150) {
      logSuccess('Estoque foi arredondado corretamente (150.25 → 150)');
    } else {
      logError(`Estoque NÃO foi arredondado corretamente. Esperado: 150, Recebido: ${produtoSalvo.estoque}`);
      testPassed = false;
    }

    if (produtoSalvo.estoque_minimo === 11) {
      logSuccess('Estoque mínimo foi arredondado corretamente (10.75 → 11)');
    } else {
      logError(`Estoque mínimo NÃO foi arredondado corretamente. Esperado: 11, Recebido: ${produtoSalvo.estoque_minimo}`);
      testPassed = false;
    }

    // Verificar se os valores são inteiros
    if (Number.isInteger(produtoSalvo.estoque)) {
      logSuccess('Estoque é um número inteiro');
    } else {
      logError('Estoque NÃO é um número inteiro');
      testPassed = false;
    }

    if (Number.isInteger(produtoSalvo.estoque_minimo)) {
      logSuccess('Estoque mínimo é um número inteiro');
    } else {
      logError('Estoque mínimo NÃO é um número inteiro');
      testPassed = false;
    }

    // Limpar produto de teste
    await query('DELETE FROM produtos WHERE id = ?', [produtoId]);
    logInfo('Produto de teste removido');

    return testPassed;
  } catch (error) {
    logError(`Erro durante teste de inserção: ${error.message}`);
    return false;
  }
}

async function testExistingData() {
  logHeader('VERIFICANDO DADOS EXISTENTES');
  
  try {
    // Verificar se há produtos existentes
    const [produtos] = await query('SELECT COUNT(*) as total FROM produtos');
    const totalProdutos = produtos[0].total;
    
    logInfo(`Total de produtos no banco: ${totalProdutos}`);

    if (totalProdutos > 0) {
      // Verificar alguns produtos existentes
      const [amostra] = await query('SELECT id, nome, estoque, estoque_minimo FROM produtos LIMIT 5');
      
      logInfo('Amostra de produtos existentes:');
      amostra.forEach(produto => {
        const estoqueInt = Number.isInteger(produto.estoque);
        const estoqueMinimoInt = Number.isInteger(produto.estoque_minimo);
        
        log(`- ${produto.nome}: estoque=${produto.estoque} (${estoqueInt ? 'INT' : 'DECIMAL'}), estoque_minimo=${produto.estoque_minimo} (${estoqueMinimoInt ? 'INT' : 'DECIMAL'})`);
      });

      // Verificar se todos os produtos têm estoque como inteiro
      const [produtosComProblema] = await query(`
        SELECT COUNT(*) as total 
        FROM produtos 
        WHERE estoque != ROUND(estoque) OR estoque_minimo != ROUND(estoque_minimo)
      `);
      
      const problemas = produtosComProblema[0].total;
      
      if (problemas === 0) {
        logSuccess('Todos os produtos existentes têm estoque como números inteiros');
        return true;
      } else {
        logWarning(`${problemas} produtos ainda têm valores decimais no estoque`);
        return false;
      }
    } else {
      logInfo('Nenhum produto existente para verificar');
      return true;
    }
  } catch (error) {
    logError(`Erro ao verificar dados existentes: ${error.message}`);
    return false;
  }
}

async function runMigrationTest() {
  logHeader('INICIANDO TESTE COMPLETO DA MIGRAÇÃO DE ESTOQUE');
  
  const results = {
    connection: false,
    structure: false,
    insertion: false,
    existingData: false
  };

  // Teste 1: Conexão com banco
  results.connection = await testDatabaseConnection();
  if (!results.connection) {
    logError('Falha na conexão. Abortando testes.');
    return;
  }

  // Teste 2: Estrutura da tabela
  results.structure = await testTableStructure();
  if (!results.structure) {
    logError('Estrutura da tabela incorreta. Verifique a migração.');
  }

  // Teste 3: Inserção de dados
  results.insertion = await testDataInsertion();
  if (!results.insertion) {
    logError('Teste de inserção falhou. Verifique o processamento de dados.');
  }

  // Teste 4: Dados existentes
  results.existingData = await testExistingData();

  // Resumo final
  logHeader('RESUMO DOS TESTES');
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  
  logInfo(`Testes executados: ${totalTests}`);
  logInfo(`Testes aprovados: ${passedTests}`);
  logInfo(`Taxa de sucesso: ${Math.round((passedTests / totalTests) * 100)}%`);

  if (passedTests === totalTests) {
    logSuccess('🎉 TODOS OS TESTES PASSARAM! A migração está funcionando corretamente.');
  } else {
    logError('⚠️  ALGUNS TESTES FALHARAM. Verifique os problemas acima.');
  }

  // Detalhes dos resultados
  log('\nDetalhes dos testes:');
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅' : '❌';
    const testName = {
      connection: 'Conexão com banco',
      structure: 'Estrutura da tabela',
      insertion: 'Inserção de dados',
      existingData: 'Dados existentes'
    }[test];
    
    log(`${status} ${testName}`);
  });

  return passedTests === totalTests;
}

// Executar teste se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrationTest()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      logError(`Erro fatal: ${error.message}`);
      process.exit(1);
    });
}

export default runMigrationTest;
