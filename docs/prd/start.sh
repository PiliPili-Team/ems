#!/usr/bin/env bash
# Build the PRD site and serve it on the local network.
# Usage: ./start.sh [port]      (default 4173; override with PORT=xxxx)
set -euo pipefail

cd "$(dirname "$0")"
PORT="${1:-${PORT:-4173}}"

if [ ! -d node_modules ]; then
  echo "Installing dependencies..."
  npm install --no-audit --no-fund
fi

echo "Cleaning previous build output..."
rm -rf .vitepress/dist .vitepress/cache

echo "Building PRD site..."
npm run build --silent

# Collect private IPv4 addresses of this machine (macOS and Linux).
lan_ips() {
  if command -v ifconfig >/dev/null 2>&1; then
    ifconfig | awk '/inet / && $2 != "127.0.0.1" {print $2}'
  elif command -v hostname >/dev/null 2>&1; then
    hostname -I 2>/dev/null | tr ' ' '\n'
  fi | grep -E '^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.)' || true
}

echo
echo "PRD is running. Open it from any device on the same network:"
echo "  Local:    http://localhost:${PORT}/"
ips="$(lan_ips)"
if [ -n "$ips" ]; then
  while read -r ip; do
    [ -n "$ip" ] && echo "  Network:  http://${ip}:${PORT}/"
  done <<< "$ips"
else
  echo "  Network:  (no LAN address found; check your Wi-Fi or Ethernet connection)"
fi
echo
echo "Press Ctrl+C to stop."
echo

exec npx vitepress preview . --host 0.0.0.0 --port "$PORT" --strictPort
