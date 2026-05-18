'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { fetchTeacherAsk } from '@/app/actions';
import type { ChatMessage } from '@/lib/teacher-ask';

type Props = {
  slug: string;
  audience: string;
  versionIds: string[];
  questions: string[];
};

const SUGGESTIONS = [
  'Tell me more about the poet.',
  'What should I know about the historical moment this poem comes from?',
  'What does the genre of these musical settings typically carry, culturally?',
  'How should I handle question 1 if a student struggles?',
];

export function TeacherAsk({ slug, audience, versionIds, questions }: Props) {
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, pending]);

  function send(messageText?: string) {
    const text = (messageText ?? input).trim();
    if (!text || pending) return;

    const userMsg: ChatMessage = { role: 'user', content: text };
    const next = [...history, userMsg];
    setHistory(next);
    setInput('');
    setError(null);

    startTransition(async () => {
      try {
        const answer = await fetchTeacherAsk({
          slug,
          audience,
          versionIds,
          questions,
          history: next,
        });
        if (!answer) {
          setError('Claude did not return an answer. Try rephrasing or asking something else.');
          return;
        }
        setHistory((prev) => [...prev, { role: 'assistant', content: answer }]);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'Something went wrong.');
      }
    });
  }

  function clearChat() {
    setHistory([]);
    setError(null);
  }

  return (
    <section style={{ marginTop: '3rem', maxWidth: '46rem' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginBottom: '0.5rem',
        }}
      >
        <p className="chrome" style={{ margin: 0 }}>Ask anything</p>
        {history.length > 0 && (
          <button
            type="button"
            onClick={clearChat}
            className="btn btn-ghost"
            style={{ fontSize: '0.75rem', padding: '0.25rem 0.625rem' }}
          >
            Clear
          </button>
        )}
      </div>
      <p
        style={{
          color: 'var(--muted)',
          fontSize: '0.875rem',
          marginBottom: '1rem',
        }}
      >
        Ask Claude anything about this poem, the poet, the period, the musical
        settings, or how to teach it. Conversation stays on this page; it
        isn&rsquo;t saved or shared.
      </p>

      {history.length === 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => send(s)}
              disabled={pending}
              style={{
                padding: '0.375rem 0.875rem',
                border: '1px solid var(--rule)',
                borderRadius: '9999px',
                background: 'transparent',
                color: 'var(--ink)',
                fontSize: '0.8125rem',
                cursor: pending ? 'not-allowed' : 'pointer',
                opacity: pending ? 0.5 : 1,
                textAlign: 'left',
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {history.length > 0 && (
        <div
          ref={scrollRef}
          style={{
            maxHeight: '32rem',
            overflowY: 'auto',
            border: '1px solid var(--rule)',
            borderRadius: '0.5rem',
            padding: '1rem 1.25rem',
            marginBottom: '0.75rem',
            background: 'var(--paper)',
          }}
        >
          {history.map((m, i) => (
            <div
              key={i}
              style={{
                marginBottom: '1.25rem',
              }}
            >
              <p
                className="chrome"
                style={{
                  marginBottom: '0.375rem',
                  color: m.role === 'user' ? 'var(--ink)' : 'var(--muted)',
                }}
              >
                {m.role === 'user' ? 'You' : 'Claude Opus 4.7'}
              </p>
              <div
                style={{
                  fontFamily: m.role === 'user' ? 'inherit' : 'Georgia, serif',
                  fontSize: m.role === 'user' ? '0.9375rem' : '1rem',
                  lineHeight: 1.65,
                  whiteSpace: 'pre-wrap',
                  color: 'var(--ink)',
                }}
              >
                {m.content}
              </div>
            </div>
          ))}
          {pending && (
            <p
              className="chrome"
              style={{ color: 'var(--muted)', fontStyle: 'italic' }}
            >
              Claude is thinking&hellip;
            </p>
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Ask anything…"
          rows={2}
          disabled={pending}
          style={{
            flex: 1,
            fontFamily: 'inherit',
            fontSize: '0.9375rem',
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
          onClick={() => send()}
          disabled={!input.trim() || pending}
          className="btn"
          style={{ alignSelf: 'stretch', padding: '0 1.25rem' }}
        >
          {pending ? '…' : 'Ask'}
        </button>
      </div>
      <p
        style={{
          color: 'var(--muted)',
          fontSize: '0.75rem',
          marginTop: '0.5rem',
        }}
      >
        Press ⌘+Enter (or Ctrl+Enter) to send.
      </p>
      {error && (
        <p style={{ color: '#a33', fontSize: '0.875rem', marginTop: '0.5rem' }}>
          {error}
        </p>
      )}
    </section>
  );
}
