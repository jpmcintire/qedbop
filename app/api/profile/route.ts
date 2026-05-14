import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const ProfileSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  school: z.string().max(200).optional(),
  state: z.string().max(40).optional(),
  gradeLevels: z.array(z.string()).optional(),
  courseType: z.enum(['REGULAR', 'HONORS', 'AP', 'COLLEGE']).optional(),
  classNames: z.array(z.string()).optional(),
});

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const parsed = ProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
  }
  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: parsed.data,
    select: {
      id: true, name: true, school: true, state: true,
      gradeLevels: true, courseType: true, classNames: true,
    },
  });
  return NextResponse.json(user);
}
