'use client';

import Link from 'next/link';
import { useIdentity } from '@/lib/identity-client';
import { SignInMenu } from './SignInMenu';

// Top-level teacher nav. Rendered on every page in the teacher journey
// (home, library, builder, teacher edition) so a teacher mid-flow can
// always orient and jump. Deliberately NOT rendered on student pages
// (/a/[slug]) — the brand rule is "no chrome" for students — or on
// admin pages, which have their own context.
//
// `current` underlines the active item so the teacher always knows
// where they are without scanning the URL. "My lessons" only renders
// when a fake-auth identity is signed in.

export type NavKey = 'home' | 'library' | 'build' | 'lessons' | 'none';

const STATIC_ITEMS: Array<{ key: NavKey; label: string; href: string }> = [
  { key: 'library', label: 'Library', href: '/library' },
  { key: 'build', label: 'Build a lesson', href: '/build' },
];

export function TopNav({ current = 'none' }: { current?: NavKey }) {
  const identity = useIdentity();

  const items = identity
    ? [
        ...STATIC_ITEMS,
        { key: 'lessons' as NavKey, label: 'My lessons', href: '/me/lessons' },
      ]
    : STATIC_ITEMS;

  return (
    <nav
      style={{
        display: 'flex',
        alignItems: 'center',
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
          flexWrap: 'wrap',
        }}
      >
        {items.map((item) => (
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
      <div style={{ marginLeft: 'auto' }}>
        <SignInMenu />
      </div>
    </nav>
  );
}
