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

const PlaylistItemsResponse = z.object({
  nextPageToken: z.string().optional(),
  items: z.array(
    z.object({
      contentDetails: z.object({ videoId: z.string() }),
    })
  ),
});

export type ChannelVideo = YouTubeVideoMetadata & {
  // 'public' | 'unlisted' | 'private' — from videos.list status block.
  privacyStatus: string | null;
};

export type ChannelListResult =
  | { ok: true; videos: ChannelVideo[] }
  | { ok: false; error: string };

// Lists every upload on the channel (public AND unlisted) using an
// owner OAuth access token. The channel's auto-generated "uploads"
// playlist id is the channel id with the "UC" prefix swapped for "UU".
// Paginates playlistItems, then hydrates with videos.list for duration,
// stats, and privacy status.
export async function listChannelVideos(
  accessToken: string,
  channelId: string
): Promise<ChannelListResult> {
  if (!channelId.startsWith('UC')) {
    return { ok: false, error: `Channel id "${channelId}" doesn't look right (should start with UC).` };
  }
  const uploadsPlaylist = 'UU' + channelId.slice(2);
  const headers = { Authorization: `Bearer ${accessToken}` };

  // 1) Collect all video ids from the uploads playlist.
  const ids: string[] = [];
  let pageToken: string | undefined;
  let guard = 0;
  do {
    const url = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
    url.searchParams.set('part', 'contentDetails');
    url.searchParams.set('playlistId', uploadsPlaylist);
    url.searchParams.set('maxResults', '50');
    if (pageToken) url.searchParams.set('pageToken', pageToken);

    let res: Response;
    try {
      res = await fetch(url, { headers, cache: 'no-store' });
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'Network error listing uploads.' };
    }
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      return { ok: false, error: `playlistItems.list ${res.status}: ${body.slice(0, 200)}` };
    }
    const parsed = PlaylistItemsResponse.safeParse(await res.json().catch(() => null));
    if (!parsed.success) return { ok: false, error: 'Unexpected playlistItems response shape.' };
    for (const item of parsed.data.items) ids.push(item.contentDetails.videoId);
    pageToken = parsed.data.nextPageToken;
    guard += 1;
  } while (pageToken && guard < 60);

  if (ids.length === 0) return { ok: true, videos: [] };

  // 2) Hydrate in batches of 50 via videos.list (with status for privacy).
  const videos: ChannelVideo[] = [];
  for (let i = 0; i < ids.length; i += 50) {
    const batch = ids.slice(i, i + 50);
    const url = new URL('https://www.googleapis.com/youtube/v3/videos');
    url.searchParams.set('part', 'snippet,contentDetails,statistics,status');
    url.searchParams.set('id', batch.join(','));

    let res: Response;
    try {
      res = await fetch(url, { headers, cache: 'no-store' });
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'Network error hydrating videos.' };
    }
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      return { ok: false, error: `videos.list ${res.status}: ${body.slice(0, 200)}` };
    }
    const json = (await res.json().catch(() => null)) as
      | { items?: Array<Record<string, unknown>> }
      | null;
    const items = json?.items ?? [];
    for (const raw of items) {
      const snippet = (raw.snippet ?? {}) as Record<string, unknown>;
      const contentDetails = (raw.contentDetails ?? {}) as Record<string, unknown>;
      const statistics = (raw.statistics ?? {}) as Record<string, unknown>;
      const status = (raw.status ?? {}) as Record<string, unknown>;
      const seconds = parseIsoDurationToSeconds(String(contentDetails.duration ?? ''));
      const thumbs = (snippet.thumbnails ?? {}) as Record<string, { url?: string }>;
      videos.push({
        youtubeId: String(raw.id ?? ''),
        title: String(snippet.title ?? ''),
        channelTitle: String(snippet.channelTitle ?? ''),
        channelId: String(snippet.channelId ?? ''),
        publishedAt: String(snippet.publishedAt ?? ''),
        durationSeconds: seconds ?? 0,
        thumbnailUrl:
          thumbs.medium?.url ?? thumbs.high?.url ?? thumbs.default?.url ?? null,
        viewCount: statistics.viewCount ? parseInt(String(statistics.viewCount), 10) : null,
        likeCount: statistics.likeCount ? parseInt(String(statistics.likeCount), 10) : null,
        commentCount: statistics.commentCount ? parseInt(String(statistics.commentCount), 10) : null,
        privacyStatus: status.privacyStatus ? String(status.privacyStatus) : null,
      });
    }
  }
  return { ok: true, videos };
}
