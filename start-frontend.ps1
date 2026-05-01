$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$webRoot = Join-Path $repoRoot 'web'

if (-not (Test-Path $webRoot)) {
    throw "No existe la carpeta web en $webRoot"
}

Set-Location $webRoot
npm run dev
