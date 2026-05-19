import Anthropic from '@anthropic-ai/sdk';
import { recordUsage } from './api-usage';
import { getModelFor } from './model-config';
import { unstable_cache } from 'next/cache';
import { z } from 'zod';
import type { Poem } from './poems';

const TopicsResponse = z.object({
  topics: z.array(z.string().min(1).max(80)).min(3).max(12),
});

const SYSTEM_PROMPT = `You are a curriculum designer for qed'bop, which pairs public-domain poems with musical settings. Your job is to suggest discussion TOPIC AREAS for a given poem and audience level. Topics will appear as checkboxes for a teacher to select; selected topics will then drive the discussion questions in the assignment.

Return strictly JSON. No prose before or after. No markdown fences.`;

const AUDIENCE_HINT: Record<string, string> = {
  'middle-school': 'middle school students (ages 11-14, grades 6-8)',
  'high-school': 'high school students (ages 14-18, grades 9-12)',
  'college': 'undergraduate college students',
  'post-graduate': 'graduate students and scholars',
};

const FALLBACK_TOPICS: Record<string, string[]> = {
  'middle-school': [
    'Mood and feeling',
    'What the speaker notices',
    'Repeated words and phrases',
    'Setting and time of day',
    'Music tempo and energy',
    'Listening for surprises',
  ],
  'high-school': [
    'Theme and meaning',
    'Imagery and sensory detail',
    'Form and rhythm',
    'Music-text interaction',
    'Tone and persona',
    'Repetition as device',
    'Historical context',
  ],
  'college': [
    'Rhetorical strategy',
    'Form, meter, and prosody',
    'Comparative musical interpretation',
    'Historical and cultural context',
    'Figurative language and ambiguity',
    'Reception and tradition',
    'Voice and persona',
  ],
  'post-graduate': [
    'Critical theory and framing',
    'Intertextuality and adaptation',
    'Historical materialism',
    'Form as ideology',
    'Musical setting as criticism',
    'Reception history',
    'Comparative settings as variant readings',
  ],
};

async function _generate(poem: Poem, audience: string): Promise<string[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return FALLBACK_TOPICS[audience] ?? FALLBACK_TOPICS['high-school'];

  const audienceHint = AUDIENCE_HINT[audience] ?? AUDIENCE_HINT['high-school'];

  const userPrompt = `# Poem
${poem.title} — ${poem.author} (${poem.year})

"""
${poem.text}
"""

# Audience
${audienceHint}

# Task
Generate 6 to 8 discussion TOPIC AREAS for studying this poem at this audience level.

Topics should be:
- Specific and distinctive (not generic — avoid "Theme" or "Poetry"; prefer "Repetition as device" or "Class encounter")
- CALIBRATED TO THE AUDIENCE LEVEL — sophisticated framings for graduate students (e.g. "Modernist temporality", "Form as ideology"); accessible framings for middle schoolers (e.g. "Mood and feeling", "Repeated words")
- Broad enough that 1-3 questions could explore each
- Distinct from each other
- Phrased in 2 to 5 words

Return: {"topics": ["...", "...", ...]}

No prose, no fences.`;

  try {
    const model = await getModelFor('topics');
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    });

    await recordUsage({
      generator: 'topics',
      model,
      usage: response.usage,
      poemSlug: poem.slug,
      audience,
    });

    const text = response.content.find((b) => b.type === 'text');
    if (!text || text.type !== 'text') throw new Error('no text');

    const raw = text.text.trim();
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start === -1 || end === -1) throw new Error('no JSON');

    const parsed = TopicsResponse.parse(JSON.parse(raw.slice(start, end + 1)));
    return parsed.topics;
  } catch (err) {
    console.error('[generate-topics]', err);
    return FALLBACK_TOPICS[audience] ?? FALLBACK_TOPICS['high-school'];
  }
}

export async function getTopicOptions(poem: Poem, audience: string): Promise<string[]> {
  const cacheKey = [poem.slug, audience].join('|');
  const cached = unstable_cache(
    () => _generate(poem, audience),
    ['topic-options-v1', cacheKey],
    { revalidate: 60 * 60 * 24 * 7, tags: ['topics'] }
  );
  return cached();
}
