'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { savePoetAnnotation, clearPoetAnnotation } from '../../actions';

type Props = {
  slug: string;
  displayName: string;
  initialSpecialFacts: string;
  hasDbRow: boolean;
};

export function EditPoetForm({ slug, displayName, initialSpecialFacts, hasDbRow }: Props) {
  const router = useRouter();
  const [specialFacts, setSpecialFacts] = useState(initialSpecialFacts);
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [persisted, setPersisted] = useState(hasDbRow);

  function save() {
    setStatus(null);
    setError(null);
    startTransition(async () => {
      const res = await savePoetAnnotation({
        slug,
        specialFacts: specialFacts || null,
      });
      if (res.ok) {
        setStatus('Saved. Next teacher-edition generation will use these facts.');
        setPersisted(specialFacts.trim().length > 0);
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  function clear() {
    if (!confirm('Clear the special facts for this poet?')) return;
    setStatus(null);
    setError(null);
    startTransition(async () => {
      const res = await clearPoetAnnotation(slug);
      if (res.ok) {
        setSpecialFacts('');
        setPersisted(false);
        setStatus('Cleared.');
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '46rem' }}>
      <h1
        style={{
          fontFamily: 'Georgia, "Source Serif Pro", serif',
          fontSize: '1.75rem',
          fontWeight: 600,
          margin: 0,
        }}
      >
        {displayName}
      </h1>

      <Group label="Special facts">
        <textarea
          value={specialFacts}
          onChange={(e) => setSpecialFacts(e.target.value)}
          rows={12}
          placeholder={`Curated facts about this poet you want the AI to weave into the teacher-edition bio, historical context, and chat answers. Examples:

- A specific influence or relationship not in standard biographies
- A primary-source quote you've found useful in class
- A correction to a common misreading
- Local / archival material you want surfaced

The AI generates the standard bio on its own — this is for what only you know or want emphasized.`}
          style={{ ...inputStyle, fontFamily: 'Georgia, serif', lineHeight: 1.6 }}
        />
        <Help>Shown to Claude during teacher-edition generation and teacher chat for any poem by this poet. Never used in student-facing question generation.</Help>
      </Group>

      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <button type="button" onClick={save} disabled={pending} className="btn">
          {pending ? 'Saving…' : 'Save'}
        </button>
        {persisted && (
          <button type="button" onClick={clear} disabled={pending} className="btn btn-ghost">
            Clear
          </button>
        )}
        {status && <span className="chrome" style={{ color: 'var(--ink)' }}>{status}</span>}
        {error && <span style={{ color: '#a33', fontSize: '0.875rem' }}>{error}</span>}
      </div>
    </div>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
      <label className="chrome" style={{ color: 'var(--ink)', fontWeight: 700 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function Help({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ color: 'var(--muted)', fontSize: '0.8125rem', fontStyle: 'italic', margin: 0 }}>
      {children}
    </p>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  fontFamily: 'inherit',
  fontSize: '0.9375rem',
  padding: '0.5rem 0.75rem',
  border: '1px solid var(--rule)',
  borderRadius: '0.375rem',
  background: 'transparent',
  color: 'var(--ink)',
  resize: 'vertical',
};
