import Link from 'next/link';
import { POEMS } from '@/lib/poems';
import { prisma } from '@/lib/db';
import { isConnected, getAccessToken } from '@/lib/youtube-oauth';
import { listChannelVideos, type ChannelVideo } from '@/lib/youtube';
import { ChannelVideoRow } from './ChannelVideoRow';
import { DisconnectButton } from './DisconnectButton';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Channel — qed'bop",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<{ connected?: string; connect_error?: string }> };

// Light title→slug matcher: a video matches a poem when the poem's
// title appears in the video title (case-insensitive). Used to pre-fill
// the "Attach to poem" dropdown.
function guessSlug(videoTitle: string): string | undefined {
  const lower = videoTitle.toLowerCase();
  for (const p of POEMS) {
    if (lower.includes(p.title.toLowerCase())) return p.slug;
  }
  return undefined;
}

export default async function ChannelPage({ searchParams }: Props) {
  const sp = await searchParams;
  const connected = await isConnected();

  const poemOptions = POEMS.map((p) => ({ slug: p.slug, title: p.title }));

  // Already-attached / already-known youtubeIds so we can flag them.
  const known = new Set<string>();
  for (const p of POEMS) for (const v of p.versions) known.add(v.youtubeId);
  try {
    const rows = await prisma.poemVideo.findMany({ select: { youtubeId: true } });
    for (const r of rows) known.add(r.youtubeId);
  } catch {
    // ignore
  }

  let videos: ChannelVideo[] = [];
  let listError: string | null = null;
  if (connected) {
    const token = await getAccessToken();
    const channelId = process.env.YOUTUBE_CHANNEL_ID;
    if (!token) {
      listError = 'Could not mint an access token from the stored refresh token. Try reconnecting.';
    } else if (!channelId) {
      listError = 'YOUTUBE_CHANNEL_ID is not set in the environment.';
    } else {
      const res = await listChannelVideos(token, channelId);
      if (res.ok) videos = res.videos;
      else listError = res.error;
    }
  }

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
          YouTube channel
        </h1>
        <p className="chrome" style={{ marginTop: '0.25rem', fontStyle: 'italic' }}>
          Lists every upload on the qed&rsquo;bop channel — public and unlisted — and lets you attach any of them to a poem.
        </p>
        <p className="chrome" style={{ marginTop: '0.5rem' }}>
          <Link href="/admin/youtube/status" style={{ color: 'var(--ink)' }}>
            Connection diagnostics →
          </Link>
        </p>
      </header>

      {sp.connected === '1' && (
        <p style={{ color: '#2a7', marginBottom: '1rem' }}>Connected. Listing channel uploads below.</p>
      )}
      {sp.connect_error && (
        <p style={{ color: '#a33', marginBottom: '1rem' }}>Connection error: {sp.connect_error}</p>
      )}

      {!connected ? (
        <section
          style={{
            border: '1px solid var(--rule)',
            borderRadius: '0.5rem',
            padding: '1.5rem',
            maxWidth: '40rem',
          }}
        >
          <p style={{ marginTop: 0 }}>
            Not connected yet. Connecting authorizes qed&rsquo;bop (read-only) to list the
            channel&rsquo;s uploads, including unlisted videos that a plain API key can&rsquo;t see.
          </p>
          <a href="/admin/youtube/connect" className="btn" style={{ textDecoration: 'none' }}>
            Connect to YouTube
          </a>
        </section>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <span className="chrome">
              {listError ? 'Connected' : `${videos.length} videos on the channel`}
            </span>
            <DisconnectButton />
          </div>

          {listError && <p style={{ color: '#a33', marginBottom: '1rem' }}>{listError}</p>}

          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {videos.map((v) => (
              <ChannelVideoRow
                key={v.youtubeId}
                video={{
                  youtubeId: v.youtubeId,
                  title: v.title,
                  durationSeconds: v.durationSeconds,
                  viewCount: v.viewCount,
                  thumbnailUrl: v.thumbnailUrl,
                  privacyStatus: v.privacyStatus,
                }}
                alreadyKnown={known.has(v.youtubeId)}
                guessedSlug={guessSlug(v.title)}
                poemOptions={poemOptions}
              />
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
