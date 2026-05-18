// Quick / Custom mode pill toggle at the top of the builder.
type Mode = 'quick' | 'custom';

type Props = {
  mode: Mode;
  setMode: (m: Mode) => void;
};

const COPY: Record<Mode, string> = {
  quick:
    'Pick a poem, the versions, and the audience. One click to get a student URL with three AI-generated questions at a sensible length.',
  custom:
    'Full control: choose topics, response lengths, count, edit questions, set custom expiration. Outputs both a share URL and an editable URL.',
};

export function ModeToggle({ mode, setMode }: Props) {
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
        {(['quick', 'custom'] as const).map((m) => {
          const active = mode === m;
          return (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              style={{
                padding: '0.375rem 1rem',
                borderRadius: '9999px',
                border: 'none',
                background: active ? 'var(--ink)' : 'transparent',
                color: active ? 'var(--paper)' : 'var(--ink)',
                fontSize: '0.8125rem',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                cursor: 'pointer',
              }}
            >
              {m === 'quick' ? 'Quick mode' : 'Custom mode'}
            </button>
          );
        })}
      </div>
      <p
        style={{
          color: 'var(--muted)',
          fontSize: '0.8125rem',
          marginTop: '0.5rem',
          maxWidth: '38rem',
        }}
      >
        {COPY[mode]}
      </p>
    </div>
  );
}
