import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const VersionCreateSchema = z.object({
  workId: z.string().min(1),
  label: z.string().min(1),
  youtubeId: z.string().min(1),
  youtubeStatus: z.enum(['PUBLIC', 'UNLISTED']).default('UNLISTED'),
  durationSeconds: z.number().int().optional(),
  musicDescription: z.string().optional(),
  chorusPhrases: z.string().optional(),
  vocalCharacter: z.string().optional(),
  isRecommended: z.boolean().default(false),
  // Two-field music notes — the proprietary content. Admin UI must label them
  // distinctly so content creators don't put timestamps in the wrong field.
  musicTextTeacherOnly: z.string().default(''),
  musicTextThemes: z.string().default(''),
  musicTextDepth: z.number().int().min(1).max(5).optional(),
  comparativeValue: z.number().int().min(1).max(5).optional(),
  emotionalImpact: z.number().int().min(1).max(5).optional(),
  accessibility: z.number().int().min(1).max(5).optional(),
  discussionPotential: z.number().int().min(1).max(5).optional(),
});

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'ADMIN') return null;
  return session.user;
}

export async function POST(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await req.json().catch(() => null);
  const parsed = VersionCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
  }
  const version = await prisma.version.create({ data: parsed.data });
  return NextResponse.json(version);
}
