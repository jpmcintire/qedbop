'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

// Browse experience for the library: sortable + filterable list of every
// poem in the catalog. Renders client-side because the controls are
// purely state — the data set is small (~10 poems) so passing the whole
// thing in once is cheaper than re-querying the server per interaction.

type PoemRow = {
  slug: string;
  title: string;
  author: string;
  year: number;
  settingsCount: number;
  firstLine: string;
};

type Sort = 'title' | 'poet' | 'year-asc' | 'year-desc';

// Era buckets are coarse on purpose — most teachers think in roughly
// these blocks ("Romantic / Victorian / Modernist / Contemporary") when
// they're picking lessons by unit. Year ranges chosen to keep each
// bucket non-empty across the current catalog while still meaning what
// the labels say.
const ERAS = [
  { id: 'all', label: 'All eras', test: (_y: number) => true },
  { id: 'pre-1800', label: 'Pre-1800', test: (y: number) => y < 1800 },
  { id: '19c', label: '19th c. (1800–1899)', test: (y: number) => y >= 1800 && y < 1900 },
  { id: 'early-20c', label: 'Early 20th c. (1900–1945)', test: (y: number) => y >= 1900 && y < 1946 },
  { id: 'mid-late-20c', label: 'Mid-late 20th c. (1946–1999)', test: (y: number) => y >= 1946 && y < 2000 },
  { id: 'contemporary', label: 'Contemporary (2000+)', test: (y: number) => y >= 2000 },
] as const;

export function LibraryBrowser({ poems }: { poems: PoemRow[] }) {
  const [sort, setSort] = useState<Sort>('title');
  const [era, setEra] = useState<(typeof ERAS)[number]['id']>('all');
  const [poet, setPoet] = useState<string>('all');

  const poets = useMemo(() => {
    const seen = new Set<string>();
    for (const p of poems) seen.add(p.author);
    return Array.from(seen).sort((a, b) => byLastName(a).localeCompare(byLastName(b)));
  }, [poems]);

  const visible = useMemo(() => {
    const eraDef = ERAS.find((e) => e.id === era)!;
    const filtered = poems.filter((p) => {
      if (!eraDef.test(p.year)) return false;
      if (poet !== 'all' && p.author !== poet) return false;
      return true;
    });
    const sorted = [...filtered].sort((a, b) => {
      switch (sort) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'poet':
          return byLastName(a.author).localeCompare(byLastName(b.author));
        case 'year-asc':
          return a.year - b.year;
        case 'year-desc':
          return b.year - a.year;
      }
    });
    return sorted;
  }, [poems, era, poet, sort]);

  return (
    <div>
      <div
        style={{
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          marginBottom: '1.5rem',
        }}
      >
        <Control label="Sort">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            style={selectStyle}
          >
            <option value="title">Title (A→Z)</option>
            <option value="poet">Poet (A→Z)</option>
            <option value="year-asc">Year (oldest first)</option>
            <option value="year-desc">Year (newest first)</option>
          </select>
        </Control>

        <Control label="Era">
          <select
            value={era}
            onChange={(e) => setEra(e.target.value as typeof era)}
            style={selectStyle}
          >
            {ERAS.map((e) => (
              <option key={e.id} value={e.id}>
                {e.label}
              </option>
            ))}
          </select>
        </Control>

        <Control label="Poet">
          <select
            value={poet}
            onChange={(e) => setPoet(e.target.value)}
            style={selectStyle}
          >
            <option value="all">All poets</option>
            {poets.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </Control>
      </div>

      <p className="chrome" style={{ marginBottom: '1rem' }}>
        {visible.length} poem{visible.length === 1 ? '' : 's'}
      </p>

      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.75rem' }}>
        {visible.map((p) => (
          <li key={p.slug}>
            <Link
              href={`/library/${p.slug}`}
              style={{
                display: 'block',
                padding: '1rem 1.25rem',
                border: '1px solid var(--rule)',
                borderRadius: '0.5rem',
                textDecoration: 'none',
                color: 'var(--ink)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ minWidth: 0 }}>
                  <p className="chrome" style={{ marginBottom: '0.25rem' }}>
                    {p.author} &middot; {p.year}
                  </p>
                  <h3
                    style={{
                      fontFamily: 'Georgia, "Source Serif Pro", serif',
                      fontSize: '1.25rem',
                      fontWeight: 600,
                      margin: '0 0 0.25rem 0',
                    }}
                  >
                    {p.title}
                  </h3>
                  {p.firstLine && (
                    <p
                      style={{
                        color: 'var(--muted)',
                        fontStyle: 'italic',
                        fontSize: '0.9375rem',
                        margin: 0,
                      }}
                    >
                      {p.firstLine}
                    </p>
                  )}
                </div>
                <p className="chrome" style={{ whiteSpace: 'nowrap', alignSelf: 'center' }}>
                  {p.settingsCount} setting{p.settingsCount === 1 ? '' : 's'}
                </p>
              </div>
            </Link>
          </li>
        ))}
        {visible.length === 0 && (
          <li style={{ color: 'var(--muted)', padding: '1rem', textAlign: 'center' }}>
            No poems match these filters.
          </li>
        )}
      </ul>
    </div>
  );
}

function Control({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
      <span className="chrome">{label}</span>
      {children}
    </label>
  );
}

const selectStyle: React.CSSProperties = {
  padding: '0.5rem 0.75rem',
  border: '1px solid var(--rule)',
  borderRadius: '0.375rem',
  background: 'var(--paper)',
  color: 'var(--ink)',
  fontSize: '0.9375rem',
  fontFamily: 'inherit',
};

// Sorts poets by their last name (so "Robert Frost" sorts under "F",
// "Edna St. Vincent Millay" under "M"). Falls back to the raw name if
// there's no space.
function byLastName(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts.length > 1 ? parts[parts.length - 1] : name;
}
