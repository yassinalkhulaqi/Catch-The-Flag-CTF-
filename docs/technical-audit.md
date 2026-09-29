# Catch The Flag — Technical Audit (Production Upgrade)

> **Date:** 2026-09-29 · **Baseline:** `main` @ `d6619cf` (V1 merge)  
> **Branch:** `cursor/ctf-production-upgrade-6191`  
> **Scope:** V1 static challenges + learning paths (no live labs)

This document is the production-upgrade audit. Findings are severity-ranked and
were verified against the codebase. Fixes land on this branch in subsequent
commits; the **Status** column tracks remediation.

---

## 1. Current architecture (strengths)

| Area | Assessment |
|---|---|
| Monorepo | Clear `apps/web` + `apps/api` + `docs/` split |
| Auth | Sanctum tokens in httpOnly cookie via Next.js BFF; browser never sees tokens |
| Domain layer | Thin controllers → Actions → Services → Eloquent; Policies + Resources |
| Flags | AES-GCM ciphertext + HMAC; never in learner/admin list Resources; audit redacts |
| Solves | `UNIQUE(challenge_id, user_id)` + `lockForUpdate` in `SubmitFlagAction` |
| Files | UUID storage keys, finfo MIME allowlist, stream download, no archive extract |
| CORS | Frontend origin allowlist only |
| Design | Dark-first tokens, restrained accent, branded landing |
| Tests | Critical auth/flag/IDOR smoke present (thin — see gaps) |
| CI | API Pint+PHPUnit + web lint/typecheck/test/build |

---

## 2. Critical issues

| ID | Finding | Evidence | Status |
|---|---|---|---|
| C1 | Open redirect after login via `next=//evil` | `apps/web/components/auth/login-form.tsx` | OPEN → fix |

---

## 3. High issues

| ID | Finding | Evidence | Status |
|---|---|---|---|
| H1 | Auth BFF routes skip Origin/Host CSRF check | `app/api/v1/auth/{login,register,logout}/route.ts` | OPEN |
| H2 | Markdown `<a href>` allows `javascript:` schemes | `components/markdown.tsx` | OPEN |
| H3 | No branded `not-found` / `error` / `global-error` pages | missing under `apps/web/app` | OPEN |
| H4 | Per-challenge submit rate limit configured but unwired | `config/ctf.php` vs `routes/api.php` | OPEN |
| H5 | Global `api` RateLimiter registered but unused | `AppServiceProvider` / routes | OPEN |
| H6 | Register throttle ≠ docs (5/min vs 3/hour) | `routes/api.php` | OPEN |
| H7 | `max_attempts` never enforced on submit | `SubmitFlagAction` | OPEN |
| H8 | Admin path authoring UI missing (API exists) | `admin/paths/page.tsx` | OPEN |
| H9 | Admin user ban/role UI missing (API exists) | `admin/users/page.tsx` | OPEN |
| H10 | Security test matrix incomplete | `tests/Feature/*` | OPEN |

---

## 4. Medium issues

| ID | Finding | Status |
|---|---|---|
| M1 | `xp_transactions` lacks unique (user, reason, ref) defense-in-depth index | OPEN |
| M2 | `GradeQuizAttemptAction` lacks `lockForUpdate` on attempt | OPEN |
| M3 | Client-controlled `avatar_path` (path injection risk) | OPEN |
| M4 | Paths list N+1 on `progressPercent` | OPEN |
| M5 | Error JSON from `EnsureRole` / some actions omit `request_id` | OPEN |
| M6 | Notifications / settings stubs incomplete | OPEN |
| M7 | Admin quiz resource omits `is_correct` for staff editors | OPEN |
| M8 | AdminStats lacks policy authorize (middleware only) | OPEN |
| M9 | No last-admin demotion protection | OPEN |
| M10 | Challenge list pagination UI missing | OPEN |
| M11 | Related challenges unused on detail page | OPEN |
| M12 | Home page lacks featured path/challenge from API | OPEN |
| M13 | Dashboard “next step” is weak (first path only) | OPEN |
| M14 | Logged-in users can still open `/login`/`/register` | OPEN |
| M15 | Mobile nav omits Admin link | OPEN |
| M16 | SEO: missing OG/canonical; most pages title-only | OPEN |
| M17 | Upload validation exceptions may surface as 500 not 422 | OPEN |

---

## 5. Low issues

| ID | Finding |
|---|---|
| L1 | `--faint` contrast may fail WCAG for small text |
| L2 | Incorrect flag feedback uses `role="status"` (prefer `alert`) |
| L3 | Challenge editor is a large client component (~480 LOC) |
| L4 | Site header is fully client for mobile menu alone |
| L5 | Default Next.js SVGs still in `public/` |
| L6 | Path prerequisites displayed but not hard-enforced (documented V1 choice) |
| L7 | Notification types exist but no UI |

---

## 6. Security findings (summary)

**Good:** Flag secrecy, policies on object routes, mass-assignment hygiene on
User/Challenge, solve uniqueness, file hostility model, CORS, BFF token strip.

**Must fix this upgrade:** C1 open redirect · H1 auth BFF Origin · H2 markdown
URLs · H4–H7 rate limits + max_attempts · H10 security tests · M3 avatar_path ·
M9 last-admin guard.

---

## 7. Performance findings

- Path list progress percent is N+1 (M4).
- Challenge listing is paginated server-side; UI lacks page controls (M10).
- File download streams (good); keep that pattern.
- No Redis required; database cache is fine for V1 (ADR-0010).

---

## 8. UX findings

- Landing is brand-strong but not a product entry (no featured content).
- Dashboard lacks a clear “do this next” lesson/challenge.
- Admin CMS incomplete for paths and users.
- Missing branded 404/500.
- Empty/Error components exist and are used well on many pages.

---

## 9. Database findings

- Schema is generally strong (FKs, CHECKs, soft deletes, generated tsvector).
- Add unique index on XP ledger references (M1).
- `max_attempts` column unused by app logic (H7).
- Quiz `selected_option_ids` as jsonb (fixed earlier) — OK.

---

## 10. Testing gaps

Must expand:

- Per-challenge submit throttle 429
- Register hourly throttle
- `max_attempts` enforcement
- Concurrent solve (second request already_solved / unique)
- Quiz attempt IDOR
- File/hint cross-challenge IDOR
- Moderator cannot hit `/admin/users`
- Last-admin demotion blocked
- MIME rejection on upload
- Profile mass-assign role/xp
- Frontend: open-redirect rejection; markdown bad href

---

## 11. Technical debt

- Notification endpoints are stubs.
- Settings theme is display-only.
- Admin achievements list is read-only.
- Permission matrix not documented as a single matrix table (add in security.md).
- Docs vs code drift on register rate limit.

---

## 12. Recommended upgrade sequence

1. Security quick wins (C1, H1, H2, H3, H4–H7)
2. DB integrity (M1) + quiz lock (M2) + avatar (M3)
3. Expand security tests (H10)
4. Admin CMS: users + paths
5. UX: home, dashboard next-step, pagination, related, SEO
6. Performance: path list progress batching
7. Docs sync + roadmap V1.5
8. Final regression (test/lint/typecheck/build)

---

## 13. Out of scope (unchanged)

Live machines, VPN, Docker labs, shells, AD, K8s orchestration, teams/events,
paid courses, Meilisearch, Redis-as-hard-dependency.
