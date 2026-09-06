# frontend

Client-side email dashboard — React + TypeScript + Vite. No backend; Google
OAuth, Gmail API calls, and the local cache all run in the browser. See
`../AGENT.md` and `../PRODUCT.md` for the full architecture.

## Setup

```bash
npm install
cp .env.example .env   # fill in VITE_GOOGLE_CLIENT_ID
```

## Commands

```bash
npm run dev      # start the dev server
npm run build    # type-check (tsc -b) + production build
npm test         # run the Vitest suite
npm run lint     # oxlint
```
