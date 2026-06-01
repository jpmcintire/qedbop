'use client';

import { Suspense, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import { TopNav } from '../_components/TopNav';
import { BuildLauncher, type LessonPreset } from './BuildLauncher';
import { getIdentity } from '@/lib/identity-client';
import { saveLesson } from '@/lib/lessons-store';
import {
  POEMS,
  AUDIENCES,
  audienceLabel,
  getLengthOptions,
  DEFAULT_LENGTH_BY_AUDIENCE,
} from '@/lib/poems';
import { fetchTopicOptions, fetchQuestions, fetchSingleQuestion } from '../actions';
import {
  Step,
  ModeToggle,
  UrlBlock,
  VersionPicker,
  TopicPicker,
  LengthPicker,
  QuestionEditor,
  BasicGenerate,
} from '../_components';

export default function Page() {
  return (
    <Suspense fallback={<main className="page" />}>
      <BuilderPage />
    </Suspense>
  );
}

function BuilderPage() {
  const sp = useSearchParams();

  // ----- State (initialized from URL params if present so an editable URL roundtrips cleanly) -----

  const [mode, setModeState] = useState<'basic' | 'custom'>(
    () => (sp.get('mode') === 'basic' ? 'basic' : 'custom')
  );
  const [slug, setSlug] = useState<string>(() => sp.get('slug') ?? POEMS[0]?.slug ?? '');
  const [picked, setPicked] = useState<string[]>(() => sp.getAll('v'));
  // Basic mode is calibrated for middle school students — audience is locked.
  const initialAudience = sp.get('mode') === 'basic' ? 'middle-school' : (sp.get('audience') ?? 'high-school');
  const [audience, setAudience] = useState<string>(initialAudience);

  // Switching to Basic mode forces audience to middle-school. Switching to
  // Custom doesn't change audience — preserves the teacher's previous pick.
  function setMode(newMode: 'basic' | 'custom') {
    setModeState(newMode);
    if (newMode === 'basic' && audience !== 'middle-school') {
      setAudience('middle-school');
    }
  }
  const [edited, setEdited] = useState<string[]>(() => sp.getAll('q'));
  const [questionCount, setQuestionCount] = useState<number>(() => {
    const fromUrl = sp.getAll('q').length;
    return Math.min(5, fromUrl > 0 ? fromUrl : 4);
  });
  const [selectedLengths, setSelectedLengths] = useState<string[]>(() => {
    const fromUrl = sp.getAll('len');
    if (fromUrl.length > 0) return fromUrl;
    return [DEFAULT_LENGTH_BY_AUDIENCE[initialAudience] ?? 'paragraph'];
  });

  const [availableTopics, setAvailableTopics] = useState<string[]>([]);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [customTopics, setCustomTopics] = useState<string[]>([]);
  const [customTopicInput, setCustomTopicInput] = useState('');

  const [generating, startGenerating] = useTransition();
  const [generationError, setGenerationError] = useState<string | null>(null);

  const [customQuestionInput, setCustomQuestionInput] = useState('');
  const [generatingCustom, startGeneratingCustom] = useTransition();
  const [customQuestionError, setCustomQuestionError] = useState<string | null>(null);

  // Launcher state. If the URL already carries builder state (a slug,
  // mode, or selected video) we assume the teacher arrived from an
  // editable URL or a preset and skip the launcher. Otherwise we show
  // the three-option launcher first so they aren't dropped into a
  // 9-step form cold.
  const [launcherShown, setLauncherShown] = useState<boolean>(() => {
    return !(sp.has('slug') || sp.has('mode') || sp.has('v'));
  });

  // Maps a preset choice onto builder defaults, then dismisses the
  // launcher. The current presets don't drive radically different
  // builder shapes yet — they nudge mode and audience. Future
  // refinements (per-preset topic seeding, question-prompt tuning,
  // multi-poem support) layer in here without changing the UX.
  function handlePickPreset(preset: LessonPreset) {
    if (preset === 'memorization') {
      // Basic mode is calibrated for middle school + short outputs —
      // exactly the memorization-friendly shape.
      setMode('basic');
    } else if (preset === 'analysis') {
      setMode('custom');
    } else if (preset === 'two-settings') {
      setMode('custom');
    }
    setLauncherShown(false);
  }

  // ----- Derived -----

  const poem = useMemo(() => POEMS.find((p) => p.slug === slug), [slug]);
  const maxQuestions = 5;
  const lengthOptions = useMemo(() => getLengthOptions(audience), [audience]);

  // ----- Effects -----

  // Fetch AI-generated topic options whenever poem or audience changes. The
  // very first run skips the resets so URL-loaded state is preserved.
  const initialMount = useRef(true);
  useEffect(() => {
    if (!slug || !audience) return;
    let cancelled = false;

    if (!initialMount.current) {
      setEdited([]);
      setGenerationError(null);
      const def = DEFAULT_LENGTH_BY_AUDIENCE[audience] ?? 'paragraph';
      setSelectedLengths([def]);
    }
    initialMount.current = false;

    setTopicsLoading(true);
    setSelectedTopics([]);

    fetchTopicOptions(slug, audience)
      .then((topics) => {
        if (cancelled) return;
        setAvailableTopics(topics);
        setTopicsLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setAvailableTopics([]);
        setTopicsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug, audience]);

  // Auto-save to "My lessons" once questions exist for the active
  // identity. lessons-store dedupes by (poemSlug + videoIds) so
  // editing existing questions updates the same entry instead of
  // piling up duplicates; switching poems or adding a video creates
  // a new entry. No-op when signed out.
  useEffect(() => {
    const identity = getIdentity();
    if (!identity) return;
    if (!slug || picked.length === 0 || edited.length === 0) return;
    saveLesson(identity, {
      poemSlug: slug,
      audience,
      mode,
      videoIds: picked,
      lengths: selectedLengths,
      questions: edited,
    });
  }, [slug, picked, edited, audience, selectedLengths, mode]);

  // ----- Handlers -----

  function chooseDifferentPoem(newSlug: string) {
    setSlug(newSlug);
    setPicked([]);
    setEdited([]);
    setCustomTopics([]);
    setCustomTopicInput('');
  }

  function togglePick(youtubeId: string) {
    setPicked((prev) =>
      prev.includes(youtubeId) ? prev.filter((v) => v !== youtubeId) : [...prev, youtubeId]
    );
    setEdited([]);
  }

  function toggleTopic(t: string) {
    setSelectedTopics((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
    setEdited([]);
  }

  function addCustomTopic() {
    const trimmed = customTopicInput.trim();
    if (!trimmed) return;
    if (customTopics.includes(trimmed) || availableTopics.includes(trimmed)) {
      setCustomTopicInput('');
      return;
    }
    setCustomTopics((prev) => [...prev, trimmed]);
    setSelectedTopics((prev) => [...prev, trimmed]);
    setCustomTopicInput('');
    setEdited([]);
  }

  function removeCustomTopic(t: string) {
    setCustomTopics((prev) => prev.filter((x) => x !== t));
    setSelectedTopics((prev) => prev.filter((x) => x !== t));
    setEdited([]);
  }

  function toggleLength(v: string) {
    setSelectedLengths((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));
    setEdited([]);
  }

  function lengthsAsLabels(values: string[]): string[] {
    return values
      .map((v) => lengthOptions.find((o) => o.value === v)?.label)
      .filter((x): x is string => !!x);
  }

  function handleGenerate() {
    if (!poem || picked.length === 0) return;
    setGenerationError(null);
    startGenerating(async () => {
      try {
        const result = await fetchQuestions({
          slug: poem.slug,
          versionIds: picked,
          audience,
          topics: selectedTopics,
          lengths: lengthsAsLabels(selectedLengths),
          count: questionCount,
        });
        if (result.questions.length === 0) {
          setGenerationError('No questions returned. Try changing topics or audience and retry.');
          setEdited([]);
          return;
        }
        setEdited(result.questions);
      } catch (err) {
        console.error(err);
        setGenerationError(err instanceof Error ? err.message : 'Generation failed. Try again.');
        setEdited([]);
      }
    });
  }

  function handleBasicGenerate() {
    if (!poem || picked.length === 0) return;
    setGenerationError(null);
    const defaultLength = DEFAULT_LENGTH_BY_AUDIENCE[audience] ?? 'paragraph';
    const defaultLengthLabel =
      lengthOptions.find((o) => o.value === defaultLength)?.label ?? 'Paragraph';

    startGenerating(async () => {
      try {
        const result = await fetchQuestions({
          slug: poem.slug,
          versionIds: picked,
          audience,
          topics: [],
          lengths: [defaultLengthLabel],
          count: 3,
        });
        if (result.questions.length === 0) {
          setGenerationError('No questions returned. Try again.');
          return;
        }
        setEdited(result.questions);
        setSelectedLengths([defaultLength]);
        setQuestionCount(3);
        setSelectedTopics([]);
      } catch (err) {
        console.error(err);
        setGenerationError(err instanceof Error ? err.message : 'Generation failed. Try again.');
      }
    });
  }

  function editQuestion(index: number, value: string) {
    setEdited((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  function removeQuestion(index: number) {
    setEdited((prev) => prev.filter((_, i) => i !== index));
  }

  function handleAddCustomQuestion() {
    if (!poem || picked.length === 0) return;
    const instruction = customQuestionInput.trim();
    if (!instruction) return;
    setCustomQuestionError(null);
    startGeneratingCustom(async () => {
      try {
        const result = await fetchSingleQuestion({
          slug: poem.slug,
          versionIds: picked,
          audience,
          existingQuestions: edited,
          instruction,
        });
        if (!result) {
          setCustomQuestionError('Could not generate the question. Try rephrasing the request.');
          return;
        }
        setEdited((prev) => [...prev, result]);
        setCustomQuestionInput('');
      } catch (err) {
        console.error(err);
        setCustomQuestionError(err instanceof Error ? err.message : 'Generation failed.');
      }
    });
  }

  // ----- URL building -----

  const ready = picked.length >= 1 && poem != null && edited.length > 0;

  const queryString = useMemo(() => {
    if (!poem) return '';
    const params = new URLSearchParams();
    picked.forEach((id) => params.append('v', id));
    if (audience) params.set('audience', audience);
    selectedLengths.forEach((l) => params.append('len', l));
    edited.filter((q) => q.trim().length > 0).forEach((q) => params.append('q', q));
    return params.toString();
  }, [poem, picked, audience, edited, selectedLengths]);

  const studentUrl = ready && poem ? `/a/${poem.slug}?${queryString}` : '';
  const editUrl = ready && poem ? `/build?mode=${mode}&slug=${poem.slug}&${queryString}` : '';
  const teacherUrl = ready && poem ? `/t/${poem.slug}?${queryString}` : '';
  const canGenerate = poem != null && picked.length >= 1 && !generating;
  const audienceLabelForLoading =
    audienceLabel(audience) ?? audience;

  // ----- Render -----

  if (launcherShown) {
    return (
      <main className="page">
        <TopNav current="build" />
        <BuildLauncher onPickPreset={handlePickPreset} />
      </main>
    );
  }

  return (
    <main className="page">
      <TopNav current="build" />

      <ModeToggle mode={mode} setMode={setMode} />

      <Step n={1} title="Pick a poem">
        <select
          value={slug}
          onChange={(e) => chooseDifferentPoem(e.target.value)}
          style={selectStyle}
        >
          {POEMS.map((p) => (
            <option key={p.slug} value={p.slug}>
              {p.title} — {p.author}
            </option>
          ))}
        </select>
      </Step>

      {poem && (
        <Step
          n={2}
          title={`Pick musical versions (${picked.length} selected)`}
        >
          <VersionPicker
            versions={poem.versions}
            picked={picked}
            togglePick={togglePick}
            poemTitle={poem.title}
          />
        </Step>
      )}

      <Step n={3} title="Audience">
        {mode === 'basic' ? (
          // Visually matches the select footprint (same font, padding, and
          // bottom rule) so toggling to/from Custom doesn't shift the page.
          <div
            style={{
              ...selectStyle,
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              gap: '1rem',
            }}
          >
            <span>Middle school</span>
            <span className="chrome" style={{ color: 'var(--muted)' }}>
              Locked in Basic mode
            </span>
          </div>
        ) : (
          <select
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            style={selectStyle}
          >
            {AUDIENCES.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>
        )}
      </Step>

      {mode === 'basic' ? (
        <BasicGenerate
          ready={picked.length >= 1 && poem != null}
          generating={generating}
          hasResult={edited.length > 0}
          error={generationError}
          onGenerate={handleBasicGenerate}
          studentUrl={studentUrl}
          teacherUrl={teacherUrl}
        />
      ) : (
        <>
          <Step n={4} title="Topics to address (optional)">
            <TopicPicker
              audienceLabel={audienceLabelForLoading}
              loading={topicsLoading}
              available={availableTopics}
              selected={selectedTopics}
              toggle={toggleTopic}
              customTopics={customTopics}
              customInput={customTopicInput}
              setCustomInput={setCustomTopicInput}
              addCustom={addCustomTopic}
              removeCustom={removeCustomTopic}
            />
          </Step>

          <Step n={5} title="Length of student answers">
            <LengthPicker
              options={lengthOptions}
              selected={selectedLengths}
              toggle={toggleLength}
            />
          </Step>

          <Step n={6} title="How many questions?">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {Array.from({ length: maxQuestions }, (_, i) => i + 1).map((n) => {
                const isSelected = questionCount === n;
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => {
                      setQuestionCount(n);
                      setEdited([]);
                    }}
                    style={{
                      ...chipStyle,
                      background: isSelected ? 'var(--ink)' : 'transparent',
                      color: isSelected ? 'var(--paper)' : 'var(--ink)',
                      borderColor: isSelected ? 'var(--ink)' : 'var(--rule)',
                      minWidth: '2.5rem',
                    }}
                  >
                    {n}
                  </button>
                );
              })}
            </div>
          </Step>

          <Step n={7} title="Generate questions">
            <button
              type="button"
              className="btn"
              onClick={handleGenerate}
              disabled={!canGenerate}
            >
              {generating
                ? 'Generating with Claude Opus 4.7…'
                : edited.length > 0
                  ? 'Regenerate'
                  : 'Generate questions'}
            </button>
            {generationError && (
              <p style={{ color: '#a33', fontSize: '0.875rem', marginTop: '0.75rem' }}>
                {generationError}
              </p>
            )}
            {!canGenerate && !generating && (
              <p style={{ color: 'var(--muted)', fontSize: '0.8125rem', marginTop: '0.75rem' }}>
                Pick at least one musical version above first.
              </p>
            )}
          </Step>

          {edited.length > 0 && (
            <Step n={8} title="Edit the questions">
              <QuestionEditor
                edited={edited}
                editQuestion={editQuestion}
                removeQuestion={removeQuestion}
                customInput={customQuestionInput}
                setCustomInput={setCustomQuestionInput}
                onAddCustom={handleAddCustomQuestion}
                generatingCustom={generatingCustom}
                customError={customQuestionError}
                canAddCustom={picked.length > 0}
              />
            </Step>
          )}

          <section className="hairline" style={{ paddingTop: '1.5rem', marginTop: '2rem' }}>
            {!ready ? (
              <>
                <p className="chrome" style={{ marginBottom: '0.75rem' }}>Shareable URLs</p>
                <p style={{ color: 'var(--muted)', maxWidth: '38rem' }}>
                  Generate questions above to build the shareable URLs.
                </p>
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <UrlBlock
                  label="Share with students"
                  description="Send this to students. They see the poem, the videos, and the questions you finalized — they cannot edit anything."
                  relativeUrl={studentUrl}
                  accent
                />
                <UrlBlock
                  label="Teacher edition"
                  description="A supplementary page for you with poet bio, historical context, a suggested class agenda, and per-question teaching commentary. First load takes ~15s while Claude generates; cached after."
                  relativeUrl={teacherUrl}
                />
                <UrlBlock
                  label="Your editable URL"
                  description="Bookmark this for yourself. Opening it loads everything back into this builder so you can come back later and tweak the assignment."
                  relativeUrl={editUrl}
                />
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}

const selectStyle: React.CSSProperties = {
  fontFamily: 'Georgia, serif',
  fontSize: '1.25rem',
  border: 'none',
  borderBottom: '1px solid var(--rule)',
  background: 'transparent',
  padding: '0.5rem 0',
  width: '100%',
  maxWidth: '38rem',
  color: 'var(--ink)',
};

const chipStyle: React.CSSProperties = {
  padding: '0.5rem 1rem',
  borderRadius: '9999px',
  border: '1px solid',
  fontSize: '0.8125rem',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  cursor: 'pointer',
};
