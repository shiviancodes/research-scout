#!/usr/bin/env bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

envPath="$SCRIPT_DIR/.env"
if [[ -f $envPath ]]; then
    while IFS='=' read -r key val; do
        [[ $key =~ ^[[:space:]]*# ]] && continue
        [[ -z $key ]] && continue
        key="${key// /}"; val="${val// /}"
        export "$key=$val"
    done < "$envPath"
fi

BACKEND_PORT="${BACKEND_PORT:-8766}"
FRONTEND_PORT="${FRONTEND_PORT:-5173}"

for port in "$BACKEND_PORT" "$FRONTEND_PORT"; do
    lsof -ti:"$port" 2>/dev/null | xargs -r kill -9 || true
done

echo "research-scout stopped."
