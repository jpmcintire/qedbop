# qed'bop

A working catalog of public-domain poems set to music. The poem comes first; the music serves the literature.

## What this is (super-lite MVP)

A two-page Next.js app:

- **`/`** — pick a poem, pick two of its musical versions, get a shareable URL.
- **`/a/[slug]?v=ID1&v=ID2`** — anonymous viewer page. Shows the poem text and the two embedded YouTube videos. No login, no account, just the assignment.

No database. No authentication. The poem data lives in `lib/poems.ts` and the two video IDs are encoded in the URL itself, which makes every link self-contained.

## Brand

The name is **always written `qed'bop`** — lowercase, with a typographic apostrophe between the two halves. The lowercase form is load-bearing: `q`/`b` and `d`/`p` are visual mirrors, so `qed'bop` reads as a graphic palindrome around the apostrophe.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Adding poems and versions

Edit `lib/poems.ts`. Each poem has a `slug`, `title`, `author`, `year`, the full `text`, and a `versions` array (each with `label` and `youtubeId`).

```ts
{
  slug: 'richard-cory',
  title: 'Richard Cory',
  author: 'Edwin Arlington Robinson',
  year: 1897,
  text: `Whenever Richard Cory went down town, ...`,
  versions: [
    { label: 'Folk', youtubeId: 'xxxxxxxxxxx' },
    { label: 'Ranchera', youtubeId: 'yyyyyyyyyyy' },
  ],
}
```

No build step or schema migration — just save the file. Next dev reloads automatically.

## Preserved earlier work

The full teacher-platform attempt (Auth.js accounts, Postgres data model, Claude API generated assignments, admin tooling, the two-field music notes split, the four mandatory system-prompt rules) lives on feature branches:

- `claude/qedbop-platform-architecture-2pEXG` — full MVP code and `ARCHITECTURE.md`
- PRs #2 through #10 on GitHub

Recoverable any time by checking out those branches.
