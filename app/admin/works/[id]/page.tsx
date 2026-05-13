import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { WorkForm } from '../WorkForm';
import { VersionsManager } from './VersionsManager';

export default async function AdminWorkDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const work = await prisma.work.findUnique({
    where: { id },
    include: { versions: { orderBy: { label: 'asc' } } },
  });
  if (!work) notFound();

  return (
    <div className="max-w-page mx-auto px-6 pt-16 pb-24">
      <p className="chrome mb-2">
        <Link href="/admin/works" className="underline">Works</Link> · Edit
      </p>
      <h1 className="font-serif text-4xl mb-8">{work.title}</h1>

      <div className="grid lg:grid-cols-[1fr_1fr] gap-12">
        <section>
          <h2 className="chrome mb-4 pb-2 border-b border-rule">Work</h2>
          <WorkForm
            initial={{
              id: work.id,
              title: work.title,
              author: work.author,
              fullText: work.fullText,
              type: work.type,
              publicationYear: work.publicationYear,
              themes: work.themes,
              gradeBands: work.gradeBands,
            }}
          />
        </section>
        <section>
          <h2 className="chrome mb-4 pb-2 border-b border-rule">Versions</h2>
          <VersionsManager workId={work.id} versions={work.versions} />
        </section>
      </div>
    </div>
  );
}
