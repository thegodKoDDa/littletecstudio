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

if not exist ".venv-windows\Scripts\python.exe" (
  echo Ambiente Python ausente. Consulte docs\DESKTOP.md para preparar .venv-windows.
  pause
  exit /b 1
)

echo Iniciando LittleTec Web e ponte USB local...
echo Abra http://127.0.0.1:3000 no navegador quando o servidor estiver pronto.
call npm run dev
popd
