import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const WorkCreateSchema = z.object({
  title: z.string().min(1),
  author: z.string().min(1),
  fullText: z.string().min(1),
  type: z.enum(['POEM', 'PASSAGE', 'SPEECH', 'DRAMATIC']),
  sourceWork: z.string().optional(),
  publicationYear: z.number().int().optional(),
  copyrightStatus: z.enum(['PUBLIC_DOMAIN', 'LICENSED', 'UNKNOWN']).optional(),
  gradeBands: z.array(z.string()).default([]),
  themes: z.array(z.string()).default([]),
  notes: z.string().optional(),
});

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return null;
  }
  return session.user;
}

export async function POST(req: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  const parsed = WorkCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
  }
  const work = await prisma.work.create({ data: parsed.data });
  return NextResponse.json(work);
}
