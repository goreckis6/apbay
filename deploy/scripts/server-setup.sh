#!/usr/bin/env bash
# One-time VPS setup (run as root or with sudo). Safe alongside ytdown at /opt/ytdown.
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/apkbay}"
APP_USER="${APP_USER:-${SUDO_USER:-root}}"

echo "==> Creating $APP_DIR"
mkdir -p "$APP_DIR/data" "$APP_DIR/public/images"
chown -R "$APP_USER:$APP_USER" "$APP_DIR"

if command -v docker >/dev/null 2>&1; then
  echo "==> Docker OK: $(docker --version)"
else
  echo "ERROR: Docker not installed"
  exit 1
fi

if [[ -d /opt/ytdown ]]; then
  echo "==> ytdown detected at /opt/ytdown (shared Caddy on :80/:443)"
else
  echo "WARN: /opt/ytdown not found — ensure ytdown Caddy is running before HTTPS works"
fi

if ss -tlnp 2>/dev/null | grep -q ':8081 '; then
  echo "WARN: port 8081 already in use — set APP_PORT to another free port"
fi

echo "==> Installing systemd unit"
cp "$APP_DIR/deploy/systemd/apkbay.service" /etc/systemd/system/apkbay.service
systemctl daemon-reload
systemctl enable apkbay.service

echo "==> Done. Next: push to GitHub (main) or run deploy/scripts/deploy.sh manually."
