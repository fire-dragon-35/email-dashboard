# Architecture: Veyra

Current-state reference. For *why* things are shaped this way, or what
they used to be, see `CHANGELOG.md`. This file describes what exists now.

Regenerate the import graph rather than trusting the prose below for
module boundaries: `npm run graph`, output in `docs/architecture.{json,svg}`.

## Trust model

The relay is a real IMAP client: it performs `LOGIN`, holds the app
password, and sees plaintext messages for the session's duration. It is
not a byte passthrough. What's guaranteed: nothing persists server-side,
no database, no logging of credentials or message content, one WebSocket
connection = one IMAP connection, torn down on disconnect.

## `relay/` — Node + TypeScript, `"type": "module"`

- `src/providerHosts.ts` — `resolveImapHost(email)`. The actual security
  boundary: the relay derives the IMAP host from the validated email
  domain; it never trusts a client-supplied host.
- `src/ImapSession.ts` — one `ImapFlow` connection per WS client, via an
  injectable `ImapFlowFactory` (unit-testable with no real network).
  Uses `ImapFlow`'s own shipped types (`FetchMessageObject`,
  `FetchOptions`, `FetchQueryObject`, `MailboxLockObject`,
  `MailboxObject`) rather than hand-rolled ones.
  `fetchMessages()` locks INBOX, resolves every UID via
  `search({all: true}, {uid: true})`, fetches all of them, sorts
  newest-first, releases the lock in `finally`. No cap, no date filter —
  the relay always fetches the whole mailbox; date-scoping is a
  display-only concern (see `GraphPanel` below).
  `fetchBody(uid)` returns the RFC822 source, base64-encoded.
  `close()` tries `logout()`, falls back to `close()`.
  Logs email + derived host on connect, never the password.
- `src/server.ts` — one `ws` `WebSocketServer`; each connection gets its
  own `ImapSession`. Every op is wrapped in try/catch sending a
  `{type:'error', message}` frame instead of crashing the process.
  Each connection gets a short incrementing id, prefixed onto its logs.
- `src/protocol.ts` — `ClientMessage` (connect/fetchMessages/fetchBody/
  disconnect) and `ServerMessage` (connected/messages/body/error)
  discriminated unions. Duplicated in `frontend/src/imap/protocol.ts` —
  no shared package yet (see "Not yet decided").
- `src/Logger.ts` — Node-side counterpart to `utility/logger.py`: same
  deterministic name→color algorithm (sha256→hue→HSV→RGB), ANSI
  truecolor. `Logger.get(name)`, memoized. No-ops when `VITEST` is set.

## `frontend/src/imap/` — the relay client

- `protocol.ts` — mirrors `relay/src/protocol.ts`.
- `ImapRelayClient.ts` — WebSocket wrapper: `connect(email, password)`,
  `fetchMessages()` → `MessageSummary[]`, `fetchBody(uid)`,
  `disconnect()`. One request in flight at a time — a one-shot `message`
  listener per call, no request-ID correlation. Fine while nothing
  issues concurrent requests.
- `providerDetection.ts` — cosmetic-only mirror of `providerHosts.ts`
  (UI hint text). Not a security boundary; the relay re-derives the host
  itself regardless.
- `imapRelayClientSingleton.ts` — reads `VITE_RELAY_URL`, throws if
  unset.

## `frontend/src/credentials/` — encrypted local credential vault

Lets a user opt in to saving the app password locally, protected by a
separate vault passphrase that is never itself stored.

- `crypto.ts` — `deriveKey(passphrase, salt)` (PBKDF2-HMAC-SHA256,
  600,000 iterations, non-extractable 256-bit AES-GCM key),
  `encrypt`/`decrypt` (AES-GCM). A wrong passphrase is detected via
  AES-GCM's auth tag rejecting on decrypt — no separate stored hash to
  brute-force offline.
- `CredentialVault.ts` — one object store, one fixed-key record (single
  saved account, no multi-account UI). Raw `indexedDB`, not a wrapper
  library. `save`/`load`/`hasSaved`/`clear`. `load` returns `null` when
  nothing is saved, throws `WrongPassphraseError` on decrypt failure.
  Constructor takes an injectable `IDBFactory` (defaults to
  `globalThis.indexedDB`).
- **Threat model:** protects stored ciphertext against someone who
  obtains a copy of the IndexedDB data without the vault passphrase. It
  does **not** protect against script running in the page while
  unlocked (XSS), a keylogger, or shoulder-surfing. Losing the vault
  passphrase makes the saved login permanently undecryptable — recovery
  is "Forget saved login" + re-entering the real app password.
- `src/lib/base64.ts` — `bytesToBase64`/`base64ToBytes`, shared by
  `CredentialVault` and `MessageReader`.
- `src/lib/Logger.ts` — browser-side counterpart to `ToolLogger`/relay's
  `Logger`: FNV-1a hash (sync, since a display color isn't
  security-sensitive), `console.*` with `%c` coloring. Silent in test
  mode.

## `frontend/src/context/MailDataContext.tsx`

Single source of truth for connected-view data. `MailDataProvider` owns
the one `imapRelayClient.fetchMessages()` call, run once per connection
— no range concept; the relay always returns the whole mailbox, so
there's nothing to re-fetch on a range change. `status` goes `'loading'`
→ `'ready'`/`'error'` once.

Every message currently gets a placeholder `categoryId: 'all'`;
`categories` is a one-entry array (`{id:'all', name:'All Mail',
color:'var(--chart-series-1)'}`) — shaped so real multi-category data
can slot in later. Derives `countsByCategory` via `useMemo`.
Day-bucketing lives in `GraphPanel`, not here.

Takes an optional `demoMessages?: CategorizedMessage[]` — when set,
skips fetching and seeds `messages` directly (used by `LandingPage`'s
sample-data demo, which mounts the real `GraphPanel`/`EmailList`, not a
mockup). `useMailData()` throws outside the provider.

## `frontend/src/components/`

**Not-connected (landing) view**

- `LandingPage` — `PageHeader`, a trust blurb, an interactive demo
  (`MailDataProvider demoMessages={SAMPLE_MESSAGES}` wrapping the real
  `GraphPanel`/`EmailList`), `Footer`. Owns `ConnectCard` open/close
  state. Two modes via props: `onConnected` (pre-connection — header
  button "Connect", opens `ConnectCard`) or `onBackToInbox`
  (post-connection, reached via the navbar logo — header button "Back
  to inbox", `ConnectCard` not rendered). Single connect/unlock entry
  point: an effect calls `credentialVault.hasSaved()` on mount and
  auto-opens `ConnectCard`, which itself picks `UnlockSavedLogin` or
  `LoginForm`. The logo's `onClick` is always
  `() => setIsConnectCardOpen(false)` in both modes — it never triggers
  "back to inbox"; that's a separate, explicit action.
- `ConnectCard` — a `Modal` wrapping the connect flow. Checks
  `credentialVault.hasSaved()` every time it opens and renders
  `UnlockSavedLogin` or `LoginForm` accordingly.
- `LoginForm` — email + app-password fields, provider hint via
  `providerDetection`, calls `imapRelayClient.connect(...)`. A "Remember
  this login" checkbox (off by default) reveals a vault-passphrase field;
  on successful connect with both set, calls `credentialVault.save(...)`
  before `onConnected`. A save failure doesn't block an already-
  successful connect.
- `UnlockSavedLogin` — shown instead of `LoginForm` when a saved login
  exists. Vault-passphrase field; `credentialVault.load(...)` then
  `imapRelayClient.connect(...)`. `WrongPassphraseError` → "Incorrect
  passphrase." "Forget saved login" clears the vault, falls back to
  `LoginForm`.

**Shared**

- `PageHeader` — `BrandLogo` on the left, a `children` slot on the
  right. Used by both `Navbar` and `LandingPage`.
- `BrandLogo` — the wordmark. `onClick` is required — no
  non-clickable variant exists.
- Global button transitions: one rule in `App.css` —
  `transition: background-color 150ms ease, border-color 150ms ease,
  color 150ms ease`, guarded under `prefers-reduced-motion: reduce`.
- `Modal` — backdrop + focus-trapped dialog + Escape/backdrop-click/✕ to
  close. Trap activation deferred one tick past mount via
  `setTimeout(fn, 0)` (see `CHANGELOG.md` for why this is load-bearing).
  `tabbableOptions: {displayCheck: 'none'}` required for jsdom tests.
  Backdrop fades in, dialog fades+scales in (~150–180ms,
  `cubic-bezier(0.16, 1, 0.3, 1)`), guarded under
  `prefers-reduced-motion: reduce`.
- `SettingsPanel` — a `Modal`; placeholder body (category management is
  the planned content once real categorization exists).
- `Footer` — "Veyra © 2026" + repo link. Rendered by both `LandingPage`
  and the connected view.

**Connected view**

- `Navbar` — logo, "logged in as `<email>`", Settings button, Disconnect.
  Logo click sets `App.tsx`'s `view` state to `'landing'`, rendering
  `LandingPage` in "already connected" mode without disconnecting — the
  outer `MailDataProvider` stays mounted across the toggle, so no
  re-fetch. `view` resets to `'dashboard'` on every successful connect.
- `GraphPanel` — a Recharts bar chart of `volumeByDay`, computed here.
  `XAxis interval={0}`, horizontal (not rotated) labels at `fontSize: 9`.
  Bars: `radius={[4,4,0,0]}`, `maxBarSize={16}`, fill
  `var(--chart-series-1)`. Custom tooltip matching the app's
  value-leads-label convention. No legend (one series). No table-view
  fallback (known, accepted accessibility gap — see `CHANGELOG.md`
  before re-adding "for completeness"). Fixed 30-day trailing window
  (`WINDOW_DAYS = 30`), not user-adjustable; zero-fills every day in the
  window including days with no mail. Reads color as
  `--chart-series-1` directly, not from `MailDataContext`.
  `ResizeObserver` is stubbed once in `src/test/setup.ts` for jsdom;
  hover-tooltip hit-testing isn't reliably testable in jsdom, so tests
  assert container render + loading/error/empty states, not per-bar
  hover.
- `TopSenders` — ranked list (not a chart): groups `messages` by `from`,
  counts, sorts descending, caps at top 8. Unbounded by date (ranks over
  the whole fetched mailbox, unlike `GraphPanel`'s 30-day window). Each
  row: name + count + a relative-frequency bar (`--chart-series-1`
  fill). Copy-to-clipboard per row via `extractEmailAddress` (strips
  "Display Name <address>" to the bare address).
  `navigator.clipboard.writeText` is wrapped in a `withTimeout` race
  (3000ms) — load-bearing, see `CHANGELOG.md`. No "Assign category"
  action yet (blocked on category storage).
- `EmailList` / `EmailListItem` / `EmailListSkeleton` — unbounded by
  date. Read `messages`/`status`/`selectedCategoryId` from
  `useMailData()`. Own filter bar (search over subject/from) plus
  client-side pagination (10/page, ellipsis-windowed via
  `buildPageList`, resets to page 1 on filter change). No From-select
  filter (removed — didn't scale; search covers the same case via
  substring match). No "Hide read" filter either (removed — see
  `CHANGELOG.md`).
  Clicking a row selects it in `App.tsx`, swapping the list for
  `MessageReader`.
- `MessageReader` — fetches raw body via `fetchBody(uid)`, parses
  client-side with `PostalMime.parse(...)`. **Security-critical:**
  untrusted HTML renders inside a fully-sandboxed
  `<iframe sandbox="" srcDoc={...}>` — never `dangerouslySetInnerHTML`.
  Plain-text renders in `<pre>`.

**Other**

- `src/lib/sampleMailData.ts` — fixture data for `LandingPage`'s demo
  only; never touches a real data path.
- `src/styles/tokens.css` — editorial-tech palette (`DESIGN.md`) plus
  `--chart-series-*` tokens, used by `GraphPanel`/`TopSenders`.
- Env: `VITE_RELAY_URL` (`.env`, gitignored; `.env.example` committed).
  `wss://` mandatory anywhere real — the app password transits this
  connection.

## Roadmap / open questions

See `PRODUCT.md` — one canonical list, not duplicated here.