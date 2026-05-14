import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { CurriculumSchema, DepthTogglesSchema } from '@/lib/schemas';
import { AssignmentRenderer } from '@/components/AssignmentRenderer';

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = await prisma.assignmentPage.findUnique({
    where: { urlSlug: slug },
    select: { versionIds: true, status: true },
  });
  if (!page || page.status !== 'ACTIVE') return { title: 'qed’bop' };
  const versions = await prisma.version.findMany({
    where: { id: { in: page.versionIds } },
    select: { work: { select: { title: true, author: true } } },
  });
  const work = versions[0]?.work;
  return {
    title: work ? `${work.title} — qed’bop` : 'qed’bop',
    description: work ? `An assignment on "${work.title}" by ${work.author}.` : undefined,
    robots: { index: false, follow: false },
  };
}

export default async function PublishedAssignment({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = await prisma.assignmentPage.findUnique({
    where: { urlSlug: slug },
  });
  if (!page) notFound();
  if (page.status !== 'ACTIVE') notFound();
  if (page.expiresAt && page.expiresAt < new Date()) {
    return (
      <div className="max-w-page mx-auto px-6 pt-24 pb-24 max-w-prose">
        <p className="chrome mb-4">This assignment has expired</p>
        <p className="prose-literary">
          Ask your teacher for an updated link.
        </p>
      </div>
    );
  }

  const versions = await prisma.version.findMany({
    where: { id: { in: page.versionIds } },
    select: {
      id: true,
      label: true,
      youtubeId: true,
      work: {
        select: { title: true, author: true, fullText: true, publicationYear: true },
      },
    },
  });

  if (versions.length === 0) notFound();
  const work = versions[0].work;

  // The DB stores curriculum and toggles as JSON; parse defensively in case an
  // older row predates a schema migration.
  const curriculumParsed = CurriculumSchema.safeParse(page.generatedCurriculum);
  const togglesParsed = DepthTogglesSchema.safeParse(page.depthToggles);
  if (!curriculumParsed.success || !togglesParsed.success) {
    return (
      <div className="max-w-page mx-auto px-6 pt-24 pb-24 max-w-prose">
        <p className="chrome mb-4">Could not render assignment</p>
        <p className="prose-literary">This assignment&rsquo;s data is in an unexpected shape.</p>
      </div>
    );
  }

  return (
    <AssignmentRenderer
      work={{
        title: work.title,
        author: work.author,
        fullText: work.fullText,
        publicationYear: work.publicationYear,
      }}
      versions={versions.map((v) => ({ id: v.id, label: v.label, youtubeId: v.youtubeId }))}
      curriculum={curriculumParsed.data}
      toggles={togglesParsed.data}
      teacherDisplayName={page.teacherDisplayName}
      classDisplayName={page.classDisplayName}
    />
  );
}
