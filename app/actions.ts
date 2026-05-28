'use server';

import { getPoemEnriched } from '@/lib/poems-runtime';
import { getTopicOptions as _getTopicOptions } from '@/lib/generate-topics';
import {
  generateQuestions as _generateQuestions,
  generateSingleQuestion as _generateSingleQuestion,
} from '@/lib/generate-questions';
import {
  generateTeacherEdition as _generateTeacherEdition,
  type TeacherEdition,
  type TeacherEditionOverrides,
} from '@/lib/generate-teacher-edition';
import { askTeacher as _askTeacher, type ChatMessage } from '@/lib/teacher-ask';
import {
  runConcierge,
  type ConciergeTurn,
  type ConciergeResponse,
} from '@/lib/concierge';
import { generatePrepPodcast as _generatePrepPodcast } from '@/lib/generate-prep-podcast';

export async function fetchConcierge(
  query: string,
  history?: ConciergeTurn[]
): Promise<ConciergeResponse | { kind: 'error'; message: string }> {
  return runConcierge({ query, history });
}

export async function fetchTopicOptions(
  slug: string,
  audience: string
): Promise<string[]> {
  const poem = await getPoemEnriched(slug);
  if (!poem) return [];
  return _getTopicOptions(poem, audience);
}

export async function fetchQuestions({
  slug,
  versionIds,
  audience,
  topics,
  lengths,
  count,
}: {
  slug: string;
  versionIds: string[];
  audience: string;
  topics: string[];
  lengths: string[];
  count: number;
}): Promise<{ questions: string[]; source: 'ai' | 'fallback' }> {
  const poem = await getPoemEnriched(slug);
  if (!poem) return { questions: [], source: 'fallback' };

  const versions = versionIds
    .map((id) => poem.versions.find((v) => v.youtubeId === id))
    .filter((v): v is NonNullable<typeof v> => !!v);

  return _generateQuestions(
    {
      slug,
      audience,
      count,
      versions,
      topics: topics.length > 0 ? topics : undefined,
      lengths: lengths.length > 0 ? lengths : undefined,
    },
    poem
  );
}

export async function fetchSingleQuestion({
  slug,
  versionIds,
  audience,
  existingQuestions,
  instruction,
}: {
  slug: string;
  versionIds: string[];
  audience: string;
  existingQuestions: string[];
  instruction: string;
}): Promise<string | null> {
  const poem = await getPoemEnriched(slug);
  if (!poem) return null;

  const versions = versionIds
    .map((id) => poem.versions.find((v) => v.youtubeId === id))
    .filter((v): v is NonNullable<typeof v> => !!v);

  return _generateSingleQuestion(
    {
      slug,
      audience,
      versions,
      existingQuestions,
      instruction,
    },
    poem
  );
}

export async function fetchTeacherEdition({
  slug,
  versionIds,
  audience,
  questions,
  overrides,
}: {
  slug: string;
  versionIds: string[];
  audience: string;
  questions: string[];
  overrides?: TeacherEditionOverrides;
}): Promise<TeacherEdition | null> {
  const poem = await getPoemEnriched(slug);
  if (!poem) return null;

  const versions = versionIds
    .map((id) => poem.versions.find((v) => v.youtubeId === id))
    .filter((v): v is NonNullable<typeof v> => !!v);

  return _generateTeacherEdition(
    poem,
    audience,
    versions,
    questions,
    overrides,
  );
}

export async function fetchTeacherAsk({
  slug,
  versionIds,
  audience,
  questions,
  history,
}: {
  slug: string;
  versionIds: string[];
  audience: string;
  questions: string[];
  history: ChatMessage[];
}): Promise<string | null> {
  const poem = await getPoemEnriched(slug);
  if (!poem) return null;

  const versions = versionIds
    .map((id) => poem.versions.find((v) => v.youtubeId === id))
    .filter((v): v is NonNullable<typeof v> => !!v);

  return _askTeacher({
    poem,
    audience,
    versions,
    questions,
    history,
  });
}

export type PrepPodcastFetchResult =
  | { ok: true; mp3Url: string; title: string; cached: boolean }
  | { ok: false; error: string };

export async function fetchPrepPodcast(args: {
  slug: string;
  audience: string;
  versionIds: string[];
  questions: string[];
}): Promise<PrepPodcastFetchResult> {
  try {
    const poem = await getPoemEnriched(args.slug);
    if (!poem) return { ok: false, error: `Unknown poem "${args.slug}".` };
    const versions = poem.versions.filter((v) => args.versionIds.includes(v.youtubeId));
    if (versions.length === 0) return { ok: false, error: 'No matching versions.' };

    const res = await _generatePrepPodcast({
      poem,
      audience: args.audience,
      versions,
      questions: args.questions,
    });
    return { ok: true, mp3Url: res.mp3Url, title: res.title, cached: res.cached };
  } catch (err) {
    console.error('[fetchPrepPodcast]', err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Podcast generation failed.',
    };
  }
}
