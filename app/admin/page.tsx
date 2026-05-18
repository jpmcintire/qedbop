import Link from 'next/link';
import { POEMS } from '@/lib/poems';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Admin — qed'bop",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  // Pull all annotation rows so the list can show which videos have been
  // edited vs. which still rely on static defaults.
  let annotations: Array<{ youtubeId: string; updatedAt: Date }> = [];
  try {
    annotations = await prisma.videoAnnotation.findMany({
      select: { youtubeId: true, updatedAt: true },
    });
  } catch (err) {
    console.error('[admin] DB read failed:', err);
  }

  const edited = new Map(annotations.map((a) => [a.youtubeId, a.updatedAt]));

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

      <p style={{ color: 'var(--muted)', maxWidth: '46rem', marginBottom: '2rem' }}>
        Edit per-video annotations: genre, duration, vocal character, artist, year, interpretive themes (safe for student-facing AI), and teacher-only timestamped notes (used only in teacher edition + chat). Changes take effect on next AI generation; existing cached generations bust automatically when the underlying data changes.
      </p>

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
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      border: '1px solid var(--rule)',
                      borderRadius: '0.5rem',
                      textDecoration: 'none',
                      color: 'var(--ink)',
                    }}
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
          </ul>
        </section>
      ))}
    </main>
  );
}
