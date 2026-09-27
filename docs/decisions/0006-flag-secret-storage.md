# ADR-0006: Flag secret storage — encrypted at rest + HMAC for comparison

- **Status:** accepted · **Date:** 2026-09-27 · **Security-critical**

## Context
Flags must never reach clients, logs, or casual DB dumps; the backend must
still verify submissions quickly and in constant time; admins must be able to
configure (replace) flags.

## Decision
For every flag, store **two derived forms** and nothing else in plaintext:

| Column | Value | Use |
|---|---|---|
| `flag_ciphertext` | AES-256-GCM via Laravel `Crypt` (key = `APP_KEY`) | at-rest confidentiality / admin-side future needs |
| `flag_hash` | `HMAC-SHA256(normalize(flag), APP_KEY)` | lookup + verification |

Verification: normalize submission per `case_sensitive` → compute HMAC →
`hash_equals()` against stored hash. No SQL equality on secrets, no per-char
comparison, no plaintext in tables, responses, logs, or audit diffs.

`challenges.flag_validation_type` (default `static`) selects the validator
strategy; only `static` is implemented in V1 (per_user/per_instance/dynamic are
roadmap items reusing the same interface).

## Consequences
- ✅ DB dump without `APP_KEY` yields neither usable flags nor offline-compared
  hashes (HMAC is keyed).
- ✅ Constant-time compare; uniform timing across flags of different lengths.
- ❌ `APP_KEY` rotation invalidates flags → documented runbook
  (security.md §12).
- ❌ Admin "view flag" endpoint deliberately does **not** exist in V1 (writers,
  not readers). If later required, decrypt server-side for admins only, audited.

## Rejected
- bcrypt/argon2 for flags: designed for low-entropy passwords and slow by
  design — wrong tool for exact-match high-entropy secrets at submission volume.
- Storing plaintext: any read path or log line becomes a full compromise.
