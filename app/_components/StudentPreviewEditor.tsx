'use client';

import { useState } from 'react';
import type { Poem, Version } from '@/lib/poems';

// Faithful client-side rendering of the /a/ student view, but with
// question text editable inline and a Save button. "What students
// see" + "click to fix it" in one surface.
//
// Scope of edits: question text only. Poem text, videos, audience
// label, length wording are all read-only — the things a teacher
// might want to tweak last-minute are the prompts.
//
// onSave is called with the full edited question array. The parent
// is responsible for propagating to URL params + lessons-store; this
// component just collects the edits.

type Props = {
  poem: Pick<Poem, 'title' | 'author' | 'year' | 'text'>;
  versions: Pick<Version, 'youtubeId' | 'label'>[];
  audienceLabel: string | null;
  lengthLabels: string[];
  questions: string[];
  onSave: (questions: string[]) => void;
  onClose: () => void;
};

export function StudentPreviewEditor({
  poem,
  versions,
  audienceLabel,
  lengthLabels,
  questions,
  onSave,
  onClose,
}: Props) {
  const [draft, setDraft] = useState<string[]>(questions);
  const dirty = draft.some((q, i) => q !== questions[i]) || draft.length !== questions.length;

  function editQuestion(i: number, value: string) {
    setDraft((prev) => {
      const next = [...prev];
      next[i] = value;
      return next;
    });
  }

  function removeQuestion(i: number) {
    setDraft((prev) => prev.filter((_, idx) => idx !== i));
  }

  function addQuestion() {
    setDraft((prev) => [...prev, '']);
  }

  function save() {
    onSave(draft.filter((q) => q.trim().length > 0));
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '1.25rem 1.5rem', flex: 1, overflow: 'auto' }}>
        {audienceLabel && (
          <p className="chrome" style={{ marginBottom: '0.5rem' }}>
            For {audienceLabel}
          </p>
        )}
        <h1
          style={{
            fontFamily: 'Georgia, "Source Serif Pro", serif',
            fontSize: '1.75rem',
            fontWeight: 600,
            lineHeight: 1.15,
            margin: 0,
          }}
        >
          {poem.title}
        </h1>
        <p className="chrome" style={{ marginTop: '0.25rem' }}>
          {poem.author} · {poem.year}
        </p>

        <section style={{ marginTop: '1.5rem' }}>
          <pre className="poem" style={{ margin: 0 }}>{poem.text}</pre>
        </section>

        {versions.length > 0 && (
          <section style={{ marginTop: '1.5rem' }}>
            <p className="chrome" style={{ marginBottom: '0.5rem' }}>Listen</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
              {versions.map((v) => (
                <div
                  key={v.youtubeId}
                  style={{
                    width: '160px',
                    border: '1px solid var(--rule)',
                    borderRadius: '0.375rem',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ width: '160px', height: '90px', background: '#000' }}>
                    <iframe
                      src={`https://www.youtube-nocookie.com/embed/${v.youtubeId}`}
                      title={v.label}
                      style={{ width: '100%', height: '100%', border: 0, display: 'block' }}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                  <p
                    className="chrome"
                    style={{ margin: 0, padding: '0.375rem 0.5rem', fontSize: '0.6875rem' }}
                  >
                    {v.label}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        <section style={{ marginTop: '1.5rem' }}>
          <p className="chrome" style={{ marginBottom: '0.25rem' }}>Discussion</p>
          {lengthLabels.length > 0 && (
            <p style={{ color: 'var(--muted)', fontSize: '0.8125rem', margin: '0 0 0.25rem 0' }}>
              Aim for responses of approximately:{' '}
              <span style={{ color: 'var(--ink)' }}>{lengthLabels.join(' / ')}</span>.
            </p>
          )}
          <p
            style={{
              color: 'var(--muted)',
              fontSize: '0.8125rem',
              margin: '0 0 0.75rem 0',
              fontStyle: 'italic',
            }}
          >
            Strong responses describe specific moments in the music.
          </p>

          <ol style={{ paddingLeft: '1.5rem', margin: 0, display: 'grid', gap: '0.75rem' }}>
            {draft.map((q, i) => (
              <li key={i}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                  <textarea
                    value={q}
                    onChange={(e) => editQuestion(i, e.target.value)}
                    style={{
                      width: '100%',
                      minHeight: '3.5em',
                      padding: '0.5rem 0.625rem',
                      border: '1px solid var(--rule)',
                      borderRadius: '0.25rem',
                      fontFamily: 'Georgia, "Source Serif Pro", serif',
                      fontSize: '1rem',
                      lineHeight: 1.55,
                      resize: 'vertical',
                      background: 'var(--paper)',
                      color: 'var(--ink)',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => removeQuestion(i)}
                    title="Remove this question"
                    aria-label="Remove this question"
                    style={{
                      background: 'transparent',
                      border: '1px solid var(--rule)',
                      borderRadius: '0.25rem',
                      padding: '0.25rem 0.5rem',
                      cursor: 'pointer',
                      color: 'var(--muted)',
                      fontFamily: 'inherit',
                      fontSize: '0.75rem',
                      flexShrink: 0,
                    }}
                  >
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ol>
          <button
            type="button"
            onClick={addQuestion}
            style={{
              marginTop: '0.5rem',
              background: 'transparent',
              border: '1px dashed var(--rule)',
              borderRadius: '0.25rem',
              padding: '0.375rem 0.75rem',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: '0.8125rem',
              color: 'var(--muted)',
            }}
          >
            + Add a blank question
          </button>
        </section>
      </div>

      <footer
        style={{
          padding: '0.875rem 1.25rem',
          borderTop: '1px solid var(--rule)',
          background: 'var(--paper)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
        }}
      >
        <span className="chrome" style={{ color: dirty ? 'var(--ink)' : 'var(--muted)' }}>
          {dirty ? 'Unsaved changes' : 'No changes'}
        </span>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: '1px solid var(--rule)',
              borderRadius: '0.25rem',
              padding: '0.5rem 0.875rem',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: '0.875rem',
              color: 'var(--muted)',
            }}
          >
            {dirty ? 'Discard' : 'Close'}
          </button>
          <button
            type="button"
            onClick={save}
            disabled={!dirty}
            className="btn"
            style={{
              fontSize: '0.875rem',
              padding: '0.5rem 1rem',
              opacity: dirty ? 1 : 0.5,
              cursor: dirty ? 'pointer' : 'not-allowed',
            }}
          >
            Save edits
          </button>
        </div>
      </footer>
    </div>
  );
}
