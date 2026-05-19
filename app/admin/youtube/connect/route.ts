import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { randomBytes } from 'crypto';
import { requireAdmin } from '@/lib/admin-auth';
import { buildConsentUrl } from '@/lib/youtube-oauth';

export const dynamic = 'force-dynamic';

// Initiates the OAuth consent flow. Admin-gated (route handlers aren't
// covered by the /admin layout). Sets a one-time state cookie for CSRF
// protection, then redirects to Google's consent screen.
export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.redirect(new URL('/admin', process.env.OAUTH_REDIRECT_URI || 'https://qedbop.com'));
  }

  const state = randomBytes(16).toString('hex');
  const jar = await cookies();
  jar.set('yt_oauth_state', state, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 600, // 10 min
  });

  return NextResponse.redirect(buildConsentUrl(state));
}
