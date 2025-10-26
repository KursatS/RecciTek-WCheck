!include MUI2.nsh

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_COMPONENTS
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_LANGUAGE "Turkish"

!insertmacro MUI_UNPAGE_WELCOME
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_UNPAGE_FINISH

Section "Ana Uygulama" SecApp
  SectionIn RO
  SetOutPath "$INSTDIR"
  ; Files are added by electron-builder
SectionEnd

Section "Masaüstü Kısayolu" SecDesktop
  CreateShortCut "$DESKTOP\RecciTek WCheck.lnk" "$INSTDIR\RecciTek WCheck.exe"
SectionEnd

!insertmacro MUI_FUNCTION_DESCRIPTION_BEGIN
  !insertmacro MUI_DESCRIPTION_TEXT ${SecApp} "RecciTek WCheck uygulamasını kurar"
  !insertmacro MUI_DESCRIPTION_TEXT ${SecDesktop} "Masaüstüne kısayol oluşturur"
!insertmacro MUI_FUNCTION_DESCRIPTION_END