# Page layout — planned redesign

**This is a plan, not a snapshot of the built app.** The wireframes below
sketch where the app (now named **Veyra**) is headed next; none of this
is implemented in code yet. For what's actually built and running today,
see `ARCHITECTURE.md`'s frontend section — the two will diverge until
this gets implemented, at which point this file should be updated to
match reality again (same living-doc discipline as `PRODUCT.md`).

Still Flexbox-based, no CSS Grid planned. Open questions are called out
inline rather than guessed at.

**Resolved (2026-09-06):** the dashboard layout (navbar, scoping row,
row 1's chart+top-senders split, row 2's list) stays Flexbox — every
one of those is genuinely one-dimensional (a single row), and Grid
wouldn't add anything. "A grid system" meant wanting a clearly
structured, responsive layout, not necessarily the CSS Grid property.
If the editorial landing-page redesign adds a multi-column feature/tile
section, *that* specific piece should use real CSS Grid
(`grid-template-columns: repeat(auto-fit, minmax(280px, 1fr))`) rather
than forcing Flexbox to fake two-dimensional alignment — but nothing
else in this file needs to change to Grid. See `DESIGN.md`'s
"Content & UX principles" section for the no-synonyms/no-duplicate-CTA/
demo-authenticity rules that also apply to everything below.

## Logged out — landing page

Logo left, a single "Connect" call-to-action right. The page itself is
no longer just a bare form — it's a pitch: a live, interactive preview of
the dashboard (fake/sample data) so a visitor can see what they'd get
*before* connecting anything, plus a short trust statement (open source,
runs locally, no cloud storage — the same trust framing already in
`PRODUCT.md`'s Positioning section) and a mention that local,
browser-run AI summarization is planned.

```
┌────────────────────────────────────────────────────────┐
│ Veyra [Connect] │ navbar: logo left, CTA right
├──────────────────────────────────────────────────────────┤
│ │
│ Open source. Runs entirely on your machine — no │
│ cloud storage of your email, ever. Local, browser-run │
│ AI summarization is planned. │ trust blurb
│ │
│ ┌────────────────────────────────────────────────┐ │
│ │ [try it] ← interactive, using sample data │ │
│ │ │ │
│ │ chart · top senders · email list — same shape │ │
│ │ as the real logged-in view below, just fake │ │
│ │ data, so you can click around before │ │
│ │ connecting a real inbox │ │
│ └────────────────────────────────────────────────┘ │
│ │
├──────────────────────────────────────────────────────────┤
│ Veyra © 2026 · github.com/<owner>/email-dashboard │ footer (real repo URL TBD)
└────────────────────────────────────────────────────────┘
```

### The Connect card

Clicking "Connect" opens a card (modal or anchored popover — TBD) with
the login fields. **On the "how much provider help text" question:**
recommend *not* listing every provider's app-password steps at once —
that's mostly-irrelevant text for any single visitor. The existing
`providerDetection.ts` already solves this the right way: it detects the
provider from the typed email domain and shows one contextual hint +
link. Reuse that pattern here — the card only ever needs room for *one*
provider's hint line, not five.

```
┌───────────────────────────────────┐
│ Connect your inbox [x]│
│ │
│ Email address │
│ [] │
│ │
│ App password │
│ [] │
│ │
│ [ ] Remember this login │
│ │
│ Detected: Gmail. Requires 2-Step │ ← ONE contextual hint,
│ Verification first. │ same as today's LoginForm —
│ Generate an app password → │ not all providers at once
│ │
│ [ Connect ] │
└───────────────────────────────────┘
```

## Logged in

No hamburger/sidebar anymore — dropped as redundant now that
categorizing senders lives inline in the top-senders list. Its one real
job (a place to reach settings) moves into the navbar directly instead:
logo, "logged in as <email>," a Settings entry, and Disconnect.

A single scoping row sits directly below the navbar, above both row 1
and row 2 — one control surface that scopes *everything* on the
dashboard (chart, top senders, email list), not something tucked inside
any one container. Same placement principle the `dataviz` skill already
established for this app: filters live in one row above the content
they scope, and everything below re-renders against the same slice so
the numbers always agree. This row now owns **both** category toggles
and the date range — previously the chart had its own separate range
control and the list had a second, independent date filter; those
disagreed with each other and with the category row's "everything
scopes together" principle, so they're merged into this one row. There
is exactly one date range for the whole page.

Each category chip toggles independently (multi-select, not radio) —
turn categories on/off to include/exclude them everywhere at once; "All"
is shorthand for every category active.

**Category overflow:** a flat chip row only works up to ~6–8
categories before it wraps and starts competing with the chart for
vertical space, or overflows so a toggled-off category isn't visible.
Fix: show the first 6–8 (by recency or usage) as chips, fold the rest
into a single **"+N more ▾"** chip that opens a small popover with the
remaining categories as the same toggle chips — same interaction,
paginated visually instead of wrapping. Not solving for arbitrarily many
categories on day one; revisit with a search field inside that popover
only if usage shows people actually creating 15–20+.

```
┌────────────────────────────────────────────────────────┐
│ Veyra you@example.com [⚙ Settings] [Disconnect]│ navbar
├──────────────────────────────────────────────────────────┤
│ ● All ✓ Newsletters ✓ Work ○ Receipts +2 more ▾ │
│ [Aug 1–7 ▾] (+ New) │ scoping row: categories
├──────────────────────────────────────────────────────────┤ + ONE date range —
│ │ scopes chart, top
│ ┌────────────────────────────────────┐ ┌─────────────┐│ senders, and list below
│ │ │ │ Top senders ││
│ │ │ │ ────────── ││
│ │ │ │ noreply@x 42││
│ │ chart (~80% width) │ │ news@y 31││ row 1
│ │ │ │ ... ││ two containers:
│ │ │ │ ││ chart (~80%) +
│ │ │ │[Assign ││ top-senders list
│ │ │ │ category] ││ (~20%) — not
│ └────────────────────────────────────┘ └─────────────┘│ refined further
│ │ for now, per your
│ ┌────────────────────────────────────────────────────┐│ call
│ │ [Search subject/from___] From▾ Hide read [ ] ││
│ │ ──────────────────────────────────────────────── ││
│ │ Subject From Date ││
│ │ ──────────────────────────────────────────────── ││
│ │ ...20 rows, one page... ││ row 2
│ │ ││ full list, filterable,
│ │ ‹ 1 2 3 … 8 › ││ paginated (20/page,
│ └────────────────────────────────────────────────────┘│ no infinite scroll)
│ │
├────────────────────────────────────────────────────────┤
│ Veyra © 2026 · github.com/<owner>/email-dashboard │ footer
└────────────────────────────────────────────────────────┘
```

Filter row above the paginated list, scoped to the list only (the
scoping row above already sets category + date range for everything —
this is *within* whatever slice is active): free-text search over
subject/from, a From filter (narrow to one sender — pairs naturally with
clicking a row in "Top senders"), and a "Hide read" toggle (same on/off
interaction as the category chips above, just local to this list rather
than global). No separate date filter here anymore — the list uses the
one range set in the scoping row, no override. Still paginated once
filtered, not infinite scroll — filtering changes what's in the 20/page,
not how pagination works.

**Open question, not resolved here:** what "Settings" actually contains.
*Filtering* by category now has its own dedicated control (the toggle
row above), so Settings' job is narrower than before — category
*management* (create/edit/delete a category, assign sender rules,
"+ New" above) is still the strongest candidate, but nothing's decided;
flagging rather than inventing a settings screen.

**Deprioritized, not designed further right now:** the top-senders
container stays in the wireframe roughly as sketched, but its exact
ranking window isn't worth resolving yet. Its relationship to the list
below has a likely answer now, though — clicking a sender there sets the
list's "From ▾" filter, and "Assign category" (renamed from
"Categorize" to make clear it's a per-sender action, not category
management) puts that sender's mail into an existing category — but
that's a natural pairing, not a firm decision.