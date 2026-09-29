# Catch The Flag — API Documentation

> Base URL: `/api/v1` · Format: JSON (UTF-8) · Auth: `Authorization: Bearer <token>`
> All browser traffic is proxied by the Next.js BFF (architecture.md §6).
> This document is the contract: frontend and backend changes must update it.

---

## 1. Conventions

### 1.1 Envelope

**Success (single resource)**
```json
{ "data": { "id": 42, "title": "…" } }
```

**Success (collection)**
```json
{
  "data": [ … ],
  "meta": { "current_page": 1, "per_page": 20, "total": 137, "last_page": 7 },
  "links": { "next": "/api/v1/challenges?page=2", "prev": null }
}
```

**Success (action with no resource)** → `{ "data": { … } }` with action-specific
payload (e.g. `{ "result": "correct" }`).

**Error**
```json
{
  "error": {
    "code": "validation_failed",       // machine-readable, snake_case
    "message": "The given data was invalid.",
    "fields": { "email": ["Email has already been taken."] },
    "request_id": "01J…"               // correlate with server logs
  }
}
```

| HTTP | `code` values | Notes |
|---|---|---|
| 400 | `bad_request` | Malformed payload |
| 401 | `unauthenticated` | Missing/expired/invalid token |
| 403 | `forbidden` · `account_banned` | Policy denial (no resource existence leaks) |
| 404 | `not_found` | Missing **or** not-visible resource (same shape, no existence oracle) |
| 409 | `conflict` | Uniqueness / state conflicts (e.g. duplicate handle) |
| 413 | `file_too_large` | Upload over limit |
| 422 | `validation_failed` | FormRequest failures, per-field messages |
| 429 | `rate_limited` | Includes `Retry-After` header |
| 500 | `server_error` | Generic message only |

### 1.2 Pagination / filtering / sorting
- `?page=1&per_page=20` (per_page max 100). Collections are never unbounded.
- Filters are explicit query params (`category=dfir`, `difficulty=intermediate`,
  `min_points=100`, `tags=osint,malware`, `solved=true`, `q=memory dump`,
  `sort=points` / `-created_at` — leading `-` = descending).
- Unknown filter params are ignored (documented), invalid *values* → 422.

### 1.3 Rate limits (server-enforced)

| Endpoint class | Limit |
|---|---|
| `POST /auth/login` | 5 / min / IP |
| `POST /auth/register` | 3 / hour / IP |
| `POST /auth/forgot-password` | 3 / hour / IP |
| `POST /challenges/{id}/submissions` | 10 / min / user+challenge, 30 / min / user |
| `GET /challenges/{id}/files/{file}` | 60 / min / user |
| admin writes | 120 / min / user |
| everything else (auth'd) | 300 / min / user |

### 1.4 Timestamps / ids
ISO-8601 UTC (`2026-09-27T12:00:00Z`). IDs are integers. Slugs used in public
URLs; APIs accept `id` (frontend resolves slug→id via detail endpoints).

---

## 2. Authentication

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | — | Create account → `{user, token}` |
| POST | `/auth/login` | — | `{email, password}` → `{user, token}` |
| POST | `/auth/logout` | ✔ | Revoke current token |
| POST | `/auth/logout-all` | ✔ | Revoke all of user's tokens |
| GET | `/auth/me` | ✔ | Current user + role + unread count |
| PUT | `/profile` | ✔ | Update own name/bio/avatar |
| PUT | `/profile/password` | ✔ | Change password (revokes other tokens) |
| POST | `/auth/forgot-password` | — | Always 202 (no enumeration) |
| POST | `/auth/reset-password` | — | `{token, email, password}` single-use |

Token is issued as `{ "token": "…", "expires_at": "…" }`. The BFF turns it into
an httpOnly cookie; the raw token never reaches browser JS.

---

## 3. Public content

### Paths
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/paths` | — | Published paths; filters: `q, category, difficulty, progress` |
| GET | `/paths/{idOrSlug}` | — | Detail incl. modules→lessons summary, prerequisites, my progress |
| POST | `/paths/{id}/start` | ✔ | Idempotent start → progress row |
| GET | `/paths/{id}/progress` | ✔ | Deterministic completion breakdown |

### Lessons / modules
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/modules/{id}` | ✔ | Module w/ ordered lessons (published only) |
| GET | `/lessons/{id}` | ✔ | Lesson content + linked challenges (flags excluded) + quiz stub |
| POST | `/lessons/{id}/complete` | ✔ | Mark complete (rules in database.md §8) |

### Challenges
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/challenges` | —/✔ | List; filters: `q, category, difficulty, tags, min_points, max_points, solved, status=published` |
| GET | `/challenges/{idOrSlug}` | —/✔ | Detail: description, scenario, category, difficulty, points, tags, hints *(content hidden until unlocked)*, files, solve state, solve_count. **Never flags** |
| GET | `/challenges/{id}/files/{fileId}` | ✔ | Authorized download (streamed, attachment disposition) |
| POST | `/challenges/{id}/hints/{hintId}/unlock` | ✔ | Idempotent; returns hint content + remaining points |
| POST | `/challenges/{id}/submissions` | ✔ | `{ "flag": "…" }` → `{ result: "correct"\|"incorrect", points_awarded, already_solved }` |
| GET | `/challenges/{id}/solves` | — | Recent solvers (public name + time only) |

### Categories / tags
`GET /categories` · `GET /tags` — no auth, active items only.

### Leaderboard
`GET /leaderboard?page&per_page` → ranked users
(`xp DESC, solved_count DESC, id ASC`), includes `rank, name, xp, solved_count,
achievements_count`. `GET /leaderboard/me` → caller's rank (dense rank via same
ordering).

---

## 4. Authenticated user

| Method | Path | Description |
|---|---|---|
| GET | `/me/progress` | Started paths + completion % per path + totals |
| GET | `/me/solves` | Own solves with challenge summary, points, hints used |
| GET | `/me/xp-ledger` | Paginated `xp_transactions` |
| GET | `/me/achievements` | Awarded + progress-toward-locked achievements |
| GET | `/me/notifications` | Paginated; `POST /me/notifications/{id}/read`, `POST /me/notifications/read-all` |
| GET | `/me/settings` / PUT | Email + persisted theme (`system`/`light`/`dark`) |

### Quizzes
| Method | Path | Description |
|---|---|---|
| GET | `/quizzes/{id}` | Questions **without** `is_correct` flags |
| POST | `/quizzes/{id}/attempts` | Start attempt |
| POST | `/quiz-attempts/{id}/answer` | `{question_id, selected_option_ids[]}` |
| POST | `/quiz-attempts/{id}/submit` | Server scores → `{score, passed, correct_count}` |
| GET | `/quiz-attempts/{id}` | Own attempt result incl. explanations |

---

## 5. Admin (`/admin/*`, role-gated)

Every mutation is audited (`audit_logs`) and rate-limited.

```
GET/POST        /admin/paths            GET/PUT/DELETE /admin/paths/{id}
POST            /admin/paths/{id}/publish | unpublish | archive | review
GET/POST        /admin/paths/{id}/modules           /admin/modules/{id}
GET/POST        /admin/modules/{id}/lessons         /admin/lessons/{id}
GET/POST        /admin/lessons/{id}/challenges      (link/unlink)

GET/POST        /admin/challenges       GET/PUT/DELETE /admin/challenges/{id}
POST            /admin/challenges/{id}/publish | unpublish | archive | review
GET/POST/DELETE /admin/challenges/{id}/files        (multipart upload)
PUT             /admin/challenges/{id}/files/{fileId} (replace)
GET/POST/PUT/DELETE /admin/challenges/{id}/hints
GET/POST/PUT/DELETE /admin/challenges/{id}/flags     (write-only; GET returns label+state only)
POST            /admin/challenges/{id}/preview      (rendered content, admin only)

GET/POST        /admin/quizzes …        /admin/quizzes/{id}/questions
GET/POST        /admin/categories       PUT/DELETE /admin/categories/{id}
GET/POST        /admin/tags             DELETE /admin/tags/{id}
GET/POST        /admin/achievements     PUT/DELETE /admin/achievements/{id}
GET             /admin/users            GET/PUT /admin/users/{id}
PUT             /admin/users/{id}/role  POST /admin/users/{id}/ban|unban
POST            /admin/users/{id}/xp    {amount, reason}  (audited)
GET             /admin/audit-logs       (filter: actor, action, entity, date)
GET             /admin/stats            (dashboard counters; Gate `viewAdminDashboard`)
```

Admin quiz `GET/POST/PUT` responses include option `is_correct` for staff editors.
Learner `GET /quizzes/{id}` never includes `is_correct`.

**Flag rule in admin API:** `POST/PUT` accept `{ value }`; responses only ever
return `{ id, label, case_sensitive, is_active, created_at }` — never the value.
There is intentionally **no** "reveal flag" endpoint in V1 (admin replaced, not
re-read — security.md §5).

---

## 6. System

| Method | Path | Description |
|---|---|---|
| GET | `/health` | `{ status, version, db, storage, time }` — 503 when degraded; no config/stack exposure |

---

## 7. Error/auth examples

```http
POST /api/v1/challenges/42/submissions
Authorization: Bearer <token>
Content-Type: application/json

{ "flag": "flag{…}" }
```
```jsonc
// 200 correct
{ "data": { "result": "correct", "points_awarded": 450, "hints_used": 1,
            "already_solved": false, "xp_total": 1980 } }

// 200 incorrect (uniform shape, no hints about format)
{ "data": { "result": "incorrect" } }

// 401
{ "error": { "code": "unauthenticated", "message": "Unauthenticated.", "request_id": "01J…" } }

// 429
{ "error": { "code": "rate_limited", "message": "Too many submissions.", "request_id": "01J…" } }
```

---

## 8. Versioning & stability

- Breaking changes only under a new prefix (`/api/v2`); additive fields are
  non-breaking and allowed.
- Frontend consumes only the BFF (`/api/v1/*` same-origin), so Laravel stays
  internal-facing behind the proxy in production.
- Contract tests (backend feature tests) assert the envelope shapes above.
