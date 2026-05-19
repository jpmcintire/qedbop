import 'server-only';
import { z } from 'zod';

const VideoListResponse = z.object({
  items: z
    .array(
      z.object({
        id: z.string(),
        snippet: z.object({
          title: z.string(),
          channelTitle: z.string(),
          channelId: z.string(),
          publishedAt: z.string(),
          thumbnails: z
            .object({
              maxres: z.object({ url: z.string() }).optional(),
              high: z.object({ url: z.string() }).optional(),
              medium: z.object({ url: z.string() }).optional(),
              default: z.object({ url: z.string() }).optional(),
            })
            .optional(),
        }),
        contentDetails: z.object({
          duration: z.string(),
        }),
        statistics: z
          .object({
            viewCount: z.string().optional(),
            likeCount: z.string().optional(),
            commentCount: z.string().optional(),
          })
          .optional(),
      })
    )
    .min(0),
});

export type YouTubeVideoMetadata = {
  youtubeId: string;
  title: string;
  channelTitle: string;
  channelId: string;
  publishedAt: string;
  durationSeconds: number;
  thumbnailUrl: string | null;
  viewCount: number | null;
  likeCount: number | null;
  commentCount: number | null;
};

export type FetchResult =
  | { ok: true; metadata: YouTubeVideoMetadata }
  | { ok: false; error: string };

export async function fetchVideoMetadata(youtubeId: string): Promise<FetchResult> {
  if (!youtubeId || !/^[A-Za-z0-9_-]{6,20}$/.test(youtubeId)) {
    return { ok: false, error: `"${youtubeId}" does not look like a YouTube video ID.` };
  }
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) {
    return { ok: false, error: 'YOUTUBE_API_KEY is not configured on the server.' };
  }

  const url = new URL('https://www.googleapis.com/youtube/v3/videos');
  url.searchParams.set('part', 'snippet,contentDetails,statistics');
  url.searchParams.set('id', youtubeId);
  url.searchParams.set('key', key);

  let res: Response;
  try {
    res = await fetch(url, { cache: 'no-store' });
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Network error reaching YouTube.' };
  }
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    return {
      ok: false,
      error: `YouTube API responded ${res.status}: ${body.slice(0, 200)}`,
    };
  }

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    return { ok: false, error: 'YouTube API returned non-JSON response.' };
  }

  const parsed = VideoListResponse.safeParse(json);
  if (!parsed.success) {
    return { ok: false, error: 'Unexpected YouTube API response shape.' };
  }
  const item = parsed.data.items[0];
  if (!item) {
    return { ok: false, error: `No video found for ID "${youtubeId}". It may be private, removed, or wrong.` };
  }

  const durationSeconds = parseIsoDurationToSeconds(item.contentDetails.duration);
  if (durationSeconds == null) {
    return { ok: false, error: `Couldn't parse duration "${item.contentDetails.duration}".` };
  }

  const thumbs = item.snippet.thumbnails ?? {};
  const thumbnailUrl =
    thumbs.maxres?.url ?? thumbs.high?.url ?? thumbs.medium?.url ?? thumbs.default?.url ?? null;

  return {
    ok: true,
    metadata: {
      youtubeId: item.id,
      title: item.snippet.title,
      channelTitle: item.snippet.channelTitle,
      channelId: item.snippet.channelId,
      publishedAt: item.snippet.publishedAt,
      durationSeconds,
      thumbnailUrl,
      viewCount: item.statistics?.viewCount ? parseInt(item.statistics.viewCount, 10) : null,
      likeCount: item.statistics?.likeCount ? parseInt(item.statistics.likeCount, 10) : null,
      commentCount: item.statistics?.commentCount
        ? parseInt(item.statistics.commentCount, 10)
        : null,
    },
  };
}

// ISO 8601 duration, e.g. "PT4M45S" → 285. YouTube only ever uses H/M/S
// components for videos (no days). Accept all three for safety.
export function parseIsoDurationToSeconds(iso: string): number | null {
  const match = /^P(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(iso);
  if (!match) return null;
  const h = match[1] ? parseInt(match[1], 10) : 0;
  const m = match[2] ? parseInt(match[2], 10) : 0;
  const s = match[3] ? parseInt(match[3], 10) : 0;
  return h * 3600 + m * 60 + s;
}
