'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { POEMS, AUDIENCES } from '@/lib/poems';

export default function BuilderPage() {
  const [slug, setSlug] = useState<string>(POEMS[0]?.slug ?? '');
  const [picked, setPicked] = useState<string[]>([]);
  const [includeQuestions, setIncludeQuestions] = useState(false);
  const [questionCount, setQuestionCount] = useState(4);

  const poem = useMemo(() => POEMS.find((p) => p.slug === slug), [slug]);
  const maxQuestions = poem?.questions.length ?? 0;
  const effectiveQuestionCount = Math.min(questionCount, maxQuestions);

  function chooseDifferentPoem(newSlug: string) {
    setSlug(newSlug);
    setPicked([]);
  }

  function togglePick(youtubeId: string) {
    setPicked((prev) =>
      prev.includes(youtubeId) ? prev.filter((v) => v !== youtubeId) : [...prev, youtubeId]
    );
  }

  function selectAll() {
    if (!poem) return;
    setPicked(poem.versions.map((v) => v.youtubeId));
  }

  function clearAll() {
    setPicked([]);
  }

  const ready = picked.length >= 1 && poem != null;

  function buildUrl(audienceSlug?: string): string {
    if (!ready || !poem) return '';
    const params = new URLSearchParams();
    picked.forEach((id) => params.append('v', id));
    if (audienceSlug) params.set('audience', audienceSlug);
    if (includeQuestions && effectiveQuestionCount > 0 && audienceSlug) {
      params.set('q', String(effectiveQuestionCount));
    }
    return `/a/${poem.slug}?${params.toString()}`;
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
        <p className="chrome" style={{ marginTop: '0.25rem' }}>Build an assignment</p>
      </header>

      <Step n={1} title="Pick a poem">
        <select
          value={slug}
          onChange={(e) => chooseDifferentPoem(e.target.value)}
          style={selectStyle}
        >
          {POEMS.map((p) => (
            <option key={p.slug} value={p.slug}>
              {p.title} — {p.author}
            </option>
          ))}
        </select>
      </Step>

      {poem && (
        <Step
          n={2}
          title={`Pick musical versions (${picked.length} selected)`}
          right={
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={selectAll}
                className="btn btn-ghost"
                style={{ fontSize: '0.75rem', padding: '0.375rem 0.875rem' }}
              >
                Select all
              </button>
              <button
                type="button"
                onClick={clearAll}
                className="btn btn-ghost"
                style={{ fontSize: '0.75rem', padding: '0.375rem 0.875rem' }}
              >
                Clear
              </button>
            </div>
          }
        >
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'grid',
              gap: '1rem',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            }}
          >
            {poem.versions.map((v) => {
              const isPicked = picked.includes(v.youtubeId);
              return (
                <li
                  key={v.youtubeId}
                  style={{
                    border: `1px solid ${isPicked ? 'var(--ink)' : 'var(--rule)'}`,
                    borderRadius: '0.5rem',
                    background: isPicked ? 'rgba(27,27,26,0.04)' : 'transparent',
                    overflow: 'hidden',
                  }}
                >
                  <label
                    style={{
                      display: 'flex',
                      gap: '0.75rem',
                      alignItems: 'center',
                      padding: '0.75rem 1rem',
                      cursor: 'pointer',
                      borderBottom: '1px solid var(--rule)',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isPicked}
                      onChange={() => togglePick(v.youtubeId)}
                    />
                    <span style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontFamily: 'Georgia, serif', fontSize: '1.0625rem' }}>
                        {v.label}
                      </span>
                      <span className="chrome" style={{ marginTop: '0.125rem' }}>
                        youtu.be/{v.youtubeId}
                      </span>
                    </span>
                  </label>
                  <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
                    <iframe
                      src={`https://www.youtube-nocookie.com/embed/${v.youtubeId}`}
                      title={`${poem.title} — ${v.label}`}
                      loading="lazy"
                      allow="accelerometer; clipboard-write; encrypted-media; picture-in-picture"
                      allowFullScreen
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        border: 0,
                      }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </Step>
      )}

      <Step n={3} title="Discussion questions">
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={includeQuestions}
            onChange={(e) => setIncludeQuestions(e.target.checked)}
          />
          <span style={{ fontSize: '1.0625rem' }}>
            Include AI-generated discussion questions on the assignment page
          </span>
        </label>
        {includeQuestions && (
          <div style={{ marginTop: '1rem' }}>
            <p className="chrome" style={{ marginBottom: '0.5rem' }}>
              How many? ({maxQuestions} available for this poem)
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {Array.from({ length: maxQuestions }, (_, i) => i + 1).map((n) => {
                const isSelected = effectiveQuestionCount === n;
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setQuestionCount(n)}
                    style={{
                      ...chipStyle,
                      background: isSelected ? 'var(--ink)' : 'transparent',
                      color: isSelected ? 'var(--paper)' : 'var(--ink)',
                      borderColor: isSelected ? 'var(--ink)' : 'var(--rule)',
                      minWidth: '2.5rem',
                    }}
                  >
                    {n}
                  </button>
                );
              })}
            </div>
            <p style={{ color: 'var(--muted)', fontSize: '0.8125rem', marginTop: '0.75rem', maxWidth: '38rem' }}>
              Each audience level gets its own URL below. Same poem, same videos — Claude tunes the
              questions for the audience. Open multiple to compare.
            </p>
          </div>
        )}
      </Step>

      <section className="hairline" style={{ paddingTop: '1.5rem', marginTop: '2rem' }}>
        <p className="chrome" style={{ marginBottom: '0.75rem' }}>
          {includeQuestions ? 'Shareable URLs by audience' : 'Shareable URL'}
        </p>

        {!ready ? (
          <p style={{ color: 'var(--muted)', maxWidth: '38rem' }}>
            Pick at least one musical version above.
          </p>
        ) : includeQuestions ? (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.75rem', maxWidth: '46rem' }}>
            {AUDIENCES.map((a) => (
              <UrlRow key={a.value} label={a.label} relativeUrl={buildUrl(a.value)} />
            ))}
          </ul>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxWidth: '46rem' }}>
            <UrlRow label="Assignment" relativeUrl={buildUrl()} />
          </ul>
        )}
      </section>
    </main>
  );
}

function UrlRow({ label, relativeUrl }: { label: string; relativeUrl: string }) {
  const [copied, setCopied] = useState(false);
  const fullUrl =
    typeof window !== 'undefined' ? `${window.location.origin}${relativeUrl}` : relativeUrl;

  async function copy() {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }

  return (
    <li
      style={{
        display: 'grid',
        gridTemplateColumns: '10rem 1fr auto',
        gap: '0.75rem',
        alignItems: 'center',
        padding: '0.75rem 1rem',
        border: '1px solid var(--rule)',
        borderRadius: '0.5rem',
      }}
    >
      <span style={{ fontFamily: 'Georgia, serif', fontSize: '1rem' }}>{label}</span>
      <code
        style={{
          fontSize: '0.75rem',
          color: 'var(--muted)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
        title={fullUrl}
      >
        {relativeUrl}
      </code>
      <div style={{ display: 'flex', gap: '0.375rem' }}>
        <button
          type="button"
          onClick={copy}
          className="btn btn-ghost"
          style={{ fontSize: '0.75rem', padding: '0.375rem 0.875rem' }}
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
        <a
          href={relativeUrl}
          target="_blank"
          rel="noreferrer"
          className="btn"
          style={{
            fontSize: '0.75rem',
            padding: '0.375rem 0.875rem',
            textDecoration: 'none',
            display: 'inline-block',
          }}
        >
          Open ↗
        </a>
      </div>
    </li>
  );
}

function Step({
  n,
  title,
  right,
  children,
}: {
  n: number;
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section style={{ marginBottom: '2rem' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginBottom: '0.75rem',
          gap: '1rem',
        }}
      >
        <p className="chrome" style={{ margin: 0 }}>
          {n} — {title}
        </p>
        {right}
      </div>
      {children}
    </section>
  );
}

const selectStyle: React.CSSProperties = {
  fontFamily: 'Georgia, serif',
  fontSize: '1.25rem',
  border: 'none',
  borderBottom: '1px solid var(--rule)',
  background: 'transparent',
  padding: '0.5rem 0',
  width: '100%',
  maxWidth: '38rem',
  color: 'var(--ink)',
};

const chipStyle: React.CSSProperties = {
  padding: '0.5rem 1rem',
  borderRadius: '9999px',
  border: '1px solid',
  fontSize: '0.8125rem',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  cursor: 'pointer',
};
