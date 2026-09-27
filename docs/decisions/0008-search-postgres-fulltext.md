# ADR-0008: Search with PostgreSQL generated `tsvector` columns (no search service)

- **Status:** accepted · **Date:** 2026-09-27

## Context
V1 needs free-text search over challenges/paths plus structured filters. The
spec forbids introducing a dedicated search engine unless required.

## Decision
- Add **generated stored columns** on `challenges` and `paths`:
  `search_vector tsvector GENERATED ALWAYS AS (to_tsvector('simple', …)) STORED`
  with a GIN index.
- Query with `@@ websearch_to_tsquery('simple', :q)` plus exact/ILIKE fallback
  for short tokens.
- All search query building lives in one service (`ChallengeSearchService` /
  `PathSearchService`) so the storage engine can be swapped later without
  touching controllers.

## Consequences
- ✅ Zero new infrastructure; transactional consistency (no index lag).
- ✅ Structured filters remain plain indexed columns (category/difficulty/points/
  tags/solved).
- ❌ `simple` config is language-agnostic (no stemming) — acceptable for V1
  keyword search; stemming can be added via a migration.
- Evolution path (V3): Meilisearch/ES behind the same service interface.

## Rejected
Dedicated search engine now (ops cost, unjustified); `ILIKE '%…%'` alone
(full scans once data grows).
