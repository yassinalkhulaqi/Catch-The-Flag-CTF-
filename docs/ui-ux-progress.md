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

## Follow-up pass

- [x] Admin tables (sort, filter, columns, selection, per-row bulk actions), audit filters, stats bars
- [x] Challenge and path validation, markdown preview, upload progress, module reorder via existing PUT
- [x] Onboarding tour, local interests, first-challenge recommendation
- [x] Notifications sheet, Shift+? shortcuts, command palette searches challenges and paths
- [x] View transitions when supported, challenge layout fade, achievement target bands, profile timeline and radar
- [x] 404, error, and maintenance pages. `MAINTENANCE_MODE=true` redirects pages, not `/api`
- [x] Arabic copy for chrome plus the main learner pages. Lesson and challenge markdown stay in the author's language
- [x] Playwright specs in `apps/web/e2e` (`npm run test:e2e`)
- [x] Desktop Playwright smoke: home axe, login axe, Arabic `dir`, challenge filter URL, Shift+/ shortcuts, reduced-motion hero. Passed on 2026-10-10.
- [x] Solve timeline (`playSolve`), path map states, podium settle, shared view-transition names.
- [ ] Authenticated flows (theme, flag, admin wizard) skip when the API is down. This environment has no Docker and no Laravel process on port 8000, so those four specs were skipped. Re-run `npm run test:e2e` with the API seeded to exercise them.

Still not invented:

- Category and time-range leaderboards, and other players' public profiles
- A date filter on audit logs (the controller does not apply one)
- A single reorder endpoint (module order sends one update per module)
