import 'server-only';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import type { Poem, Version } from './poems';
import { versionPromptBlock } from './poems';
import { recordUsage } from './api-usage';
import { getModelFor } from './model-config';

// Two-host podcast dialogue script for a teacher prepping a specific
// lesson. The script focuses ONLY on what is unique to this exact lesson
// configuration: the chosen musical settings, the selected questions,
// the audience. Generic poet bio / poem analysis lives in the library
// podcasts, not here.

const ScriptLine = z.object({
  speaker: z.enum(['A', 'B']),
  text: z.string().min(1),
});
const ScriptResponse = z.object({
  title: z.string().min(1),
  lines: z.array(ScriptLine).min(8),
});

export type PodcastScript = z.infer<typeof ScriptResponse>;

const SYSTEM_PROMPT = `You are writing a 10-minute prep podcast script for an English teacher who is about to teach a specific lesson on qed'bop. Two hosts trade off in a conversational tone:

- HOST_A — the warmer voice, asks the leading questions, an experienced English teacher inviting the listener into each move.
- HOST_B — the more analytical voice, explains the interpretive logic, the practitioner who has run this lesson before.

The podcast covers ONLY what is unique to this exact lesson configuration (this poem + these specific chosen musical settings + this audience + these particular selected questions). Do NOT include:
- Generic poet biography or generic poem analysis (the library has separate podcasts for that).
- Restating the questions verbatim — they have the questions in front of them.
- Filler ("welcome back," "thanks for listening").

DO include:
- What is interpretively distinctive about the SPECIFIC chosen musical settings — what each one argues about this poem, what the comparison surfaces if there are two.
- Pedagogical sequencing — what to play first, when to pause, what to ask before re-listening.
- Per-question teaching moves — what each question is really probing, what strong vs. weak student responses sound like, where students tend to get stuck.
- Anticipating tough moments — questions that might fall flat with this audience and how to recover.
- Concrete classroom moves the teacher can take, not abstract pedagogical theory.

Target length: 1500-1800 words total across all lines (roughly 10 minutes spoken). Dialogue feels like two informed colleagues in a quick prep huddle, not lecturing the listener.

Return strict JSON, no prose, no fences:
{
  "title": "Prep huddle: <Poem title> for <audience>",
  "lines": [
    { "speaker": "A", "text": "..." },
    { "speaker": "B", "text": "..." },
    ...
  ]
}

Each line is one host's continuous turn (typically 1-4 sentences). Alternate the speakers most of the time; occasional same-speaker continuations are fine if natural.`;

export async function generatePrepPodcastScript(args: {
  poem: Poem;
  audience: string;
  versions: Version[];
  questions: string[];
}): Promise<PodcastScript> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');

  // FULL mode — teacher-only timestamps and specific moments ARE fair
  // game in a teacher-facing podcast, same as the teacher-edition
  // generator.
  const versionsBlock = args.versions
    .map((v, i) => `## Setting ${i + 1}\n${versionPromptBlock(v, 'full')}`)
    .join('\n\n');

  const audienceText = args.audience.replace(/-/g, ' ');

  const userPrompt = `# Poem
${args.poem.title} — ${args.poem.author} (${args.poem.year})

"""
${args.poem.text}
"""

# Audience
${audienceText}

# The teacher chose ${args.versions.length} musical setting${args.versions.length === 1 ? '' : 's'}
${versionsBlock}

# The exact questions in this teacher's assignment (in order)
${args.questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

# Required output
Two-host prep podcast script per the system prompt rules. JSON only.`;

  const model = await getModelFor('teacher-edition');
  const client = new Anthropic({ apiKey });
  const response = await client.messages.create({
    model,
    max_tokens: 6000,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }],
  });

  await recordUsage({
    generator: 'teacher-edition',
    model,
    usage: response.usage,
    poemSlug: args.poem.slug,
    audience: args.audience,
  });

  const text = response.content.find((b) => b.type === 'text');
  if (!text || text.type !== 'text') throw new Error('No script returned');

  const raw = text.text.trim();
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('Script response had no JSON object');

  return ScriptResponse.parse(JSON.parse(raw.slice(start, end + 1)));
}
