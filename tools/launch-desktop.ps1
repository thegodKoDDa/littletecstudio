param([switch]$Smoke, [switch]$CloseWindowSmoke)
$ErrorActionPreference = 'Stop'

$source = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..\release\win-unpacked')).ProviderPath
if (-not (Test-Path -LiteralPath (Join-Path $source 'LittleTec-Studio.exe'))) {
    throw 'Desktop ausente. Execute npm run desktop:pack antes de abrir.'
}

$target = $source
if ($source.StartsWith('\\')) {
    # Chromium com sandbox requer execução local; o checkout WSL é um caminho UNC.
    # Cada build tem diretório próprio, sem substituir um aplicativo em execução.
    $uiHash = (Get-FileHash -LiteralPath (Join-Path $source 'resources\app.asar') -Algorithm SHA256).Hash
    $bridgeHash = (Get-FileHash -LiteralPath (Join-Path $source 'resources\bridge\LittleTec-Bridge.exe') -Algorithm SHA256).Hash
    $buildId = $uiHash.Substring(0, 12) + '-' + $bridgeHash.Substring(0, 12)
    $target = Join-Path $env:LOCALAPPDATA "LittleTec Desktop\builds\$buildId"
    $readyFile = Join-Path $target '.ready'
    if (-not (Test-Path -LiteralPath $readyFile)) {
        Write-Host 'Preparando copia local Windows do novo Desktop...'
        New-Item -ItemType Directory -Path $target -Force | Out-Null
        Copy-Item -Path (Join-Path $source '*') -Destination $target -Recurse -Force
        Set-Content -LiteralPath $readyFile -Value $buildId
    }
}

$options = @{
    FilePath = (Join-Path $target 'LittleTec-Studio.exe')
    WorkingDirectory = $target
    PassThru = $true
}
if ($Smoke) {
    $options.ArgumentList = if ($CloseWindowSmoke) { @('--smoke', '--smoke-close-window') } else { '--smoke' }
    $desktopProcess = Start-Process @options
    if (-not $desktopProcess.WaitForExit(60000)) { throw 'Smoke excedeu o prazo.' }
    if ($desktopProcess.ExitCode -ne 0) { throw "Smoke falhou: $($desktopProcess.ExitCode)" }
} else {
    Start-Process @options | Out-Null
}
