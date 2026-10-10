# UI / UX overhaul — progress

Branch: `feat/ui-ux-overhaul-premium`

Identity decision (see ADR-0011 when written): keep the calm flag-marker
system from `docs/product.md` §7. Motion is cinematic on the marketing hero
and on solve feedback, and quiet everywhere else. No neon wash, no invented
server state.

| Phase | Status | Notes |
|---|---|---|
| 0. Audit | done | `docs/ui-ux-audit.md` |
| 1. Design system | done | Tokens, type, theme, primitives, `/dev/design-system` |
| 2. Motion | done | `lib/motion`, reduced motion, hero grid, flag burst |
| 3. Page redesign | done for the learner surface | Landing, auth, dashboard, lessons, challenges, leaderboard, achievements. Admin tables stay on the existing authoring UI. |
| 4. UX quality | done for chrome | Command palette, EN/AR chrome, skip link, focus-trapping sheet and dialogs. No guided onboarding tour yet. |
| 5. Performance, tests, docs | done | ADR-0011, design-system.md, heatmap and reduced-motion tests. Lint, typecheck, Vitest, and production build pass. |

## Checklist

- [x] Read AGENTS.md, README, architecture, product, security, content authoring, development
- [x] Inventory routes, layouts, components
- [x] Write the audit
- [x] Token system (color, difficulty, category, space, radius, shadow, z, motion)
- [x] Fluid type + display / body / mono / Arabic faces
- [x] Theme switcher without flash
- [x] Primitive components and `/dev/design-system`
- [x] Motion library + reduced motion
- [x] Landing, auth, dashboard, lessons, challenges, leaderboard, achievements
- [x] Command palette, toasts, EN + AR chrome, skip link
- [x] Tests, lint, typecheck, build
- [x] `docs/design-system.md`, ADR-0011, development.md commands

Still open, on purpose:

- Category and time-range leaderboards, and public profiles of other players, need API support. The UI does not invent them.
- Drag-and-drop ordering needs a reorder contract. Position is already a field on write; the admin forms keep that field.
- A first-run tour is not shipped. The dashboard already recommends the next lesson or challenge from server progress.
- Playwright is not in the repo. Critical flows stay on Vitest, Testing Library, and MSW.
