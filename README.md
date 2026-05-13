# qed'bop

A catalog of public-domain poems set to music. The poem comes first.

## Brand

The name is **always written `qed'bop`** — lowercase, with a typographic apostrophe between the two halves. Never capitalize it (no `QED'Bop`, no `Qed'bop`, not even at the start of a sentence). The lowercase form is load-bearing: `q`/`b` and `d`/`p` are visual mirrors, so `qed'bop` reads as a graphic palindrome around the apostrophe. Capitalizing destroys the mirror. In code: `qed&rsquo;bop` in JSX content; `qed'bop` (straight apostrophe) is acceptable in metadata strings, plain text, and URLs.

## Two products in one repo

This repo now contains two surfaces that share branding, fonts, and design tokens:

1. **Static catalog** (this README) — anonymous, markdown-driven, statically generated. Lives at `/`, `/poems`, `/about`.
2. **Teacher platform** — authenticated, Postgres-backed, generates standards-aligned assignments via the Claude API. Lives at `/app`, `/admin`, `/auth`, and serves published student pages at `/a/[slug]`. See **`ARCHITECTURE.md`** for the spec and **`SETUP.md`** for how to run it locally.

The catalog is the public face. The platform is the product.

## Stack

- Next.js 15 (App Router) with React 19
- Tailwind CSS for styling, design tokens for the typographic system
- Markdown content in `content/poems/`, parsed at build time via `gray-matter` + `remark` (static catalog)
- Postgres + Prisma + Auth.js + Anthropic Claude API (teacher platform)
- Deployed on Railway; domain `qedbop.com`

## Getting started


```bash
npm install
npm run dev
```



Then open http://localhost:3000.

## Project layout


```
app/
  layout.tsx              # minimal root (just html/body + font preconnect)
  globals.css             # design tokens + typographic system
  (catalog)/              # static catalog (route group, no URL prefix)
    layout.tsx            # wordmark header + footer
    page.tsx              # homepage
    about/page.tsx
    poems/page.tsx        # catalog index
    poems/[slug]/page.tsx # per-poem template
  auth/                   # /auth/signin, /auth/signup
  app/                    # authenticated teacher platform (/app/dashboard, /library, /build, /profile, /published)
  admin/                  # admin CRUD (/admin/works)
  a/[slug]/page.tsx       # published student assignment page
  api/                    # NextAuth, signup, profile, generate, publish, QR, admin
  not-found.tsx
components/
  AudioBlock.tsx          # restrained play button + distribution links + YouTube embed (catalog)
  AssignmentRenderer.tsx  # student-facing renderer for /a/[slug]
  Providers.tsx           # SessionProvider wrapper
content/
  poems/                  # one markdown file per poem (frontmatter + prose body)
  standards/              # plain-text ELA standards by framework + grade band
lib/
  poems.ts                # markdown loader + stanza splitter (catalog)
  prisma.ts auth.ts auth.config.ts auth-handler.ts
  claude.ts schemas.ts slug.ts standards.ts
prisma/
  schema.prisma           # 5 entities + Auth.js tables
  seed.ts                 # seeds Frost + one Version
```


## Adding a poem

1. Create `content/poems/<kebab-case-slug>.md`.
2. Fill in frontmatter (see `stopping-by-woods-on-a-snowy-evening.md` for the canonical example).
3. Write prose body: about the poet, historical context, reading, form, themes.
4. The page is automatically generated at `/poems/<slug>` on next build.

### Frontmatter fields

| Field | Required | Notes |
| --- | --- | --- |
| `title` | yes | Poem title |
| `poet` | yes | Author name |
| `year` | yes | Year published |
| `slug` | yes | URL slug, kebab-case |
| `oneLineSummary` | no | Shows under title and in catalog |
| `poem` | yes | Full poem text. Use YAML literal block (`\|`). Blank lines separate stanzas. |
| `youtube` | no | YouTube URL (any standard form) |
| `spotify` | no | Spotify track URL |
| `appleMusic` | no | Apple Music track URL |
| `sunoAudio` | no | Direct audio URL (mp3 etc.) |
| `musicalSetting` | no | Note on the genre choice |
| `themes` | no | Array of strings |
| `related` | no | Array of slugs |

The markdown body below the frontmatter renders as the *Context* section.

## Aesthetic guardrails

- Serif body for poem text (Source Serif 4), 19px / 1.85 line-height
- Sans-serif chrome (Inter) for nav, metadata, section labels
- Mostly monochrome: cream paper, dark ink, hairline rules
- No decorative imagery on the poem itself
- Audio embed is restrained — not styled as a Spotify module
- Wordmark is serif, not a logo, and always lowercase (see Brand above)

## Roadmap

- [x] Scaffold + first poem template (Stopping by Woods)
- [ ] 4 more MVP poems
- [ ] Sitemap + robots.txt
- [ ] JSON-LD enrichment (MusicRecording links)
- [ ] Citation tools (MLA / APA / Chicago)
- [ ] Embed-for-LMS code
- [ ] Lesson plan / classroom resources (paywall, post-MVP)
