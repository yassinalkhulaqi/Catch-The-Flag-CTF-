# ADR-0011: Design system and motion

- **Status:** accepted · **Date:** 2026-10-10

## Context

The web app had a dark-first palette and four primitives. The experience
needed a shared token layer, a theme that does not flash, Arabic-ready
layout, and motion that does not fight the product's calm identity
(`docs/product.md` §7) or the security rules (`docs/security.md`).

## Decision

- Tokens live in `apps/web/app/globals.css`. JavaScript reads names from
  `lib/design/tokens.ts` and resolved values from those variables. Hex is not
  duplicated in components.
- Type: Fraunces (display), Source Sans 3 (body), IBM Plex Mono (flags and
  data), IBM Plex Sans Arabic (when `dir="rtl"`). Loaded with `next/font`.
- Theme is `data-theme` on `<html>`, set by the server from the account
  (`/me` theme) or, for guests, the `ctf_theme` cookie. A blocking inline
  script only fills the attribute when the server omitted it.
- Locale is `ctf_locale` (`en` | `ar`). The server sets `lang` and `dir`.
  Components use logical Tailwind properties.
- Motion is a small in-repo library (`lib/motion`). It animates transform and
  opacity, checks `prefers-reduced-motion`, and refuses ambient canvas on
  data-saver or two-or-fewer cores. GSAP, Lenis, and a chart package were
  not added: CSS plus `IntersectionObserver` and a short canvas cover the
  hero and the solve moment without a second animation runtime.
- A correct flag may play a canvas burst. The burst is loaded with a dynamic
  import and skipped under reduced motion. The result text still comes only
  from the submission response. XP, points, and solve state are never
  optimistic.
- Level rings are a pure function of server XP (`lib/design/level.ts`). They
  are not stored and not sent back.
- `/dev/design-system` renders in development. Production returns 404 unless
  `ENABLE_DESIGN_SYSTEM=true`.

## Consequences

- New UI should use tokens and `components/ui` instead of one-off hex and
  native focus styles.
- Category and time-range leaderboards stay out until the API has them.
- Adding a heavy motion dependency later needs a new ADR.

## Alternatives considered

- Framer Motion / GSAP + ScrollTrigger + Lenis: capable, and allowed, but
  they schedule animation beside React and cost every route. Rejected for V1
  of this overhaul.
- Recharts: fine for admin dashboards later. The radar and heatmap are a
  few SVG and divs over data we already fetch.
