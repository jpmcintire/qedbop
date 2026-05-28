'use client';

import { useState, useTransition } from 'react';
import { fetchPrepPodcast } from '@/app/actions';

type Props = {
  slug: string;
  audience: string;
  versionIds: string[];
  questions: string[];
};

export function PrepPodcastButton({ slug, audience, versionIds, questions }: Props) {
  const [pending, startTransition] = useTransition();
  const [mp3Url, setMp3Url] = useState<string | null>(null);
  const [title, setTitle] = useState<string | null>(null);
  const [cached, setCached] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function generate() {
    setError(null);
    startTransition(async () => {
      const res = await fetchPrepPodcast({ slug, audience, versionIds, questions });
      if (res.ok) {
        setMp3Url(res.mp3Url);
        setTitle(res.title);
        setCached(res.cached);
      } else {
        setError(res.error);
      }
    });
  }

  if (mp3Url) {
    return (
      <section
        style={{
          marginTop: '1.5rem',
          padding: '1rem 1.125rem',
          border: '1px solid var(--rule)',
          borderRadius: '0.5rem',
          background: 'rgba(27,27,26,0.03)',
        }}
      >
        <p className="chrome" style={{ margin: '0 0 0.5rem 0' }}>
          {cached ? 'Saved prep podcast' : 'Your prep podcast'}
        </p>
        <h3
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: '1.0625rem',
            fontWeight: 600,
            margin: '0 0 0.75rem 0',
          }}
        >
          {title ?? 'Prep huddle'}
        </h3>
        <audio
          controls
          preload="metadata"
          src={mp3Url}
          style={{ width: '100%' }}
        />
        <p
          className="chrome"
          style={{
            margin: '0.5rem 0 0 0',
            fontSize: '0.75rem',
            fontStyle: 'italic',
          }}
        >
          About 10 minutes — what is unique to teaching this exact lesson.
        </p>
      </section>
    );
  }

  return (
    <section style={{ marginTop: '1.5rem' }}>
      <button
        type="button"
        onClick={generate}
        disabled={pending}
        className="btn"
        style={{ fontSize: '0.9375rem' }}
      >
        {pending ? 'Recording your prep podcast…' : 'Listen to a prep podcast for this lesson'}
      </button>
      <p
        className="chrome"
        style={{ marginTop: '0.5rem', fontSize: '0.8125rem', fontStyle: 'italic' }}
      >
        ~10 minutes, two hosts. Covers what is unique to teaching this exact
        combination: your chosen settings, your selected questions, this audience.
      </p>
      {pending && (
        <p
          className="chrome"
          style={{ marginTop: '0.5rem', color: 'var(--muted)' }}
        >
          First run takes around a minute while qed&rsquo;bop writes the script and
          records the voices. After that it&rsquo;s instant.
        </p>
      )}
      {error && (
        <p style={{ color: '#a33', fontSize: '0.875rem', marginTop: '0.5rem' }}>
          {error}
        </p>
      )}
    </section>
  );
}
