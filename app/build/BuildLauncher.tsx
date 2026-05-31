'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ConciergeForm } from '../_components/ConciergeForm';

// First screen for /build. Three starting points so a teacher with a
// fuzzy goal, a teacher who likes to poke, and a teacher who knows
// exactly the shape of the lesson she wants all land somewhere useful
// instead of staring at a 9-step form.
//
// Picking a lesson type (option 3) dismisses this launcher and hands
// control back to the parent builder pre-configured with sensible
// defaults for that shape. The other two paths navigate away.

export type LessonPreset =
  | 'memorization'
  | 'analysis'
  | 'two-settings'
  | 'two-poems';

// Visible preset list. "comingSoon" presets show the label but don't
// fire onPick — teachers still see the menu of shapes we plan to
// support, which is itself communicative.
const PRESETS: Array<{ key: LessonPreset; label: string; comingSoon?: boolean }> = [
  { key: 'memorization', label: '1 poem for memorization' },
  { key: 'analysis', label: '1 poem for analysis' },
  { key: 'two-settings', label: '1 poem with 2 musical settings' },
  { key: 'two-poems', label: 'Two different poems', comingSoon: true },
];

export function BuildLauncher({ onPickPreset }: { onPickPreset: (preset: LessonPreset) => void }) {
  const [showAllPresets, setShowAllPresets] = useState(false);

  return (
    <div>
      <header style={{ marginBottom: '0.5rem' }}>
        <h1
          style={{
            fontFamily: 'Georgia, "Source Serif Pro", serif',
            fontSize: '2rem',
            fontWeight: 600,
            margin: 0,
            lineHeight: 1.15,
          }}
        >
          Build a lesson
        </h1>
        <p className="chrome" style={{ marginTop: '0.5rem' }}>
          How would you like to start?
        </p>
      </header>

      <div style={{ display: 'grid', gap: '1.5rem', marginTop: '2rem' }}>
        <LauncherCard
          n={1}
          title="Tell us what you’re teaching"
          subtitle="A poem, a poet, a theme, a literary work, a grade level — qed’bop suggests specific lessons from the library."
        >
          <ConciergeForm />
        </LauncherCard>

        <LauncherCard
          n={2}
          title="Browse the library"
          subtitle="See every poem and musical setting in the catalog. Filter by era or poet."
        >
          <Link
            href="/library"
            className="btn"
            style={{ textDecoration: 'none', display: 'inline-block' }}
          >
            Open library →
          </Link>
        </LauncherCard>

        <LauncherCard
          n={3}
          title="Pick a lesson type"
          subtitle="Skip the open-ended start. Choose a common lesson shape."
        >
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.5rem' }}>
            {PRESETS.map((p) => (
              <li key={p.key}>
                <button
                  type="button"
                  disabled={p.comingSoon}
                  onClick={() => !p.comingSoon && onPickPreset(p.key)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '0.75rem 1rem',
                    border: '1px solid var(--rule)',
                    borderRadius: '0.375rem',
                    background: 'var(--paper)',
                    color: p.comingSoon ? 'var(--muted)' : 'var(--ink)',
                    cursor: p.comingSoon ? 'not-allowed' : 'pointer',
                    fontSize: '0.9375rem',
                    fontFamily: 'inherit',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <span>{p.label}</span>
                  {p.comingSoon && (
                    <span className="chrome" style={{ fontSize: '0.75rem' }}>
                      Coming soon
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
          <div style={{ marginTop: '0.75rem' }}>
            <button
              type="button"
              onClick={() => setShowAllPresets((s) => !s)}
              className="chrome"
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                color: 'var(--muted)',
                cursor: 'pointer',
                fontFamily: 'inherit',
                textDecoration: 'underline',
              }}
            >
              {showAllPresets ? 'Hide more options' : 'See more options →'}
            </button>
            {showAllPresets && (
              <p className="chrome" style={{ marginTop: '0.5rem', color: 'var(--muted)' }}>
                More lesson shapes are on the way (poem-as-letter, poem-against-poem,
                close-listening drills, etc.). For now, start with one above or
                describe what you want in your own words.
              </p>
            )}
          </div>
        </LauncherCard>
      </div>
    </div>
  );
}

function LauncherCard({
  n,
  title,
  subtitle,
  children,
}: {
  n: number;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        padding: '1.25rem 1.5rem',
        border: '1px solid var(--rule)',
        borderRadius: '0.5rem',
      }}
    >
      <header style={{ marginBottom: '1rem' }}>
        <p className="chrome" style={{ marginBottom: '0.25rem' }}>
          Option {n}
        </p>
        <h2
          style={{
            fontFamily: 'Georgia, "Source Serif Pro", serif',
            fontSize: '1.25rem',
            fontWeight: 600,
            margin: '0 0 0.25rem 0',
          }}
        >
          {title}
        </h2>
        <p style={{ color: 'var(--muted)', fontSize: '0.9375rem', margin: 0 }}>
          {subtitle}
        </p>
      </header>
      {children}
    </section>
  );
}
