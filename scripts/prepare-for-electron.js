const fs = require('fs');
const path = require('path');

console.log('🔧 Preparando aplicação para Electron...');

const appPath = path.join(__dirname, '../Frontend/src/App.tsx');
const appElectronPath = path.join(__dirname, '../Frontend/src/AppElectron.tsx');
const appBackupPath = path.join(__dirname, '../Frontend/src/App.tsx.backup');

try {
  // Fazer backup do App.tsx original
  if (fs.existsSync(appPath)) {
    fs.copyFileSync(appPath, appBackupPath);
    console.log('✅ Backup do App.tsx criado');
  }

  // Substituir App.tsx pelo AppElectronSimple.tsx
  const appElectronSimplePath = path.join(__dirname, '../Frontend/src/AppElectronSimple.tsx');
  if (fs.existsSync(appElectronSimplePath)) {
    fs.copyFileSync(appElectronSimplePath, appPath);
    console.log('✅ App.tsx substituído pela versão Electron Simple');
  } else if (fs.existsSync(appElectronPath)) {
    fs.copyFileSync(appElectronPath, appPath);
    console.log('✅ App.tsx substituído pela versão Electron');
  } else {
    console.log('❌ AppElectron.tsx não encontrado');
  }

  console.log('✅ Aplicação preparada para Electron!');
} catch (error) {
  console.error('❌ Erro ao preparar para Electron:', error.message);
}
