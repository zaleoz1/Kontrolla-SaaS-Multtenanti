import { query, testConnection } from './connection.js';

async function testDiasVencimento() {
  try {
    console.log('🧪 Testando cálculo de dias de vencimento...');

    // Testar conexão
    const connected = await testConnection();
    if (!connected) {
      console.error('❌ Não foi possível conectar ao banco de dados');
      process.exit(1);
    }

    // Buscar contas a receber com diferentes status
    const contas = await query(`
      SELECT 
        cr.id, cr.descricao, cr.data_vencimento, cr.status,
        c.nome as cliente_nome
      FROM contas_receber cr
      LEFT JOIN clientes c ON cr.cliente_id = c.id
      WHERE cr.tenant_id = 1
      ORDER BY cr.data_vencimento ASC
    `);
    
    console.log(`\n📋 Contas a receber encontradas: ${contas.length}`);
    
    contas.forEach(conta => {
      const hoje = new Date();
      const vencimento = new Date(conta.data_vencimento);
      const diffTime = vencimento.getTime() - hoje.getTime();
      const dias = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      let textoDias;
      if (dias > 0) {
        textoDias = `${dias} dia${dias > 1 ? 's' : ''} para vencer`;
      } else if (dias === 0) {
        textoDias = 'Vence hoje';
      } else {
        textoDias = `${Math.abs(dias)} dia${Math.abs(dias) > 1 ? 's' : ''} em atraso`;
      }
      
      const cor = dias > 0 ? 'azul' : dias === 0 ? 'laranja' : 'vermelho';
      
      console.log(`\n📄 Conta #${conta.id}:`);
      console.log(`   Cliente: ${conta.cliente_nome || 'N/A'}`);
      console.log(`   Descrição: ${conta.descricao}`);
      console.log(`   Vencimento: ${conta.data_vencimento}`);
      console.log(`   Status: ${conta.status}`);
      console.log(`   Dias: ${dias} (${textoDias}) - Cor: ${cor}`);
    });

    // Testar casos específicos
    console.log('\n🔍 Testando casos específicos:');
    
    // Data de hoje
    const hoje = new Date().toISOString().split('T')[0];
    console.log(`   Hoje: ${hoje} (0 dias)`);
    
    // Data de amanhã
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);
    const amanhaStr = amanha.toISOString().split('T')[0];
    console.log(`   Amanhã: ${amanhaStr} (1 dia para vencer)`);
    
    // Data de ontem
    const ontem = new Date();
    ontem.setDate(ontem.getDate() - 1);
    const ontemStr = ontem.toISOString().split('T')[0];
    console.log(`   Ontem: ${ontemStr} (1 dia em atraso)`);

    console.log('\n✅ Teste concluído!');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  testDiasVencimento();
}

export default testDiasVencimento;
