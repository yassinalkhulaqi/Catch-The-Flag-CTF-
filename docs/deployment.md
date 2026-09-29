# Catch The Flag — Deployment Guide

> Provider-agnostic production strategy. No vendor lock-in, no Kubernetes in V1.

---

## 1. Topology

```
                    ┌─────────────────────────────┐
 Internet ──HTTPS──►│  TLS terminator / reverse    │
                    │  proxy (nginx, Caddy, Traefik│
                    │  or a cloud LB)              │
                    └───────┬───────────┬──────────┘
                            │           │
                 /          │           │  /api  (or internal only)
                            ▼           ▼
                   ┌──────────────┐  ┌──────────────────┐
                   │  Next.js     │  │  Laravel (FPM or  │
                   │  (node, SSR) │  │  Octane), PHP 8.4 │
                   │  BFF proxy   │  └────────┬─────────┘
                   └──────┬───────┘           │
                          │      ┌────────────┤
                          │      ▼            ▼
                          │  PostgreSQL    S3-compatible object storage
                          │  (managed or   (challenge files, private)
                          │   self-hosted)
                          └──► Redis (optional, later: cache/rate limits)
```

- The browser only ever talks to **one origin** (the Next.js app). The BFF
  proxies `/api/v1/*` to Laravel with the token from the httpOnly cookie.
- Laravel does **not** need to be publicly reachable in production; keep it on
  a private network and let the proxy forward `https://your-domain/api/*` →
  Laravel *only* if you disable the BFF proxy, otherwise keep it internal.
  Default recommendation: **internal-only API, public Next.js**.

---

## 2. Environment & secrets

| Secret / config | Where |
|---|---|
| `APP_KEY` (Laravel) | secret manager — **rotating it invalidates flags** (security.md §12) |
| `DB_*` | secret manager |
| `SESSION/` token pepper | covered by `APP_KEY` |
| Storage keys (`STORAGE_*`) | secret manager |
| Mail credentials | secret manager |
| `NEXT_PUBLIC_*` | non-secret only |

Never bake secrets into images. Use env injection (systemd unit, compose
`.env`, orchestrator secrets). `.env.example` lists every required key.

---

## 3. Build & release

```bash
# --- API ---
cd apps/api
composer install --no-dev --optimize-autoloader
php artisan config:cache route:cache view:cache
php artisan migrate --force            # run at release time, not per-request

# --- Web ---
cd apps/web
npm ci
npm run build                          # includes typecheck
```

Release steps (any host):
1. Deploy new code (atomic swap / rolling).
2. `php artisan migrate --force` (backward-compatible migrations only —
   expand/contract pattern for renames).
3. Restart PHP-FPM/Octane + Next.js process manager.
4. Health-check `GET /api/v1/health` and `/`.

Rollback: redeploy previous build; DB migrations must remain compatible with
the previous release for one window (additive-first policy).

---

## 4. Process management (examples)

**systemd + php-fpm + node** (simplest single-host):
- `php-fpm` pools: `www.conf` with sane `pm` limits, `chdir = /srv/ctf/apps/api`.
- Next.js: `next start` behind a `Node` service or `pm2`.
- Proxy sample configs live in `infra/deployment/` (nginx site example).

**Docker (single host):**
```bash
docker compose -f docker-compose.prod.yml up -d --build
```
App containers run as non-root, read-only rootfs where possible, and mount
only the storage volume that must persist.

Kubernetes is **not** part of V1–V2 unless scale demands it (roadmap).

---

## 5. Reverse proxy requirements

- TLS termination + HSTS (`max-age=31536000; includeSubDomains`).
- `client_max_body_size` ≥ upload limit (default 64 MB + overhead) — otherwise
  uploads 413 before Laravel sees them.
- Forward `X-Forwarded-For`/`X-Forwarded-Proto` (trusted proxy config in
  Laravel so rate limits key on real client IPs).
- Gzip/brotli for JSON/JS/CSS; long-cache immutable Next static assets.
- Do **not** serve `storage/` directly.

---

## 6. Storage strategy

| Env | Challenge files disk | Public assets |
|---|---|---|
| Local dev | `challenge-files` (local driver, `storage/app/challenge-files`) | `public` disk |
| Production | S3-compatible (`STORAGE_DRIVER=s3`: AWS S3, Cloudflare R2, MinIO, …) | same bucket w/ separate prefix, or CDN |

Configuration is env-only (`config/filesystems.php`); application code calls
`Storage::disk('challenge-files')` and never branches on provider. Private
challenge files: bucket **not** public; downloads stream through Laravel (or
short-lived signed URLs if the proxy proves to be a bottleneck — future
optimization, does not change schema).

---

## 7. Database

- PostgreSQL 17+, dedicated DB user with DML-only grants (no CREATE/ALTER).
- `POSTGRES` extensions used: `citext` (emails), `pg_trgm` optional for search.
- Backup: nightly `pg_dump` (or provider PITR) → encrypted object storage;
  retention ≥ 14 days; **restore drill** documented in §10.
- Connection: SSL mode `verify-full` to managed DBs; `max_connections` sized
  for FPM pool (`pm.max_children` × instances) — use a pooler (PgBouncer) if
  you scale horizontally.

---

## 8. Observability baseline (V1)

- App logs → stdout/stderr (JSON-ish context incl. `request_id`) → collected
  by whatever the host provides (journald, Loki, CloudWatch…).
- `GET /api/v1/health` for LB checks (DB + challenge-files storage probe,
  version; 503 when degraded; no config leak).
- Audit log table = security-relevant trail (query via admin UI).
- Future (not built): metrics (Prometheus), tracing, SIEM export — roadmap V3.

---

## 9. Hardening checklist (every environment)

- [ ] `APP_DEBUG=false`, `APP_ENV=production`
- [ ] Secrets from env/secret manager, `APP_KEY` ≠ example value
- [ ] TLS + HSTS; cookies `Secure`
- [ ] API not publicly reachable (BFF proxy mode) or CORS locked to frontend
- [ ] DB least-privilege + SSL
- [ ] Filesystem: app user owns only `storage/` and `bootstrap/cache`
- [ ] Uploaded files never executed: `no-exec` mounts, storage outside webroot
- [ ] Rate limiting reachable behind proxy (`X-Forwarded-For` trusted)
- [ ] Log rotation; no secrets/flags in logs
- [ ] Dependency updates + `composer audit` / `npm audit` in routine
- [ ] Default admin credentials changed

---

## 10. Backup & disaster recovery

1. Nightly encrypted DB dump + object-storage versioning/replication.
2. Document RPO (≤24h with daily dumps) and RTO (redeploy + restore < 4h).
3. Quarterly restore test: fresh env → restore dump → verify `/health` and a
   known solve/XP row.
4. Losing `APP_KEY` = losing encrypted flags → runbook: rotate key, re-enter
   flags for active challenges (admin API), notify authors (security.md §12).
