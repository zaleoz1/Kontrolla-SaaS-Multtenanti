
; KontrollaPro Desktop Installer
; Gerado automaticamente

!define APPNAME "KontrollaPro Desktop"
!define COMPANYNAME "KontrollaPro Team"
!define DESCRIPTION "Sistema de Gestão Empresarial"
!define VERSIONMAJOR 1
!define VERSIONMINOR 0
!define VERSIONBUILD 0

RequestExecutionLevel admin
InstallDir "$PROGRAMFILES\KontrollaPro"
Name "${APPNAME}"
Icon "assets\app.ico"
OutFile "dist-electron\KontrollaPro-Setup-1.0.0.exe"

!include MUI2.nsh
!include LogicLib.nsh
!include WinVer.nsh

!define MUI_ABORTWARNING
!define MUI_ICON "assets\app.ico"
!define MUI_UNICON "assets\app.ico"

!define MUI_WELCOMEPAGE_TITLE "Bem-vindo ao KontrollaPro Desktop"
!define MUI_WELCOMEPAGE_TEXT "Este assistente instalará o KontrollaPro Desktop.$\r$\n$\r$\nRequer permissões de administrador."

!define MUI_FINISHPAGE_RUN "$INSTDIR\KontrollaPro.exe"
!define MUI_FINISHPAGE_RUN_TEXT "Executar KontrollaPro Desktop"

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_LICENSE "assets\license.txt"
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_WELCOME
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

!insertmacro MUI_LANGUAGE "PortugueseBR"

Function .onInit
    UserInfo::GetAccountType
    Pop $0
    StrCmp $0 "Admin" +3
        MessageBox MB_OK "Execute como Administrador"
        Abort
FunctionEnd

Section "Principal" SecMain
    SectionIn RO
    SetOutPath "$INSTDIR"
    
    File /r "dist-electron\KontrollaPro-win32-x64\*"
    
    ; Registro do Windows
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\KontrollaPro" "DisplayName" "${APPNAME}"
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\KontrollaPro" "UninstallString" "$INSTDIR\uninstall.exe"
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\KontrollaPro" "InstallLocation" "$INSTDIR"
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\KontrollaPro" "DisplayIcon" "$INSTDIR\KontrollaPro.exe"
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\KontrollaPro" "Publisher" "${COMPANYNAME}"
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\KontrollaPro" "DisplayVersion" "${VERSIONMAJOR}.${VERSIONMINOR}.${VERSIONBUILD}"
    WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\KontrollaPro" "VersionMajor" ${VERSIONMAJOR}
    WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\KontrollaPro" "VersionMinor" ${VERSIONMINOR}
    WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\KontrollaPro" "NoModify" 1
    WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\KontrollaPro" "NoRepair" 1
    WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\KontrollaPro" "EstimatedSize" 150000
    
    ; Atalhos
    CreateDirectory "$SMPROGRAMS\KontrollaPro"
    CreateShortCut "$SMPROGRAMS\KontrollaPro\KontrollaPro Desktop.lnk" "$INSTDIR\KontrollaPro.exe"
    CreateShortCut "$SMPROGRAMS\KontrollaPro\Desinstalar.lnk" "$INSTDIR\uninstall.exe"
    CreateShortCut "$DESKTOP\KontrollaPro Desktop.lnk" "$INSTDIR\KontrollaPro.exe"
    
    ; Protocolo personalizado
    WriteRegStr HKLM "Software\Classes\kontrollapro" "" "URL:KontrollaPro Protocol"
    WriteRegStr HKLM "Software\Classes\kontrollapro" "URL Protocol" ""
    WriteRegStr HKLM "Software\Classes\kontrollapro\shell\open\command" "" '"$INSTDIR\KontrollaPro.exe" "%1"'
    
    ; Firewall
    ExecWait 'netsh advfirewall firewall add rule name="KontrollaPro Desktop" dir=in action=allow program="$INSTDIR\KontrollaPro.exe" enable=yes'
    
    ; Criar desinstalador
    WriteUninstaller "$INSTDIR\uninstall.exe"
SectionEnd

Section "Uninstall"
    RMDir /r "$INSTDIR"
    
    DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\KontrollaPro"
    DeleteRegKey HKLM "Software\Classes\kontrollapro"
    
    Delete "$DESKTOP\KontrollaPro Desktop.lnk"
    RMDir /r "$SMPROGRAMS\KontrollaPro"
    
    ExecWait 'netsh advfirewall firewall delete rule name="KontrollaPro Desktop"'
SectionEnd
