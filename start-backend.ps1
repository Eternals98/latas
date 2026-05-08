$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendRoot = Join-Path $repoRoot 'backend'
$backendSrcRoot = Join-Path $backendRoot 'src'
$venvPython = Join-Path $backendRoot '.venv\Scripts\python.exe'

if (-not (Test-Path $backendSrcRoot)) {
    throw "No existe la carpeta backend\src en $backendSrcRoot"
}

# Load environment variables from .env file
$envFile = Join-Path $backendRoot '.env'
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*([^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            if ($value.StartsWith('"') -and $value.EndsWith('"')) {
                $value = $value.Substring(1, $value.Length - 2)
            }
            [Environment]::SetEnvironmentVariable($key, $value)
        }
    }
}

Set-Location $backendSrcRoot

if (Test-Path $venvPython) {
    & $venvPython -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
    exit $LASTEXITCODE
}

Write-Warning "No se encontro backend\.venv. Usando 'python' del sistema."
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
