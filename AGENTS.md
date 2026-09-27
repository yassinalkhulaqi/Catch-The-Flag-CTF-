# AGENTS.md — Catch The Flag (CTF)

> Read this file first in every session. It is the authoritative quick-start
> for how this project works. Deep detail lives in `docs/` (linked below).

---

## 1. Project purpose

**Catch The Flag** is a cybersecurity learning + CTF platform.
V1 = **structured learning paths** (theory → practice) + **static/file-based
CTF challenges** (download files, find the flag, submit it) + XP, progression,
leaderboard, achievements, and a full admin authoring workflow.

It is **not** a live-hacking platform in V1 (see §10).

---

## 2. Architecture (one paragraph)

Monorepo with a **Next.js** frontend (`apps/web`) and a **Laravel** REST API
(`apps/api`, `/api/v1`) on **PostgreSQL 17**. The browser talks **only** to
Next.js; Next.js route handlers act as a thin **BFF proxy** that attaches a
Sanctum token from an `httpOnly` cookie (ADR-0004). Laravel is the **source of
truth** for permissions, points, XP, progress, solve status, and flags.
Controllers are thin → `app/Actions` (use-cases, transactional) → `app/Services`
(domain) → Eloquent. **Policies** authorize every read/write. API Resources are
the only serialization path. Files live behind a `challenge-files` storage disk
(local dev / S3-compatible prod), downloaded only via authorized endpoints.

Diagrams & detail: `docs/architecture.md`.

---

## 3. Tech stack

| Layer | Tech |
|---|---|
| Frontend | Next.js (App Router), TypeScript, React, Tailwind CSS, shadcn/ui |
| Backend | Laravel, PHP 8.4, Sanctum tokens, FormRequests, Policies, API Resources |
| DB | PostgreSQL 17 (citext, generated tsvector search, CHECK constraints) |
| Cache/queue | Laravel cache — `database` default, Redis opt-in (ADR-0010) |
| Storage | Laravel filesystem disks: `public` (avatars/thumbs), `challenge-files` (private, env-switched local/S3) |
| Local infra | Docker Compose: `postgres`, `api` (PHP container) — web runs natively via npm |
| Tests | PHPUnit (backend), Vitest + RTL + MSW (frontend) |

---

## 4. Repository structure

```
apps/web/        Next.js app: app/(public), app/(auth), app/(app), app/admin, app/api (BFF)
apps/api/        Laravel app: app/{Actions,Services,Enums,Policies,Models,Http}
docs/            architecture · product · database · api · security · development · deployment · roadmap
docs/decisions/  ADRs (0001–0010)
infra/           docker/ + deployment/ (nginx sample)
scripts/         dev.sh (up/test/lint helpers)
docker-compose.yml   postgres + api
.env.example     every env var, no secrets
```

---

## 5. Commands

```bash
# services
docker compose up -d --build
docker compose exec api php artisan migrate --seed
docker compose exec api php artisan serve --host=0.0.0.0 --port=8000

# backend (in apps/api or via docker compose exec api)
php artisan migrate | migrate:fresh --seed | test | pint | route:list --path=api

# frontend (in apps/web)
npm run dev | build | lint | typecheck | test

# root helpers
./scripts/dev.sh up | test | lint
```

Full setup: `docs/development.md`. Never claim something works without running
the relevant command.

---

## 6. Coding conventions

**Backend**
- Thin controller → `app/Actions/*` (one public method, wraps multi-writes in
  `DB::transaction`) → `app/Services/*` for domain logic → Eloquent models
  (relationships/casts/scopes only, **no business logic, no giant models**).
- Validation in `FormRequest`s; authorization in `Policies` (call
  `$this->authorize(...)`); output via `Http/Resources` (never serialize a
  model directly).
- `declare(strict_types=1)` in new PHP classes; enums in `app/Enums`; tunables
  in `config/ctf.php` (no magic numbers).
- `$fillable` explicit; never fillable: `role`, `xp`, `solved_count`,
  `solve_count`, `flag*`, `status` (except through dedicated admin actions).
- Every admin mutation → `AuditLogger::log(...)` with redacted diff.

**Frontend**
- Server Components by default; `"use client"` only for interactive islands.
- All API calls via `lib/api/*` typed client → **same-origin BFF routes only**;
  components never fetch Laravel directly; browser never sees tokens.
- Domain-named components (`ChallengeCard`, `FlagSubmitBox`), Tailwind +
  shadcn/ui primitives, tokens from `globals.css` (dark-first, restrained
  accent, professional — no neon overload, no HTB/THM cloning).
- A11y is part of done: labels, focus states, contrast, keyboard flow.

**Docs**
- Behavior changes update the matching `docs/*` file in the same change.

---

## 7. Security rules (non-negotiable)

1. **Flags:** never return/log/serialize flag plaintext. Stored as
   `flag_ciphertext` (AES-GCM) + `flag_hash` (HMAC); compare with
   `hash_equals()`. No "reveal flag" endpoint. See `docs/security.md` §5.
2. **Client is untrusted:** XP, points, progress, solve status, permissions are
   computed server-side only.
3. **Every** object access goes through a Policy (IDOR is a release blocker).
4. **Files are hostile:** never execute uploaded files; never trust client MIME
   or filenames; storage keys are server-generated UUIDs; no path built from
   user input; downloads only via policy-checked streaming endpoint; archives
   never extracted server-side.
5. Rate limits: submissions 10/min/user+challenge (and 30/min/user), login
   5/min/IP, downloads 60/min/user — configured in `config/ctf.php`.
6. No secrets in git/logs/responses. `.env.example` = placeholders only.
7. `APP_DEBUG=false` in production; errors return generic messages +
   `request_id`.
8. Admin routes: role middleware **and** policies (defense in depth) **and**
   audit logging.

Full threat model: `docs/security.md`.

---

## 8. Testing (mandatory)

```bash
# backend
php artisan test
# frontend
npm run test --prefix apps/web
# both
./scripts/dev.sh test
```

Must-have coverage: register/login/logout · path lesson complete · file
download authz · flag correct/wrong/duplicate · XP + progress updates ·
leaderboard determinism · admin create/publish · unauthorized access (403) ·
IDOR attempts · flag-absence assertions in responses · upload limits &
path-traversal filenames · rate limiting · mass-assignment attempts.

Every bug fix ships a regression test.

---

## 9. Database

- Migrations are history: never edit a committed migration — add a new one.
- DB constraints (FK/CHECK/UNIQUE) are the second validation layer; keep them
  in sync with app rules (`docs/database.md` is the ERD source of truth).
- Seeds are idempotent: categories (8 V1 disciplines), tags, demo path,
  demo challenges, admin user from `SEED_ADMIN_*` env.
- Ranking is deterministic: `ORDER BY xp DESC, solved_count DESC, id ASC`.

---

## 10. V1 scope — hard constraints

**V1 = static/file-based challenges + learning paths.** The following must NOT
be built, scaffolded, stubbed, or "prepared" in V1 code:

❌ live machines / vulnerable VMs · ❌ Docker-in-Docker user labs ·
❌ VPN infrastructure · ❌ Windows/Linux target VMs · ❌ Active Directory labs ·
❌ browser-based Kali / web exploitation sandboxes · ❌ real-time shells ·
❌ Kubernetes / container orchestration · ❌ per-user VPS.

If a future task asks for these → it belongs to **V2+**
(`docs/roadmap.md`), and must follow `docs/security.md` §9 (lab isolation
requirements). The only lab-related code allowed in V1 is the documented
extension point: `challenges.flag_validation_type` enum + validator strategy
registry (only `static` implemented) and the lesson↔challenge many-to-many
relationship. Do **not** create empty `Lab`/`Machine`/`Vpn` classes.

Also out of scope: teams, CTF events, courses, certificates, weekly
leaderboards, Meilisearch/Elasticsearch, Redis-as-hard-dependency.

---

## 11. Future architecture notes (V2/V3)

- New challenge types (`web`, `container_lab`, `machine_lab`, `vm`) plug into
  `FlagValidator` strategies + a future `LabInstance` lifecycle — new tables,
  not core rewrites.
- Leaderboard windows derive from `xp_transactions.created_at` (schema already
  supports it).
- RBAC upgrade path: swap `users.role` column reads for `roles`/`role_user`
  tables behind `User::hasRole()` (ADR-0003).
- Search upgrade path: `ChallengeSearchService` interface → Meilisearch (V3).
- Storage upgrade path: env only (`STORAGE_DRIVER=s3`), no code change.

---

## 12. Git & workflow rules

- Inspect state first (`git status`, `git branch`, `git log`). **Work on
  `main`** unless told otherwise. Never push to remote unless explicitly
  instructed. Never discard/overwrite unrelated user changes.
- Commit only when asked; commits are logical and buildable
  (`type(scope): summary`).
- Phased delivery: docs/architecture → scaffold → auth → content → CTF engine →
  UX → admin → security → tests → docs polish. Verify at each phase
  (`test` + `lint` pass) before moving on.
- Consult current official framework docs when behavior may have changed;
  don't guess.

---

## 13. Quality bar

Not "it works" — it must be **secure, typed, validated, tested, documented,
maintainable, modular**. No giant files/controllers/models, no duplicated
business logic, no speculative abstractions, no dependency without a documented
reason. Prefer official framework features over packages.
