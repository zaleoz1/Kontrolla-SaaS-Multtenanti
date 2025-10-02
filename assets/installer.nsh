# KontrollaPro Desktop Installer Script
# Custom NSIS installer script for KontrollaPro

# Adicionar informações no painel de controle
WriteRegStr SHCTX "Software\Microsoft\Windows\CurrentVersion\Uninstall\${UNINSTALL_APP_KEY}" "DisplayName" "KontrollaPro Desktop"
WriteRegStr SHCTX "Software\Microsoft\Windows\CurrentVersion\Uninstall\${UNINSTALL_APP_KEY}" "Publisher" "KontrollaPro Team"
WriteRegStr SHCTX "Software\Microsoft\Windows\CurrentVersion\Uninstall\${UNINSTALL_APP_KEY}" "DisplayVersion" "${VERSION}"
WriteRegStr SHCTX "Software\Microsoft\Windows\CurrentVersion\Uninstall\${UNINSTALL_APP_KEY}" "URLInfoAbout" "https://kontrollapro.com"
WriteRegStr SHCTX "Software\Microsoft\Windows\CurrentVersion\Uninstall\${UNINSTALL_APP_KEY}" "HelpLink" "https://kontrollapro.com/suporte"

# Adicionar protocolo personalizado para o KontrollaPro
WriteRegStr SHCTX "Software\Classes\kontrollapro" "" "URL:KontrollaPro Protocol"
WriteRegStr SHCTX "Software\Classes\kontrollapro" "URL Protocol" ""
WriteRegStr SHCTX "Software\Classes\kontrollapro\DefaultIcon" "" "$INSTDIR\${APP_EXECUTABLE_FILENAME}"
WriteRegStr SHCTX "Software\Classes\kontrollapro\shell\open\command" "" '"$INSTDIR\${APP_EXECUTABLE_FILENAME}" "%1"'

# Criar grupo no menu iniciar
CreateDirectory "$SMPROGRAMS\KontrollaPro"
CreateShortCut "$SMPROGRAMS\KontrollaPro\KontrollaPro.lnk" "$INSTDIR\${APP_EXECUTABLE_FILENAME}"
CreateShortCut "$SMPROGRAMS\KontrollaPro\Uninstall KontrollaPro.lnk" "$INSTDIR\Uninstall ${PRODUCT_FILENAME}.exe"

# Mensagem de finalização
!define MUI_FINISHPAGE_RUN_TEXT "Executar KontrollaPro Desktop"
!define MUI_FINISHPAGE_RUN "$INSTDIR\${APP_EXECUTABLE_FILENAME}"
