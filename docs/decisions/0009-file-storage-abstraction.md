# ADR-0009: File storage abstraction with a dedicated private `challenge-files` disk

- **Status:** accepted · **Date:** 2026-09-27

## Context
Challenge files (pcaps, memory images, malware samples) must be stored today
on the local filesystem and in production on S3-compatible object storage,
without application changes. They must never be publicly addressable.

## Decision
1. Use Laravel's filesystem abstraction with a **custom disk**
   `challenge-files` (driver from env: `local` in dev, `s3` in production with
   endpoint/region/bucket/credentials from env — works with AWS S3, R2, MinIO).
2. Store `storage_disk` + server-generated `storage_key`
   (`{uuid}/{uuid}.{ext}`) on each `challenge_files` row; original filename is
   sanitized **metadata only**.
3. Serve files only through an authorized endpoint that policy-checks then
   streams `Storage::download()`; no public URLs, no direct object exposure.
4. SHA-256 checksum recorded server-side.

## Consequences
- ✅ Provider lock-in impossible: app code only knows `Storage::disk('challenge-files')`.
- ✅ Downloads are always permission-checked and rate-limited; private buckets
  stay private.
- ❌ App server proxies downloads (bandwidth); future optimization = short-lived
  signed URLs (schema already stores the disk/key needed).

## Rejected
Storing absolute paths or client filenames (path traversal risk); public disk
for challenge files (exposes untrusted binaries without auth/rate limits).
