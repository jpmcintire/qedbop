import Anthropic from '@anthropic-ai/sdk';
import type { Version, Work } from '@prisma/client';
import {
  CurriculumSchema,
  validateCurriculumRules,
  type Curriculum,
  type DepthToggles,
  type GenerateRequest,
} from './schemas';

// The system prompt encodes the four non-negotiable rules from
// ARCHITECTURE.md. They are repeated, capitalized, and re-stated in JSON output
// requirements because LLMs forget mid-generation.
const SYSTEM_PROMPT = `You are a curriculum designer for qed'bop, an education platform that pairs poems with musical settings. You generate assignments for English teachers that students cannot complete with a generic AI response.

FOUR NON-NEGOTIABLE RULES — these are the product's moat. Violating any of them invalidates the output.

RULE 1 — NO TIMESTAMPS, NO SPECIFIC MUSICAL MOMENTS IN STUDENT-FACING TEXT.
Never write "At 1:20, the bass drops out." Never write "the singer whispers the final line." Never reference a specific second, minute, lyric phrasing, or instrumental event. The student must identify and describe specific musical moments themselves — that is the proof of engagement. Discussion questions and writing prompts about the music must be GENERAL ("identify a moment where the instrumentation changes unexpectedly and explain its interpretive effect"). This rule applies to: discussionQuestions, writingPrompt, background, and all addOns.

RULE 2 — EVERY ASSIGNMENT MUST INCLUDE EXACTLY ONE "FIND AND DESCRIBE" QUESTION.
At least one discussionQuestion must require the student to (a) identify a specific musical moment they noticed, (b) describe what they heard in concrete sensory terms, and (c) explain its interpretive effect on the poem. Mark this question with isFindAndDescribe: true. This is the structural moat — it cannot be answered without listening.

RULE 3 — ONLY THE PROVIDED "INTERPRETIVE THEMES" NOTES ARE AVAILABLE TO YOU.
For each version, you receive a music_text_themes field with broader interpretive notes. You do NOT receive (and must not invent) timestamped specifics. If you find yourself wanting to mention a specific moment, instead reframe it as a general directional cue.

RULE 4 — RUBRIC MUST INCLUDE "Specificity of Musical Observation" AS A DIMENSION.
This dimension name must appear EXACTLY as written, with levels from 1 (vague mood-words, no specific moments cited) to 5 (multiple precise moments with interpretive argument).

OUTPUT FORMAT.
Return a single JSON object matching the requested schema. No prose before or after. No markdown code fences. The JSON object only.`;

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5';

let _client: Anthropic | null = null;
function client(): Anthropic {
  if (_client) return _client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set');
  _client = new Anthropic({ apiKey });
  return _client;
}

type VersionForPrompt = Pick<
  Version,
  | 'id'
  | 'label'
  | 'durationSeconds'
  | 'musicDescription'
  | 'chorusPhrases'
  | 'vocalCharacter'
  | 'musicTextThemes'
>;

// CRITICAL: this is the strip-at-the-boundary helper. Every code path that
// sends version data to Claude for student-facing content MUST funnel through
// this function. Tests should assert that musicTextTeacherOnly is never a
// substring of the rendered prompt.
function stripVersionForPrompt(v: Version): VersionForPrompt {
  return {
    id: v.id,
    label: v.label,
    durationSeconds: v.durationSeconds,
    musicDescription: v.musicDescription,
    chorusPhrases: v.chorusPhrases,
    vocalCharacter: v.vocalCharacter,
    musicTextThemes: v.musicTextThemes,
  };
}

function describeToggles(t: DepthToggles): string {
  const on: string[] = [];
  if (t.extendedBio) on.push('extendedBio (longer poet biography)');
  if (t.historicalContext) on.push('historicalContext (deeper historical moment)');
  if (t.genreSociology)
    on.push(
      'genreSociology (what this musical genre IS — cultural roots, traditions, what it carries)'
    );
  if (t.crossCurricular)
    on.push('crossCurricular (connections to history, sociology, music theory)');
  if (t.technicalPoetry) on.push('technicalPoetry (meter, form, sonic devices)');
  if (t.creativeResponse) on.push('creativeResponse (alternative outputs beyond an essay)');
  if (t.scaffoldedListening)
    on.push(
      'scaffoldedListening (gentle directional cues toward rough sections — NEVER specific moments)'
    );
  if (on.length === 0) return 'None — keep the output minimal and focused.';
  return on.join('\n- ');
}

type BuildPromptArgs = {
  work: Work;
  versions: Version[];
  request: GenerateRequest;
  teacher: { state: string | null; gradeLevels: string[]; courseType: string | null };
  standardsText: string;
};

function buildUserPrompt(args: BuildPromptArgs): string {
  const stripped = args.versions.map(stripVersionForPrompt);

  return `# Teacher
State: ${args.teacher.state ?? 'unspecified'}
Grade levels: ${args.teacher.gradeLevels.join(', ') || 'unspecified'}
Course type: ${args.teacher.courseType ?? 'regular'}

# Work
Title: ${args.work.title}
Author: ${args.work.author}
Type: ${args.work.type}
Publication year: ${args.work.publicationYear ?? 'unknown'}
Themes: ${args.work.themes.join(', ')}

Full text:
"""
${args.work.fullText}
"""

# Musical versions
${stripped
  .map(
    (v) => `## Version: ${v.label}
Duration: ${v.durationSeconds ?? 'unknown'}s
Music description: ${v.musicDescription ?? '—'}
Vocal character: ${v.vocalCharacter ?? '—'}
Chorus phrases: ${v.chorusPhrases ?? '—'}

Interpretive themes (general; safe to reference):
${v.musicTextThemes || '(none provided)'}
`
  )
  .join('\n')}

# Assignment parameters
Delivery modality: ${args.request.deliveryModality}
Assignment type: ${args.request.assignmentType}

# Active depth toggles
- ${describeToggles(args.request.depthToggles)}

For each toggle that is ON, populate the corresponding field under addOns with a clean prose section appropriate for the grade level. For toggles that are OFF, omit the field entirely.

# Relevant state standards (reference these in standardsAlignment)
${args.standardsText || '(no standards loaded)'}

${
  args.request.chatInstructions
    ? `# Teacher chat instructions\n${args.request.chatInstructions}\n`
    : ''
}

# Required JSON output shape
{
  "discussionQuestions": [
    { "prompt": "...", "isFindAndDescribe": false },
    { "prompt": "...", "isFindAndDescribe": true }
  ],
  "writingPrompt": { "prompt": "...", "lengthGuidance": "...", "evidenceRequirements": "..." },
  "background": { "poetBio": "...", "historicalContext": "...", "literarySignificance": "..." },
  "vocabulary": [{ "term": "...", "definition": "..." }],
  "standardsAlignment": ["CCSS.ELA-LITERACY.RL.9-10.4", "..."],
  "rubric": [
    {
      "name": "Specificity of Musical Observation",
      "description": "...",
      "levels": [
        { "score": 1, "description": "Vague mood-words, no specific moments cited." },
        { "score": 5, "description": "Multiple precise moments with interpretive argument." }
      ]
    }
  ],
  "gradingGuidance": { "strongResponseLooksLike": "...", "weakResponseLooksLike": "..." },
  "addOns": { "genreSociology": "..." }
}

Return only the JSON object. No prose, no fences.`;
}

function extractJson(raw: string): unknown {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : raw;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('No JSON object found in model output');
  return JSON.parse(candidate.slice(start, end + 1));
}

export type GenerateOk = { ok: true; curriculum: Curriculum };
export type GenerateErr = { ok: false; error: string };
export type GenerateResult = GenerateOk | GenerateErr;

export async function generateCurriculum(args: BuildPromptArgs): Promise<GenerateResult> {
  const userPrompt = buildUserPrompt(args);

  // Defensive assertion: a leak of teacher-only notes would be catastrophic.
  for (const v of args.versions) {
    if (
      v.musicTextTeacherOnly &&
      userPrompt.includes(v.musicTextTeacherOnly.slice(0, 40))
    ) {
      return {
        ok: false,
        error: 'Refusing to call Claude: teacher-only notes leaked into the user prompt.',
      };
    }
  }

  let lastError = '';
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await client().messages.create({
        model: MODEL,
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
      });

      const textBlock = response.content.find((b) => b.type === 'text');
      if (!textBlock || textBlock.type !== 'text') {
        lastError = 'Claude returned no text content';
        continue;
      }

      const parsed = CurriculumSchema.safeParse(extractJson(textBlock.text));
      if (!parsed.success) {
        lastError = `Schema validation failed: ${parsed.error.issues
          .map((i) => `${i.path.join('.')}: ${i.message}`)
          .join('; ')}`;
        continue;
      }

      const issues = validateCurriculumRules(parsed.data);
      if (issues.length > 0) {
        lastError = `Rule validation failed: ${issues
          .map((i) => `[${i.rule}] ${i.message}`)
          .join('; ')}`;
        continue;
      }

      return { ok: true, curriculum: parsed.data };
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
    }
  }

  return { ok: false, error: lastError || 'Unknown error' };
}
