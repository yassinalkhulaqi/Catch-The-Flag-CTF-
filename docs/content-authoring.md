# Catch The Flag — Content Authoring Guide

> How to create Paths, Modules, Lessons, Quizzes, Challenges, Hints, Files,
> and Flags for V1. Companion to [product.md](./product.md) and
> [security.md](./security.md).

---

## 1. Principles

1. Every challenge teaches a **specific cybersecurity skill**.
2. Evidence files are **untrusted artifacts** — never executed on the server.
3. Flags are **secrets** — write-only via admin API; never revealable in V1.
4. Unpublished content is **invisible** to learners (same 404 as missing).
5. Prefer clear scenarios over “find the string in a text file” busywork
   (unless the skill *is* basic string extraction).

---

## 2. Publishing workflow

```
Draft → Review → Published → Archived
```

| Status | Learner-visible? | Notes |
|---|---|---|
| `draft` | No | Authoring in progress |
| `review` | No | Ready for editorial check |
| `published` | Yes | Requires valid metadata + active flag (challenges) |
| `archived` | No | Soft-retired; keeps history |

Admin UI: `/admin/challenges` (details → scenario → files → hints → flag → preview and publish), `/admin/paths`. Server validates before publish
(`PublishChallengeAction` / `PublishPathAction`).

---

## 3. Paths → Modules → Lessons

### Path
- **Title / slug** — stable public URL (`/paths/{slug}`)
- **Summary** (≤400 chars) — card text
- **Description** — Markdown-friendly longer copy
- **Category**, **difficulty** (`beginner|intermediate|advanced|expert`)
- **Estimated minutes**, optional prerequisites (other published paths). A learner cannot start a path, or open its modules and lessons, until those prerequisites are completed. Paths already in progress stay available. Do not create a cycle.

### Module
Ordered section inside a path. Title + short description + position.

### Lesson
- Theory content as **Markdown** (sanitized on render — no raw HTML)
- Support headings, lists, tables, fenced code, callouts via Markdown
- Link 0..n challenges via `lesson_challenge`
- Optional quiz attached to the lesson or its module

**Completion rule:** learner explicitly marks the lesson complete
(`POST /lessons/{id}/complete`). Awards lesson XP once (ledger-guarded).

---

## 4. Quizzes

Question types: `single`, `multiple`, `true_false`.

Rules:
- Options’ `is_correct` **never** leave the API before grading.
- Grade server-side on attempt submit.
- Pass score default: `config('ctf.quiz.default_pass_score')` (70).
- Passing awards quiz XP once per user+quiz (ledger).

Author tips: write explanations for each question; keep stems unambiguous.

---

## 5. Challenges

### Required fields
| Field | Guidance |
|---|---|
| Title / slug | Unique, descriptive |
| Description | What the learner must do |
| Scenario | Narrative / case framing |
| Category | One of the eight V1 disciplines (data-driven) |
| Difficulty | beginner → expert |
| Points | 1–10000; typical Easy≈100, Hard≈400+ |
| Flag | Set via admin flags API (write-only) |
| `flag_validation_type` | `static` only in V1 |

Optional: tags, estimated minutes, hints, files, lesson links, max attempts.

### Flag conventions
- Format for demo/dev: `CTF{development_only_example}` (obvious, never prod).
- Production flags: high-entropy, unique per challenge, no reuse across challenges.
- Case sensitivity is per-flag (`case_sensitive`).
- Normalization: trim whitespace; optionally lower-case when not case-sensitive.
- **Never** put the flag in description, scenario, file names, or public metadata.

### Challenge quality checklist
- [ ] Skill taught is explicit
- [ ] Evidence is sufficient and reproducible offline
- [ ] Difficulty matches required tooling/knowledge
- [ ] Hints escalate gently without spoiling
- [ ] Linked to a lesson/path when part of a curriculum
- [ ] Active flag configured before publish

---

## 6. Files

Upload only through admin endpoints. Rules (enforced server-side):

1. Never trust client filename or MIME.
2. Storage key = server-generated UUID path on `challenge-files` disk.
3. Size ≤ `MAX_CHALLENGE_FILE_MB` (default 64).
4. Checksum (SHA-256) stored for integrity.
5. Downloads only via authorized streaming endpoint.
6. Archives are **never** extracted on the server.
7. Malware/binary samples are stored as opaque blobs — never executed.

Recommended original names: `auth_failed.log`, `capture.pcap`, `sample.bin`
(descriptive, no paths, no secrets in the name).

---

## 7. Hints

Ordered list per challenge. Each hint may cost points (`cost_points`).
Unlock is idempotent and server-side; penalty applied once.
Do not put the flag in any hint.

---

## 8. Categories & tags (V1 seeds)

**Categories:** SOC · Digital Forensics · Network Forensics · Malware Analysis ·
Reverse Engineering · Cryptography · OSINT · Steganography.

**Tags** are free-form filters (e.g. Windows, PCAP, PowerShell, Ghidra, RSA).
Prefer existing tags before creating new ones.

---

## 9. Achievements

Admin UI: `/admin/achievements` (moderators and admins). The API is
`GET/POST /admin/achievements` and `PUT/DELETE /admin/achievements/{id}`.

| Field | Guidance |
|---|---|
| Key | Stable id (`solver_10`). Lowercase letters, numbers, underscores. Immutable after create. |
| Title / description | What the learner sees. Description is the public explanation of the rule. |
| Criteria | `solves_total`, `xp_total`, `paths_completed`, `category_solves`, `first_blood`, plus integer `threshold` ≥ 1. `category_solves` also needs a category. |
| Points | XP granted on award. `0` uses the platform default (`config/ctf.php` → `xp.achievement`). |
| Active | Inactive badges stay in history but are hidden from learners and are not newly awarded. Prefer this over delete. |
| Sort order | Lower numbers appear first. |

Evaluated server-side after solve/progress events. Keep the catalog small and
meaningful.

**Delete is admin-only** and cascades to existing awards. Learner achievement
responses never include `criteria`, `points`, `is_active`, `sort_order`, or
`awarded_count`. Those fields are on the admin resource only.

---

## 10. Demo seed content

`DemoContentSeeder` ships development-only path + challenges with flags like
`CTF{development_only_example}`. Treat as fixtures — replace before any shared
environment. Admin bootstrap: `SEED_ADMIN_*` in `.env`.

---

## 11. Security reminders for authors

- Do not paste real credentials, PII, or production flags into content.
- Do not instruct learners to attack systems they do not own.
- OSINT challenges must not depend on a third-party site remaining forever
  available for core platform functionality — embed or ship evidence files.
- Never request a “show me the flag” feature; replace the flag instead.
