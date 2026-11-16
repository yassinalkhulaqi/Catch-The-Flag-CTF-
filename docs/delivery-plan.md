# Catch The Flag — Delivery Plan (5 stacked branches)

> **Status:** active · **Base:** `main` @ `6aa7596` · **Scope:** V1-hardening and
> platform depth. **No lab infrastructure** (AGENTS.md §10).
>
> This plan sequences five branches, each stacked on the previous one, so that
> every branch is independently reviewable, independently mergeable, and
> buildable on its own. Each branch grows the codebase by a planned amount.

---

## 1. Ground rules (inherited, not negotiable)

| Rule | Source | How it shows up here |
|---|---|---|
| V1 scope | AGENTS.md §10 | No live machines, VPNs, container labs, AD labs, shells, K8s, per-user VPS. No teams, events, courses, certificates, weekly leaderboards. |
| Flags stay secret | AGENTS.md §7.1 | No branch may add a flag-reveal path, log a flag, or serialize flag material. |
| Policies on every object | AGENTS.md §7.3 | Every new endpoint ships with a policy check. |
| Files are hostile | AGENTS.md §7.4 | No new upload path without finfo detection, UUID keys, streaming download. |
| Rate limits are config | AGENTS.md §6 | Every new limiter reads `config/ctf.php`. |
| Tests are mandatory | AGENTS.md §8 | Every feature ships with backend + frontend coverage; every bug fix ships a regression test. |
| Docs move with behaviour | AGENTS.md §6 | Each branch updates the matching `docs/*.md` in the same change. |
| Commits are buildable | AGENTS.md §12 | One logical change per commit, `type(scope): summary`. |
| Audit every admin write | AGENTS.md §6 | Admin mutations call `AuditLogger::log(...)` with a redacted diff. |

---

## 2. Branch map

| # | Branch | Theme | Target lines | Commits |
|---|---|---|---|---|
| 1 | `feat/ops-observability-baseline` | Make the platform observable and operable | ~1,500 | ~12 |
| 2 | `feat/security-hardening-and-test-matrix` | Close the audit's OPEN findings and complete the missing test matrix | ~2,250 | ~14 |
| 3 | `feat/content-authoring-depth` | Make authoring as good as the platform; retire authoring debt | ~3,000 | ~16 |
| 4 | `feat/learning-analytics-and-insights` | Turn progress into insight: learner analytics, admin analytics, bookmarks, email | ~4,000 | ~18 |
| 5 | `feat/platform-integrations-and-delivery` | Open the platform up and ship it properly: public API, webhooks, i18n, SEO/PWA, perf, CI | ~5,000 | ~20 |

**Line accounting.** "Target lines" = net added lines measured with
`git diff --stat <parent>..<branch>` (added lines only, excluding lock files
and generated assets). Each branch is measured against its own parent, so the
numbers are cumulative across the stack (~15,750 lines total).

**Stacking.** Branch *n* is created from branch *n-1*'s tip:

```
main ──▶ 1 ──▶ 2 ──▶ 3 ──▶ 4 ──▶ 5
```

Merging in order 1→5 into `main` yields a linear history with no conflicts.

---

## 3. Branch 1 — `feat/ops-observability-baseline` (~1,500 lines)

**Theme.** Today a request that fails tells you a `request_id`; a request that
succeeds tells you nothing. There is no structured log, health is a stub, and
two rate limits are hardcoded outside config. This branch makes the platform
observable and operable without changing any product behaviour.

### Deliverables

1. **Request correlation (`X-Request-Id`)**
   - `RequestId` middleware: honours an inbound `X-Request-Id` after a strict
     charset/length allowlist, generates a UUID when absent or hostile.
   - Binds the id to the log context for the whole request lifecycle.
   - Echoes `X-Request-Id` on **every** response — success and error alike.
   - The existing error envelope keeps using the same id (no second source of
     truth).
2. **Structured logging**
   - `structured` log channel (JSON formatter) with request context merged in.
   - `config/logging.php` gains the channel; `LOG_CHANNEL`/`LOG_LEVEL` env.
   - The 500 handler logs the correlated id, route, method and exception class.
3. **Health endpoints**
   - `GET /api/v1/health` → liveness (cheap, no I/O).
   - `GET /api/v1/health/ready` → readiness: database, cache, challenge-file
     disk; reports each dependency separately, never leaks paths.
   - `GET /api/v1/health/live` → liveness alias for orchestrators.
   - `HealthCheckService` owns the dependency probes; the controller is thin.
4. **Rate limits move into config**
   - `register` limiter is no longer hardcoded in `AppServiceProvider`.
   - New `password_reset` limiter.
   - `.env.example` (root + api) gains the missing variables:
     `RATE_LIMIT_REGISTER_PER_HOUR`, `RATE_LIMIT_ADMIN_PER_MIN`,
     `RATE_LIMIT_API_PER_MIN`, `RATE_LIMIT_PASSWORD_RESET_PER_HOUR`.
5. **Retention commands (dead config becomes real)**
   - `ctf:prune-submissions` — implements `submissions.ip_retention_days`.
   - `ctf:prune-tokens` — removes expired Sanctum tokens.
   - Both are idempotent, report counts, and take `--dry-run`.
6. **Frontend**
   - The BFF forwards `X-Request-Id` from Laravel to the browser.
   - The error boundary and toast surface the request id so a user can quote it
     in a bug report.
7. **Tests** — request-id propagation (valid, hostile, absent), health probes,
   rate-limit configuration, prune commands, frontend error surface.
8. **Docs** — `docs/architecture.md` (observability), `docs/development.md`
   (commands), `docs/security.md` (§4 request id as a control), `.env.example`.

### Exit criteria
`php artisan test` green · `pint --test` clean · `npm run lint|typecheck|test`
green · docs updated.

---

## 4. Branch 2 — `feat/security-hardening-and-test-matrix` (~2,250 lines)

**Theme.** `docs/technical-audit.md` §10 lists the security tests that were
never written, and §5 L4 is the only OPEN finding. This branch closes both and
adds the account-level controls a public platform needs.

### Deliverables

1. **Complete the security test matrix** (audit §10, verbatim scope)
   - Concurrent solve → second request is `already_solved`, never double XP.
   - Quiz attempt IDOR → foreign attempt is 404, not 403.
   - File / hint cross-challenge IDOR.
   - Moderator cannot reach `/admin/users` or `/admin/audit-logs`.
   - MIME rejection on upload (spoofed extension, real bytes).
   - Mass assignment: `role`, `xp`, `solved_count` ignored on profile update.
   - Password-reset token **reuse** (not just expiry).
   - CORS behaviour on the API surface.
   - `429` + `Retry-After` shape on every limiter.
2. **Account lockout**
   - `login_attempts` table + `LoginThrottle` service.
   - Progressive backoff after N failures, config-driven, IP + account scoped.
   - Audit entry on lockout and on admin unlock.
   - `POST /admin/users/{user}/unlock`.
3. **Rate-limit hardening**
   - Per-IP download cap, per-IP global API cap, per-role admin cap.
4. **Session hygiene**
   - Active-session listing and per-session revocation.
   - Token rotation on privilege change (role change, ban, password change).
   - `__Host-` cookie prefix + `SameSite` tightening in the BFF.
5. **Header and transport hardening**
   - CSP nonce for the Next.js inline bootstrap script.
   - `Strict-Transport-Security` in production.
   - `Cross-Origin-Opener-Policy`, `Cross-Origin-Resource-Policy`.
6. **Server-side content sanitisation** for walkthrough/lesson markdown, so a
   hostile admin paste cannot ship a stored XSS to the reader.
7. **Frontend** — active-sessions panel, lockout messaging, security settings
   section.
8. **Docs** — `docs/security.md` (lockout, sessions, headers), audit status
   table flipped to FIXED with evidence.

### Exit criteria
Every audit §10 row has a named test · no OPEN findings remain · suites green.

---

## 5. Branch 3 — `feat/content-authoring-depth` (~3,000 lines)

**Theme.** The API can author quizzes, modules and lessons, but the UI cannot.
Staff also have two parallel challenge editors and six duplicated components.
This branch closes the authoring gap and retires the debt.

### Deliverables

1. **Quiz authoring UI** — questions, options, `is_correct`, question types
   (`single`, `multiple`, `true_false`), reordering, pass score, live preview.
2. **Module & lesson authoring UI** — module ordering, lesson body editor with
   markdown preview, lesson ↔ challenge linking from the UI.
3. **Content moderation queue** — `ContentStatus::Review` becomes a real
   workflow: queue, filter, assign, approve / request changes with a note,
   audit trail.
4. **Content duplication** — clone a challenge or a path (with modules, lessons
   and quiz), as a draft.
5. **Draft preview** — render a published-looking preview of unpublished
   content, staff-only, watermarked.
6. **Bulk operations** — multi-select publish / archive / tag on the admin
   content tables, each row audited.
7. **Debt retirement**
   - Merge the legacy admin challenge detail page into the 6-step wizard.
   - Delete the six duplicated components (`login-form`, `register-form`,
     `forgot-password-form`, `start-path-button`, `path-create-form`,
     `difficulty-badge`/`difficulty-pill`).
   - Mount the orphaned `stats-chart.tsx` / `audit-log-table.tsx`.
8. **Backend completeness** — factories for every model, richer idempotent
   demo seed content.
9. **Tests & docs** — API tests for the review workflow, duplication and bulk
   operations; frontend tests for the new editors; `docs/content-authoring.md`
   rewritten; `docs/api.md` extended.

### Exit criteria
Staff can author a full path (modules → lessons → quiz → challenges) without a
developer · no duplicate authoring UIs remain · suites green.

---

## 6. Branch 4 — `feat/learning-analytics-and-insights` (~4,000 lines)

**Theme.** The platform knows a user's XP and solve count and nothing else.
This branch turns progress into insight — for the learner and for the staff
who author the content — and adds the two learner features that make a
learning platform sticky: bookmarks and notes.

### Deliverables

1. **Analytics service and endpoints**
   - Site-wide stats, per-category solve rates, per-challenge attempt → solve
     funnel, XP time series, retention cohorts.
   - All aggregate queries live in one service; endpoints stay thin.
2. **Admin analytics dashboard**
   - Mount and extend the orphaned chart component; add time series, category
     performance, at-risk content, top solvers, drop-off points.
3. **Learner analytics**
   - Mastery per vulnerability track, difficulty progression, a
     "what to study next" recommendation queue (first-party logic, no new
     dependency).
   - The existing read-only `streakDays` becomes a real streak view with a
     calendar.
4. **Bookmarks and notes**
   - New tables, policies, endpoints and UI: bookmark a lesson, challenge or
     path; attach a private note.
5. **Email notifications and preferences**
   - Mail channel for `PathCompleted` and `AchievementEarned`.
   - Queued jobs so mail never blocks a request.
   - Notification preferences UI (per type, per channel) and a digest.
6. **Tests & docs** — analytics correctness tests (fixed fixtures, deterministic
   ordering), bookmark/note CRUD tests, notification preference tests, frontend
   dashboard tests, `docs/product.md` and `docs/api.md` updates.

### Exit criteria
Admin dashboard answers "what is working and what is not" from real data ·
learner sees mastery and next steps · mail sends from a queue · suites green.

---

## 7. Branch 5 — `feat/platform-integrations-and-delivery` (~5,000 lines)

**Theme.** Everything so far is a closed platform. This branch opens it up to
integrations and finishes the delivery craft: public API, webhooks, complete
i18n, SEO/PWA, performance, and a hardened CI matrix.

### Deliverables

1. **Public API and API tokens**
   - Personal access tokens as a first-class resource: create, list, revoke,
     scope by ability, expiry, last-used tracking.
   - A dedicated guard distinct from the browser session, with its own rate
     limit and audit trail.
   - A developer-facing API documentation page.
2. **Webhooks**
   - Subscriptions (event list, target URL, secret), signed deliveries
     (HMAC-SHA256 + timestamp), retry with backoff, delivery log, per-subscription
     disable, and a manual "redeliver" action.
   - SSRF hardening on target URLs (scheme allowlist, private-range rejection).
3. **Internationalisation**
   - Backend `lang/` files and `Accept-Language` negotiation on the API.
   - Frontend dictionary coverage for every remaining hard-coded string
     (English + Arabic, RTL preserved).
4. **SEO and PWA**
   - `sitemap.xml`, `robots.txt`, web manifest, icons, Open Graph images.
   - Service worker with an offline shell and cache versioning.
5. **Performance**
   - Catalog read caching with explicit invalidation, conditional requests
     (ETag), index review against real query plans, bundle and image budgets.
6. **Release engineering**
   - CI matrix (PHP 8.4/8.5, Node 22/24), coverage reporting, dependency
     audit, complete `.env.example`, a deployment runbook.
7. **Tests & docs** — token lifecycle and scoping tests, webhook signing and
   retry tests, SSRF rejection tests, i18n parity test (every key in every
   locale), SEO/PWA tests, `docs/api.md` v1 → public API section.

### Exit criteria
A third party can register, get a token, and consume the API · webhooks
deliver signed payloads and survive a failing endpoint · every UI string is
translated · suites green.

---

## 8. Verification protocol

Every branch, before it is called done:

```bash
# backend
docker compose exec api php artisan migrate --seed
docker compose exec api php artisan test
docker compose exec api vendor/bin/pint --test

# frontend
npm run lint    --prefix apps/web
npm run typecheck --prefix apps/web
npm run test    --prefix apps/web
npm run build   --prefix apps/web
```

Plus, for branches that touch security (§7 of AGENTS.md): an explicit check
that no response body contains flag material, and that the audit trail wrote
the expected rows.

**Commit discipline.** One logical change per commit, message format
`type(scope): summary`, and a commit must leave the tree green. Branch
boundaries are themselves commits (`chore(release): ...`) so a reviewer can
bisect.

---

## 9. Risks

| Risk | Mitigation |
|---|---|
| Scope creep toward V2 lab features | Hard rule in AGENTS.md §10; the plan above contains no lab infrastructure. |
| Flag secrecy regression | No branch touches flag storage; §7.1 checks are part of the exit criteria. |
| Dead config (already happened once with `ip_retention_days`) | Branch 1 wires retention to a real command; branch 5 audits config coverage. |
| Unverifiable backend changes | CI runs the full backend suite on every branch; a branch that cannot pass CI is not merged. |
| Branch 5 is large | Split into reviewable commits; the API-token slice can ship on its own if the branch must be shortened. |

## 10. Status as of the build session (honest accounting)

| # | Branch | State | Measured diff |
|---|---|---|---|
| 1 | feat/ops-observability-baseline | **Done, pushed** | ~1,500 lines |
| 2 | feat/security-hardening-and-test-matrix | **Done, pushed** | ~1,320 lines |
| 3 | feat/content-authoring-depth | **Done** - authoring UI (lessons/quizzes/linked challenges), review queue, duplication, live stats, bulk path table, retired legacy editor + duplicate components | ~2,600 lines |
| 4 | feat/learning-analytics-and-insights | **Partial** - staff analytics + learner bookmarks shipped; **email notifications + preferences and learner mastery/streak UI NOT delivered (deferred)** | ~4,100 lines |
| 5 | feat/platform-integrations-and-delivery | **Started** - SEO/PWA slice landed (robots, sitemap, manifest, icon); **public API + PATs, webhooks, full i18n and CI matrix NOT delivered** | ~180 lines |
| | | **Delivered so far** | **~9,700 lines** |

Backend PHPUnit was authored everywhere but never executed locally; Docker Desktop would not start and local PHP is 8.3 vs the required 8.4, so CI (.github/workflows/ci.yml, Postgres 17) is the verification gate for the backend. Frontend lint, typecheck, vitest (149 tests) and next build all pass.

## 11. Phase 0 consolidation (status: in progress)

All five branches above are now **merged into `fix/phase00-consolidation`**
(one `--no-ff` merge each, in size order: observability → security →
content → analytics → platform). During that pass:

- **Recovered the admin achievements CRUD backend** (`91b665f`) —
  controller, request, resource, audited upsert action, tightened
  `achievements_criteria_type_check` DB constraint, and a 10-case feature
  test. The original implementation was silently dropped from `main` in
  merge `d6619cf` while the web UI survived; the routes seam is the known
  risk and every merge into the consolidation branch was seam-checked
  (`routes/api.php` diffed, no conflict markers repo-wide).
- Frontend verification on the merged tree: **lint clean, typecheck clean,
  vitest 39 files / 153 tests passing**.
- Backend suite still awaits local execution (same Docker/WSL gate as
  above; a WSL2 kernel repair was in progress at time of writing). CI
  remains the authoritative backend gate until that lands.
- Deferred slices from branches 4/5 (email notifications, mastery/streak
  UI, public API + PATs, webhooks, full i18n) carry forward as candidate
  scope for **Phase 1+**, together with the admin authoring-depth UI gaps
  (dedicated module/lesson/quiz/hint editor pages) and the test-matrix
  deepening from `docs/technical-audit.md`.

