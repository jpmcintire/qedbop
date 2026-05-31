'use client';

// Static visual mock of the proposed "Build a lesson" workflow. Not
// linked from anywhere in the app — accessed by typing the URL.
// Designed to be poked at: the stepper is clickable, the inline
// library drawer expands a poem, the lesson-shape cards visibly
// affect downstream defaults. No real API calls, no real state
// persistence — every reload returns to step 1.
//
// What the mock is validating:
//   - Horizontal mini-map stepper reads cleanly at a glance
//   - Done steps collapse to one-line summaries with Edit
//   - Step 2 (Poem & settings) pulls library content inline rather
//     than navigating away
//   - Lesson Shape step makes the "in-class vs at-home" choice
//     feel meaningful (defaults nudge is visible in step 5)
//
// If the shape works, this becomes the spec for the real /build
// rebuild. Until then, /build behaves exactly as it does today.

import { useState } from 'react';
import { POEMS } from '@/lib/poems';
import { TopNav } from '@/app/_components/TopNav';

const STEPS = [
  { n: 1, key: 'start', label: 'Start' },
  { n: 2, key: 'poem', label: 'Poem & settings' },
  { n: 3, key: 'audience', label: 'Audience' },
  { n: 4, key: 'shape', label: 'Shape' },
  { n: 5, key: 'questions', label: 'Questions' },
] as const;

type StepKey = (typeof STEPS)[number]['key'];

export default function BuildMock() {
  const [current, setCurrent] = useState<number>(2);

  // Sample state — represents what the teacher has "decided" so far.
  // The mock pretends step 1 is always done; steps 2+ become done as
  // the user clicks Continue.
  const [poemSlug, setPoemSlug] = useState<string | null>('stopping-by-woods');
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [audience, setAudience] = useState<string>('high-school');
  const [shape, setShape] = useState<'in-class' | 'at-home' | null>(null);

  const poem = POEMS.find((p) => p.slug === poemSlug);

  return (
    <main className="page" style={{ maxWidth: '52rem' }}>
      <TopNav current="build" />

      <header style={{ marginBottom: '1rem' }}>
        <p className="chrome" style={{ margin: 0, color: '#a06d2f' }}>
          MOCK · not the real builder · /mocks/build-v2
        </p>
        <h1
          style={{
            fontFamily: 'Georgia, "Source Serif Pro", serif',
            fontSize: '1.75rem',
            fontWeight: 600,
            margin: '0.25rem 0 0 0',
          }}
        >
          Build a lesson
        </h1>
      </header>

      <Stepper current={current} onJump={setCurrent} />

      <div style={{ display: 'grid', gap: '0.75rem' }}>
        {/* Step 1 — Start */}
        {current > 1 ? (
          <DoneRow
            n={1}
            label="Start"
            summary="Started with: Tell us what you’re teaching → suggested Frost"
            onEdit={() => setCurrent(1)}
          />
        ) : (
          <ActiveCard n={1} title="How would you like to start?">
            <div style={{ color: 'var(--muted)' }}>
              (Mock) The three launcher options live here. Click Continue to skip.
            </div>
            <Continue onClick={() => setCurrent(2)} />
          </ActiveCard>
        )}

        {/* Step 2 — Poem & settings (the inline library drawer) */}
        {current > 2 ? (
          <DoneRow
            n={2}
            label="Poem & settings"
            summary={
              poem
                ? `${poem.title} — ${poem.author}, ${poem.year} · ${
                    selectedVideo ? '1 setting' : `${poem.versions.length} settings`
                  }`
                : 'Not chosen'
            }
            onEdit={() => setCurrent(2)}
          />
        ) : current === 2 ? (
          <ActiveCard n={2} title="Pick a poem and which setting(s) to use">
            <p style={{ color: 'var(--muted)', fontSize: '0.9375rem', margin: '0 0 1rem 0' }}>
              The library is right here — no need to leave this page. Pick a poem to expand its
              settings inline.
            </p>
            <LibraryDrawer
              poemSlug={poemSlug}
              setPoemSlug={setPoemSlug}
              selectedVideo={selectedVideo}
              setSelectedVideo={setSelectedVideo}
            />
            <Continue
              disabled={!poemSlug}
              onClick={() => setCurrent(3)}
              label="Continue with this poem →"
            />
          </ActiveCard>
        ) : (
          <UpcomingRow n={2} label="Poem & settings" />
        )}

        {/* Step 3 — Audience */}
        {current > 3 ? (
          <DoneRow
            n={3}
            label="Audience"
            summary={AUDIENCE_LABEL[audience]}
            onEdit={() => setCurrent(3)}
          />
        ) : current === 3 ? (
          <ActiveCard n={3} title="Who is this for?">
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {Object.entries(AUDIENCE_LABEL).map(([value, label]) => (
                <Chip
                  key={value}
                  active={audience === value}
                  onClick={() => setAudience(value)}
                >
                  {label}
                </Chip>
              ))}
            </div>
            <Continue onClick={() => setCurrent(4)} />
          </ActiveCard>
        ) : (
          <UpcomingRow n={3} label="Audience" />
        )}

        {/* Step 4 — Lesson shape (NEW) */}
        {current > 4 ? (
          <DoneRow
            n={4}
            label="Shape"
            summary={shape === 'at-home' ? 'With at-home component' : 'In class only'}
            onEdit={() => setCurrent(4)}
          />
        ) : current === 4 ? (
          <ActiveCard n={4} title="What kind of lesson?">
            <p style={{ color: 'var(--muted)', fontSize: '0.9375rem', margin: '0 0 1rem 0' }}>
              This nudges the defaults for the next step. You can always override.
            </p>
            <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: '1fr 1fr' }}>
              <ShapeCard
                active={shape === 'in-class'}
                onClick={() => setShape('in-class')}
                title="In class only"
                hint="Short prompts. 2–3 questions. No expiration pressure."
              />
              <ShapeCard
                active={shape === 'at-home'}
                onClick={() => setShape('at-home')}
                title="With at-home component"
                hint="Longer written responses. 4–5 questions. Expires in 14 days."
              />
            </div>
            <Continue disabled={!shape} onClick={() => setCurrent(5)} />
          </ActiveCard>
        ) : (
          <UpcomingRow n={4} label="Shape" />
        )}

        {/* Step 5 — Questions */}
        {current === 5 ? (
          <ActiveCard n={5} title="Questions">
            <p className="chrome" style={{ margin: '0 0 0.5rem 0' }}>
              {shape === 'at-home'
                ? 'Defaults applied: 4 questions, short-essay length, expires in 14 days.'
                : shape === 'in-class'
                  ? 'Defaults applied: 3 questions, short-paragraph, no expiration.'
                  : 'Defaults: 4 questions, paragraph length.'}
            </p>
            <ol style={{ paddingLeft: '1.25rem', margin: '0.5rem 0 1rem 0', lineHeight: 1.55 }}>
              <li>What does the music argue about the poem that the words alone don’t say?</li>
              <li>
                Identify a moment where the instrumentation changes unexpectedly and explain its
                interpretive effect.
              </li>
              <li>How does the singer’s phrasing reshape the meter of the original?</li>
              <li>
                What does this setting <em>cost</em> the poem — what does it strip away to make
                its argument?
              </li>
            </ol>
            <details>
              <summary
                style={{ cursor: 'pointer', color: 'var(--muted)', fontSize: '0.875rem' }}
              >
                Tune (topics, length, count, expiration)
              </summary>
              <div
                style={{
                  marginTop: '0.75rem',
                  padding: '0.75rem',
                  border: '1px dashed var(--rule)',
                  borderRadius: '0.375rem',
                  color: 'var(--muted)',
                  fontSize: '0.875rem',
                }}
              >
                Advanced controls collapsed in this mock. Today’s Topics / Length / Count
                pickers and the Expiration date would live here.
              </div>
            </details>
            <Continue onClick={() => alert('In the real builder this lands you on the URL block.')}
              label="Get my URLs →" />
          </ActiveCard>
        ) : (
          <UpcomingRow n={5} label="Questions" />
        )}
      </div>
    </main>
  );
}

// ---- Stepper ----

function Stepper({ current, onJump }: { current: number; onJump: (n: number) => void }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        margin: '0 0 2rem 0',
        flexWrap: 'wrap',
      }}
      aria-label="Build progress"
    >
      {STEPS.map((s, i) => {
        const done = current > s.n;
        const active = current === s.n;
        return (
          <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => onJump(s.n)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: active ? 'var(--ink)' : done ? 'rgba(0,0,0,0.06)' : 'transparent',
                color: active ? 'var(--paper)' : done ? 'var(--ink)' : 'var(--muted)',
                border: `1px solid ${active ? 'var(--ink)' : 'var(--rule)'}`,
                borderRadius: '999px',
                padding: '0.25rem 0.75rem',
                cursor: 'pointer',
                fontSize: '0.8125rem',
                fontFamily: 'inherit',
                lineHeight: 1,
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '1.25rem',
                  height: '1.25rem',
                  borderRadius: '999px',
                  background: active ? 'var(--paper)' : done ? 'var(--ink)' : 'transparent',
                  color: active ? 'var(--ink)' : done ? 'var(--paper)' : 'var(--muted)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  border: !active && !done ? '1px solid var(--rule)' : 'none',
                }}
              >
                {done ? '✓' : s.n}
              </span>
              {s.label}
            </button>
            {i < STEPS.length - 1 && (
              <span style={{ color: 'var(--rule)', fontSize: '0.875rem' }}>—</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---- Done / Active / Upcoming row variants ----

function DoneRow({
  n,
  label,
  summary,
  onEdit,
}: {
  n: number;
  label: string;
  summary: string;
  onEdit: () => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.625rem 1rem',
        border: '1px solid var(--rule)',
        borderRadius: '0.375rem',
        background: 'rgba(0,0,0,0.02)',
      }}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '1.5rem',
          height: '1.5rem',
          borderRadius: '999px',
          background: 'var(--ink)',
          color: 'var(--paper)',
          fontSize: '0.75rem',
          flexShrink: 0,
        }}
      >
        ✓
      </span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <span className="chrome" style={{ marginRight: '0.5rem' }}>
          {label}
        </span>
        <span style={{ fontSize: '0.9375rem' }}>{summary}</span>
      </div>
      <button
        type="button"
        onClick={onEdit}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--muted)',
          cursor: 'pointer',
          fontFamily: 'inherit',
          fontSize: '0.8125rem',
          textDecoration: 'underline',
        }}
      >
        Edit
      </button>
    </div>
  );
}

function UpcomingRow({ n, label }: { n: number; label: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.625rem 1rem',
        color: 'var(--muted)',
        fontSize: '0.9375rem',
      }}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '1.5rem',
          height: '1.5rem',
          borderRadius: '999px',
          border: '1px solid var(--rule)',
          fontSize: '0.75rem',
          flexShrink: 0,
        }}
      >
        {n}
      </span>
      {label}
    </div>
  );
}

function ActiveCard({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        padding: '1.25rem 1.5rem',
        border: '2px solid var(--ink)',
        borderRadius: '0.5rem',
      }}
    >
      <header
        style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '1.75rem',
            height: '1.75rem',
            borderRadius: '999px',
            background: 'var(--ink)',
            color: 'var(--paper)',
            fontSize: '0.875rem',
            fontWeight: 600,
          }}
        >
          {n}
        </span>
        <h2
          style={{
            fontFamily: 'Georgia, "Source Serif Pro", serif',
            fontSize: '1.25rem',
            fontWeight: 600,
            margin: 0,
          }}
        >
          {title}
        </h2>
      </header>
      {children}
    </section>
  );
}

// ---- Inline library drawer (the headline UX bet) ----

function LibraryDrawer({
  poemSlug,
  setPoemSlug,
  selectedVideo,
  setSelectedVideo,
}: {
  poemSlug: string | null;
  setPoemSlug: (s: string | null) => void;
  selectedVideo: string | null;
  setSelectedVideo: (id: string | null) => void;
}) {
  const [sort, setSort] = useState<'title' | 'poet' | 'year'>('title');
  const sorted = [...POEMS].sort((a, b) => {
    if (sort === 'title') return a.title.localeCompare(b.title);
    if (sort === 'poet') return lastName(a.author).localeCompare(lastName(b.author));
    return a.year - b.year;
  });

  return (
    <div style={{ border: '1px solid var(--rule)', borderRadius: '0.375rem' }}>
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          padding: '0.5rem 0.75rem',
          borderBottom: '1px solid var(--rule)',
          background: 'rgba(0,0,0,0.02)',
          alignItems: 'center',
        }}
      >
        <span className="chrome">Sort:</span>
        {(['title', 'poet', 'year'] as const).map((k) => (
          <Chip key={k} active={sort === k} onClick={() => setSort(k)} small>
            {k === 'title' ? 'A–Z' : k === 'poet' ? 'Poet' : 'Year'}
          </Chip>
        ))}
        <span style={{ marginLeft: 'auto' }} className="chrome">
          {POEMS.length} poems
        </span>
      </div>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {sorted.map((p) => {
          const expanded = poemSlug === p.slug;
          return (
            <li key={p.slug} style={{ borderBottom: '1px solid var(--rule)' }}>
              <button
                type="button"
                onClick={() => {
                  setPoemSlug(expanded ? null : p.slug);
                  setSelectedVideo(null);
                }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '0.75rem 1rem',
                  background: expanded ? 'rgba(0,0,0,0.03)' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  gap: '1rem',
                }}
              >
                <span>
                  <strong style={{ fontFamily: 'Georgia, "Source Serif Pro", serif' }}>
                    {p.title}
                  </strong>
                  <span className="chrome" style={{ marginLeft: '0.5rem' }}>
                    {p.author}, {p.year}
                  </span>
                </span>
                <span className="chrome" style={{ whiteSpace: 'nowrap' }}>
                  {p.versions.length} setting{p.versions.length === 1 ? '' : 's'}{' '}
                  {expanded ? '▴' : '▾'}
                </span>
              </button>
              {expanded && (
                <div style={{ padding: '0.5rem 1rem 1rem 1rem' }}>
                  <pre
                    className="poem"
                    style={{ fontSize: '0.9375rem', marginBottom: '0.75rem' }}
                  >
                    {p.text.split('\n').slice(0, 6).join('\n')}
                    {p.text.split('\n').length > 6 ? '\n…' : ''}
                  </pre>
                  <p className="chrome" style={{ margin: '0 0 0.5rem 0' }}>
                    Settings:
                  </p>
                  <div style={{ display: 'grid', gap: '0.5rem' }}>
                    {p.versions.map((v) => (
                      <button
                        key={v.youtubeId}
                        type="button"
                        onClick={() => setSelectedVideo(v.youtubeId)}
                        style={{
                          textAlign: 'left',
                          padding: '0.5rem 0.75rem',
                          border: `1px solid ${selectedVideo === v.youtubeId ? 'var(--ink)' : 'var(--rule)'}`,
                          borderRadius: '0.375rem',
                          background:
                            selectedVideo === v.youtubeId ? 'rgba(0,0,0,0.04)' : 'var(--paper)',
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          fontSize: '0.875rem',
                        }}
                      >
                        <strong>{v.label}</strong>
                        {v.artist && <span className="chrome"> · {v.artist}</span>}
                        {v.genre && <span className="chrome"> · {v.genre}</span>}
                        {selectedVideo === v.youtubeId && (
                          <span style={{ float: 'right' }} className="chrome">
                            ✓ selected
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ---- Small primitives ----

function Chip({
  children,
  active,
  onClick,
  small,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  small?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: small ? '0.125rem 0.5rem' : '0.375rem 0.75rem',
        border: `1px solid ${active ? 'var(--ink)' : 'var(--rule)'}`,
        background: active ? 'var(--ink)' : 'var(--paper)',
        color: active ? 'var(--paper)' : 'var(--ink)',
        borderRadius: '999px',
        cursor: 'pointer',
        fontFamily: 'inherit',
        fontSize: small ? '0.75rem' : '0.875rem',
        lineHeight: 1.2,
      }}
    >
      {children}
    </button>
  );
}

function ShapeCard({
  active,
  onClick,
  title,
  hint,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  hint: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        textAlign: 'left',
        padding: '1rem',
        border: `2px solid ${active ? 'var(--ink)' : 'var(--rule)'}`,
        borderRadius: '0.5rem',
        background: active ? 'rgba(0,0,0,0.03)' : 'var(--paper)',
        cursor: 'pointer',
        fontFamily: 'inherit',
      }}
    >
      <div
        style={{
          fontFamily: 'Georgia, "Source Serif Pro", serif',
          fontSize: '1rem',
          fontWeight: 600,
          marginBottom: '0.25rem',
        }}
      >
        {title}
      </div>
      <div style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>{hint}</div>
    </button>
  );
}

function Continue({
  onClick,
  disabled,
  label = 'Continue →',
}: {
  onClick: () => void;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <div style={{ marginTop: '1.25rem' }}>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="btn"
        style={{ opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
      >
        {label}
      </button>
    </div>
  );
}

// ---- Helpers ----

const AUDIENCE_LABEL: Record<string, string> = {
  'middle-school': 'Middle school',
  'high-school': 'High school',
  college: 'College',
  'post-graduate': 'Post-graduate',
};

function lastName(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts.length > 1 ? parts[parts.length - 1] : name;
}
