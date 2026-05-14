import Link from 'next/link';
import { prisma } from '@/lib/prisma';

export default async function AdminWorksPage() {
  const works = await prisma.work.findMany({
    orderBy: { updatedAt: 'desc' },
    include: { versions: { select: { id: true } } },
  });

  return (
    <div className="max-w-page mx-auto px-6 pt-16 pb-24">
      <div className="flex items-baseline justify-between mb-8">
        <div>
          <p className="chrome mb-2">Admin · Works</p>
          <h1 className="font-serif text-4xl">Library content</h1>
        </div>
        <Link
          href="/admin/works/new"
          className="bg-ink text-paper px-5 py-2 rounded-full chrome no-underline"
        >
          New work
        </Link>
      </div>

      {works.length === 0 ? (
        <p className="prose-literary text-muted">No works yet.</p>
      ) : (
        <ul className="divide-y divide-rule">
          {works.map((w) => (
            <li key={w.id} className="py-4 flex items-baseline justify-between">
              <Link
                href={`/admin/works/${w.id}`}
                className="block flex-1 hover:underline decoration-rule underline-offset-4"
              >
                <div className="chrome mb-1">{w.author}</div>
                <div className="font-serif text-xl">{w.title}</div>
                <div className="chrome mt-1">{w.versions.length} version{w.versions.length === 1 ? '' : 's'}</div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
