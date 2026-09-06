# Design system — v2

**Direction (superseded 2026-09-06):** minimalist editorial-tech. Calm,
confident, slightly playful, independent-software-studio feel — think
Apple's restraint plus Linear/Vercel's product polish, with an indie,
open-source personality on top. Avoids the "AI startup" look: no
glowing gradients, no glassmorphism, no sci-fi imagery.

This retires v1's terminal/dev-tool direction (monospace-heavy,
dark-mode-first, blueprint motifs). See `CHANGELOG.md` for that
direction's history — it was never fully built out (only tokens were
applied to components, no signature motifs), so nothing needs undoing.

All token names below live in `frontend/src/styles/tokens.css`.

## Personality

"Open-source intelligence, presented like a beautifully designed
consumer product." Serious technical credibility with friendly, human
language — plain, warm copy, not corporate. In three words: minimal,
editorial, confident.

## Color

Predominantly light, near-monochrome: `--bg`/`--surface`/`--surface-2`
(off-white to white) and `--ink`/`--soft`/`--faint` (near-black to warm
gray) carry almost all of the visual weight. `--accent` (terracotta) is
the one restrained accent — used sparingly, for CTAs and the one thing
per screen that should draw the eye, never as a background wash or
decoration. Status tokens (`--good`/`--warn`/`--danger`) stay muted,
same as before.

Chart series colors are still not defined — see `PRODUCT.md` roadmap.
Load the `dataviz` skill to derive a palette from `--accent`/`--good`/
`--warn` when `GraphPanel`/`TopSenders` are migrated to v2.

## Typography

- `--font-sans` now leads with Inter (loaded via `index.html` — see
  note below) for a real "modern grotesk" feel, not the OS default.
  `--font-mono` is now a secondary, occasional choice — tabular data
  only (timestamps, counts), not the primary UI voice it was in v1.
- Two type scales, used for different jobs:
  - **Display** (`--text-display-sm/md/lg`, ~32-96px fluid): hero and
    section headlines only. `--leading-tight`. Bold/black weight.
    Never for body copy or UI chrome.
  - **Body/label** (`--text-2xs` through `--text-2xl`, 11-20px):
    everything else — labels, values, buttons, form fields.
    `--leading-normal` for paragraphs of body copy.
- Hierarchy pattern for any pitch/explanatory content: oversized
  headline → one short explanatory line → one clear call to action.
  Resist adding a second supporting paragraph — compact body text next
  to a large headline is the point, not a gap to fill.
- Sentence case, not Title Case or uppercase, except where a small
  uppercase label genuinely earns it (rare — check with `--tracking-label`
  before defaulting to it, don't reach for it as decoration).

**index.html note:** add
`<link rel="preconnect" href="https://fonts.googleapis.com">` and the
Inter `<link>`/`@import` before this scale is usable — the token alone
doesn't load the font.

## Layout & spacing

- Generous whitespace is the load-bearing design choice here, not a
  finishing touch. Wide horizontal sections, large centered statements,
  deliberate visual pauses between sections — use `--space-10`/`-12`/
  `-16` for section-level rhythm, not the smaller scale stretched thin.
- Corners are soft: `--radius-sm`/`--radius-md` (6-12px) for standard
  controls and cards, `--radius-lg`/`--radius-xl` (16-24px) for larger
  surfaces (hero cards, feature panels), `--radius-pill` for buttons.
  Nothing sharp-cornered anymore — that was v1's signature, not this
  one's.
- Buttons are chunky and high-contrast: generous padding, `--radius-pill`,
  solid `--accent` fill for primary actions — not a thin bordered
  outline like v1's status-dashboard buttons.
- Navigation stays compact and utilitarian (this doesn't change from
  today's `Navbar`) — the contrast between a dense top nav and a
  spacious hero/body is deliberate, not an inconsistency to fix.
- Shadows are a last resort. Reach for a `--line` border first; use
  `--shadow-1`/`--shadow-2` only when a surface genuinely needs to look
  lifted off the page.
- Motion: `--transition-fast` for hover/state changes,
  `--transition-modal` for dialogs — both already "subtle, smooth,
  purposeful," unchanged from v1. Nothing new needed here.

## Imagery

Product screenshots and simple branded illustrations carry the visual
interest, not photography. Where the landing page shows the real
`GraphPanel`/`EmailList` against sample data (see `ARCHITECTURE.md`'s
`LandingPage` section), that's already this principle in action — the
product's own UI is the imagery, not a stock photo or hero illustration
standing in for it.

## Retired from v1

These were part of the terminal/dev-tool direction and don't carry
forward — none were ever built into a component, so there's nothing to
remove from code, just don't build them going forward:

- Corner brackets (blueprint/schematic accent marks)
- Meter bars with tick marks
- Dashed "ghost" chips for placeholders
- Terminal-prompt section headers (`user@host ~ % command`)
- Sharp 2-3px corners as the default

**Pill badges carry forward, repurposed** — a rounded status chip with
a colored dot already matches "pill-like buttons" directly; keep using
them for provisioning/health/state indicators, just on the new soft
radius scale instead of the old sharp one.