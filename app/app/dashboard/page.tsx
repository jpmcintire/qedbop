import Link from 'next/link';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [pages, teacher] = await Promise.all([
    prisma.assignmentPage.findMany({
      where: { teacherId: session.user.id },
      orderBy: { publishedAt: 'desc' },
      take: 50,
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, state: true, gradeLevels: true },
    }),
  ]);

  const needsProfile = !teacher?.state || teacher.gradeLevels.length === 0;
  const base = process.env.NEXT_PUBLIC_SITE_URL || '';

  const active = pages.filter((p) => p.status === 'ACTIVE');
  const archived = pages.filter((p) => p.status !== 'ACTIVE');

  // Pull work titles in a single query for the listing
  const versionIds = Array.from(new Set(pages.flatMap((p) => p.versionIds)));
  const versions = await prisma.version.findMany({
    where: { id: { in: versionIds } },
    select: { id: true, work: { select: { title: true } } },
  });
  const versionTitle = new Map(versions.map((v) => [v.id, v.work.title]));

  return (
    <div className="max-w-page mx-auto px-6 pt-16 pb-24">
      <div className="flex items-baseline justify-between mb-12">
        <div>
          <p className="chrome mb-2">Dashboard</p>
          <h1 className="font-serif text-4xl text-ink">
            Welcome{teacher?.name ? `, ${teacher.name.split(' ')[0]}` : ''}.
          </h1>
        </div>
        <Link
          href="/app/build"
          className="bg-ink text-paper px-5 py-2 rounded-full chrome no-underline"
        >
          Create new
        </Link>
      </div>

      {needsProfile && (
        <div className="border border-rule rounded-lg p-5 mb-12 max-w-prose">
          <p className="chrome mb-2">First, your profile</p>
          <p className="prose-literary text-muted mb-4">
            We need your state and grade levels to align assignments to the right standards.
          </p>
          <Link
            href="/app/profile"
            className="chrome underline hover:text-ink"
          >
            Set up profile →
          </Link>
        </div>
      )}

      <section>
        <h2 className="chrome mb-4 pb-2 border-b border-rule">Active pages</h2>
        {active.length === 0 ? (
          <p className="prose-literary text-muted py-6">
            No active assignments yet. <Link href="/app/build" className="underline">Create one</Link>.
          </p>
        ) : (
          <ul className="divide-y divide-rule">
            {active.map((p) => {
              const title = versionTitle.get(p.versionIds[0]) || 'Untitled';
              const url = `${base}/a/${p.urlSlug}`;
              return (
                <li key={p.id} className="py-5 flex items-baseline justify-between gap-6">
                  <div>
                    <Link
                      href={`/a/${p.urlSlug}`}
                      className="font-serif text-xl text-ink hover:underline decoration-rule underline-offset-4"
                    >
                      {title}
                    </Link>
                    <div className="chrome mt-1">
                      {p.assignmentType.replaceAll('_', ' ').toLowerCase()} ·{' '}
                      {p.deliveryModality.replaceAll('_', ' ').toLowerCase()} ·{' '}
                      published {new Date(p.publishedAt).toLocaleDateString()}
                    </div>
                    <div className="chrome mt-1 normal-case tracking-normal" style={{ textTransform: 'none', letterSpacing: 0 }}>
                      <span className="font-mono text-muted">{url}</span>
                    </div>
                  </div>
                  <a
                    href={`/api/qr/${p.urlSlug}`}
                    target="_blank"
                    className="chrome underline hover:text-ink whitespace-nowrap"
                  >
                    QR
                  </a>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {archived.length > 0 && (
        <section className="mt-12">
          <h2 className="chrome mb-4 pb-2 border-b border-rule">Archived</h2>
          <ul className="divide-y divide-rule">
            {archived.map((p) => {
              const title = versionTitle.get(p.versionIds[0]) || 'Untitled';
              return (
                <li key={p.id} className="py-4">
                  <div className="font-serif text-lg text-muted">{title}</div>
                  <div className="chrome mt-1">{p.status.toLowerCase()}</div>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
