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
// All text items are flex siblings with `alignItems: 'baseline'` so
// the wordmark (1.5× the nav-text size) and the smaller nav links
// share the same typographic baseline and read straight across. The
// SignInMenu uses `alignSelf: 'center'` so its button chip stays
// vertically centered to the row instead of sitting on the baseline.

export type NavKey = 'home' | 'library' | 'build' | 'build-new' | 'lessons' | 'none';

const STATIC_ITEMS: Array<{ key: NavKey; label: string; href: string }> = [
  { key: 'library', label: 'Library', href: '/library' },
  { key: 'build', label: 'Build a lesson', href: '/build' },
  { key: 'build-new', label: 'Build · new', href: '/build/new' },
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
          ...textItemStyle,
          fontSize: '1.5rem',
          color: 'var(--ink)',
          borderBottomColor: current === 'home' ? 'var(--ink)' : 'transparent',
        }}
      >
        qed&rsquo;bop
      </Link>
      {items.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          style={{
            ...textItemStyle,
            fontSize: '1rem',
            color: current === item.key ? 'var(--ink)' : 'var(--muted)',
            borderBottomColor: current === item.key ? 'var(--ink)' : 'transparent',
          }}
        >
          {item.label}
        </Link>
      ))}
      <div style={{ marginLeft: 'auto', alignSelf: 'center' }}>
        <SignInMenu />
      </div>
    </nav>
  );
}

// Shared styling for nav text items. line-height: 1 keeps each item's
// box flush with its glyphs so baseline alignment isn't disrupted by
// extra leading on the larger wordmark. paddingBottom + a 2px
// border-bottom gives every item the same underline offset from the
// baseline, so the active indicator looks identical across sizes.
const textItemStyle: React.CSSProperties = {
  textDecoration: 'none',
  lineHeight: 1,
  paddingBottom: '0.2rem',
  borderBottom: '2px solid transparent',
};
