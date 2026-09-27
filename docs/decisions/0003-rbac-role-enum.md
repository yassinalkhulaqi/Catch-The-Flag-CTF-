# ADR-0003: Role column instead of a full RBAC engine

- **Status:** accepted · **Date:** 2026-09-27

## Context
V1 needs `user < moderator < admin`. A generic RBAC engine (role definitions,
permission tables, ability registry) adds tables, UI, and failure modes we do
not need yet.

## Decision
Store `users.role` as a CHECK-constrained enum (`user`, `moderator`, `admin`).
Authorization is expressed in **Policies** that consult the role. The admin
panel can assign roles to users.

## Consequences
- ✅ One column, impossible to store invalid roles (DB CHECK), trivial to audit.
- ✅ No permission sprawl; policies keep rules next to the model.
- ❌ Cannot define custom roles (e.g. "grader") without a migration.
- Migration path: keep policies; introduce `roles`/`role_user` tables and have
  `User::hasRole()` read from them — call sites do not change.

## Why not now
Custom roles are a V2/V3 concern (roadmap); inventing them early is speculative
design (architecture principles: no empty abstractions).
