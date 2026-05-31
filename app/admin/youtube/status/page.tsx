import Link from 'next/link';
import { getRedirectUri, buildConsentUrl, isConnected, getAccessToken } from '@/lib/youtube-oauth';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "YouTube status — qed’bop",
  robots: { index: false, follow: false },
};

// Diagnostic page: reports what the SERVER sees for the YouTube OAuth
// setup. Never prints secret values — only presence for the secret, and
// the (non-secret) client id, redirect uri, and consent url so a
// redirect_uri_mismatch can be eyeballed. Admin-gated by the /admin layout.
export default async function YouTubeStatusPage() {
  const env = {
    YOUTUBE_API_KEY: !!process.env.YOUTUBE_API_KEY,
    YOUTUBE_CHANNEL_ID: process.env.YOUTUBE_CHANNEL_ID || null,
    YOUTUBE_OAUTH_CLIENT_ID: process.env.YOUTUBE_OAUTH_CLIENT_ID || null,
    YOUTUBE_OAUTH_CLIENT_SECRET: !!process.env.YOUTUBE_OAUTH_CLIENT_SECRET,
    OAUTH_REDIRECT_URI: process.env.OAUTH_REDIRECT_URI || null,
  };

  const redirectUri = getRedirectUri();

  let consentUrl = '';
  try {
    consentUrl = buildConsentUrl('DIAGNOSTIC_STATE');
  } catch (e) {
    consentUrl = `(could not build: ${e instanceof Error ? e.message : 'error'})`;
  }

  const connected = await isConnected();

  // End-to-end check: can we actually mint an access token from the
  // stored refresh token + client secret? This is the real proof the
  // whole chain works.
  let tokenCheck: string;
  if (!connected) {
    tokenCheck = 'No refresh token stored yet — connect first.';
  } else {
    const token = await getAccessToken();
    tokenCheck = token
      ? 'OK — access token minted from the stored refresh token.'
      : 'FAILED — refresh token is stored but minting an access token failed (client id/secret mismatch, or the token was revoked). Reconnect.';
  }

  const clientType = env.YOUTUBE_OAUTH_CLIENT_ID
    ? '(client id is set; confirm in Google Console that this client is type "Web application", not "TV and Limited Input")'
    : '(no client id set)';

  return (
    <main className="page">
      <header style={{ marginBottom: '2rem' }}>
        <Link href="/admin" className="chrome" style={{ color: 'var(--ink)', textDecoration: 'none' }}>
          ← Back to admin
        </Link>
        <h1
          style={{
            fontFamily: 'Georgia, "Source Serif Pro", serif',
            fontSize: '1.75rem',
            fontWeight: 600,
            margin: '0.75rem 0 0 0',
          }}
        >
          YouTube OAuth status
        </h1>
        <p className="chrome" style={{ marginTop: '0.25rem', fontStyle: 'italic' }}>
          What the server sees. Secret values are never shown — only whether they&rsquo;re set.
        </p>
      </header>

      <Section title="Environment variables">
        <Row label="YOUTUBE_API_KEY" value={env.YOUTUBE_API_KEY ? 'set' : 'MISSING'} ok={env.YOUTUBE_API_KEY} />
        <Row label="YOUTUBE_CHANNEL_ID" value={env.YOUTUBE_CHANNEL_ID ?? 'MISSING'} ok={!!env.YOUTUBE_CHANNEL_ID} />
        <Row label="YOUTUBE_OAUTH_CLIENT_ID" value={env.YOUTUBE_OAUTH_CLIENT_ID ?? 'MISSING'} ok={!!env.YOUTUBE_OAUTH_CLIENT_ID} />
        <Row label="YOUTUBE_OAUTH_CLIENT_SECRET" value={env.YOUTUBE_OAUTH_CLIENT_SECRET ? 'set' : 'MISSING'} ok={env.YOUTUBE_OAUTH_CLIENT_SECRET} />
        <Row label="OAUTH_REDIRECT_URI (optional override)" value={env.OAUTH_REDIRECT_URI ?? 'not set (using default)'} ok />
      </Section>

      <Section title="Redirect URI the app sends to Google">
        <p style={{ fontFamily: 'monospace', fontSize: '0.875rem', wordBreak: 'break-all', margin: 0 }}>
          {redirectUri}
        </p>
        <p className="chrome" style={{ marginTop: '0.5rem', fontStyle: 'italic' }}>
          This exact string must appear in the OAuth client&rsquo;s Authorized redirect URIs in Google Cloud Console.
        </p>
      </Section>

      <Section title="Client type reminder">
        <p style={{ margin: 0, fontSize: '0.875rem' }}>{clientType}</p>
      </Section>

      <Section title="Connection">
        <Row label="Refresh token stored" value={connected ? 'yes' : 'no'} ok={connected} />
        <Row label="Access-token mint test" value={tokenCheck} ok={tokenCheck.startsWith('OK')} />
      </Section>

      <Section title="Consent URL (what Connect will open)">
        <p style={{ fontFamily: 'monospace', fontSize: '0.75rem', wordBreak: 'break-all', margin: 0 }}>
          {consentUrl}
        </p>
      </Section>

      <p style={{ marginTop: '2rem' }}>
        <Link href="/admin/channel" className="btn" style={{ textDecoration: 'none' }}>
          Go to channel page →
        </Link>
      </p>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: '1.5rem' }}>
      <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '1.0625rem', fontWeight: 600, margin: '0 0 0.5rem 0' }}>
        {title}
      </h2>
      <div
        style={{
          border: '1px solid var(--rule)',
          borderRadius: '0.5rem',
          padding: '0.875rem 1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.375rem',
        }}
      >
        {children}
      </div>
    </section>
  );
}

function Row({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'baseline', fontSize: '0.875rem' }}>
      <span style={{ color: ok ? '#2a7' : '#a33', minWidth: '1.25rem' }}>{ok ? '✓' : '✕'}</span>
      <span style={{ fontWeight: 600, minWidth: '16rem' }}>{label}</span>
      <span style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>{value}</span>
    </div>
  );
}
