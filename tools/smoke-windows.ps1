param([switch]$CloseWindow)
$ErrorActionPreference = 'Stop'
$root = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).ProviderPath
$runtime = Join-Path $root '.runtime'
New-Item -ItemType Directory -Path $runtime -Force | Out-Null
$env:LITTLETEC_SMOKE_REPORT = Join-Path $runtime 'windows-smoke.json'
if (Test-Path -LiteralPath $env:LITTLETEC_SMOKE_REPORT) {
    Remove-Item -LiteralPath $env:LITTLETEC_SMOKE_REPORT
}
$entry = Join-Path $root 'LittleTec-Studio.exe'
if (Test-Path -LiteralPath $entry) {
    $arguments = if ($CloseWindow) { @('--smoke', '--smoke-close-window') } else { '--smoke' }
    $desktopProcess = Start-Process -FilePath $entry -ArgumentList $arguments -PassThru
    if (-not $desktopProcess.WaitForExit(120000)) { throw 'Smoke excedeu o prazo.' }
    if ($desktopProcess.ExitCode -ne 0) { throw "Smoke falhou: $($desktopProcess.ExitCode)" }
} else {
    & (Join-Path $PSScriptRoot 'launch-desktop.ps1') -Smoke -CloseWindowSmoke:$CloseWindow
}
$report = Get-Content -LiteralPath $env:LITTLETEC_SMOKE_REPORT -Raw -Encoding UTF8 | ConvertFrom-Json
if (-not $report.bridge -or -not $report.packaged -or $report.platform -ne 'win32' -or $report.connected -or $report.node -ne 'undefined') {
    throw 'Smoke Windows incompleto.'
}
Write-Host 'Windows: interface e ponte empacotadas verificadas, sem operacao USB.'
