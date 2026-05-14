import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { buildAssignmentSlug } from '@/lib/slug';
import {
  CurriculumSchema,
  DepthTogglesSchema,
} from '@/lib/schemas';

const PublishSchema = z.object({
  versionIds: z.array(z.string()).min(1).max(10),
  deliveryModality: z.enum(['IN_CLASS', 'HOMEWORK', 'MIXED']),
  assignmentType: z.enum([
    'COMPARE_VERSIONS',
    'SINGLE_ANALYSIS',
    'MULTIPLE_POEMS',
    'THEMATIC',
    'NOVEL_POEM',
    'BE_PRODUCER',
    'WHATS_MISSING',
  ]),
  depthToggles: DepthTogglesSchema,
  curriculum: CurriculumSchema,
  teacherCustomizations: z.unknown().optional(),
  teacherDisplayName: z.string().max(120).optional(),
  classDisplayName: z.string().max(120).optional(),
  expiresAt: z.string().datetime().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = PublishSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.issues },
      { status: 400 }
    );
  }

  const versions = await prisma.version.findMany({
    where: { id: { in: parsed.data.versionIds } },
    include: { work: { select: { title: true } } },
  });
  if (versions.length === 0) {
    return NextResponse.json({ error: 'No versions found' }, { status: 404 });
  }

  // Generate a unique slug; retry a handful of times on the astronomically
  // small chance of a collision.
  let slug = buildAssignmentSlug(versions[0].work.title);
  for (let i = 0; i < 5; i++) {
    const exists = await prisma.assignmentPage.findUnique({
      where: { urlSlug: slug },
      select: { id: true },
    });
    if (!exists) break;
    slug = buildAssignmentSlug(versions[0].work.title);
  }

  const page = await prisma.assignmentPage.create({
    data: {
      teacherId: session.user.id,
      versionIds: parsed.data.versionIds,
      deliveryModality: parsed.data.deliveryModality,
      assignmentType: parsed.data.assignmentType,
      depthToggles: parsed.data.depthToggles,
      generatedCurriculum: parsed.data.curriculum,
      teacherCustomizations: (parsed.data.teacherCustomizations as any) ?? null,
      urlSlug: slug,
      teacherDisplayName: parsed.data.teacherDisplayName,
      classDisplayName: parsed.data.classDisplayName,
      expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
    },
    select: { id: true, urlSlug: true },
  });

  return NextResponse.json({ id: page.id, slug: page.urlSlug });
}
