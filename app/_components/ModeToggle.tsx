// Basic / Custom mode pill toggle at the top of the builder.
type Mode = 'basic' | 'custom';

type Props = {
  mode: Mode;
  setMode: (m: Mode) => void;
};

const COPY: Record<Mode, string> = {
  basic:
    'Pick a poem and the versions. One click for a student URL plus a teacher edition — calibrated for middle school students, with three AI-generated discussion questions.',
  custom:
    'Full control: pick audience, choose topics, response lengths, count, edit questions, set custom expiration. Outputs share, teacher, and editable URLs.',
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
        {(['basic', 'custom'] as const).map((m) => {
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
              {m === 'basic' ? 'Basic mode' : 'Custom mode'}
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
