import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPoem } from '@/lib/poems';
import { getPoemEnriched } from '@/lib/poems-runtime';
import { TopNav } from '../../_components/TopNav';

type Props = { params: Promise<{ slug: string }> };

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const poem = getPoem(slug);
  if (!poem) return { title: 'Library — qed’bop' };
  return {
    title: `${poem.title} — Library — qed’bop`,
    description: `${poem.title} by ${poem.author}: musical settings available on qed’bop.`,
  };
}

export default async function LibraryPoemPage({ params }: Props) {
  const { slug } = await params;
  const poem = await getPoemEnriched(slug);
  if (!poem) notFound();

  return (
    <main className="page">
      <TopNav current="library" />
      <header style={{ marginBottom: '2.5rem' }}>
        <p style={{ marginBottom: '0.5rem' }}>
          <Link
            href="/library"
            className="chrome"
            style={{ color: 'var(--muted)', textDecoration: 'none' }}
          >
            ← Back to library
          </Link>
        </p>
        <p className="chrome" style={{ marginBottom: '0.25rem' }}>
          {poem.author} &middot; {poem.year}
        </p>
        <h1
          style={{
            fontFamily: 'Georgia, "Source Serif Pro", serif',
            fontSize: '2.25rem',
            fontWeight: 600,
            lineHeight: 1.15,
            margin: 0,
          }}
        >
          {poem.title}
        </h1>
      </header>

      <section style={{ marginBottom: '3rem' }}>
        <pre className="poem">{poem.text}</pre>
      </section>

      <section>
        <h2
          style={{
            fontFamily: 'Georgia, "Source Serif Pro", serif',
            fontSize: '1.5rem',
            fontWeight: 600,
            margin: '0 0 1rem 0',
          }}
        >
          Musical settings
        </h2>
        <p style={{ color: 'var(--muted)', maxWidth: '46rem', marginBottom: '1.5rem' }}>
          {poem.versions.length === 0
            ? 'No settings attached yet.'
            : `${poem.versions.length} setting${poem.versions.length === 1 ? '' : 's'} of this poem. Listen, read the notes, get a feel for what each one argues.`}
        </p>

        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '2rem' }}>
          {poem.versions.map((v) => (
            <li key={v.youtubeId}>
              <article
                style={{
                  padding: '1rem 1.25rem',
                  border: '1px solid var(--rule)',
                  borderRadius: '0.5rem',
                }}
              >
                <header style={{ marginBottom: '0.75rem' }}>
                  <h3
                    style={{
                      fontFamily: 'Georgia, "Source Serif Pro", serif',
                      fontSize: '1.125rem',
                      fontWeight: 600,
                      margin: '0 0 0.25rem 0',
                    }}
                  >
                    {v.label}
                  </h3>
                  <p className="chrome" style={{ margin: 0 }}>
                    {[v.artist, v.genre, v.vocalCharacter, v.recordingYear, formatDuration(v.durationSeconds)]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </header>

                <div
                  style={{
                    position: 'relative',
                    paddingBottom: '56.25%',
                    height: 0,
                    overflow: 'hidden',
                    borderRadius: '0.375rem',
                    marginBottom: v.themes ? '0.75rem' : 0,
                  }}
                >
                  <iframe
                    src={`https://www.youtube.com/embed/${v.youtubeId}`}
                    title={`${poem.title} — ${v.label}`}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      border: 0,
                    }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>

                {v.themes && (
                  <p
                    style={{
                      color: 'var(--muted)',
                      fontSize: '0.9375rem',
                      lineHeight: 1.55,
                      marginTop: '0.75rem',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {v.themes}
                  </p>
                )}
              </article>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

function formatDuration(seconds?: number): string | null {
  if (!seconds) return null;
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min}:${String(sec).padStart(2, '0')}`;
}
