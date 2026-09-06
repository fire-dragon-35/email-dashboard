# Changelog: Veyra

Decisions, pivots, and investigations, in the order they happened. This
is the "why" and "what we tried before" — for current-state facts, see
`ARCHITECTURE.md`.

## 2026-09-03 — FastAPI + SQLite backend deleted

Server-side OAuth flow, `/emails` endpoints, token + email-cache tables.
Deleted outright once superseded, not kept for reference.

## 2026-09-05 — Renamed to Veyra; IMAP + app-password architecture adopted

Replaced the OAuth/Gmail-API direction. The client-side Gmail OAuth +
Gmail REST API architecture (`GoogleAuthService`, `GmailService`,
Gmail-label-backed categories, the original hand-rolled SVG insights
chart) was deleted. Its chart-palette CSS tokens (`--chart-series-*` in
`src/styles/tokens.css`) were deliberately kept — dormant, cheap,
validated work worth preserving for when per-category insights come
back on top of IMAP data.

**Why OAuth was dropped:** Google requires a paid CASA security
assessment (~$5,000+) to verify sensitive Gmail scopes once an app
passes 100 users — a structural cost, not a bug to debug around. IMAP +
app passwords sidesteps it entirely, for any provider, with no per-app
review process.

**Why browser-side IMAP wasn't viable:** no actively-maintained library
does browser-side IMAP over a pluggable transport anymore
(`emailjs-imap-client`/`emailjs-tcp-socket` are both confirmed dead —
their own READMEs say the Chrome-Apps/Firefox-OS use case they served no
longer exists as a platform). Hence the relay: it holds one real
`ImapFlow` connection per browser tab and speaks JSON frames over
WebSocket; the browser parses MIME bodies client-side via `postal-mime`,
keeping the relay limited to protocol plumbing, not also a content
parser.

**Trust-model tradeoff, stated at the time:** the relay is a real IMAP
client — it does `LOGIN`, holds the app password, sees plaintext
messages for the session's duration. Not a passthrough byte pipe (the
original spec assumed browser-side IMAP, which turned out not to be
buildable). What's preserved: nothing persisted server-side, no
database, no logging of credentials or content, one WS connection = one
fresh IMAP connection.

### Aggregation: three revisions in one day

Slice 1 fetched a fixed count (newest 20 messages) with no date
awareness — which is why the inbox only ever showed ~2 days' worth for
a ~10-email/day account. Fixed the same day with a real IMAP
`SEARCH SINCE` plus a 500-message cap (a defensive pattern carried over
from the old Gmail-era `InsightsService`). Both the day-window and the
cap were then removed later the same day — see `MAX_MESSAGES` below —
once the cap was confirmed to be silently dropping mail.

### Relay built: `providerHosts.ts`, `ImapSession.ts`, `server.ts`, `protocol.ts`, `Logger.ts`

- `resolveImapHost(email)` established as the actual security boundary
  — the relay derives the host from the validated email domain itself;
  it never trusts a client-supplied host (a deliberate correction from
  the original spec's `?host=` query param).
- `ImapSession.ts` imports `ImapFlow`'s own shipped TypeScript types
  rather than hand-rolled approximations — verified directly against
  `node_modules/imapflow/lib/imap-flow.d.ts` after a hand-rolled type
  drifted from the real one (`internalDate` is `Date | string`, not
  just `Date`).
- `fetchMessages()` originally capped at `MAX_MESSAGES = 500` (oldest
  dropped, `truncated` flag returned when hit) and filtered by a
  caller-supplied `days` window before that. **Both were removed at the
  user's explicit request** ("remove the limits... extract all data")
  once the 500-cap was confirmed to be silently dropping older mail
  (including a whole Gmail category, "Kampanjer"/Promotions) within an
  active inbox's date window. The relay now always fetches the whole
  mailbox; scoping to a shorter window became a display-only concern
  (`GraphPanel`'s fixed 30-day window, added the same day — see below).
  **Note for next time a "missing category" symptom shows up:** also
  rule out Gmail's per-category "Show in IMAP" setting (Settings →
  Labels → Categories) — that's an account-side setting outside
  anything the relay controls.
- `protocol.ts` types (`ClientMessage`/`ServerMessage`) duplicated in
  `frontend/src/imap/protocol.ts` — no npm workspace set up to share
  them for real; tracked as a cleanup item, not an oversight.
- `Logger.ts` mirrors Python's `ToolLogger` (same deterministic
  name→color algorithm, sha256→hue→HSV→RGB), emitted via ANSI truecolor
  instead of `rich`. Silently no-ops when `VITEST` is set.

### Credential vault built (slice 2)

Lets a user opt in to saving the app password locally, protected by a
separate vault passphrase that is never itself stored.

- PBKDF2 iteration count set to 600,000 — OWASP's 2023 baseline.
- Built on raw `indexedDB`, not Dexie — Dexie was removed with no
  consumer left in the IMAP pivot; brought back would be exactly the
  kind of dependency this repo avoids when the native API is simple
  enough to own directly.
- `fake-indexeddb` was an unused devDependency left over from the Dexie
  era; `CredentialVault`'s tests are its first real consumer.
- Threat model stated plainly at build time: protects stored ciphertext
  against someone who obtains a copy of the IndexedDB data without the
  vault passphrase. Does not protect against XSS, a keylogger, or
  shoulder-surfing. Losing the vault passphrase makes the saved login
  permanently undecryptable.
- `src/lib/base64.ts` extracted because `CredentialVault` and
  `MessageReader` each needed base64 encode/decode and were about to
  grow two near-duplicate implementations.
- Browser `Logger.ts` uses a synchronous FNV-1a hash rather than
  SHA-256 — picking a display color isn't security-sensitive, and a
  sync hash avoids needing `crypto.subtle` (async) just to pick a color.

### `MailDataContext` introduced

Centralized the one `imapRelayClient.fetchMessages()` call, previously
owned by `EmailList` itself. Once the fetch cap was removed, the
`days`/`selectDays`/`isRefetching` machinery that existed to smooth over
range-triggered refetches had nothing left to do and was deleted, along
with `ScopingRow` (the old 7/14/30-day picker) — its only job was
picking the fetch window. If a future slice needs a shared scoping
control again (e.g. a category-chip row), it's cheap to recreate then.

### Insights graph shipped as a plain table first, deliberately

Before any chart existed, an intermediate pass rendered the per-day
counts as a plain table — on purpose, to prove the day-bucketing data
pipeline before committing to a chart form on top of it.

### Chart: hand-rolled SVG replaced with Recharts

The original chart was hand-rolled by following the `dataviz` skill's
procedure directly, deliberately avoiding a library ("the skill's mark
spec is precise enough that a library fights you on styling"). That held
up until getting "every day gets a label, none skipped, none colliding"
right at 30 days turned out worse than expected by hand — switching to
Recharts was the right call over continuing to fight it.

**Real cost, paid knowingly:** JS bundle grew roughly 2.5× (~99KB →
~202KB gzipped) — Recharts pulls in `victory-vendor`'s d3 modules.
Acceptable for a personal dashboard; would need a second look if load
time on a slow connection ever mattered.

`GraphPanel` given a fixed 30-day trailing window (`WINDOW_DAYS = 30`),
not user-adjustable — a deliberate call, not a default: once the fetch
was uncapped, the user explicitly wanted daily bars always (never a
coarser bucket), which makes 30 days roughly the ceiling before x-axis
labels collide — the same crowding problem already rejected once at 30
bars with the hand-rolled chart.

The "View as table" fallback was removed as redundant — a real, known
accessibility regression (no non-visual alternative to the chart) that
the `dataviz` skill's own procedure calls mandatory. **Accepted
knowingly; don't quietly re-add "for completeness" without registering
the tradeoff again.**

**Testing note:** `ResponsiveContainer` needs `ResizeObserver`, which
jsdom doesn't implement — stubbed once in `src/test/setup.ts`. jsdom
still reports 0×0 layout, so hover-tooltip hit-testing can't be reliably
tested; `GraphPanel.test.tsx` was scaled back to asserting render +
loading/error/empty states rather than per-bar hover, a real accepted
tradeoff of adopting a third-party chart library.

### `TopSenders` added

Ranks `messages` by `from`, unbounded by date — deliberately answers a
different question than `GraphPanel`'s 30-day window ("who sends me the
most mail, ever" vs. "what's the daily shape of my last month").
Magnitude encoded via one sequential hue (same rule the `dataviz` skill
applies to charts), even though this is plain HTML, not an SVG chart —
already a readable list, so it doesn't need the chart accessibility
apparatus.

Copy-to-clipboard added the same day. `navigator.clipboard.writeText`
wrapped in a `withTimeout` race (3000ms) — **this is load-bearing, not
defensive boilerplate.** Found live during manual browser verification:
the Clipboard API promise can hang forever instead of ever rejecting (an
unresolved permission prompt settles neither way), which froze the tab
for 45s when triggered directly in devtools. A `try/catch` alone isn't
sufficient — a catch block never runs on a promise that never settles.
The timeout guarantees the button resolves to something visible within
3s. Not fully confirmed whether the hang is specific to automated test
harnesses (a CDP-driven click may not count as a "real" gesture) or
reproducible on a normal click too — kept the guard either way, since
the downside of removing it (a permanently stuck button) is worse than
the downside of keeping it (a real failure takes 3s instead of instant).

### `QuickUnlock` added

A page refresh always loses the connection and all in-memory state, so
some re-entry is unavoidable — but a returning user with a saved login
was landing on the marketing page and clicking Connect before even
reaching the passphrase field. `App.tsx` started checking for a saved
login on load and showing just the passphrase prompt directly
(`QuickUnlock`) instead of the full landing page.

**Alternative considered and rejected:** caching the decrypted password
in `sessionStorage` to skip the passphrase prompt entirely for the tab
session. Rejected specifically to keep the threat model unchanged — the
vault passphrase stays required every time; nothing is cached across a
refresh. (`QuickUnlock` itself was later deleted 2026-09-06 once
`LandingPage` became the single connect/unlock entry point — see below
— but the reason re-entry can't be skipped entirely still holds.)

### `EmailList` From-select filter removed

A `<select>` built from every distinct sender in range doesn't scale — a
busy inbox turns it into an unusably long dropdown. Search already
covers "find messages from X" via substring match over `from`; no
direct replacement was added.

### `Sidebar` retired

The hamburger/off-canvas sidebar concept was deleted outright once
category filtering moved into the (then-planned) scoping row's design
and settings access moved into the navbar directly. Its supporting
hooks (`useSidebarToggle`, `useIsMobile`) went with it, since `Sidebar`
was their only consumer.

### `Navbar` logo made clickable

Added because the landing page had become unreachable once connected —
there was no route back to it at all. `App.tsx` holds a
`view: 'dashboard' | 'landing'` state, independent of `connected`.
Deliberately placed the outer `MailDataProvider` to wrap the view branch
rather than the other way around, so toggling back to `'dashboard'`
doesn't re-fetch the whole mailbox — a full-mailbox fetch is no longer
cheap once the cap was removed.

## 2026-09-06

### `PageHeader` extracted

`Navbar` and `LandingPage` had each grown a byte-for-byte-identical flex
row header under two different class names
(`.navbar`/`.landing__header`). Unified into one component and one CSS
class (`.page-header`) so the logo behavior can't drift between pages
the way it had been drifting.

### `BrandLogo` made `onClick`-required

The earlier version made `onClick` optional and rendered a static
`<span>` when omitted — which is exactly how the landing page's own logo
ended up inert while `Navbar`'s and the old `QuickUnlock`'s became
clickable through separate one-off patches. A caller could always
"forget" to wire it up, silently. Requiring `onClick` removes that
option; `LandingPage`'s logo still supplies real (if no-op-equivalent)
behavior rather than nothing.

**A real CSS bug caught by manual browser verification, not guessed:**
the once-separate clickable-variant reset rule used the `font: inherit`
shorthand, which resets font-weight/font-size too — declared after the
base rule at equal specificity, it silently wiped the bold/1.125rem
styling wherever the logo was a button. Fixed with `font-family:
inherit` instead, which undoes only the browser's default button font.
Moot now that there's only one rule, but the lesson: a shorthand
"reset" is a trap the moment another rule at equal specificity sets the
same sub-properties — reach for the specific sub-property instead.

### `QuickUnlock` deleted; `LandingPage` becomes the single connect/unlock entry point

`QuickUnlock` rendered its own full-page copy of the same "enter your
vault passphrase" form outside any modal — two different presentations
of the identical action, the same kind of duplication that let
`BrandLogo` drift out of sync above. `LandingPage` now auto-opens
`ConnectCard` on mount when a saved login exists; `ConnectCard` already
picks `UnlockSavedLogin` vs. `LoginForm` internally, so nothing else was
needed. Deleted outright rather than kept "just in case."

### Global button transitions added

One rule in `App.css` (`transition: background-color 150ms ease,
border-color 150ms ease, color 150ms ease`, guarded under
`prefers-reduced-motion: reduce`) rather than per-component transition
declarations, so new buttons get the fade for free.

### `Modal` focus-trap timing fixed

**Only reproduces in a real browser, not jsdom** — there's no real
in-flight event to race in jsdom, which is why the test suite never
caught it; found via manual browser verification. Activating a focus
trap with `clickOutsideDeactivates: true` in the same click that opens
the modal makes focus-trap see that originating click — still finishing
its bubble through `document` — as an outside click on its own trigger
button, closing the modal immediately. Fixed by deferring activation one
tick past mount (`setTimeout(fn, 0)`, toggled via `active={trapActive}`
rather than mounting `FocusTrap` pre-activated).

Modal open/close animation added the same day (backdrop fade, dialog
fade+scale, ~150–180ms, `cubic-bezier(0.16, 1, 0.3, 1)` — same easing as
`.email-item--enter`), guarded under `prefers-reduced-motion: reduce`.

### `GraphPanel` label rotation removed

An earlier version used `tick={{angle: -45, textAnchor: 'end'}}` to
avoid collisions — technically avoided overlap but read as messy.
Measured rather than guessed before removing it: at `fontSize: 9`, even
the widest label ("12/31", `getComputedTextLength()` ≈ 23.6px) is close
enough to each day's slot width (~20.7px at 30 slots) that plain
horizontal centered labels work with only the rarest, barely-visible
overlap — nowhere near the collision the rotation was originally added
to solve.

### `GraphPanel`/`TopSenders` equal-height card fix

`.app__row` had `align-items: stretch` from the start and it was
working — devtools confirmed both columns were always exactly the same
computed height. The bug was that only `.app__top-senders-col` had a
visible border; `.app__chart-col` had none, so its identical stretched
height was invisible and the row looked mismatched even though the
layout math was already correct. Fixed by giving both columns the same
card chrome, plus a scoped `.app__chart-col .graph-panel { margin-bottom:
0 }` override (that margin exists for `.graph-panel`'s other context —
spacing it from `EmailList` on the landing demo — and was creating
lopsided space here, where it's the only child).

**Lesson:** check computed layout before assuming the flex/grid math is
wrong — here it wasn't; the mismatch was about which elements had
visible chrome to compare.

### `EmailList` "Hide read" filter removed

Removed outright at the user's request — the checkbox, its state and
filter predicate in `EmailList`, the `.email-list__hide-read` CSS rule,
and the covering test. `EmailListItem` never used the `\Seen` flag for
anything else (no read/unread visual distinction exists today), so
nothing else depended on it. `LAYOUT.md`'s planned redesign still shows
a "Hide read" toggle in its scoping row — not touched here, since that's
a future-design question, not a statement about what's currently built.