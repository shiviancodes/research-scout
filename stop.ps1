$envPath = Join-Path $PSScriptRoot '.env'
if (Test-Path $envPath) {
    Get-Content $envPath | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]*?)\s*=\s*(.*?)\s*$') {
            [System.Environment]::SetEnvironmentVariable($Matches[1], $Matches[2], 'Process')
        }
    }
}
$backendPort  = if ($env:BACKEND_PORT)  { $env:BACKEND_PORT }  else { '8766' }
$frontendPort = if ($env:FRONTEND_PORT) { $env:FRONTEND_PORT } else { '5173' }

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

Write-Host 'research-scout stopped.'
