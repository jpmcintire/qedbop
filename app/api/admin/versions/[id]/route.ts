import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const VersionUpdateSchema = z.object({
  label: z.string().min(1).optional(),
  youtubeId: z.string().min(1).optional(),
  youtubeStatus: z.enum(['PUBLIC', 'UNLISTED']).optional(),
  durationSeconds: z.number().int().nullable().optional(),
  musicDescription: z.string().nullable().optional(),
  chorusPhrases: z.string().nullable().optional(),
  vocalCharacter: z.string().nullable().optional(),
  isRecommended: z.boolean().optional(),
  musicTextTeacherOnly: z.string().optional(),
  musicTextThemes: z.string().optional(),
  musicTextDepth: z.number().int().min(1).max(5).nullable().optional(),
  comparativeValue: z.number().int().min(1).max(5).nullable().optional(),
  emotionalImpact: z.number().int().min(1).max(5).nullable().optional(),
  accessibility: z.number().int().min(1).max(5).nullable().optional(),
  discussionPotential: z.number().int().min(1).max(5).nullable().optional(),
});

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'ADMIN') return null;
  return session.user;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = VersionUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
  }
  const version = await prisma.version.update({ where: { id }, data: parsed.data });
  return NextResponse.json(version);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  await prisma.version.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
