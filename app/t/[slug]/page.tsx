import { Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPoem, audienceLabel, lengthLabel } from '@/lib/poems';
import { isExpired, formatExpirationFriendly } from '@/lib/expiration';
import { generateTeacherEdition, type TeacherEdition } from '@/lib/generate-teacher-edition';

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
    title: `${poem.title} — Teacher edition — qed'bop`,
    description: `Teacher edition: ${poem.title} by ${poem.author}.`,
    robots: { index: false, follow: false },
  };
}

export default async function TeacherPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const search = await searchParams;

  const poem = getPoem(slug);
  if (!poem) notFound();

  // Same expiration semantics as the student page.
  if (isExpired(search.exp)) {
    return <ExpiredCard expIso={search.exp} />;
  }

  const videoIds = Array.isArray(search.v) ? search.v : search.v ? [search.v] : [];
  const versions = videoIds
    .map((id) => poem.versions.find((ver) => ver.youtubeId === id))
    .filter((x): x is NonNullable<typeof x> => !!x);

  if (versions.length === 0) notFound();

  const audience = audienceLabel(search.audience);
  const audienceSlug = search.audience ?? 'high-school';

  const rawQuestions = Array.isArray(search.q) ? search.q : search.q ? [search.q] : [];
  const questions = rawQuestions
    .map((q) => q.trim())
    .filter((q) => q.length > 0 && !/^\d+$/.test(q));

  const lengthValues = Array.isArray(search.len) ? search.len : search.len ? [search.len] : [];
  const lengthLabels = lengthValues
    .map((v) => lengthLabel(search.audience ?? 'high-school', v))
    .filter((x): x is string => !!x);

  const expiresOn = formatExpirationFriendly(search.exp);
  const studentUrl = `/a/${poem.slug}?${new URLSearchParams(
    [
      ...videoIds.map((id) => ['v', id] as [string, string]),
      ...(search.audience ? [['audience', search.audience] as [string, string]] : []),
      ...lengthValues.map((l) => ['len', l] as [string, string]),
      ...rawQuestions.map((q) => ['q', q] as [string, string]),
      ...(search.exp ? [['exp', search.exp] as [string, string]] : []),
    ].map(([k, v]) => [k, v]),
  ).toString()}`;

  return (
    <main className="page">
      <TeacherHeader studentUrl={studentUrl} expiresOn={expiresOn} />

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

        <Suspense fallback={<TeacherSectionsLoading />}>
          <TeacherSections
            slug={poem.slug}
            audience={audienceSlug}
            versionIds={videoIds}
            questions={questions}
          />
        </Suspense>

        <section style={{ marginTop: '2.5rem', maxWidth: '38rem' }}>
          <p className="chrome" style={{ marginBottom: '0.5rem' }}>Poem text</p>
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
          <Suspense fallback={<QuestionCommentaryLoading questions={questions} lengthLabels={lengthLabels} />}>
            <QuestionsWithCommentary
              slug={poem.slug}
              audience={audienceSlug}
              versionIds={videoIds}
              questions={questions}
              lengthLabels={lengthLabels}
            />
          </Suspense>
        )}

        <footer className="hairline" style={{ marginTop: '3rem', paddingTop: '1.5rem' }}>
          <p className="chrome">
            qed&rsquo;bop &middot; teacher edition
            {expiresOn ? ` · expires ${expiresOn}` : ''}
          </p>
        </footer>
      </article>
    </main>
  );
}

function TeacherHeader({
  studentUrl,
  expiresOn,
}: {
  studentUrl: string;
  expiresOn: string | null;
}) {
  return (
    <header
      style={{
        marginBottom: '2rem',
        paddingBottom: '1.5rem',
        borderBottom: '1px solid var(--rule)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: '1rem',
        }}
      >
        <div>
          <Link
            href="/"
            className="wordmark"
            style={{ color: 'var(--ink)', fontSize: '1.25rem', textDecoration: 'none' }}
          >
            qed&rsquo;bop
          </Link>
          <p className="chrome" style={{ marginTop: '0.25rem' }}>
            Teacher edition
          </p>
        </div>
        <a
          href={studentUrl}
          target="_blank"
          rel="noreferrer"
          className="btn btn-ghost"
          style={{ fontSize: '0.75rem', padding: '0.375rem 0.875rem', textDecoration: 'none' }}
        >
          Open student view ↗
        </a>
      </div>
    </header>
  );
}

async function TeacherSections({
  slug,
  audience,
  versionIds,
  questions,
}: {
  slug: string;
  audience: string;
  versionIds: string[];
  questions: string[];
}) {
  const poem = getPoem(slug);
  if (!poem) return null;
  const versions = versionIds
    .map((id) => poem.versions.find((v) => v.youtubeId === id))
    .filter((x): x is NonNullable<typeof x> => !!x);

  const edition: TeacherEdition | null = await generateTeacherEdition(
    poem,
    audience,
    versions.map((v) => v.label),
    questions,
  );

  if (!edition) return null;

  return (
    <>
      <TeacherSection label="Suggested class agenda">
        <ol
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}
        >
          {edition.classAgenda.map((item, i) => (
            <li
              key={i}
              style={{
                display: 'grid',
                gridTemplateColumns: '4rem 1fr',
                gap: '0.75rem',
                alignItems: 'baseline',
                paddingBottom: '0.5rem',
                borderBottom: '1px dotted var(--rule)',
              }}
            >
              <span
                className="chrome"
                style={{ textAlign: 'right', color: 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}
              >
                {item.minutes} min
              </span>
              <span
                style={{
                  fontFamily: 'Georgia, "Source Serif Pro", serif',
                  fontSize: '1rem',
                  lineHeight: 1.6,
                }}
              >
                {item.activity}
              </span>
            </li>
          ))}
        </ol>
      </TeacherSection>

      <TeacherSection label="About the poet">
        <p
          style={{
            fontFamily: 'Georgia, "Source Serif Pro", serif',
            fontSize: '1.0625rem',
            lineHeight: 1.7,
          }}
        >
          {edition.poetBio}
        </p>
      </TeacherSection>

      <TeacherSection label="Historical context">
        <p
          style={{
            fontFamily: 'Georgia, "Source Serif Pro", serif',
            fontSize: '1.0625rem',
            lineHeight: 1.7,
          }}
        >
          {edition.historicalContext}
        </p>
      </TeacherSection>
    </>
  );
}

async function QuestionsWithCommentary({
  slug,
  audience,
  versionIds,
  questions,
  lengthLabels,
}: {
  slug: string;
  audience: string;
  versionIds: string[];
  questions: string[];
  lengthLabels: string[];
}) {
  const poem = getPoem(slug);
  if (!poem) return null;
  const versions = versionIds
    .map((id) => poem.versions.find((v) => v.youtubeId === id))
    .filter((x): x is NonNullable<typeof x> => !!x);

  const edition: TeacherEdition | null = await generateTeacherEdition(
    poem,
    audience,
    versions.map((v) => v.label),
    questions,
  );

  return (
    <section style={{ marginTop: '3rem', maxWidth: '46rem' }}>
      <p className="chrome" style={{ marginBottom: '0.5rem' }}>Discussion questions</p>
      {lengthLabels.length > 0 && (
        <p
          style={{
            color: 'var(--muted)',
            fontSize: '0.875rem',
            marginBottom: '0.5rem',
          }}
        >
          Students aim for responses of approximately:{' '}
          <span style={{ color: 'var(--ink)' }}>{lengthLabels.join(' / ')}</span>.
        </p>
      )}
      <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '1.5rem' }}>
        {questions.map((q, i) => {
          const commentary = edition?.questionCommentary[i] ?? '';
          return (
            <li key={i}>
              <p
                style={{
                  fontFamily: 'Georgia, "Source Serif Pro", serif',
                  fontSize: '1.0625rem',
                  lineHeight: 1.6,
                  margin: '0 0 0.625rem 0',
                }}
              >
                <span className="chrome" style={{ marginRight: '0.5rem' }}>
                  {i + 1}.
                </span>
                {q}
              </p>
              {commentary && (
                <div
                  style={{
                    borderLeft: '2px solid var(--ink)',
                    paddingLeft: '0.875rem',
                    marginLeft: '0.5rem',
                  }}
                >
                  <p
                    className="chrome"
                    style={{ marginBottom: '0.25rem', color: 'var(--ink)' }}
                  >
                    For teachers
                  </p>
                  <p
                    style={{
                      fontSize: '0.9375rem',
                      lineHeight: 1.6,
                      color: 'var(--muted)',
                    }}
                  >
                    {commentary}
                  </p>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function TeacherSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section style={{ marginTop: '2.5rem', maxWidth: '38rem' }}>
      <p className="chrome" style={{ marginBottom: '0.75rem' }}>{label}</p>
      {children}
    </section>
  );
}

function TeacherSectionsLoading() {
  return (
    <div style={{ marginTop: '2.5rem', maxWidth: '38rem' }}>
      <p className="chrome" style={{ marginBottom: '0.5rem' }}>
        Generating teacher-edition content with Claude Opus 4.7&hellip;
      </p>
      {[80, 65, 75, 60].map((w, i) => (
        <div
          key={i}
          style={{
            height: '0.875rem',
            background: 'var(--rule)',
            borderRadius: '0.25rem',
            marginBottom: '0.5rem',
            width: `${w}%`,
            opacity: 0.5,
          }}
        />
      ))}
    </div>
  );
}

function QuestionCommentaryLoading({
  questions,
  lengthLabels,
}: {
  questions: string[];
  lengthLabels: string[];
}) {
  return (
    <section style={{ marginTop: '3rem', maxWidth: '46rem' }}>
      <p className="chrome" style={{ marginBottom: '0.5rem' }}>Discussion questions</p>
      {lengthLabels.length > 0 && (
        <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
          Students aim for responses of approximately:{' '}
          <span style={{ color: 'var(--ink)' }}>{lengthLabels.join(' / ')}</span>.
        </p>
      )}
      <p style={{ color: 'var(--muted)', fontSize: '0.8125rem', fontStyle: 'italic' }}>
        Loading per-question teaching commentary&hellip;
      </p>
      <ol style={{ listStyle: 'none', padding: 0, margin: '1rem 0 0 0', display: 'grid', gap: '1.5rem' }}>
        {questions.map((q, i) => (
          <li key={i}>
            <p
              style={{
                fontFamily: 'Georgia, "Source Serif Pro", serif',
                fontSize: '1.0625rem',
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              <span className="chrome" style={{ marginRight: '0.5rem' }}>{i + 1}.</span>
              {q}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function ExpiredCard({ expIso }: { expIso: string | undefined }) {
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
          This teacher edition has expired.
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
          It was set to expire on {formatExpirationFriendly(expIso)}. Rebuild it from the home page
          to refresh.
        </p>
      </article>
    </main>
  );
}
