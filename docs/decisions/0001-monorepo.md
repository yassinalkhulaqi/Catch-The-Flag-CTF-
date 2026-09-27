# ADR-0001: Monorepo layout (apps/web + apps/api)

- **Status:** accepted · **Date:** 2026-09-27
- **Deciders:** technical lead

## Context
V1 ships a Next.js frontend, a Laravel API, a database schema, and a large
documentation set that must stay in lockstep. Small team, rapid iteration,
single product.

## Decision
Use one repository with `apps/web`, `apps/api`, `docs/`, `infra/`, `scripts/`.

## Consequences
- ✅ Schema/API/frontend changes land atomically in one PR.
- ✅ One CI pipeline, one clone for every agent/developer.
- ❌ Slightly larger clone; language tooling must be run per-app
  (`npm --prefix apps/web`, `php artisan` in `apps/api`) — documented in
  development.md.

## Alternatives considered
Separate repos (rejected: contract drift cost at V1 stage); git submodules
(rejected: friction).
