import Link from 'next/link';
import { POEMS } from '@/lib/poems';
import { prisma } from '@/lib/db';
import { WipePrepPodcastsButton } from './WipePrepPodcastsButton';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Admin — qed'bop",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  // Pull all annotation rows so the list can show which videos have been
  // edited vs. which still rely on static defaults.
  let annotations: Array<{ youtubeId: string; updatedAt: Date }> = [];
  let attached: Array<{
    poemSlug: string;
    youtubeId: string;
    label: string | null;
    position: number;
  }> = [];
  try {
    annotations = await prisma.videoAnnotation.findMany({
      select: { youtubeId: true, updatedAt: true },
    });
  } catch (err) {
    console.error('[admin] DB read failed:', err);
  }
  try {
    attached = await prisma.poemVideo.findMany({
      orderBy: { position: 'asc' },
      select: { poemSlug: true, youtubeId: true, label: true, position: true },
    });
  } catch (err) {
    console.error('[admin] PoemVideo read failed:', err);
  }

  const edited = new Map(annotations.map((a) => [a.youtubeId, a.updatedAt]));
  const attachedByPoem = new Map<string, typeof attached>();
  for (const row of attached) {
    if (!attachedByPoem.has(row.poemSlug)) attachedByPoem.set(row.poemSlug, []);
    attachedByPoem.get(row.poemSlug)!.push(row);
  }

  return (
    <main className="page">
      <header style={{ marginBottom: '2.5rem' }}>
        <Link
          href="/"
          className="wordmark"
          style={{ color: 'var(--ink)', fontSize: '1.5rem', textDecoration: 'none' }}
        >
          qed&rsquo;bop
        </Link>
        <p className="chrome" style={{ marginTop: '0.25rem' }}>Admin · Videos</p>
      </header>

      <p style={{ color: 'var(--muted)', maxWidth: '46rem', marginBottom: '1rem' }}>
        Edit per-video annotations: genre, duration, vocal character, artist, year, interpretive themes (safe for student-facing AI), and teacher-only timestamped notes (used only in teacher edition + chat). Changes take effect on next AI generation; existing cached generations bust automatically when the underlying data changes.
      </p>

      <p style={{ marginBottom: '0.5rem' }}>
        <Link href="/admin/poets" className="chrome" style={{ color: 'var(--ink)' }}>
          Edit per-poet special facts →
        </Link>
      </p>
      <p style={{ marginBottom: '0.5rem' }}>
        <Link href="/admin/usage" className="chrome" style={{ color: 'var(--ink)' }}>
          API usage and cost →
        </Link>
      </p>
      <p style={{ marginBottom: '1rem' }}>
        <Link href="/admin/channel" className="chrome" style={{ color: 'var(--ink)' }}>
          YouTube channel — browse &amp; attach videos →
        </Link>
      </p>

      <div style={{ marginBottom: '2rem' }}>
        <WipePrepPodcastsButton />
      </div>

      {POEMS.map((poem) => (
        <section key={poem.slug} style={{ marginBottom: '2.5rem' }}>
          <p className="chrome" style={{ marginBottom: '0.5rem' }}>
            {poem.author} &middot; {poem.year}
          </p>
          <h2
            style={{
              fontFamily: 'Georgia, "Source Serif Pro", serif',
              fontSize: '1.5rem',
              fontWeight: 600,
              margin: '0 0 0.875rem 0',
            }}
          >
            {poem.title}
          </h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.5rem' }}>
            {poem.versions.map((v) => {
              const editedAt = edited.get(v.youtubeId);
              return (
                <li key={v.youtubeId}>
                  <Link
                    href={`/admin/videos/${v.youtubeId}`}
                    style={rowStyle}
                  >
                    <span>
                      <span style={{ fontFamily: 'Georgia, serif', fontSize: '1.0625rem' }}>
                        {v.label}
                      </span>
                      <span className="chrome" style={{ marginLeft: '0.75rem' }}>
                        youtu.be/{v.youtubeId}
                      </span>
                    </span>
                    <span className="chrome" style={{ color: editedAt ? 'var(--ink)' : 'var(--muted)' }}>
                      {editedAt
                        ? `Edited ${editedAt.toLocaleDateString()}`
                        : 'Defaults only'}
                    </span>
                  </Link>
                </li>
              );
            })}
            {(attachedByPoem.get(poem.slug) ?? []).map((row, i) => {
              const editedAt = edited.get(row.youtubeId);
              const displayLabel = row.label ?? `Version ${poem.versions.length + i + 1}`;
              return (
                <li key={row.youtubeId}>
                  <Link href={`/admin/videos/${row.youtubeId}`} style={rowStyle}>
                    <span>
                      <span style={{ fontFamily: 'Georgia, serif', fontSize: '1.0625rem' }}>
                        {displayLabel}
                      </span>
                      <span className="chrome" style={{ marginLeft: '0.75rem' }}>
                        youtu.be/{row.youtubeId}
                      </span>
                      <span
                        className="chrome"
                        style={{ marginLeft: '0.5rem', fontStyle: 'italic' }}
                      >
                        attached
                      </span>
                    </span>
                    <span className="chrome" style={{ color: editedAt ? 'var(--ink)' : 'var(--muted)' }}>
                      {editedAt ? `Edited ${editedAt.toLocaleDateString()}` : 'Defaults only'}
                    </span>
                  </Link>
                </li>
              );
            })}
            <li>
              <Link
                href={`/admin/poems/${poem.slug}/add-video`}
                style={{
                  ...rowStyle,
                  borderStyle: 'dashed',
                  color: 'var(--muted)',
                  justifyContent: 'center',
                }}
              >
                + Add a video to this poem
              </Link>
            </li>
          </ul>
        </section>
      ))}
    </main>
  );
}

const rowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0.75rem 1rem',
  border: '1px solid var(--rule)',
  borderRadius: '0.5rem',
  textDecoration: 'none',
  color: 'var(--ink)',
};
