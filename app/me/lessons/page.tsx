'use client';

import Link from 'next/link';
import { TopNav } from '@/app/_components/TopNav';
import { IDENTITIES, useIdentity } from '@/lib/identity-client';
import {
  editableUrl,
  removeLesson,
  studentUrl,
  teacherUrl,
  useLessons,
  type SavedLesson,
} from '@/lib/lessons-store';
import { POEMS, audienceLabel } from '@/lib/poems';

// Signed-in-only history page. Renders the saved-lesson list for the
// active identity, with the three URL flavors (student / teacher
// edition / editable) per entry.

export default function MyLessonsPage() {
  const identity = useIdentity();
  const lessons = useLessons(identity);

  return (
    <main className="page">
      <TopNav current="lessons" />
      <header style={{ marginBottom: '1.5rem' }}>
        <h1
          style={{
            fontFamily: 'Georgia, "Source Serif Pro", serif',
            fontSize: '2rem',
            fontWeight: 600,
            margin: 0,
            lineHeight: 1.15,
          }}
        >
          My lessons
        </h1>
        {identity && (
          <p className="chrome" style={{ marginTop: '0.5rem' }}>
            Signed in as {IDENTITIES[identity].displayName}
          </p>
        )}
      </header>

      {!identity ? (
        <SignedOutEmpty />
      ) : lessons.length === 0 ? (
        <EmptyState />
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '1rem' }}>
          {lessons.map((l) => (
            <li key={l.id}>
              <LessonRow lesson={l} identity={identity} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

function SignedOutEmpty() {
  return (
    <div
      style={{
        padding: '2rem',
        border: '1px dashed var(--rule)',
        borderRadius: '0.5rem',
        color: 'var(--muted)',
      }}
    >
      <p style={{ margin: 0 }}>
        Sign in (top-right) to see your saved lessons. This is a demo sign-in —
        pick John or Dante to test.
      </p>
    </div>
  );
}

function EmptyState() {
  return (
    <div
      style={{
        padding: '2rem',
        border: '1px dashed var(--rule)',
        borderRadius: '0.5rem',
        color: 'var(--muted)',
      }}
    >
      <p style={{ margin: 0 }}>
        No lessons saved yet. <Link href="/build" style={{ color: 'var(--ink)' }}>Build one →</Link>
      </p>
    </div>
  );
}

function LessonRow({ lesson, identity }: { lesson: SavedLesson; identity: 'john' | 'dante' }) {
  const poem = POEMS.find((p) => p.slug === lesson.poemSlug);

  return (
    <article
      style={{
        padding: '1rem 1.25rem',
        border: '1px solid var(--rule)',
        borderRadius: '0.5rem',
      }}
    >
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap',
          marginBottom: '0.5rem',
        }}
      >
        <div style={{ minWidth: 0 }}>
          <h2
            style={{
              fontFamily: 'Georgia, "Source Serif Pro", serif',
              fontSize: '1.125rem',
              fontWeight: 600,
              margin: 0,
            }}
          >
            {poem?.title ?? lesson.poemSlug}
          </h2>
          <p className="chrome" style={{ margin: '0.125rem 0 0 0' }}>
            {poem?.author ?? '—'}
            {' · '}
            {audienceLabel(lesson.audience) ?? lesson.audience}
            {' · '}
            {lesson.videoIds.length} setting{lesson.videoIds.length === 1 ? '' : 's'}
            {' · '}
            {lesson.questions.length} question{lesson.questions.length === 1 ? '' : 's'}
          </p>
        </div>
      </header>

      <p className="chrome" style={{ margin: '0 0 0.75rem 0' }}>
        Saved {formatRelative(lesson.updatedAt)}
      </p>

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <Link
          href={studentUrl(lesson)}
          target="_blank"
          rel="noreferrer"
          className="btn"
          style={btnLinkStyle}
        >
          Student link ↗
        </Link>
        <Link
          href={teacherUrl(lesson)}
          target="_blank"
          rel="noreferrer"
          style={textLinkStyle}
        >
          Teacher edition ↗
        </Link>
        <Link href={editableUrl(lesson)} style={textLinkStyle}>
          Edit
        </Link>
        <button
          type="button"
          onClick={() => {
            if (window.confirm(`Remove "${poem?.title ?? lesson.poemSlug}" from your lessons?`)) {
              removeLesson(identity, lesson.id);
            }
          }}
          style={{
            ...textLinkStyle,
            marginLeft: 'auto',
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Remove
        </button>
      </div>
    </article>
  );
}

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffMs = Math.max(0, now - then);
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min} minute${min === 1 ? '' : 's'} ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hour${hr === 1 ? '' : 's'} ago`;
  const days = Math.floor(hr / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

const btnLinkStyle: React.CSSProperties = {
  textDecoration: 'none',
  fontSize: '0.875rem',
  padding: '0.375rem 0.75rem',
  display: 'inline-block',
};

const textLinkStyle: React.CSSProperties = {
  fontSize: '0.875rem',
  color: 'var(--muted)',
  textDecoration: 'underline',
};
