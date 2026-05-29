import 'server-only';
import { prisma } from './db';

// Catalog of Claude models the app can dispatch to, with pricing per
// million tokens (USD). Update this when Anthropic ships new models;
// the dropdown on /admin/usage reads from MODELS, and lib/api-usage.ts
// reads costs from PRICING_PER_MTOK below.
export const MODELS = [
  { id: 'claude-opus-4-8', label: 'Opus 4.8', tier: 'opus' },
  { id: 'claude-opus-4-7', label: 'Opus 4.7', tier: 'opus' },
  { id: 'claude-sonnet-4-6', label: 'Sonnet 4.6', tier: 'sonnet' },
  { id: 'claude-haiku-4-5-20251001', label: 'Haiku 4.5', tier: 'haiku' },
] as const;

export type ModelId = (typeof MODELS)[number]['id'];

export type Component =
  | 'questions'
  | 'single-question'
  | 'topics'
  | 'teacher-edition'
  | 'teacher-ask'
  | 'concierge';

export const COMPONENT_LABELS: Record<Component, string> = {
  questions: 'Question set',
  'single-question': 'Custom question',
  topics: 'Topic options',
  'teacher-edition': 'Teacher edition',
  'teacher-ask': 'Teacher chat',
  concierge: 'Concierge (landing page)',
};

// Defaults chosen for cost/quality fit. Question generators stay on
// Opus because the four mandatory rules need its deeper adherence;
// concierge and chat get Sonnet because they're matching/explaining
// rather than reasoning under tight constraints.
export const DEFAULT_MODEL: Record<Component, ModelId> = {
  questions: 'claude-opus-4-8',
  'single-question': 'claude-opus-4-8',
  topics: 'claude-opus-4-8',
  'teacher-edition': 'claude-opus-4-8',
  'teacher-ask': 'claude-sonnet-4-6',
  concierge: 'claude-sonnet-4-6',
};

// Returns the model to use for a component. Reads from the DB override
// first; falls back to the hardcoded default. Swallows DB errors so a
// transient DB hiccup never breaks generation.
export async function getModelFor(component: Component): Promise<ModelId> {
  try {
    const row = await prisma.modelSetting.findUnique({ where: { component } });
    if (row && isValidModelId(row.model)) {
      return row.model;
    }
  } catch (err) {
    console.error(`[model-config] DB read failed for ${component}:`, err);
  }
  return DEFAULT_MODEL[component];
}

function isValidModelId(s: string): s is ModelId {
  return MODELS.some((m) => m.id === s);
}
