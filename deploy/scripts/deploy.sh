#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/apkbay}"
DOMAIN="${DOMAIN:-apkbay.com}"
APP_PORT="${APP_PORT:-8081}"
YTDOWN_DIR="${YTDOWN_DIR:-/opt/ytdown}"

cd "$APP_DIR"

echo "==> APKBAY deploy in $APP_DIR (domain: $DOMAIN, port: $APP_PORT)"

compute_deploy_hash() {
  find app lib prisma middleware.ts next.config.ts package.json package-lock.json Dockerfile .dockerignore \
    -type f 2>/dev/null | sort | xargs sha256sum 2>/dev/null | sha256sum | cut -d' ' -f1
}

OLLAMA_API_KEY=""
OLLAMA_MODEL=""
ADMIN_USERNAME=""
ADMIN_PASSWORD=""
ADMIN_SESSION_SECRET=""
if [[ -f .env ]]; then
  OLLAMA_API_KEY="$(grep -E '^OLLAMA_API_KEY=' .env | cut -d= -f2- || true)"
  OLLAMA_MODEL="$(grep -E '^OLLAMA_MODEL=' .env | cut -d= -f2- || true)"
  ADMIN_USERNAME="$(grep -E '^ADMIN_USERNAME=' .env | cut -d= -f2- || true)"
  ADMIN_PASSWORD="$(grep -E '^ADMIN_PASSWORD=' .env | cut -d= -f2- || true)"
  ADMIN_SESSION_SECRET="$(grep -E '^ADMIN_SESSION_SECRET=' .env | cut -d= -f2- || true)"
fi
if [[ -f data/.env.secrets ]]; then
  # shellcheck disable=SC1091
  source data/.env.secrets
fi

mkdir -p data public/images public/files public/logo
chown -R 1001:1001 data public/files public/logo 2>/dev/null || true

if [[ -f data/prod.db ]]; then
  echo "==> prod.db present — database untouched (RUN_MIGRATIONS=1 only when schema changes)"
else
  echo "==> No prod.db — run once with RUN_MIGRATIONS=1 to initialize schema"
fi

cat > .env <<EOF
DATABASE_URL=file:/app/data/prod.db
NEXT_PUBLIC_SITE_URL=https://${DOMAIN}
NODE_ENV=production
APP_PORT=${APP_PORT}
ADMIN_USERNAME=${ADMIN_USERNAME:-admin456}
EOF

if [[ -n "${ADMIN_PASSWORD:-}" ]]; then
  echo "ADMIN_PASSWORD=${ADMIN_PASSWORD}" >> .env
else
  echo 'ADMIN_PASSWORD=Test456#' >> .env
fi

if [[ -n "${ADMIN_SESSION_SECRET:-}" ]]; then
  echo "ADMIN_SESSION_SECRET=${ADMIN_SESSION_SECRET}" >> .env
fi

if [[ -n "${OLLAMA_API_KEY:-}" ]]; then
  echo "OLLAMA_API_KEY=${OLLAMA_API_KEY}" >> .env
fi
if [[ -n "${OLLAMA_MODEL:-}" ]]; then
  echo "OLLAMA_MODEL=${OLLAMA_MODEL}" >> .env
fi

export DOMAIN APP_PORT YTDOWN_DIR

CURRENT_HASH=$(compute_deploy_hash)
STORED_HASH=""
[[ -f data/.deploy-hash ]] && STORED_HASH=$(cat data/.deploy-hash)

NEED_BUILD=0
if [[ "${FORCE_REBUILD:-0}" == "1" ]]; then
  echo "==> FORCE_REBUILD=1"
  NEED_BUILD=1
elif [[ "$CURRENT_HASH" != "$STORED_HASH" ]]; then
  echo "==> App code changed (hash ${CURRENT_HASH:0:12}…)"
  NEED_BUILD=1
elif ! docker image inspect apkbay-web:latest >/dev/null 2>&1; then
  echo "==> Docker image missing"
  NEED_BUILD=1
else
  echo "==> No app code changes — skipping Docker build"
fi

if [[ "$NEED_BUILD" == "1" ]]; then
  docker image prune -f >/dev/null 2>&1 || true
  export DOCKER_BUILDKIT=1
  echo "==> Building Docker image (public/images excluded via .dockerignore)"
  docker build -t apkbay-web --target runner .
  echo "$CURRENT_HASH" > data/.deploy-hash
fi

if [[ "${RUN_MIGRATIONS:-0}" == "1" ]]; then
  echo "==> RUN_MIGRATIONS=1 — backing up prod.db and applying Prisma migrations"
  if [[ -f data/prod.db ]]; then
    cp -a data/prod.db "data/prod.db.bak.$(date +%Y%m%d%H%M%S)"
  fi
  docker build -t apkbay-builder --target builder .
  docker run --rm \
    -v "$(pwd)/data:/app/data" \
    -e DATABASE_URL="file:/app/data/prod.db" \
    apkbay-builder \
    sh -c 'npx prisma migrate deploy'
fi

echo "==> Starting containers"
docker compose up -d --remove-orphans --no-build

if ! grep -qF "# apkbay.com — managed by apkbay deploy" "${YTDOWN_DIR}/deploy/caddy/Caddyfile" 2>/dev/null; then
  echo "==> Merging Caddy config into ytdown (one-time)"
  bash deploy/scripts/merge-caddy.sh
else
  echo "==> Caddy config already merged — skipping"
fi

echo "==> Local health check"
for i in $(seq 1 30); do
  if curl -fsS "http://127.0.0.1:${APP_PORT}/" -o /dev/null; then
    echo "OK: http://127.0.0.1:${APP_PORT}/"
    break
  fi
  if [[ "$i" -eq 30 ]]; then
    echo "ERROR: app did not become healthy on port $APP_PORT"
    docker compose logs --tail=50 apkbay-web
    exit 1
  fi
  sleep 2
done

echo "==> Deploy finished"
