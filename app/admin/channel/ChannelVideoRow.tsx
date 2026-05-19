'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { attachVideoToPoem } from '../actions';

type Video = {
  youtubeId: string;
  title: string;
  durationSeconds: number;
  viewCount: number | null;
  thumbnailUrl: string | null;
  privacyStatus: string | null;
};

type Props = {
  video: Video;
  alreadyKnown: boolean;
  guessedSlug?: string;
  poemOptions: Array<{ slug: string; title: string }>;
};

export function ChannelVideoRow({ video, alreadyKnown, guessedSlug, poemOptions }: Props) {
  const router = useRouter();
  const [slug, setSlug] = useState(guessedSlug ?? '');
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(alreadyKnown);
  const [error, setError] = useState<string | null>(null);

  function attach() {
    if (!slug) return;
    setError(null);
    startTransition(async () => {
      const res = await attachVideoToPoem({
        poemSlug: slug,
        youtubeId: video.youtubeId,
        label: video.title,
      });
      if (res.ok) {
        setDone(true);
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <li
      style={{
        display: 'grid',
        gridTemplateColumns: '120px 1fr auto',
        gap: '1rem',
        alignItems: 'center',
        padding: '0.625rem',
        border: '1px solid var(--rule)',
        borderRadius: '0.5rem',
      }}
    >
      {video.thumbnailUrl ? (
        <a href={`https://www.youtube.com/watch?v=${video.youtubeId}`} target="_blank" rel="noopener noreferrer">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={video.thumbnailUrl} alt="" style={{ width: '100%', borderRadius: '0.25rem', display: 'block' }} />
        </a>
      ) : (
        <div style={{ width: '100%', aspectRatio: '16/9', background: 'var(--rule)', borderRadius: '0.25rem' }} />
      )}

      <div style={{ minWidth: 0 }}>
        <p style={{ margin: 0, fontFamily: 'Georgia, serif', fontSize: '0.9375rem' }}>{video.title}</p>
        <p className="chrome" style={{ margin: '0.25rem 0 0 0' }}>
          {formatDuration(video.durationSeconds)}
          {video.viewCount != null && <> · {video.viewCount.toLocaleString()} views</>}
          {video.privacyStatus && video.privacyStatus !== 'public' && (
            <> · <span style={{ fontStyle: 'italic' }}>{video.privacyStatus}</span></>
          )}
        </p>
        {error && <p style={{ color: '#a33', fontSize: '0.75rem', margin: '0.25rem 0 0 0' }}>{error}</p>}
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <select
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          disabled={pending}
          style={{
            fontFamily: 'inherit',
            fontSize: '0.8125rem',
            padding: '0.375rem 0.5rem',
            border: '1px solid var(--rule)',
            borderRadius: '0.375rem',
            background: 'transparent',
            color: 'var(--ink)',
            maxWidth: '12rem',
          }}
        >
          <option value="">Attach to poem…</option>
          {poemOptions.map((p) => (
            <option key={p.slug} value={p.slug}>{p.title}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={attach}
          disabled={pending || !slug}
          className="btn"
          style={{ fontSize: '0.8125rem' }}
        >
          {pending ? '…' : done ? 'Add again' : 'Attach'}
        </button>
        {done && <span className="chrome" title="Already in the catalog">✓</span>}
      </div>
    </li>
  );
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}
