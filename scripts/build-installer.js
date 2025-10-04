const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🏗️  Testando build do instalador com interface gráfica...\n');

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

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

// Verificar pré-requisitos
function checkPrerequisites() {
  log(colors.blue, '🔍 Verificando pré-requisitos...');
  
  // Verificar se os ícones existem
  const iconPath = path.join(__dirname, '../assets/icon.ico');
  if (!fs.existsSync(iconPath)) {
    log(colors.red, '❌ Ícone não encontrado. Execute: npm run apply:icon');
    return false;
  }
  
  // Verificar se o frontend foi buildado
  const frontendDist = path.join(__dirname, '../Frontend/dist');
  if (!fs.existsSync(frontendDist)) {
    log(colors.red, '❌ Frontend não foi buildado. Execute: npm run build:frontend');
    return false;
  }
  
  // Verificar se o backend está preparado
  const backendPath = path.join(__dirname, '../Backend/package.json');
  if (!fs.existsSync(backendPath)) {
    log(colors.red, '❌ Backend não encontrado.');
    return false;
  }
  
  log(colors.green, '✅ Todos os pré-requisitos atendidos');
  return true;
}

// Função para fazer o build do instalador
function buildInstaller() {
  log(colors.magenta, '🚀 Iniciando build do instalador...');
  
  const buildProcess = spawn('npm', ['run', 'dist:win'], {
    cwd: path.join(__dirname, '..'),
    stdio: 'pipe',
    shell: true
  });

  buildProcess.stdout.on('data', (data) => {
    const output = data.toString().trim();
    if (output) {
      if (output.includes('error') || output.includes('ERROR')) {
        log(colors.red, `[Build] ${output}`);
      } else if (output.includes('warn') || output.includes('WARN')) {
        log(colors.yellow, `[Build] ${output}`);
      } else {
        log(colors.cyan, `[Build] ${output}`);
      }
    }
  });

  buildProcess.stderr.on('data', (data) => {
    const output = data.toString().trim();
    if (output && !output.includes('SKIPPING')) {
      log(colors.yellow, `[Build Warning] ${output}`);
    }
  });

  buildProcess.on('close', (code) => {
    if (code === 0) {
      log(colors.green, '\n✅ Instalador criado com sucesso!');
      log(colors.cyan, '📁 Localização: dist-electron/');
      
      // Listar arquivos gerados
      const distPath = path.join(__dirname, '../dist-electron');
      if (fs.existsSync(distPath)) {
        log(colors.blue, '\n📋 Arquivos gerados:');
        const files = fs.readdirSync(distPath);
        files.forEach(file => {
          const filePath = path.join(distPath, file);
          const stats = fs.statSync(filePath);
          const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
          log(colors.cyan, `   📦 ${file} (${sizeInMB} MB)`);
        });
      }
      
      log(colors.green, '\n🎉 Build concluído! O instalador possui:');
      log(colors.cyan, '   ✨ Interface gráfica moderna');
      log(colors.cyan, '   🔒 Solicita permissões de administrador');
      log(colors.cyan, '   📱 Atalhos na área de trabalho e menu iniciar');
      log(colors.cyan, '   🗂️  Associação de arquivos .kontrolla');
      log(colors.cyan, '   🌐 Protocolo personalizado kontrollapro://');
      log(colors.cyan, '   🛡️  Configurações de firewall automáticas');
      
    } else {
      log(colors.red, `\n❌ Erro no build (código ${code})`);
      log(colors.yellow, '💡 Verifique se todas as dependências estão instaladas');
    }
  });

  return buildProcess;
}

// Função principal
async function main() {
  try {
    if (!checkPrerequisites()) {
      process.exit(1);
    }
    
    log(colors.green, '\n🎯 Configurações do instalador:');
    log(colors.cyan, '   📝 Interface: NSIS com Modern UI 2');
    log(colors.cyan, '   🔐 Permissões: Administrador obrigatório');
    log(colors.cyan, '   🌍 Idioma: Português do Brasil');
    log(colors.cyan, '   📦 Tipo: Instalação por máquina (todos os usuários)');
    log(colors.cyan, '   🔧 GUID: 550e8400-e29b-41d4-a716-446655440000');
    
    log(colors.blue, '\n⏳ Aguarde enquanto o instalador é criado...');
    
    buildInstaller();
    
  } catch (error) {
    log(colors.red, `❌ Erro inesperado: ${error.message}`);
    process.exit(1);
  }
}

// Executar
main();