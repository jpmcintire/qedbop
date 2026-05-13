# qed'bop Education Platform — Architecture

This document describes the planned teacher-facing platform layered on top of the existing qed'bop catalog. The current site (`README.md`) is a static, anonymous catalog of poems set to music. This architecture extends qed'bop into a web app where English teachers build and publish standards-aligned assignments around those musical settings.

The static catalog and the teacher platform are part of the same product but have different audiences and different runtime characteristics. Both must continue to work.

## What this is

A web app where English teachers build shareable assignment pages around musical settings of poems and literary passages. Teachers log in, pick a Work with one or more musical Versions (YouTube videos), the app calls the Claude API to generate a standards-aligned assignment, and the teacher publishes a public URL that students access on any device.

No student accounts. No student data. Ever.

## Non-negotiable principles

These constraints govern every design decision. They are the product's moat and its compliance posture.

1. **AI-resistance by construction.** Student-facing questions are deliberately general about the music ("identify a moment where the instrumentation changes unexpectedly and explain its interpretive effect"). They never reference specific timestamps or describe specific musical moments. The student must supply the specificity from their own listening. A generic LLM response cannot satisfy a well-formed question.
2. **Two-field music notes, strictly separated.** Each Version has `music_text_teacher_only` (timestamped specific observations) and `music_text_themes` (broader interpretive notes). Only `music_text_themes` is ever sent to the Claude API for student-facing content generation. `music_text_teacher_only` powers coaching podcasts and teacher-only materials — it is the proprietary content and never leaks to students or to the model in a student-facing context.
3. **Mandatory rubric dimension.** Every auto-generated rubric, regardless of assignment type, includes "Specificity of Musical Observation" as a scored dimension.
4. **Mandatory "find and describe" question.** Every assignment, regardless of type, includes at least one question that requires the student to identify a specific musical moment, describe what they heard, and explain its interpretive effect. This is the structural moat.
5. **No student data.** No student accounts, no collection of student info, no tracking of student activity, no storage of student work. Published pages are anonymous public URLs. This eliminates FERPA / COPPA obligations.
6. **Default clean, depth toggleable.** The default published page is minimal: poem, video(s), questions, prompt, brief background. Richer material — extended poet biography, historical context, genre sociology, cross-curricular connections, technical poetry analysis, creative response options — appears only when the teacher opts in.

## Entities

### Work

A poem, novel passage, speech, or dramatic monologue.

- `title`, `author`, `full_text`
- `type`: `poem` | `passage` | `speech` | `dramatic`
- `source_work` (for passages: parent novel or play)
- `publication_year`, `copyright_status`
- `grade_bands` (array), `themes` (array), `notes`
- Has many Versions

### Version

A single musical setting of a Work. Each Work has 1–10 Versions.

- `work_id` (FK)
- `label` (e.g., "Ranchera — Female Vocal")
- `youtube_id`, `youtube_status`: `public` | `unlisted`
- `duration_seconds`
- `music_description` (brief, for library browsing)
- `chorus_phrases` (which phrases were elevated to refrain and why)
- `vocal_character`
- `is_recommended` (boolean — part of the default recommended set?)
- `music_text_teacher_only` (LONG, timestamped — fuels podcasts and teacher materials; **never** sent to Claude for student content)
- `music_text_themes` (LONG, no timestamps, no specific moment descriptions — **this is what feeds Claude for student question generation**)
- Internal ratings (not shown to teachers): `music_text_depth` (1–5), `comparative_value` (1–5), `emotional_impact` (1–5), `accessibility` (1–5), `discussion_potential` (1–5)

### Teacher

Authenticated user who builds assignments.

- `name`, `email`, `password_hash`
- `school` (optional), `state`, `grade_levels` (array), `course_type`: `regular` | `honors` | `AP` | `college`
- `class_names` (array, optional)
- `subscription_status`, `subscription_expiry`
- Has many AssignmentPages

### AssignmentPage

A published assignment. The core product.

- `teacher_id` (FK)
- `version_ids` (array of FKs)
- `delivery_modality`: `in_class` | `homework` | `mixed`
- `assignment_type`: `compare_versions` | `single_analysis` | `multiple_poems` | `thematic` | `novel_poem` | `be_producer` | `whats_missing`
- `depth_toggles` (object — see "Depth model" below)
- `generated_curriculum` (JSON — questions, prompt, background, rubric, standards tags, vocabulary, etc.)
- `teacher_customizations` (any edits the teacher made)
- `url_slug` (unique)
- `teacher_display_name`, `class_display_name`
- `expires_at`, `published_at`
- `status`: `active` | `expired` | `archived`
- Scheduled follow-up email 7 days after `published_at`

### Standards

Flat text files of state ELA standards. **Not** a structured database. Stored as text organized by state + grade. Fed to Claude at runtime in the API prompt. Start with: CCSS (covers 41+ states), Texas TEKS, Virginia SOLs.

## Three experiences

### Teacher (authenticated)

- **Dashboard** — active pages with URLs / QR codes, archived pages, smart suggestions (post-MVP), "Create New" button, subscription status.
- **Library Browser** — search and filter Works by title, author, grade, genre, theme. Card view. Click into detail: full text, all Versions with descriptions, recommended set highlighted, play previews.
- **Lesson Builder** — select Versions → choose modality (in-class / homework / mixed) → choose assignment type → choose depth preset or individual toggles → Claude generates curriculum → teacher reviews and edits via chat → add name / class → set expiration → publish → receive URL + QR code.
- **Teacher-Only Materials** (per assignment) — coaching podcast audio, timestamped listening guide, in-class lesson flow, grading guidance, follow-up suggestions. Visible on dashboard. Never on the published page.
- **Portfolio** — auto-assembled from usage history. Every poem used, every assignment created. Grows over time. The retention engine.
- **Teacher Notes** — after using an assignment, the teacher can leave a brief note ("my students loved…"). Notes accumulate per-Work and are visible to all teachers browsing that Work.

### Student (anonymous, public)

A student visits a URL like `qedbop.com/dreams-42` and sees:

- Teacher name / class (if provided)
- Poem title and author
- Full poem text
- Brief background context (poet bio + historical context — default; deeper material only if the teacher toggled it on)
- Embedded YouTube video(s)
- Discussion questions
- Writing prompt
- Any toggled add-ons (see "Depth model")
- No login, no navigation, no chrome

Every published page includes a small instructional line near the discussion questions:

> Strong responses describe specific moments in the music. "The song felt sad" is not enough.

This line is both instructional (teaches engaged students what good looks like) and defensive (signals that vague AI-generated prose won't clear the bar).

### Admin (John + Dante only)

- CRUD for Works and Versions. This is where the music-text notes are entered — the proprietary content. The admin UI must make the split explicit: `music_text_teacher_only` (timestamped specifics, never shown to students or fed to Claude for student questions) and `music_text_themes` (broader interpretive notes, fed to Claude). Content creators must understand the split — specific observations go in `_teacher_only`, interpretive themes go in `_themes`.
- Internal pedagogical ratings per Version.
- Teacher notes moderation (light touch — flag inappropriate; rare).
- Standards text management.

## The Claude API call

One pattern. The Claude API call is the engine of the lesson builder.

**Inputs:**

- Teacher profile (state, grade, course type)
- Work `full_text`
- For each selected Version: `music_text_themes` only — **never** `music_text_teacher_only`
- Selected `delivery_modality`
- Selected `assignment_type`
- Active `depth_toggles`
- Relevant state standards text (pulled from flat files based on teacher's state + grade)
- Any teacher chat instructions ("make questions harder", "add a question about meter")

**Outputs (structured JSON):**

- Discussion questions (general about music, specific about text)
- Writing prompt with length / evidence requirements calibrated to grade
- Background information (poet bio, historical context, literary significance — extended only if the corresponding depth toggle is on)
- Vocabulary notes (if appropriate for grade level)
- Standards alignment tags
- Suggested rubric — **must** include "Specificity of Musical Observation" as a scored dimension (1 = vague mood-words, no specific moments cited; 5 = multiple precise moments with interpretive argument)
- Grading guidance (what strong vs. weak responses look like)
- Any toggled add-on sections (genre sociology, cross-curricular connections, etc.)

### Mandatory system prompt rules

These rules are hardcoded into the system prompt for every curriculum-generation call. They are non-negotiable.

1. **Never reveal timestamps or specific musical observations in student-facing prompts.** Do not say "At 1:20, the bass drops out." Do not say "the singer whispers the final line." The student must identify and describe specific musical moments themselves.
2. **Every assignment must include at least one "find and describe" question** that requires the student to identify a specific musical moment, describe what they heard, and explain its interpretive effect.
3. **Never reference the `music_text_teacher_only` field.** Only `music_text_themes` is available to you for student-facing content. If timestamped specifics appear in your context, do not surface them in discussion questions or writing prompts.
4. **"Specificity of Musical Observation" must appear as a rubric dimension** in every auto-generated rubric, regardless of assignment type.

### Scaffolded Listening (optional toggle)

For struggling students, younger grades, or differentiated classrooms, the teacher can toggle on "Scaffolded Listening Zones." When enabled, Claude adds gentle directional prompts that point students toward rough sections of the song without revealing specific moments: "Listen especially during the second verse and the closing instrumental section. Choose one moment from either and describe it." This meets the student partway without handing them the observation. The "find and describe" requirement remains — the student still supplies the specificity.

## Depth model

The published page is clean by default. Depth is opt-in.

### Default (always on)

- Poem text and author
- Embedded video(s)
- Discussion questions
- Writing prompt
- Brief poet bio + historical context (two paragraphs)
- Standards alignment (visible to teacher; on the page only if the teacher chooses)
- "Specificity" instructional line

### Toggleable add-ons

Each is an optional section Claude generates and adds to the published page when the teacher switches it on:

- **Extended poet biography** — deeper biographical context
- **Historical context** — the moment the poem emerged from
- **Genre sociology** — what the musical genre IS (e.g., Ranchera's roots in Mexican working-class culture, its tradition of melodramatic emotional expression, its relationship to colonialism and resistance). This is the most distinctive add-on; Claude can generate it reliably from its training data.
- **Cross-curricular connections** — history, sociology, music theory, language
- **Technical poetry analysis** — meter, form, sonic devices
- **Creative response options** — alternative outputs beyond a written essay
- **Scaffolded Listening Zones** (see above)

### Richness presets

Two presets that toggle clusters of add-ons in one click:

- **Quick Assignment** — clears all toggles. The overwhelmed pragmatist gets something usable for Tuesday.
- **Deep Dive** — enables extended biography, historical context, genre sociology, cross-curricular connections, technical poetry analysis, and creative response options. The craft-driven teacher building a two-week interdisciplinary unit gets a rich resource without toggling six switches individually.

Presets are starting points; the teacher can override any individual toggle after applying a preset. The data model stores the resulting `depth_toggles` object, not the preset name — the preset is a UI affordance, not a persisted state.

## Video

YouTube hosts everything. The platform stores `youtube_id` only, never video files.

- One Version per Work is set to **public** on YouTube (discovery / marketing channel).
- Additional Versions are **unlisted** (playable via embed, not findable in YouTube search).
- Published assignment pages embed videos using the standard YouTube iframe embed.
- Students watch directly on the assignment page. Never sent to YouTube.

## Coaching podcasts

Generated via NotebookLM (or equivalent) from: poem text + `music_text_teacher_only` notes + `music_text_themes` + pedagogical framework + grading guidance. Eight to fifteen minutes of conversational audio. Generated **once per Work**, not per assignment. Stored as audio files in cloud storage (S3 or Cloudflare R2). Linked to Work records. Teacher-only — never on published pages.

## Follow-up emails

Seven days after a teacher publishes an assignment, an automated email sends from Dante's email address. Template pulls: teacher first name, poem title, Version label(s), one discussion question from the generated curriculum. Replies go to Dante's actual inbox. Simple scheduled job, not complex infrastructure.

## Tech stack (suggestion)

These are recommendations, not commitments. Final calls on auth provider and ORM live with Dante.

- **Framework:** Next.js (current scaffold) — alternatives: SvelteKit, Remix
- **Database:** PostgreSQL — Railway built-in, Supabase, or Neon
- **Auth:** Clerk, Auth.js, or Supabase Auth (email / password + Google SSO)
- **Payments:** Stripe (subscriptions) — not needed for MVP, pilot is free
- **AI:** Anthropic Claude API. Use the latest Sonnet model at integration time.
- **Podcasts:** NotebookLM or equivalent; audio stored in Cloudflare R2 or S3
- **Email:** Postmark, SendGrid, or Resend
- **Hosting:** Railway (current target), Render, or Vercel
- **QR codes:** server-side library (`qrcode` npm package or similar)

## MVP scope

Build these first:

1. Teacher auth (email + Google)
2. Teacher profile (name, state, grade, course type)
3. Content library browser (admin pre-populates Works + Versions)
4. Lesson builder (modality selection, assignment type selection, depth toggles + Quick / Deep Dive presets, Claude API integration, chat refinement)
5. Published assignment page renderer (clean, mobile-responsive, embedded YouTube)
6. URL + QR code generation
7. Basic dashboard (active pages, create new)
8. Admin content entry (Works, Versions with separate `music_text_teacher_only` and `music_text_themes` fields)

### Deferred (post-pilot)

Payments, podcasts, portfolio, teacher notes / community, individual add-on toggles beyond what's needed to demonstrate the depth model, smart suggestions, follow-up emails.

The four mandatory system-prompt rules and the default-clean / Deep-Dive distinction ship in MVP. Everything else can wait.

## Pricing (post-MVP)

- **Free:** 3–5 Works, 1 active page
- **Individual:** $129 / year or $14 / month — full library, unlimited pages
- **School:** $1,500–3,000 / year (Phase 2)
- **District:** $2,000–8,000+ / year (Phase 3)

Pages stay live up to nine months, even past a subscription lapse.

## Open decisions

These need a call before implementation begins:

- **Auth provider** — Clerk vs. Auth.js vs. Supabase Auth. Clerk is fastest; Auth.js keeps us framework-agnostic; Supabase bundles auth with the DB.
- **ORM / DB access** — Prisma vs. Drizzle vs. raw SQL via a Postgres client. Prisma is the default for Next.js; Drizzle is leaner and works better with edge runtimes.
- **Where the static catalog and the platform diverge** — does the existing `/poems/[slug]` static catalog stay as a marketing surface, or does it get absorbed into the authenticated app? Recommendation: keep the static catalog as the public marketing front; the platform lives behind `/app` or a subdomain.
- **Standards storage format** — plain `.txt` per state-grade vs. structured Markdown with light frontmatter. Plain text is simpler; Markdown lets us tag standards by skill area later.
- **Slug strategy for `AssignmentPage.url_slug`** — short random (e.g., `dreams-42`) vs. human-readable. Random is harder to guess and shorter to share.
