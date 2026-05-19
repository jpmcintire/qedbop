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
