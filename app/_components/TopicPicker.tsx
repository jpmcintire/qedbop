import { LoadingMessages } from './LoadingMessages';
import type { Poem } from '@/lib/poems';

type Props = {
  audienceLabel: string;
  loading: boolean;
  available: string[];
  selected: string[];
  toggle: (t: string) => void;
  customTopics: string[];
  customInput: string;
  setCustomInput: (s: string) => void;
  addCustom: () => void;
  removeCustom: (t: string) => void;
  poem?: Poem | null;
};

// AI-generated topic checkboxes (calibrated to audience) plus an "Other"
// field for the teacher to type custom topics. Both flow into the
// selected[] array that the question generator receives.
export function TopicPicker({
  audienceLabel,
  loading,
  available,
  selected,
  toggle,
  customTopics,
  customInput,
  setCustomInput,
  addCustom,
  removeCustom,
  poem,
}: Props) {
  if (loading) {
    return (
      <p style={{ fontSize: '0.875rem' }}>
        <span style={{ color: 'var(--muted)' }}>
          qed&rsquo;bop is picking topic options for {audienceLabel}.{' '}
        </span>
        <LoadingMessages poem={poem} />
      </p>
    );
  }

  return (
    <>
      {available.length > 0 && (
        <>
          <p
            style={{
              color: 'var(--muted)',
              fontSize: '0.8125rem',
              marginBottom: '0.75rem',
              maxWidth: '38rem',
            }}
          >
            Check any topics you want the question set to cover. Leave all
            unchecked to let qed&rsquo;bop pick freely. These regenerate when
            you change audience.
          </p>
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'grid',
              gap: '0.5rem',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              marginBottom: '1rem',
            }}
          >
            {available.map((t) => {
              const isSelected = selected.includes(t);
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
                      onChange={() => toggle(t)}
                    />
                    <span>{t}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </>
      )}

      <div style={{ maxWidth: '38rem' }}>
        <p className="chrome" style={{ marginBottom: '0.5rem' }}>Other</p>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addCustom();
              }
            }}
            placeholder="Add your own topic and press Enter"
            style={{
              flex: 1,
              fontFamily: 'inherit',
              fontSize: '0.9375rem',
              padding: '0.5rem 0.75rem',
              border: '1px solid var(--rule)',
              borderRadius: '0.375rem',
              background: 'transparent',
              color: 'var(--ink)',
            }}
          />
          <button
            type="button"
            onClick={addCustom}
            className="btn btn-ghost"
            disabled={!customInput.trim()}
          >
            Add
          </button>
        </div>
        {customTopics.length > 0 && (
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: '0.75rem 0 0 0',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.375rem',
            }}
          >
            {customTopics.map((t) => (
              <li
                key={t}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  padding: '0.25rem 0.625rem',
                  border: '1px solid var(--ink)',
                  borderRadius: '9999px',
                  background: 'rgba(27,27,26,0.04)',
                  fontSize: '0.8125rem',
                }}
              >
                <span>{t}</span>
                <button
                  type="button"
                  onClick={() => removeCustom(t)}
                  title="Remove this topic"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--muted)',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    padding: 0,
                    lineHeight: 1,
                  }}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
