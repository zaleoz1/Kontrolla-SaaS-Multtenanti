# KontrollaPro Desktop - Configurações Avançadas do Instalador
# Este arquivo contém configurações extras para o NSIS

# Verificar e instalar Visual C++ Redistributable se necessário
Section "Visual C++ Redistributable" SEC_VCREDIST
  SectionIn RO
  
  DetailPrint "Verificando Visual C++ Redistributable..."
  
  # Verificar se já está instalado
  ReadRegStr $R0 HKLM "SOFTWARE\Microsoft\VisualStudio\14.0\VC\Runtimes\x64" "Version"
  StrCmp $R0 "" 0 vcredist_installed
  
  # Baixar e instalar se necessário
  DetailPrint "Instalando Visual C++ Redistributable..."
  File /oname=$TEMP\vc_redist.x64.exe "${BUILD_RESOURCES_DIR}\vc_redist.x64.exe"
  ExecWait "$TEMP\vc_redist.x64.exe /quiet /norestart" $0
  Delete "$TEMP\vc_redist.x64.exe"
  
  IntCmp $0 0 vcredist_installed
  DetailPrint "Aviso: Não foi possível instalar o Visual C++ Redistributable"
  
  vcredist_installed:
    DetailPrint "Visual C++ Redistributable OK"
SectionEnd

# Configurar banco de dados local (SQLite)
Section "Configuração do Banco de Dados" SEC_DATABASE
  DetailPrint "Configurando banco de dados local..."
  
  # Criar diretório de dados
  CreateDirectory "$APPDATA\KontrollaPro\Database"
  
  # Copiar arquivo de banco padrão se existir
  IfFileExists "$INSTDIR\resources\app.asar.unpacked\Backend\database\default.db" 0 +2
    CopyFiles "$INSTDIR\resources\app.asar.unpacked\Backend\database\default.db" "$APPDATA\KontrollaPro\Database\kontrollapro.db"
  
  DetailPrint "Banco de dados configurado"
SectionEnd

# Configurar certificados SSL se necessário
Section "Configuração SSL" SEC_SSL
  DetailPrint "Configurando certificados SSL..."
  
  # Criar diretório para certificados
  CreateDirectory "$APPDATA\KontrollaPro\SSL"
  
  # Definir permissões adequadas
  AccessControl::GrantOnFile "$APPDATA\KontrollaPro\SSL" "(S-1-5-32-545)" "FullAccess"
  
  DetailPrint "Certificados SSL configurados"
SectionEnd

# Configurar serviços Windows se necessário
Section "Configuração de Serviços" SEC_SERVICES
  DetailPrint "Configurando serviços do sistema..."
  
  # Registrar o aplicativo para iniciar com o Windows (opcional)
  WriteRegStr HKLM "SOFTWARE\Microsoft\Windows\CurrentVersion\Run" "KontrollaPro" "$INSTDIR\${APP_EXECUTABLE_FILENAME} --hidden"
  
  DetailPrint "Serviços configurados"
SectionEnd

# Configurar porta padrão e verificar conflitos
Section "Configuração de Rede" SEC_NETWORK
  DetailPrint "Verificando configurações de rede..."
  
  # Verificar se a porta 3000 está livre
  nsExec::ExecToStack 'netstat -an | findstr ":3000"'
  Pop $0
  Pop $1
  
  StrCmp $1 "" port_free
    MessageBox MB_YESNO|MB_ICONQUESTION \
      "A porta 3000 já está em uso. O KontrollaPro pode não funcionar corretamente.$\r$\n$\r$\nDeseja continuar mesmo assim?" \
      IDYES port_free
    Abort
  
  port_free:
    DetailPrint "Configurações de rede OK"
SectionEnd

# Configurar logs e monitoramento
Section "Sistema de Logs" SEC_LOGS
  DetailPrint "Configurando sistema de logs..."
  
  # Criar diretório de logs
  CreateDirectory "$APPDATA\KontrollaPro\Logs"
  
  # Configurar rotação de logs
  WriteRegDWORD HKLM "SOFTWARE\KontrollaPro\Logging" "MaxLogSize" 10485760  # 10MB
  WriteRegDWORD HKLM "SOFTWARE\KontrollaPro\Logging" "MaxLogFiles" 5
  
  DetailPrint "Sistema de logs configurado"
SectionEnd

# Backup de configurações existentes
Section "Backup de Configurações" SEC_BACKUP
  IfFileExists "$APPDATA\KontrollaPro\config.json" 0 no_backup
  
  DetailPrint "Fazendo backup das configurações existentes..."
  
  # Criar diretório de backup
  CreateDirectory "$APPDATA\KontrollaPro\Backup"
  
  # Fazer backup com timestamp
  ${GetTime} "" "L" $0 $1 $2 $3 $4 $5 $6
  CopyFiles "$APPDATA\KontrollaPro\config.json" "$APPDATA\KontrollaPro\Backup\config_$2$1$0_$4$5$6.json"
  
  DetailPrint "Backup realizado com sucesso"
  Goto backup_done
  
  no_backup:
    DetailPrint "Nenhuma configuração anterior encontrada"
  
  backup_done:
SectionEnd

# Verificar requisitos mínimos do sistema
Function CheckSystemRequirements
  DetailPrint "Verificando requisitos do sistema..."
  
  # Verificar RAM (mínimo 4GB)
  ${If} ${RAMAmount} < 4096
    MessageBox MB_YESNO|MB_ICONEXCLAMATION \
      "Seu sistema possui menos de 4GB de RAM. O KontrollaPro pode funcionar lentamente.$\r$\n$\r$\nDeseja continuar?" \
      IDYES ram_ok
    Abort
  ${EndIf}
  
  ram_ok:
  
  # Verificar espaço em disco (mínimo 500MB)
  ${DriveSpace} "$INSTDIR" "/D=F /S=M" $0
  IntCmp $0 500 disk_ok disk_ok
    MessageBox MB_OK|MB_ICONSTOP \
      "Espaço insuficiente em disco. São necessários pelo menos 500MB livres."
    Abort
  
  disk_ok:
    DetailPrint "Requisitos do sistema atendidos"
FunctionEnd

# Otimizações pós-instalação
Section "Otimizações" SEC_OPTIMIZE
  DetailPrint "Aplicando otimizações..."
  
  # Configurar prioridade do processo
  WriteRegDWORD HKLM "SOFTWARE\KontrollaPro\Performance" "ProcessPriority" 2  # Normal
  
  # Configurar cache
  WriteRegDWORD HKLM "SOFTWARE\KontrollaPro\Performance" "CacheSize" 50  # 50MB
  
  # Pré-carregar bibliotecas críticas
  System::Call 'kernel32::LoadLibrary(t "$INSTDIR\resources\app.asar.unpacked\node_modules\better-sqlite3\build\Release\better_sqlite3.node") i.r0'
  
  DetailPrint "Otimizações aplicadas"
SectionEnd