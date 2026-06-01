'use client';

// Static visual mock v3 of the proposed "Build a lesson" workflow.
// Lives alongside v2 (/mocks/build-v2) for direct comparison; current
// /build is untouched. Accessed by typing the URL.
//
// Paradigm shift vs v2: instead of a stepper that gates every
// decision, this is "two forced picker steps, then an instant lesson
// with everything tweakable inline." Defaults are deliberately
// conservative so a teacher who picks a poem + a setting and stops
// there still has a usable lesson. Every other knob is an Adjust row
// that opens inline.
//
// What this mock validates:
//   - Pick-a-text as THE entry; "pick a lesson type" is understated
//     bottom-right
//   - Library browse + text search inside the picker
//   - Pick-a-setting is a discrete second screen so the listening
//     decision gets its own attention
//   - Conservative defaults (HS, in-class, 3 paragraph questions)
//     produce an immediately-usable lesson the moment a setting is
//     chosen
//   - Adjust panel makes every default editable inline without
//     navigating; each row has a short context intro explaining what
//     it is so labels alone don't carry the meaning
//   - "Add another setting / poem" lives at the bottom, deemphasized

import { useMemo, useState } from 'react';
import { POEMS } from '@/lib/poems';
import { TopNav } from '@/app/_components/TopNav';
import { Modal } from '@/app/_components/Modal';
import { QrPanel } from '@/app/_components/QrPanel';
import { StudentPreviewEditor } from '@/app/_components/StudentPreviewEditor';

type Screen = 'pick-text' | 'pick-setting' | 'lesson';

const DEFAULTS = {
  audience: 'high-school',
  shape: 'in-class' as 'in-class' | 'at-home',
  length: 'paragraph',
} as const;

const SAMPLE_QUESTIONS = [
  'What does this musical setting argue about the poem that the words alone don’t say?',
  'Identify a moment where the instrumentation changes unexpectedly and explain its interpretive effect.',
  'How does the singer’s phrasing reshape the meter of the original?',
];

export default function BuildMockV3() {
  const [screen, setScreen] = useState<Screen>('pick-text');
  const [textSlug, setTextSlug] = useState<string | null>(null);
  const [settingId, setSettingId] = useState<string | null>(null);
  const [audience, setAudience] = useState<string>(DEFAULTS.audience);
  const [shape, setShape] = useState<'in-class' | 'at-home'>(DEFAULTS.shape);
  const [length, setLength] = useState<string>(DEFAULTS.length);
  const [questions, setQuestions] = useState<string[]>(SAMPLE_QUESTIONS);

  const poem = textSlug ? POEMS.find((p) => p.slug === textSlug) : null;
  const setting = poem && settingId ? poem.versions.find((v) => v.youtubeId === settingId) : null;

  function chooseText(slug: string) {
    setTextSlug(slug);
    setSettingId(null);
    setScreen('pick-setting');
  }

  function chooseSetting(id: string) {
    setSettingId(id);
    setScreen('lesson');
  }

  function startOver() {
    setTextSlug(null);
    setSettingId(null);
    setScreen('pick-text');
  }

  return (
    <main className="page" style={{ maxWidth: '52rem' }}>
      <TopNav current="build" />

      <header style={{ marginBottom: '1.5rem' }}>
        <p className="chrome" style={{ margin: 0, color: '#a06d2f' }}>
          MOCK · v3 · /mocks/build-v3 · forced 2-step then tweak
        </p>
        <h1
          style={{
            fontFamily: 'Georgia, "Source Serif Pro", serif',
            fontSize: '1.75rem',
            fontWeight: 600,
            margin: '0.25rem 0 0 0',
          }}
        >
          Build a lesson
        </h1>
      </header>

      {screen === 'pick-text' && <PickText onChoose={chooseText} />}

      {screen === 'pick-setting' && poem && (
        <PickSetting
          poem={poem}
          onChoose={chooseSetting}
          onChangeText={() => setScreen('pick-text')}
        />
      )}

      {screen === 'lesson' && poem && setting && (
        <Lesson
          poem={poem}
          setting={setting}
          audience={audience}
          setAudience={setAudience}
          shape={shape}
          setShape={setShape}
          length={length}
          setLength={setLength}
          questions={questions}
          setQuestions={setQuestions}
          onChangeText={startOver}
          onChangeSetting={() => setScreen('pick-setting')}
        />
      )}
    </main>
  );
}

// =====================================================================
// Screen 1 — Pick a text
// =====================================================================

function PickText({ onChoose }: { onChoose: (slug: string) => void }) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<'title' | 'poet' | 'year'>('title');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = POEMS.filter((p) => {
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.author.toLowerCase().includes(q) ||
        p.text.toLowerCase().includes(q)
      );
    });
    const sorted = [...list].sort((a, b) => {
      if (sort === 'title') return a.title.localeCompare(b.title);
      if (sort === 'poet') return lastName(a.author).localeCompare(lastName(b.author));
      return a.year - b.year;
    });
    return sorted;
  }, [query, sort]);

  return (
    <section>
      <p
        style={{
          fontFamily: 'Georgia, "Source Serif Pro", serif',
          fontSize: '1.125rem',
          marginBottom: '1.25rem',
        }}
      >
        Pick a text to start.
      </p>

      <input
        type="search"
        placeholder="Search title, poet, or a line…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{
          width: '100%',
          padding: '0.625rem 0.875rem',
          fontSize: '0.9375rem',
          border: '1px solid var(--rule)',
          borderRadius: '0.375rem',
          background: 'var(--paper)',
          color: 'var(--ink)',
          fontFamily: 'inherit',
          marginBottom: '0.75rem',
        }}
      />

      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          alignItems: 'center',
          marginBottom: '1rem',
        }}
      >
        <span className="chrome">Sort:</span>
        {(['title', 'poet', 'year'] as const).map((k) => (
          <Pill key={k} active={sort === k} onClick={() => setSort(k)}>
            {k === 'title' ? 'A–Z' : k === 'poet' ? 'Poet' : 'Year'}
          </Pill>
        ))}
        <span className="chrome" style={{ marginLeft: 'auto' }}>
          {filtered.length} poem{filtered.length === 1 ? '' : 's'}
        </span>
      </div>

      <ul
        style={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
          border: '1px solid var(--rule)',
          borderRadius: '0.375rem',
        }}
      >
        {filtered.map((p, i) => (
          <li
            key={p.slug}
            style={{
              borderBottom: i < filtered.length - 1 ? '1px solid var(--rule)' : 'none',
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              padding: '0.75rem 1rem',
              gap: '1rem',
            }}
          >
            <div style={{ minWidth: 0 }}>
              <span
                style={{
                  fontFamily: 'Georgia, "Source Serif Pro", serif',
                  fontWeight: 600,
                  fontSize: '1rem',
                }}
              >
                {p.title}
              </span>
              <span className="chrome" style={{ marginLeft: '0.5rem' }}>
                {p.author}, {p.year} · {p.versions.length} setting
                {p.versions.length === 1 ? '' : 's'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onChoose(p.slug)}
              className="btn"
              style={{ fontSize: '0.8125rem', padding: '0.375rem 0.875rem' }}
            >
              Choose
            </button>
          </li>
        ))}
      </ul>

      <p
        className="chrome"
        style={{ textAlign: 'right', marginTop: '0.75rem', fontSize: '0.75rem' }}
      >
        <a href="#" style={{ color: 'var(--muted)' }}>
          · or pick a lesson type ·
        </a>
      </p>
    </section>
  );
}

// =====================================================================
// Screen 2 — Pick a setting
// =====================================================================

function PickSetting({
  poem,
  onChoose,
  onChangeText,
}: {
  poem: (typeof POEMS)[number];
  onChoose: (id: string) => void;
  onChangeText: () => void;
}) {
  return (
    <section>
      <Crumb
        items={[
          { label: poem.title, onClick: onChangeText, hint: 'change text' },
          { label: 'Pick a setting', current: true },
        ]}
      />
      <p
        style={{
          fontFamily: 'Georgia, "Source Serif Pro", serif',
          fontSize: '1.125rem',
          margin: '0.75rem 0 1.25rem 0',
        }}
      >
        Which setting do you want to start with? You can add another later.
      </p>

      <div style={{ display: 'grid', gap: '1rem' }}>
        {poem.versions.map((v) => (
          <article
            key={v.youtubeId}
            style={{
              padding: '1rem 1.25rem',
              border: '1px solid var(--rule)',
              borderRadius: '0.5rem',
            }}
          >
            <header style={{ marginBottom: '0.75rem' }}>
              <h3
                style={{
                  fontFamily: 'Georgia, "Source Serif Pro", serif',
                  fontSize: '1.0625rem',
                  fontWeight: 600,
                  margin: 0,
                }}
              >
                {v.label}
              </h3>
              <p className="chrome" style={{ margin: '0.125rem 0 0 0' }}>
                {[v.artist, v.genre, v.vocalCharacter].filter(Boolean).join(' · ') || '—'}
              </p>
            </header>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div
                style={{
                  flexShrink: 0,
                  width: '144px',
                  height: '81px',
                  borderRadius: '0.375rem',
                  overflow: 'hidden',
                  background: '#000',
                }}
              >
                <iframe
                  src={`https://www.youtube.com/embed/${v.youtubeId}`}
                  title={`${poem.title} — ${v.label}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 0,
                    display: 'block',
                  }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <div style={{ flex: 1, minWidth: '14rem' }}>
                {v.themes && (
                  <p
                    style={{
                      color: 'var(--muted)',
                      fontSize: '0.875rem',
                      margin: '0 0 0.75rem 0',
                      whiteSpace: 'pre-wrap',
                      lineHeight: 1.5,
                    }}
                  >
                    {v.themes}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => onChoose(v.youtubeId)}
                  className="btn"
                  style={{ fontSize: '0.875rem' }}
                >
                  Use this setting →
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

// =====================================================================
// Screen 3 — Lesson + tweaks (the headline UX bet)
// =====================================================================

function Lesson({
  poem,
  setting,
  audience,
  setAudience,
  shape,
  setShape,
  length,
  setLength,
  questions,
  setQuestions,
  onChangeText,
  onChangeSetting,
}: {
  poem: (typeof POEMS)[number];
  setting: (typeof POEMS)[number]['versions'][number];
  audience: string;
  setAudience: (s: string) => void;
  shape: 'in-class' | 'at-home';
  setShape: (s: 'in-class' | 'at-home') => void;
  length: string;
  setLength: (s: string) => void;
  questions: string[];
  setQuestions: (q: string[]) => void;
  onChangeText: () => void;
  onChangeSetting: () => void;
}) {
  return (
    <section>
      <Crumb
        items={[
          { label: poem.title, onClick: onChangeText, hint: 'change text' },
          { label: setting.label, onClick: onChangeSetting, hint: 'change setting' },
        ]}
      />

      <LessonHeader />
      <UrlBlock
        poem={poem}
        setting={setting}
        audience={audience}
        length={length}
        questions={questions}
        setQuestions={setQuestions}
      />
      <Adjust
        audience={audience}
        setAudience={setAudience}
        shape={shape}
        setShape={setShape}
        length={length}
        setLength={setLength}
        questions={questions}
        setQuestions={setQuestions}
      />
      <AddMore />
    </section>
  );
}

function LessonHeader() {
  return (
    <header style={{ margin: '1rem 0 0.5rem 0' }}>
      <h2
        style={{
          fontFamily: 'Georgia, "Source Serif Pro", serif',
          fontSize: '1.375rem',
          fontWeight: 600,
          margin: 0,
        }}
      >
        Your lesson
      </h2>
    </header>
  );
}

function UrlBlock({
  poem,
  setting,
  audience,
  length,
  questions,
  setQuestions,
}: {
  poem: (typeof POEMS)[number];
  setting: (typeof POEMS)[number]['versions'][number];
  audience: string;
  length: string;
  questions: string[];
  setQuestions: (qs: string[]) => void;
}) {
  // Build real student/teacher/editable URLs from the mock state so
  // Preview iframes and QR codes resolve to actual rendered pages
  // (not placeholders). All three are same-origin so iframes work.
  const queryString = useMemo(() => {
    const p = new URLSearchParams();
    p.append('v', setting.youtubeId);
    p.set('audience', audience);
    p.append('len', length);
    questions.filter((q) => q.trim().length > 0).forEach((q) => p.append('q', q));
    return p.toString();
  }, [setting.youtubeId, audience, length, questions]);

  const studentUrl = `/a/${poem.slug}?${queryString}`;
  const teacherUrl = `/t/${poem.slug}?${queryString}`;
  const editableUrl = `/build?mode=custom&slug=${poem.slug}&${queryString}`;
  const qrCaption = `${poem.title} — ${AUDIENCE_LABEL[audience] ?? audience}`;

  return (
    <div
      style={{
        border: '1px solid var(--rule)',
        borderRadius: '0.5rem',
        padding: '0.875rem 1rem',
        marginBottom: '1.5rem',
        display: 'grid',
        gap: '0.625rem',
        background: 'rgba(0,0,0,0.02)',
      }}
    >
      <UrlRow
        label="Student link"
        hint="Send to students. Read-only — they see the poem, settings, and questions."
        url={studentUrl}
        primary
        previewKind="student"
        previewState={{
          poem,
          versions: [setting],
          audienceLabel: AUDIENCE_LABEL[audience] ?? audience,
          lengthLabels: [LENGTH_LABEL[length] ?? length],
          questions,
          onSaveQuestions: setQuestions,
        }}
        showQr
        qrCaption={qrCaption}
      />
      <UrlRow
        label="Teacher edition"
        hint="For you. Poet bio, historical context, class agenda, per-question commentary."
        url={teacherUrl}
        previewKind="iframe"
      />
      <UrlRow
        label="Editable"
        hint="For you. Opens this lesson back into the builder so you can tweak it later."
        url={editableUrl}
      />
    </div>
  );
}

type PreviewState = {
  poem: (typeof POEMS)[number];
  versions: (typeof POEMS)[number]['versions'];
  audienceLabel: string;
  lengthLabels: string[];
  questions: string[];
  onSaveQuestions: (qs: string[]) => void;
};

function UrlRow({
  label,
  hint,
  url,
  primary,
  previewKind,
  previewState,
  showQr,
  qrCaption,
}: {
  label: string;
  hint: string;
  url: string;
  primary?: boolean;
  // 'student' renders the editable preview component; 'iframe' iframes
  // the real URL (used for teacher edition where content is AI-generated
  // and not user-editable).
  previewKind?: 'student' | 'iframe';
  previewState?: PreviewState;
  showQr?: boolean;
  qrCaption?: string;
}) {
  const [modal, setModal] = useState<'preview' | 'qr' | null>(null);
  const [copied, setCopied] = useState(false);

  async function doCopy() {
    try {
      const full = window.location.origin + url;
      await navigator.clipboard.writeText(full);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }

  const fullUrl = typeof window !== 'undefined' ? `${window.location.origin}${url}` : url;

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            className="chrome"
            style={{
              fontWeight: primary ? 600 : 400,
              color: primary ? 'var(--ink)' : 'var(--muted)',
              marginBottom: '0.125rem',
            }}
          >
            {label}
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>
            {hint}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.375rem', flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <RowButton onClick={doCopy} primary={primary}>
            {copied ? 'Copied' : 'Copy'}
          </RowButton>
          {previewKind && (
            <RowButton onClick={() => setModal('preview')}>
              {previewKind === 'student' ? 'Preview / edit' : 'Preview'}
            </RowButton>
          )}
          {showQr && (
            <RowButton onClick={() => setModal('qr')}>QR</RowButton>
          )}
          <RowLink href={url}>Open ↗</RowLink>
        </div>
      </div>

      <Modal
        open={modal === 'preview'}
        onClose={() => setModal(null)}
        title={previewKind === 'student' ? 'Preview / edit — student view' : `Preview — ${label}`}
        subtitle={
          previewKind === 'student'
            ? 'Click any question to edit it. Save updates the shareable URL.'
            : 'What this URL renders for whoever opens it.'
        }
        maxWidth={previewKind === 'student' ? '720px' : '960px'}
      >
        {previewKind === 'student' && previewState ? (
          <StudentPreviewEditor
            poem={previewState.poem}
            versions={previewState.versions}
            audienceLabel={previewState.audienceLabel}
            lengthLabels={previewState.lengthLabels}
            questions={previewState.questions}
            onClose={() => setModal(null)}
            onSave={(qs) => {
              previewState.onSaveQuestions(qs);
              setModal(null);
            }}
          />
        ) : (
          <iframe
            src={url}
            title={`Preview of ${label}`}
            style={{ width: '100%', height: '70vh', border: 0, display: 'block' }}
          />
        )}
      </Modal>

      <Modal
        open={modal === 'qr'}
        onClose={() => setModal(null)}
        title="Show to class"
        subtitle="Project this — students scan to open the assignment on their phones."
        maxWidth="480px"
      >
        <QrPanel url={fullUrl} caption={qrCaption} />
      </Modal>
    </>
  );
}

function RowButton({
  children,
  onClick,
  primary,
}: {
  children: React.ReactNode;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      className={primary ? 'btn' : ''}
      onClick={onClick}
      style={{
        fontSize: '0.75rem',
        padding: '0.375rem 0.75rem',
        background: primary ? undefined : 'transparent',
        border: primary ? undefined : '1px solid var(--rule)',
        color: primary ? undefined : 'var(--muted)',
        borderRadius: '0.25rem',
        cursor: 'pointer',
        fontFamily: 'inherit',
      }}
    >
      {children}
    </button>
  );
}

function RowLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      style={{
        fontSize: '0.75rem',
        padding: '0.375rem 0.75rem',
        background: 'transparent',
        border: '1px solid var(--rule)',
        color: 'var(--muted)',
        borderRadius: '0.25rem',
        fontFamily: 'inherit',
        textDecoration: 'none',
        display: 'inline-block',
      }}
    >
      {children}
    </a>
  );
}

function Adjust(props: {
  audience: string;
  setAudience: (s: string) => void;
  shape: 'in-class' | 'at-home';
  setShape: (s: 'in-class' | 'at-home') => void;
  length: string;
  setLength: (s: string) => void;
  questions: string[];
  setQuestions: (q: string[]) => void;
}) {
  return (
    <section style={{ marginBottom: '1.5rem' }}>
      <h3
        style={{
          fontFamily: 'Georgia, "Source Serif Pro", serif',
          fontSize: '1rem',
          fontWeight: 600,
          margin: '0 0 0.75rem 0',
        }}
      >
        Adjust
      </h3>
      <div style={{ border: '1px solid var(--rule)', borderRadius: '0.5rem' }}>
        <AdjustRow
          label="Audience"
          intro="Calibrates the vocabulary, theoretical depth, and length of the AI-generated questions and teacher edition."
        >
          <PillRow>
            {Object.entries(AUDIENCE_LABEL).map(([k, v]) => (
              <Pill key={k} active={props.audience === k} onClick={() => props.setAudience(k)}>
                {v}
              </Pill>
            ))}
          </PillRow>
        </AdjustRow>
        <AdjustRow
          label="Shape"
          intro="Whether students answer the questions during class together or write longer responses at home."
        >
          <PillRow>
            <Pill active={props.shape === 'in-class'} onClick={() => props.setShape('in-class')}>
              In class only
            </Pill>
            <Pill active={props.shape === 'at-home'} onClick={() => props.setShape('at-home')}>
              With at-home component
            </Pill>
          </PillRow>
        </AdjustRow>
        <AdjustRow
          label="Length"
          intro="How long each student response is expected to be. Shown to students above the questions so they know what's expected."
        >
          <PillRow>
            {Object.entries(LENGTH_LABEL).map(([k, v]) => (
              <Pill key={k} active={props.length === k} onClick={() => props.setLength(k)}>
                {v}
              </Pill>
            ))}
          </PillRow>
        </AdjustRow>
        <AdjustRow
          label={`Questions (${props.questions.length})`}
          intro="The discussion prompts students see. AI-generated for the chosen text + setting + audience; edit any of them, or write your own."
          last
        >
          <ol style={{ paddingLeft: '1.25rem', margin: 0, display: 'grid', gap: '0.5rem' }}>
            {props.questions.map((q, i) => (
              <li key={i}>
                <textarea
                  value={q}
                  onChange={(e) => {
                    const next = [...props.questions];
                    next[i] = e.target.value;
                    props.setQuestions(next);
                  }}
                  style={{
                    width: '100%',
                    minHeight: '3em',
                    padding: '0.375rem 0.5rem',
                    border: '1px solid var(--rule)',
                    borderRadius: '0.25rem',
                    fontFamily: 'inherit',
                    fontSize: '0.875rem',
                    resize: 'vertical',
                    background: 'var(--paper)',
                    color: 'var(--ink)',
                  }}
                />
              </li>
            ))}
          </ol>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              className="btn"
              style={{ fontSize: '0.75rem', padding: '0.25rem 0.625rem' }}
            >
              + Add custom question
            </button>
            <button
              type="button"
              style={{
                fontSize: '0.75rem',
                padding: '0.25rem 0.625rem',
                background: 'transparent',
                border: '1px solid var(--rule)',
                borderRadius: '0.25rem',
                cursor: 'pointer',
                color: 'var(--muted)',
                fontFamily: 'inherit',
              }}
            >
              Regenerate all
            </button>
          </div>
        </AdjustRow>
      </div>
    </section>
  );
}

function AdjustRow({
  label,
  intro,
  children,
  last,
}: {
  label: string;
  intro: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div
      style={{
        borderBottom: last ? 'none' : '1px solid var(--rule)',
        padding: '0.875rem 1rem',
        display: 'grid',
        gridTemplateColumns: '8rem 1fr',
        gap: '1rem',
        alignItems: 'flex-start',
      }}
    >
      <div className="chrome" style={{ fontWeight: 500 }}>
        {label}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: '0.8125rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>
          {intro}
        </div>
        {children}
      </div>
    </div>
  );
}

function PillRow({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>{children}</div>;
}

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '0.375rem 0.875rem',
        border: `1px solid ${active ? 'var(--ink)' : 'var(--rule)'}`,
        background: active ? 'var(--ink)' : 'var(--paper)',
        color: active ? 'var(--paper)' : 'var(--ink)',
        borderRadius: '999px',
        cursor: 'pointer',
        fontFamily: 'inherit',
        fontSize: '0.875rem',
        lineHeight: 1.2,
      }}
    >
      {children}
    </button>
  );
}

function AddMore() {
  return (
    <section
      style={{
        paddingTop: '1.25rem',
        borderTop: '1px dashed var(--rule)',
        display: 'flex',
        gap: '1.5rem',
        flexWrap: 'wrap',
      }}
    >
      <p className="chrome" style={{ margin: 0, alignSelf: 'center' }}>
        Add to this lesson:
      </p>
      <a href="#" style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>
        + another setting
      </a>
      <a href="#" style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>
        + another poem
      </a>
    </section>
  );
}

// =====================================================================
// Small primitives
// =====================================================================

function Crumb({
  items,
}: {
  items: Array<{ label: string; onClick?: () => void; hint?: string; current?: boolean }>;
}) {
  return (
    <nav
      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}
      aria-label="Builder breadcrumb"
    >
      {items.map((it, i) => (
        <span
          key={i}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          {it.onClick ? (
            <button
              type="button"
              onClick={it.onClick}
              title={it.hint}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: '0.9375rem',
                color: 'var(--ink)',
                textDecoration: 'underline',
                textUnderlineOffset: '0.2em',
              }}
            >
              {it.label}
            </button>
          ) : (
            <span style={{ fontSize: '0.9375rem', color: it.current ? 'var(--ink)' : 'var(--muted)' }}>
              {it.label}
            </span>
          )}
          {i < items.length - 1 && <span style={{ color: 'var(--muted)' }}>›</span>}
        </span>
      ))}
    </nav>
  );
}

// =====================================================================
// Helpers
// =====================================================================

const AUDIENCE_LABEL: Record<string, string> = {
  'middle-school': 'Middle school',
  'high-school': 'High school',
  college: 'College',
  'post-graduate': 'Post-graduate',
};

const LENGTH_LABEL: Record<string, string> = {
  sentence: 'A sentence',
  'short-paragraph': 'Short paragraph',
  paragraph: 'Paragraph',
  'short-essay': 'Short essay',
  essay: 'Essay',
};

function lastName(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts.length > 1 ? parts[parts.length - 1] : name;
}

