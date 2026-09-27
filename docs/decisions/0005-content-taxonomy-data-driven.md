# ADR-0005: Categories/tags are data, not code

- **Status:** accepted · **Date:** 2026-09-27

## Context
V1 must ship eight challenge categories (SOC, DFIR, Network Forensics, Malware
Analysis, Reverse Engineering, Cryptography, OSINT, Steganography) and support
future categories "without code restructuring".

## Decision
`categories` and `tags` are ordinary seeded tables referenced by foreign key
(`challenges.category_id`, `challenge_tag`). Adding a category is an admin
action (insert row). UI colors/icons are row data (`color`, `icon`).

## Consequences
- ✅ New disciplines (e.g. "Cloud Security") require zero deploys of code.
- ✅ Filtering/search are simple indexed FK lookups.
- ❌ Category-specific behavior (e.g. category-themed pages) must be driven by
  data/props rather than hardcoded branches.

## Rejected
Enum column on `challenges` (schema change per category);
per-category classes/tables (explosion of near-identical logic).
