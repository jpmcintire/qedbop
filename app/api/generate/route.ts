import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateCurriculum } from '@/lib/claude';
import { loadStandardsFor } from '@/lib/standards';
import { GenerateRequestSchema } from '@/lib/schemas';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = GenerateRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.issues },
      { status: 400 }
    );
  }

  const teacher = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { state: true, gradeLevels: true, courseType: true },
  });
  if (!teacher) {
    return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
  }

  const versions = await prisma.version.findMany({
    where: { id: { in: parsed.data.versionIds } },
    include: { work: true },
  });
  if (versions.length === 0) {
    return NextResponse.json({ error: 'No versions found' }, { status: 404 });
  }

  const workIds = new Set(versions.map((v) => v.workId));
  if (workIds.size !== 1) {
    return NextResponse.json(
      { error: 'All selected versions must belong to the same Work' },
      { status: 400 }
    );
  }
  const work = versions[0].work;

  const standardsText = await loadStandardsFor({
    state: teacher.state,
    gradeLevels: teacher.gradeLevels,
  });

  const result = await generateCurriculum({
    work,
    versions,
    request: parsed.data,
    teacher: {
      state: teacher.state,
      gradeLevels: teacher.gradeLevels,
      courseType: teacher.courseType,
    },
    standardsText,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }
  return NextResponse.json({ curriculum: result.curriculum });
}
