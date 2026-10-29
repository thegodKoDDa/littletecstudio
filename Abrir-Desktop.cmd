@echo off
setlocal
if exist "%~dp0LittleTec-Studio.exe" (
  start "" "%~dp0LittleTec-Studio.exe"
  exit /b 0
)
if not exist "%~dp0release\win-unpacked\LittleTec-Studio.exe" (
  echo O novo Desktop ainda nao foi compilado nesta pasta.
  echo Consulte docs\DESKTOP.md para gerar o pacote.
  pause
  exit /b 1
)
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\launch-desktop.ps1"
if errorlevel 1 pause
