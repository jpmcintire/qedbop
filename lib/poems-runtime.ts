// Server-only enrichment: merges static defaults from lib/poems.ts with
// per-video overrides stored in the VideoAnnotation table.
//
// The static file defines the catalog structure (which poems exist, what
// videos belong to each, the immutable youtubeIds, the static themes/
// teacherNotes drafts). The database holds the editable overrides.
//
// All server-side reads of poem data for AI prompts or page rendering
// should go through `getPoemEnriched` so admin edits take effect
// immediately.

import { prisma } from './db';
import { POEMS, slugifyAuthor, type Poem, type Version } from './poems';

export async function getPoemEnriched(slug: string): Promise<Poem | undefined> {
  const poem = POEMS.find((p) => p.slug === slug);
  if (!poem) return undefined;

  let attached: Array<{ youtubeId: string; label: string | null; position: number }> = [];
  try {
    attached = await prisma.poemVideo.findMany({
      where: { poemSlug: slug },
      orderBy: { position: 'asc' },
      select: { youtubeId: true, label: true, position: true },
    });
  } catch (err) {
    console.error('[poems-runtime] poem-video read failed:', err);
  }

  const youtubeIds = [...poem.versions.map((v) => v.youtubeId), ...attached.map((a) => a.youtubeId)];
  let annotations: Array<{
    youtubeId: string;
    label: string | null;
    durationSeconds: number | null;
    genre: string | null;
    vocalCharacter: string | null;
    artist: string | null;
    recordingYear: number | null;
    themes: string | null;
    teacherNotes: string | null;
  }> = [];

  try {
    annotations = await prisma.videoAnnotation.findMany({
      where: { youtubeId: { in: youtubeIds } },
    });
  } catch (err) {
    // If the DB is unreachable or the table doesn't exist yet, fall back
    // to the static data — never let a DB issue break the public pages.
    console.error('[poems-runtime] DB read failed, using static data:', err);
    return poem;
  }

  const byId = new Map(annotations.map((a) => [a.youtubeId, a]));

  const staticEnriched: Version[] = poem.versions.map((v) => {
    const a = byId.get(v.youtubeId);
    if (!a) return v;
    return {
      ...v,
      label: a.label ?? v.label,
      durationSeconds: a.durationSeconds ?? v.durationSeconds,
      genre: a.genre ?? v.genre,
      vocalCharacter: a.vocalCharacter ?? v.vocalCharacter,
      artist: a.artist ?? v.artist,
      recordingYear: a.recordingYear ?? v.recordingYear,
      themes: a.themes ?? v.themes,
      teacherNotes: a.teacherNotes ?? v.teacherNotes,
    };
  });

  // DB-attached videos. Annotation values still win; the PoemVideo row
  // itself only provides youtubeId + a starting label.
  const attachedEnriched: Version[] = attached.map((row, i) => {
    const a = byId.get(row.youtubeId);
    const fallbackLabel = row.label ?? `Version ${poem.versions.length + i + 1}`;
    return {
      label: a?.label ?? fallbackLabel,
      youtubeId: row.youtubeId,
      durationSeconds: a?.durationSeconds ?? undefined,
      genre: a?.genre ?? undefined,
      vocalCharacter: a?.vocalCharacter ?? undefined,
      artist: a?.artist ?? undefined,
      recordingYear: a?.recordingYear ?? undefined,
      themes: a?.themes ?? undefined,
      teacherNotes: a?.teacherNotes ?? undefined,
    };
  });

  const enrichedVersions: Version[] = [...staticEnriched, ...attachedEnriched];

  let poetSpecialFacts: string | undefined;
  try {
    const poetRow = await prisma.poetAnnotation.findUnique({
      where: { slug: slugifyAuthor(poem.author) },
    });
    poetSpecialFacts = poetRow?.specialFacts?.trim() || undefined;
  } catch (err) {
    console.error('[poems-runtime] poet annotation read failed:', err);
  }

  return { ...poem, versions: enrichedVersions, poetSpecialFacts };
}

// Helper for the admin poet UI: get the displayName + persisted annotation
// (if any) for one poet slug. Returns null if no poem in the catalog has an
// author that slugifies to this value.
export async function getPoetEditState(slug: string): Promise<{
  slug: string;
  displayName: string;
  poemSlugs: string[];
  specialFacts: string | null;
} | null> {
  const order: string[] = [];
  const byName = new Map<string, string[]>();
  for (const poem of POEMS) {
    if (!byName.has(poem.author)) {
      byName.set(poem.author, []);
      order.push(poem.author);
    }
    byName.get(poem.author)!.push(poem.slug);
  }
  const displayName = order.find((name) => slugifyAuthor(name) === slug);
  if (!displayName) return null;

  let specialFacts: string | null = null;
  try {
    const row = await prisma.poetAnnotation.findUnique({ where: { slug } });
    specialFacts = row?.specialFacts ?? null;
  } catch (err) {
    console.error('[poems-runtime] poet annotation read failed:', err);
  }
  return {
    slug,
    displayName,
    poemSlugs: byName.get(displayName) ?? [],
    specialFacts,
  };
}

// Helper for the admin UI: get a single version's current effective values
// (static merged with DB override) plus the DB row itself (if any) so the
// form can show what's persisted vs. what's coming from defaults.
export async function getVideoEditState(youtubeId: string): Promise<{
  poemSlug: string;
  poemTitle: string;
  staticVersion: Version;
  // True when the video lives in PoemVideo (admin-attached) rather than
  // in lib/poems.ts. The edit form uses this to show a "Remove from
  // poem" button instead of "Revert to defaults."
  isAttached: boolean;
  dbAnnotation: {
    label: string | null;
    durationSeconds: number | null;
    genre: string | null;
    vocalCharacter: string | null;
    artist: string | null;
    recordingYear: number | null;
    themes: string | null;
    teacherNotes: string | null;
  } | null;
} | null> {
  let dbRow: Awaited<ReturnType<typeof prisma.videoAnnotation.findUnique>> = null;
  try {
    dbRow = await prisma.videoAnnotation.findUnique({ where: { youtubeId } });
  } catch (err) {
    console.error('[poems-runtime] DB read failed:', err);
  }
  const dbAnnotation = dbRow
    ? {
        label: dbRow.label,
        durationSeconds: dbRow.durationSeconds,
        genre: dbRow.genre,
        vocalCharacter: dbRow.vocalCharacter,
        artist: dbRow.artist,
        recordingYear: dbRow.recordingYear,
        themes: dbRow.themes,
        teacherNotes: dbRow.teacherNotes,
      }
    : null;

  for (const poem of POEMS) {
    const v = poem.versions.find((vv) => vv.youtubeId === youtubeId);
    if (!v) continue;
    return {
      poemSlug: poem.slug,
      poemTitle: poem.title,
      staticVersion: v,
      isAttached: false,
      dbAnnotation,
    };
  }

  // Not in lib/poems.ts — check PoemVideo for an admin-attached row.
  try {
    const attached = await prisma.poemVideo.findFirst({ where: { youtubeId } });
    if (attached) {
      const poem = POEMS.find((p) => p.slug === attached.poemSlug);
      if (poem) {
        return {
          poemSlug: poem.slug,
          poemTitle: poem.title,
          staticVersion: {
            label: attached.label ?? `Version ${poem.versions.length + 1}`,
            youtubeId,
          },
          isAttached: true,
          dbAnnotation,
        };
      }
    }
  } catch (err) {
    console.error('[poems-runtime] PoemVideo read failed:', err);
  }
  return null;
}
