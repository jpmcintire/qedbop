import { z } from 'zod';

// ---------- Depth toggles ----------

export const DepthTogglesSchema = z.object({
  extendedBio: z.boolean().default(false),
  historicalContext: z.boolean().default(false),
  genreSociology: z.boolean().default(false),
  crossCurricular: z.boolean().default(false),
  technicalPoetry: z.boolean().default(false),
  creativeResponse: z.boolean().default(false),
  scaffoldedListening: z.boolean().default(false),
});
export type DepthToggles = z.infer<typeof DepthTogglesSchema>;

export const DEFAULT_TOGGLES: DepthToggles = {
  extendedBio: false,
  historicalContext: false,
  genreSociology: false,
  crossCurricular: false,
  technicalPoetry: false,
  creativeResponse: false,
  scaffoldedListening: false,
};

export const DEEP_DIVE_TOGGLES: DepthToggles = {
  extendedBio: true,
  historicalContext: true,
  genreSociology: true,
  crossCurricular: true,
  technicalPoetry: true,
  creativeResponse: true,
  scaffoldedListening: false,
};

// ---------- Generated curriculum ----------

export const DiscussionQuestionSchema = z.object({
  prompt: z.string().min(1),
  // If true, this question is the mandatory "find and describe" structural
  // question. Exactly one question per curriculum has this set.
  isFindAndDescribe: z.boolean().default(false),
});

export const RubricDimensionSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  levels: z
    .array(
      z.object({
        score: z.number().int().min(1).max(5),
        description: z.string().min(1),
      })
    )
    .min(2),
});

export const CurriculumSchema = z.object({
  discussionQuestions: z.array(DiscussionQuestionSchema).min(2),
  writingPrompt: z.object({
    prompt: z.string().min(1),
    lengthGuidance: z.string().min(1),
    evidenceRequirements: z.string().min(1),
  }),
  background: z.object({
    poetBio: z.string().min(1),
    historicalContext: z.string().min(1),
    literarySignificance: z.string().min(1),
  }),
  vocabulary: z
    .array(z.object({ term: z.string(), definition: z.string() }))
    .default([]),
  standardsAlignment: z.array(z.string()).default([]),
  rubric: z.array(RubricDimensionSchema).min(2),
  gradingGuidance: z.object({
    strongResponseLooksLike: z.string().min(1),
    weakResponseLooksLike: z.string().min(1),
  }),
  addOns: z
    .object({
      extendedBio: z.string().optional(),
      historicalContext: z.string().optional(),
      genreSociology: z.string().optional(),
      crossCurricular: z.string().optional(),
      technicalPoetry: z.string().optional(),
      creativeResponse: z.string().optional(),
      scaffoldedListening: z.string().optional(),
    })
    .default({}),
});
export type Curriculum = z.infer<typeof CurriculumSchema>;

// ---------- Generate request from the lesson builder ----------

export const GenerateRequestSchema = z.object({
  versionIds: z.array(z.string()).min(1).max(10),
  deliveryModality: z.enum(['IN_CLASS', 'HOMEWORK', 'MIXED']),
  assignmentType: z.enum([
    'COMPARE_VERSIONS',
    'SINGLE_ANALYSIS',
    'MULTIPLE_POEMS',
    'THEMATIC',
    'NOVEL_POEM',
    'BE_PRODUCER',
    'WHATS_MISSING',
  ]),
  depthToggles: DepthTogglesSchema,
  chatInstructions: z.string().max(2000).optional(),
});
export type GenerateRequest = z.infer<typeof GenerateRequestSchema>;

// ---------- Validation: enforce non-negotiable rules on Claude output ----------

const FORBIDDEN_TIMESTAMP_PATTERNS = [
  /\b\d{1,2}:\d{2}\b/, // "1:20", "12:34"
  /\bat \d+\s*(?:seconds?|minutes?|mins?|secs?)\b/i,
  /\b(?:second|minute|mark) \d+/i,
];

const STUDENT_FACING_FIELDS = (c: Curriculum): string[] => [
  ...c.discussionQuestions.map((q) => q.prompt),
  c.writingPrompt.prompt,
  c.writingPrompt.lengthGuidance,
  c.writingPrompt.evidenceRequirements,
  // background and add-ons are also student-facing
  c.background.poetBio,
  c.background.historicalContext,
  c.background.literarySignificance,
  ...Object.values(c.addOns).filter((v): v is string => typeof v === 'string'),
];

export type CurriculumValidationIssue = {
  rule:
    | 'no-timestamps'
    | 'find-and-describe-required'
    | 'specificity-rubric-required';
  message: string;
};

export function validateCurriculumRules(
  c: Curriculum
): CurriculumValidationIssue[] {
  const issues: CurriculumValidationIssue[] = [];

  // Rule 1: no timestamps in student-facing prose
  for (const text of STUDENT_FACING_FIELDS(c)) {
    for (const pat of FORBIDDEN_TIMESTAMP_PATTERNS) {
      if (pat.test(text)) {
        issues.push({
          rule: 'no-timestamps',
          message: `Student-facing text contains a timestamp or moment reference: "${text.slice(0, 120)}"`,
        });
        break;
      }
    }
  }

  // Rule 2: at least one find-and-describe question
  const findCount = c.discussionQuestions.filter((q) => q.isFindAndDescribe).length;
  if (findCount < 1) {
    issues.push({
      rule: 'find-and-describe-required',
      message:
        'No discussion question is marked isFindAndDescribe. Every assignment must include one.',
    });
  }

  // Rule 4: "Specificity of Musical Observation" must be a rubric dimension
  const hasSpecificity = c.rubric.some((d) =>
    /specificity\s+of\s+musical\s+observation/i.test(d.name)
  );
  if (!hasSpecificity) {
    issues.push({
      rule: 'specificity-rubric-required',
      message:
        'Rubric is missing the required "Specificity of Musical Observation" dimension.',
    });
  }

  return issues;
}
