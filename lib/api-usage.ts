import 'server-only';
import { prisma } from './db';

// Opus 4.7 pricing per million tokens, USD. Update here when Anthropic
// changes prices; historical rows keep their previously-computed costUsd
// (we don't recompute on read), so price drift doesn't rewrite history.
const PRICING_PER_MTOK: Record<string, {
  input: number;
  output: number;
  cacheRead: number;
  cacheCreate: number;
}> = {
  'claude-opus-4-7': {
    input: 15,
    output: 75,
    cacheRead: 1.5,
    cacheCreate: 18.75,
  },
};

export type Generator =
  | 'questions'
  | 'topics'
  | 'teacher-edition'
  | 'teacher-ask'
  | 'single-question';

type UsageBlock = {
  input_tokens: number;
  output_tokens: number;
  cache_read_input_tokens?: number | null;
  cache_creation_input_tokens?: number | null;
};

export function computeCostUsd(model: string, usage: UsageBlock): number {
  const p = PRICING_PER_MTOK[model];
  if (!p) return 0;
  const cacheRead = usage.cache_read_input_tokens ?? 0;
  const cacheCreate = usage.cache_creation_input_tokens ?? 0;
  return (
    (usage.input_tokens * p.input +
      usage.output_tokens * p.output +
      cacheRead * p.cacheRead +
      cacheCreate * p.cacheCreate) /
    1_000_000
  );
}

export async function recordUsage(args: {
  generator: Generator;
  model: string;
  usage: UsageBlock;
  poemSlug?: string;
  audience?: string;
}): Promise<void> {
  try {
    await prisma.apiUsage.create({
      data: {
        generator: args.generator,
        model: args.model,
        inputTokens: args.usage.input_tokens,
        outputTokens: args.usage.output_tokens,
        cacheReadTokens: args.usage.cache_read_input_tokens ?? 0,
        cacheCreationTokens: args.usage.cache_creation_input_tokens ?? 0,
        costUsd: computeCostUsd(args.model, args.usage),
        poemSlug: args.poemSlug ?? null,
        audience: args.audience ?? null,
      },
    });
  } catch (err) {
    // Never let usage logging break a successful generation.
    console.error('[api-usage] write failed:', err);
  }
}
