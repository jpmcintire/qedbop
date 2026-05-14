import { NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const page = await prisma.assignmentPage.findUnique({
    where: { urlSlug: slug },
    select: { id: true },
  });
  if (!page) return new NextResponse('Not found', { status: 404 });

  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const url = `${base}/a/${slug}`;
  const png = await QRCode.toBuffer(url, {
    type: 'png',
    margin: 1,
    width: 512,
    color: { dark: '#1B1B1A', light: '#FBFAF7' },
  });

  return new NextResponse(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
