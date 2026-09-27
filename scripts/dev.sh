#!/usr/bin/env bash
# Catch The Flag — dev helper
#   ./scripts/dev.sh up      start services, migrate + seed
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
    api migrate --seed
    echo "✓ DB ready. Now run:"
    echo "  docker compose exec api php artisan serve --host=0.0.0.0 --port=8000   # API :8000"
    echo "  npm run dev --prefix apps/web                                           # Web :3000"
    ;;
  serve)
    api serve --host=0.0.0.0 --port=8000
    ;;
  test)
    echo "── backend ──"
    docker compose exec api php artisan test
    echo "── frontend ──"
    npm test --prefix apps/web
    ;;
  lint)
    echo "── backend (pint) ──"
    docker compose exec api ./vendor/bin/pints --test
    echo "── frontend (eslint + tsc) ──"
    npm run lint --prefix apps/web
    npm run typecheck --prefix apps/web
    ;;
  down)
    docker compose down
    ;;
  *)
    echo "usage: $0 {up|serve|test|lint|down}" >&2
    exit 1
    ;;
esac
