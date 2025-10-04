# KontrollaPro Desktop Installer Script
# Custom NSIS installer script for KontrollaPro

# Solicitar permissões de administrador
RequestExecutionLevel admin

# Interface gráfica moderna
!include "MUI2.nsh"
!include "LogicLib.nsh"
!include "WinVer.nsh"
!include "FileFunc.nsh"

# Configurações da interface
!define MUI_ABORTWARNING
!define MUI_ICON "${NSISDIR}\Contrib\Graphics\Icons\modern-install-colorful.ico"
!define MUI_UNICON "${NSISDIR}\Contrib\Graphics\Icons\modern-uninstall-colorful.ico"

# Páginas customizadas
!define MUI_WELCOMEPAGE_TITLE "Bem-vindo ao KontrollaPro Desktop"
!define MUI_WELCOMEPAGE_TEXT "Este assistente irá guiá-lo através da instalação do KontrollaPro Desktop.$\r$\n$\r$\nO KontrollaPro é um sistema completo de gestão de vendas e estoque.$\r$\n$\r$\n⚠️ IMPORTANTE: Requer permissões de administrador.$\r$\n$\r$\nClique em Avançar para continuar."

!define MUI_LICENSEPAGE_TEXT_TOP "Por favor, leia os termos da licença:"
!define MUI_LICENSEPAGE_TEXT_BOTTOM "Clique em 'Eu aceito' para continuar."

!define MUI_DIRECTORYPAGE_TEXT_TOP "Selecione o diretório de instalação:"

!define MUI_FINISHPAGE_TITLE "Instalação Concluída"
!define MUI_FINISHPAGE_TEXT "O KontrollaPro Desktop foi instalado com sucesso.$\r$\n$\r$\n✅ Atalhos criados$\r$\n✅ Firewall configurado$\r$\n✅ Associações de arquivo$\r$\n$\r$\nClique em Finalizar."
!define MUI_FINISHPAGE_RUN_TEXT "🚀 Executar KontrollaPro Desktop"
!define MUI_FINISHPAGE_RUN "$INSTDIR\${APP_EXECUTABLE_FILENAME}"

# Verificar sistema na inicialização
Function .onInit
  # Verificar Windows 10+
  ${IfNot} ${AtLeastWin10}
    MessageBox MB_OK|MB_ICONSTOP "❌ Requer Windows 10 ou superior."
    Abort
  ${EndIf}
  
  # Verificar permissões
  UserInfo::GetAccountType
  Pop $R0
  StrCmp $R0 "Admin" admin_ok
    MessageBox MB_OK|MB_ICONSTOP "❌ Execute como Administrador."
    Abort
  
  admin_ok:
  
  # Verificar versão anterior
  ReadRegStr $R0 SHCTX "Software\Microsoft\Windows\CurrentVersion\Uninstall\${UNINSTALL_APP_KEY}" "UninstallString"
  StrCmp $R0 "" done
  
  MessageBox MB_YESNO|MB_ICONQUESTION \
    "⚠️ Versão anterior detectada. Remover antes de continuar?" \
    IDYES uninst IDNO done
  
  uninst:
    ExecWait '$R0 /S _?=$INSTDIR'
      
  done:
FunctionEnd

# Adicionar informações no registro
WriteRegStr SHCTX "Software\Microsoft\Windows\CurrentVersion\Uninstall\${UNINSTALL_APP_KEY}" "DisplayName" "KontrollaPro Desktop"
WriteRegStr SHCTX "Software\Microsoft\Windows\CurrentVersion\Uninstall\${UNINSTALL_APP_KEY}" "Publisher" "KontrollaPro Team"
WriteRegStr SHCTX "Software\Microsoft\Windows\CurrentVersion\Uninstall\${UNINSTALL_APP_KEY}" "DisplayVersion" "${VERSION}"
WriteRegStr SHCTX "Software\Microsoft\Windows\CurrentVersion\Uninstall\${UNINSTALL_APP_KEY}" "DisplayIcon" "$INSTDIR\${APP_EXECUTABLE_FILENAME},0"
WriteRegStr SHCTX "Software\Microsoft\Windows\CurrentVersion\Uninstall\${UNINSTALL_APP_KEY}" "URLInfoAbout" "https://kontrollapro.com"
WriteRegStr SHCTX "Software\Microsoft\Windows\CurrentVersion\Uninstall\${UNINSTALL_APP_KEY}" "HelpLink" "https://kontrollapro.com/suporte"
WriteRegStr SHCTX "Software\Microsoft\Windows\CurrentVersion\Uninstall\${UNINSTALL_APP_KEY}" "InstallLocation" "$INSTDIR"
WriteRegStr SHCTX "Software\Microsoft\Windows\CurrentVersion\Uninstall\${UNINSTALL_APP_KEY}" "UninstallString" "$INSTDIR\Uninstall ${PRODUCT_FILENAME}.exe"
WriteRegDWORD SHCTX "Software\Microsoft\Windows\CurrentVersion\Uninstall\${UNINSTALL_APP_KEY}" "NoModify" 1
WriteRegDWORD SHCTX "Software\Microsoft\Windows\CurrentVersion\Uninstall\${UNINSTALL_APP_KEY}" "NoRepair" 1

# Protocolo personalizado kontrollapro://
WriteRegStr SHCTX "Software\Classes\kontrollapro" "" "URL:KontrollaPro Protocol"
WriteRegStr SHCTX "Software\Classes\kontrollapro" "URL Protocol" ""
WriteRegStr SHCTX "Software\Classes\kontrollapro\DefaultIcon" "" "$INSTDIR\${APP_EXECUTABLE_FILENAME},0"
WriteRegStr SHCTX "Software\Classes\kontrollapro\shell\open\command" "" '"$INSTDIR\${APP_EXECUTABLE_FILENAME}" "%1"'

# Associar arquivos .kontrolla
WriteRegStr SHCTX "Software\Classes\.kontrolla" "" "KontrollaPro.Document"
WriteRegStr SHCTX "Software\Classes\KontrollaPro.Document" "" "Documento do KontrollaPro"
WriteRegStr SHCTX "Software\Classes\KontrollaPro.Document\DefaultIcon" "" "$INSTDIR\${APP_EXECUTABLE_FILENAME},0"
WriteRegStr SHCTX "Software\Classes\KontrollaPro.Document\shell\open\command" "" '"$INSTDIR\${APP_EXECUTABLE_FILENAME}" "%1"'

# Criar atalhos
CreateDirectory "$SMPROGRAMS\KontrollaPro"
CreateShortCut "$SMPROGRAMS\KontrollaPro\KontrollaPro Desktop.lnk" "$INSTDIR\${APP_EXECUTABLE_FILENAME}" "" "$INSTDIR\${APP_EXECUTABLE_FILENAME}" 0 SW_SHOWNORMAL "" "Sistema de Gestão KontrollaPro"
CreateShortCut "$SMPROGRAMS\KontrollaPro\Manual do Usuário.lnk" "https://kontrollapro.com/manual"
CreateShortCut "$SMPROGRAMS\KontrollaPro\Suporte Técnico.lnk" "https://kontrollapro.com/suporte"
CreateShortCut "$SMPROGRAMS\KontrollaPro\Desinstalar KontrollaPro.lnk" "$INSTDIR\Uninstall ${PRODUCT_FILENAME}.exe"

# Atalho na área de trabalho
CreateShortCut "$DESKTOP\KontrollaPro.lnk" "$INSTDIR\${APP_EXECUTABLE_FILENAME}" "" "$INSTDIR\${APP_EXECUTABLE_FILENAME}" 0 SW_SHOWNORMAL "" "KontrollaPro Desktop"

# Configurar firewall
DetailPrint "Configurando firewall do Windows..."
nsExec::ExecToLog 'netsh advfirewall firewall delete rule name="KontrollaPro Desktop" >nul 2>&1'
nsExec::ExecToLog 'netsh advfirewall firewall add rule name="KontrollaPro Desktop" dir=in action=allow program="$INSTDIR\${APP_EXECUTABLE_FILENAME}" enable=yes'
nsExec::ExecToLog 'netsh advfirewall firewall add rule name="KontrollaPro Backend" dir=in action=allow protocol=TCP localport=3000 enable=yes'

# Configurar permissões
DetailPrint "Configurando permissões..."
AccessControl::GrantOnFile "$INSTDIR" "(BU)" "FullAccess"
AccessControl::GrantOnFile "$INSTDIR" "(S-1-5-32-545)" "FullAccess"

# Registrar no sistema
WriteRegStr HKLM "SOFTWARE\KontrollaPro" "InstallPath" "$INSTDIR"
WriteRegStr HKLM "SOFTWARE\KontrollaPro" "Version" "${VERSION}"
WriteRegDWORD HKLM "SOFTWARE\KontrollaPro" "Installed" 1

# Atualizar cache de associações
System::Call 'shell32.dll::SHChangeNotify(l, l, p, p) v (0x08000000, 0, 0, 0)'

DetailPrint "✅ Instalação concluída com sucesso!"
