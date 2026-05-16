# Setup script — run once after cloning.

# --- Python 3.11+ ---
$pyCmd = $null
foreach ($cmd in @('python', 'python3', 'py')) {
    try {
        $ver = (& $cmd --version 2>&1).ToString()
        if ($ver -match 'Python\s+(\d+)\.(\d+)') {
            [int]$maj = $Matches[1]; [int]$min = $Matches[2]
            if ($maj -gt 3 -or ($maj -eq 3 -and $min -ge 11)) { $pyCmd = $cmd; break }
        }
    } catch {}
}
if (-not $pyCmd) {
    Write-Host 'ERROR: Python 3.11+ is required.' -ForegroundColor Red
    Write-Host 'Install from: https://python.org' -ForegroundColor Yellow
    exit 1
}
Write-Host "Python: OK ($((& $pyCmd --version 2>&1).ToString().Trim()))"

# --- Node 18+ ---
try {
    $nodeVer = (node --version 2>&1).ToString().Trim()
    if ($nodeVer -match 'v(\d+)\.') {
        if ([int]$Matches[1] -lt 18) {
            Write-Host "ERROR: Node 18+ required (found $nodeVer)." -ForegroundColor Red
            Write-Host 'Install from: https://nodejs.org' -ForegroundColor Yellow
            exit 1
        }
    } else { throw 'cannot parse node version' }
} catch {
    Write-Host 'ERROR: Node.js not found.' -ForegroundColor Red
    Write-Host 'Install from: https://nodejs.org' -ForegroundColor Yellow
    exit 1
}
Write-Host "Node:   OK ($nodeVer)"

# --- Claude Code CLI ---
if (-not (Get-Command claude -ErrorAction SilentlyContinue)) {
    Write-Host 'ERROR: Claude Code CLI is not installed.' -ForegroundColor Red
    Write-Host 'Install from: https://docs.anthropic.com/claude-code' -ForegroundColor Yellow
    exit 1
}
Write-Host "Claude: OK ($(claude --version 2>&1 | Select-Object -First 1))"

# --- Python venv ---
$venvPath = Join-Path $PSScriptRoot 'backend\venv'
if (-not (Test-Path $venvPath)) {
    Write-Host 'Creating Python virtual environment...'
    & $pyCmd -m venv $venvPath
    if ($LASTEXITCODE -ne 0) { Write-Host 'ERROR: venv creation failed.' -ForegroundColor Red; exit 1 }
}

# --- pip install ---
Write-Host 'Installing Python dependencies...'
$pip = Join-Path $venvPath 'Scripts\pip.exe'
& $pip install -r (Join-Path $PSScriptRoot 'backend\requirements.txt') -q
if ($LASTEXITCODE -ne 0) { Write-Host 'ERROR: pip install failed.' -ForegroundColor Red; exit 1 }

# --- npm install ---
Write-Host 'Installing Node dependencies...'
Push-Location (Join-Path $PSScriptRoot 'frontend')
npm install --silent
$npmExit = $LASTEXITCODE
Pop-Location
if ($npmExit -ne 0) { Write-Host 'ERROR: npm install failed.' -ForegroundColor Red; exit 1 }

# --- .env (no BOM — vite loadEnv and PS regex both need clean ASCII) ---
$envPath = Join-Path $PSScriptRoot '.env'
if (-not (Test-Path $envPath)) {
    Write-Host 'Creating .env...'
    $envContent = "BACKEND_PORT=8766`nFRONTEND_PORT=5173`n"
    [System.IO.File]::WriteAllText($envPath, $envContent, [System.Text.UTF8Encoding]::new($false))
}

Write-Host ''
Write-Host 'Setup complete. Run .\start.ps1 to launch research-scout.' -ForegroundColor Green
