'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { searchYouTube, attachVideoToPoem } from '../../../actions';
import type { YouTubeSearchHit } from '@/lib/youtube';

type Props = {
  poemSlug: string;
  defaultQuery: string;
};

export function SearchForm({ poemSlug, defaultQuery }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState(defaultQuery);
  const [hits, setHits] = useState<YouTubeSearchHit[] | null>(null);
  const [searchPending, startSearchTransition] = useTransition();
  const [attachPending, startAttachTransition] = useTransition();
  const [attachingId, setAttachingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function search() {
    setError(null);
    startSearchTransition(async () => {
      const res = await searchYouTube(query);
      if (res.ok) {
        setHits(res.hits);
      } else {
        setHits(null);
        setError(res.error);
      }
    });
  }

  function attach(hit: YouTubeSearchHit) {
    setAttachingId(hit.youtubeId);
    setError(null);
    startAttachTransition(async () => {
      const res = await attachVideoToPoem({
        poemSlug,
        youtubeId: hit.youtubeId,
        label: hit.title,
      });
      setAttachingId(null);
      if (res.ok) {
        router.push(`/admin/videos/${hit.youtubeId}`);
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '52rem' }}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          search();
        }}
        style={{ display: 'flex', gap: '0.5rem' }}
      >
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search YouTube…"
          style={{
            flex: 1,
            fontFamily: 'inherit',
            fontSize: '0.9375rem',
            padding: '0.5rem 0.75rem',
            border: '1px solid var(--rule)',
            borderRadius: '0.375rem',
            background: 'transparent',
            color: 'var(--ink)',
          }}
        />
        <button
          type="submit"
          disabled={searchPending || !query.trim()}
          className="btn"
        >
          {searchPending ? 'Searching…' : 'Search'}
        </button>
      </form>

      {error && <p style={{ color: '#a33', fontSize: '0.875rem', margin: 0 }}>{error}</p>}

      {hits && hits.length === 0 && (
        <p className="chrome" style={{ fontStyle: 'italic' }}>No results.</p>
      )}

      {hits && hits.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {hits.map((hit) => (
            <li
              key={hit.youtubeId}
              style={{
                display: 'grid',
                gridTemplateColumns: '160px 1fr auto',
                gap: '1rem',
                alignItems: 'center',
                padding: '0.75rem',
                border: '1px solid var(--rule)',
                borderRadius: '0.5rem',
              }}
            >
              {hit.thumbnailUrl ? (
                <a
                  href={`https://www.youtube.com/watch?v=${hit.youtubeId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={hit.thumbnailUrl}
                    alt=""
                    style={{ width: '100%', height: 'auto', borderRadius: '0.25rem', display: 'block' }}
                  />
                </a>
              ) : (
                <div style={{ width: '100%', aspectRatio: '16/9', background: 'var(--rule)', borderRadius: '0.25rem' }} />
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: 0 }}>
                <a
                  href={`https://www.youtube.com/watch?v=${hit.youtubeId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontFamily: 'Georgia, serif',
                    fontSize: '1rem',
                    color: 'var(--ink)',
                    textDecoration: 'none',
                  }}
                >
                  {hit.title}
                </a>
                <span className="chrome">
                  {hit.channelTitle} &middot; {formatDuration(hit.durationSeconds)}
                  {hit.viewCount != null && (
                    <> &middot; {hit.viewCount.toLocaleString()} views</>
                  )}
                </span>
                <span className="chrome" style={{ fontStyle: 'italic' }}>
                  Published {hit.publishedAt.slice(0, 10)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => attach(hit)}
                disabled={attachPending}
                className="btn"
                style={{ fontSize: '0.8125rem' }}
              >
                {attachPending && attachingId === hit.youtubeId ? 'Adding…' : 'Add to poem'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}
