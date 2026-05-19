import 'server-only';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { POEMS, AUDIENCES } from './poems';
import { getLibrarySummary } from './library-summary';
import { recordUsage } from './api-usage';
import { getModelFor } from './model-config';

export type ConciergeTurn = { role: 'user' | 'assistant'; content: string };

const VALID_AUDIENCES = AUDIENCES.map((a) => a.value);

// Concierge response — discriminated union. Claude is instructed to
// return exactly one of these shapes. The frontend renders accordingly:
//   - suggestions[] → cards with "Build this lesson" buttons
//   - followUp → display the question, keep the input visible
//   - offTopic → polite "I can only help with poetry teaching" message
const Suggestion = z.object({
  poemSlug: z.string(),
  headline: z.string(), // e.g. "Teach Richard Cory for an American Dream unit"
  why: z.string(),       // 2-3 sentence explanation
  // Optional concierge hints that get baked into the builder URL:
  audience: z.enum(VALID_AUDIENCES as [string, ...string[]]).optional(),
  // Either include all versions (omit), or restrict to a subset of youtubeIds.
  versionIds: z.array(z.string()).optional(),
});

export type ConciergeResponse =
  | { kind: 'suggestions'; suggestions: Array<z.infer<typeof Suggestion> & { title: string; author: string; builderUrl: string }> }
  | { kind: 'followUp'; question: string }
  | { kind: 'offTopic'; message: string };

const ResponseSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('suggestions'),
    suggestions: z.array(Suggestion).min(1).max(5),
  }),
  z.object({
    kind: z.literal('followUp'),
    question: z.string().min(3),
  }),
  z.object({
    kind: z.literal('offTopic'),
    message: z.string().min(3),
  }),
]);

const SYSTEM_PROMPT = `You are qed'bop's concierge — the entry-point assistant at qed'bop.com. qed'bop is a tool that helps English teachers build shareable lesson pages around public-domain poems that have been set to music. Each lesson combines a poem, one or more YouTube musical settings, and audience-calibrated discussion questions.

Your job: take the teacher's input ("what are you interested in teaching?") and suggest specific poems from our library that match. Be creative — surface unexpected angles, thematic pairings (within one suggestion, not across), and pedagogical approaches teachers wouldn't find on their own.

# Rules (non-negotiable)

1. **Only suggest poems that exist in the library below.** Every poemSlug you return must appear verbatim in the catalog. NEVER invent a poem or slug. If nothing in the library fits exactly, find the closest thematic relatives and frame them by what they accomplish, not by what we lack. Do not apologize for the catalog. Do not say "we don't have X but…" — pivot directly to what we DO have, framed as a first-class destination.

2. **Stay on-topic.** Your scope is helping teachers find lessons in the qed'bop library. If the user asks about something clearly outside that scope (the weather, code help, math homework, personal advice, current events), return {"kind": "offTopic", "message": "..."}. The message should be polite, brief, and steer back to literature teaching. Examples of ON-topic queries: a poem title, an author, a theme ("loss"), a literary work we may or may not have ("Gatsby"), a grade level, a unit goal, a pedagogical problem ("my students are bored with Shakespeare"). Examples of OFF-topic: asking you to write code, do math, plan a trip, give medical advice, discuss politics.

3. **Ask at most ONE clarifying follow-up, and only when truly needed.** If the input is ambiguous in a way that would dramatically change your answer (e.g. they typed only "death" and you genuinely can't pick suggestions without knowing the grade level), return {"kind": "followUp", "question": "..."}. But default to giving suggestions; teachers reward decisive recommendations over interrogations. Never ask more than one clarifying question per session.

4. **2-4 suggestions per response.** Each one is a specific lesson, rooted in exactly one poem from the library. (Multi-poem unit suggestions belong in a later product version; for now, one poem per suggestion.) Order them from closest match to most lateral.

5. **Each suggestion contains:**
   - poemSlug — must match a slug in the catalog exactly
   - headline — 4-10 words, action-oriented ("Teach Richard Cory through the lens of the American Dream")
   - why — 2-3 sentences explaining what this lesson accomplishes for THIS teacher's stated interest, drawing on the poem's themes and what the musical settings argue. Be specific. Avoid platitudes.
   - audience (optional) — if the teacher's input implies a grade level, set this to one of: middle-school, high-school, college, post-graduate
   - versionIds (optional) — usually omit, which means "use all versions." Only include this if the teacher's interest matches one version more than another.

6. **Voice:** confident, knowledgeable, slightly literary but never pretentious. Like a brilliant department chair making recommendations to a colleague. Never use the word "Claude" or refer to yourself as an AI. You are qed'bop.

7. **Output strict JSON.** No prose before or after. No code fences. One of the three shapes above. Validate against this schema mentally before returning:

  Suggestions: {"kind": "suggestions", "suggestions": [{"poemSlug": "...", "headline": "...", "why": "...", "audience": "...", "versionIds": ["..."]}, ...]}
  Follow-up: {"kind": "followUp", "question": "..."}
  Off-topic: {"kind": "offTopic", "message": "..."}

# Catalog

The library JSON follows. Each entry is one poem. \`versionCount\` is how many musical settings we have. \`themes\` summarizes what the music argues about the poem. \`sampleQuestions\` are sample discussion questions to give you a sense of what each poem invites.

`;

export async function runConcierge(args: {
  query: string;
  history?: ConciergeTurn[];
}): Promise<ConciergeResponse | { kind: 'error'; message: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { kind: 'error', message: 'Concierge unavailable: ANTHROPIC_API_KEY not set.' };
  }

  const trimmed = args.query.trim();
  if (!trimmed) {
    return { kind: 'error', message: 'Please type what you want to teach.' };
  }
  if (trimmed.length > 600) {
    return { kind: 'error', message: 'Query too long — please keep it under 600 characters.' };
  }

  let library;
  try {
    library = await getLibrarySummary();
  } catch (err) {
    return {
      kind: 'error',
      message: err instanceof Error ? err.message : 'Failed to load library.',
    };
  }

  const systemWithCatalog =
    SYSTEM_PROMPT + JSON.stringify(library, null, 2);

  // Convert prior turns + current query into the messages array.
  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];
  for (const turn of args.history ?? []) {
    messages.push({ role: turn.role, content: turn.content });
  }
  messages.push({ role: 'user', content: trimmed });

  const model = await getModelFor('concierge');
  let response;
  try {
    const client = new Anthropic({ apiKey });
    response = await client.messages.create({
      model,
      max_tokens: 1500,
      system: [
        {
          type: 'text',
          text: systemWithCatalog,
          // Prompt-cache the catalog block — every concierge call hits
          // the same prefix, so cached reads cost ~10x less.
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages,
    });
  } catch (err) {
    return {
      kind: 'error',
      message: err instanceof Error ? err.message : 'Concierge request failed.',
    };
  }

  await recordUsage({
    generator: 'concierge',
    model,
    usage: response.usage,
  });

  const text = response.content.find((b) => b.type === 'text');
  if (!text || text.type !== 'text') {
    return { kind: 'error', message: 'No response text from model.' };
  }

  const raw = text.text.trim();
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end === -1) {
    return { kind: 'error', message: 'Model returned no JSON object.' };
  }

  let parsed;
  try {
    parsed = ResponseSchema.parse(JSON.parse(raw.slice(start, end + 1)));
  } catch (err) {
    return {
      kind: 'error',
      message: err instanceof Error ? err.message : 'Model returned invalid shape.',
    };
  }

  if (parsed.kind === 'followUp') return parsed;
  if (parsed.kind === 'offTopic') return parsed;

  // Validate every suggested slug against the catalog. Drop hallucinated
  // entries silently. If nothing survives, treat as off-topic so the UI
  // doesn't render an empty result list.
  const knownSlugs = new Set(POEMS.map((p) => p.slug));
  const titleBySlug = new Map(POEMS.map((p) => [p.slug, { title: p.title, author: p.author }]));
  const valid = parsed.suggestions.filter((s) => knownSlugs.has(s.poemSlug));
  if (valid.length === 0) {
    return {
      kind: 'offTopic',
      message:
        "I couldn't find good matches in the qed'bop library for that. Try a poem title, a poet, a theme, or a grade level.",
    };
  }

  return {
    kind: 'suggestions',
    suggestions: valid.map((s) => {
      const meta = titleBySlug.get(s.poemSlug)!;
      return {
        ...s,
        title: meta.title,
        author: meta.author,
        builderUrl: buildBuilderUrl(s),
      };
    }),
  };
}

function buildBuilderUrl(s: { poemSlug: string; audience?: string; versionIds?: string[] }): string {
  const params = new URLSearchParams();
  params.set('slug', s.poemSlug);
  if (s.audience) params.set('audience', s.audience);
  if (s.versionIds?.length) {
    for (const id of s.versionIds) params.append('v', id);
  }
  return `/build?${params.toString()}`;
}
