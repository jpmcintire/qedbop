'use client';

import { POEMS } from './poems';
import type { Identity } from './identity-client';

// Per-identity client-side storage of saved lessons. Lives entirely
// in localStorage — no DB, no schema change. Each identity has its
// own keyed bucket so signing in as John doesn't leak Dante's
// lessons.
//
// Auto-save semantics: the builder calls `saveLesson` whenever the
// teacher has a complete lesson (poem + videos + questions). The
// store dedupes by (poemSlug + videoIds) so editing questions for
// the same poem+settings updates the existing entry instead of
// piling up duplicates. Adding a video or switching poems creates
// a separate entry.

// 'basic' | 'custom' are the classic /build modes. 'v3' is the new
// /build/new builder. Knowing which builder produced a lesson lets
// editableUrl() route back to the right one.
export type LessonMode = 'basic' | 'custom' | 'v3';

export type SavedLesson = {
  id: string;
  poemSlug: string;
  audience: string;
  mode: LessonMode;
  videoIds: string[];
  lengths: string[];
  questions: string[];
  createdAt: string;
  updatedAt: string;
};

type SavedLessonInput = Omit<SavedLesson, 'id' | 'createdAt' | 'updatedAt'>;

const STORAGE_PREFIX = 'qedbop:lessons:';
const SEEDED_PREFIX = 'qedbop:seeded:';

function key(identity: Identity): string {
  return `${STORAGE_PREFIX}${identity}`;
}

function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function sameSet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((v, i) => v === sortedB[i]);
}

export function listLessons(identity: Identity): SavedLesson[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(key(identity));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedLesson[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLessons(identity: Identity, lessons: SavedLesson[]) {
  window.localStorage.setItem(key(identity), JSON.stringify(lessons));
  window.dispatchEvent(new Event('qedbop:lessons-changed'));
}

// Dedupes by (poemSlug + videoIds): same poem + same setting selection
// updates the existing entry. Returns the saved/updated entry's id so
// callers can hold a reference.
export function saveLesson(identity: Identity, input: SavedLessonInput): string {
  const all = listLessons(identity);
  const now = new Date().toISOString();
  const matchIdx = all.findIndex(
    (e) => e.poemSlug === input.poemSlug && sameSet(e.videoIds, input.videoIds),
  );
  if (matchIdx >= 0) {
    const existing = all[matchIdx];
    all[matchIdx] = { ...input, id: existing.id, createdAt: existing.createdAt, updatedAt: now };
    writeLessons(identity, all);
    return existing.id;
  }
  const id = generateId();
  const lesson: SavedLesson = { ...input, id, createdAt: now, updatedAt: now };
  // Newest first for the list UI.
  writeLessons(identity, [lesson, ...all]);
  return id;
}

export function removeLesson(identity: Identity, id: string) {
  const all = listLessons(identity);
  writeLessons(identity, all.filter((l) => l.id !== id));
}

// Hook to read lessons reactively. Re-renders on lessons-changed event
// and on cross-tab storage events.
import { useEffect, useState } from 'react';

export function useLessons(identity: Identity | null): SavedLesson[] {
  const [lessons, setLessons] = useState<SavedLesson[]>([]);

  useEffect(() => {
    if (!identity) {
      setLessons([]);
      return;
    }
    const sync = () => setLessons(listLessons(identity));
    sync();
    window.addEventListener('qedbop:lessons-changed', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('qedbop:lessons-changed', sync);
      window.removeEventListener('storage', sync);
    };
  }, [identity]);

  return lessons;
}

// ---- Demo seed ----

// Seeded lessons make /me/lessons evaluable on first sign-in — without
// them, a fresh identity lands on an empty page. Each identity is
// seeded exactly once per browser (tracked by qedbop:seeded:<id>).
// Deletion is permanent — we don't re-seed if a teacher wipes
// everything.
//
// All poem/video data comes from POEMS at runtime so seed entries are
// always valid against the current catalog. Questions are taken from
// each poem's starter questions array.

type SeedSpec = {
  poemSlug: string;
  audience: string;
  mode: 'basic' | 'custom';
  videoCount: number;
  lengths: string[];
  questionCount: number;
};

const SEEDS: Record<Identity, SeedSpec[]> = {
  john: [
    {
      poemSlug: 'stopping-by-woods',
      audience: 'high-school',
      mode: 'custom',
      videoCount: 1,
      lengths: ['paragraph'],
      questionCount: 3,
    },
    {
      poemSlug: 'recuerdo',
      audience: 'high-school',
      mode: 'basic',
      videoCount: 1,
      lengths: ['short-paragraph'],
      questionCount: 3,
    },
  ],
  dante: [
    {
      poemSlug: 'the-tyger',
      audience: 'college',
      mode: 'custom',
      videoCount: 1,
      lengths: ['short-essay'],
      questionCount: 4,
    },
    {
      poemSlug: 'ozymandias',
      audience: 'college',
      mode: 'custom',
      videoCount: 1,
      lengths: ['paragraph'],
      questionCount: 3,
    },
  ],
};

export function seedIfFirstTime(identity: Identity) {
  if (typeof window === 'undefined') return;
  const seededKey = `${SEEDED_PREFIX}${identity}`;
  if (window.localStorage.getItem(seededKey)) return;
  window.localStorage.setItem(seededKey, '1');

  // Don't clobber lessons a teacher may have already saved before
  // sign-in tracking was introduced.
  if (listLessons(identity).length > 0) return;

  const now = new Date().toISOString();
  const seeded: SavedLesson[] = [];
  for (const spec of SEEDS[identity]) {
    const poem = POEMS.find((p) => p.slug === spec.poemSlug);
    if (!poem || poem.versions.length === 0) continue;
    const videoIds = poem.versions.slice(0, spec.videoCount).map((v) => v.youtubeId);
    const questions = poem.questions.slice(0, spec.questionCount);
    if (videoIds.length === 0 || questions.length === 0) continue;
    seeded.push({
      id: generateId(),
      poemSlug: spec.poemSlug,
      audience: spec.audience,
      mode: spec.mode,
      videoIds,
      lengths: spec.lengths,
      questions,
      createdAt: now,
      updatedAt: now,
    });
  }
  if (seeded.length > 0) writeLessons(identity, seeded);
}

// ---- URL builders ----

export function studentUrl(l: SavedLesson): string {
  return buildUrl(`/a/${l.poemSlug}`, l);
}

export function teacherUrl(l: SavedLesson): string {
  return buildUrl(`/t/${l.poemSlug}`, l);
}

export function editableUrl(l: SavedLesson): string {
  const params = new URLSearchParams();
  params.set('slug', l.poemSlug);
  params.set('audience', l.audience);
  for (const v of l.videoIds) params.append('v', v);
  for (const len of l.lengths) params.append('len', len);
  for (const q of l.questions) params.append('q', q);
  // v3 lessons route back to /build/new; basic/custom go to /build.
  if (l.mode === 'v3') {
    return `/build/new?${params.toString()}`;
  }
  params.set('mode', l.mode);
  return `/build?${params.toString()}`;
}

function buildUrl(base: string, l: SavedLesson): string {
  const params = new URLSearchParams();
  for (const v of l.videoIds) params.append('v', v);
  params.set('audience', l.audience);
  for (const len of l.lengths) params.append('len', len);
  for (const q of l.questions) params.append('q', q);
  return `${base}?${params.toString()}`;
}
