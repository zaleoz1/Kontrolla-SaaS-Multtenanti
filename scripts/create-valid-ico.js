const icongen = require('icon-gen');
const path = require('path');
const fs = require('fs');

console.log('🎨 Criando ícone ICO válido com icon-gen...');

const inputPath = path.join(__dirname, '../Frontend/dist/logo.png');
const outputDir = path.join(__dirname, '../assets');

// Verificar se o arquivo de entrada existe
if (!fs.existsSync(inputPath)) {
  console.error('❌ Arquivo PNG não encontrado:', inputPath);
  process.exit(1);
}

// Criar diretório de saída se não existir
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function createIcon() {
  try {
    console.log('📂 Entrada:', inputPath);
    console.log('📂 Saída:', outputDir);
    
    const options = {
      modes: ['ico'],
      names: {
        ico: 'app'
      },
      ico: {
        sizes: [16, 24, 32, 48, 64, 128, 256]
      }
    };
    
    const results = await icongen(inputPath, outputDir, options);
    
    console.log('✅ Ícone ICO criado com sucesso!');
    console.log('📁 Arquivo gerado:', results);
    
  } catch (error) {
    console.error('❌ Erro ao criar ícone:', error);
    process.exit(1);
  }
}

createIcon();
