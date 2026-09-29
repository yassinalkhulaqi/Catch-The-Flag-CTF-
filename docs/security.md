# Catch The Flag — Security Documentation

> V1 · Threat model, controls, and non-negotiable rules
> Companion: [architecture.md](architecture.md) · [database.md](database.md)

Catch The Flag is a **security-sensitive application**: it teaches attack
techniques, hosts intentionally malicious sample files (malware, exploits,
pcaps), and must resist an audience that is highly motivated to find holes.
This document is normative — code must match it.

---

## 1. Threat model (V1)

### 1.1 Assets
| Asset | Impact if compromised |
|---|---|
| Flag secrets | Challenge integrity destroyed; entire product value lost |
| User credentials / tokens | Account takeover, XP/leaderboard fraud |
| Admin accounts | Full content & data control |
| Challenge files (malware samples etc.) | Supply-chain style attack on users' machines if served incorrectly |
| Audit logs | Loss of forensic trail / accountability |
| Platform availability | Service denial for learners |

### 1.2 Adversaries
1. **Anonymous attacker** — probing auth, enumerating users/challenges.
2. **Authenticated player** — tries to read flags via API, tamper with XP,
   replay/forge solves, IDOR into other users' data, abuse submissions.
3. **Malicious content author (admin/moderator rogue or compromised)** —
   uploads weaponized files, exfiltrates data via admin tooling.
4. **Client-side attacker** — XSS via stored content, malicious challenge
   files containing drive-by payloads (users download *on purpose*, but we must
   not make it worse).
5. **Network attacker** — MITM, cookie theft, replay.

### 1.3 Out of scope for V1 (documented for V2 labs)
Physical access, OS-level compromise of the host, DDoS at network edge
(mitigated at provider), and lab container isolation (no labs in V1 — see §9).

---

## 2. Authentication

| Control | Implementation |
|---|---|
| Password hashing | Argon2id (Laravel default) — never reversible, never logged |
| Password policy | min 12 chars, not in common-password denylist (breeze-style rule), max 255 to prevent DoS |
| Login brute force | Rate limit `5/min` per email+IP on `/auth/login`, `10/hour` lockout escalation; identical error for unknown email vs wrong password (no enumeration) |
| Registration | Rate limit `3/hour` per IP; email uniqueness checked case-insensitively (`citext`) |
| Token issuance | Sanctum personal access tokens, `abilities` scoped (`*` for users, `admin` extra for admins), `expires_at` = 30 days |
| Token storage | **httpOnly cookie held by Next.js BFF only** — never in localStorage, never readable by JS (architecture.md §6) |
| Token revocation | `DELETE /auth/logout` revokes the current token; `logout_all` revokes all; password change revokes all tokens |
| Password reset | Token-based reset via email, single-use, 60-minute TTL, rate-limited (mail is `log` driver by default in dev) |
| Account lockout | `banned_at` flag blocks login and API access with a generic 403 |
| Session fixation | N/A for stateless tokens; cookie is regenerated (rotated) on every login |

**No enumeration:** login, register, forgot-password, and challenge-solve
responses are constant-shaped and constant-timing in their error paths.

---

## 3. Authorization

- **Every** read/write of a domain object passes through a Laravel Policy
  (`ChallengePolicy`, `PathPolicy`, `LessonPolicy`, `QuizPolicy`,
  `ChallengeFilePolicy`, …) or an explicit Gate (`viewAdminDashboard`,
  `viewAuditLogs`).
- Roles: `user < moderator < admin` (`users.role`, CHECK-constrained).
  - `user`: browse published content, submit flags, own profile/progress.
  - `moderator`: create/edit content, move it through `draft → review →
    published`, manage files/hints/flags for their content.
  - `admin`: everything + users, roles, categories, tags, achievements, audit
    logs, force-publish, XP adjustments.
- Admin routes are prefixed `/api/v1/admin/*`, grouped behind
  `role:moderator,admin` middleware **and** per-resource policies (defense in depth).
  User-management routes additionally require `role:admin`.
- **IDOR prevention:** object access is always by policy on the *authenticated
  user*, never by trusting an id in the payload. Users can only read their own
  submissions, progress, quiz attempts, XP ledger, and notifications. Tests
  explicitly attempt cross-user IDOR (see testing doc).
- Server is the source of truth for: permissions, points, XP, progress, solve
  status, flags. Clients send *intent* (`{flag}`), never *results* (`{xp}`).

### 3.1 Permission matrix (V1)

| Capability | User | Moderator | Admin |
|---|---|---|---|
| Browse published paths/challenges | ✓ | ✓ | ✓ |
| Submit flags / complete lessons / take quizzes | ✓ | ✓ | ✓ |
| Download published challenge files | ✓ | ✓ | ✓ |
| Edit own profile / settings / password | ✓ | ✓ | ✓ |
| Read own notifications / XP ledger / solves | ✓ | ✓ | ✓ |
| Admin dashboard stats | — | ✓ | ✓ |
| Create/edit/publish paths, lessons, quizzes | — | ✓ | ✓ |
| Create/edit/publish challenges + files/hints/flags | — | ✓ | ✓ |
| Manage categories / tags / achievements | — | ✓ | ✓ |
| View audit logs | — | ✓ | ✓ |
| List/ban users, change roles, adjust XP | — | — | ✓ |
| Delete achievements | — | — | ✓ |
| Demote last remaining admin | — | — | blocked |

UI hiding is never sufficient — every row above is enforced server-side.

---

## 4. Web / API surface

| Control | Approach |
|---|---|
| CSRF | Browser → Next.js is same-origin (SameSite=Lax cookie + Origin check on BFF). Laravel runs stateless Bearer auth → CSRF middleware irrelevant for `/api/*` but kept enabled for any rendered routes. |
| CORS | Laravel sends an explicit allowlist (`FRONTEND_URL`) with no wildcard `*`, no `Access-Control-Allow-Credentials` on wildcards. In practice the browser only reaches the BFF. |
| Rate limiting | Laravel `RateLimiter` (cache): login 5/min/IP · register 3/hr/IP · **flag submissions 10/min/user+challenge and 30/min/user** · file downloads 60/min/user · generic API 300/min/user · admin writes 120/min/user. 429 responses include `Retry-After`. |
| Input validation | FormRequest rules on **every** endpoint; enum/status values validated against DB CHECKs as second line; unknown fields rejected (`$request->only()` / strict mass-assignment with `$fillable`). |
| Output encoding | JSON API (never HTML-embedded). Markdown from authors is rendered **sanitized** on the client with a strict allowlist (no raw HTML in lesson/challenge markdown); stored XSS surface is minimized. |
| Security headers | Set on the web app (and API): `Content-Security-Policy` (no `unsafe-eval`; `object-src 'none'`; `base-uri 'self'`; `frame-ancestors 'none'`), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`, `Permissions-Policy`, HSTS in production. |
| Body limits | `post_max_size`/client body ≤ 32 MB (admin uploads); per-file limit configurable (`MAX_CHALLENGE_FILE_MB`, default 64 MB) and enforced server-side. |
| Error handling | Uniform JSON envelope with `request_id`; stack traces, SQL, and framework detail never returned (only logged). 500s log with request id for correlation. |
| Mass assignment | `$fillable` everywhere; `role`, `xp`, `solved_count`, `status` (where applicable) never fillable from user input. |
| Debug mode | `APP_DEBUG=false` in production — enforced by deployment checklist. |

---

## 5. Flag protection (critical)

Rules (violations are release blockers):

1. Flag plaintext exists in exactly two places: the admin input form (transient)
   and `challenge_flags.flag_ciphertext` (AES-256-GCM at rest, key = `APP_KEY`).
2. Fast comparison uses `flag_hash = HMAC-SHA256(normalized_flag, APP_KEY)`;
   every check is `hash_equals()` (constant time). No SQL `WHERE flag = ...`
   ever (prevents timing/DB-level leakage and log capture).
3. **Never** in responses: challenge detail, admin list, exports, HTML, JS,
   JSON payloads, ETag, query strings. API Resources have no `flag` attribute.
4. **Never logged**: submission logging records `flag_hash` only (12-char
   prefix in logs for correlation). Audit logs redact flag fields to `"***"`.
5. Validation happens **only** on the backend inside `SubmitFlagAction`.
6. Enumeration resistance: submissions are rate-limited per user+challenge;
   wrong-flag responses are uniform (`incorrect`), never hint at format
   similarity (`flag{` prefixes are *not* told to be right/wrong); response
   timing is dominated by fixed HMAC work, not per-character comparison.
7. Submission records store the HMAC, not the plaintext — DB leak ≠ flag leak
   (unless APP_KEY also leaks: rotate `APP_KEY` invalidates hashes; documented
   operational note).
8. Future types (`per_user`, `per_instance`, `dynamic`) plug into the same
   validator interface — **V1 implements `static` only**.

Hint costs, points, and XP are recomputed server-side from DB state on every
submission (never taken from the request).

---

## 6. File handling (untrusted content by design)

Challenge files include live malware samples, hostile archives, exploit code.
Assume **every byte is hostile**.

| Rule | Enforcement |
|---|---|
| Never execute uploaded files | No code path calls exec/proc on storage; static analysis: no `exec/proc_open/shell_exec` in app code; documented in AGENTS.md |
| Never trust client MIME | `finfo` detection server-side; type must be in an allowlist (images, archives, logs, pcaps, pdf, binaries-as-octet-stream…); declared `Content-Type` on download is a safe mapping, always `application/octet-stream` for unknowns |
| Never trust filenames | Original name is sanitized (strip path separators/control chars, limit 255) and stored **as metadata only**; storage key = `{uuid}/{uuid}.{ext}` generated server-side |
| No path traversal | Storage keys are UUIDs; download path is `{challenge}/{file}` id lookup → model → `Storage::download($model->storage_key)`. No user string ever touches a filesystem path. `../` in any uploaded name cannot escape (name is not used as a path) |
| No arbitrary writes | Laravel filesystem disks only; root is `storage/app/challenge-files`; archives are **never extracted** on the server |
| Size limits | Per-file byte check before persisting; reject > `MAX_CHALLENGE_FILE_MB`; admin body size capped |
| Integrity | SHA-256 computed server-side on read; stored for dedup/verification and shown to users for safe download verification |
| No direct exposure | `challenge-files` disk has no public URL; downloads require policy check (challenge published or admin) and go through an authorized streaming endpoint; rate-limited |
| Malware containment | Served as `application/octet-stream` + `Content-Disposition: attachment` + `nosniff`; V1 has no server-side sandbox because **files are never parsed/rendered server-side** |
| Replace/delete | Replacing a file writes a new UUID key then deletes the old object (no overwrite-in-place); soft delete keeps audit integrity |
| Anti-overwrite | No path component comes from user input, so archive/file names can never shadow application files |

---

## 7. Admin security

- Admin endpoints require `role ∈ {admin}` (moderator capabilities scoped by
  policy), enforced server-side; the UI hides what the API already denies.
- Every administrative mutation writes an `audit_logs` row with redacted
  before/after diff (`flag`/`password` → `"***"`).
- Role changes are admin-only, cannot demote the last admin (invariant check),
  and require re-authentication-sensitive action → immediately revokes the
  target user's tokens on password/role change.
- XP adjustments require a reason (stored in ledger + audit log).
- Admin actions are rate-limited and never accept client-supplied file paths.
- Audit log UI is read-only and admin-only; entries are append-only (no update/
  delete endpoints exist).

---

## 8. Data protection

| Area | Control |
|---|---|
| Secrets | All secrets from env (`APP_KEY`, DB, storage, mail). `.env` git-ignored; `.env.example` contains placeholders only. `APP_KEY` must be ≥32 random bytes (encryption of flags depends on it) |
| Passwords | Argon2id; never in logs, exports, audit diffs |
| Transport | TLS everywhere in production; HSTS enabled; cookies `Secure` in prod |
| Database | Least-privilege app user (DML only, no DDL at runtime in prod), parameterized queries via Eloquent/query builder, no raw string SQL with user input |
| PII retention | `challenge_submissions.ip_address` retained 90 days (documented purge), deletable via user deletion flow (soft delete + anonymization) |
| Logs | Structured; request logging excludes bodies for `/auth/*` and submissions; flags/keys/passwords never logged |
| Backups | DB backups encrypted at rest by provider; storage bucket versioning recommended in deployment.md |

---

## 9. Future lab isolation requirements (V2 — NOT implemented now)

When interactive labs arrive, **additional** requirements become mandatory and
are listed here so the roadmap budgets for them:

- Per-instance container/VM isolation with ephemeral credentials and strict
  egress policy (no path to the platform DB/network).
- Separation of lab network from app network (VLAN/microseg), no shared
  filesystem, resource quotas, hard TTLs.
- Per-user dynamic flags injected into instances (validator type
  `per_instance` — the V1 extension point).
- Isolated build/scan pipeline for lab images; no user input ever reaches an
  image build.
- Separate credentials per lab provider; secrets never in the app DB.
- Browser-based lab streaming must run sandboxed, origin-isolated.

**V1 ships none of this and must not pretend to.** No Docker/K8s/VPN code in V1.

---

## 10. Abuse prevention

- Rate limits (§4) + `banned_at` + submission forensics table.
- No public registration of API tokens for third parties in V1.
- Enumeration resistance on users (no public user enumeration endpoint; user
  profiles expose only public fields: name, xp, solved_count, achievements).
- Upload quotas for moderators (max files per challenge, max total bytes) to
  limit storage abuse.
- Health endpoint exposes version/status only — no config, no env, no stack.

---

## 11. Security testing (must exist)

Automated (PHPUnit):

- Unauthorized access to admin endpoints → 403 for `user`, 200 for `admin`.
- IDOR: user A cannot read user B's submissions/progress/quiz attempts/ledger.
- Flag never appears in any response body (assert on full JSON of challenge
  detail, admin show, list endpoints).
- Wrong/correct/duplicate submissions behave per spec; rate limit returns 429.
- File security: oversize upload rejected; traversal filename
  (`../../etc/passwd`) stored with sanitized metadata and never escapes root;
  download of unpublished challenge denied; binary served with attachment
  disposition; MIME spoofing rejected.
- Mass assignment: attempt to set `role`, `xp`, `status` via public endpoints →
  ignored.
- Password reset single-use + expiry; login lockout.

Manual/operational checklist lives in [development.md](development.md) §8.

---

## 12. Incident notes

- Suspected flag leak → deactivate flag (`is_active=false`), publish new flag
  variant, optionally re-award affected solves (admin action, audited).
- `APP_KEY` rotation implication: existing `flag_ciphertext` becomes
  undecryptable and `flag_hash` unverifiable → must re-seed flags (documented
  runbook in deployment.md).
- Compromised admin → ban, revoke all tokens, export audit trail.
