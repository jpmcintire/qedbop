import type { LengthOption } from '@/lib/poems';

type Props = {
  options: LengthOption[];
  selected: string[];
  toggle: (value: string) => void;
};

// Audience-calibrated response-length checkboxes. Multi-select so the
// teacher can mix lengths across one assignment.
export function LengthPicker({ options, selected, toggle }: Props) {
  return (
    <>
      <p
        style={{
          color: 'var(--muted)',
          fontSize: '0.8125rem',
          marginBottom: '0.75rem',
          maxWidth: '38rem',
        }}
      >
        Check the response lengths you want. Claude calibrates question
        complexity to match. Pick one for a uniform assignment; pick several
        for a mix.
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
        {options.map((opt) => {
          const isSelected = selected.includes(opt.value);
          return (
            <li key={opt.value}>
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
                  onChange={() => toggle(opt.value)}
                />
                <span>{opt.label}</span>
              </label>
            </li>
          );
        })}
      </ul>
    </>
  );
}
