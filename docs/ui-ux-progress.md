# UI / UX overhaul — progress

Branch: `feat/ui-ux-overhaul-premium`

Identity decision (see ADR-0011 when written): keep the calm flag-marker
system from `docs/product.md` §7. Motion is cinematic on the marketing hero
and on solve feedback, and quiet everywhere else. No neon wash, no invented
server state.

| Phase | Status | Notes |
|---|---|---|
| 0. Audit | done | `docs/ui-ux-audit.md` |
| 1. Design system | in progress | Tokens, type, theme, primitives, gallery |
| 2. Motion | pending | |
| 3. Page redesign | pending | |
| 4. UX quality | pending | i18n, command palette, onboarding, a11y |
| 5. Performance, tests, docs | pending | |

## Checklist

- [x] Read AGENTS.md, README, architecture, product, security, content authoring, development
- [x] Inventory routes, layouts, components
- [x] Write the audit
- [ ] Token system (color, difficulty, category, space, radius, shadow, z, motion)
- [ ] Fluid type + display / body / mono / Arabic faces
- [ ] Theme switcher without flash
- [ ] Primitive components and `/dev/design-system`
- [ ] Motion library + reduced motion
- [ ] Landing, auth, dashboard, paths, lessons, challenges, leaderboard
- [ ] Profile, achievements, admin shell, system pages
- [ ] Command palette, toasts, shortcuts, bottom nav, EN + AR
- [ ] Tests, lint, typecheck, build
- [ ] `docs/design-system.md`, ADR, development.md commands
