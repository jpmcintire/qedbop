import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPoem, audienceLabel, lengthLabel } from '@/lib/poems';
import { isExpired, formatExpirationFriendly } from '@/lib/expiration';

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    v?: string | string[];
    audience?: string;
    q?: string | string[];
    exp?: string;
    len?: string | string[];
  }>;
};

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const poem = getPoem(slug);
  if (!poem) return { title: "qed'bop" };
  return {
    title: `${poem.title} — qed'bop`,
    description: `${poem.title} by ${poem.author}, with musical settings.`,
    robots: { index: false, follow: false },
  };
}

export default async function ViewerPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const search = await searchParams;

  const poem = getPoem(slug);
  if (!poem) notFound();

  // Expiration is checked before anything else — if the link has expired,
  // show the expired page instead of the assignment. Missing exp param
  // counts as "no expiration" (back-compat with older URLs).
  if (isExpired(search.exp)) {
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
        <article style={{ maxWidth: '38rem' }}>
          <p className="chrome" style={{ marginBottom: '0.5rem' }}>Expired</p>
          <h1
            style={{
              fontFamily: 'Georgia, "Source Serif Pro", serif',
              fontSize: '2.5rem',
              fontWeight: 600,
              lineHeight: 1.15,
              margin: 0,
            }}
          >
            This assignment has expired.
          </h1>
          <p
            style={{
              fontFamily: 'Georgia, "Source Serif Pro", serif',
              fontSize: '1.0625rem',
              lineHeight: 1.7,
              marginTop: '1.5rem',
              color: 'var(--muted)',
            }}
          >
            The teacher who created this link set it to expire on{' '}
            {formatExpirationFriendly(search.exp)}. Ask them for an updated link
            if you still need to do the assignment.
          </p>
          <footer className="hairline" style={{ marginTop: '3rem', paddingTop: '1.5rem' }}>
            <p className="chrome">
              <Link href="/" style={{ color: 'inherit' }}>qed&rsquo;bop</Link> &middot; public-domain poems set to music
            </p>
          </footer>
        </article>
      </main>
    );
  }

  const videoIds = Array.isArray(search.v) ? search.v : search.v ? [search.v] : [];
  const versions = videoIds
    .map((id) => poem.versions.find((ver) => ver.youtubeId === id))
    .filter((x): x is NonNullable<typeof x> => !!x);

  if (versions.length === 0) notFound();

  const audience = audienceLabel(search.audience);

  // Questions arrive as ?q=text&q=text. Each string is one whole question.
  // Bare-integer values (legacy URLs from before the editable-questions
  // change) are filtered out.
  const rawQuestions = Array.isArray(search.q) ? search.q : search.q ? [search.q] : [];
  const questions = rawQuestions
    .map((q) => q.trim())
    .filter((q) => q.length > 0 && !/^\d+$/.test(q));

  // Response length(s) chosen by the teacher. Shown as guidance above
  // the questions so students know what's expected.
  const lengthValues = Array.isArray(search.len) ? search.len : search.len ? [search.len] : [];
  const lengthLabels = lengthValues
    .map((v) => lengthLabel(search.audience ?? 'high-school', v))
    .filter((x): x is string => !!x);

  const expiresOn = formatExpirationFriendly(search.exp);

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

        {questions.length > 0 && (
          <section style={{ marginTop: '3rem' }}>
            <p className="chrome" style={{ marginBottom: '0.5rem' }}>Discussion</p>
            {lengthLabels.length > 0 && (
              <p
                style={{
                  color: 'var(--muted)',
                  fontSize: '0.875rem',
                  marginBottom: '0.5rem',
                }}
              >
                Aim for responses of approximately:{' '}
                <span style={{ color: 'var(--ink)' }}>{lengthLabels.join(' / ')}</span>.
              </p>
            )}
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
        )}

        <footer className="hairline" style={{ marginTop: '3rem', paddingTop: '1.5rem' }}>
          <p className="chrome">
            Built with qed&rsquo;bop &middot;{' '}
            <Link href="/" style={{ color: 'inherit' }}>make your own</Link>
            {expiresOn ? ` · expires ${expiresOn}` : ''}
          </p>
        </footer>
      </article>
    </main>
  );
}
