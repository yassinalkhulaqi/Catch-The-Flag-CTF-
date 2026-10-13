# Catch The Flag — Roadmap

> What is built now (V1), what comes next, and which seams already exist.

---

## V1 — Cybersecurity Learning + Static CTF *(current)*

**Theme:** secure, maintainable, extensible core with zero lab infrastructure.

- Auth, roles (user/moderator/admin), profiles, sessions via BFF tokens
- Learning paths → modules → lessons (markdown) → linked challenges
- Quizzes with server-side scoring and passing attempts
- Static challenges: files, flags (HMAC/encrypted), hints (point cost), tags,
  categories, difficulty, points, solve statistics
- Submissions: rate-limited, audited, duplicate-safe solves
- XP ledger, deterministic global leaderboard, achievements
- Progress rules (lesson/quiz/challenge/module/path) — documented & tested
- Search (PostgreSQL full-text + structured filters)
- Admin panel: full content workflow (draft → review → published → archived),
  file management, users/roles, audit log viewer
- Secure file storage abstraction (local now, S3-compatible later)
- Observability baseline: structured logs, request ids, `/health`, audit trail
- Test suites (backend feature/security, frontend component/integration)
- Complete documentation set

**Architectural extension points shipped (intentionally minimal):**

| Seam | Where | Purpose |
|---|---|---|
| `flag_validation_type` enum + validator registry | challenges / FlagValidator | V2 dynamic/per-user/per-instance flags |
| Lesson ↔ Challenge many-to-many | `lesson_challenge` | Challenge can later be backed by a Lab |
| Storage disk indirection | filesystem disks | S3/R2/MinIO without app changes |
| Category/tag as data | seeded tables | new disciplines with zero code |
| XP ledger with `reference_type/id` | xp_transactions | future reward sources (events, lab completion) |

---

## V1.5 — Production hardening *(in progress on upgrade branch)*

**Theme:** harden and polish the existing V1 without adding lab infrastructure.

- Technical audit (`docs/technical-audit.md`) with severity-ranked findings
- Auth BFF CSRF Origin checks; open-redirect prevention; Markdown URL allowlist
- Rate limits: login 5/min/IP, register 3/hour/IP, submit 10/min/user+challenge
  + 30/min/user, global API 300/min
- Enforce `max_attempts`; XP ledger unique index; quiz attempt row locks
- Last-admin demotion/ban protection; avatar_path allowlist
- Expanded security tests (IDOR, throttles, mass-assign, last-admin)
- Admin users (role/ban) + path authoring UI; home featured content; dashboard
  next-action; pagination; related challenges; branded 404/error; SEO basics
- Path list progress batching (N+1 removal)

V1.5 polish landed: light and system themes, challenge authoring steps, and hard path-prerequisite enforcement. Admin achievements are authored in the web UI.

---

## V2 — Interactive labs & events

**Theme:** introduce infrastructure-backed content **without rewriting V1 core**.

- Web Security Labs, Pentesting targets, Linux/Windows privilege escalation,
  Active Directory, vulnerable machines
- Docker/VM lab lifecycle, lab providers, per-instance credentials
- VPN access & network lab connectivity
- `per_user` / `per_instance` / `dynamic` flag validators (interface exists)
- Teams & team leaderboards; CTF events with timed challenge release
- Weekly/monthly leaderboard windows (derived from `xp_transactions`)
- Notifications expansion (event starts, team activity)
- Moderated content review improvements, content versioning

**Prerequisites already handled in V1:** single submit pipeline, solver
strategy enum, isolated network assumptions documented (security.md §9),
normalized schema that only gains new tables.

**Hard rule carried forward:** lab isolation requirements (security.md §9) must
ship *with* the lab feature, never after it.

---

## V3 — Platform scale

**Theme:** courses, credentials, and serious scale.

- Courses & curated curricula (beyond paths), certificates of completion
- Advanced search/discovery (dedicated search service if PG outgrows it)
- Metrics/tracing/centralized logging, SIEM-friendly audit exports
- Public API + webhooks for integrations
- Content localization, org/classroom accounts
- Live leaderboard/event infrastructure, prize mechanics

---

## Anti-goals

- No Kubernetes/cluster orchestration for V1–V2 app hosting unless a real
  requirement appears.
- No speculative abstractions ("lab framework") shipped empty.
- No feature that cannot be secured and tested with current resources.
