#!/usr/bin/env bash
# Catch The Flag — dev helper
#   ./scripts/dev.sh up      start services, migrate + seed
#   ./scripts/dev.sh dev     run backend (API :8000) + frontend (Web :3000) together
#   ./scripts/dev.sh test    backend + frontend test suites
#   ./scripts/dev.sh lint    pint + eslint + tsc
#   ./scripts/dev.sh down    stop services
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

api() { docker compose exec api php artisan "$@"; }

case "${1:-}" in
  up)
    docker compose up -d --build
    echo "→ waiting for postgres…"
    until docker compose exec -T postgres pg_isready -U "${POSTGRES_USER:-ctf}" -d "${POSTGRES_DB:-catch_the_flag}" >/dev/null 2>&1; do sleep 1; done
    if [ ! -f apps/api/.env ]; then
      cp apps/api/.env.example apps/api/.env
      api key:generate -n
    fi
    api migrate --force --seed || api migrate --force
    echo "✓ DB ready. Now run:"
    echo "  docker compose exec api php artisan serve --host=0.0.0.0 --port=8000   # API :8000"
    echo "  npm run dev --prefix apps/web                                           # Web :3000"
    ;;
  serve)
    api serve --host=0.0.0.0 --port=8000
    ;;
  dev)
    docker compose up -d
    echo "→ waiting for postgres…"
    until docker compose exec -T postgres pg_isready -U "${POSTGRES_USER:-ctf}" -d "${POSTGRES_DB:-catch_the_flag}" >/dev/null 2>&1; do sleep 1; done
    if [ ! -f apps/api/.env ]; then
      cp apps/api/.env.example apps/api/.env
      api key:generate -n
    fi
    # migrate --seed on fresh DB; tolerate non-idempotent re-seed on existing DB
    api migrate --force --seed || api migrate --force
    echo "→ starting API :8000 + Web :3000 (Ctrl+C to stop)…"
    trap 'kill 0' INT TERM EXIT
    docker compose exec -T api php artisan serve --host=0.0.0.0 --port=8000 2>&1 | sed 's/^/[api] /' &
    npm run dev --prefix apps/web 2>&1 | sed 's/^/[web] /' &
    wait
    ;;
  test)
    echo "── backend ──"
    docker compose exec api php artisan test
    echo "── frontend ──"
    npm test --prefix apps/web
    ;;
  lint)
    echo "── backend (pint) ──"
    docker compose exec api ./vendor/bin/pint --test
    echo "── frontend (eslint + tsc) ──"
    npm run lint --prefix apps/web
    npm run typecheck --prefix apps/web
    ;;
  down)
    docker compose down
    ;;
  *)
    echo "usage: $0 {up|dev|serve|test|lint|down}" >&2
    exit 1
    ;;
esac
