import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getVideoEditState } from '@/lib/poems-runtime';
import { EditForm } from './EditForm';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Edit video — qed'bop",
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ youtubeId: string }> };

export default async function EditVideoPage({ params }: Props) {
  const { youtubeId } = await params;
  const state = await getVideoEditState(youtubeId);
  if (!state) notFound();

  return (
    <main className="page">
      <header style={{ marginBottom: '2rem' }}>
        <Link
          href="/admin"
          style={{
            color: 'var(--ink)',
            textDecoration: 'none',
          }}
          className="chrome"
        >
          ← Back to admin
        </Link>
        <p className="chrome" style={{ marginTop: '0.75rem' }}>
          Editing video on <Link href={`/admin`} style={{ color: 'inherit' }}>{state.poemTitle}</Link>
          {' · '}
          youtu.be/{state.staticVersion.youtubeId}
        </p>
      </header>

      <section style={{ marginBottom: '2rem' }}>
        <div style={{ position: 'relative', paddingBottom: '40%', maxWidth: '40rem' }}>
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${state.staticVersion.youtubeId}`}
            title={state.staticVersion.label}
            loading="lazy"
            allow="accelerometer; clipboard-write; encrypted-media; picture-in-picture"
            allowFullScreen
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              border: '1px solid var(--rule)',
              borderRadius: '0.5rem',
            }}
          />
        </div>
      </section>

      <EditForm
        youtubeId={state.staticVersion.youtubeId}
        poemSlug={state.poemSlug}
        isAttached={state.isAttached}
        staticDefaults={{
          label: state.staticVersion.label,
          durationSeconds: state.staticVersion.durationSeconds ?? null,
          genre: state.staticVersion.genre ?? null,
          vocalCharacter: state.staticVersion.vocalCharacter ?? null,
          artist: state.staticVersion.artist ?? null,
          recordingYear: state.staticVersion.recordingYear ?? null,
          themes: state.staticVersion.themes ?? null,
          teacherNotes: state.staticVersion.teacherNotes ?? null,
        }}
        dbAnnotation={state.dbAnnotation}
      />
    </main>
  );
}
