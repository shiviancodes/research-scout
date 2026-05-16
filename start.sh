#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# --- .env check ---
envPath="$SCRIPT_DIR/.env"
if [[ ! -f $envPath ]]; then
    echo "ERROR: .env not found. Run ./setup.sh first." >&2
    exit 1
fi

# --- Load .env ---
while IFS='=' read -r key val; do
    [[ $key =~ ^[[:space:]]*# ]] && continue
    [[ -z $key ]] && continue
    key="${key// /}"
    val="${val// /}"
    export "$key=$val"
done < "$envPath"

BACKEND_PORT="${BACKEND_PORT:-8766}"
FRONTEND_PORT="${FRONTEND_PORT:-5173}"

# --- Kill existing processes on those ports ---
for port in "$BACKEND_PORT" "$FRONTEND_PORT"; do
    lsof -ti:"$port" 2>/dev/null | xargs -r kill -9 || true
done

# --- Start backend ---
"$SCRIPT_DIR/backend/venv/bin/python" "$SCRIPT_DIR/backend/main.py" &
backendPid=$!

# --- Health probe: wait up to 10s for backend ---
up=false
for i in $(seq 1 20); do
    sleep 0.5
    if curl -sf "http://localhost:$BACKEND_PORT/api/outputs" -o /dev/null 2>/dev/null; then
        up=true
        break
    fi
done
if [[ $up != true ]]; then
    echo "ERROR: Backend did not start on port $BACKEND_PORT within 10s." >&2
    kill "$backendPid" 2>/dev/null || true
    exit 1
fi

# --- Start frontend ---
(cd "$SCRIPT_DIR/frontend" && npm run dev) &
frontendPid=$!

echo ""
echo "research-scout is running."
echo "Dashboard: http://localhost:$FRONTEND_PORT"
echo "Backend:   http://localhost:$BACKEND_PORT"
echo "Press Ctrl+C to stop both servers."

# --- Clean up on Ctrl+C ---
stop_all() {
    kill "$backendPid" "$frontendPid" 2>/dev/null || true
    for port in "$BACKEND_PORT" "$FRONTEND_PORT"; do
        lsof -ti:"$port" 2>/dev/null | xargs -r kill -9 || true
    done
    echo "research-scout stopped."
}
trap stop_all INT TERM
wait
