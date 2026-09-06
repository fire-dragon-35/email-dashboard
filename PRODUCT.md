# Product: Veyra

Living roadmap doc — kept current as the idea evolves, not written once
and left stale. For *why* things happened or changed, see
`CHANGELOG.md`. For *how* things currently work, see `ARCHITECTURE.md`.

## Positioning

An insights/analytics dashboard for your email, not an inbox wrapper —
the inbox is a secondary view. Primary view is email volume per day per
category; the message list comes after that. Categories are
user-defined, with rules routing senders into them. Pitch: open source,
runs entirely locally, no cloud storage of email. Local, browser-run AI
summarization is a planned future direction, not built. Vision beyond
personal use: a place other people could trust with their inbox too.

## Feature status

| Feature | Status |
|---|---|
| Aggregation (fetch full mailbox via IMAP relay) | Built |
| Message reading (sandboxed HTML/text render) | Built |
| Insights graph (30-day daily bar chart) | Built |
| Top senders (ranked list, copy address) | Built |
| Credential vault (opt-in, passphrase-encrypted) | Built |
| Connect/unlock flow, landing page, navbar | Built |
| Categories (user-defined, sender routing rules) | Not built — see Roadmap |
| Local message caching | Not built — see Roadmap |
| AI insights (local, browser-run summarization) | Deferred — out of scope for now |
| Relay hosting (Azure) | Not started — local dev only |

Everything real-data-related currently runs against a single "All Mail"
placeholder category (`categoryId: 'all'`) rather than waiting on real
category storage.

## Roadmap / not yet decided

- **Categorization over plain IMAP.** No Gmail-labels-and-filters
  equivalent exists over IMAP; needs its own design (flags/keywords vs.
  folders vs. client-side-only), not a straight port. Blocks: category
  chips, `SettingsPanel`'s real content, `TopSenders`' "Assign category"
  action. UI spec for the chip row, overflow handling, and the merged
  category+date scoping row: `LAYOUT.md`.
- **Local message caching.** IMAP UIDs are unique only
  per-mailbox-per-account (unlike Gmail's global message IDs), so this
  needs a fresh schema, not a port of the old Dexie cache. More
  pressing now that every connect re-fetches the entire mailbox with no
  cache — not yet a problem in practice, worth revisiting if it becomes
  one.
- **Sharing `protocol.ts`** between `relay/` and `frontend/` via an npm
  workspace instead of hand-duplicating the types.
- **Relay deployment.** Azure App Service (Web Sockets=On, Always
  On=On, app-level keepalive against idle timeouts), custom domain,
  Terraform, CI/CD. `wss://` becomes mandatory at that point — the app
  password transits this connection. `frontend/` can likely stay a
  static site regardless. Proven locally only so far.
- **AI insights direction**, whenever it's picked back up:
  bring-your-own-API-key vs. a minimal stateless proxy.

## Brainstormed nice-to-haves (not scoped or prioritized)

- More analytics views: category share donut/pie, day-of-week/
  time-of-day heatmap, week-over-week trend callouts (pure stats, no
  AI), read/unread trend.
- Bulk actions on messages (archive/delete by rule) — IMAP supports
  this (`\Deleted` flag + `EXPUNGE`, `MOVE`), not wired up.
- Auto-categorization suggestions by sender domain, as a cheap
  heuristic starting point before manual rules — needs categorization
  design decided first.
- Color-coded categories, consistent across the graph and email list.
- Inbox stat tiles (unread count, emails today, busiest category).
- Lightweight streaks ("7-day inbox zero").