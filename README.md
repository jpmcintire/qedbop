# QED'Bop

A catalog of public-domain poems set to music. The poem comes first.

## Stack

- Next.js 15 (App Router) with React 19
- Tailwind CSS for styling, design tokens for the typographic system
- Markdown content in `content/poems/`, parsed at build time via `gray-matter` + `remark`
- Deployed on Vercel; domain `qedbop.com`

No CMS, no database, no auth. Each poem is a markdown file. The site is statically generated.

## Getting started


```bash
npm install
npm run dev
```



Then open http://localhost:3000.

## Project layout


```
app/
  layout.tsx              # site-wide chrome (header, footer, fonts)
  page.tsx                # homepage with poem list
  globals.css             # design tokens + typographic system
  poems/
    page.tsx              # catalog index
    [slug]/page.tsx       # per-poem template (the load-bearing page)
  about/page.tsx
  not-found.tsx
components/
  AudioBlock.tsx          # restrained play button + distribution links + YouTube embed
content/
  poems/                  # one markdown file per poem (frontmatter + prose body)
lib/
  poems.ts                # markdown loader + stanza splitter
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
- Wordmark is serif, not a logo

## Roadmap

- [x] Scaffold + first poem template (Stopping by Woods)
- [ ] 4 more MVP poems
- [ ] Sitemap + robots.txt
- [ ] JSON-LD enrichment (MusicRecording links)
- [ ] Citation tools (MLA / APA / Chicago)
- [ ] Embed-for-LMS code
- [ ] Lesson plan / classroom resources (paywall, post-MVP)
