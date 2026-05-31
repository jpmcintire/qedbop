import Link from 'next/link';
import { POEMS } from '@/lib/poems';
import { prisma } from '@/lib/db';
import { LibraryBrowser } from './LibraryBrowser';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Library — qed’bop',
  description:
    'Browse every poem in the qed’bop catalog: title, poet, era, and how many musical settings are available for each.',
};

export default async function LibraryPage() {
  // Count attached settings per poem so the listing shows total settings
  // (static defaults + admin-attached). Failure falls back to zero on
  // that count so a DB blip never breaks the page.
  let attachedCounts = new Map<string, number>();
  try {
    const rows = await prisma.poemVideo.findMany({ select: { poemSlug: true } });
    for (const r of rows) {
      attachedCounts.set(r.poemSlug, (attachedCounts.get(r.poemSlug) ?? 0) + 1);
    }
  } catch (err) {
    console.error('[library] PoemVideo count failed:', err);
  }

  const poems = POEMS.map((p) => ({
    slug: p.slug,
    title: p.title,
    author: p.author,
    year: p.year,
    settingsCount: p.versions.length + (attachedCounts.get(p.slug) ?? 0),
    firstLine: firstLineOf(p.text),
  }));

  return (
    <main className="page">
      <header style={{ marginBottom: '2rem' }}>
        <Link
          href="/"
          className="wordmark"
          style={{ color: 'var(--ink)', fontSize: '1.5rem', textDecoration: 'none' }}
        >
          qed&rsquo;bop
        </Link>
        <p className="chrome" style={{ marginTop: '0.25rem' }}>Library</p>
      </header>

      <p style={{ color: 'var(--muted)', maxWidth: '46rem', marginBottom: '2rem' }}>
        Every poem in the catalog, with how many musical settings exist for each. Click a poem to read it and listen.
      </p>

      <LibraryBrowser poems={poems} />
    </main>
  );
}

// Pulls the first non-empty line of a poem for the listing card. Used
// as a quick visual cue ("oh, that's the 'whose woods these are'
// poem"). Falls back to empty string if the poem text is missing or
// only whitespace.
function firstLineOf(text: string): string {
  if (!text) return '';
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (trimmed) return trimmed;
  }
  return '';
}
