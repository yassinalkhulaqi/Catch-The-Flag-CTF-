# Catch The Flag (CTF)

**Modern cybersecurity learning + CTF platform.**
Structured learning paths (theory → practice) and static/file-based CTF
challenges across SOC, DFIR, malware analysis, reverse engineering,
cryptography, OSINT, and steganography — with XP, progression, achievements,
leaderboards, and a full admin authoring workflow.

> **V1 scope:** static/file-based challenges only. No live machines, no VPN
> labs, no Docker labs, no interactive exploitation infrastructure.
> See [docs/roadmap.md](docs/roadmap.md) for V2/V3.

---

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | Next.js (App Router) · TypeScript · React · Tailwind CSS · shadcn/ui |
| Backend | Laravel (PHP 8.4) REST API `/api/v1` · Sanctum tokens · Policies |
| Database | PostgreSQL 17 |
| Storage | Laravel filesystem abstraction — local (dev) / S3-compatible (prod) |
| Local infra | Docker Compose (`postgres` + `api`), web runs natively |

Architecture: monorepo, browser → Next.js BFF → Laravel → PostgreSQL.
Full details: **[docs/architecture.md](docs/architecture.md)**.

---

## Repository structure

```
apps/web/            Next.js frontend (+ BFF route handlers)
apps/api/            Laravel backend
docs/                architecture · product · database · api · security ·
                     development · deployment · roadmap · decisions/ (ADRs)
infra/docker/        container build files
infra/deployment/    sample reverse-proxy configs
scripts/dev.sh       up / test / lint helpers
docker-compose.yml   local services
.env.example         all environment variables (no secrets)
AGENTS.md            agent/session quick-start — read this first
```

---

## Quick start

**Prerequisites:** Docker + Compose, Node 20.11+ (22 LTS recommended), npm.

```bash
git clone <repo> && cd catch_the_flag
cp .env.example .env

# start PostgreSQL + API container, install web deps
docker compose up -d --build
npm install --prefix apps/web

# database (idempotent seeds: categories, demo path/challenges, admin user)
docker compose exec api php artisan migrate --seed

# API on :8000
docker compose exec api php artisan serve --host=0.0.0.0 --port=8000
# Web on :3000 (second terminal)
npm run dev --prefix apps/web
```

Open http://localhost:3000 · API health: http://localhost:8000/api/v1/health

Seeded admin credentials come from `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`
in `.env` (defaults documented in `.env.example` — **change them**).

Full guide (native PHP option, troubleshooting): [docs/development.md](docs/development.md).

---

## Environment variables

All variables are documented with safe defaults in
[**`.env.example`**](.env.example). Highlights:

| Var | Purpose |
|---|---|
| `APP_KEY` | Laravel encryption key — **protects flag ciphertext/HMAC** |
| `DB_*` | PostgreSQL connection |
| `FRONTEND_URL` | BFF origin (CORS/links) |
| `API_URL` | Laravel base URL for the BFF proxy |
| `STORAGE_DRIVER` | `local` (dev) / `s3` (prod) + `STORAGE_*` creds |
| `MAX_CHALLENGE_FILE_MB` | upload size ceiling |
| `SEED_ADMIN_*` | bootstrap admin account |
| `REDIS_*` / `CACHE_STORE` | optional; default is database cache |

**Never commit real secrets.** `.env*` is git-ignored.

---

## Commands

```bash
# backend (apps/api, or: docker compose exec api php artisan …)
php artisan migrate | migrate:fresh --seed | test | pint

# frontend (apps/web)
npm run dev | build | lint | typecheck | test

# both
./scripts/dev.sh test
./scripts/dev.sh lint
```

---

## Testing

- **Backend:** PHPUnit — feature, authorization, flag-submission, progress,
  file-security, rate-limit suites (`php artisan test`).
- **Frontend:** Vitest + React Testing Library + MSW for critical flows
  (`npm run test --prefix apps/web`).

CI order: lint → typecheck → backend tests → frontend tests.

---

## Security notes (summary)

- Flags are encrypted at rest and compared via keyed HMAC (`hash_equals`) —
  never returned, logged, or embedded in HTML/JS ([docs/security.md](docs/security.md) §5).
- Uploaded challenge files are hostile: UUID storage keys, server-detected
  MIME, size limits, no path built from user input, no execution, private
  downloads through policy-checked endpoints (§6).
- Server is the sole authority for XP, points, progress, solves, permissions.
- Rate limits on auth, submissions, downloads; audit log for admin actions.
- Full threat model and controls: **[docs/security.md](docs/security.md)**.

---

## Deployment

Provider-agnostic guide (systemd or single-host Docker, nginx/Caddy, managed
Postgres, S3-compatible storage, hardening checklist, backup drill):
**[docs/deployment.md](docs/deployment.md)**.

---

## Roadmap

- **V1 (now):** learning paths + static CTF + XP/leaderboard/achievements + admin.
- **V2:** interactive labs (web/pentest/machines/AD), dynamic flags, teams,
  events — built on the extension points already in V1.
- **V3:** courses, certificates, advanced search/metrics, public API.

Details: [docs/roadmap.md](docs/roadmap.md) ·
ADRs: [docs/decisions/](docs/decisions/) ·
Product spec: [docs/product.md](docs/product.md).

---

## License

TBD — all rights reserved until a license is chosen.
