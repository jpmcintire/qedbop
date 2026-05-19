'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import { POEMS } from '@/lib/poems';
import { LoadingMessages } from '@/app/_components/LoadingMessages';

type Props = {
  isPro: boolean;
  agendaMinutes: number | undefined;
  bioDepth: 'short' | 'expanded';
  contextDepth: 'short' | 'expanded';
  slug: string;
};

const MINUTE_OPTIONS = [30, 45, 60, 75, 90, 120];

// Pro mode toggle and inline controls that mutate the URL.
// Each control updates the URL via router.replace, which triggers a
// server re-render with new overrides for the AI generator.
export function ProControls({
  isPro,
  agendaMinutes,
  bioDepth,
  contextDepth,
  slug,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [pending, startTransition] = useTransition();
  const poem = POEMS.find((p) => p.slug === slug);

  function updateParams(updates: Record<string, string | null>) {
    const next = new URLSearchParams(sp.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null) next.delete(key);
      else next.set(key, value);
    }
    startTransition(() => {
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    });
  }

  function setTeacherMode(mode: 'basic' | 'pro') {
    if (mode === 'basic') {
      // Strip all pro overrides when going back to basic.
      updateParams({
        tmode: null,
        agendamin: null,
        biodepth: null,
        contextdepth: null,
      });
    } else {
      updateParams({ tmode: 'pro' });
    }
  }

  return (
    <div style={{ marginBottom: '2rem' }}>
      <div
        style={{
          display: 'inline-flex',
          border: '1px solid var(--rule)',
          borderRadius: '9999px',
          padding: '0.25rem',
          gap: '0.25rem',
        }}
      >
        {(['basic', 'pro'] as const).map((m) => {
          const active = isPro ? m === 'pro' : m === 'basic';
          return (
            <button
              key={m}
              type="button"
              onClick={() => setTeacherMode(m)}
              disabled={pending}
              style={{
                padding: '0.375rem 1rem',
                borderRadius: '9999px',
                border: 'none',
                background: active ? 'var(--ink)' : 'transparent',
                color: active ? 'var(--paper)' : 'var(--ink)',
                fontSize: '0.8125rem',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                cursor: pending ? 'wait' : 'pointer',
                opacity: pending ? 0.6 : 1,
              }}
            >
              {m === 'basic' ? 'Basic' : 'Pro'}
            </button>
          );
        })}
      </div>
      <p
        style={{
          color: 'var(--muted)',
          fontSize: '0.8125rem',
          marginTop: '0.5rem',
          maxWidth: '46rem',
        }}
      >
        {isPro
          ? "Pro mode lets you reshape the teacher edition: pick an agenda length, expand the poet bio or historical context for deeper coverage. Changes regenerate the affected sections (each unique combination is cached)."
          : 'Basic shows the default teacher edition. Switch to Pro to customize the agenda length and expand bio or context.'}
      </p>

      {isPro && (
        <div
          style={{
            marginTop: '1rem',
            padding: '1rem 1.25rem',
            border: '1px solid var(--rule)',
            borderRadius: '0.5rem',
            background: 'rgba(27,27,26,0.02)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          <Control label="Target agenda length">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => updateParams({ agendamin: null })}
                disabled={pending}
                style={chipStyle(agendaMinutes === undefined, pending)}
              >
                Auto
              </button>
              {MINUTE_OPTIONS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => updateParams({ agendamin: String(m) })}
                  disabled={pending}
                  style={chipStyle(agendaMinutes === m, pending)}
                >
                  {m} min
                </button>
              ))}
            </div>
          </Control>

          <Control label="Poet bio depth">
            <div style={{ display: 'flex', gap: '0.375rem' }}>
              <button
                type="button"
                onClick={() => updateParams({ biodepth: null })}
                disabled={pending}
                style={chipStyle(bioDepth === 'short', pending)}
              >
                Short
              </button>
              <button
                type="button"
                onClick={() => updateParams({ biodepth: 'expanded' })}
                disabled={pending}
                style={chipStyle(bioDepth === 'expanded', pending)}
              >
                Expanded
              </button>
            </div>
          </Control>

          <Control label="Historical context depth">
            <div style={{ display: 'flex', gap: '0.375rem' }}>
              <button
                type="button"
                onClick={() => updateParams({ contextdepth: null })}
                disabled={pending}
                style={chipStyle(contextDepth === 'short', pending)}
              >
                Short
              </button>
              <button
                type="button"
                onClick={() => updateParams({ contextdepth: 'expanded' })}
                disabled={pending}
                style={chipStyle(contextDepth === 'expanded', pending)}
              >
                Expanded
              </button>
            </div>
          </Control>

          {pending && (
            <p className="chrome" style={{ color: 'var(--muted)' }}>
              qed&rsquo;bop is regenerating the affected sections.{' '}
              <LoadingMessages poem={poem} />
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function Control({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
      <p className="chrome" style={{ margin: 0 }}>{label}</p>
      {children}
    </div>
  );
}

function chipStyle(active: boolean, pending: boolean): React.CSSProperties {
  return {
    padding: '0.375rem 0.875rem',
    borderRadius: '9999px',
    border: `1px solid ${active ? 'var(--ink)' : 'var(--rule)'}`,
    background: active ? 'var(--ink)' : 'transparent',
    color: active ? 'var(--paper)' : 'var(--ink)',
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    cursor: pending ? 'wait' : 'pointer',
    opacity: pending ? 0.6 : 1,
  };
}
