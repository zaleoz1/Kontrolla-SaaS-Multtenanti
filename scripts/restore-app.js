const fs = require('fs');
const path = require('path');

console.log('🔄 Restaurando App.tsx original...');

const appPath = path.join(__dirname, '../Frontend/src/App.tsx');
const appBackupPath = path.join(__dirname, '../Frontend/src/App.tsx.backup');

try {
  if (fs.existsSync(appBackupPath)) {
    fs.copyFileSync(appBackupPath, appPath);
    fs.unlinkSync(appBackupPath);
    console.log('✅ App.tsx original restaurado');
  } else {
    console.log('⚠️ Backup não encontrado, mantendo versão atual');
  }
} catch (error) {
  console.error('❌ Erro ao restaurar App.tsx:', error.message);
}
