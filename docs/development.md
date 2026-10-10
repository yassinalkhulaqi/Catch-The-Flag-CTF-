# Catch The Flag — Development Guide

> How to work on this repository: setup, conventions, commands, quality gates.
> Companion: [architecture.md](architecture.md) · [security.md](security.md)

---

## 1. Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Docker + Compose | v2 | Runs PostgreSQL (+ optional Redis) **and** the API runtime |
| Node.js | 20.11+ (22 LTS recommended) | Frontend |
| npm | 10+ | Workspaces not used; per-app `package.json` |
| Git | 2.40+ | |

The API **can** run natively if your PHP (8.3/8.4) has the extensions
`pdo_pgsql, mbstring, curl, dom/xml, zip, intl, bcmath`. If not (common on
stock installs), run it in the provided container — both modes are supported
and documented in the README.

---

## 2. Local setup

```bash
# 1. clone + env
cp .env.example .env

# 2. start services (postgres + api)
docker compose up -d --build

# 3. install frontend deps
npm install --prefix apps/web

# 4. app env files (first run only)
cp apps/api/.env.example apps/api/.env     # if running API natively
cp apps/web/.env.example apps/web/.env.local

# 5. migrate + seed demo content & admin user
docker compose exec api php artisan migrate --seed

# 6. run everything
docker compose exec api php artisan serve --host=0.0.0.0 --port=8000   # API
npm run dev --prefix apps/web                                           # Web :3000
```

Default seeded admin: see `.env.example` → `SEED_ADMIN_EMAIL` /
`SEED_ADMIN_PASSWORD` (change in production!).

---

## 3. Commands

### Backend (`apps/api`)
```bash
php artisan migrate                 # migrate
php artisan migrate:fresh --seed    # reset + seed
php artisan test                    # all tests
php artisan test --filter=Flag      # subset
php artisan pints                   # style fixer (Laravel Pint)
php artisan route:list --path=api   # route inventory
php artisan config:clear            # after .env edits (native only)
```

### Frontend (`apps/web`)
```bash
npm run dev          # Next dev server
npm run build        # production build (also runs typecheck)
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
npm run test         # Vitest unit/component
npm run test:watch   # watch mode

# Design-system gallery (development only; production 404s unless opted in)
# http://localhost:3000/dev/design-system
# ENABLE_DESIGN_SYSTEM=true npm run start   # optional production preview
```

### Root helpers
```bash
./scripts/dev.sh up      # compose up + migrate + dev servers
./scripts/dev.sh test    # backend + frontend test suites
./scripts/dev.sh lint    # pint + eslint + tsc
```

---

## 4. Branching & git

- `main` is always releasable. **This project currently works directly on
  `main`** — keep commits logical and buildable.
- Never push unless explicitly instructed.
- Before changing code: `git status` + read `AGENTS.md` + relevant docs.
- Never discard or overwrite unrelated user changes.
- Commit style: `type(scope): summary` — e.g.
  `feat(challenges): rate-limit flag submissions`,
  `fix(auth): reject banned accounts on login`.

---

## 5. Coding conventions

### Backend (Laravel / PHP 8.4)
- **Thin controllers** → delegate to `app/Actions/*` (single public method,
  DB transaction where multi-write). Services for domain logic; policies for
  authorization; FormRequests for validation; API Resources for output.
- Strict types (`declare(strict_types=1)` in new classes); enums for closed
  value sets (`app/Enums`); no magic strings/numbers — put tunables in
  `config/ctf.php`.
- Eloquent: `$fillable` explicit; casts declared; relations eager-loaded to
  avoid N+1 (`withCount`/`with`); scopes for common filters.
- Never expose models directly — always through a Resource.
- Never log or return flags/passwords/tokens (security.md §5).
- Every admin mutation writes an audit entry via `AuditLogger`.

### Frontend (Next.js / TypeScript)
- Server Components default; `"use client"` only for interactive islands.
- All API calls through `lib/api/*` (typed client) — **no raw `fetch` to Laravel
  from components**; browser only hits same-origin BFF routes.
- Shared types in `lib/types/` generated/kept in sync with API resources.
- Components: named for domain (`ChallengeCard`, `FlagSubmitBox`), not
  `BigWrapper2`. Styling via Tailwind utility classes + shadcn/ui primitives;
  design tokens from `globals.css` (dark-first).
- Accessibility is part of "done": labels, focus rings, contrast, keyboard paths.
- No `dangerouslySetInnerHTML` for untrusted content; markdown rendered with a
  sanitized renderer.

### Docs
- Update the relevant `docs/*` file **in the same PR** as behavior changes.
- ADRs for decisions with lasting consequences (`docs/decisions/NNNN-title.md`).

---

## 6. Database workflow

- Migrations are append-only history; **edit released migrations only via a
  new migration**.
- Every migration must be reversible (`up` + `down`).
- Constraints live in the DB (CHECK/UNIQUE/FK) — app validation is layer one,
  DB is layer two (database.md §10).
- Seeds: `DatabaseSeeder` creates roles/categories/tags, demo paths/challenges,
  and the admin user from env. Seeds must be idempotent.

---

## 7. Testing strategy

| Layer | Tool | Must cover |
|---|---|---|
| Backend unit | PHPUnit | FlagValidator, XP/hint math, ProgressCalculator, AchievementEvaluator |
| Backend feature | PHPUnit | auth, CRUD, submissions, progress, leaderboard, admin workflow |
| Backend security | PHPUnit | IDOR, admin 403s, flag absence in responses, upload/path-traversal, rate limits, mass assignment |
| Frontend component | Vitest + RTL | cards, flag box, nav, forms |
| Frontend integration | Vitest + MSW | login flow, solve flow, progress display |

Rules:
- Tests assert **behavior**, not implementation (status + payload shape).
- Every bug fix ships with a regression test.
- `./scripts/dev.sh test` must pass before any commit.

---

## 8. Manual security checklist (pre-release)

- [ ] `APP_DEBUG=false`, `APP_KEY` rotated from example, secrets not committed
- [ ] `FRONTEND_URL`/CORS allowlist exact, no `*`
- [ ] TLS + HSTS, secure cookies
- [ ] Admin seeded password changed; no default creds
- [ ] `flag{` grep across `storage/logs`, responses (dev tools), and build output → nothing
- [ ] Upload a `../../evil.png` filename → stored as UUID, root intact
- [ ] Hammer submissions → 429 with Retry-After
- [ ] Reverse-proxy passes `X-Forwarded-For` correctly for rate limits
- [ ] DB user has no DDL privileges (prod)
- [ ] Backup/restore drill documented in deployment.md

---

## 9. Architecture Decision Records (ADRs)

Numbered files in `docs/decisions/`. Write an ADR when a decision:
(1) is expensive to reverse, (2) has significant security impact, or
(3) adds/removes a dependency. Status values: `accepted` · `superseded by NNN`.

Current ADRs: see [decisions/](decisions/).
