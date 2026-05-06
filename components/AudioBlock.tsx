import Link from 'next/link';

interface Props {
  spotify?: string;
  appleMusic?: string;
  youtube?: string;
  sunoAudio?: string;
}

export function AudioBlock({ spotify, appleMusic, youtube, sunoAudio }: Props) {
  return (
    <div className="flex items-center gap-5 py-5 my-8 border-y border-rule">
      {sunoAudio ? (
        <audio controls preload="none" className="w-full max-w-sm" src={sunoAudio}>
          Your browser does not support the audio element.
        </audio>
      ) : (
        <button
          type="button"
          aria-label="Play"
          className="play-button"
          // wired to first available embed in a later iteration
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden>
            <path d="M3 1.5v11l9-5.5z" />
          </svg>
        </button>
      )}
      <div className="flex flex-col gap-1">
        <span className="chrome">Listen</span>
        <div className="flex gap-4 text-sm">
          {spotify && (
            <a href={spotify} target="_blank" rel="noopener" className="text-ink hover:underline">
              Spotify
            </a>
          )}
          {appleMusic && (
            <a href={appleMusic} target="_blank" rel="noopener" className="text-ink hover:underline">
              Apple Music
            </a>
          )}
          {youtube && (
            <a href={youtube} target="_blank" rel="noopener" className="text-ink hover:underline">
              YouTube
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export function YouTubeEmbed({ url, title }: { url: string; title: string }) {
  const id = extractYouTubeId(url);
  if (!id) return null;
  return (
    <div className="my-6 aspect-video w-full max-w-2xl">
      <iframe
        className="w-full h-full"
        src={`https://www.youtube-nocookie.com/embed/${id}`}
        title={`${title} — lyric video`}
        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        loading="lazy"
      />
    </div>
  );
}

function extractYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === 'youtu.be') return u.pathname.slice(1);
    if (u.searchParams.get('v')) return u.searchParams.get('v');
    const m = u.pathname.match(/\/embed\/([^/]+)/);
    if (m) return m[1];
    return null;
  } catch {
    return null;
  }
}
