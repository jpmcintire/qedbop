'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { POEMS } from '@/lib/poems';

export default function BuilderPage() {
  const [slug, setSlug] = useState<string>(POEMS[0]?.slug ?? '');
  const [picked, setPicked] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const poem = useMemo(() => POEMS.find((p) => p.slug === slug), [slug]);

  function chooseDifferentPoem(newSlug: string) {
    setSlug(newSlug);
    setPicked([]);
    setCopied(false);
  }

  function togglePick(youtubeId: string) {
    setCopied(false);
    setPicked((prev) => {
      if (prev.includes(youtubeId)) return prev.filter((v) => v !== youtubeId);
      if (prev.length >= 2) return prev;
      return [...prev, youtubeId];
    });
  }

  const ready = picked.length === 2 && poem != null;
  const relativeUrl =
    ready && poem ? `/a/${poem.slug}?${picked.map((v) => `v=${v}`).join('&')}` : '';
  const fullUrl =
    ready && typeof window !== 'undefined' ? `${window.location.origin}${relativeUrl}` : '';

  async function copyToClipboard() {
    if (!fullUrl) return;
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
    } catch {
      // ignore — user can still select the text manually
    }
  }

  return (
    <main className="page">
      <header style={{ marginBottom: '2.5rem' }}>
        <Link href="/" className="wordmark" style={{ color: 'var(--ink)', fontSize: '1.5rem', textDecoration: 'none' }}>
          qed&rsquo;bop
        </Link>
        <p className="chrome" style={{ marginTop: '0.25rem' }}>Build an assignment</p>
      </header>

      <section style={{ marginBottom: '2rem' }}>
        <p className="chrome" style={{ marginBottom: '0.5rem' }}>1 — Pick a poem</p>
        <select
          value={slug}
          onChange={(e) => chooseDifferentPoem(e.target.value)}
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: '1.25rem',
            border: 'none',
            borderBottom: '1px solid var(--rule)',
            background: 'transparent',
            padding: '0.5rem 0',
            width: '100%',
            maxWidth: '38rem',
            color: 'var(--ink)',
          }}
        >
          {POEMS.map((p) => (
            <option key={p.slug} value={p.slug}>
              {p.title} — {p.author}
            </option>
          ))}
        </select>
      </section>

      {poem && (
        <section style={{ marginBottom: '2rem' }}>
          <p className="chrome" style={{ marginBottom: '0.75rem' }}>
            2 — Pick two musical versions ({picked.length}/2 selected)
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.75rem' }}>
            {poem.versions.map((v) => {
              const isPicked = picked.includes(v.youtubeId);
              const atLimit = picked.length >= 2 && !isPicked;
              return (
                <li key={v.youtubeId}>
                  <label
                    style={{
                      display: 'flex',
                      gap: '0.75rem',
                      alignItems: 'center',
                      padding: '0.75rem 1rem',
                      border: `1px solid ${isPicked ? 'var(--ink)' : 'var(--rule)'}`,
                      borderRadius: '0.5rem',
                      cursor: atLimit ? 'not-allowed' : 'pointer',
                      opacity: atLimit ? 0.5 : 1,
                      background: isPicked ? 'rgba(27,27,26,0.04)' : 'transparent',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isPicked}
                      disabled={atLimit}
                      onChange={() => togglePick(v.youtubeId)}
                    />
                    <span style={{ flex: 1 }}>
                      <span style={{ fontFamily: 'Georgia, serif', fontSize: '1.0625rem' }}>{v.label}</span>
                      <span className="chrome" style={{ marginLeft: '0.75rem' }}>
                        youtu.be/{v.youtubeId}
                      </span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="hairline" style={{ paddingTop: '1.5rem' }}>
        <p className="chrome" style={{ marginBottom: '0.75rem' }}>3 — Shareable URL</p>
        {ready ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '38rem' }}>
            <code
              style={{
                display: 'block',
                padding: '0.75rem 1rem',
                background: '#F2EFE7',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                wordBreak: 'break-all',
              }}
            >
              {fullUrl || `${relativeUrl}`}
            </code>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn" onClick={copyToClipboard}>
                {copied ? 'Copied' : 'Copy URL'}
              </button>
              <a className="btn btn-ghost" href={relativeUrl} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', display: 'inline-block' }}>
                Open preview
              </a>
            </div>
          </div>
        ) : (
          <p style={{ color: 'var(--muted)', maxWidth: '38rem' }}>
            Pick exactly two versions above to generate a shareable URL. Anyone with the link sees the poem and the two videos, no login required.
          </p>
        )}
      </section>
    </main>
  );
}
