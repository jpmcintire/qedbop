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

const SearchListResponse = z.object({
  items: z.array(
    z.object({
      id: z.object({ videoId: z.string() }),
      snippet: z.object({
        title: z.string(),
        channelTitle: z.string(),
        channelId: z.string(),
        publishedAt: z.string(),
        description: z.string().optional(),
      }),
    })
  ),
});

export type YouTubeSearchHit = YouTubeVideoMetadata & {
  description: string;
};

export type SearchResult =
  | { ok: true; hits: YouTubeSearchHit[] }
  | { ok: false; error: string };

// Search YouTube by free-text query and return rich per-video metadata
// (duration, view count, etc.). Combines two API calls: search.list
// (which is shallow) and videos.list (for the details on each hit).
// Quota cost: 100 units for search + 1 for the videos lookup, well
// under the 10k/day default.
export async function searchVideos(query: string, maxResults = 12): Promise<SearchResult> {
  const trimmed = query.trim();
  if (!trimmed) return { ok: false, error: 'Empty query.' };

  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return { ok: false, error: 'YOUTUBE_API_KEY is not configured on the server.' };

  const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search');
  searchUrl.searchParams.set('part', 'snippet');
  searchUrl.searchParams.set('type', 'video');
  searchUrl.searchParams.set('q', trimmed);
  searchUrl.searchParams.set('maxResults', String(Math.max(1, Math.min(maxResults, 25))));
  searchUrl.searchParams.set('key', key);

  let searchRes: Response;
  try {
    searchRes = await fetch(searchUrl, { cache: 'no-store' });
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Network error reaching YouTube.' };
  }
  if (!searchRes.ok) {
    const body = await searchRes.text().catch(() => '');
    return { ok: false, error: `YouTube search responded ${searchRes.status}: ${body.slice(0, 200)}` };
  }

  let searchJson: unknown;
  try {
    searchJson = await searchRes.json();
  } catch {
    return { ok: false, error: 'YouTube search returned non-JSON.' };
  }
  const parsed = SearchListResponse.safeParse(searchJson);
  if (!parsed.success) {
    return { ok: false, error: 'Unexpected YouTube search response shape.' };
  }
  if (parsed.data.items.length === 0) {
    return { ok: true, hits: [] };
  }

  const descById = new Map(
    parsed.data.items.map((it) => [it.id.videoId, it.snippet.description ?? ''])
  );
  const ids = parsed.data.items.map((it) => it.id.videoId);

  // Hydrate with duration + stats. videos.list accepts comma-joined ids.
  const detailsUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
  detailsUrl.searchParams.set('part', 'snippet,contentDetails,statistics');
  detailsUrl.searchParams.set('id', ids.join(','));
  detailsUrl.searchParams.set('key', key);

  let detailsRes: Response;
  try {
    detailsRes = await fetch(detailsUrl, { cache: 'no-store' });
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Network error reaching YouTube.' };
  }
  if (!detailsRes.ok) {
    const body = await detailsRes.text().catch(() => '');
    return { ok: false, error: `YouTube videos.list responded ${detailsRes.status}: ${body.slice(0, 200)}` };
  }
  const detailsJson = await detailsRes.json().catch(() => null);
  const detailsParsed = VideoListResponse.safeParse(detailsJson);
  if (!detailsParsed.success) {
    return { ok: false, error: 'Unexpected YouTube videos.list response shape.' };
  }

  // Preserve search order, not videos.list order.
  const byId = new Map(detailsParsed.data.items.map((it) => [it.id, it]));
  const hits: YouTubeSearchHit[] = [];
  for (const id of ids) {
    const item = byId.get(id);
    if (!item) continue;
    const seconds = parseIsoDurationToSeconds(item.contentDetails.duration);
    if (seconds == null) continue;
    const thumbs = item.snippet.thumbnails ?? {};
    hits.push({
      youtubeId: item.id,
      title: item.snippet.title,
      channelTitle: item.snippet.channelTitle,
      channelId: item.snippet.channelId,
      publishedAt: item.snippet.publishedAt,
      durationSeconds: seconds,
      thumbnailUrl:
        thumbs.maxres?.url ?? thumbs.high?.url ?? thumbs.medium?.url ?? thumbs.default?.url ?? null,
      viewCount: item.statistics?.viewCount ? parseInt(item.statistics.viewCount, 10) : null,
      likeCount: item.statistics?.likeCount ? parseInt(item.statistics.likeCount, 10) : null,
      commentCount: item.statistics?.commentCount
        ? parseInt(item.statistics.commentCount, 10)
        : null,
      description: descById.get(id) ?? '',
    });
  }
  return { ok: true, hits };
}
