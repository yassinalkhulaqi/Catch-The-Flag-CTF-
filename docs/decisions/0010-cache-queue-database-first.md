# ADR-0010: Cache/queue — database-first, Redis optional

- **Status:** accepted · **Date:** 2026-09-27

## Context
Rate limiting and caching need a store. Redis earns its keep only at real
concurrency; the spec says "Redis only where it provides real value" and "do
not introduce Redis for everything".

## Decision
- Default `CACHE_STORE=database` and `QUEUE_CONNECTION=database` (or `sync`
  where latency tolerates), with Redis fully wired but opt-in via env
  (`CACHE_STORE=redis`).
- Heavy work is synchronous and cheap by design (XP/progress/achievements are
  indexed single-row writes inside existing transactions) — **no queue workers
  required for V1 correctness**.
- Rate limiters use the cache abstraction, so switching drivers is a one-line
  env change.

## Consequences
- ✅ Local/prod parity with **zero extra services** for V1.
- ✅ Scaling path to Redis is configuration, not a rewrite.
- ❌ `database` cache does slightly more DB work per rate-limited request —
  fine at V1 volume, monitored as a known trade-off.

## Rejected
Redis as a hard V1 dependency (another stateful service to back up/secure for
marginal gain); per-request in-memory cache (breaks multi-process deployments).
