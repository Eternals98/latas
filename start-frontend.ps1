$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$webRoot = Join-Path $repoRoot 'web'

if (-not (Test-Path $webRoot)) {
    throw "No existe la carpeta web en $webRoot"
}


$backendHost = "127.0.0.1"
$backendPort = 8000

Write-Host "Esperando backend en ${backendHost}:${backendPort}..."

while ($true) {
    try {
        $client = New-Object System.Net.Sockets.TcpClient
        $client.Connect($backendHost, $backendPort)
        $client.Close()

        Write-Host "Backend disponible en ${backendHost}:${backendPort}. Iniciando frontend..."
        break
    }
    catch {
        Write-Host "Esperando backend en ${backendHost}:${backendPort}..."
        Start-Sleep -Seconds 2
    }
}


Set-Location $webRoot
npm run dev
