#!/usr/bin/env bash
set -euo pipefail

# --- Python 3.11+ ---
pyCmd=''
for cmd in python3 python; do
    if ver=$("$cmd" --version 2>&1) && [[ $ver =~ Python\ ([0-9]+)\.([0-9]+) ]]; then
        maj=${BASH_REMATCH[1]}; min=${BASH_REMATCH[2]}
        if (( maj > 3 || (maj == 3 && min >= 11) )); then pyCmd=$cmd; break; fi
    fi
done
if [[ -z $pyCmd ]]; then
    echo "ERROR: Python 3.11+ is required." >&2
    echo "Install from: https://python.org" >&2
    exit 1
fi
echo "Python: OK ($("$pyCmd" --version 2>&1 | tr -d '\n'))"

# --- Node 18+ ---
if ! nodeVer=$(node --version 2>&1); then
    echo "ERROR: Node.js not found." >&2
    echo "Install from: https://nodejs.org" >&2
    exit 1
fi
if [[ $nodeVer =~ ^v([0-9]+)\. ]]; then
    if (( BASH_REMATCH[1] < 18 )); then
        echo "ERROR: Node 18+ required (found $nodeVer)." >&2
        echo "Install from: https://nodejs.org" >&2
        exit 1
    fi
fi
echo "Node:   OK ($nodeVer)"

# --- Claude Code CLI ---
if ! command -v claude &>/dev/null; then
    echo "ERROR: Claude Code CLI is not installed." >&2
    echo "Install from: https://docs.anthropic.com/claude-code" >&2
    exit 1
fi
echo "Claude: OK ($(claude --version 2>&1 | head -1))"

# --- Python venv ---
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
venvPath="$SCRIPT_DIR/backend/venv"
if [[ ! -d $venvPath ]]; then
    echo "Creating Python virtual environment..."
    "$pyCmd" -m venv "$venvPath"
fi

# --- pip install ---
echo "Installing Python dependencies..."
"$venvPath/bin/pip" install -r "$SCRIPT_DIR/backend/requirements.txt" -q

# --- npm install ---
echo "Installing Node dependencies..."
(cd "$SCRIPT_DIR/frontend" && npm install --silent)

# --- .env ---
envPath="$SCRIPT_DIR/.env"
if [[ ! -f $envPath ]]; then
    echo "Creating .env..."
    printf 'BACKEND_PORT=8766\nFRONTEND_PORT=5173\n' > "$envPath"
fi

echo ""
echo "Setup complete. Run ./start.sh to launch research-scout."
