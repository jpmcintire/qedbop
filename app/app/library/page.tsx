import Link from 'next/link';
import { prisma } from '@/lib/prisma';

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; theme?: string }>;
}) {
  const { q, theme } = await searchParams;

  const works = await prisma.work.findMany({
    where: {
      AND: [
        q
          ? {
              OR: [
                { title: { contains: q, mode: 'insensitive' } },
                { author: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {},
        theme ? { themes: { has: theme } } : {},
      ],
    },
    include: {
      versions: {
        select: { id: true, label: true, isRecommended: true },
      },
    },
    orderBy: { title: 'asc' },
  });

  const allThemes = Array.from(
    new Set(works.flatMap((w) => w.themes))
  ).sort();

  return (
    <div className="max-w-page mx-auto px-6 pt-16 pb-24">
      <p className="chrome mb-2">Library</p>
      <h1 className="font-serif text-4xl mb-8">Browse works.</h1>

      <form className="mb-8 flex gap-3 max-w-prose">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ''}
          placeholder="Search title or author"
          className="flex-1 border-b border-rule bg-transparent py-2 focus:outline-none focus:border-ink"
        />
        <button className="chrome px-4 py-2 border border-rule rounded-full hover:border-ink">
          Search
        </button>
      </form>

      {allThemes.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          <Link
            href="/app/library"
            className={`chrome px-3 py-1 rounded-full border ${
              !theme ? 'bg-ink text-paper border-ink' : 'border-rule hover:border-ink'
            }`}
          >
            All
          </Link>
          {allThemes.map((t) => (
            <Link
              key={t}
              href={`/app/library?theme=${encodeURIComponent(t)}`}
              className={`chrome px-3 py-1 rounded-full border ${
                theme === t ? 'bg-ink text-paper border-ink' : 'border-rule hover:border-ink'
              }`}
            >
              {t}
            </Link>
          ))}
        </div>
      )}

      {works.length === 0 ? (
        <p className="prose-literary text-muted py-12">
          No works match. The library is still being seeded.
        </p>
      ) : (
        <ul className="grid gap-6 md:grid-cols-2">
          {works.map((w) => (
            <li key={w.id}>
              <Link
                href={`/app/library/${w.id}`}
                className="block border border-rule rounded-lg p-5 hover:border-ink no-underline"
              >
                <div className="chrome mb-1">
                  {w.author}
                  {w.publicationYear ? ` · ${w.publicationYear}` : ''}
                </div>
                <div className="font-serif text-2xl text-ink">{w.title}</div>
                <div className="chrome mt-3">
                  {w.versions.length} version{w.versions.length === 1 ? '' : 's'}
                  {w.versions.some((v) => v.isRecommended) ? ' · recommended' : ''}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
