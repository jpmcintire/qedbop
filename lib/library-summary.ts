import 'server-only';
import { unstable_cache } from 'next/cache';
import { POEMS } from './poems';
import { getPoemEnriched } from './poems-runtime';

// Compact JSON description of the whole catalog. Built once, cached for
// the lifetime of the next/cache TTL or until the tag is revalidated
// (admin saves bust it via the existing 'questions'/'teacher-edition'
// revalidations). The concierge sends this whole block in its system
// prompt so Claude can suggest specifically and never invent slugs.

export type LibraryEntry = {
  slug: string;
  title: string;
  author: string;
  year: number;
  versionCount: number;
  // First ~280 chars of the most-thematic version's themes field, or
  // empty. Gives Claude a flavor of what the music argues without
  // dumping the whole prompt block.
  themes?: string;
  // Up to 3 starter questions, lightly summarizing what the poem
  // invites students to do. Helps the concierge match teacher queries
  // like "wealth and power" or "death" to the right poems.
  sampleQuestions: string[];
  // Poet's curated special facts when present (typically empty).
  poetFacts?: string;
};

async function _buildLibrarySummary(): Promise<LibraryEntry[]> {
  const entries: LibraryEntry[] = [];
  for (const stub of POEMS) {
    let enriched = stub;
    try {
      const e = await getPoemEnriched(stub.slug);
      if (e) enriched = e;
    } catch {
      // Use the static stub if DB read fails.
    }
    const versions = enriched.versions ?? [];
    const themesSource = versions.find((v) => v.themes?.trim())?.themes ?? '';
    entries.push({
      slug: enriched.slug,
      title: enriched.title,
      author: enriched.author,
      year: enriched.year,
      versionCount: versions.length,
      themes: themesSource ? themesSource.trim().slice(0, 280) : undefined,
      sampleQuestions: enriched.questions.slice(0, 3),
      poetFacts: enriched.poetSpecialFacts?.trim() || undefined,
    });
  }
  return entries;
}

export const getLibrarySummary = unstable_cache(
  _buildLibrarySummary,
  ['library-summary-v1'],
  {
    revalidate: 60 * 60 * 24, // 24h
    // Bust on the same tags admin saves bust today.
    tags: ['questions', 'teacher-edition', 'topics'],
  }
);
