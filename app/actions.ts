'use server';

import { getPoem } from '@/lib/poems';
import { getTopicOptions as _getTopicOptions } from '@/lib/generate-topics';
import {
  generateQuestions as _generateQuestions,
  generateSingleQuestion as _generateSingleQuestion,
} from '@/lib/generate-questions';
import {
  generateTeacherEdition as _generateTeacherEdition,
  type TeacherEdition,
} from '@/lib/generate-teacher-edition';

export async function fetchTopicOptions(
  slug: string,
  audience: string
): Promise<string[]> {
  const poem = getPoem(slug);
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
  const poem = getPoem(slug);
  if (!poem) return { questions: [], source: 'fallback' };

  const versions = versionIds
    .map((id) => poem.versions.find((v) => v.youtubeId === id))
    .filter((v): v is NonNullable<typeof v> => !!v);

  return _generateQuestions(
    {
      slug,
      audience,
      count,
      versionLabels: versions.map((v) => v.label),
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
  const poem = getPoem(slug);
  if (!poem) return null;

  const versions = versionIds
    .map((id) => poem.versions.find((v) => v.youtubeId === id))
    .filter((v): v is NonNullable<typeof v> => !!v);

  return _generateSingleQuestion(
    {
      slug,
      audience,
      versionLabels: versions.map((v) => v.label),
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
}: {
  slug: string;
  versionIds: string[];
  audience: string;
  questions: string[];
}): Promise<TeacherEdition | null> {
  const poem = getPoem(slug);
  if (!poem) return null;

  const versions = versionIds
    .map((id) => poem.versions.find((v) => v.youtubeId === id))
    .filter((v): v is NonNullable<typeof v> => !!v);

  return _generateTeacherEdition(
    poem,
    audience,
    versions.map((v) => v.label),
    questions
  );
}
