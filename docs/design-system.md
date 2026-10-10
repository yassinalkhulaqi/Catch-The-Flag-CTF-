# Catch The Flag — design system

> Tokens, type, components, and motion rules for `apps/web`.
> Decision record: [ADR-0011](decisions/0011-design-system-and-motion.md).
> Product identity: [product.md](product.md) §7.

The gallery at `/dev/design-system` renders every primitive. It is hidden in
production unless `ENABLE_DESIGN_SYSTEM=true`.

---

## 1. Color

Dark is the default. Light and system are `data-theme` on `<html>`.

| Token | Role |
|---|---|
| `--background`, `--surface`, `--surface-raised`, `--surface-overlay` | Canvas and panels |
| `--foreground`, `--muted`, `--faint` | Text. Faint still clears AA on the canvas |
| `--accent` | Signal amber. One brand color |
| `--success`, `--warning`, `--danger`, `--info` | Status |
| `--difficulty-beginner` … `--difficulty-expert` | API difficulties. Beginner reads as easy, expert as the top tier |
| `--category-*` | Fallback when a category has no hex color |

Do not put a second neon palette on admin tables. Glow (`--glow-accent`) is
for the hero and a solved state, not for every card.

## 2. Type

| Role | Face | Utility |
|---|---|---|
| Display | Fraunces | `type-display`, `type-title`, `font-display` |
| Body | Source Sans 3 | `font-sans` |
| Mono | IBM Plex Mono | `font-mono`, `type-eyebrow` |
| Arabic | IBM Plex Sans Arabic | Applied when `dir="rtl"` |

Sizes for display and titles use `clamp`. Do not jump to a fixed `text-7xl`
for a new hero.

## 3. Space, radius, elevation, z-index

Spacing stays on Tailwind's 4px scale. Radius tokens are `--radius-xs` through
`--radius-2xl`. Shadows are `--shadow-sm|md|lg`. Stacking:

`base 0 · raised 10 · sticky 40 · overlay 50 · drawer 60 · modal 70 · toast 80 · skip 90`

## 4. Motion

| Token | Value |
|---|---|
| `--duration-instant` | 80ms |
| `--duration-fast` | 140ms |
| `--duration-base` | 220ms |
| `--duration-slow` | 420ms |
| `--duration-slower` | 720ms |
| `--ease-out` | cubic-bezier(0.16, 1, 0.3, 1) |

Rules:

1. Animate `transform` and `opacity`. A progress bar may change width because
   it is a single contained track.
2. `prefers-reduced-motion: reduce` kills CSS animation and the JS hooks in
   `lib/motion/reduced.ts` skip the rest.
3. Ambient canvas (`AmbientGrid`) also checks data-saver and hardware
   concurrency, pauses off-screen, and pauses when the tab is hidden.
4. Confetti is dynamic-imported from the flag box and only runs after the
   server says `correct`.

## 5. Components

Primitives live in `components/ui`. Domain components stay named for the
product (`FlagSubmitBox`, `ChallengeCard`).

Dialogs and sheets trap focus, close on Escape, and restore focus. Toasts
use `aria-live`. The command palette is `Ctrl` or `Cmd` + `K`.

## 6. Theme and locale

- Signed-in theme is saved with `PUT /me/settings`. The switcher paints
  `data-theme` immediately and the server render agrees on the next request.
- Guests may set `ctf_theme`. The account value wins when both exist.
- `ctf_locale` is `en` or `ar`. Copy for chrome is in `lib/i18n`.

## 7. What the UI must not invent

Leaderboard windows, other players' profiles, flag plaintext, client-side XP,
and live machines. A level number is a label on server XP. A heatmap counts
ledger rows. A radar counts solves the API returned.
