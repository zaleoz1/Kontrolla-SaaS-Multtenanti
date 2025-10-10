const { app, BrowserWindow, Menu, shell, ipcMain, dialog, screen } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const { createServer } = require('http');
const { parse } = require('url');

// Configurações
const isDev = process.env.NODE_ENV === 'development' && !process.env.FORCE_FILE_MODE;
const isProd = process.env.NODE_ENV === 'production' || app.isPackaged;
const forceFileMode = process.env.FORCE_FILE_MODE === 'true';

// MODO HÍBRIDO: Interface desktop + dados na nuvem VPS
const HYBRID_MODE = true; // Forçar modo híbrido
const VPS_API_URL = 'http://207.58.174.116/api';
const VPS_HEALTH_URL = 'http://207.58.174.116/health';

let mainWindow;
let backendProcess = null; // Não usar backend local no modo híbrido
let backendStarted = false;
let isCheckingBackend = false;
let staticServer = null;

// Função para calcular zoom padrão (fixo em 100%)
function calculateResponsiveZoom() {
  return 1.0; // Zoom fixo em 100%
}

// Função para criar servidor estático para arquivos
function createStaticServer() {
  const distPath = path.join(__dirname, '../Frontend/dist');
  
  return createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    let pathname = parsedUrl.pathname;
    
    console.log(`📁 Requisição: ${pathname}`);
    
    // Se for a raiz, servir index.html
    if (pathname === '/') {
      pathname = '/index.html';
    }
    
    const filePath = path.join(distPath, pathname);
    console.log(`📂 Caminho do arquivo: ${filePath}`);
    
    // Verificar se o arquivo existe
    if (fs.existsSync(filePath)) {
      const ext = path.extname(filePath).toLowerCase();
      const mimeTypes = {
        '.html': 'text/html; charset=utf-8',
        '.js': 'text/javascript; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon',
        '.woff': 'font/woff',
        '.woff2': 'font/woff2'
      };
      
      const contentType = mimeTypes[ext] || 'application/octet-stream';
      console.log(`✅ Servindo arquivo: ${pathname} (${contentType})`);
      
      // Adicionar headers CORS para garantir que as imagens sejam carregadas
      res.writeHead(200, { 
        'Content-Type': contentType,
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
      fs.createReadStream(filePath).pipe(res);
    } else {
      console.log(`❌ Arquivo não encontrado: ${pathname}`);
      // Se não encontrar, servir index.html (para SPA)
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        console.log('🔄 Servindo index.html como fallback');
        res.writeHead(200, { 
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-cache'
        });
        fs.createReadStream(indexPath).pipe(res);
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('File not found');
      }
    }
  });
}

// Função para criar a janela principal
function createMainWindow() {
  // Calcular zoom responsivo baseado no tamanho da tela
  const responsiveZoom = calculateResponsiveZoom();
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;
  
  // Calcular tamanho da janela baseado na tela disponível
  const windowWidth = Math.min(1400, Math.floor(screenWidth * 0.9));
  const windowHeight = Math.min(900, Math.floor(screenHeight * 0.9));
  
  // Verificar e definir ícone com fallbacks
  const iconPath = path.join(__dirname, '../assets/app.ico');
  const fallbackIconPath = path.join(__dirname, '../Frontend/dist/logo.png');
  const finalIconPath = fs.existsSync(iconPath) ? iconPath : fallbackIconPath;
  
  console.log(`🖥️ Tela detectada: ${screenWidth}x${screenHeight}`);
  console.log(`🔍 Zoom padrão aplicado: ${(responsiveZoom * 100).toFixed(0)}%`);
  console.log(`📏 Tamanho da janela: ${windowWidth}x${windowHeight}`);
  console.log(`🎨 Ícone do aplicativo: ${finalIconPath}`);
  
  // Configuração do ícone baseada na plataforma
  const iconConfig = process.platform === 'win32' 
    ? { icon: finalIconPath }
    : process.platform === 'darwin' 
    ? { icon: finalIconPath }
    : { icon: finalIconPath };

  mainWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    minWidth: 1024,
    minHeight: 600,
    fullscreen: true, // Iniciar em tela cheia
    autoHideMenuBar: true, // Ocultar barra de menu por padrão
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js'),
      zoomFactor: responsiveZoom // Zoom responsivo baseado no tamanho da tela
    },
    ...iconConfig,
    title: 'KontrollaPro - Sistema de Gestão',
    show: false,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    center: true, // Centralizar a janela na tela
    resizable: true,
    maximizable: true,
    minimizable: true
  });

  // Carregar a aplicação
  console.log('🔍 Environment:', { isDev, isProd, forceFileMode, NODE_ENV: process.env.NODE_ENV, isPackaged: app.isPackaged });
  
  const indexPath = path.join(__dirname, '../Frontend/dist/index.html');
  
  if (isDev && !forceFileMode) {
    console.log('📱 Modo desenvolvimento - carregando http://localhost:5173');
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else if (fs.existsSync(indexPath)) {
    console.log('✅ Carregando arquivo local:', indexPath);
    
    // Usar loadFile diretamente - mais simples e confiável
    mainWindow.loadFile(indexPath);
  } else {
    console.log('⚠️ Arquivo não encontrado, usando fallback para desenvolvimento');
    mainWindow.loadURL('http://localhost:5173');
  }
  
  // Adicionar listener para erros de carregamento
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('❌ Falha ao carregar:', errorCode, errorDescription);
  });
  
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('✅ Página carregada com sucesso');
  });


  // Mostrar janela quando estiver pronta
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Garantir que o ícone seja aplicado corretamente
    try {
      mainWindow.setIcon(finalIconPath);
      console.log('✅ Ícone aplicado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao aplicar ícone:', error);
    }
    
    // Verificar conectividade VPS se estiver no modo híbrido
    if (HYBRID_MODE) {
      checkVPSHealth();
    } else {
      // Verificar se o backend local está rodando
      checkBackendHealth();
    }
  });

  // Zoom automático removido - apenas zoom manual pelos botões

  // Abrir links externos no navegador padrão
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Evento de fechamento
  mainWindow.on('closed', () => {
    mainWindow = null;
    if (backendProcess) {
      backendProcess.kill();
    }
  });
}

// Função para iniciar o backend
function startBackend() {
  if (backendStarted) {
    console.log('⚠️ Backend já foi iniciado, ignorando nova tentativa');
    return;
  }
  
  console.log('🚀 Iniciando backend...');
  backendStarted = true;
  
  const backendPath = isProd 
    ? path.join(__dirname, '../Backend')
    : path.join(__dirname, '../Backend');
  
  // Em produção, tentar usar o Node.js do sistema
  const nodePath = isProd 
    ? 'node' // Node.js do sistema
    : process.execPath; // Em desenvolvimento, usar o executável atual
  
  const serverPath = path.join(backendPath, 'src/server.js');
  
  console.log('📁 Backend path:', backendPath);
  console.log('📁 Server path:', serverPath);
  console.log('📁 Node path:', nodePath);
  
  
  backendProcess = spawn(nodePath, [serverPath], {
    cwd: backendPath,
    env: {
      ...process.env,
      NODE_ENV: isProd ? 'production' : 'development',
      PORT: '3000'
    },
    stdio: ['pipe', 'pipe', 'pipe']
  });

  backendProcess.on('error', (err) => {
    console.error('❌ Erro no backend:', err);
    backendStarted = false;
  });
  
  backendProcess.on('exit', (code) => {
    console.log('🔄 Backend finalizado com código:', code);
    backendStarted = false;
  });
  
  // Logs do stdout e stderr do backend
  backendProcess.stdout.on('data', (data) => {
    console.log('[Backend]', data.toString().trim());
  });
  
  backendProcess.stderr.on('data', (data) => {
    console.error('[Backend Error]', data.toString().trim());
  });
}

// Função para verificar conectividade com VPS (modo híbrido)
async function checkVPSHealth() {
  console.log('🌐 Verificando conectividade VPS...');
  const startTime = Date.now();
  
  try {
    const response = await fetch(VPS_HEALTH_URL, {
      method: 'GET',
      timeout: 5000
    });
    
    if (response.ok) {
      const data = await response.json();
      const latency = Date.now() - startTime;
      console.log('✅ VPS conectado:', data, `(${latency}ms)`);
      
      // Notificar o frontend sobre o status
      if (mainWindow && mainWindow.webContents) {
        mainWindow.webContents.send('vps-status', {
          connected: true,
          timestamp: new Date().toISOString(),
          latency: latency
        });
      }
      
      return true;
    } else {
      throw new Error('VPS não disponível');
    }
  } catch (error) {
    console.warn('❌ VPS não disponível:', error.message);
    
    // Notificar o frontend sobre falha na conexão
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.send('vps-status', {
        connected: false,
        timestamp: new Date().toISOString(),
        error: error.message
      });
    }
    
    return false;
  }
}

// Função para verificar se o backend está funcionando
async function checkBackendHealth() {
  if (isCheckingBackend) {
    console.log('⚠️ Verificação de backend já em andamento');
    return;
  }
  
  isCheckingBackend = true;
  
  try {
    console.log('🔍 Verificando saúde do backend...');
    const response = await fetch('http://localhost:3000/health');
    if (response.ok) {
      console.log('✅ Backend está funcionando');
      isCheckingBackend = false;
      return;
    } else {
      throw new Error('Backend não está respondendo');
    }
  } catch (error) {
    console.log('⚠️ Backend não está disponível, tentando iniciar...');
    
    if (!backendStarted) {
      startBackend();
      
      // Aguardar 5 segundos para o backend iniciar
      setTimeout(() => {
        isCheckingBackend = false;
        // Verificar apenas uma vez mais após iniciar
        checkBackendHealth();
      }, 5000);
    } else {
      console.log('✅ Backend já foi iniciado, aguardando...');
      isCheckingBackend = false;
    }
  }
}

// Função para criar o menu da aplicação
function createMenu() {
  const template = [
    {
      label: 'Arquivo',
      submenu: [
        {
          label: 'Nova Venda',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('menu-action', 'nova-venda');
          }
        },
        {
          label: 'Novo Produto',
          accelerator: 'CmdOrCtrl+Shift+P',
          click: () => {
            mainWindow.webContents.send('menu-action', 'novo-produto');
          }
        },
        { type: 'separator' },
        {
          label: 'Configurações',
          accelerator: 'CmdOrCtrl+,',
          click: () => {
            mainWindow.webContents.send('menu-action', 'configuracoes');
          }
        },
        { type: 'separator' },
        {
          label: 'Sair',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Editar',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' }
      ]
    },
    {
      label: 'Visualizar',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { 
          label: 'Zoom Padrão',
          accelerator: 'CmdOrCtrl+0',
          click: () => {
            const defaultZoom = calculateResponsiveZoom();
            mainWindow.webContents.setZoomFactor(defaultZoom);
            console.log(`🔍 Zoom resetado para: ${(defaultZoom * 100).toFixed(0)}%`);
          }
        },
        { 
          label: 'Aumentar Zoom',
          accelerator: 'CmdOrCtrl+Plus',
          click: () => {
            const currentZoom = mainWindow.webContents.getZoomFactor();
            const newZoom = Math.min(currentZoom + 0.1, 2.0);
            mainWindow.webContents.setZoomFactor(newZoom);
            console.log(`🔍 Zoom aumentado para: ${(newZoom * 100).toFixed(0)}%`);
          }
        },
        { 
          label: 'Diminuir Zoom',
          accelerator: 'CmdOrCtrl+-',
          click: () => {
            const currentZoom = mainWindow.webContents.getZoomFactor();
            const newZoom = Math.max(currentZoom - 0.1, 0.5);
            mainWindow.webContents.setZoomFactor(newZoom);
            console.log(`🔍 Zoom diminuído para: ${(newZoom * 100).toFixed(0)}%`);
          }
        },
        { type: 'separator' },
        { 
          label: 'Alternar Tela Cheia',
          accelerator: 'F11',
          click: () => {
            const isFullscreen = mainWindow.isFullScreen();
            mainWindow.setFullScreen(!isFullscreen);
            console.log(`🖥️ Tela cheia: ${!isFullscreen ? 'Ativada' : 'Desativada'}`);
          }
        },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Relatórios',
      submenu: [
        {
          label: 'Relatório de Vendas',
          click: () => {
            mainWindow.webContents.send('menu-action', 'relatorio-vendas');
          }
        },
        {
          label: 'Relatório de Estoque',
          click: () => {
            mainWindow.webContents.send('menu-action', 'relatorio-estoque');
          }
        },
        {
          label: 'Relatório Financeiro',
          click: () => {
            mainWindow.webContents.send('menu-action', 'relatorio-financeiro');
          }
        }
      ]
    },
    {
      label: 'Ajuda',
      submenu: [
        {
          label: 'Sobre',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Sobre o KontrollaPro',
              message: 'KontrollaPro Desktop v1.0.0',
              detail: 'Sistema de gestão de vendas e estoque para pequenas e médias empresas.'
            });
          }
        },
        {
          label: 'Documentação',
          click: () => {
            shell.openExternal('https://github.com/seu-usuario/kontrolla-saas');
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// Proteção contra múltiplas instâncias
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  console.log('⚠️ Aplicação já está rodando, fechando esta instância');
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Alguém tentou executar uma segunda instância, focar na janela existente
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  // Eventos do Electron
  app.whenReady().then(() => {
    console.log('🔍 Environment check:', { isDev, isProd, isPackaged: app.isPackaged, NODE_ENV: process.env.NODE_ENV });
    
    createMainWindow();
    createMenu();
    
    // Iniciar backend apenas em produção
    if (isProd) {
      console.log('🚀 Iniciando backend em produção...');
      startBackend();
    } else {
      console.log('⚠️ Backend não será iniciado - não está em produção');
    }

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
      }
    });
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (backendProcess) {
    backendProcess.kill();
  }
  if (staticServer) {
    staticServer.close();
  }
});

// Handlers IPC
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('show-save-dialog', async (event, options) => {
  const result = await dialog.showSaveDialog(mainWindow, options);
  return result;
});

ipcMain.handle('show-open-dialog', async (event, options) => {
  const result = await dialog.showOpenDialog(mainWindow, options);
  return result;
});

ipcMain.handle('show-message-box', async (event, options) => {
  const result = await dialog.showMessageBox(mainWindow, options);
  return result;
});

// Handlers para controle de zoom
ipcMain.handle('get-zoom-factor', () => {
  return mainWindow.webContents.getZoomFactor();
});

ipcMain.handle('set-zoom-factor', (event, zoomFactor) => {
  const clampedZoom = Math.max(0.5, Math.min(2.0, zoomFactor));
  mainWindow.webContents.setZoomFactor(clampedZoom);
  console.log(`🔍 Zoom definido para: ${(clampedZoom * 100).toFixed(0)}%`);
  return clampedZoom;
});

ipcMain.handle('get-responsive-zoom', () => {
  return calculateResponsiveZoom();
});

ipcMain.handle('reset-zoom', () => {
  const defaultZoom = calculateResponsiveZoom();
  mainWindow.webContents.setZoomFactor(defaultZoom);
  console.log(`🔍 Zoom resetado para: ${(defaultZoom * 100).toFixed(0)}%`);
  return defaultZoom;
});

// Handlers para controle de tela cheia
ipcMain.handle('is-fullscreen', () => {
  return mainWindow.isFullScreen();
});

ipcMain.handle('set-fullscreen', (event, fullscreen) => {
  mainWindow.setFullScreen(fullscreen);
  console.log(`🖥️ Tela cheia: ${fullscreen ? 'Ativada' : 'Desativada'}`);
  return fullscreen;
});

ipcMain.handle('toggle-fullscreen', () => {
  const isFullscreen = mainWindow.isFullScreen();
  mainWindow.setFullScreen(!isFullscreen);
  console.log(`🖥️ Tela cheia: ${!isFullscreen ? 'Ativada' : 'Desativada'}`);
  return !isFullscreen;
});

// Prevenir navegação para URLs externas
app.on('web-contents-created', (event, contents) => {
  contents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    
    if (parsedUrl.origin !== 'http://localhost:5173' && parsedUrl.origin !== 'file://') {
      event.preventDefault();
      shell.openExternal(navigationUrl);
    }
  });
});

// IPC handler para status VPS (modo híbrido)
ipcMain.handle('vps-health-check', async () => {
  return await checkVPSHealth();
});

// Monitoramento periódico do VPS
setInterval(async () => {
  if (mainWindow && HYBRID_MODE) {
    const vpsStatus = await checkVPSHealth();
    mainWindow.webContents.send('vps-status-update', vpsStatus);
  }
}, 30000); // Verificar a cada 30 segundos

console.log('🌐 Aplicativo Desktop em modo híbrido - conectado ao VPS:', VPS_BASE_URL);
