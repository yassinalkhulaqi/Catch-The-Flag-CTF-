# UI / UX audit — Catch The Flag web app

> Baseline recorded before the premium experience overhaul on
> `feat/ui-ux-overhaul-premium`. Source of truth for what was wrong, what must
> stay, and what this branch is allowed to change.
>
> Audited tree: `apps/web` at `bdc67c3` (main). Frontend only — Laravel remains
> the authority for XP, points, progress, solves, permissions, and flags.

---

## 1. Route, layout, and component inventory

### 1.1 Layouts

| Layout | File | Role |
|---|---|---|
| Root | `app/layout.tsx` | Fonts, metadata, `data-theme` from the signed-in user (guests forced to dark) |
| Public | `app/(public)/layout.tsx` | Header, `<main>`, footer |
| Auth | `app/(auth)/layout.tsx` | Centered card; redirects signed-in users to `/dashboard` |
| App | `app/(app)/layout.tsx` | Auth gate, header, horizontal account tabs, footer |
| Admin | `app/admin/layout.tsx` | Staff gate, header, admin tabs, footer |

There is no route-level `loading.tsx`, no `template.tsx`, and no shared skip link.

### 1.2 Pages

**Public**

| Route | File | Notes |
|---|---|---|
| `/` | `app/(public)/page.tsx` | Hero, three feature blurbs, up to 3 paths and 5 challenges |
| `/about` | `app/(public)/about/page.tsx` | Three paragraphs |
| `/challenges` | `app/(public)/challenges/page.tsx` | Filters + list |
| `/challenges/[slug]` | `app/(public)/challenges/[slug]/page.tsx` | Description, files, hints, flag box |
| `/paths` | `app/(public)/paths/page.tsx` | Flat list |
| `/paths/[slug]` | `app/(public)/paths/[slug]/page.tsx` | Summary, prerequisites, module list |
| `/leaderboard` | `app/(public)/leaderboard/page.tsx` | Table, top 50 |

**Auth**

| Route | File |
|---|---|
| `/login` | `app/(auth)/login/page.tsx` |
| `/register` | `app/(auth)/register/page.tsx` |

No forgot-password or reset-password screens, even though the API documents
`POST /auth/forgot-password` and `POST /auth/reset-password`.

**Signed-in learning**

| Route | File |
|---|---|
| `/dashboard` | `app/(app)/dashboard/page.tsx` |
| `/progress` | `app/(app)/progress/page.tsx` |
| `/solves` | `app/(app)/solves/page.tsx` |
| `/achievements` | `app/(app)/achievements/page.tsx` |
| `/notifications` | `app/(app)/notifications/page.tsx` |
| `/profile` | `app/(app)/profile/page.tsx` |
| `/settings` | `app/(app)/settings/page.tsx` |
| `/modules/[id]` | `app/(app)/modules/[id]/page.tsx` |
| `/lessons/[id]` | `app/(app)/lessons/[id]/page.tsx` |
| `/quizzes/[id]` | `app/(app)/quizzes/[id]/page.tsx` |

**Admin**

| Route | File |
|---|---|
| `/admin` | `app/admin/page.tsx` |
| `/admin/challenges` | `app/admin/challenges/page.tsx` |
| `/admin/challenges/new` | `app/admin/challenges/new/page.tsx` |
| `/admin/challenges/[id]/edit` | `app/admin/challenges/[id]/edit/page.tsx` |
| `/admin/paths` | `app/admin/paths/page.tsx` |
| `/admin/paths/[id]/edit` | `app/admin/paths/[id]/edit/page.tsx` |
| `/admin/categories` | `app/admin/categories/page.tsx` |
| `/admin/tags` | `app/admin/tags/page.tsx` |
| `/admin/achievements` | `app/admin/achievements/page.tsx` |
| `/admin/users` | `app/admin/users/page.tsx` |
| `/admin/audit-logs` | `app/admin/audit-logs/page.tsx` |

**System**

| Route | File |
|---|---|
| Not found | `app/not-found.tsx` |
| Segment error | `app/error.tsx` |
| Root error | `app/global-error.tsx` |
| BFF proxy | `app/api/v1/[...path]/route.ts` plus dedicated auth cookie routes |

There is no maintenance page, no design-system gallery, no command palette, and
no onboarding route.

### 1.3 Components

**Primitives (`components/ui/`)** — four files only:

- `button.tsx` — variants primary / secondary / ghost / danger / outline; sizes sm / md / lg. No loading state, no icon slot contract.
- `input.tsx` — Input, Textarea, Label, Field.
- `badge.tsx` — Badge plus a Skeleton that does not belong in this file.
- `card.tsx` — Card, CardTitle, CardDescription.

Missing primitives the product now needs: Select, Tabs, Dialog, Sheet, Tooltip,
Popover, Dropdown, Toast, Table, Progress, Avatar, Accordion, Breadcrumb,
Switch, Slider, Pagination (a one-off `pagination-nav.tsx` exists outside `ui/`),
Empty/Error (they live in `empty-state.tsx`).

**Feature components**

`site-header`, `site-footer`, `dashboard-nav`, `admin-nav`, `logo`,
`empty-state` (also `PageHeader` and `ErrorState`), `markdown`, `challenge-card`,
`challenge-filters`, `challenge-files`, `difficulty-badge`, `flag-submit-box`,
`hint-list`, `path-card`, `path-prerequisites`, `learning-actions`,
`pagination-nav`, `notifications-list`, `profile-form`, `password-form`,
`theme-settings-form`, `quiz-attempt`, and `components/auth/*`,
`components/admin/*`.

`clsx` and `class-variance-authority` are dependencies and unused. `cn()` is a
string join, so conflicting Tailwind classes (for example `text-muted` and
`text-foreground` on the active nav link) both ship and the winner depends on
stylesheet order.

---

## 2. What already works (do not regress)

- Dark-first graphite surfaces and a single signal-amber accent. This matches
  `docs/product.md` §7: professional, calm, not a neon clone of other platforms.
- Theme is applied on the server via `data-theme` (`dark` / `light` / `system`)
  with a light palette that deepens amber for WCAG AA. Guests stay dark.
- Server Components fetch through `lib/api/server.ts`. Client islands use
  `lib/api/client.ts` and only talk to the same-origin BFF.
- Flag plaintext is not rendered. The submit box posts `{ flag }` and renders
  only the server result (`correct` / `incorrect` / `already_solved`).
- Markdown rendering does not enable raw HTML. Links go through `safeHref`.
- Path prerequisites are shown as completed vs required, and start is blocked
  in the UI when `can_start` is false. The server still enforces this.
- Empty and error states exist on the main catalogs.
- Focus-visible outlines are global. Forms use labels and `role="alert"` /
  `role="status"` on the flag box and login form.
- Existing Vitest coverage locks: login success/error, flag correct / incorrect
  / already solved, challenge card solved badge, path prerequisite copy, theme
  save. Those test ids and English strings must keep working.

---

## 3. Current problems

### 3.1 Visual system

- Tokens stop at color, one radius, and two fonts. No spacing scale, elevation,
  glow (even restrained), blur steps, z-index scale, or motion tokens.
- No semantic warning color. Difficulty reuses info / accent / danger, so
  advanced and expert look the same.
- Category color is whatever the API sends, with no documented fallback scale
  for SOC, DFIR, network forensics, malware, RE, crypto, OSINT, stego.
- Display and body share Space Grotesk. Mono is Geist Mono. There is no fluid
  type scale; heroes jump from `text-5xl` to `text-7xl` with fixed steps.
- Light theme exists but is only reachable from Settings after sign-in. The
  header has no switcher. A reload is safe (SSR sets `data-theme`), but there
  is no blocking script if a future client preference is introduced, and the
  system theme depends entirely on CSS — good — while component-level colors
  are not all tokenized (global error uses hardcoded hex, which is acceptable
  there because CSS may have failed).
- Surfaces are flat bordered rectangles. Hierarchy is type size plus amber
  eyebrows. Cards, lists, and admin tables look like the same stack of borders.
- `atmosphere` (grid + amber radial) is used only on the landing page.

### 3.2 Motion

- Three fade-up utilities and one SVG stroke draw. They respect
  `prefers-reduced-motion`.
- No page transition, list stagger, scroll reveal, count-up, progress ring,
  success celebration, or input/button feedback beyond CSS color changes.
- Flag success is a sentence. Incorrect is a sentence. Rate-limit responses
  surface as a generic error string; `Retry-After` is forwarded by the BFF but
  the client `ApiError` drops the header, so the UI cannot show a countdown.
- Nothing pauses or disables ambient animation on low-power devices because
  nothing ambient exists.

### 3.3 Page-level UX

**Landing.** One viewport of type, a static flag SVG, and three short columns.
No terminal, no category showcase, no leaderboard preview, no catalog counts.
When the API is down the featured sections disappear with no explanation.

**Auth.** A 24rem column on an empty page. No split visual, no password
guidance beyond HTML `required`, no forgot-password path. Login copy is clear.
Register is the same pattern.

**Dashboard.** Four numbers, one “next up” row, and up to four achievement
titles. `streak_days` is returned by `/me/progress` and ignored. No level
model is exposed by the API — any level ring must be a documented presentation
of XP, not a new score. No heatmap, no per-category picture, no activity list
beyond achievements.

**Paths.** A bordered list. Path detail is a vertical module list, not a map.
Locked vs started vs complete is text, easy to miss. Lessons are a markdown
column: no reading progress, no table of contents, no copy button on code, no
prev/next (the lesson payload already has `prev_lesson_id` and `next_lesson_id`).

**Challenges.** Filters work and live in the URL, but only after an Apply
click. Missing from the URL contract the API already supports: `min_points`,
`max_points`, `sort`. No grid/list toggle. Solved state is a small badge on an
otherwise identical row. No skeleton while filters transition (the filter
panel itself suspends; the list does not).

**Challenge detail.** Solid information architecture (description, files,
hints, sticky submit). Gaps: no solver list despite `GET /challenges/{id}/solves`,
no session attempt count, no format hint beyond the placeholder `flag{…}`,
no celebration, files are a plain list (checksum is shown — keep that), hints
are buttons without a progressive cost summary.

**Leaderboard.** An accessible table. No podium, no sticky “you” row once you
scroll, no sense of rank movement. The API is global only
(`xp DESC, solved_count DESC, id ASC`). Category and time-range leaderboards
are out of V1 scope (`docs/product.md` §6). The UI must not invent them.

**Profile.** A form under a one-line stat summary. No banner, badge shelf,
heatmap, or timeline. There is no public profile endpoint; other players cannot
be opened without inventing an API. The signed-in profile can preview the
public fields the security doc allows (name, XP, solves, achievements).

**Achievements.** A two-column list. Locked and unlocked differ by opacity.
Progress is `current / target` text. No rarity — the API does not send rarity,
so tiers must be derived transparently from criteria type or left as a single
catalog with progress, not fake loot colors presented as server data.

**Admin.** Functional forms and a stepped challenge editor. Tables do not sort,
filter, or toggle columns on the client. No chart on the overview. Authoring
is one long page per resource rather than a guided shell with a live preview
of the markdown the learner will see. Drag-and-drop ordering has no reorder
endpoint; position is a numeric field the API already accepts on write. A
reorder UI is only honest if it writes that existing field.

**Global chrome.** Header nav plus account tabs. No breadcrumbs, no command
palette, no shortcut help, no notification bell (notifications are a tab), no
mobile bottom nav, no offline/error banner, footer is four links.

### 3.4 Feedback and forms

- Pending states are button label swaps (`Signing in…`, `Checking…`). No
  `aria-busy` on the form.
- Login and register wait for the server to report empty/invalid fields.
  Password policy (minimum 12 characters, security.md §2) is not explained
  before submit.
- Optimistic UI is correctly absent for solves and XP. Other toggles (theme)
  wait for the round trip before the document updates — fine, but the select
  does not preview.
- No toast system. Success and failure are inline only, so a solve on a long
  page is easy to miss if the aside is off-screen on mobile.
- No retry button on `ErrorState`.
- No offline detection.

### 3.5 Content and tone

- Copy is accurate and calm. It is also thin: several empty states are a single
  sentence, and the landing page does not explain the eight disciplines.
- English only. `html lang="en"` is hardcoded. No `dir`, no logical-property
  discipline (`ml-2` appears on the leaderboard “you” marker). Arabic cannot
  be presented without a layout and dictionary pass.

---

## 4. Accessibility gaps

| Gap | Where | Impact |
|---|---|---|
| No skip link | All layouts | Keyboard users tab through the header on every page |
| Mobile menu | `site-header.tsx` | No Escape to close, focus is not moved into the panel, background is not inert |
| Active nav | Header `linkClass` | `text-muted` and `text-foreground` both apply; contrast of the active item is not guaranteed |
| Native `<select>` | Filters, theme | Usable, but inconsistent focus rings and no listbox semantics if we later restyle them badly |
| No focus trap | — | There is no dialog yet; the first one must trap focus |
| Flag result | `flag-submit-box.tsx` | `role="status"` / `role="alert"` exist, good. No `aria-live` region that survives a layout change, and incorrect has no non-color cue |
| Tables | Leaderboard, admin | Leaderboard headers are real `<th>`. Admin tables need the same review when restyled |
| Skeleton | `badge.tsx` | `aria-hidden` but parents do not expose an accessible loading name |
| Reduced motion | `globals.css` | Only the three landing animations opt out |
| Touch targets | Header icon button, tab links | Several controls are under 44px |
| Language | Root layout | Screen readers always announce English |

Contrast of the token palette was already raised (`--faint`, `--muted`, light
amber). New colors must be checked the same way: text on background ≥ 4.5:1,
large text and UI boundaries ≥ 3:1.

---

## 5. Performance notes

- Almost everything above the fold is a Server Component. That is the right
  default and must stay.
- Landing and catalogs block on the API with no streaming skeleton (`loading.tsx`
  missing). A slow API is a blank main.
- `next/image` is unused. Avatars and thumbnails, when present, should not use
  raw `<img>` without size constraints.
- No heavy client bundle today. The overhaul must not put GSAP, a physics
  scroll library, or a chart package on every route. Motion and canvas belong
  in client islands, dynamically imported where they are more than a few KB.
- `cn()` does not merge classes, so production CSS carries redundant utilities.
- Fonts: Space Grotesk + Geist Mono via `next/font` (good, no layout shift).
  Adding a display face and an Arabic face must use `next/font` with `display`
  swap/optional and a metric fallback so the header does not jump.

---

## 6. Constraints for the overhaul

1. Do not change the Laravel contract, database, or scoring rules.
2. Never render flag plaintext, ciphertext, HMAC, or secrets. Submission
   payloads stay `{ flag }` and are not logged in the UI layer.
3. Do not invent live machines, VPN, or lab controls.
4. Do not invent leaderboard windows, public profiles of other users, rarity
   tiers presented as server truth, or per-category ranks the API does not return.
   Derived views (category radar from the signed-in user's solved challenges,
   heatmap from the XP ledger) are allowed when the source rows are real and
   the label says what they are.
5. Level presentation, if shown, is a pure function of server XP (documented
   thresholds in the frontend). It must not be submitted back or treated as a
   second score.
6. Keep existing test ids and the English strings those tests assert.
7. `prefers-reduced-motion: reduce` disables decorative motion everywhere.
8. Layout uses logical properties (`ms-`, `me-`, `ps-`, `pe-`, `text-start`)
   so Arabic mirrors without per-component overrides.
9. Identity stays the flag-marker, graphite, and signal amber from product.md.
   Glow, grid, and terminal moments are reserved for the hero and for solve
   feedback — not washed across admin tables.

---

## 7. Priority order used by the overhaul

1. Tokens, type, theme boot, primitive components, gallery.
2. Motion primitives with reduced-motion and low-power guards.
3. Shell (skip link, header, command palette, toasts, bottom nav, footer) then
   each learner route, then admin presentation, then system pages.
4. Forms, onboarding, microcopy, keyboard and live-region pass.
5. Tests, docs, ADR.
