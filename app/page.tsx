'use client';

import { Suspense, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { POEMS, AUDIENCES } from '@/lib/poems';
import {
  defaultExpirationIso,
  maxExpirationIso,
  todayIso,
  formatExpirationFriendly,
} from '@/lib/expiration';
import { fetchTopicOptions, fetchQuestions } from './actions';

export default function Page() {
  return (
    <Suspense fallback={<main className="page" />}>
      <BuilderPage />
    </Suspense>
  );
}

function BuilderPage() {
  const sp = useSearchParams();

  // Initialize all state from URL params if present so a teacher can paste
  // their editable URL back in and resume where they left off.
  const [slug, setSlug] = useState<string>(() => sp.get('slug') ?? POEMS[0]?.slug ?? '');
  const [picked, setPicked] = useState<string[]>(() => sp.getAll('v'));
  const [audience, setAudience] = useState<string>(() => sp.get('audience') ?? 'high-school');
  const [edited, setEdited] = useState<string[]>(() => sp.getAll('q'));
  const [questionCount, setQuestionCount] = useState<number>(() => {
    const fromUrl = sp.getAll('q').length;
    return fromUrl > 0 ? fromUrl : 4;
  });
  const [expiration, setExpiration] = useState<string>(
    () => sp.get('exp') ?? defaultExpirationIso()
  );

  const [availableTopics, setAvailableTopics] = useState<string[]>([]);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

  const [generating, startGenerating] = useTransition();
  const [generationError, setGenerationError] = useState<string | null>(null);

  const poem = useMemo(() => POEMS.find((p) => p.slug === slug), [slug]);
  const maxQuestions = 8;

  // Fetch AI-generated topic options when poem or audience changes. The very
  // first run is special: if we just loaded `edited` from URL params we don't
  // want this effect to wipe them out. After that, edited gets cleared on
  // every poem/audience change since it's no longer relevant.
  const initialMount = useRef(true);
  useEffect(() => {
    if (!slug || !audience) return;
    let cancelled = false;

    if (!initialMount.current) {
      // user-driven change: clear stale edits
      setEdited([]);
      setGenerationError(null);
    }
    initialMount.current = false;

    setTopicsLoading(true);
    setSelectedTopics([]);

    fetchTopicOptions(slug, audience)
      .then((topics) => {
        if (cancelled) return;
        setAvailableTopics(topics);
        setTopicsLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setAvailableTopics([]);
        setTopicsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug, audience]);

  function chooseDifferentPoem(newSlug: string) {
    setSlug(newSlug);
    setPicked([]);
    setEdited([]);
  }

  function togglePick(youtubeId: string) {
    setPicked((prev) =>
      prev.includes(youtubeId) ? prev.filter((v) => v !== youtubeId) : [...prev, youtubeId]
    );
    setEdited([]);
  }

  function selectAll() {
    if (!poem) return;
    setPicked(poem.versions.map((v) => v.youtubeId));
    setEdited([]);
  }

  function clearAll() {
    setPicked([]);
    setEdited([]);
  }

  function toggleTopic(t: string) {
    setSelectedTopics((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
    setEdited([]);
  }

  function handleGenerate() {
    if (!poem || picked.length === 0) return;
    setGenerationError(null);
    startGenerating(async () => {
      try {
        const result = await fetchQuestions({
          slug: poem.slug,
          versionIds: picked,
          audience,
          topics: selectedTopics,
          count: questionCount,
        });
        if (result.questions.length === 0) {
          setGenerationError('No questions returned. Try changing topics or audience and retry.');
          setEdited([]);
          return;
        }
        setEdited(result.questions);
      } catch (err) {
        console.error(err);
        setGenerationError(
          err instanceof Error ? err.message : 'Generation failed. Try again.'
        );
        setEdited([]);
      }
    });
  }

  function editQuestion(index: number, value: string) {
    setEdited((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  function removeQuestion(index: number) {
    setEdited((prev) => prev.filter((_, i) => i !== index));
  }

  const ready = picked.length >= 1 && poem != null && edited.length > 0;

  const queryString = useMemo(() => {
    if (!poem) return '';
    const params = new URLSearchParams();
    picked.forEach((id) => params.append('v', id));
    if (audience) params.set('audience', audience);
    edited.filter((q) => q.trim().length > 0).forEach((q) => params.append('q', q));
    if (expiration) params.set('exp', expiration);
    return params.toString();
  }, [poem, picked, audience, edited, expiration]);

  const studentUrl = ready && poem ? `/a/${poem.slug}?${queryString}` : '';
  const editUrl = ready && poem ? `/?slug=${poem.slug}&${queryString}` : '';

  const canGenerate = poem != null && picked.length >= 1 && !generating;

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
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
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
                      gap: '0.5rem',
                      alignItems: 'center',
                      padding: '0.5rem 0.75rem',
                      cursor: 'pointer',
                      borderBottom: '1px solid var(--rule)',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isPicked}
                      onChange={() => togglePick(v.youtubeId)}
                    />
                    <span style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                      <span style={{ fontFamily: 'Georgia, serif', fontSize: '0.9375rem' }}>
                        {v.label}
                      </span>
                      <span
                        className="chrome"
                        style={{
                          marginTop: '0.125rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {v.youtubeId}
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

      <Step n={3} title="Audience">
        <select
          value={audience}
          onChange={(e) => setAudience(e.target.value)}
          style={selectStyle}
        >
          {AUDIENCES.map((a) => (
            <option key={a.value} value={a.value}>
              {a.label}
            </option>
          ))}
        </select>
      </Step>

      <Step n={4} title="Topics to address (optional)">
        {topicsLoading ? (
          <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>
            Loading topic options for {AUDIENCES.find((a) => a.value === audience)?.label ?? audience}&hellip;
          </p>
        ) : availableTopics.length === 0 ? (
          <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>
            No topic options available. You can still generate questions without selecting any.
          </p>
        ) : (
          <>
            <p style={{ color: 'var(--muted)', fontSize: '0.8125rem', marginBottom: '0.75rem', maxWidth: '38rem' }}>
              Check any topics you want the question set to cover. Leave all unchecked to let Claude pick freely. These options regenerate when you change audience.
            </p>
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'grid',
                gap: '0.5rem',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              }}
            >
              {availableTopics.map((t) => {
                const isSelected = selectedTopics.includes(t);
                return (
                  <li key={t}>
                    <label
                      style={{
                        display: 'flex',
                        gap: '0.5rem',
                        alignItems: 'center',
                        padding: '0.5rem 0.75rem',
                        border: `1px solid ${isSelected ? 'var(--ink)' : 'var(--rule)'}`,
                        borderRadius: '0.375rem',
                        cursor: 'pointer',
                        background: isSelected ? 'rgba(27,27,26,0.04)' : 'transparent',
                        fontSize: '0.9375rem',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleTopic(t)}
                      />
                      <span>{t}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </Step>

      <Step n={5} title="How many questions?">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {Array.from({ length: maxQuestions }, (_, i) => i + 1).map((n) => {
            const isSelected = questionCount === n;
            return (
              <button
                key={n}
                type="button"
                onClick={() => {
                  setQuestionCount(n);
                  setEdited([]);
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
      </Step>

      <Step n={6} title="Generate questions">
        <button
          type="button"
          className="btn"
          onClick={handleGenerate}
          disabled={!canGenerate}
        >
          {generating
            ? 'Generating with Claude Opus 4.7…'
            : edited.length > 0
              ? 'Regenerate'
              : 'Generate questions'}
        </button>
        {generationError && (
          <p style={{ color: '#a33', fontSize: '0.875rem', marginTop: '0.75rem' }}>
            {generationError}
          </p>
        )}
        {!canGenerate && !generating && (
          <p style={{ color: 'var(--muted)', fontSize: '0.8125rem', marginTop: '0.75rem' }}>
            Pick at least one musical version above first.
          </p>
        )}
      </Step>

      {edited.length > 0 && (
        <Step n={7} title="Edit the questions">
          <p style={{ color: 'var(--muted)', fontSize: '0.8125rem', marginBottom: '0.75rem', maxWidth: '38rem' }}>
            Tweak any question. Changes are reflected in the URLs below in real time.
          </p>
          <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.75rem' }}>
            {edited.map((q, i) => (
              <li key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                <span
                  className="chrome"
                  style={{ paddingTop: '0.625rem', minWidth: '1.5rem' }}
                >
                  {i + 1}.
                </span>
                <textarea
                  value={q}
                  onChange={(e) => editQuestion(i, e.target.value)}
                  rows={Math.max(2, Math.ceil(q.length / 80))}
                  style={{
                    flex: 1,
                    fontFamily: 'Georgia, serif',
                    fontSize: '1rem',
                    lineHeight: 1.5,
                    padding: '0.625rem 0.75rem',
                    border: '1px solid var(--rule)',
                    borderRadius: '0.375rem',
                    resize: 'vertical',
                    background: 'transparent',
                    color: 'var(--ink)',
                  }}
                />
                <button
                  type="button"
                  onClick={() => removeQuestion(i)}
                  className="btn btn-ghost"
                  style={{ fontSize: '0.75rem', padding: '0.375rem 0.625rem', alignSelf: 'flex-start' }}
                  title="Remove this question"
                >
                  ✕
                </button>
              </li>
            ))}
          </ol>
        </Step>
      )}

      <Step n={8} title="Expiration">
        <p style={{ color: 'var(--muted)', fontSize: '0.8125rem', marginBottom: '0.75rem', maxWidth: '38rem' }}>
          Once this date passes, the student URL stops working (the page shows
          an &ldquo;expired&rdquo; notice instead of the assignment). Max 30
          days from today.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'baseline' }}>
          <input
            type="date"
            value={expiration}
            onChange={(e) => setExpiration(e.target.value)}
            min={todayIso()}
            max={maxExpirationIso()}
            style={{
              fontFamily: 'inherit',
              fontSize: '1rem',
              padding: '0.5rem 0.625rem',
              border: '1px solid var(--rule)',
              borderRadius: '0.375rem',
              background: 'transparent',
              color: 'var(--ink)',
            }}
          />
          <span className="chrome">{formatExpirationFriendly(expiration)}</span>
        </div>
      </Step>

      <section className="hairline" style={{ paddingTop: '1.5rem', marginTop: '2rem' }}>
        {!ready ? (
          <>
            <p className="chrome" style={{ marginBottom: '0.75rem' }}>Shareable URLs</p>
            <p style={{ color: 'var(--muted)', maxWidth: '38rem' }}>
              Generate questions above to build the shareable URLs.
            </p>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <UrlBlock
              label="Share with students"
              description="Send this to students. They see the poem, the videos, and the questions you finalized — they cannot edit anything. Read-only until the expiration date."
              relativeUrl={studentUrl}
              accent
            />
            <UrlBlock
              label="Your editable URL"
              description="Bookmark this for yourself. Opening it loads everything (poem, versions, audience, questions, expiration) back into this builder so you can come back later and tweak the assignment."
              relativeUrl={editUrl}
            />
          </div>
        )}
      </section>
    </main>
  );
}

function UrlBlock({
  label,
  description,
  relativeUrl,
  accent,
}: {
  label: string;
  description: string;
  relativeUrl: string;
  accent?: boolean;
}) {
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
    <div
      style={{
        padding: '1rem 1.25rem',
        border: `1px solid ${accent ? 'var(--ink)' : 'var(--rule)'}`,
        borderRadius: '0.5rem',
        background: accent ? 'rgba(27,27,26,0.04)' : 'transparent',
      }}
    >
      <p className="chrome" style={{ marginBottom: '0.375rem' }}>{label}</p>
      <p style={{ color: 'var(--muted)', fontSize: '0.8125rem', marginBottom: '0.75rem', maxWidth: '46rem' }}>
        {description}
      </p>
      <code
        style={{
          display: 'block',
          padding: '0.625rem 0.875rem',
          background: '#F2EFE7',
          borderRadius: '0.375rem',
          fontSize: '0.75rem',
          wordBreak: 'break-all',
          lineHeight: 1.5,
          marginBottom: '0.75rem',
        }}
      >
        {fullUrl}
      </code>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button type="button" className="btn" onClick={copy}>
          {copied ? 'Copied' : 'Copy URL'}
        </button>
        <a
          href={relativeUrl}
          target="_blank"
          rel="noreferrer"
          className="btn btn-ghost"
          style={{ textDecoration: 'none', display: 'inline-block' }}
        >
          Open ↗
        </a>
      </div>
    </div>
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
