import Link from 'next/link';
import { prisma } from '@/lib/db';
import { POEMS } from '@/lib/poems';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Usage — qed'bop",
  robots: { index: false, follow: false },
};

type Row = {
  id: string;
  generator: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheCreationTokens: number;
  costUsd: number;
  poemSlug: string | null;
  audience: string | null;
  createdAt: Date;
};

const GENERATOR_LABEL: Record<string, string> = {
  questions: 'Question set',
  'single-question': 'Custom question',
  topics: 'Topic options',
  'teacher-edition': 'Teacher edition',
  'teacher-ask': 'Teacher chat',
};

export default async function UsagePage() {
  let rows: Row[] = [];
  let dbError: string | null = null;
  try {
    rows = await prisma.apiUsage.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5000,
    });
  } catch (err) {
    dbError = err instanceof Error ? err.message : 'DB read failed';
  }

  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  const total = (filter: (r: Row) => boolean) =>
    rows.filter(filter).reduce((s, r) => s + r.costUsd, 0);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const costToday = total((r) => r.createdAt.getTime() >= todayStart.getTime());
  const cost7d = total((r) => r.createdAt.getTime() >= now - 7 * dayMs);
  const cost30d = total((r) => r.createdAt.getTime() >= now - 30 * dayMs);
  const costAllTime = total(() => true);

  // Aggregate by generator over last 30d.
  const byGen = new Map<string, { count: number; cost: number; inputTokens: number; outputTokens: number; cacheRead: number }>();
  for (const r of rows) {
    if (r.createdAt.getTime() < now - 30 * dayMs) continue;
    const cur = byGen.get(r.generator) ?? { count: 0, cost: 0, inputTokens: 0, outputTokens: 0, cacheRead: 0 };
    cur.count += 1;
    cur.cost += r.costUsd;
    cur.inputTokens += r.inputTokens;
    cur.outputTokens += r.outputTokens;
    cur.cacheRead += r.cacheReadTokens;
    byGen.set(r.generator, cur);
  }
  const byGenSorted = [...byGen.entries()].sort((a, b) => b[1].cost - a[1].cost);
  const maxGenCost = byGenSorted[0]?.[1].cost ?? 0;

  // Aggregate by poem over last 30d.
  const byPoem = new Map<string, { count: number; cost: number }>();
  for (const r of rows) {
    if (r.createdAt.getTime() < now - 30 * dayMs) continue;
    const key = r.poemSlug ?? '(no poem)';
    const cur = byPoem.get(key) ?? { count: 0, cost: 0 };
    cur.count += 1;
    cur.cost += r.costUsd;
    byPoem.set(key, cur);
  }
  const byPoemSorted = [...byPoem.entries()].sort((a, b) => b[1].cost - a[1].cost);
  const maxPoemCost = byPoemSorted[0]?.[1].cost ?? 0;

  // Daily totals last 30 days.
  const dayBucket = new Map<string, number>();
  for (const r of rows) {
    if (r.createdAt.getTime() < now - 30 * dayMs) continue;
    const key = r.createdAt.toISOString().slice(0, 10);
    dayBucket.set(key, (dayBucket.get(key) ?? 0) + r.costUsd);
  }
  const days: Array<{ date: string; cost: number }> = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now - i * dayMs);
    const key = d.toISOString().slice(0, 10);
    days.push({ date: key, cost: dayBucket.get(key) ?? 0 });
  }
  const maxDay = Math.max(...days.map((d) => d.cost), 0.0001);

  // Cache hit % over last 30d.
  let cacheRead = 0;
  let nonCacheInput = 0;
  for (const r of rows) {
    if (r.createdAt.getTime() < now - 30 * dayMs) continue;
    cacheRead += r.cacheReadTokens;
    nonCacheInput += r.inputTokens;
  }
  const cacheHitPct = cacheRead + nonCacheInput > 0
    ? (cacheRead / (cacheRead + nonCacheInput)) * 100
    : 0;

  const poemTitle = (slug: string) =>
    POEMS.find((p) => p.slug === slug)?.title ?? slug;

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
        <h1
          style={{
            fontFamily: 'Georgia, "Source Serif Pro", serif',
            fontSize: '1.75rem',
            fontWeight: 600,
            margin: '0.75rem 0 0 0',
          }}
        >
          API usage
        </h1>
        <p className="chrome" style={{ marginTop: '0.25rem', fontStyle: 'italic' }}>
          Computed live from per-call records in our DB. Pricing reflects Claude Opus 4.7 at the time of each call.
        </p>
      </header>

      {dbError && (
        <p style={{ color: '#a33', marginBottom: '1.5rem' }}>{dbError}</p>
      )}

      <section style={{ marginBottom: '2.5rem' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '0.75rem',
          }}
        >
          <Card label="Today" value={fmtUsd(costToday)} />
          <Card label="Last 7 days" value={fmtUsd(cost7d)} />
          <Card label="Last 30 days" value={fmtUsd(cost30d)} />
          <Card label="All time" value={fmtUsd(costAllTime)} />
          <Card label="Cache hit (30d)" value={`${cacheHitPct.toFixed(1)}%`} />
        </div>
      </section>

      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={sectionHeading}>By feature, last 30 days</h2>
        {byGenSorted.length === 0 ? (
          <p className="chrome" style={{ fontStyle: 'italic' }}>No calls yet.</p>
        ) : (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Feature</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Calls</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Cost</th>
                <th style={thStyle}></th>
              </tr>
            </thead>
            <tbody>
              {byGenSorted.map(([gen, agg]) => (
                <tr key={gen}>
                  <td style={tdStyle}>{GENERATOR_LABEL[gen] ?? gen}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>{agg.count}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>{fmtUsd(agg.cost)}</td>
                  <td style={tdStyle}>
                    <Bar pct={maxGenCost > 0 ? (agg.cost / maxGenCost) * 100 : 0} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={sectionHeading}>By poem, last 30 days</h2>
        {byPoemSorted.length === 0 ? (
          <p className="chrome" style={{ fontStyle: 'italic' }}>No calls yet.</p>
        ) : (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Poem</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Calls</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Cost</th>
                <th style={thStyle}></th>
              </tr>
            </thead>
            <tbody>
              {byPoemSorted.map(([slug, agg]) => (
                <tr key={slug}>
                  <td style={tdStyle}>{slug === '(no poem)' ? slug : poemTitle(slug)}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>{agg.count}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>{fmtUsd(agg.cost)}</td>
                  <td style={tdStyle}>
                    <Bar pct={maxPoemCost > 0 ? (agg.cost / maxPoemCost) * 100 : 0} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={sectionHeading}>Daily cost, last 30 days</h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(30, 1fr)',
            alignItems: 'end',
            height: '8rem',
            gap: '2px',
            border: '1px solid var(--rule)',
            padding: '0.5rem',
            borderRadius: '0.5rem',
          }}
        >
          {days.map((d) => (
            <div
              key={d.date}
              title={`${d.date}: ${fmtUsd(d.cost)}`}
              style={{
                height: `${(d.cost / maxDay) * 100}%`,
                minHeight: d.cost > 0 ? '2px' : '0',
                background: 'var(--ink)',
                opacity: 0.7,
              }}
            />
          ))}
        </div>
        <p className="chrome" style={{ marginTop: '0.5rem', fontStyle: 'italic' }}>
          {days[0].date} → {days[days.length - 1].date} · max day {fmtUsd(maxDay === 0.0001 ? 0 : maxDay)}
        </p>
      </section>

      <section>
        <h2 style={sectionHeading}>Recent calls</h2>
        {rows.length === 0 ? (
          <p className="chrome" style={{ fontStyle: 'italic' }}>No calls yet.</p>
        ) : (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>When</th>
                <th style={thStyle}>Feature</th>
                <th style={thStyle}>Poem</th>
                <th style={thStyle}>Audience</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>In</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Out</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Cache</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Cost</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 50).map((r) => (
                <tr key={r.id}>
                  <td style={tdStyle}>{r.createdAt.toLocaleString()}</td>
                  <td style={tdStyle}>{GENERATOR_LABEL[r.generator] ?? r.generator}</td>
                  <td style={tdStyle}>{r.poemSlug ? poemTitle(r.poemSlug) : '—'}</td>
                  <td style={tdStyle}>{r.audience ?? '—'}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>{r.inputTokens.toLocaleString()}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>{r.outputTokens.toLocaleString()}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>{r.cacheReadTokens.toLocaleString()}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>{fmtUsd(r.costUsd)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        border: '1px solid var(--rule)',
        borderRadius: '0.5rem',
        padding: '0.875rem 1rem',
      }}
    >
      <p
        className="chrome"
        style={{ margin: 0, fontSize: '0.75rem', color: 'var(--muted)' }}
      >
        {label}
      </p>
      <p
        style={{
          margin: '0.25rem 0 0 0',
          fontFamily: 'Georgia, serif',
          fontSize: '1.5rem',
          fontWeight: 600,
        }}
      >
        {value}
      </p>
    </div>
  );
}

function Bar({ pct }: { pct: number }) {
  return (
    <div
      style={{
        background: 'var(--rule)',
        height: '0.5rem',
        borderRadius: '9999px',
        overflow: 'hidden',
        minWidth: '6rem',
      }}
    >
      <div
        style={{
          width: `${Math.max(0, Math.min(100, pct))}%`,
          height: '100%',
          background: 'var(--ink)',
          opacity: 0.7,
        }}
      />
    </div>
  );
}

function fmtUsd(n: number): string {
  if (n < 0.01) return `$${n.toFixed(4)}`;
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

const sectionHeading: React.CSSProperties = {
  fontFamily: 'Georgia, serif',
  fontSize: '1.125rem',
  fontWeight: 600,
  margin: '0 0 0.875rem 0',
};

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '0.875rem',
};

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '0.5rem 0.75rem',
  borderBottom: '1px solid var(--rule)',
  fontWeight: 600,
  fontSize: '0.75rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: 'var(--muted)',
};

const tdStyle: React.CSSProperties = {
  padding: '0.5rem 0.75rem',
  borderBottom: '1px solid var(--rule)',
};
