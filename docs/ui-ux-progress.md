# UI / UX overhaul — progress

Branch: `feat/uiux-motion-polish` (premium polish pass; follows
`feat/ui-ux-overhaul-premium`)

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
| 6. Forms overhaul | done | Standard RHF + zod pattern across learner, admin and filter forms; shared `Form`/`FormError`/`FormSuccess`/`SelectField` primitives; uniform backend 422 envelope; password-policy hints; `SearchFilterBar` wired to `/paths`. |

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
- [x] Forms standard (RHF + zod, shared primitives, server field-error mapping)
- [x] Uniform 422 contract and validation coverage in the API

## Premium polish pass (50 commits)

`feat/uiux-motion-polish` keeps the same identity and extends the system
without adding dependencies. Every commit was typechecked; the full Vitest
suite (36 files, 138 tests) passed before the docs commit.

| Area | Change |
|---|---|
| Motion | Scroll progress bar, route-level page transition templates, scroll-aware header, reveal stagger, marquee discipline strip, guarded by `prefers-reduced-motion` |
| Primitives | `SegmentedControl`, richer `Button`/`Badge`/`Card`/`Progress`/`Input`/`Toast`/`Skeleton`, animated dialog and sheet entry |
| Chrome | Redesigned header/footer, grouped mobile sheet, active-nav underline, XP chip, dynamic year and status pill |
| Landing | Hero terminal preview plus floating cards, stats, connected how-it-works, category and featured grids, mini podium, guarantees, final CTA |
| Challenges | Segmented tier/layout filters, track progress cards, removable active-filter chips, tile/row cards |
| Lab detail | Breadcrumbs, mission hero, state-rich status banner, sticky mission-control sidebar with anchors, polished hints, artifacts, flag feedback and related grid |
| Learn | Path catalog hero stats, tile path cards, path detail stats and module progress timeline |
| Account | Podium leaderboard, dashboard welcome/hero, split auth trust panel, anchored settings cards, offline tools hub |
| Verification | `npm run typecheck --prefix apps/web` and `npm run test --prefix apps/web` pass (36 files, 138 tests). `next build` no longer fetches Google Fonts at build time |

No server behaviour changed: flags, XP, points, solves, rank and progress remain
server-derived. The pass adds no lint exceptions and no runtime dependencies.

## Follow-up pass

- [x] Admin tables (sort, filter, columns, selection, per-row bulk actions), audit filters, stats bars
- [x] Challenge and path validation, markdown preview, upload progress, module reorder via existing PUT
- [x] Onboarding tour, local interests, first-challenge recommendation
- [x] Notifications sheet, Shift+? shortcuts, command palette searches challenges and paths
- [x] View transitions when supported, challenge layout fade, achievement target bands, profile timeline and radar
- [x] 404, error, and maintenance pages. `MAINTENANCE_MODE=true` redirects pages, not `/api`
- [x] Arabic copy for chrome plus the main learner pages. Lesson and challenge markdown stay in the author's language
- [x] Playwright specs in `apps/web/e2e` (`npm run test:e2e`)
- [x] Desktop Playwright smoke: home axe, login axe, Arabic `dir`, challenge filter URL, Shift+/ shortcuts. Passed on 2026-10-10.
- [ ] Authenticated flows (theme, flag, admin wizard) skip when the API is down. This environment has no Docker and no Laravel process on port 8000, so those four specs were skipped. Re-run `npm run test:e2e` with the API seeded to exercise them.

Still not invented:

- Category and time-range leaderboards, and other players' public profiles
- A date filter on audit logs (the controller does not apply one)
- A single reorder endpoint (module order sends one update per module)

## Trophy cabinet (`feat/uiux-trophy-cabinet`)

The achievements page becomes a collectible cabinet over the existing
`/me/achievements` payload. Award state, progress, and award dates remain
server-derived; no client code grants a badge.

| Area | Change |
|---|---|
| Cabinet hero | Completion ring, unlocked/in-progress/locked counts, latest award, and a closest-unlock spotlight with progress |
| Tiles | Icon medallion from the server's `icon` key, state badge, progress bar, target band, and award day; keyboard focus and hover states |
| Detail | Accessible `Dialog` with status, description, progress, remaining count, target band, and award date |
| Browsing | Search by title/description/key, filter by state, sort by default/closest/recent/title, live result count, reset |
| States | Route-level skeleton, filtered empty state, and the existing no-badges empty state |
| Verification | `npm run typecheck`, `npm run lint`, and 26 new Vitest assertions for state predicates, filters, sorts, summary, search, and dialog interaction |

The target band is a presentation label derived from the server target
(`<10`, `10�49`, `50+`); the API still does not send a rarity tier.

## Leaderboard arena (`feat/uiux-leaderboard-arena`)

The leaderboard becomes a browsable arena without changing what the server
computes. Rank, XP, solves, badges, and the viewer's rank still come from
`GET /api/v1/leaderboard` and `/leaderboard/me`; the new layer only re-orders,
filters, and summarizes those rows.

| Area | Change |
|---|---|
| Summary | `ArenaHero` with ranked-player, total XP, solve, and average XP tiles |
| Podium | Top three as ranked cards, first place visually elevated, viewer marked |
| Board | Search by name, all/top-10/around-me scope, sortable XP/solves/badge columns with `aria-sort`, live result count, reset |
| Mobile | Table collapses to metric cards; sort control stays reachable outside the table |
| Standing | Sticky card with rank, percentile, XP/solves/badges, gap and progress toward the next rival, leader cushion, or unranked CTA |
| Rules | "How ranking works" card repeats the server tie-break; category/time windows stay explicitly out of scope |
| States | Route-level skeleton, filtered empty state, unranked and outside-loaded-page states |
| Verification | `npm run typecheck`, `npm run lint`, and 31 new Vitest assertions for ordering, scope, stats, rival gaps, search, sort, and reset |

The sort direction is display-only. The rank column always shows the server
rank even when the visible order changes.

## Challenge focus mode (`feat/uiux-focus-lab`)

The challenge detail page gains an optional, distraction-free session that
works entirely from data the page already has. Nothing about flags, XP, or
solves changes; the review checklist and timer live only in `localStorage`.

| Area | Change |
|---|---|
| Entry point | Floating "Focus mode" control on every challenge; persisted per challenge on this device |
| Session bar | Sticky bar with challenge title, elapsed timer, review progress, and exit control |
| Mission map | Section rail with scroll-spy, numbered anchors, and an accessible review checklist |
| Mobile | Horizontal section strip keeps navigation usable without the desktop rail |
| Focus layout | Sidebar, breadcrumb, related challenges, and tools drawer are hidden; the mission fills the page |
| Verification | `npm run typecheck`, `npm run lint`, and 19 new Vitest assertions for sections, progress, persistence, timer, and completion |

Reduced-motion preferences disable smooth scrolling. The walkthrough only
appears in the rail when the server actually returned one.
