'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  saveVideoAnnotation,
  clearVideoAnnotation,
  fetchYouTubeMetadata,
  detachVideoFromPoem,
} from '../../actions';
import type { YouTubeVideoMetadata } from '@/lib/youtube';

type Defaults = {
  label: string;
  durationSeconds: number | null;
  genre: string | null;
  vocalCharacter: string | null;
  artist: string | null;
  recordingYear: number | null;
  themes: string | null;
  teacherNotes: string | null;
};

type DbAnnotation = {
  label: string | null;
  durationSeconds: number | null;
  genre: string | null;
  vocalCharacter: string | null;
  artist: string | null;
  recordingYear: number | null;
  themes: string | null;
  teacherNotes: string | null;
} | null;

type Props = {
  youtubeId: string;
  staticDefaults: Defaults;
  dbAnnotation: DbAnnotation;
  // True when this video is an admin-attached PoemVideo row rather than
  // a static entry in lib/poems.ts. Toggles the "Revert" vs "Remove from
  // poem" button at the bottom of the form.
  isAttached: boolean;
  poemSlug: string;
};

// Pre-fill each field from the DB row if present, else from the static
// default. This way the form always shows the current effective values,
// and the teacher edits exactly what's persisted.
function initialFrom(staticDefaults: Defaults, db: DbAnnotation) {
  return {
    label: db?.label ?? staticDefaults.label ?? '',
    durationSeconds: db?.durationSeconds ?? staticDefaults.durationSeconds ?? null,
    genre: db?.genre ?? staticDefaults.genre ?? '',
    vocalCharacter: db?.vocalCharacter ?? staticDefaults.vocalCharacter ?? '',
    artist: db?.artist ?? staticDefaults.artist ?? '',
    recordingYear: db?.recordingYear ?? staticDefaults.recordingYear ?? null,
    themes: db?.themes ?? staticDefaults.themes ?? '',
    teacherNotes: db?.teacherNotes ?? staticDefaults.teacherNotes ?? '',
  };
}

export function EditForm({
  youtubeId,
  staticDefaults,
  dbAnnotation,
  isAttached,
  poemSlug,
}: Props) {
  const router = useRouter();
  const initial = initialFrom(staticDefaults, dbAnnotation);
  const [label, setLabel] = useState(initial.label);
  const [durationStr, setDurationStr] = useState(formatDuration(initial.durationSeconds));
  const [genre, setGenre] = useState(initial.genre);
  const [vocalCharacter, setVocalCharacter] = useState(initial.vocalCharacter);
  const [artist, setArtist] = useState(initial.artist);
  const [recordingYearStr, setRecordingYearStr] = useState(
    initial.recordingYear != null ? String(initial.recordingYear) : ''
  );
  const [themes, setThemes] = useState(initial.themes);
  const [teacherNotes, setTeacherNotes] = useState(initial.teacherNotes);
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ytPending, startYtTransition] = useTransition();
  const [ytMeta, setYtMeta] = useState<YouTubeVideoMetadata | null>(null);
  const [ytError, setYtError] = useState<string | null>(null);

  function fetchFromYouTube() {
    setYtError(null);
    startYtTransition(async () => {
      const res = await fetchYouTubeMetadata(youtubeId);
      if (res.ok) {
        setYtMeta(res.metadata);
        setDurationStr(formatDuration(res.metadata.durationSeconds));
      } else {
        setYtError(res.error);
      }
    });
  }

  function save() {
    setStatus(null);
    setError(null);
    const durationSeconds = parseDurationToSeconds(durationStr);
    const recordingYear = recordingYearStr ? parseInt(recordingYearStr, 10) : null;

    if (durationStr && durationSeconds == null) {
      setError(`Couldn't parse "${durationStr}" as duration. Use seconds (e.g. 285) or m:ss (e.g. 4:45).`);
      return;
    }
    if (recordingYear != null && (recordingYear < 1500 || recordingYear > 2100)) {
      setError(`Recording year ${recordingYear} is out of plausible range.`);
      return;
    }

    startTransition(async () => {
      const res = await saveVideoAnnotation({
        youtubeId,
        label: label || null,
        durationSeconds: durationSeconds ?? null,
        genre: genre || null,
        vocalCharacter: vocalCharacter || null,
        artist: artist || null,
        recordingYear: recordingYear ?? null,
        themes: themes || null,
        teacherNotes: teacherNotes || null,
      });
      if (res.ok) {
        setStatus('Saved. Next time qed’bop generates, it uses the new values.');
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  function removeFromPoem() {
    if (!confirm('Remove this video from the poem? Its annotation (genre, themes, etc.) is preserved in case you re-attach it later.')) {
      return;
    }
    setStatus(null);
    setError(null);
    startTransition(async () => {
      const res = await detachVideoFromPoem(poemSlug, youtubeId);
      if (res.ok) {
        router.push('/admin');
      } else {
        setError(res.error);
      }
    });
  }

  function revertToDefaults() {
    if (!confirm('Clear the database override for this video? It will revert to whatever is in lib/poems.ts.')) {
      return;
    }
    setStatus(null);
    setError(null);
    startTransition(async () => {
      const res = await clearVideoAnnotation(youtubeId);
      if (res.ok) {
        const fresh = initialFrom(staticDefaults, null);
        setLabel(fresh.label);
        setDurationStr(formatDuration(fresh.durationSeconds));
        setGenre(fresh.genre);
        setVocalCharacter(fresh.vocalCharacter);
        setArtist(fresh.artist);
        setRecordingYearStr(fresh.recordingYear != null ? String(fresh.recordingYear) : '');
        setThemes(fresh.themes);
        setTeacherNotes(fresh.teacherNotes);
        setStatus('Reverted to static defaults from lib/poems.ts.');
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '46rem' }}>
      <h1
        style={{
          fontFamily: 'Georgia, "Source Serif Pro", serif',
          fontSize: '1.75rem',
          fontWeight: 600,
          margin: 0,
        }}
      >
        {label || staticDefaults.label}
      </h1>

      <YouTubePanel
        pending={ytPending}
        meta={ytMeta}
        error={ytError}
        onFetch={fetchFromYouTube}
      />

      <Group label="Label">
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder={staticDefaults.label}
          style={inputStyle}
        />
        <Help>Displayed as the heading above each embedded video on the student and teacher pages. Falls back to the static value in lib/poems.ts if blank.</Help>
      </Group>

      <Row>
        <Group label="Genre">
          <input
            type="text"
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            placeholder='e.g. "Folk acoustic", "Ranchera"'
            style={inputStyle}
          />
        </Group>
        <Group label="Duration">
          <input
            type="text"
            value={durationStr}
            onChange={(e) => setDurationStr(e.target.value)}
            placeholder="e.g. 4:45 or 285"
            style={inputStyle}
          />
          <Help>Accepts seconds (285) or m:ss (4:45).</Help>
        </Group>
      </Row>

      <Row>
        <Group label="Vocal character">
          <input
            type="text"
            value={vocalCharacter}
            onChange={(e) => setVocalCharacter(e.target.value)}
            placeholder='e.g. "Solo male tenor, plainspoken"'
            style={inputStyle}
          />
        </Group>
        <Group label="Artist">
          <input
            type="text"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            placeholder="Artist name"
            style={inputStyle}
          />
        </Group>
      </Row>

      <Group label="Recording year">
        <input
          type="number"
          value={recordingYearStr}
          onChange={(e) => setRecordingYearStr(e.target.value)}
          placeholder="e.g. 2017"
          min={1500}
          max={2100}
          style={{ ...inputStyle, maxWidth: '8rem' }}
        />
      </Group>

      <Group label="Interpretive themes (safe — used in student-facing qed’bop output)">
        <textarea
          value={themes}
          onChange={(e) => setThemes(e.target.value)}
          rows={8}
          placeholder="Broader notes about what the music argues about the poem. What does the arrangement emphasize or subvert? What does the genre carry, culturally? NO timestamps. NO specific moment descriptions. This is what qed’bop sees when generating questions students will read."
          style={{ ...inputStyle, fontFamily: 'Georgia, serif', lineHeight: 1.6 }}
        />
        <Help>This text is fed to qed&rsquo;bop when generating student questions. Keep it interpretive — never describe a specific moment students should find.</Help>
      </Group>

      <Group label="Teacher-only notes (privileged — never sent to student-facing AI)">
        <textarea
          value={teacherNotes}
          onChange={(e) => setTeacherNotes(e.target.value)}
          rows={8}
          placeholder={`Timestamped specific observations. e.g.
0:12 — opening violin establishes the lilt
1:42 — first "very tired, very merry" lands as weariness, not joy
2:35 — modulation under "we hailed, good morrow, mother"
These ARE used in teacher-edition rendering (agenda, per-question commentary) and teacher chat answers, but NEVER in student questions.`}
          style={{ ...inputStyle, fontFamily: 'Georgia, serif', lineHeight: 1.6 }}
        />
        <Help>Only qed&rsquo;bop sees this when generating teacher-edition content or answering teacher chat questions. Free to include timestamps and specific moments here.</Help>
      </Group>

      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="btn"
        >
          {pending ? 'Saving…' : 'Save'}
        </button>
        {dbAnnotation && !isAttached && (
          <button
            type="button"
            onClick={revertToDefaults}
            disabled={pending}
            className="btn btn-ghost"
          >
            Revert to lib/poems.ts defaults
          </button>
        )}
        {isAttached && (
          <button
            type="button"
            onClick={removeFromPoem}
            disabled={pending}
            className="btn btn-ghost"
            style={{ color: '#a33' }}
          >
            Remove from poem
          </button>
        )}
        {status && <span className="chrome" style={{ color: 'var(--ink)' }}>{status}</span>}
        {error && <span style={{ color: '#a33', fontSize: '0.875rem' }}>{error}</span>}
      </div>
    </div>
  );
}

function YouTubePanel({
  pending,
  meta,
  error,
  onFetch,
}: {
  pending: boolean;
  meta: YouTubeVideoMetadata | null;
  error: string | null;
  onFetch: () => void;
}) {
  return (
    <div
      style={{
        border: '1px solid var(--rule)',
        borderRadius: '0.5rem',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={onFetch}
          disabled={pending}
          className="btn btn-ghost"
          style={{ fontSize: '0.8125rem' }}
        >
          {pending ? 'Fetching…' : 'Fetch from YouTube'}
        </button>
        <span className="chrome" style={{ fontStyle: 'italic' }}>
          Pulls duration, title, channel, and current stats from the YouTube Data API. Duration auto-fills below; everything else is shown here for reference.
        </span>
      </div>
      {error && (
        <p style={{ color: '#a33', fontSize: '0.875rem', margin: 0 }}>{error}</p>
      )}
      {meta && (
        <dl
          style={{
            display: 'grid',
            gridTemplateColumns: 'auto 1fr',
            columnGap: '1rem',
            rowGap: '0.25rem',
            margin: 0,
            fontSize: '0.875rem',
          }}
        >
          <dt style={{ fontWeight: 700 }}>Title</dt>
          <dd style={{ margin: 0 }}>{meta.title}</dd>
          <dt style={{ fontWeight: 700 }}>Channel</dt>
          <dd style={{ margin: 0 }}>{meta.channelTitle}</dd>
          <dt style={{ fontWeight: 700 }}>Published</dt>
          <dd style={{ margin: 0 }}>{meta.publishedAt.slice(0, 10)}</dd>
          <dt style={{ fontWeight: 700 }}>Duration</dt>
          <dd style={{ margin: 0 }}>{formatDuration(meta.durationSeconds)}</dd>
          {meta.viewCount != null && (
            <>
              <dt style={{ fontWeight: 700 }}>Views</dt>
              <dd style={{ margin: 0 }}>{meta.viewCount.toLocaleString()}</dd>
            </>
          )}
          {meta.likeCount != null && (
            <>
              <dt style={{ fontWeight: 700 }}>Likes</dt>
              <dd style={{ margin: 0 }}>{meta.likeCount.toLocaleString()}</dd>
            </>
          )}
        </dl>
      )}
    </div>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
      <label className="chrome" style={{ color: 'var(--ink)', fontWeight: 700 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
      {children}
    </div>
  );
}

function Help({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ color: 'var(--muted)', fontSize: '0.8125rem', fontStyle: 'italic', margin: 0 }}>
      {children}
    </p>
  );
}

function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null) return '';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function parseDurationToSeconds(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  // m:ss form
  const colonMatch = /^(\d+):(\d{1,2})$/.exec(trimmed);
  if (colonMatch) {
    const m = parseInt(colonMatch[1], 10);
    const s = parseInt(colonMatch[2], 10);
    if (s >= 60) return null;
    return m * 60 + s;
  }
  // plain seconds
  if (/^\d+$/.test(trimmed)) {
    return parseInt(trimmed, 10);
  }
  return null;
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  fontFamily: 'inherit',
  fontSize: '0.9375rem',
  padding: '0.5rem 0.75rem',
  border: '1px solid var(--rule)',
  borderRadius: '0.375rem',
  background: 'transparent',
  color: 'var(--ink)',
  resize: 'vertical',
};
