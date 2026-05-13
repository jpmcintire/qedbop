# qed'bop platform — local setup

These steps get the authenticated teacher platform running locally. The existing static catalog (`/`, `/poems`, `/about`) works without any of this; only the `/app`, `/admin`, `/a/[slug]`, and `/auth` routes need the env below.

## 1. Install dependencies

```bash
npm install
```

## 2. Configure environment

```bash
cp .env.example .env.local
```

Fill in at minimum:

- `DATABASE_URL` — a Postgres connection string. Locally, `postgresql://postgres:postgres@localhost:5432/qedbop` after `createdb qedbop`. On Railway, attach a Postgres plugin and the var appears automatically.
- `AUTH_SECRET` — `openssl rand -base64 32`
- `ANTHROPIC_API_KEY` — from console.anthropic.com
- `ADMIN_EMAILS` — comma-separated list of emails that should get the ADMIN role on first sign-in (e.g. `john@example.com,dante@example.com`)
- `NEXT_PUBLIC_SITE_URL` — `http://localhost:3000` for dev

Optional:

- `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` — for Google sign-in. Without these, only email/password sign-in is available.
- `ANTHROPIC_MODEL` — override the default Sonnet model.

## 3. Push the database schema

```bash
npm run db:push
```

This applies `prisma/schema.prisma` directly to the database. For production migrations use `npm run db:migrate` instead.

## 4. Seed sample data

```bash
npm run db:seed
```

Inserts one Work (Frost's "Stopping by Woods on a Snowy Evening") with one Version so the lesson builder has something to point at.

## 5. Run

```bash
npm run dev
```

Open http://localhost:3000.

## 6. First admin

1. Visit `/auth/signup` and create an account using one of the emails listed in `ADMIN_EMAILS`. The signup endpoint auto-promotes those emails to ADMIN.
2. After signing in, navigate to `/admin/works` to add more Works and Versions.

## Routes overview

- `/` — static catalog (existing)
- `/poems`, `/poems/[slug]`, `/about` — static catalog (existing)
- `/auth/signin`, `/auth/signup` — auth
- `/app/dashboard` — teacher dashboard
- `/app/library`, `/app/library/[id]` — browse Works
- `/app/build` — lesson builder
- `/app/profile` — teacher profile
- `/app/published/[slug]` — post-publish "share this URL" screen
- `/admin/works`, `/admin/works/new`, `/admin/works/[id]` — admin CRUD
- `/a/[slug]` — **the published assignment page students see**. Anonymous, no login.
- `/api/auth/[...nextauth]` — NextAuth handlers
- `/api/signup`, `/api/profile`, `/api/generate`, `/api/publish` — platform APIs
- `/api/qr/[slug]` — PNG QR code for a published page
- `/api/admin/works`, `/api/admin/works/[id]`, `/api/admin/versions`, `/api/admin/versions/[id]` — admin APIs

## What the brief calls "mandatory" — where it lives

| Rule | Enforcement |
| --- | --- |
| Never reveal timestamps or specific musical moments in student-facing text | `lib/claude.ts` (SYSTEM_PROMPT rule 1) + `lib/schemas.ts` (`validateCurriculumRules`, regex check at the boundary) |
| Every assignment must include a "find and describe" question | `lib/claude.ts` (SYSTEM_PROMPT rule 2) + `lib/schemas.ts` (post-generation count check) |
| `musicTextTeacherOnly` is never sent to Claude for student content | `lib/claude.ts` (`stripVersionForPrompt` + defensive substring assertion before the API call) |
| Rubric must include "Specificity of Musical Observation" | `lib/claude.ts` (SYSTEM_PROMPT rule 4) + `lib/schemas.ts` (post-generation name check) |
| No student data | No student auth, no analytics on `/a/[slug]`, page rendered server-side with `revalidate: 60` |

If validation fails, `generateCurriculum` retries once. Two consecutive failures bubble up to the teacher as a generation error in the lesson builder — better to surface the problem than ship a curriculum that violates a rule.

## What's deferred (per ARCHITECTURE.md)

Payments, podcasts, portfolio, teacher notes / community, smart suggestions, follow-up emails. The schema has scaffolding for `TeacherNote` and `followUpSentAt` so adding these later is additive, not a refactor.
