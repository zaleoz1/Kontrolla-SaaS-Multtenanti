# KontrollaPro Desktop Uninstaller Script
# Custom NSIS uninstaller script for KontrollaPro

# Solicitar permissões de administrador para desinstalação
RequestExecutionLevel admin

# Interface gráfica para desinstalação
!include "MUI2.nsh"

# Configurações da interface de desinstalação
!define MUI_UNABORTWARNING
!define MUI_UNICON "${NSISDIR}\Contrib\Graphics\Icons\modern-uninstall-colorful.ico"

!define MUI_UNWELCOMEPAGE_TITLE "Desinstalação do KontrollaPro Desktop"
!define MUI_UNWELCOMEPAGE_TEXT "Este assistente irá remover o KontrollaPro Desktop do seu computador.$\r$\n$\r$\nClique em Avançar para continuar."

!define MUI_UNCONFIRMPAGE_TEXT_TOP "O KontrollaPro Desktop será removido da seguinte pasta:"

# Função de inicialização do desinstalador
Function un.onInit
  MessageBox MB_YESNO|MB_ICONQUESTION \
    "Tem certeza de que deseja remover completamente o KontrollaPro Desktop e todos os seus componentes?" \
    IDYES +2
  Abort
FunctionEnd

# Remover entradas do registro
DeleteRegKey SHCTX "Software\Microsoft\Windows\CurrentVersion\Uninstall\${UNINSTALL_APP_KEY}"
DeleteRegKey SHCTX "Software\Classes\kontrollapro"
DeleteRegKey SHCTX "Software\Classes\.kontrolla"
DeleteRegKey SHCTX "Software\Classes\KontrollaPro.Document"
DeleteRegKey HKLM "SOFTWARE\KontrollaPro"

# Remover do PATH do sistema
EnvVarUpdate $0 "PATH" "R" "HKLM" "$INSTDIR"

# Remover atalhos
Delete "$DESKTOP\KontrollaPro.lnk"
Delete "$SMPROGRAMS\KontrollaPro\KontrollaPro Desktop.lnk"
Delete "$SMPROGRAMS\KontrollaPro\Manual do Usuário.lnk"
Delete "$SMPROGRAMS\KontrollaPro\Suporte Técnico.lnk"
Delete "$SMPROGRAMS\KontrollaPro\Desinstalar KontrollaPro.lnk"
RMDir "$SMPROGRAMS\KontrollaPro"

# Remover regra do firewall
nsExec::ExecToLog 'netsh advfirewall firewall delete rule name="KontrollaPro Desktop"'

# Perguntar se deseja manter dados do usuário
MessageBox MB_YESNO|MB_ICONQUESTION \
  "Deseja manter os dados e configurações do usuário?$\r$\n$\r$\nEscolha 'Não' apenas se desejar uma remoção completa." \
  IDYES keep_data

# Remover dados do usuário
RMDir /r "$APPDATA\KontrollaPro"
RMDir /r "$LOCALAPPDATA\KontrollaPro"

keep_data:
  DetailPrint "Dados do usuário mantidos."

# Limpar cache e arquivos temporários
RMDir /r "$TEMP\KontrollaPro"
Delete "$TEMP\KontrollaPro-*"

DetailPrint "Desinstalação concluída com sucesso!"