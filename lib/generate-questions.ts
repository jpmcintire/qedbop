import Anthropic from '@anthropic-ai/sdk';
import { unstable_cache } from 'next/cache';
import { z } from 'zod';
import type { Poem, Version } from './poems';
import { versionPromptBlock } from './poems';

const MODEL = 'claude-opus-4-7';

const AUDIENCE_GUIDANCE: Record<string, string> = {
  'middle-school':
    'Keep language accessible and concrete. Focus on observable imagery, mood, and what students can directly hear. Avoid critical theory and unfamiliar vocabulary. Questions should invite curiosity rather than test prior knowledge.',
  'high-school':
    'Engage with theme, form, and figurative language. Encourage close reading and personal interpretation. Use literary vocabulary (metaphor, tone, persona) but assume students may need to look terms up. Questions can be open-ended but should have textual anchors.',
  'college':
    'Engage with rhetorical strategy, historical context, and comparative analysis across musical settings. Use disciplinary vocabulary freely. Questions should ask students to construct arguments supported by evidence from both poem and music.',
  'post-graduate':
    'Engage with theoretical framing, intertextuality, and the relationship between source text and musical interpretation as a form of criticism. Assume sophisticated readers comfortable with critical theory. Questions can be provocative and assume the student will bring outside texts to bear.',
};

const SYSTEM_PROMPT = `You are a curriculum designer for qed'bop, which pairs public-domain poems with musical settings on YouTube. You generate discussion questions calibrated to a specific audience level.

Four non-negotiable rules govern every question set you produce:

1. NEVER reveal timestamps or invent specific musical moments. Do not write "at 1:20 the bass drops out" or "the singer whispers the final line." The student must identify and describe specific musical moments themselves — that is the proof of engagement. Questions about the music must be GENERAL ("identify a moment where the instrumentation changes unexpectedly and explain its interpretive effect"), never specific.

2. At least ONE question in every set must require the student to identify a specific musical moment they noticed, describe what they heard in concrete sensory terms, and explain its interpretive effect on the poem. This is the structural moat — the question that cannot be answered without listening.

3. Questions should engage with the interaction between the poem and the music, not just the poem alone.

4. Return strictly JSON. No prose before or after. No markdown fences.`;

const QuestionsResponse = z.object({
  questions: z.array(z.string().min(1)).min(1),
});

type GenerateArgs = {
  slug: string;
  audience: string;
  count: number;
  versions: Version[]; // student-facing — only safe fields get into the prompt
  topics?: string[];
  lengths?: string[]; // length labels (e.g. "Short essay (3-4 paragraphs)")
};

async function callClaude(args: GenerateArgs, poem: Poem): Promise<string[]> {
  const audienceGuidance = AUDIENCE_GUIDANCE[args.audience] ?? AUDIENCE_GUIDANCE['high-school'];
  const audienceLabel = args.audience.replace(/-/g, ' ');

  const versionCount = args.versions.length;
  const versionsLine =
    versionCount > 1
      ? `Students will listen to ${versionCount} different musical settings of the poem. Questions should invite comparison across the settings.`
      : `Students will listen to one musical setting of the poem.`;

  // SAFE mode — student-facing content. No teacher-only notes.
  const versionsBlock = args.versions
    .map((v, i) => `## Setting ${i + 1}\n${versionPromptBlock(v, 'safe')}`)
    .join('\n\n');

  const topicsBlock =
    args.topics && args.topics.length > 0
      ? `\n# Required topic coverage
The question set MUST collectively address all of these topics:
${args.topics.map((t) => `- ${t}`).join('\n')}

Some questions may address multiple topics; some topics may need their own question. Aim to cover every listed topic at least once across the ${args.count} question${args.count === 1 ? '' : 's'}.
`
      : '';

  const lengthsBlock =
    args.lengths && args.lengths.length > 0
      ? `\n# Expected response lengths
Students will answer with responses of these length(s):
${args.lengths.map((l) => `- ${l}`).join('\n')}

Calibrate the questions to the lengths the teacher has selected:
- Questions paired with short answers (1-2 sentences, short paragraph) should be focused and concrete — typically asking students to identify, describe, or notice one specific thing.
- Questions paired with longer responses (essay, research paper) should invite analysis, argument, synthesis, and the use of multiple pieces of evidence.

If multiple lengths are listed, vary the question complexity across the set so the assignment naturally produces a mix of response lengths. If only one length is listed, calibrate every question to that target.
`
      : '';

  const userPrompt = `# Poem
Title: ${poem.title}
Author: ${poem.author} (${poem.year})

Full text:
"""
${poem.text}
"""

# Assignment context
Audience level: ${audienceLabel}
${versionsLine}

# Musical settings (context only — do NOT invent or paraphrase specific musical moments; the interpretive themes below describe the music's broader argument, never specific timestamped events)
${versionsBlock}

# Calibration for this audience
${audienceGuidance}
${topicsBlock}${lengthsBlock}
# Required output
Generate EXACTLY ${args.count} discussion question${args.count === 1 ? '' : 's'} as a JSON object:

{"questions": ["...", "...", ...]}

Number of items in the array must equal ${args.count}. Order from concrete to interpretive. At least one of the questions must require the student to identify and describe a specific musical moment they noticed (Rule 2 above).

Return only the JSON object. No prose, no fences.`;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');

  const client = new Anthropic({ apiKey });
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const text = response.content.find((b) => b.type === 'text');
  if (!text || text.type !== 'text') {
    throw new Error('Claude returned no text content');
  }

  const raw = text.text.trim();
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('No JSON object in response');

  const parsed = QuestionsResponse.parse(JSON.parse(raw.slice(start, end + 1)));
  // Trim or pad to exactly count
  if (parsed.questions.length >= args.count) return parsed.questions.slice(0, args.count);
  return parsed.questions; // fewer than requested; viewer will render what we got
}

// Cache key includes everything that influences the output. Identical URLs
// hit cache; changing audience or count regenerates.
async function _generate(args: GenerateArgs, poem: Poem): Promise<{ questions: string[]; source: 'ai' | 'fallback' }> {
  try {
    const questions = await callClaude(args, poem);
    return { questions, source: 'ai' };
  } catch (err) {
    console.error('[generate-questions] falling back to static questions:', err);
    return {
      questions: poem.questions.slice(0, args.count),
      source: 'fallback',
    };
  }
}

// Compact representation of each version for cache-key purposes. Includes
// everything safe-mode would feed into the prompt so the cache invalidates
// when any of those fields change in lib/poems.ts.
function versionCacheKey(v: Version): string {
  return [
    v.label,
    v.youtubeId,
    v.genre ?? '',
    v.vocalCharacter ?? '',
    v.artist ?? '',
    String(v.recordingYear ?? ''),
    String(v.durationSeconds ?? ''),
    v.themes ?? '',
  ].join('~');
}

export async function generateQuestions(args: GenerateArgs, poem: Poem) {
  const cacheKey = [
    args.slug,
    args.audience,
    String(args.count),
    ...args.versions.map(versionCacheKey),
    ...(args.topics ?? []),
    ...(args.lengths ?? []),
  ].join('|');
  const cached = unstable_cache(
    async () => _generate(args, poem),
    ['generate-questions-v4', cacheKey],
    { revalidate: 60 * 60 * 24 * 7, tags: ['questions'] } // 1 week
  );
  return cached();
}

// One-off single-question generation. Used when the teacher wants to add a
// specific question after seeing the AI's first round. Not cached — each
// instruction is unique per teacher, and these are infrequent enough that
// caching adds complexity without payoff.
const SingleQuestionResponse = z.object({
  question: z.string().min(1),
});

type SingleQuestionArgs = {
  slug: string;
  audience: string;
  versions: Version[]; // student-facing — safe mode only
  existingQuestions: string[];
  instruction: string;
};

export async function generateSingleQuestion(
  args: SingleQuestionArgs,
  poem: Poem
): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const audienceGuidance = AUDIENCE_GUIDANCE[args.audience] ?? AUDIENCE_GUIDANCE['high-school'];
  const audienceLabel = args.audience.replace(/-/g, ' ');

  const versionCount = args.versions.length;
  const versionsLine =
    versionCount > 1
      ? `Students will listen to ${versionCount} different musical settings.`
      : `Students will listen to one musical setting of the poem.`;

  const versionsBlock = args.versions
    .map((v, i) => `## Setting ${i + 1}\n${versionPromptBlock(v, 'safe')}`)
    .join('\n\n');

  const existingBlock =
    args.existingQuestions.length > 0
      ? `\n# Existing questions (do not duplicate these)\n${args.existingQuestions
          .map((q, i) => `${i + 1}. ${q}`)
          .join('\n')}\n`
      : '';

  const userPrompt = `# Poem
Title: ${poem.title}
Author: ${poem.author} (${poem.year})

Full text:
"""
${poem.text}
"""

# Audience: ${audienceLabel}
${versionsLine}

# Musical settings (context only — never invent or paraphrase specific musical moments)
${versionsBlock}

# Calibration
${audienceGuidance}
${existingBlock}
# Teacher's request for the new question
${args.instruction}

# Required output
Generate ONE additional discussion question that addresses the teacher's request and fits alongside the existing questions (without duplicating their substance). Follow the four rules in the system prompt.

Return JSON: {"question": "..."}

No prose, no fences.`;

  try {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = response.content.find((b) => b.type === 'text');
    if (!text || text.type !== 'text') return null;

    const raw = text.text.trim();
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start === -1 || end === -1) return null;

    const parsed = SingleQuestionResponse.parse(JSON.parse(raw.slice(start, end + 1)));
    return parsed.question.trim();
  } catch (err) {
    console.error('[generate-single-question]', err);
    return null;
  }
}
