import Link from 'next/link';
import { listPoets } from '@/lib/poems';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Admin · Poets — qed’bop",
  robots: { index: false, follow: false },
};

export default async function AdminPoetsPage() {
  const poets = listPoets();

  let annotations: Array<{ slug: string; specialFacts: string | null; updatedAt: Date }> = [];
  try {
    annotations = await prisma.poetAnnotation.findMany({
      select: { slug: true, specialFacts: true, updatedAt: true },
    });
  } catch (err) {
    console.error('[admin/poets] DB read failed:', err);
  }
  const byslug = new Map(annotations.map((a) => [a.slug, a]));

  return (
    <main className="page">
      <header style={{ marginBottom: '2.5rem' }}>
        <Link
          href="/admin"
          className="chrome"
          style={{ color: 'var(--ink)', textDecoration: 'none' }}
        >
          ← Back to admin
        </Link>
        <p className="chrome" style={{ marginTop: '0.75rem' }}>Admin · Poets</p>
        <h1
          style={{
            fontFamily: 'Georgia, "Source Serif Pro", serif',
            fontSize: '1.75rem',
            fontWeight: 600,
            margin: '0.25rem 0 0 0',
          }}
        >
          Poet special facts
        </h1>
      </header>

      <p style={{ color: 'var(--muted)', maxWidth: '46rem', marginBottom: '2rem', fontStyle: 'italic' }}>
        Curated facts about a poet — included alongside the AI-generated bio and historical context in the teacher edition and teacher chat. One entry per poet, used across every poem they wrote.
      </p>

      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.5rem' }}>
        {poets.map((p) => {
          const row = byslug.get(p.slug);
          const hasFacts = !!row?.specialFacts?.trim();
          return (
            <li key={p.slug}>
              <Link
                href={`/admin/poets/${p.slug}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem 1rem',
                  border: '1px solid var(--rule)',
                  borderRadius: '0.5rem',
                  textDecoration: 'none',
                  color: 'var(--ink)',
                }}
              >
                <span>
                  <span style={{ fontFamily: 'Georgia, serif', fontSize: '1.0625rem' }}>
                    {p.displayName}
                  </span>
                  <span className="chrome" style={{ marginLeft: '0.75rem' }}>
                    {p.poemSlugs.length} poem{p.poemSlugs.length === 1 ? '' : 's'}
                  </span>
                </span>
                <span className="chrome" style={{ color: hasFacts ? 'var(--ink)' : 'var(--muted)' }}>
                  {hasFacts
                    ? `Edited ${row!.updatedAt.toLocaleDateString()}`
                    : 'No special facts yet'}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
