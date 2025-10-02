const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

console.log('🎨 Criando ícones do aplicativo a partir da logo original...');

const logoPath = path.join(__dirname, '../Frontend/dist/logo.png');
const assetsPath = path.join(__dirname, '../assets');

// Verificar se a logo existe
if (!fs.existsSync(logoPath)) {
  console.error('❌ Logo não encontrada em:', logoPath);
  console.log('💡 Execute primeiro: npm run build:frontend');
  process.exit(1);
}

// Criar diretório assets se não existir
if (!fs.existsSync(assetsPath)) {
  fs.mkdirSync(assetsPath, { recursive: true });
}

async function createIcons() {
  try {
    // Ler a logo original
    const logoBuffer = fs.readFileSync(logoPath);
    
    // Criar apenas os ícones necessários para o Electron Builder
    console.log('📱 Criando ícone ICO para Windows...');
    await sharp(logoBuffer)
      .resize(256, 256)
      .png()
      .toFile(path.join(assetsPath, 'icon.ico'));
    
    console.log('🍎 Criando ícone PNG para macOS/Linux...');
    await sharp(logoBuffer)
      .resize(512, 512)
      .png()
      .toFile(path.join(assetsPath, 'icon.png'));
    
    console.log('✅ Ícones criados com sucesso!');
    console.log('📁 Localização:', assetsPath);
    console.log('🎯 Formatos: ICO (Windows), PNG (macOS/Linux)');
    
  } catch (error) {
    console.error('❌ Erro ao criar ícones:', error);
    process.exit(1);
  }
}

createIcons();
