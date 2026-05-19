import Link from 'next/link';
import { notFound } from 'next/navigation';
import { POEMS } from '@/lib/poems';
import { SearchForm } from './SearchForm';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Add video — qed'bop",
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ slug: string }> };

export default async function AddVideoPage({ params }: Props) {
  const { slug } = await params;
  const poem = POEMS.find((p) => p.slug === slug);
  if (!poem) notFound();

  return (
    <main className="page">
      <header style={{ marginBottom: '2rem' }}>
        <Link
          href="/admin"
          className="chrome"
          style={{ color: 'var(--ink)', textDecoration: 'none' }}
        >
          ← Back to admin
        </Link>
        <p className="chrome" style={{ marginTop: '0.75rem' }}>
          Add a video to
        </p>
        <h1
          style={{
            fontFamily: 'Georgia, "Source Serif Pro", serif',
            fontSize: '1.75rem',
            fontWeight: 600,
            margin: '0.25rem 0 0 0',
          }}
        >
          {poem.title}
        </h1>
        <p className="chrome" style={{ marginTop: '0.25rem' }}>
          {poem.author} &middot; {poem.year}
        </p>
      </header>

      <SearchForm
        poemSlug={poem.slug}
        defaultQuery={`${poem.title} ${poem.author}`}
      />
    </main>
  );
}
