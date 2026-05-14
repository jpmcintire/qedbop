import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';

export default async function WorkDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const work = await prisma.work.findUnique({
    where: { id },
    include: {
      versions: {
        orderBy: [{ isRecommended: 'desc' }, { label: 'asc' }],
      },
    },
  });
  if (!work) notFound();

  return (
    <div className="max-w-page mx-auto px-6 pt-16 pb-24">
      <p className="chrome mb-2">
        <Link href="/app/library" className="underline">Library</Link> · {work.author}
      </p>
      <h1 className="font-serif text-4xl text-ink mb-2">{work.title}</h1>
      {work.publicationYear && (
        <p className="chrome mb-8">{work.publicationYear}</p>
      )}

      <div className="grid md:grid-cols-[1fr_1fr] gap-12 mt-8">
        <section>
          <h2 className="chrome mb-3 pb-2 border-b border-rule">Text</h2>
          <pre className="poem">{work.fullText}</pre>
          {work.themes.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {work.themes.map((t) => (
                <span key={t} className="chrome px-2 py-1 border border-rule rounded-full">
                  {t}
                </span>
              ))}
            </div>
          )}
        </section>
        <section>
          <h2 className="chrome mb-3 pb-2 border-b border-rule">Versions</h2>
          {work.versions.length === 0 ? (
            <p className="prose-literary text-muted">No versions yet.</p>
          ) : (
            <ul className="space-y-6">
              {work.versions.map((v) => (
                <li key={v.id} className="border border-rule rounded-lg p-4">
                  <div className="chrome mb-2 flex items-baseline justify-between">
                    <span>{v.label}</span>
                    {v.isRecommended && <span className="text-muted">recommended</span>}
                  </div>
                  <div className="aspect-video mb-3">
                    <iframe
                      className="w-full h-full border-0"
                      src={`https://www.youtube-nocookie.com/embed/${v.youtubeId}`}
                      title={v.label}
                      allow="accelerometer; clipboard-write; encrypted-media; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                  {v.musicDescription && (
                    <p className="prose-literary text-muted text-sm">{v.musicDescription}</p>
                  )}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-8">
            <Link
              href={`/app/build?workId=${work.id}`}
              className="bg-ink text-paper px-5 py-2 rounded-full chrome no-underline"
            >
              Build assignment from this work
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
