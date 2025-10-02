; Script personalizado para o instalador NSIS do KontrollaPro

; Página de boas-vindas personalizada
!macro customWelcomePage
  !insertmacro MUI_PAGE_WELCOME
!macroend

; Página de licença
!macro customLicensePage
  !insertmacro MUI_PAGE_LICENSE "assets/license.txt"
!macroend

; Página de diretório de instalação
!macro customDirectoryPage
  !insertmacro MUI_PAGE_DIRECTORY
!macroend

; Página de componentes
!macro customComponentsPage
  !insertmacro MUI_PAGE_COMPONENTS
!macroend

; Página de instalação
!macro customInstallPage
  !insertmacro MUI_PAGE_INSTFILES
!macroend

; Página de finalização
!macro customFinishPage
  !insertmacro MUI_PAGE_FINISH
!macroend

; Seção de instalação principal
Section "KontrollaPro" SecMain
  SectionIn RO
  
  ; Criar diretório de instalação
  SetOutPath "$INSTDIR"
  
  ; Instalar arquivos principais
  File /r "electron\*"
  File /r "Backend\*"
  File /r "Frontend\dist\*"
  File "package.json"
  
  ; Criar atalhos
  CreateShortCut "$DESKTOP\KontrollaPro.lnk" "$INSTDIR\electron\main.js"
  CreateShortCut "$SMPROGRAMS\KontrollaPro.lnk" "$INSTDIR\electron\main.js"
  
  ; Registrar desinstalador
  WriteUninstaller "$INSTDIR\Uninstall.exe"
  
  ; Registrar no registro do Windows
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\KontrollaPro" "DisplayName" "KontrollaPro"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\KontrollaPro" "UninstallString" "$INSTDIR\Uninstall.exe"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\KontrollaPro" "InstallLocation" "$INSTDIR"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\KontrollaPro" "DisplayVersion" "1.0.0"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\KontrollaPro" "Publisher" "KontrollaPro Team"
  WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\KontrollaPro" "NoModify" 1
  WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\KontrollaPro" "NoRepair" 1
SectionEnd

; Seção de banco de dados
Section "MySQL Database" SecDB
  ; Verificar se MySQL está instalado
  ReadRegStr $0 HKLM "SOFTWARE\MySQL AB\MySQL Server 8.0" "Location"
  ${If} $0 == ""
    MessageBox MB_YESNO "MySQL não foi encontrado. Deseja baixar e instalar o MySQL?" IDYES DownloadMySQL IDNO SkipMySQL
    DownloadMySQL:
      ExecShell "open" "https://dev.mysql.com/downloads/mysql/"
    SkipMySQL:
  ${EndIf}
SectionEnd

; Seção de desinstalação
Section "Uninstall"
  ; Remover arquivos
  RMDir /r "$INSTDIR"
  
  ; Remover atalhos
  Delete "$DESKTOP\KontrollaPro.lnk"
  Delete "$SMPROGRAMS\KontrollaPro.lnk"
  
  ; Remover do registro
  DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\KontrollaPro"
SectionEnd

; Descrições das seções
!insertmacro MUI_FUNCTION_DESCRIPTION_BEGIN
  !insertmacro MUI_DESCRIPTION_TEXT ${SecMain} "Instala o KontrollaPro e todos os componentes necessários."
  !insertmacro MUI_DESCRIPTION_TEXT ${SecDB} "Configura e verifica a instalação do MySQL."
!insertmacro MUI_FUNCTION_DESCRIPTION_END
