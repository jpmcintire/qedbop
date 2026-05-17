# qed'bop

A working catalog of public-domain poems set to music. The poem comes first; the music serves the literature.

## Brand

The name is **always written `qed'bop`** — lowercase, with a typographic apostrophe between the two halves. Never capitalize it. The lowercase form is load-bearing: `q`/`b` and `d`/`p` are visual mirrors, so `qed'bop` reads as a graphic palindrome around the apostrophe.

## Current state

This repo is intentionally minimal. A single-page Next.js scaffold serving the wordmark and tagline, deployed at qedbop.com via Railway. The platform work (teacher accounts, AI-generated assignments, admin tooling) lives in feature branches on GitHub — not on main, not in production — until we rebuild it with a cleaner deployment strategy.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Preserved on GitHub

The full platform code (5-entity Postgres data model, Auth.js teacher accounts, Claude API integration with the four mandatory system prompt rules, admin CRUD for the two-field music-notes split, published assignment renderer, QR code generation) lives in:

- Branch `claude/qedbop-platform-architecture-2pEXG` (PRs #2 and the cumulative platform)
- Plus PRs #3 through #9 documenting deployment fixes

Recoverable at any time by checking out those branches or cherry-picking commits.
