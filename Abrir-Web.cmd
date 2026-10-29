@echo off
pushd "%~dp0"
if not exist "node_modules" (
  echo Dependencias do Node.js ausentes. Executando npm install...
  call npm install
  if errorlevel 1 (
    echo Erro ao instalar dependencias do Node.js.
    pause
    exit /b 1
  )
)

set PYTHON_CMD=
if exist "..\novo\.venv-qt-windows\Scripts\python.exe" (
  set "PYTHON_CMD=..\novo\.venv-qt-windows\Scripts\python.exe"
) else if exist ".venv\Scripts\python.exe" (
  set "PYTHON_CMD=.venv\Scripts\python.exe"
) else (
  where python >nul 2>&1
  if %errorlevel% equ 0 (
    set "PYTHON_CMD=python"
  )
)

if "%PYTHON_CMD%"=="" (
  echo Python nao foi encontrado no sistema nem em ambiente virtual.
  echo Instale o Python 3 (64 bits) ou crie um ambiente virtual em .venv.
  pause
  exit /b 1
)

echo Iniciando LittleTec Web e ponte USB local...
echo Abra http://127.0.0.1:3000 no navegador quando o servidor estiver pronto.
call npm run dev
popd
