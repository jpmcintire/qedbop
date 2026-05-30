import 'server-only';
import { createHash } from 'crypto';
import { prisma } from './db';
import { generatePrepPodcastScript, type PodcastScript } from './podcast-script';
import { synthesizePodcastMp3, estimateTtsCostUsd } from './tts-openai';
import { uploadMedia } from './r2-media';
import type { Poem, Version } from './poems';

// Orchestrates a personalized prep podcast end-to-end:
// 1) Compute a cache key from the lesson signature.
// 2) If a row exists, return its mp3Url (no regeneration).
// 3) Otherwise: Claude writes the dialogue script, OpenAI TTS synthesizes
//    voices, the MP3 lands in R2, and we save a PrepPodcast row.
//
// The cache key is deterministic over the inputs that actually shape the
// podcast — same lesson signature = same MP3, generated once, served
// forever. PODCAST_VERSION lets us invalidate every cached podcast in
// one shot when voice config, script prompt, or any other generation
// knob changes: bump the version → every cacheKey changes → new R2
// filenames → no DB or browser cache collision with the old MP3s.
// Old DB rows + R2 files become orphans that the admin "wipe cached
// prep podcasts" button cleans up.
const PODCAST_VERSION = 'v3';

export type PrepPodcastResult = {
  mp3Url: string;
  title: string;
  cached: boolean;
};

export async function generatePrepPodcast(args: {
  poem: Poem;
  audience: string;
  versions: Version[];
  questions: string[];
}): Promise<PrepPodcastResult> {
  const cacheKey = computeCacheKey(args);

  // Cache lookup
  try {
    const existing = await prisma.prepPodcast.findUnique({ where: { cacheKey } });
    if (existing) {
      const title =
        safeTitle(existing.scriptJson) ?? `Prep huddle: ${args.poem.title}`;
      return { mp3Url: existing.mp3Url, title, cached: true };
    }
  } catch (err) {
    // Cache lookup failure shouldn't block generation — log and continue.
    console.error('[prep-podcast] cache lookup failed:', err);
  }

  // 1. Script
  const script = await generatePrepPodcastScript(args);

  // 2. Voices → MP3 bytes
  const { buffer, totalChars } = await synthesizePodcastMp3(script);

  // 3. Upload to R2
  const key = `prep-podcasts/${args.poem.slug}/${cacheKey}.mp3`;
  const { url } = await uploadMedia({
    key,
    body: buffer,
    contentType: 'audio/mpeg',
  });

  // 4. Persist the row. costUsd helps future reporting; we don't reuse
  // the ApiUsage table for TTS because its shape (input/output tokens)
  // doesn't match TTS billing — TTS is per-character. Tracking lives on
  // PrepPodcast for now and can be aggregated separately.
  try {
    await prisma.prepPodcast.create({
      data: {
        cacheKey,
        poemSlug: args.poem.slug,
        audience: args.audience,
        mp3Url: url,
        scriptJson: JSON.stringify(script),
      },
    });
  } catch (err) {
    console.error('[prep-podcast] DB write failed (MP3 still uploaded):', err);
  }

  // Estimated TTS cost (informational)
  void estimateTtsCostUsd(totalChars);

  return { mp3Url: url, title: script.title, cached: false };
}

function computeCacheKey(args: {
  poem: Poem;
  audience: string;
  versions: Version[];
  questions: string[];
}): string {
  const canonical = JSON.stringify({
    version: PODCAST_VERSION,
    slug: args.poem.slug,
    audience: args.audience,
    versions: args.versions
      .map((v) => v.youtubeId)
      .slice()
      .sort(),
    questions: args.questions,
  });
  return createHash('sha256').update(canonical).digest('hex').slice(0, 32);
}

function safeTitle(scriptJson: string): string | undefined {
  try {
    const parsed = JSON.parse(scriptJson) as Partial<PodcastScript>;
    return typeof parsed.title === 'string' ? parsed.title : undefined;
  } catch {
    return undefined;
  }
}
