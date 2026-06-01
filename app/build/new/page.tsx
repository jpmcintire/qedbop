'use client';

import { Suspense, useEffect, useMemo, useState, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import { TopNav } from '@/app/_components/TopNav';
import { Modal } from '@/app/_components/Modal';
import { QrPanel } from '@/app/_components/QrPanel';
import { StudentPreviewEditor } from '@/app/_components/StudentPreviewEditor';
import {
  POEMS,
  AUDIENCES,
  audienceLabel as audLabel,
  getLengthOptions,
  DEFAULT_LENGTH_BY_AUDIENCE,
  type Poem,
  type Version,
} from '@/lib/poems';
import {
  fetchQuestions,
  fetchSingleQuestion,
  fetchTopicOptions,
} from '../../actions';
import { getIdentity } from '@/lib/identity-client';
import { saveLesson } from '@/lib/lessons-store';

// /build/new — the "real" v3 builder. Lives side-by-side with
// /build (the classic 9-step + Basic/Custom flow). Differences vs
// classic:
//   - Two forced picker screens (text, setting) then a single
//     lesson screen where everything is tweakable inline.
//   - No mode toggle, no launcher, no question-count step.
//     Defaults: 3 questions at the audience-default length.
//   - URLs (student/teacher/editable) live at the top of the lesson
//     screen with Copy + Preview/Edit + QR + Open.
//   - Topics live behind an Advanced disclosure in the Adjust panel.
//
// URL state matches /build: ?slug=, ?v= (repeatable), ?audience=,
// ?len= (repeatable; first one wins for now), ?q= (repeatable).
// No ?mode= param — /build/new is its own route.

const INITIAL_QUESTION_COUNT = 3;

type Screen = 'pick-text' | 'pick-setting' | 'lesson';

export default function Page() {
  return (
    <Suspense fallback={<main className="page" />}>
      <Builder />
    </Suspense>
  );
}

function Builder() {
  const sp = useSearchParams();

  const [textSlug, setTextSlug] = useState<string | null>(() => sp.get('slug'));
  const [settingIds, setSettingIds] = useState<string[]>(() => sp.getAll('v'));

  const initialAudience = sp.get('audience') ?? 'high-school';
  const [audience, setAudience] = useState<string>(initialAudience);
  const initialLength =
    sp.getAll('len')[0] ?? DEFAULT_LENGTH_BY_AUDIENCE[initialAudience] ?? 'paragraph';
  const [length, setLength] = useState<string>(initialLength);
  const [questions, setQuestions] = useState<string[]>(() => sp.getAll('q'));

  // Topics live in Advanced; lazy-fetched first time it opens.
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [topics, setTopics] = useState<string[]>([]);
  const [availableTopics, setAvailableTopics] = useState<string[]>([]);
  const [topicsLoading, setTopicsLoading] = useState(false);

  const [generating, startGenerating] = useTransition();
  const [generationError, setGenerationError] = useState<string | null>(null);

  const [customInput, setCustomInput] = useState('');
  const [addingCustom, startAddingCustom] = useTransition();
  const [customError, setCustomError] = useState<string | null>(null);

  const [addingSetting, setAddingSetting] = useState(false);

  const poem = useMemo(
    () => (textSlug ? POEMS.find((p) => p.slug === textSlug) ?? null : null),
    [textSlug],
  );
  const settings = useMemo<Version[]>(
    () =>
      poem
        ? settingIds
            .map((id) => poem.versions.find((v) => v.youtubeId === id))
            .filter((v): v is Version => !!v)
        : [],
    [poem, settingIds],
  );

  const screen: Screen = !poem
    ? 'pick-text'
    : settings.length === 0
      ? 'pick-setting'
      : 'lesson';

  const lengthOptions = useMemo(() => getLengthOptions(audience), [audience]);
  const lengthLabel = useMemo(
    () => lengthOptions.find((o) => o.value === length)?.label ?? 'Paragraph',
    [lengthOptions, length],
  );

  // Initial auto-generate: when we land in the lesson screen with no
  // questions, fire off generation once.
  useEffect(() => {
    if (screen !== 'lesson') return;
    if (questions.length > 0) return;
    if (!poem || generating) return;
    regenerate(INITIAL_QUESTION_COUNT);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, poem?.slug]);

  // Auto-save to /me/lessons for signed-in identities.
  useEffect(() => {
    const id = getIdentity();
    if (!id) return;
    if (!poem || settingIds.length === 0 || questions.length === 0) return;
    saveLesson(id, {
      poemSlug: poem.slug,
      audience,
      mode: 'v3',
      videoIds: settingIds,
      lengths: [length],
      questions,
    });
  }, [poem?.slug, settingIds, audience, length, questions]);

  // Lazy topic fetch when Advanced expands.
  useEffect(() => {
    if (!advancedOpen) return;
    if (!poem) return;
    if (availableTopics.length > 0 || topicsLoading) return;
    let cancelled = false;
    setTopicsLoading(true);
    fetchTopicOptions(poem.slug, audience)
      .then((t) => {
        if (cancelled) return;
        setAvailableTopics(t);
        setTopicsLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setTopicsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [advancedOpen, poem?.slug, audience, availableTopics.length, topicsLoading]);

  function regenerate(count = INITIAL_QUESTION_COUNT) {
    if (!poem || settingIds.length === 0) return;
    setGenerationError(null);
    startGenerating(async () => {
      try {
        const r = await fetchQuestions({
          slug: poem.slug,
          versionIds: settingIds,
          audience,
          topics,
          lengths: [lengthLabel],
          count,
        });
        if (r.questions.length === 0) {
          setGenerationError('No questions returned. Try changing audience or length.');
          return;
        }
        setQuestions(r.questions);
      } catch (e) {
        setGenerationError(e instanceof Error ? e.message : 'Generation failed.');
      }
    });
  }

  function addCustomQuestion() {
    const instruction = customInput.trim();
    if (!instruction || !poem || settingIds.length === 0) return;
    setCustomError(null);
    startAddingCustom(async () => {
      try {
        const q = await fetchSingleQuestion({
          slug: poem.slug,
          versionIds: settingIds,
          audience,
          existingQuestions: questions,
          instruction,
        });
        if (!q) {
          setCustomError('Could not generate. Try rephrasing.');
          return;
        }
        setQuestions((prev) => [...prev, q]);
        setCustomInput('');
      } catch (e) {
        setCustomError(e instanceof Error ? e.message : 'Generation failed.');
      }
    });
  }

  function chooseText(slug: string) {
    setTextSlug(slug);
    setSettingIds([]);
    setQuestions([]);
  }

  function chooseSetting(id: string) {
    setSettingIds([id]);
  }

  function addSetting(id: string) {
    setSettingIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setAddingSetting(false);
    // New setting → regenerate so the questions consider both.
    setQuestions([]);
  }

  function removeSetting(id: string) {
    setSettingIds((prev) => prev.filter((x) => x !== id));
  }

  function startOver() {
    setTextSlug(null);
    setSettingIds([]);
    setQuestions([]);
  }

  return (
    <main className="page" style={{ maxWidth: '52rem' }}>
      <TopNav current="build" />

      <header style={{ marginBottom: '1.5rem' }}>
        <p className="chrome">/build/new · new builder (side-by-side with classic /build)</p>
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
          onChangeText={() => setTextSlug(null)}
          excludeIds={[]}
        />
      )}

      {screen === 'lesson' && poem && (
        <Lesson
          poem={poem}
          settings={settings}
          audience={audience}
          setAudience={(a) => {
            setAudience(a);
            // Reset length to the new audience's default unless the
            // current value is still valid for the new audience.
            const opts = getLengthOptions(a);
            if (!opts.find((o) => o.value === length)) {
              setLength(DEFAULT_LENGTH_BY_AUDIENCE[a] ?? 'paragraph');
            }
          }}
          length={length}
          setLength={setLength}
          lengthOptions={lengthOptions}
          questions={questions}
          setQuestions={setQuestions}
          generating={generating}
          generationError={generationError}
          onRegenerate={() => regenerate(Math.max(INITIAL_QUESTION_COUNT, questions.length))}
          onChangeText={startOver}
          onAddSetting={() => setAddingSetting(true)}
          onRemoveSetting={removeSetting}
          advancedOpen={advancedOpen}
          setAdvancedOpen={setAdvancedOpen}
          topics={topics}
          setTopics={setTopics}
          availableTopics={availableTopics}
          topicsLoading={topicsLoading}
          customInput={customInput}
          setCustomInput={setCustomInput}
          onAddCustom={addCustomQuestion}
          addingCustom={addingCustom}
          customError={customError}
        />
      )}

      {addingSetting && poem && (
        <Modal
          open
          onClose={() => setAddingSetting(false)}
          title="Add another setting"
          subtitle="Pick a setting to add alongside the current ones."
          maxWidth="720px"
        >
          <div style={{ padding: '1rem 1.25rem' }}>
            <SettingList
              poem={poem}
              excludeIds={settingIds}
              onChoose={addSetting}
              ctaLabel="Add"
            />
          </div>
        </Modal>
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

      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1rem' }}>
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
  excludeIds,
}: {
  poem: Poem;
  onChoose: (id: string) => void;
  onChangeText: () => void;
  excludeIds: string[];
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
      <SettingList poem={poem} excludeIds={excludeIds} onChoose={onChoose} ctaLabel="Use this setting →" />
    </section>
  );
}

function SettingList({
  poem,
  excludeIds,
  onChoose,
  ctaLabel,
}: {
  poem: Poem;
  excludeIds: string[];
  onChoose: (id: string) => void;
  ctaLabel: string;
}) {
  const visible = poem.versions.filter((v) => !excludeIds.includes(v.youtubeId));
  if (visible.length === 0) {
    return (
      <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>
        No more settings available for this poem.
      </p>
    );
  }
  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      {visible.map((v) => (
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
                style={{ width: '100%', height: '100%', border: 0, display: 'block' }}
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
                {ctaLabel}
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

// =====================================================================
// Screen 3 — Lesson
// =====================================================================

type LessonProps = {
  poem: Poem;
  settings: Version[];
  audience: string;
  setAudience: (s: string) => void;
  length: string;
  setLength: (s: string) => void;
  lengthOptions: { value: string; label: string }[];
  questions: string[];
  setQuestions: (qs: string[]) => void;
  generating: boolean;
  generationError: string | null;
  onRegenerate: () => void;
  onChangeText: () => void;
  onAddSetting: () => void;
  onRemoveSetting: (id: string) => void;
  advancedOpen: boolean;
  setAdvancedOpen: (b: boolean) => void;
  topics: string[];
  setTopics: (t: string[]) => void;
  availableTopics: string[];
  topicsLoading: boolean;
  customInput: string;
  setCustomInput: (s: string) => void;
  onAddCustom: () => void;
  addingCustom: boolean;
  customError: string | null;
};

function Lesson(props: LessonProps) {
  const { poem, settings } = props;
  return (
    <section>
      <Crumb
        items={[
          { label: poem.title, onClick: props.onChangeText, hint: 'change text' },
          {
            label: settings.length === 1 ? settings[0].label : `${settings.length} settings`,
            current: true,
          },
        ]}
      />

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

      <UrlBlock
        poem={poem}
        settings={settings}
        audience={props.audience}
        length={props.length}
        questions={props.questions}
        setQuestions={props.setQuestions}
      />

      <Adjust {...props} />

      <AddMore
        onAddSetting={props.onAddSetting}
        settingCount={settings.length}
        totalAvailable={poem.versions.length}
        settings={settings}
        onRemoveSetting={props.onRemoveSetting}
      />
    </section>
  );
}

// =====================================================================
// URL block + rows
// =====================================================================

function UrlBlock({
  poem,
  settings,
  audience,
  length,
  questions,
  setQuestions,
}: {
  poem: Poem;
  settings: Version[];
  audience: string;
  length: string;
  questions: string[];
  setQuestions: (qs: string[]) => void;
}) {
  const queryString = useMemo(() => {
    const p = new URLSearchParams();
    settings.forEach((s) => p.append('v', s.youtubeId));
    p.set('audience', audience);
    p.append('len', length);
    questions.filter((q) => q.trim().length > 0).forEach((q) => p.append('q', q));
    return p.toString();
  }, [settings, audience, length, questions]);

  const studentUrl = `/a/${poem.slug}?${queryString}`;
  const teacherUrl = `/t/${poem.slug}?${queryString}`;
  const editableUrl = `/build/new?slug=${poem.slug}&${queryString}`;
  const qrCaption = `${poem.title} — ${audLabel(audience) ?? audience}`;
  const lengthLabelValue =
    getLengthOptions(audience).find((o) => o.value === length)?.label ?? 'Paragraph';

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
          versions: settings,
          audienceLabel: audLabel(audience) ?? audience,
          lengthLabels: [lengthLabelValue],
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
  poem: Poem;
  versions: Version[];
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
          <div style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>{hint}</div>
        </div>
        <div
          style={{
            display: 'flex',
            gap: '0.375rem',
            flexShrink: 0,
            flexWrap: 'wrap',
            justifyContent: 'flex-end',
          }}
        >
          <RowButton onClick={doCopy} primary={primary}>
            {copied ? 'Copied' : 'Copy'}
          </RowButton>
          {previewKind && (
            <RowButton onClick={() => setModal('preview')}>
              {previewKind === 'student' ? 'Preview / edit' : 'Preview'}
            </RowButton>
          )}
          {showQr && <RowButton onClick={() => setModal('qr')}>QR</RowButton>}
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

// =====================================================================
// Adjust panel
// =====================================================================

function Adjust(props: LessonProps) {
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
            {AUDIENCES.map((a) => (
              <Pill
                key={a.value}
                active={props.audience === a.value}
                onClick={() => props.setAudience(a.value)}
              >
                {a.label}
              </Pill>
            ))}
          </PillRow>
        </AdjustRow>
        <AdjustRow
          label="Length"
          intro="How long each student response is expected to be. Shown to students above the questions so they know what's expected."
        >
          <PillRow>
            {props.lengthOptions.map((o) => (
              <Pill key={o.value} active={props.length === o.value} onClick={() => props.setLength(o.value)}>
                {o.label}
              </Pill>
            ))}
          </PillRow>
        </AdjustRow>
        <AdjustRow
          label={`Questions (${props.questions.length})`}
          intro="The discussion prompts students see. AI-generated for the chosen text + setting + audience; edit any of them, or write your own."
        >
          <QuestionsEditor {...props} />
        </AdjustRow>
        <AdvancedRow
          open={props.advancedOpen}
          setOpen={props.setAdvancedOpen}
          topics={props.topics}
          setTopics={props.setTopics}
          availableTopics={props.availableTopics}
          topicsLoading={props.topicsLoading}
        />
      </div>
    </section>
  );
}

function QuestionsEditor(props: LessonProps) {
  return (
    <div>
      {props.generating && props.questions.length === 0 ? (
        <p style={{ color: 'var(--muted)', fontSize: '0.875rem', margin: 0 }}>
          Generating with Claude…
        </p>
      ) : (
        <ol style={{ paddingLeft: '1.25rem', margin: 0, display: 'grid', gap: '0.5rem' }}>
          {props.questions.map((q, i) => (
            <li key={i}>
              <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'flex-start' }}>
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
                <button
                  type="button"
                  onClick={() => props.setQuestions(props.questions.filter((_, idx) => idx !== i))}
                  title="Remove this question"
                  aria-label="Remove this question"
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--rule)',
                    borderRadius: '0.25rem',
                    padding: '0.25rem 0.5rem',
                    cursor: 'pointer',
                    color: 'var(--muted)',
                    fontFamily: 'inherit',
                    fontSize: '0.75rem',
                    flexShrink: 0,
                  }}
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}

      {props.generationError && (
        <p style={{ color: '#a33', fontSize: '0.8125rem', marginTop: '0.5rem' }}>
          {props.generationError}
        </p>
      )}

      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          className="btn"
          onClick={props.onRegenerate}
          disabled={props.generating}
          style={{ fontSize: '0.75rem', padding: '0.25rem 0.625rem' }}
        >
          {props.generating ? 'Generating…' : 'Regenerate all'}
        </button>
      </div>

      <div style={{ marginTop: '0.75rem' }}>
        <p className="chrome" style={{ margin: '0 0 0.25rem 0' }}>
          Add a custom question
        </p>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            value={props.customInput}
            onChange={(e) => props.setCustomInput(e.target.value)}
            placeholder="e.g. ask about the singer's phrasing in the bridge"
            style={{
              flex: 1,
              minWidth: 0,
              padding: '0.375rem 0.5rem',
              border: '1px solid var(--rule)',
              borderRadius: '0.25rem',
              fontFamily: 'inherit',
              fontSize: '0.8125rem',
              background: 'var(--paper)',
              color: 'var(--ink)',
            }}
          />
          <button
            type="button"
            onClick={props.onAddCustom}
            disabled={props.addingCustom || props.customInput.trim().length === 0}
            className="btn"
            style={{ fontSize: '0.75rem', padding: '0.25rem 0.625rem' }}
          >
            {props.addingCustom ? 'Adding…' : 'Add'}
          </button>
        </div>
        {props.customError && (
          <p style={{ color: '#a33', fontSize: '0.8125rem', marginTop: '0.25rem' }}>
            {props.customError}
          </p>
        )}
      </div>
    </div>
  );
}

function AdvancedRow({
  open,
  setOpen,
  topics,
  setTopics,
  availableTopics,
  topicsLoading,
}: {
  open: boolean;
  setOpen: (b: boolean) => void;
  topics: string[];
  setTopics: (t: string[]) => void;
  availableTopics: string[];
  topicsLoading: boolean;
}) {
  function toggle(t: string) {
    setTopics(topics.includes(t) ? topics.filter((x) => x !== t) : [...topics, t]);
  }
  return (
    <div
      style={{
        padding: '0.875rem 1rem',
      }}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          color: 'var(--muted)',
          fontFamily: 'inherit',
          fontSize: '0.8125rem',
          cursor: 'pointer',
          textDecoration: 'underline',
        }}
      >
        {open ? '▾ Advanced' : '▸ Advanced'}
      </button>
      {open && (
        <div style={{ marginTop: '0.75rem' }}>
          <p className="chrome" style={{ marginBottom: '0.25rem' }}>
            Topics
          </p>
          <p style={{ fontSize: '0.8125rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>
            Optional. Steer the AI toward specific themes when regenerating questions.
          </p>
          {topicsLoading ? (
            <p style={{ color: 'var(--muted)', fontSize: '0.8125rem' }}>Loading topics…</p>
          ) : availableTopics.length === 0 ? (
            <p style={{ color: 'var(--muted)', fontSize: '0.8125rem' }}>
              No topic suggestions for this poem.
            </p>
          ) : (
            <PillRow>
              {availableTopics.map((t) => (
                <Pill key={t} active={topics.includes(t)} onClick={() => toggle(t)}>
                  {t}
                </Pill>
              ))}
            </PillRow>
          )}
        </div>
      )}
    </div>
  );
}

function AdjustRow({
  label,
  intro,
  children,
}: {
  label: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        borderBottom: '1px solid var(--rule)',
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

// =====================================================================
// Add more (settings / poems)
// =====================================================================

function AddMore({
  onAddSetting,
  settingCount,
  totalAvailable,
  settings,
  onRemoveSetting,
}: {
  onAddSetting: () => void;
  settingCount: number;
  totalAvailable: number;
  settings: Version[];
  onRemoveSetting: (id: string) => void;
}) {
  const canAddMore = settingCount < totalAvailable;
  return (
    <section
      style={{
        paddingTop: '1.25rem',
        borderTop: '1px dashed var(--rule)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
      }}
    >
      {settings.length > 1 && (
        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.375rem',
          }}
        >
          {settings.map((s) => (
            <li
              key={s.youtubeId}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.25rem 0.5rem 0.25rem 0.75rem',
                border: '1px solid var(--rule)',
                borderRadius: '999px',
                fontSize: '0.8125rem',
                color: 'var(--muted)',
              }}
            >
              {s.label}
              <button
                type="button"
                onClick={() => onRemoveSetting(s.youtubeId)}
                title={`Remove ${s.label}`}
                aria-label={`Remove ${s.label}`}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: '0.75rem',
                  color: 'var(--muted)',
                  padding: '0 0.125rem',
                }}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <p className="chrome" style={{ margin: 0 }}>
          Add to this lesson:
        </p>
        <button
          type="button"
          onClick={canAddMore ? onAddSetting : undefined}
          disabled={!canAddMore}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            color: 'var(--muted)',
            fontFamily: 'inherit',
            fontSize: '0.875rem',
            cursor: canAddMore ? 'pointer' : 'not-allowed',
            textDecoration: canAddMore ? 'underline' : 'none',
            opacity: canAddMore ? 1 : 0.5,
          }}
        >
          + another setting{canAddMore ? '' : ' (none left)'}
        </button>
      </div>
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
        <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
            <span
              style={{
                fontSize: '0.9375rem',
                color: it.current ? 'var(--ink)' : 'var(--muted)',
              }}
            >
              {it.label}
            </span>
          )}
          {i < items.length - 1 && <span style={{ color: 'var(--muted)' }}>›</span>}
        </span>
      ))}
    </nav>
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

// =====================================================================
// Helpers
// =====================================================================

function lastName(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts.length > 1 ? parts[parts.length - 1] : name;
}
