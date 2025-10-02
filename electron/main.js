const { app, BrowserWindow, Menu, shell, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

// Configurações
const isDev = process.env.NODE_ENV === 'development' && !process.env.FORCE_FILE_MODE;
const isProd = process.env.NODE_ENV === 'production' || app.isPackaged;
const forceFileMode = process.env.FORCE_FILE_MODE === 'true';

let mainWindow;
let backendProcess;
let backendStarted = false;
let isCheckingBackend = false;

// Função para criar a janela principal
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js'),
      zoomFactor: 0.85 // Ajustado para zoom de 85% - um pouco maior
    },
    icon: path.join(__dirname, '../Frontend/dist/logo.png'),
    title: 'KontrollaPro - Sistema de Gestão',
    show: false,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default'
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
    
    // Verificar se o backend está rodando
    checkBackendHealth();
  });

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
  
  const nodePath = process.execPath;
  const serverPath = path.join(backendPath, 'src/server.js');
  
  
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
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
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
    createMainWindow();
    createMenu();
    
    // Iniciar backend apenas em produção
    if (isProd) {
      startBackend();
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
