import type { Version } from '@/lib/poems';

type Props = {
  versions: Version[];
  picked: string[];
  togglePick: (id: string) => void;
  poemTitle: string;
};

// Responsive grid of selectable version cards. Each card shows the label,
// a checkbox, and an inline YouTube preview the teacher can play before
// deciding whether to include it.
export function VersionPicker({ versions, picked, togglePick, poemTitle }: Props) {
  return (
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
      {versions.map((v) => {
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
              <span
                style={{
                  flex: 1,
                  fontFamily: 'Georgia, serif',
                  fontSize: '0.9375rem',
                }}
              >
                {v.label}
              </span>
            </label>
            <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${v.youtubeId}`}
                title={`${poemTitle} — ${v.label}`}
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
  );
}
