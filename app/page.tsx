'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { POEMS, AUDIENCES, type AudienceValue } from '@/lib/poems';

export default function BuilderPage() {
  const [slug, setSlug] = useState<string>(POEMS[0]?.slug ?? '');
  const [picked, setPicked] = useState<string[]>([]);
  const [audience, setAudience] = useState<AudienceValue>(AUDIENCES[1].value); // default to high-school
  const [includeQuestions, setIncludeQuestions] = useState(false);
  const [questionCount, setQuestionCount] = useState(3);
  const [copied, setCopied] = useState(false);

  const poem = useMemo(() => POEMS.find((p) => p.slug === slug), [slug]);
  const maxQuestions = poem?.questions.length ?? 0;
  const effectiveQuestionCount = Math.min(questionCount, maxQuestions);

  function chooseDifferentPoem(newSlug: string) {
    setSlug(newSlug);
    setPicked([]);
    setCopied(false);
  }

  function togglePick(youtubeId: string) {
    setCopied(false);
    setPicked((prev) =>
      prev.includes(youtubeId) ? prev.filter((v) => v !== youtubeId) : [...prev, youtubeId]
    );
  }

  function selectAll() {
    if (!poem) return;
    setCopied(false);
    setPicked(poem.versions.map((v) => v.youtubeId));
  }

  function clearAll() {
    setCopied(false);
    setPicked([]);
  }

  const ready = picked.length >= 1 && poem != null;
  const params = new URLSearchParams();
  picked.forEach((id) => params.append('v', id));
  if (ready) params.set('audience', audience);
  if (ready && includeQuestions && effectiveQuestionCount > 0) {
    params.set('q', String(effectiveQuestionCount));
  }
  const relativeUrl = ready && poem ? `/a/${poem.slug}?${params.toString()}` : '';
  const fullUrl =
    ready && typeof window !== 'undefined' ? `${window.location.origin}${relativeUrl}` : '';

  async function copyToClipboard() {
    if (!fullUrl) return;
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
    } catch {
      // ignore
    }
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
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.75rem' }}>
            {poem.versions.map((v) => {
              const isPicked = picked.includes(v.youtubeId);
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
                      cursor: 'pointer',
                      background: isPicked ? 'rgba(27,27,26,0.04)' : 'transparent',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isPicked}
                      onChange={() => togglePick(v.youtubeId)}
                    />
                    <span style={{ flex: 1 }}>
                      <span style={{ fontFamily: 'Georgia, serif', fontSize: '1.0625rem' }}>
                        {v.label}
                      </span>
                      <span className="chrome" style={{ marginLeft: '0.75rem' }}>
                        youtu.be/{v.youtubeId}
                      </span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </Step>
      )}

      <Step n={3} title="Audience">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {AUDIENCES.map((a) => {
            const isSelected = audience === a.value;
            return (
              <button
                key={a.value}
                type="button"
                onClick={() => {
                  setAudience(a.value);
                  setCopied(false);
                }}
                style={{
                  ...chipStyle,
                  background: isSelected ? 'var(--ink)' : 'transparent',
                  color: isSelected ? 'var(--paper)' : 'var(--ink)',
                  borderColor: isSelected ? 'var(--ink)' : 'var(--rule)',
                }}
              >
                {a.label}
              </button>
            );
          })}
        </div>
      </Step>

      <Step n={4} title="Discussion questions">
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={includeQuestions}
            onChange={(e) => {
              setIncludeQuestions(e.target.checked);
              setCopied(false);
            }}
          />
          <span style={{ fontSize: '1.0625rem' }}>
            Include discussion questions on the assignment page
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
                    onClick={() => {
                      setQuestionCount(n);
                      setCopied(false);
                    }}
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
          </div>
        )}
      </Step>

      <section className="hairline" style={{ paddingTop: '1.5rem', marginTop: '2rem' }}>
        <p className="chrome" style={{ marginBottom: '0.75rem' }}>Shareable URL</p>
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
              {fullUrl || relativeUrl}
            </code>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="button" className="btn" onClick={copyToClipboard}>
                {copied ? 'Copied' : 'Copy URL'}
              </button>
              <a
                className="btn btn-ghost"
                href={relativeUrl}
                target="_blank"
                rel="noreferrer"
                style={{ textDecoration: 'none', display: 'inline-block' }}
              >
                Open preview
              </a>
            </div>
          </div>
        ) : (
          <p style={{ color: 'var(--muted)', maxWidth: '38rem' }}>
            Pick at least one musical version above. The audience selection and discussion-question
            options will be encoded into the shareable URL.
          </p>
        )}
      </section>
    </main>
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
