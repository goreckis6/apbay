#!/usr/bin/env bash
# Adds APKBAY domain block to the shared ytdown Caddyfile (one-time / idempotent).
set -euo pipefail

DOMAIN="${DOMAIN:-apkbay.com}"
APP_PORT="${APP_PORT:-8081}"
YTDOWN_DIR="${YTDOWN_DIR:-/opt/ytdown}"
YTDOWN_CADDY="${YTDOWN_DIR}/deploy/caddy/Caddyfile"
SNIPPET="$(cd "$(dirname "$0")/.." && pwd)/caddy/site.caddyfile"
MARKER="# apkbay.com — managed by apkbay deploy"

if [[ ! -f "$YTDOWN_CADDY" ]]; then
  echo "WARN: Shared Caddyfile not found at $YTDOWN_CADDY — add deploy/caddy/site.caddyfile manually."
  exit 0
fi

if grep -qF "$MARKER" "$YTDOWN_CADDY"; then
  echo "Caddy: block for apkbay already present in $YTDOWN_CADDY"
else
  echo "" >> "$YTDOWN_CADDY"
  echo "$MARKER" >> "$YTDOWN_CADDY"
  sed "s/__DOMAIN__/${DOMAIN}/g; s/__APP_PORT__/${APP_PORT}/g" "$SNIPPET" >> "$YTDOWN_CADDY"
  echo "Caddy: appended $DOMAIN → 127.0.0.1:$APP_PORT to $YTDOWN_CADDY"
  docker compose -f "${YTDOWN_DIR}/docker-compose.yml" restart caddy 2>/dev/null || \
    docker restart site-caddy
  echo "Caddy: restarted site-caddy (required for new TLS certificate)"
fi

if ! docker ps --format '{{.Names}}' | grep -qx 'site-caddy'; then
  echo "WARN: site-caddy container not running — start ytdown first, then re-run this script."
fi
