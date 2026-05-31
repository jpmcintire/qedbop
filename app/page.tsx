import Link from 'next/link';
import { POEMS } from '@/lib/poems';
import {
  SHOWCASE_LESSONS,
  audienceTierLabel,
  modeLabel,
  type ShowcaseLesson,
} from '@/lib/showcase';
import { TopNav } from './_components/TopNav';

export const metadata = {
  title: "qed’bop",
  description: 'Shareable poem-and-music lessons for teachers.',
};

export default function Landing() {
  return (
    <main className="page">
      <TopNav current="home" />
      <header style={{ marginBottom: '1.75rem' }}>
        <p className="chrome" style={{ margin: 0 }}>
          Poems set to music · lessons that demand close listening
        </p>
      </header>

      <section style={{ marginBottom: '2.25rem', maxWidth: '40rem' }}>
        <p
          style={{
            fontFamily: 'Georgia, "Source Serif Pro", serif',
            fontSize: '1.125rem',
            lineHeight: 1.55,
            margin: 0,
          }}
        >
          Three lessons, three audiences. Tap any to see the student link
          and the teacher edition — including a prep podcast for the way
          you&rsquo;re actually going to teach it.
        </p>
      </section>

      <section className="showcase-grid" aria-label="Featured lessons">
        {SHOWCASE_LESSONS.map((lesson) => (
          <ShowcaseCard key={lesson.key} lesson={lesson} />
        ))}
      </section>

      <footer
        className="hairline"
        style={{ marginTop: '3rem', paddingTop: '1.25rem' }}
      >
        <p className="chrome">
          A teaching tool, not a tracking tool. Anonymous from the student&rsquo;s side.{' '}
          <Link href="/admin" style={{ color: 'inherit' }}>
            Admin
          </Link>
        </p>
      </footer>
    </main>
  );
}

function ShowcaseCard({ lesson }: { lesson: ShowcaseLesson }) {
  const poem = POEMS.find((p) => p.slug === lesson.poemSlug);
  if (!poem) return null;

  // Use the first video's YouTube thumbnail when there is one, otherwise
  // render a stylized text placeholder so the card still composes.
  const firstVideoId =
    lesson.versionIds?.[0] ?? poem.versions[0]?.youtubeId ?? null;
  const thumbnailUrl = firstVideoId
    ? `https://i.ytimg.com/vi/${firstVideoId}/hqdefault.jpg`
    : null;

  return (
    <Link href={`/showcase/${lesson.key}`} className="showcase-card">
      <div className="thumb">
        {thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumbnailUrl} alt="" loading="lazy" />
        ) : (
          <div className="placeholder">
            {poem.title}
            <br />
            <span style={{ fontSize: '0.8125rem', opacity: 0.7 }}>
              {poem.author}
            </span>
          </div>
        )}
      </div>
      <div className="body">
        <span className="audience-pill">{audienceTierLabel(lesson.audience)}</span>
        <div className="modes">{lesson.modes.map(modeLabel).join(' · ')}</div>
        <h3>{poem.title}</h3>
        <p className="author">
          {poem.author} &middot; {poem.year}
        </p>
        <p
          className="blurb"
          dangerouslySetInnerHTML={{ __html: lesson.blurb }}
        />
        <p className="cta">View this lesson →</p>
      </div>
    </Link>
  );
}
