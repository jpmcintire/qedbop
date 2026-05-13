import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const WorkUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  author: z.string().min(1).optional(),
  fullText: z.string().min(1).optional(),
  type: z.enum(['POEM', 'PASSAGE', 'SPEECH', 'DRAMATIC']).optional(),
  sourceWork: z.string().nullable().optional(),
  publicationYear: z.number().int().nullable().optional(),
  copyrightStatus: z.enum(['PUBLIC_DOMAIN', 'LICENSED', 'UNKNOWN']).optional(),
  gradeBands: z.array(z.string()).optional(),
  themes: z.array(z.string()).optional(),
  notes: z.string().nullable().optional(),
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
  const parsed = WorkUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
  }
  const work = await prisma.work.update({ where: { id }, data: parsed.data });
  return NextResponse.json(work);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  await prisma.work.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
