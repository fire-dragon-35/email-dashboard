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
gray) carry almost all of the visual weight.

**Two accents, strictly scoped by role (amended 2026-09-06):**
- `--accent` (terracotta) is the **interactive** accent — CTAs, links,
  focus rings, anything a user clicks or that signals "act here." Used
  sparingly, one per screen.
- `--accent-secondary` (desaturated sage) is **decorative only** —
  illustration fills, background shapes, non-functional visual
  interest. It must never appear on a button, link, form control, or
  anything interactive. If you're reaching for `--accent-secondary` on
  something clickable, that's `--accent`'s job instead.

This replaces v2's original "one restrained accent, never as
decoration" rule — that rule is why the decorative hero shape was
flagged as a conflict in the first place; the scoped two-accent system
above is the resolution, not an exception to quietly ignore.

Status tokens (`--good`/`--warn`/`--danger`) stay muted, same as
before.

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

## Content & UX principles

Standing rules, not just how things happen to work today — anything
built later is held to these too:

- **One word per concept, everywhere.** If it's "your inbox" in one
  place, it's "your inbox" everywhere — not "your mail" in the nav and
  "your messages" in a tooltip. Pick the term once (in `PRODUCT.md` or
  here) and reuse it verbatim across every surface: headlines, buttons,
  empty states, error messages.
- **One entry point per action, no exceptions.** A given action (connect,
  disconnect, open settings) has exactly one button/control that
  triggers it, from exactly one place at a time. `LAYOUT.md`'s Connect
  flow is the existing example, not a special case — the same rule
  applies to anything added later. If a new screen seems to need a
  second "Connect" button, that's a sign the layout is wrong, not a
  reason to add one.
- **The demo is never allowed to lie.** `LandingPage`'s interactive demo
  renders the real `GraphPanel`/`EmailList` against sample data — see
  `ARCHITECTURE.md`. This is a rule, not an implementation detail: any
  future landing/marketing content must represent what the product
  actually does today. No mocked interactions, no aspirational features
  shown as if they exist, no prettied-up fake data that doesn't match
  the real component's behavior.

## Layout & spacing

- Generous whitespace is the load-bearing design choice here, not a
  finishing touch. Wide horizontal sections, large centered statements,
  deliberate visual pauses between sections.

  **Spacing standard — pick by relationship, not by habit:**

  | Relationship | Token | ~Size |
  |---|---|---|
  | Icon-to-label, inline elements | `--space-1` | 4-6px |
  | Label-to-input, tight list rows | `--space-2` | 8-12px |
  | Inside small components (buttons, chips) | `--space-3` | 12-18px |
  | Standard component padding (cards, inputs) | `--space-4` | 16-24px |
  | Headline to its supporting line | `--space-6` | 24-36px |
  | Between sibling components in the same section | `--space-8` | 32-48px |
  | Between major blocks within a section (e.g. hero content to CTA) | `--space-10` | 40-60px |
  | Between distinct sections on a page | `--space-12` | 48-72px |
  | Between major page regions (hero to next section) | `--space-16` | 64-96px |

  When in doubt, go one step larger, not smaller — a cramped layout is
  a worse failure than a slightly loose one in this direction. If
  something still looks tight after picking the token for its actual
  relationship, that's a sign the relationship was misjudged, not a
  reason to reach for a bigger token without re-checking which
  relationship applies.
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