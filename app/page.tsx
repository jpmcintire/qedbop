import Link from 'next/link';
import { getAllPoems } from '@/lib/poems';

export default async function HomePage() {
  const poems = await getAllPoems();
  return (
    <div className="max-w-page mx-auto px-6 pt-20 pb-24">
      <section className="max-w-prose">
        <p className="chrome mb-6">A catalog</p>
        <h1 className="font-serif text-4xl md:text-5xl leading-tight mb-6 text-ink">
          Public-domain poems, set to music.
        </h1>
        <p className="prose-literary">
          QED&rsquo;Bop is a working catalog of poems from the public domain
          rendered as singable songs. The poem comes first; the music serves
          the literature. Each entry is a place to read the poem, hear it sung,
          and learn what is worth knowing about it.
        </p>
      </section>

      <section className="mt-20">
        <h2 className="chrome mb-6 pb-3 border-b border-rule">Poems</h2>
        <ul className="divide-y divide-rule">
          {poems.length === 0 && (
            <li className="py-6 text-muted prose-literary">No poems yet.</li>
          )}
          {poems.map((p) => (
            <li key={p.slug} className="py-5">
              <Link
                href={`/poems/${p.slug}`}
                className="block group max-w-prose"
              >
                <div className="chrome mb-1">
                  {p.poet} &middot; {p.year}
                </div>
                <div className="font-serif text-2xl text-ink group-hover:underline decoration-rule underline-offset-4">
                  {p.title}
                </div>
                {p.oneLineSummary && (
                  <div className="prose-literary text-muted mt-1 text-base">
                    {p.oneLineSummary}
                  </div>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
