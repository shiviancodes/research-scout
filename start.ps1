# --- Suppress progress UI (prevents cyan Test-NetConnection banner) ---
$ProgressPreference = 'SilentlyContinue'

# --- .env check ---
$envPath = Join-Path $PSScriptRoot '.env'
if (-not (Test-Path $envPath)) {
    Write-Host 'ERROR: .env not found. Run .\setup.ps1 first.' -ForegroundColor Red
    exit 1
}

# --- Load .env ---
Get-Content $envPath | ForEach-Object {
    if ($_ -match '^\s*([^#][^=]*?)\s*=\s*(.*?)\s*$') {
        [System.Environment]::SetEnvironmentVariable($Matches[1], $Matches[2], 'Process')
    }
}
$backendPort = $env:BACKEND_PORT
$frontendPort = $env:FRONTEND_PORT

# --- Kill existing processes on those ports ---
foreach ($port in @($backendPort, $frontendPort)) {
    $pids = netstat -ano |
        Select-String ":$port\s.*LISTENING" |
        ForEach-Object { ($_ -split '\s+')[-1] }
    foreach ($p in $pids) {
        if ($p -match '^\d+$') {
            Stop-Process -Id ([int]$p) -Force -ErrorAction SilentlyContinue
        }
    }
}

# --- Start backend ---
$backendProcInfo = Start-Process powershell -ArgumentList @(
    '-NoExit',
    '-Command',
    "cd '$PSScriptRoot\backend'; .\venv\Scripts\python.exe main.py"
) -PassThru
$backendPid = $backendProcInfo.Id

# --- Health probe: wait up to 30s for backend ---
$up = $false
for ($i = 0; $i -lt 60; $i++) {
    try {
        $client = [System.Net.Sockets.TcpClient]::new()
        $iar = $client.BeginConnect('127.0.0.1', [int]$backendPort, $null, $null)
        if ($iar.AsyncWaitHandle.WaitOne(500) -and $client.Connected) {
            $client.EndConnect($iar); $client.Close(); $up = $true; break
        }
        $client.Close()
    } catch {}
    Start-Sleep -Milliseconds 500
}
if (-not $up) {
    Write-Host "ERROR: Backend did not start on port $backendPort within 30s." -ForegroundColor Red
    Stop-Process -Id $backendPid -Force -ErrorAction SilentlyContinue
    exit 1
}

# --- Start frontend ---
Start-Process powershell -ArgumentList @(
    '-NoExit',
    '-Command',
    "cd '$PSScriptRoot\frontend'; npm run dev"
)

Write-Host ''
Write-Host 'research-scout is running.' -ForegroundColor Green
Write-Host "Dashboard: http://localhost:$frontendPort"
Write-Host "Backend:   http://localhost:$backendPort"
Write-Host 'Two terminal windows have opened for the servers.'
Write-Host 'Close them to stop research-scout.'
