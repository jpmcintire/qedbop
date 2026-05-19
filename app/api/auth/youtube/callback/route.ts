import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { exchangeCodeAndStore } from '@/lib/youtube-oauth';

export const dynamic = 'force-dynamic';

function base(): string {
  return (process.env.OAUTH_REDIRECT_URI || 'https://qedbop.com/api/auth/youtube/callback')
    .replace(/\/api\/auth\/youtube\/callback$/, '');
}

// OAuth redirect target. Google sends ?code & ?state here. Not admin-
// gated (Google can't carry the admin cookie), but protected by the
// state check against the cookie set in /admin/youtube/connect.
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const err = url.searchParams.get('error');

  const channelUrl = new URL('/admin/channel', base());

  if (err) {
    channelUrl.searchParams.set('connect_error', err);
    return NextResponse.redirect(channelUrl);
  }

  const jar = await cookies();
  const expectedState = jar.get('yt_oauth_state')?.value;
  jar.delete('yt_oauth_state');

  if (!code || !state || !expectedState || state !== expectedState) {
    channelUrl.searchParams.set('connect_error', 'state_mismatch');
    return NextResponse.redirect(channelUrl);
  }

  const res = await exchangeCodeAndStore(code);
  if (!res.ok) {
    channelUrl.searchParams.set('connect_error', res.error.slice(0, 120));
    return NextResponse.redirect(channelUrl);
  }

  channelUrl.searchParams.set('connected', '1');
  return NextResponse.redirect(channelUrl);
}
