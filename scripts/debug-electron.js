const { spawn } = require('child_process');
const path = require('path');
const http = require('http');

console.log('🔍 Debug Electron - Iniciando...\n');

// Verificar se o build do frontend existe
const frontendDist = path.join(__dirname, '../Frontend/dist');
const fs = require('fs');

if (!fs.existsSync(frontendDist)) {
  console.log('❌ Frontend não foi buildado. Execute: npm run build:frontend');
  process.exit(1);
}

// Verificar se o backend já está rodando
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
  console.log('📦 Iniciando Backend...');
  
  const backendProcess = spawn('npm', ['start'], {
    cwd: path.join(__dirname, '../Backend'),
    stdio: 'pipe',
    shell: true
  });

  backendProcess.stdout.on('data', (data) => {
    const output = data.toString().trim();
    if (output) {
      console.log(`[Backend] ${output}`);
    }
  });

  backendProcess.stderr.on('data', (data) => {
    const output = data.toString().trim();
    if (output && !output.includes('EADDRINUSE')) {
      console.log(`[Backend Error] ${output}`);
    }
  });

  return backendProcess;
}

// Função para iniciar o Electron com logs detalhados
function startElectron() {
  console.log('🖥️ Iniciando Electron com debug...');
  
  const electronProcess = spawn('npx', ['electron', '.', '--enable-logging'], {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      ELECTRON_ENABLE_LOGGING: '1',
      DEBUG: '*'
    }
  });

  electronProcess.on('close', (code) => {
    console.log(`[Electron] Processo finalizado com código ${code}`);
  });

  return electronProcess;
}

// Função para limpar processos
function cleanup() {
  console.log('\n🛑 Finalizando processos...');
  if (backendProcess) {
    backendProcess.kill();
    console.log('✅ Backend finalizado');
  }
  if (electronProcess) {
    electronProcess.kill();
    console.log('✅ Electron finalizado');
  }
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
    console.log('🔍 Verificando se o backend já está rodando...');
    const isBackendRunning = await checkBackendRunning();
    
    if (isBackendRunning) {
      console.log('✅ Backend já está rodando na porta 3000');
    } else {
      console.log('📦 Backend não está rodando, iniciando...');
      backendProcess = startBackend();
      
      // Aguardar o backend iniciar
      console.log('⏳ Aguardando backend iniciar...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    // Iniciar Electron
    electronProcess = startElectron();
    
    console.log('🎉 KontrollaPro Desktop iniciado com debug!');
    console.log('💡 Pressione Ctrl+C para finalizar');
    console.log('🔍 Verifique o console do Electron para logs detalhados');

  } catch (error) {
    console.error(`❌ Erro ao iniciar: ${error.message}`);
    cleanup();
  }
}

// Executar função principal
main();
