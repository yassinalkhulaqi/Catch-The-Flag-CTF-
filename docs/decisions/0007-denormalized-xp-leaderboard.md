# ADR-0007: Denormalized `users.xp` / `users.solved_count` with an append-only ledger

- **Status:** accepted · **Date:** 2026-09-27

## Context
Leaderboard and ranking are hot paths. Computing `SUM(xp_transactions)` for
every ranking query does not scale, but derived data can drift if maintained
loosely.

## Decision
- `xp_transactions` is the **append-only source of truth** (audit trail).
- `users.xp` and `users.solved_count` are denormalized mirrors updated **only
  inside the same DB transaction** that inserts the ledger/solve row.
- Clients can never write these columns (not fillable, no endpoint sets them).
- Ranking is fully deterministic:
  `ORDER BY xp DESC, solved_count DESC, id ASC`.

## Consequences
- ✅ Leaderboard = one indexed scan at 10k+ users; consistency guaranteed by
  transactionality, not by app-level bookkeeping scattered across the codebase.
- ✅ Ledger answers "where did XP come from" without scanning events.
- ❌ Two writers must stay in sync — mitigated by a single `AwardXp` action
  that is the only code path allowed to touch `users.xp`.
- Reconciliation: a maintenance command re-sums the ledger and reports drift
  (test-covered invariant).

## Rejected
Sum-on-read (slow), caching without ledger (no audit trail), triggers
(hidden logic, harder to test/review).
