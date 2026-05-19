'use server';

import { revalidateTag } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { POEMS } from '@/lib/poems';
import {
  fetchVideoMetadata,
  searchVideos,
  type FetchResult,
  type SearchResult,
} from '@/lib/youtube';
import { MODELS, type Component } from '@/lib/model-config';
import { logIn, logOut, requireAdmin } from '@/lib/admin-auth';
import { disconnect as disconnectYouTubeToken } from '@/lib/youtube-oauth';

export async function adminLogin(password: string): Promise<{ ok: boolean }> {
  const ok = await logIn(password);
  return { ok };
}

export async function adminLogout(): Promise<void> {
  await logOut();
}

export async function disconnectYouTube(): Promise<void> {
  await requireAdmin();
  await disconnectYouTubeToken();
}

const SaveSchema = z.object({
  youtubeId: z.string().min(1),
  label: z.string().nullable(),
  durationSeconds: z.number().int().min(0).max(60 * 60 * 4).nullable(),
  genre: z.string().nullable(),
  vocalCharacter: z.string().nullable(),
  artist: z.string().nullable(),
  recordingYear: z.number().int().min(1500).max(2100).nullable(),
  themes: z.string().nullable(),
  teacherNotes: z.string().nullable(),
});

export type SaveVideoInput = z.infer<typeof SaveSchema>;

export type SaveResult =
  | { ok: true }
  | { ok: false; error: string };

export async function saveVideoAnnotation(input: SaveVideoInput): Promise<SaveResult> {
  const parsed = SaveSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join('; ') };
  }

  // Normalize: treat empty strings as null so the DB doesn't store noise.
  const norm = {
    ...parsed.data,
    label: parsed.data.label?.trim() || null,
    genre: parsed.data.genre?.trim() || null,
    vocalCharacter: parsed.data.vocalCharacter?.trim() || null,
    artist: parsed.data.artist?.trim() || null,
    themes: parsed.data.themes?.trim() || null,
    teacherNotes: parsed.data.teacherNotes?.trim() || null,
  };

  try {
    await prisma.videoAnnotation.upsert({
      where: { youtubeId: norm.youtubeId },
      create: norm,
      update: {
        label: norm.label,
        durationSeconds: norm.durationSeconds,
        genre: norm.genre,
        vocalCharacter: norm.vocalCharacter,
        artist: norm.artist,
        recordingYear: norm.recordingYear,
        themes: norm.themes,
        teacherNotes: norm.teacherNotes,
      },
    });
  } catch (err) {
    console.error('[admin/save] DB write failed:', err);
    return { ok: false, error: err instanceof Error ? err.message : 'DB write failed' };
  }

  // Bust the AI generator caches so the new annotation takes effect on the
  // next request. The unstable_cache keys are content-hashed, so technically
  // any change to the version data already invalidates the cache — but
  // these explicit tag revalidations are belt-and-suspenders.
  try {
    revalidateTag('questions');
    revalidateTag('teacher-edition');
    revalidateTag('topics');
  } catch {
    // not fatal
  }

  return { ok: true };
}

export async function clearVideoAnnotation(youtubeId: string): Promise<SaveResult> {
  if (!youtubeId) return { ok: false, error: 'no youtubeId' };
  try {
    await prisma.videoAnnotation.deleteMany({ where: { youtubeId } });
  } catch (err) {
    console.error('[admin/clear] DB delete failed:', err);
    return { ok: false, error: err instanceof Error ? err.message : 'DB delete failed' };
  }
  revalidateTag('questions');
  revalidateTag('teacher-edition');
  revalidateTag('topics');
  return { ok: true };
}

const SavePoetSchema = z.object({
  slug: z.string().min(1),
  specialFacts: z.string().nullable(),
});

export async function savePoetAnnotation(input: z.infer<typeof SavePoetSchema>): Promise<SaveResult> {
  const parsed = SavePoetSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join('; ') };
  }
  const specialFacts = parsed.data.specialFacts?.trim() || null;
  try {
    await prisma.poetAnnotation.upsert({
      where: { slug: parsed.data.slug },
      create: { slug: parsed.data.slug, specialFacts },
      update: { specialFacts },
    });
  } catch (err) {
    console.error('[admin/savePoet] DB write failed:', err);
    return { ok: false, error: err instanceof Error ? err.message : 'DB write failed' };
  }
  // Poet facts feed teacher-edition + teacher-ask. They don't affect
  // student questions, but the teacher-edition cache must bust.
  try {
    revalidateTag('teacher-edition');
  } catch {
    // not fatal
  }
  return { ok: true };
}

export async function clearPoetAnnotation(slug: string): Promise<SaveResult> {
  if (!slug) return { ok: false, error: 'no slug' };
  try {
    await prisma.poetAnnotation.deleteMany({ where: { slug } });
  } catch (err) {
    console.error('[admin/clearPoet] DB delete failed:', err);
    return { ok: false, error: err instanceof Error ? err.message : 'DB delete failed' };
  }
  revalidateTag('teacher-edition');
  return { ok: true };
}

export async function fetchYouTubeMetadata(youtubeId: string): Promise<FetchResult> {
  return fetchVideoMetadata(youtubeId);
}

export async function searchYouTube(query: string): Promise<SearchResult> {
  return searchVideos(query);
}

const AttachSchema = z.object({
  poemSlug: z.string().min(1),
  youtubeId: z.string().min(1),
  label: z.string().nullable(),
});

export async function attachVideoToPoem(input: z.infer<typeof AttachSchema>): Promise<SaveResult> {
  const parsed = AttachSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join('; ') };
  }
  if (!POEMS.some((p) => p.slug === parsed.data.poemSlug)) {
    return { ok: false, error: `Unknown poem slug "${parsed.data.poemSlug}".` };
  }
  const label = parsed.data.label?.trim() || null;

  try {
    // Position = (max existing position for this poem) + 1.
    const existing = await prisma.poemVideo.findMany({
      where: { poemSlug: parsed.data.poemSlug },
      select: { position: true },
    });
    const nextPosition = existing.reduce((m, r) => Math.max(m, r.position), 0) + 1;

    await prisma.poemVideo.upsert({
      where: {
        poemSlug_youtubeId: {
          poemSlug: parsed.data.poemSlug,
          youtubeId: parsed.data.youtubeId,
        },
      },
      create: {
        poemSlug: parsed.data.poemSlug,
        youtubeId: parsed.data.youtubeId,
        label,
        position: nextPosition,
      },
      update: { label },
    });
  } catch (err) {
    console.error('[admin/attach] DB write failed:', err);
    return { ok: false, error: err instanceof Error ? err.message : 'DB write failed' };
  }

  try {
    revalidateTag('questions');
    revalidateTag('teacher-edition');
    revalidateTag('topics');
  } catch {
    // not fatal
  }
  return { ok: true };
}

export async function detachVideoFromPoem(
  poemSlug: string,
  youtubeId: string
): Promise<SaveResult> {
  if (!poemSlug || !youtubeId) {
    return { ok: false, error: 'poemSlug and youtubeId are required' };
  }
  try {
    await prisma.poemVideo.deleteMany({ where: { poemSlug, youtubeId } });
  } catch (err) {
    console.error('[admin/detach] DB delete failed:', err);
    return { ok: false, error: err instanceof Error ? err.message : 'DB delete failed' };
  }
  revalidateTag('questions');
  revalidateTag('teacher-edition');
  revalidateTag('topics');
  return { ok: true };
}

const VALID_COMPONENTS: Component[] = [
  'questions',
  'single-question',
  'topics',
  'teacher-edition',
  'teacher-ask',
  'concierge',
];

const ModelOverrideSchema = z.object({
  component: z.enum(VALID_COMPONENTS as [Component, ...Component[]]),
  // 'default' means delete the row (use the hardcoded default).
  model: z.union([z.literal('default'), z.string()]),
});

export async function setModelOverride(input: z.infer<typeof ModelOverrideSchema>): Promise<SaveResult> {
  const parsed = ModelOverrideSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join('; ') };
  }
  try {
    if (parsed.data.model === 'default') {
      await prisma.modelSetting.deleteMany({ where: { component: parsed.data.component } });
    } else {
      if (!MODELS.some((m) => m.id === parsed.data.model)) {
        return { ok: false, error: `Unknown model "${parsed.data.model}".` };
      }
      await prisma.modelSetting.upsert({
        where: { component: parsed.data.component },
        create: { component: parsed.data.component, model: parsed.data.model },
        update: { model: parsed.data.model },
      });
    }
  } catch (err) {
    console.error('[admin/model] DB write failed:', err);
    return { ok: false, error: err instanceof Error ? err.message : 'DB write failed' };
  }
  // Bust the affected caches so the next call picks up the new model.
  try {
    revalidateTag('questions');
    revalidateTag('teacher-edition');
    revalidateTag('topics');
  } catch {
    // not fatal
  }
  return { ok: true };
}
