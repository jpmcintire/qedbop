import Link from 'next/link';

// Top-level teacher nav. Rendered on every page in the teacher journey
// (home, library, builder, teacher edition) so a teacher mid-flow can
// always orient and jump. Deliberately NOT rendered on student pages
// (/a/[slug]) — the brand rule is "no chrome" for students — or on
// admin pages, which have their own context.
//
// `current` underlines the active item so the teacher always knows
// where they are without scanning the URL.

export type NavKey = 'home' | 'library' | 'build' | 'none';

const ITEMS: Array<{ key: NavKey; label: string; href: string }> = [
  { key: 'library', label: 'Library', href: '/library' },
  { key: 'build', label: 'Build a lesson', href: '/build' },
];

export function TopNav({ current = 'none' }: { current?: NavKey }) {
  return (
    <nav
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: '1.5rem',
        marginBottom: '2rem',
        flexWrap: 'wrap',
      }}
      aria-label="Main navigation"
    >
      <Link
        href="/"
        className="wordmark"
        style={{
          color: 'var(--ink)',
          fontSize: '1.5rem',
          textDecoration: 'none',
          marginRight: 'auto',
          borderBottom: current === 'home' ? '2px solid var(--ink)' : '2px solid transparent',
          lineHeight: 1.2,
        }}
      >
        qed&rsquo;bop
      </Link>
      <ul
        style={{
          display: 'flex',
          gap: '1.25rem',
          listStyle: 'none',
          padding: 0,
          margin: 0,
        }}
      >
        {ITEMS.map((item) => (
          <li key={item.key}>
            <Link
              href={item.href}
              style={{
                fontSize: '0.9375rem',
                color: current === item.key ? 'var(--ink)' : 'var(--muted)',
                textDecoration: 'none',
                paddingBottom: '0.125rem',
                borderBottom:
                  current === item.key
                    ? '2px solid var(--ink)'
                    : '2px solid transparent',
              }}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
