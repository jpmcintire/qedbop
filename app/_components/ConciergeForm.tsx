'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { fetchConcierge } from '../actions';
import type { ConciergeResponse, ConciergeTurn } from '@/lib/concierge';

type Result = ConciergeResponse | { kind: 'error'; message: string } | null;

export function ConciergeForm() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<Result>(null);
  // Track the prior follow-up turn so a refine answer carries context.
  const [history, setHistory] = useState<ConciergeTurn[]>([]);
  const [pending, startTransition] = useTransition();

  function submit(e?: React.FormEvent) {
    e?.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    startTransition(async () => {
      const res = await fetchConcierge(trimmed, history);
      // If the server asked a follow-up, push the prior exchange into
      // history so the refine call has the full context.
      if (result?.kind === 'followUp') {
        setHistory((prev) => [
          ...prev,
          { role: 'assistant', content: result.question },
          { role: 'user', content: trimmed },
        ]);
      } else if (history.length === 0) {
        // First-turn user message goes into history only when we'll
        // continue the conversation (i.e. server asks a follow-up).
        if (res.kind === 'followUp') {
          setHistory([{ role: 'user', content: trimmed }]);
        }
      }
      setResult(res);
      setQuery('');
    });
  }

  function reset() {
    setQuery('');
    setResult(null);
    setHistory([]);
  }

  const placeholder =
    result?.kind === 'followUp'
      ? 'Answer the question…'
      : "e.g. \"Gatsby\", \"poems about death\", \"10th grade British lit\"";

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <form onSubmit={submit} style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          autoFocus
          disabled={pending}
          style={{
            flex: 1,
            fontFamily: 'inherit',
            fontSize: '1rem',
            padding: '0.625rem 0.875rem',
            border: '1px solid var(--rule)',
            borderRadius: '0.5rem',
            background: 'transparent',
            color: 'var(--ink)',
          }}
        />
        <button type="submit" className="btn" disabled={pending || !query.trim()}>
          {pending ? 'Thinking…' : 'Ask'}
        </button>
      </form>

      {pending && (
        <p style={{ color: 'var(--muted)', fontSize: '0.875rem', fontStyle: 'italic' }}>
          Consulting the muses…
        </p>
      )}

      {!pending && result && <ResultBlock result={result} onReset={reset} />}
    </div>
  );
}

function ResultBlock({ result, onReset }: { result: Result; onReset: () => void }) {
  if (!result) return null;

  if (result.kind === 'error') {
    return (
      <p style={{ color: '#a33', fontSize: '0.9375rem' }}>
        {result.message}
      </p>
    );
  }

  if (result.kind === 'offTopic') {
    return (
      <div>
        <p style={{ fontSize: '0.9375rem', marginBottom: '0.5rem' }}>{result.message}</p>
        <button
          type="button"
          onClick={onReset}
          className="btn btn-ghost"
          style={{ fontSize: '0.8125rem' }}
        >
          Try another query
        </button>
      </div>
    );
  }

  if (result.kind === 'followUp') {
    return (
      <p
        style={{
          fontSize: '0.9375rem',
          padding: '0.875rem 1rem',
          border: '1px solid var(--rule)',
          borderRadius: '0.5rem',
          background: 'rgba(27,27,26,0.03)',
        }}
      >
        {result.question}
      </p>
    );
  }

  // suggestions
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
      {result.suggestions.map((s) => (
        <article
          key={s.poemSlug + s.headline}
          style={{
            border: '1px solid var(--rule)',
            borderRadius: '0.5rem',
            padding: '1rem 1.125rem',
          }}
        >
          <h3
            style={{
              fontFamily: 'Georgia, serif',
              fontSize: '1.0625rem',
              fontWeight: 600,
              margin: '0 0 0.25rem 0',
            }}
          >
            {s.headline}
          </h3>
          <p className="chrome" style={{ margin: '0 0 0.625rem 0' }}>
            {s.title} &middot; {s.author}
          </p>
          <p style={{ fontSize: '0.9375rem', lineHeight: 1.55, margin: '0 0 0.875rem 0' }}>
            {s.why}
          </p>
          <Link
            href={s.builderUrl}
            className="btn"
            style={{ fontSize: '0.8125rem', textDecoration: 'none' }}
          >
            Build this lesson →
          </Link>
        </article>
      ))}
      <p style={{ fontSize: '0.8125rem', color: 'var(--muted)', marginTop: '0.25rem' }}>
        Not quite right?{' '}
        <button
          type="button"
          onClick={onReset}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--ink)',
            textDecoration: 'underline',
            cursor: 'pointer',
            padding: 0,
            font: 'inherit',
          }}
        >
          Try a different query
        </button>
        .
      </p>
    </div>
  );
}
