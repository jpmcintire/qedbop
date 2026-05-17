import { Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPoem, audienceLabel, type Poem, type Version } from '@/lib/poems';
import { generateQuestions } from '@/lib/generate-questions';

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    v?: string | string[];
    audience?: string;
    q?: string;
  }>;
};

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const poem = getPoem(slug);
  if (!poem) return { title: "qed'bop" };
  return {
    title: `${poem.title} — qed'bop`,
    description: `${poem.title} by ${poem.author}, with musical settings.`,
  };
}

export default async function ViewerPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const search = await searchParams;

  const poem = getPoem(slug);
  if (!poem) notFound();

  const ids = Array.isArray(search.v) ? search.v : search.v ? [search.v] : [];
  const versions = ids
    .map((id) => poem.versions.find((ver) => ver.youtubeId === id))
    .filter((x): x is NonNullable<typeof x> => !!x);

  if (versions.length === 0) notFound();

  const audience = audienceLabel(search.audience);
  const requestedQuestions = Math.max(0, parseInt(search.q ?? '0', 10) || 0);
  const audienceSlug = search.audience || '';

  return (
    <main className="page">
      <header style={{ marginBottom: '2.5rem' }}>
        <Link
          href="/"
          className="wordmark"
          style={{ color: 'var(--ink)', fontSize: '1.25rem', textDecoration: 'none' }}
        >
          qed&rsquo;bop
        </Link>
      </header>

      <article>
        {audience && (
          <p className="chrome" style={{ marginBottom: '0.5rem' }}>
            For {audience}
          </p>
        )}

        <h1
          style={{
            fontFamily: 'Georgia, "Source Serif Pro", serif',
            fontSize: '2.5rem',
            fontWeight: 600,
            lineHeight: 1.15,
            margin: 0,
          }}
        >
          {poem.title}
        </h1>
        <p className="chrome" style={{ marginTop: '0.5rem' }}>
          {poem.author} &middot; {poem.year}
        </p>

        <section style={{ marginTop: '2.5rem', maxWidth: '38rem' }}>
          <pre className="poem">{poem.text}</pre>
        </section>

        <section style={{ marginTop: '3rem' }}>
          <p className="chrome" style={{ marginBottom: '1rem' }}>Listen</p>
          <div
            style={{
              display: 'grid',
              gap: '1.5rem',
              gridTemplateColumns:
                versions.length === 1 ? '1fr' : 'repeat(auto-fit, minmax(320px, 1fr))',
            }}
          >
            {versions.map((ver) => (
              <div key={ver.youtubeId}>
                <p className="chrome" style={{ marginBottom: '0.5rem' }}>{ver.label}</p>
                <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${ver.youtubeId}`}
                    title={`${poem.title} — ${ver.label}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      border: 0,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {requestedQuestions > 0 && audienceSlug && (
          <Suspense fallback={<QuestionsLoading count={requestedQuestions} audience={audience} />}>
            <Questions
              poem={poem}
              versions={versions}
              audienceSlug={audienceSlug}
              audienceLabel={audience}
              count={requestedQuestions}
            />
          </Suspense>
        )}

        <footer className="hairline" style={{ marginTop: '3rem', paddingTop: '1.5rem' }}>
          <p className="chrome">
            Built with qed&rsquo;bop &middot;{' '}
            <Link href="/" style={{ color: 'inherit' }}>make your own</Link>
          </p>
        </footer>
      </article>
    </main>
  );
}

async function Questions({
  poem,
  versions,
  audienceSlug,
  audienceLabel,
  count,
}: {
  poem: Poem;
  versions: Version[];
  audienceSlug: string;
  audienceLabel?: string;
  count: number;
}) {
  const { questions, source } = await generateQuestions(
    {
      slug: poem.slug,
      audience: audienceSlug,
      count,
      versionLabels: versions.map((v) => v.label),
    },
    poem
  );

  return (
    <section style={{ marginTop: '3rem', maxWidth: '38rem' }}>
      <p className="chrome" style={{ marginBottom: '0.5rem' }}>Discussion</p>
      <p
        style={{
          color: 'var(--muted)',
          fontSize: '0.8125rem',
          marginBottom: '0.5rem',
          fontStyle: 'italic',
        }}
      >
        {source === 'ai' ? (
          <>Generated for {audienceLabel ?? 'this audience'} by Claude Opus 4.7.</>
        ) : (
          <>Starter questions (AI generation unavailable).</>
        )}
      </p>
      <p
        style={{
          color: 'var(--muted)',
          fontSize: '0.875rem',
          marginBottom: '1.25rem',
          fontStyle: 'italic',
        }}
      >
        Strong responses describe specific moments in the music.
        &ldquo;The song felt sad&rdquo; is not enough.
      </p>
      <ol
        style={{
          fontFamily: 'Georgia, "Source Serif Pro", serif',
          fontSize: '1.0625rem',
          lineHeight: 1.7,
          paddingLeft: '1.5rem',
          margin: 0,
        }}
      >
        {questions.map((q, i) => (
          <li key={i} style={{ marginBottom: '1rem' }}>
            {q}
          </li>
        ))}
      </ol>
    </section>
  );
}

function QuestionsLoading({ count, audience }: { count: number; audience?: string }) {
  return (
    <section style={{ marginTop: '3rem', maxWidth: '38rem' }}>
      <p className="chrome" style={{ marginBottom: '0.5rem' }}>Discussion</p>
      <p style={{ color: 'var(--muted)', fontSize: '0.8125rem', fontStyle: 'italic' }}>
        Generating {count} question{count === 1 ? '' : 's'}
        {audience ? ` for ${audience}` : ''} with Claude Opus 4.7&hellip;
      </p>
      <div style={{ marginTop: '1.25rem' }}>
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            style={{
              height: '1rem',
              background: 'var(--rule)',
              borderRadius: '0.25rem',
              marginBottom: '0.75rem',
              width: `${85 - (i % 3) * 15}%`,
              opacity: 0.5,
            }}
          />
        ))}
      </div>
    </section>
  );
}
