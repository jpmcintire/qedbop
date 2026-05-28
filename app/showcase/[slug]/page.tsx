import Link from 'next/link';
import { notFound } from 'next/navigation';
import { POEMS } from '@/lib/poems';
import {
  getShowcase,
  buildShowcaseUrls,
  audienceTierLabel,
  modeLabel,
  modeDescription,
  type ShowcaseMode,
} from '@/lib/showcase';
import { UrlBlock } from '@/app/_components';

type Props = { params: Promise<{ slug: string }> };

export const metadata = {
  title: "Lesson — qed'bop",
  description: 'A showcase lesson on qed’bop.',
};

export default async function ShowcaseLaunchPage({ params }: Props) {
  const { slug } = await params;
  const lesson = getShowcase(slug);
  if (!lesson) notFound();

  const poem = POEMS.find((p) => p.slug === lesson.poemSlug);
  if (!poem) notFound();

  const urls = buildShowcaseUrls(lesson);
  const videos = urls.videoIds
    .map((id) => poem.versions.find((v) => v.youtubeId === id))
    .filter((v): v is NonNullable<typeof v> => !!v);

  return (
    <main className="page">
      <p style={{ margin: '0.5rem 0 1rem 0' }}>
        <Link href="/" className="chrome" style={{ color: 'var(--ink)', textDecoration: 'none' }}>
          ← qed&rsquo;bop
        </Link>
      </p>

      <header style={{ marginBottom: '1.75rem' }}>
        <span
          className="audience-pill"
          style={{
            display: 'inline-block',
            padding: '0.1875rem 0.625rem',
            borderRadius: '9999px',
            background: 'rgba(27, 27, 26, 0.06)',
            fontSize: '0.6875rem',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          {audienceTierLabel(lesson.audience)}
        </span>
        <h1
          style={{
            fontFamily: 'Georgia, "Source Serif Pro", serif',
            fontSize: '2.25rem',
            fontWeight: 600,
            lineHeight: 1.15,
            margin: '0.625rem 0 0.25rem 0',
          }}
        >
          {poem.title}
        </h1>
        <p className="chrome" style={{ marginTop: '0.25rem' }}>
          {poem.author} &middot; {poem.year}
        </p>
      </header>

      {videos.length > 0 && (
        <section style={{ marginBottom: '2rem' }}>
          <div
            style={{
              display: 'grid',
              gap: '1.25rem',
              gridTemplateColumns:
                videos.length === 1 ? '1fr' : 'repeat(auto-fit, minmax(280px, 1fr))',
            }}
          >
            {videos.map((v) => (
              <div key={v.youtubeId}>
                <p className="chrome" style={{ marginBottom: '0.5rem' }}>{v.label}</p>
                <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${v.youtubeId}`}
                    title={`${poem.title} — ${v.label}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      border: 0,
                      borderRadius: '0.5rem',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section style={{ marginBottom: '2rem' }}>
        <p
          style={{
            fontFamily: 'Georgia, "Source Serif Pro", serif',
            fontSize: '1.0625rem',
            lineHeight: 1.6,
            maxWidth: '40rem',
            margin: 0,
          }}
          dangerouslySetInnerHTML={{ __html: lesson.blurb }}
        />
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2
          style={{
            fontFamily: 'Georgia, "Source Serif Pro", serif',
            fontSize: '1.25rem',
            fontWeight: 600,
            margin: '0 0 0.875rem 0',
          }}
        >
          Share with students
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {(['in-class', 'at-home'] as ShowcaseMode[]).map((mode) => {
            const url = urls.studentUrls[mode];
            if (!url) return null;
            return (
              <UrlBlock
                key={mode}
                label={modeLabel(mode)}
                description={modeDescription(mode)}
                relativeUrl={url}
              />
            );
          })}
        </div>
      </section>

      <section style={{ marginBottom: '3rem' }}>
        <h2
          style={{
            fontFamily: 'Georgia, "Source Serif Pro", serif',
            fontSize: '1.25rem',
            fontWeight: 600,
            margin: '0 0 0.875rem 0',
          }}
        >
          Teacher edition
        </h2>
        <p style={{ fontSize: '0.9375rem', margin: '0 0 0.875rem 0', maxWidth: '40rem' }}>
          A page just for you, with poet bio, historical context, a suggested class agenda,
          per-question teaching commentary, and a chat panel for follow-up questions.
          Includes a prep podcast tailored to this exact lesson.
        </p>
        <UrlBlock
          label="Open teacher edition"
          description="Bookmark or share with co-teachers. Not for students."
          relativeUrl={urls.teacherUrl}
          accent
        />
      </section>

      <footer className="hairline" style={{ marginTop: '2.5rem', paddingTop: '1.25rem' }}>
        <p className="chrome">
          A teaching tool, not a tracking tool. Anonymous from the student&rsquo;s side.{' '}
          <Link href="/" style={{ color: 'inherit' }}>Back to qed&rsquo;bop</Link>
        </p>
      </footer>
    </main>
  );
}
