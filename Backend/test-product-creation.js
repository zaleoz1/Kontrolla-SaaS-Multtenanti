// Usando fetch nativo do Node.js

// Script para testar a criação de produtos
async function testProductCreation() {
  try {
    console.log('🧪 Testando criação de produto...');

    // Primeiro, fazer login para obter o token
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@lojaexemplo.com.br',
        senha: 'admin123'
      })
    });

    if (!loginResponse.ok) {
      console.error('❌ Erro no login:', await loginResponse.text());
      return;
    }

    const loginData = await loginResponse.json();
    const token = loginData.token;

    console.log('✅ Login realizado com sucesso');

    // Dados do produto de teste
    const productData = {
      nome: 'Produto Teste',
      descricao: 'Descrição do produto teste',
      preco: 29.90,
      estoque: 10,
      estoque_minimo: 5,
      status: 'ativo',
      destaque: false,
      imagens: []
    };

    console.log('📦 Dados do produto:', productData);

    // Tentar criar o produto
    const createResponse = await fetch('http://localhost:3000/api/produtos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(productData)
    });

    console.log('📊 Status da resposta:', createResponse.status);

    if (createResponse.ok) {
      const result = await createResponse.json();
      console.log('✅ Produto criado com sucesso:', result);
    } else {
      const error = await createResponse.text();
      console.error('❌ Erro ao criar produto:', error);
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testProductCreation();
