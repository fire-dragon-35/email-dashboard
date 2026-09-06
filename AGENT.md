# Agent notes: Veyra

Working conventions for this repo. Read before making changes.

## What this is

Veyra: a personal dashboard aggregating and sorting inboxes over IMAP. A
relay server (`relay/`) speaks real IMAP to the user's provider; the
browser talks JSON-over-WebSocket to the relay, never raw IMAP. Current
status and roadmap: `PRODUCT.md`. Design system: `DESIGN.md`.
Design decisions and their history: `CHANGELOG.md`. Module-by-module
reference: `ARCHITECTURE.md`.

## Layout

```
frontend/       React + TypeScript (Vite). Browser UI.
relay/          Node + TypeScript. WebSocket↔IMAP relay server.
tools/          Standalone Python scripts for deployment/ops.
                Log through utility.ToolLogger.
utility/        Cross-cutting Python helpers. Single source of truth —
                extend, don't re-implement.
tests/          pytest suite (Python side). Frontend/relay tests live
                alongside their source.
```

## Core principles

- **Clean, efficient, maintainable over clever.** Optimize for the next
  reader.
- **OOP preferred.** Anything with behavior + state is a class. Free
  functions are fine for small, stateless helpers only.
- **No overlapping functionality.** Check `utility/` or the relevant
  `frontend/src/` module before adding a helper. One canonical place per
  concern.
- **Tests are written alongside the code**, not batched at the end.
  Every new Python module gets a matching test; every new frontend
  module gets a colocated `.test.ts`/`.test.tsx`.
- **Delete dead direction, don't accumulate it.** When a decision
  supersedes existing code, the old code is removed in the same pass.
  Git history is the archive, not the repo.
- **A load-bearing fix gets a comment where it lives, not just a
  changelog entry.** If removing something would look like safe
  cleanup but isn't (a timeout that guards a hanging promise, a
  deferred activation that avoids a race), say so in a comment next to
  the code, e.g. `// DO NOT REMOVE: see CHANGELOG.md 2026-09-05, this
  guards against an unresolved clipboard permission prompt hanging
  forever.` A changelog nobody re-reads doesn't stop a future cleanup
  pass from deleting it.

## Before you touch code

1. Regenerate the architecture graph: `npm run graph` (repo root). Read
   `docs/architecture.json`/`.svg` for the current module shape — don't
   rely on memory of the repo from earlier in the session.
2. Touching more than ~3 files: state the file list and what you will
   *not* change, before writing anything.

## Before you say you're done

```
npm run lint          # oxlint: file/function size, complexity, forbidden imports
npm run lint:css      # stylelint: raw colors/px banned outside tokens.css
npm run graph:check   # dependency-cruiser: layering, circularity, orphans
npm test              # Vitest (frontend + relay)
.venv/bin/python -m pytest   # Python side — also runs ruff + vulture, see below
```

Fix what they report; don't just report the count. If a rule is wrong
for a specific case, say so and propose the override — don't route
around it silently.

## Two hard splits

- "Add/change behavior" and "clean up existing code" are never the same
  commit. If cleanup is needed to do the feature cleanly, do the
  cleanup first, as its own commit.
- "Make a pass for quality" is not a task. Name the specific target (a
  file, a duplicated pattern, a metric from `npm run lint`) before
  starting.

## Logging (Python side)

Both loggers live in `utility/logger.py` — the only place responsible
for logging/console setup. Never call `logging.getLogger`, create a
`rich.Console`, or configure handlers anywhere else.

- `AppLogger` — static factory over stdlib `logging`, `RichHandler`,
  configured once. Currently unused but is the foundation `ToolLogger`
  builds on.
- `ToolLogger` — for scripts under `tools/`. Prefixes lines with
  `[tool-<name>]`, deterministic per-name color.

```python
from utility import ToolLogger
log = ToolLogger.get("sync-inbox")
log.info("Fetched %d messages", 42)
```

## Python tooling (deployment/ops only)

- Install: `.venv/bin/pip install -e ".[dev]"`
- Tests: `.venv/bin/python -m pytest` (`pythonpath = ["."]`, config in
  `pyproject.toml`)
- `ruff check .` (E,F,I,UP,B,SIM; line-length 100; py312) and
  `vulture tools utility` (`min_confidence = 80`) both run inside
  `tests/test_repo_health.py`, so `pytest` alone catches lint/dead-code
  regressions too — no separate command to remember.

## Commands

- `relay/`: `npm run dev`, `npm run build`, `npm run start`, `npm test`
- `frontend/`: `npm run dev`, `npm run build`, `npm test`, `npm run lint`