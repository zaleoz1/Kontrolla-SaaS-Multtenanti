const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const http = require('http');

console.log('🚀 KontrollaPro Desktop - Iniciando...\n');

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

// Verificar se o build do frontend existe
const frontendDist = path.join(__dirname, '../Frontend/dist');
if (!fs.existsSync(frontendDist)) {
  log(colors.red, '❌ Frontend não foi buildado.');
  log(colors.yellow, '💡 Execute: npm run build:frontend');
  process.exit(1);
}

// Verificar se o backend existe
const backendPath = path.join(__dirname, '../Backend');
if (!fs.existsSync(backendPath)) {
  log(colors.red, '❌ Backend não encontrado.');
  process.exit(1);
}

// Função para verificar se o backend já está rodando
async function checkBackendRunning() {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:3000/health', (res) => {
      resolve(true);
    });
    
    req.on('error', () => {
      resolve(false);
    });
    
    req.setTimeout(2000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

// Função para iniciar o backend
function startBackend() {
  log(colors.blue, '📦 Iniciando Backend...');
  
  const backendProcess = spawn('npm', ['start'], {
    cwd: backendPath,
    stdio: 'pipe',
    shell: true
  });

  backendProcess.stdout.on('data', (data) => {
    const output = data.toString().trim();
    if (output) {
      log(colors.green, `[Backend] ${output}`);
    }
  });

  backendProcess.stderr.on('data', (data) => {
    const output = data.toString().trim();
    if (output && !output.includes('EADDRINUSE')) {
      log(colors.red, `[Backend Error] ${output}`);
    }
  });

  backendProcess.on('close', (code) => {
    if (code !== 0) {
      log(colors.red, `[Backend] Processo finalizado com código ${code}`);
    }
  });

  return backendProcess;
}

// Função para iniciar o Electron
function startElectron() {
  log(colors.magenta, '🖥️ Iniciando Electron...');
  
  const electronProcess = spawn('npx', ['electron', '.'], {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit',
    shell: true
  });

  electronProcess.on('close', (code) => {
    log(colors.cyan, `[Electron] Processo finalizado com código ${code}`);
  });

  return electronProcess;
}

// Função para limpar processos
function cleanup() {
  log(colors.yellow, '\n🛑 Finalizando processos...');
  if (backendProcess) {
    backendProcess.kill();
    log(colors.yellow, '✅ Backend finalizado');
  }
  if (electronProcess) {
    electronProcess.kill();
    log(colors.yellow, '✅ Electron finalizado');
  }
  log(colors.green, '🎉 KontrollaPro Desktop finalizado');
  process.exit(0);
}

// Handlers para finalização
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);

let backendProcess;
let electronProcess;

async function main() {
  try {
    // Verificar se o backend já está rodando
    log(colors.blue, '🔍 Verificando se o backend já está rodando...');
    const isBackendRunning = await checkBackendRunning();
    
    if (isBackendRunning) {
      log(colors.green, '✅ Backend já está rodando na porta 3000');
    } else {
      log(colors.yellow, '📦 Backend não está rodando, iniciando...');
      backendProcess = startBackend();
      
      // Aguardar o backend iniciar
      log(colors.blue, '⏳ Aguardando backend iniciar...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    // Iniciar Electron
    electronProcess = startElectron();
    
    log(colors.green, '🎉 KontrollaPro Desktop iniciado com sucesso!');
    log(colors.cyan, '💡 Pressione Ctrl+C para finalizar');

  } catch (error) {
    log(colors.red, `❌ Erro ao iniciar: ${error.message}`);
    cleanup();
  }
}

// Executar função principal
main();
