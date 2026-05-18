import Anthropic from '@anthropic-ai/sdk';
import type { Poem, Version } from './poems';
import { versionPromptBlock } from './poems';

const MODEL = 'claude-opus-4-7';

export type ChatMessage = { role: 'user' | 'assistant'; content: string };

const AUDIENCE_LABEL: Record<string, string> = {
  'middle-school': 'middle school students',
  'high-school': 'high school students',
  'college': 'undergraduate college students',
  'post-graduate': 'graduate students or scholars',
};

function buildSystemPrompt(
  poem: Poem,
  audience: string,
  versions: Version[],
  questions: string[]
): string {
  const audienceText = AUDIENCE_LABEL[audience] ?? AUDIENCE_LABEL['high-school'];

  const versionsBlock =
    versions.length > 0
      ? versions
          .map((v, i) => `## Setting ${i + 1}\n${versionPromptBlock(v, 'full')}`)
          .join('\n\n')
      : '(no settings in the assignment)';

  return `You are a teaching assistant for qed'bop, a platform that pairs public-domain poems with musical settings on YouTube. A teacher is preparing to lead a class on the poem below and is asking you questions to deepen their own understanding or to think through how to teach it.

# Poem the teacher is teaching
Title: ${poem.title}
Author: ${poem.author} (${poem.year})

"""
${poem.text}
"""

# Teacher's audience
${audienceText}

# Musical settings in the assignment
${versionsBlock}

# Questions the teacher is assigning to students
${questions.length > 0 ? questions.map((q, i) => `${i + 1}. ${q}`).join('\n') : '(none)'}

# Your role
Answer the teacher's questions about:
- The poet's life, work, and historical situation
- The poem's themes, form, sound, and history
- Cultural / political context of the period
- The genre or tradition of the musical setting(s) — what does a Ranchera typically do, what does a folk acoustic typically do, etc.
- How to teach this poem to this audience — what students typically struggle with, what discussion patterns work, scaffolding ideas
- How to facilitate the specific discussion questions above (without giving away "right" answers)

You have access to teacher-only annotations for each setting — when those are present (timestamped specific observations), feel free to reference them when answering the teacher. The teacher already knows these and may be asking to think them through with you.

# Constraints (non-negotiable)
1. NEVER fabricate specific musical moments. If the teacher-only notes above contain timestamped observations, you may reference them; otherwise describe music in terms of genre, tradition, what kinds of moves the music tends to make — not invented timestamps.
2. If you don't know something with confidence, say so plainly. Don't invent biographical details, dates, quotes, or critical reception.
3. Calibrate complexity to the teacher's audience: for middle school, keep your answers practical and grounded; for graduate, you can engage with theory and criticism.
4. Be conversational. Short paragraphs. No bullet points unless the teacher asks for them. No emoji.
5. Stay focused on this poem and its teaching. If the teacher drifts far off-topic, gently note that and offer to bring it back.

Speak as a knowledgeable, calm colleague — not a search result.`;
}

export async function askTeacher({
  poem,
  audience,
  versions,
  questions,
  history,
}: {
  poem: Poem;
  audience: string;
  versions: Version[];
  questions: string[];
  history: ChatMessage[];
}): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  if (history.length === 0) return null;

  // Last message should be from user
  if (history[history.length - 1].role !== 'user') return null;

  try {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1500,
      system: buildSystemPrompt(poem, audience, versions, questions),
      messages: history.map((m) => ({ role: m.role, content: m.content })),
    });

    const text = response.content.find((b) => b.type === 'text');
    if (!text || text.type !== 'text') return null;
    return text.text.trim();
  } catch (err) {
    console.error('[teacher-ask]', err);
    return null;
  }
}
