# CLAUDE.md

Durable context for Claude sessions working on qed'bop. Loaded automatically by Claude Code / agents. Read this first.

---

## What qed'bop is

A web app where teachers build shareable assignment pages around poems set to music. A teacher picks a public-domain poem, picks one or more YouTube settings of it, chooses an audience level, optionally asks Claude to generate discussion questions, edits them, and gets a URL to share with students. Students open the URL and see the poem, the videos, and the questions — no login, no chrome, no tracking. There's also a teacher-edition URL at `/t/[slug]?...` that shows the same poem plus a class agenda, poet bio, historical context, per-question teaching commentary, and a chat panel where the teacher can ask Claude follow-up questions about any of it.

The product's moat is AI-resistance: discussion questions are deliberately general about the music ("identify a moment where the instrumentation changes unexpectedly and explain its interpretive effect"), never specific. Students must supply the specificity from their own listening. This is enforced in the system prompts (see the four mandatory rules below).

The full original architecture (teacher accounts, Postgres, admin UI, payments) lives in feature branches and PRs #2 through #9 — not on main. Current main is intentionally a lite MVP that proves the core loop without the surface area that bit us during the first deploy attempt.

---

## Brand rules (non-negotiable)

- The name is **always** written `qed'bop` — lowercase, with a typographic apostrophe (U+2019) between the two halves. Never capitalize it — not at the start of a sentence, not anywhere. The lowercase form is load-bearing: `q`/`b` and `d`/`p` are visual mirrors, so `qed'bop` reads as a graphic palindrome around the apostrophe. Capitalizing destroys the mirror.
- In JSX content: `qed&rsquo;bop`. In plain text / metadata / URLs / commit messages: straight apostrophe `qed'bop` is fine.
- Don't add emojis to the app, to commit messages, to docs, unless the user explicitly asks.

---

## Stack

- **Next.js 15** (App Router) + **React 19** — `app/` directory routing
- **TypeScript**, strict mode
- **Anthropic SDK** for Claude API calls (`@anthropic-ai/sdk`)
- **zod** for response validation
- **No database**. URL parameters carry all assignment state.
- **No tailwind**. Styling is a small `app/globals.css` (CSS variables, `.btn`, `.chrome`, `.poem`, `.wordmark`, `.hairline`, `.page`) plus inline styles for component-specific layout.
- **No auth, no payments, no email.** Anonymous from the student's side; teachers operate without accounts.

**Deployed on Railway.** DNS managed at Cloudflare in DNS-only (gray cloud) mode. Domain `qedbop.com`. Postgres is attached to the Railway project from an earlier deploy attempt but is NOT used by current code. Don't add database usage without explicit user sign-off — that was the source of the deployment saga that led to the lite MVP.

---

## The four mandatory rules (AI-generated content)

Encoded in the system prompts in `lib/generate-questions.ts`, `lib/generate-teacher-edition.ts`, and `lib/teacher-ask.ts`. Never weaken them.

1. **No timestamps, no invented specific musical moments.** Don't write "at 1:20 the bass drops out" or "the singer whispers the final line." Questions about music must be GENERAL ("identify a moment where the instrumentation changes unexpectedly and explain its interpretive effect"). Students supply specificity from their own listening — that's the proof of engagement.
2. **Every assignment includes at least one "find and describe" question.** Requires the student to identify a specific musical moment, describe what they heard, explain its interpretive effect. This is the structural moat.
3. **Engage poem-and-music interaction**, not poem alone.
4. **Strict JSON output from generators**, no prose / fences.

Audience-calibrated guidance for each level is in `AUDIENCE_GUIDANCE` (generate-questions.ts) and `AUDIENCE_HINT` (generate-topics.ts). Middle school → concrete & accessible; post-graduate → theoretical & rigorous.

---

## File layout

```
app/
  page.tsx                # the builder. ~570 lines, state + composition
  layout.tsx              # minimal root layout
  globals.css             # typography variables, .btn, .chrome, .poem, etc.
  actions.ts              # 'use server' actions: fetchTopicOptions,
                          # fetchQuestions, fetchSingleQuestion,
                          # fetchTeacherEdition, fetchTeacherAsk
  _components/            # reusable presentational components
    Step.tsx              # numbered section wrapper
    ModeToggle.tsx        # Basic / Custom pill toggle
    UrlBlock.tsx          # URL card with Copy/Open buttons
    VersionPicker.tsx     # grid of version cards with inline YouTube
    TopicPicker.tsx       # AI topic checkboxes + "Other" custom input
    LengthPicker.tsx      # response length checkboxes
    QuestionEditor.tsx    # editable question list + custom-question generator
    BasicGenerate.tsx     # Basic mode's one-button output
    index.ts              # barrel
  a/[slug]/page.tsx       # public student viewer — reads URL params, renders
                          # poem + videos + questions + expiration check
  t/[slug]/
    page.tsx              # teacher edition viewer — same params as /a/ plus
                          # AI-generated agenda, bio, context, commentary
                          # (Suspense-streamed in two boundaries)
    TeacherAsk.tsx        # client chat component at the bottom of /t/
lib/
  poems.ts                # POEMS data + AUDIENCES + LENGTHS_BY_AUDIENCE +
                          # DEFAULT_LENGTH_BY_AUDIENCE + helpers
  expiration.ts           # date helpers: todayIso, defaultExpirationIso,
                          # maxExpirationIso, isExpired, formatExpirationFriendly
  generate-questions.ts   # main question generator + single-question generator
                          # Claude Opus 4.7 calls with the four rules baked in
  generate-topics.ts      # audience-calibrated topic-option suggester
  generate-teacher-edition.ts  # one call returns poetBio + historicalContext +
                               # classAgenda + per-question commentary
  teacher-ask.ts          # chat handler for /t page Q&A
```

---

## URL conventions

### Student viewer — `/a/[slug]?...`

Params (all optional except `v`):
- `v` (repeatable) — YouTube IDs of selected versions
- `audience` — `middle-school` | `high-school` | `college` | `post-graduate`
- `len` (repeatable) — length values (`sentence`, `short-paragraph`, `paragraph`, `short-essay`, `essay`, `long-essay`, `research-paper`)
- `q` (repeatable) — full question text strings (URL-encoded). Bare integers (legacy from before editable questions) are filtered out.
- `exp` — expiration date as `YYYY-MM-DD`. Past = "expired" page.

Example: `/a/recuerdo?v=lAd2Ct6Y1BQ&v=C7PGMBtRV-o&audience=college&len=short-essay&q=Question%201&q=Question%202&exp=2026-12-31`

### Teacher edition — `/t/[slug]?...`

Reads the SAME params as `/a/`. The student URL and the teacher URL are twins — same data, different rendering. AI-generated supplements (agenda, bio, context, commentary) come from `lib/generate-teacher-edition.ts`. Cached 7 days per (slug, audience, versionCount, full question list).

### Builder — `/`

When the page loads with URL params, the builder restores state from them so a teacher can paste their editable URL and resume.

Params accepted by the builder for state restoration:
- `mode` — `basic` | `custom` (defaults to `custom`)
- `slug` — currently selected poem
- `v`, `audience`, `len`, `q`, `exp` — same as the viewers

Teachers always get two output URLs in Custom mode (`Share with students` → `/a/...`, `Teacher edition` → `/t/...`, `Your editable URL` → `/?mode=...&slug=...&...`). In Basic mode they get the share URL + teacher URL but no separate editable URL (the page reload from the share URL is enough).

---

## Modes

### Basic mode

- Steps: pick poem, pick versions, click "Get student URL".
- Audience is **locked to middle school** — Step 3 is hidden entirely. The mode description explicitly says "calibrated for middle school students."
- Question count: 3. Length: paragraph. Topics: none. Editing: none.
- Switching Custom → Basic forces `audience = 'middle-school'`.

### Custom mode

- Full 9-step flow:
  1. Pick a poem (dropdown)
  2. Pick versions (grid with inline videos)
  3. Audience (dropdown — middle / high / college / post-grad)
  4. Topics (AI-generated checkboxes + Other custom input)
  5. Length (audience-calibrated checkboxes, multi-select)
  6. Question count (1–5)
  7. Generate questions
  8. Edit + Add custom question
  9. Expiration (date input, max 30 days)

---

## Caching

`unstable_cache` from `next/cache` wraps each Claude generator. 7-day TTL. Cache keys include all inputs that affect the output.

- `generate-questions-v3` key: `(slug, audience, count, ...versionLabels, ...topics, ...lengths)`
- `generate-topics-v1` key: `(slug, audience)`
- `teacher-edition-v1` key: `(slug, audience, versionCount, ...questions)`
- `generate-single-question` and `teacher-ask` are NOT cached (each call is unique).

Identical URLs → identical responses, served instantly. Changing any input → new cache key → new Claude call.

---

## Important constraints to honor

- **No middleware.** `middleware.ts` does not exist in the project. The earlier saga (PRs #4-#9) involved Next.js / Auth.js / Railway middleware caching producing redirect loops that took hours to track down. The lite MVP works without middleware because pages are public; if auth ever returns, design carefully.
- **No database, no Prisma.** All assignment state rides in URL params. Adding a database means URLs can shorten dramatically (~30 chars instead of ~1500), but the user has explicitly opted to keep things stateless for now. Don't add DB without explicit instruction.
- **No Tailwind, no PostCSS.** Style with inline + `globals.css`. Adding a styling library is a non-trivial decision that requires the user's input.
- **Always use feature branches + PRs.** The user merges manually via GitHub UI. Branch naming: `claude/<short-kebab-description>`. Never push to main directly (Railway watches main and will deploy any push). All work goes through PRs.

---

## Operational facts

- **Anthropic API key** lives in Railway env as `ANTHROPIC_API_KEY`. Set during the original platform attempt.
- **Model**: `claude-opus-4-7` (hardcoded in each generator). When updating, change all three generators consistently.
- **Cost** (approximate, Opus 4.7):
  - Topic options call: ~$0.01
  - Question set generation (1-5 questions, with topics and lengths): ~$0.03-0.06
  - Single custom question: ~$0.01-0.02
  - Teacher edition (one big call returns four sections): ~$0.04-0.08
  - Teacher Q&A turn: ~$0.01-0.03
  - Student visits: **$0** (URL contains everything, no AI calls on viewer)
- **DNS**: `qedbop.com` → CNAME → `qedbop-production.up.railway.app` (via Cloudflare, gray cloud / DNS-only mode). Cloudflare is just hosting DNS records, not proxying.

---

## Adding content (poems)

Edit `lib/poems.ts`. Each poem is:

```ts
{
  slug: 'kebab-case-slug',
  title: 'Title',
  author: 'Author Name',
  year: 1923,
  text: `Full poem text with
line breaks preserved.

Blank lines separate stanzas.`,
  versions: [
    {
      label: 'Version 1',
      youtubeId: 'XXXXXXXXXXX',
      // All optional. Objective metadata is safe to feed Claude anywhere.
      durationSeconds: 285,
      genre: 'Folk acoustic',
      vocalCharacter: 'Solo male tenor, plainspoken',
      artist: 'Artist Name',
      recordingYear: 2019,
      // Interpretive themes — NO timestamps, NO specific moment descriptions.
      // Used by question generator (student-facing) AND teacher generators.
      themes: 'Broader notes about what the music argues about the poem...',
      // Teacher-only annotations — MAY contain timestamps and specific moments.
      // Used ONLY by teacher-edition generator and teacher Q&A chat.
      // NEVER used by question generator (student-facing).
      teacherNotes: '0:42 — instrumental shift on "promises to keep"\n2:15 — vocal pulls back to a whisper',
    },
  ],
  questions: [
    'Starter question 1 (used as fallback if AI generation fails).',
    // 6-10 starter questions total
  ],
}
```

No build step, no schema migration. Just save and commit.

**Two-field music-notes split is non-negotiable.** `themes` is interpretive (no specific moments); `teacherNotes` is specific (may include timestamps). The product's AI-resistance moat depends on `teacherNotes` NEVER reaching student-facing content. This is enforced two ways:
1. The `versionPromptBlock(v, mode)` helper in `lib/poems.ts` takes `mode: 'safe' | 'full'` — only `'full'` includes `teacherNotes`.
2. `lib/generate-questions.ts` (student content) calls with `'safe'`; `lib/generate-teacher-edition.ts` and `lib/teacher-ask.ts` (teacher content) call with `'full'`.
Don't break this split. If a new generator needs version context, decide explicitly which mode it gets.

---

## Common asks and where to make changes

| Ask | Where to change |
| --- | --- |
| Add a new audience level | `AUDIENCES`, `LENGTHS_BY_AUDIENCE`, `DEFAULT_LENGTH_BY_AUDIENCE` in `lib/poems.ts`; `AUDIENCE_GUIDANCE` in `lib/generate-questions.ts`; `AUDIENCE_HINT` in `lib/generate-topics.ts`; `AUDIENCE_LABEL` in `lib/teacher-ask.ts` and `lib/generate-teacher-edition.ts` |
| Add a length option | `LENGTHS_BY_AUDIENCE` in `lib/poems.ts` |
| Tune the question-generation prompt | `lib/generate-questions.ts` `SYSTEM_PROMPT` |
| Tune the teacher chat behavior | `lib/teacher-ask.ts` `buildSystemPrompt` |
| Add a new builder step | Wrap content in `<Step n={...} title="..."> ... </Step>` and renumber subsequent steps |
| Change the Basic mode default count or length | `handleBasicGenerate` in `app/page.tsx` |
| Change cache TTL | Each generator's `unstable_cache` call (the `revalidate` field) |
| Change max question count | `maxQuestions` in `app/page.tsx` |
| Change max expiration days | `maxExpirationIso` in `lib/expiration.ts` |

---

## How to extend safely

When adding a new feature:

1. Branch off main: `git checkout -b claude/<description>`
2. Make changes
3. Push: `git push -u origin claude/<description>`
4. Open a PR with a clear description
5. Wait for the user to merge

Don't:
- Push to main
- Bypass git hooks
- Add dependencies without explicit ask
- Introduce a database without explicit ask
- Add middleware without explicit ask
- Capitalize qed'bop anywhere

Do:
- Keep PRs focused (one feature per PR)
- Write PR descriptions that explain WHAT and WHY
- Honor the four mandatory AI rules
- Use the existing primitives (`Step`, `UrlBlock`, etc.) when adding builder UI
- Preserve URL state-loading for any new URL param (so editable URLs roundtrip)

---

## What's preserved from the earlier platform attempt

Feature branches with the full original architecture (auth, Postgres, admin tooling, the two-field music notes split, the four rules baked into a much larger codebase):

- `claude/qedbop-platform-architecture-2pEXG` — the full MVP code from PR #2
- `claude/fix-ts-expect-error-build`, `claude/fix-auth-redirect-loop`, `claude/disable-middleware`, `claude/force-fresh-build`, `claude/explicit-noop-middleware`, `claude/force-clean-build`, `claude/distdir-bypass-cache` — the deployment-debugging chain (PRs #3-#9)

If the user ever wants real teacher accounts, multi-tenant data, admin UI for content, or the full original spec from `ARCHITECTURE.md` (also on those branches), recover any of it by checking out the branch and cherry-picking. Don't try to merge the whole thing wholesale onto current main — the lite MVP has diverged enough that conflicts would be painful. Cherry-pick what's wanted.
