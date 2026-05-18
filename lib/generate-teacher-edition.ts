import Anthropic from '@anthropic-ai/sdk';
import { unstable_cache } from 'next/cache';
import { z } from 'zod';
import type { Poem } from './poems';

const MODEL = 'claude-opus-4-7';

const AgendaItem = z.object({
  minutes: z.number().int().min(1).max(120),
  activity: z.string().min(1).max(200),
});

const TeacherEditionResponse = z.object({
  poetBio: z.string().min(1),
  historicalContext: z.string().min(1),
  classAgenda: z.array(AgendaItem).min(3).max(12),
  questionCommentary: z.array(z.string().min(1)),
});

export type TeacherEdition = z.infer<typeof TeacherEditionResponse>;
export type AgendaItemT = z.infer<typeof AgendaItem>;

const SYSTEM_PROMPT = `You are generating supplementary teacher-edition content for an assignment on qed'bop, a platform that pairs public-domain poems with musical settings.

You produce four things, calibrated to the teacher's audience level:

1. Poet biography — concise, focused on aspects relevant to teaching THIS poem (not a generic encyclopedia entry).
2. Historical context — about the poem's moment AND the cultural setting of the musical adaptation(s) the students will hear.
3. Class agenda — a realistic sequence of timed classroom activities a teacher could run, totaling somewhere between 30 and 90 minutes depending on the depth of the assignment.
4. Per-question teaching commentary — for each numbered question in the order given, one short paragraph for the teacher explaining what the question is exploring and what to listen for in strong vs. weak student responses.

Calibrate to the audience level. Middle school: warm, accessible, practical. Post-graduate: rigorous, theory-aware. Adjust agenda complexity and vocabulary accordingly.

The four mandatory rules from the question generator still apply: never invent specific musical moments or timestamps in any teacher-facing text; teacher commentary may reference what to listen for thematically but should never tell the teacher "the bass drops out at 1:20." Students still have to find specific moments themselves.

Return strict JSON. No prose before or after. No markdown fences.`;

const AUDIENCE_LABEL: Record<string, string> = {
  'middle-school': 'middle school (ages 11-14)',
  'high-school': 'high school (ages 14-18)',
  'college': 'undergraduate college',
  'post-graduate': 'graduate / scholarly',
};

async function _generate(
  poem: Poem,
  audience: string,
  versionLabels: string[],
  questions: string[]
): Promise<TeacherEdition | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  if (questions.length === 0) return null;

  const audienceText = AUDIENCE_LABEL[audience] ?? AUDIENCE_LABEL['high-school'];

  const versionsLine =
    versionLabels.length > 1
      ? `Students will listen to ${versionLabels.length} different musical settings (${versionLabels.join(' and ')}).`
      : `Students will listen to one musical setting of the poem.`;

  const userPrompt = `# Poem
${poem.title} — ${poem.author} (${poem.year})

"""
${poem.text}
"""

# Audience
${audienceText}

# Musical settings
${versionsLine}

# Questions in the assignment (in order)
${questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

# Required output
Return JSON exactly matching this shape:

{
  "poetBio": "...",
  "historicalContext": "...",
  "classAgenda": [
    {"minutes": 5, "activity": "Students read the poem silently."},
    {"minutes": 10, "activity": "Listen to the first musical setting in full, taking notes on instrumentation and mood."}
    // 3 to 12 entries; total in the 30-90 minute range
  ],
  "questionCommentary": [
    "Commentary for question 1: what it explores and what to listen for in answers.",
    "Commentary for question 2: ..."
    // exactly ${questions.length} entries, in the same order as the questions above
  ]
}

No prose, no fences. Make every word earn its place.`;

  try {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = response.content.find((b) => b.type === 'text');
    if (!text || text.type !== 'text') return null;

    const raw = text.text.trim();
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start === -1 || end === -1) return null;

    const parsed = TeacherEditionResponse.parse(JSON.parse(raw.slice(start, end + 1)));

    // If Claude returned fewer commentary entries than questions, pad with empties
    // (the renderer will just omit them).
    if (parsed.questionCommentary.length < questions.length) {
      while (parsed.questionCommentary.length < questions.length) {
        parsed.questionCommentary.push('');
      }
    }
    return parsed;
  } catch (err) {
    console.error('[generate-teacher-edition]', err);
    return null;
  }
}

export async function generateTeacherEdition(
  poem: Poem,
  audience: string,
  versionLabels: string[],
  questions: string[]
): Promise<TeacherEdition | null> {
  const cacheKey = [poem.slug, audience, String(versionLabels.length), ...questions].join('|');
  const cached = unstable_cache(
    () => _generate(poem, audience, versionLabels, questions),
    ['teacher-edition-v1', cacheKey],
    { revalidate: 60 * 60 * 24 * 7, tags: ['teacher-edition'] }
  );
  return cached();
}
