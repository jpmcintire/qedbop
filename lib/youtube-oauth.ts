import 'server-only';
import { prisma } from './db';

// OAuth against the qed’bop YouTube channel. The refresh token (stored
// once after the owner consents) lets us mint short-lived access tokens
// on demand. Only owner-authenticated calls can enumerate unlisted
// uploads, which an API key alone cannot see.

const SCOPE = 'https://www.googleapis.com/auth/youtube.readonly';

export function getRedirectUri(): string {
  // Must exactly match an Authorized redirect URI on the OAuth client in
  // Google Cloud Console. Override with OAUTH_REDIRECT_URI for non-prod.
  return (
    process.env.OAUTH_REDIRECT_URI ||
    'https://qedbop.com/api/auth/youtube/callback'
  );
}

export function buildConsentUrl(state: string): string {
  const clientId = process.env.YOUTUBE_OAUTH_CLIENT_ID;
  if (!clientId) throw new Error('YOUTUBE_OAUTH_CLIENT_ID not set');
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', getRedirectUri());
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', SCOPE);
  url.searchParams.set('access_type', 'offline'); // get a refresh token
  url.searchParams.set('prompt', 'consent'); // force refresh-token issue
  url.searchParams.set('state', state);
  return url.toString();
}

type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope?: string;
};

// Exchange the one-time auth code for tokens and persist the refresh
// token. Returns ok/error.
export async function exchangeCodeAndStore(code: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const clientId = process.env.YOUTUBE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) return { ok: false, error: 'OAuth client env vars not set.' };

  let res: Response;
  try {
    res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: getRedirectUri(),
        grant_type: 'authorization_code',
      }),
      cache: 'no-store',
    });
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Token exchange network error.' };
  }
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    return { ok: false, error: `Token endpoint ${res.status}: ${body.slice(0, 200)}` };
  }
  const json = (await res.json()) as TokenResponse;
  if (!json.refresh_token) {
    return {
      ok: false,
      error: 'No refresh token returned. Revoke the app in your Google account and reconnect (prompt=consent forces a new one).',
    };
  }
  try {
    await prisma.youTubeToken.upsert({
      where: { id: 'singleton' },
      create: {
        id: 'singleton',
        refreshToken: json.refresh_token,
        scope: json.scope ?? SCOPE,
        channelId: process.env.YOUTUBE_CHANNEL_ID ?? null,
      },
      update: {
        refreshToken: json.refresh_token,
        scope: json.scope ?? SCOPE,
        channelId: process.env.YOUTUBE_CHANNEL_ID ?? null,
      },
    });
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to store refresh token.' };
  }
  return { ok: true };
}

// In-memory access-token cache. Refresh tokens are long-lived; access
// tokens expire in ~1h. Cache the access token until shortly before
// expiry so we don't hit the token endpoint on every request.
let cachedAccessToken: { token: string; expiresAt: number } | null = null;

export async function getAccessToken(): Promise<string | null> {
  if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now() + 60_000) {
    return cachedAccessToken.token;
  }
  const clientId = process.env.YOUTUBE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  let row;
  try {
    row = await prisma.youTubeToken.findUnique({ where: { id: 'singleton' } });
  } catch {
    return null;
  }
  if (!row?.refreshToken) return null;

  let res: Response;
  try {
    res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: row.refreshToken,
        grant_type: 'refresh_token',
      }),
      cache: 'no-store',
    });
  } catch {
    return null;
  }
  if (!res.ok) return null;
  const json = (await res.json()) as TokenResponse;
  cachedAccessToken = {
    token: json.access_token,
    expiresAt: Date.now() + json.expires_in * 1000,
  };
  return json.access_token;
}

export async function isConnected(): Promise<boolean> {
  try {
    const row = await prisma.youTubeToken.findUnique({ where: { id: 'singleton' } });
    return !!row?.refreshToken;
  } catch {
    return false;
  }
}

export async function disconnect(): Promise<void> {
  cachedAccessToken = null;
  try {
    await prisma.youTubeToken.deleteMany({ where: { id: 'singleton' } });
  } catch {
    // ignore
  }
}
