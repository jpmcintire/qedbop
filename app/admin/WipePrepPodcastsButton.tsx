'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { wipePrepPodcasts } from './actions';

// One-click cleanup: deletes every cached PrepPodcast row + every MP3
// under R2's prep-podcasts/ prefix, so the next teacher-edition click
// regenerates a fresh podcast (under whatever voices + script are
// current). Use after a voice change, script tuning, or model swap.
export function WipePrepPodcastsButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function wipe() {
    if (
      !confirm(
        'Delete every cached prep podcast (DB rows + R2 MP3 files)? Lessons will regenerate on next click.'
      )
    ) {
      return;
    }
    setError(null);
    setResult(null);
    startTransition(async () => {
      const res = await wipePrepPodcasts();
      if (res.ok) {
        setResult(`Cleared ${res.rowsDeleted} row(s) and ${res.filesDeleted} file(s).`);
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
      <button
        type="button"
        onClick={wipe}
        disabled={pending}
        className="btn btn-ghost"
        style={{ fontSize: '0.8125rem' }}
      >
        {pending ? 'Wiping…' : 'Wipe cached prep podcasts'}
      </button>
      {result && (
        <span className="chrome" style={{ color: 'var(--ink)' }}>{result}</span>
      )}
      {error && (
        <span style={{ color: '#a33', fontSize: '0.8125rem' }}>{error}</span>
      )}
    </div>
  );
}
