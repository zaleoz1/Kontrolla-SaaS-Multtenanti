const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🏗️  Criando instalador NSIS personalizado...\n');

// Verificar se o NSIS está instalado
let nsisPath = '';
const possiblePaths = [
  'C:\\Program Files (x86)\\NSIS\\makensis.exe',
  'C:\\Program Files\\NSIS\\makensis.exe',
  'makensis' // No PATH
];

for (const testPath of possiblePaths) {
  try {
    if (testPath === 'makensis') {
      execSync('makensis /VERSION', { stdio: 'pipe' });
      nsisPath = 'makensis';
      break;
    } else if (fs.existsSync(testPath)) {
      nsisPath = testPath;
      break;
    }
  } catch {}
}

if (!nsisPath) {
  console.log('❌ NSIS não encontrado. Baixe em: https://nsis.sourceforge.io/');
  console.log('💡 Ou use: winget install NSIS.NSIS');
  process.exit(1);
}

console.log('✅ NSIS encontrado:', nsisPath);

// Verificar se a build existe
const appPath = path.join(__dirname, '../dist-electron/KontrollaPro-win32-x64');
if (!fs.existsSync(appPath)) {
  console.log('❌ Build não encontrada. Execute: npm run pack:simple');
  process.exit(1);
}

console.log('✅ Build encontrada');

// Criar script NSIS dinâmico
const nsisScript = `
; KontrollaPro Desktop Installer
; Gerado automaticamente

!define APPNAME "KontrollaPro Desktop"
!define COMPANYNAME "KontrollaPro Team"
!define DESCRIPTION "Sistema de Gestão Empresarial"
!define VERSIONMAJOR 1
!define VERSIONMINOR 0
!define VERSIONBUILD 0

RequestExecutionLevel admin
InstallDir "$PROGRAMFILES\\KontrollaPro"
Name "\${APPNAME}"
Icon "assets\\app.ico"
OutFile "dist-electron\\KontrollaPro-Setup-1.0.0.exe"

!include MUI2.nsh
!include LogicLib.nsh
!include WinVer.nsh

!define MUI_ABORTWARNING
!define MUI_ICON "assets\\app.ico"
!define MUI_UNICON "assets\\app.ico"

!define MUI_WELCOMEPAGE_TITLE "Bem-vindo ao KontrollaPro Desktop"
!define MUI_WELCOMEPAGE_TEXT "Este assistente instalará o KontrollaPro Desktop.$\\r$\\n$\\r$\\nRequer permissões de administrador."

!define MUI_FINISHPAGE_RUN "\$INSTDIR\\KontrollaPro.exe"
!define MUI_FINISHPAGE_RUN_TEXT "Executar KontrollaPro Desktop"

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_LICENSE "assets\\license.txt"
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_WELCOME
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

!insertmacro MUI_LANGUAGE "PortugueseBR"

Function .onInit
    UserInfo::GetAccountType
    Pop \$0
    StrCmp \$0 "Admin" +3
        MessageBox MB_OK "Execute como Administrador"
        Abort
FunctionEnd

Section "Principal" SecMain
    SectionIn RO
    SetOutPath "\$INSTDIR"
    
    File /r "dist-electron\\KontrollaPro-win32-x64\\*"
    
    ; Registro do Windows
    WriteRegStr HKLM "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\KontrollaPro" "DisplayName" "\${APPNAME}"
    WriteRegStr HKLM "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\KontrollaPro" "UninstallString" "\$INSTDIR\\uninstall.exe"
    WriteRegStr HKLM "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\KontrollaPro" "InstallLocation" "\$INSTDIR"
    WriteRegStr HKLM "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\KontrollaPro" "DisplayIcon" "\$INSTDIR\\KontrollaPro.exe"
    WriteRegStr HKLM "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\KontrollaPro" "Publisher" "\${COMPANYNAME}"
    WriteRegStr HKLM "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\KontrollaPro" "DisplayVersion" "\${VERSIONMAJOR}.\${VERSIONMINOR}.\${VERSIONBUILD}"
    WriteRegDWORD HKLM "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\KontrollaPro" "VersionMajor" \${VERSIONMAJOR}
    WriteRegDWORD HKLM "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\KontrollaPro" "VersionMinor" \${VERSIONMINOR}
    WriteRegDWORD HKLM "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\KontrollaPro" "NoModify" 1
    WriteRegDWORD HKLM "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\KontrollaPro" "NoRepair" 1
    WriteRegDWORD HKLM "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\KontrollaPro" "EstimatedSize" 150000
    
    ; Atalhos
    CreateDirectory "\$SMPROGRAMS\\KontrollaPro"
    CreateShortCut "\$SMPROGRAMS\\KontrollaPro\\KontrollaPro Desktop.lnk" "\$INSTDIR\\KontrollaPro.exe"
    CreateShortCut "\$SMPROGRAMS\\KontrollaPro\\Desinstalar.lnk" "\$INSTDIR\\uninstall.exe"
    CreateShortCut "\$DESKTOP\\KontrollaPro Desktop.lnk" "\$INSTDIR\\KontrollaPro.exe"
    
    ; Protocolo personalizado
    WriteRegStr HKLM "Software\\Classes\\kontrollapro" "" "URL:KontrollaPro Protocol"
    WriteRegStr HKLM "Software\\Classes\\kontrollapro" "URL Protocol" ""
    WriteRegStr HKLM "Software\\Classes\\kontrollapro\\shell\\open\\command" "" '"\$INSTDIR\\KontrollaPro.exe" "%1"'
    
    ; Firewall
    ExecWait 'netsh advfirewall firewall add rule name="KontrollaPro Desktop" dir=in action=allow program="\$INSTDIR\\KontrollaPro.exe" enable=yes'
    
    ; Criar desinstalador
    WriteUninstaller "\$INSTDIR\\uninstall.exe"
SectionEnd

Section "Uninstall"
    RMDir /r "\$INSTDIR"
    
    DeleteRegKey HKLM "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\KontrollaPro"
    DeleteRegKey HKLM "Software\\Classes\\kontrollapro"
    
    Delete "\$DESKTOP\\KontrollaPro Desktop.lnk"
    RMDir /r "\$SMPROGRAMS\\KontrollaPro"
    
    ExecWait 'netsh advfirewall firewall delete rule name="KontrollaPro Desktop"'
SectionEnd
`;

// Salvar script NSIS
const scriptPath = path.join(__dirname, '../installer.nsi');
fs.writeFileSync(scriptPath, nsisScript);
console.log('✅ Script NSIS criado');

// Compilar instalador
try {
  console.log('🔨 Compilando instalador...');
  execSync(`"${nsisPath}" "${scriptPath}"`, { stdio: 'inherit' });
  console.log('✅ Instalador criado com sucesso!');
  
  // Verificar arquivo gerado
  const installerPath = path.join(__dirname, '../dist-electron/KontrollaPro-Setup-1.0.0.exe');
  if (fs.existsSync(installerPath)) {
    const stats = fs.statSync(installerPath);
    const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`📦 Arquivo: KontrollaPro-Setup-1.0.0.exe (${sizeInMB} MB)`);
    console.log('📁 Localização: dist-electron/');
    
    console.log('\\n🎉 INSTALADOR CRIADO COM SUCESSO!');
    console.log('✨ Interface gráfica moderna');
    console.log('🔒 Requer permissões de administrador');
    console.log('📱 Atalhos na área de trabalho e menu iniciar');
    console.log('🌐 Protocolo kontrollapro:// configurado');
    console.log('🛡️  Firewall configurado automaticamente');
  }
  
} catch (error) {
  console.error('❌ Erro ao compilar:', error.message);
}

// Limpar arquivo temporário
fs.unlinkSync(scriptPath);