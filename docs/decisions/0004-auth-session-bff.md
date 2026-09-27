# ADR-0004: Auth — Sanctum tokens held in an httpOnly cookie behind a Next.js BFF

- **Status:** accepted · **Date:** 2026-09-27

## Context
Decoupled frontend/backend must authenticate users. Options each carry distinct
XSS/CSRF trade-offs.

## Decision
1. Laravel issues a **Sanctum personal access token** (30-day expiry, scoped
   abilities) on login/register.
2. The **Next.js BFF** (route handlers) stores it in an `httpOnly`,
   `SameSite=Lax` (`Secure` in prod) cookie that JavaScript cannot read.
3. Browser → Next.js only (same-origin). BFF forwards
   `Authorization: Bearer <token>` to Laravel. Logout revokes the token
   server-side and clears the cookie.

## Why
- **No token in JS reach** → XSS cannot exfiltrate credentials from
  localStorage/sessionStorage (the classic SPA failure).
- Laravel stays **stateless Bearer auth** → CSRF does not apply to the API;
  the cookie never crosses to Laravel, so there is no cookie-CSRF surface at all.
- Keeps a clean, versioned API boundary while presenting a single origin to
  the browser (CSP/HSTS/cookies all become simple).

## Consequences
- ✅ Strong XSS posture, simple CORS (browser never hits Laravel).
- ❌ Extra server hop for API calls; BFF must stay thin (mechanical proxy only).
- ❌ SSR and client share cookie-based context — all access checks still
  repeated server-side in Laravel (the BFF is not trusted for authorization).

## Alternatives considered
- Tokens in localStorage (rejected: XSS = full account takeover).
- Laravel Sanctum SPA cookie mode directly from browser (rejected: requires
  cross-site cookie plumbing/CSRF dance between two origins in dev, and puts a
  Laravel cookie in the browser).
- HttpOnly cookie sent to Laravel directly with CSRF double-submit (rejected
  for V1: more moving parts across origins than the BFF).
