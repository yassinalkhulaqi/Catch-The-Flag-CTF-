# ADR-0002: Stack — Next.js + Laravel + PostgreSQL

- **Status:** accepted · **Date:** 2026-09-27

## Context
Requirements: production-grade security, strong typing, mature auth/policies,
relational integrity, excellent developer experience, path to future labs.

## Decision
- **Frontend:** Next.js (App Router) + TypeScript + Tailwind + shadcn/ui.
- **Backend:** Laravel (PHP 8.4) REST API under `/api/v1`, Sanctum tokens.
- **Database:** PostgreSQL 17 (FKs, CHECK constraints, generated `tsvector`
  search, `citext`).

## Why
- Laravel ships first-class primitives for exactly our risk surface: policies,
  FormRequests, rate limiting, hashing, encryption, filesystems, migrations.
  Re-implementing these in a thinner framework is pure risk.
- PostgreSQL gives constraint-level integrity (our second validation layer)
  and full-text search without a new service.
- Next.js gives SSR/RSC for fast, accessible UI with intentional server/client
  boundaries.

## Consequences
- Two runtimes to operate (documented in deployment.md) — acceptable because
  the browser only sees the Next.js origin (see ADR-0004).
- PHP must run in a container where host extensions are missing (development.md).

## Alternatives considered
- Django/Rails (rejected: team/product fit, not materially better here).
- Next.js full-stack + tRPC only (rejected: we want a hard, versioned API
  boundary and Laravel's security primitives).
- MongoDB/document store (rejected: relational domain).
