$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendRoot = Join-Path $repoRoot 'backend'
$venvPython = Join-Path $backendRoot '.venv\Scripts\python.exe'

if (-not (Test-Path $backendRoot)) {
    throw "No existe la carpeta backend en $backendRoot"
}

Set-Location $backendRoot

if (Test-Path $venvPython) {
    & $venvPython -m uvicorn src.api.main:app --reload --host 0.0.0.0 --port 8000
    exit $LASTEXITCODE
}

Write-Warning "No se encontro backend\.venv. Usando 'python' del sistema."
python -m uvicorn src.api.main:app --reload --host 0.0.0.0 --port 8000
