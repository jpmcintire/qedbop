import { POEMS, AUDIENCES, type AudienceValue } from './poems';

// Three pre-built showcase lessons for the front page. Each one is a
// concrete (poem, audience, modes) configuration that demos a different
// slice of qed’bop. Edit this list to change which lessons headline
// the site — the front page, launch page, and URL building all derive
// from these entries.
//
// A lesson can support one or both modes:
//   - 'in-class'  : shorter, focused, designed for a single class period
//                   (fewer questions, short-paragraph length).
//   - 'at-home'   : longer, deeper, self-directed
//                   (more questions, essay length).

export type ShowcaseMode = 'in-class' | 'at-home';

export type ShowcaseLesson = {
  // URL slug used for /showcase/[key]; usually the poem slug, but a
  // separate key lets the same poem appear twice with different
  // audiences in the future.
  key: string;
  poemSlug: string;
  audience: AudienceValue;
  modes: ShowcaseMode[];
  // Optional: pick specific videos. Defaults to the poem's first 1-2
  // versions in catalog order.
  versionIds?: string[];
  // Short pitch shown under the card title.
  blurb: string;
};

export const SHOWCASE_LESSONS: ShowcaseLesson[] = [
  {
    key: 'stopping-by-woods',
    poemSlug: 'stopping-by-woods',
    audience: 'middle-school',
    modes: ['in-class'],
    blurb:
      'A short, sensory poem that rewards close listening. One musical setting, one class period — perfect for an in-class introduction to how music can reshape a poem.',
  },
  {
    key: 'recuerdo',
    poemSlug: 'recuerdo',
    audience: 'high-school',
    modes: ['in-class', 'at-home'],
    blurb:
      'Two musical settings argue different things about Millay&rsquo;s late-night ferry poem. Use one in class for a quick comparison, or assign both at home for a deeper interpretive piece.',
  },
  {
    key: 'ozymandias',
    poemSlug: 'ozymandias',
    audience: 'college',
    modes: ['at-home'],
    blurb:
      'A compact sonnet with a long interpretive shadow. Assigned at home, with longer-form questions about empire, art, and the work the music does to undercut the inscription.',
  },
];

// Question count + length value per mode. Conservative defaults the
// builder also produces; tweak here to globally change "what an
// in-class assignment feels like."
export const MODE_DEFAULTS: Record<ShowcaseMode, { questionCount: number; length: string }> = {
  'in-class': { questionCount: 3, length: 'short-paragraph' },
  'at-home': { questionCount: 5, length: 'short-essay' },
};

export function getShowcase(key: string): ShowcaseLesson | undefined {
  return SHOWCASE_LESSONS.find((s) => s.key === key);
}

export type BuiltUrls = {
  studentUrls: Partial<Record<ShowcaseMode, string>>;
  teacherUrl: string;
  videoIds: string[];
};

// Builds the actual URLs for a showcase lesson. Reads the poem's
// catalog questions and slices to the mode's count; uses the poem's
// first 1-2 video ids unless versionIds is explicitly set on the
// showcase entry.
export function buildShowcaseUrls(lesson: ShowcaseLesson): BuiltUrls {
  const poem = POEMS.find((p) => p.slug === lesson.poemSlug);
  if (!poem) return { studentUrls: {}, teacherUrl: '', videoIds: [] };

  const videoIds =
    lesson.versionIds && lesson.versionIds.length > 0
      ? lesson.versionIds
      : poem.versions.slice(0, 2).map((v) => v.youtubeId);

  const studentUrls: Partial<Record<ShowcaseMode, string>> = {};
  for (const mode of lesson.modes) {
    const { questionCount, length } = MODE_DEFAULTS[mode];
    const qs = poem.questions.slice(0, questionCount);
    const params = new URLSearchParams();
    for (const v of videoIds) params.append('v', v);
    params.set('audience', lesson.audience);
    params.append('len', length);
    for (const q of qs) params.append('q', q);
    studentUrls[mode] = `/a/${poem.slug}?${params.toString()}`;
  }

  // Teacher edition uses the at-home configuration if present (the
  // longer one — more material to comment on); otherwise in-class.
  const teacherMode = lesson.modes.includes('at-home') ? 'at-home' : 'in-class';
  const { questionCount: tcount, length: tlen } = MODE_DEFAULTS[teacherMode];
  const tqs = poem.questions.slice(0, tcount);
  const teacherParams = new URLSearchParams();
  for (const v of videoIds) teacherParams.append('v', v);
  teacherParams.set('audience', lesson.audience);
  teacherParams.append('len', tlen);
  for (const q of tqs) teacherParams.append('q', q);
  const teacherUrl = `/t/${poem.slug}?${teacherParams.toString()}`;

  return { studentUrls, teacherUrl, videoIds };
}

export function audienceTierLabel(audience: AudienceValue): string {
  return AUDIENCES.find((a) => a.value === audience)?.label ?? audience;
}

export function modeLabel(mode: ShowcaseMode): string {
  return mode === 'in-class' ? 'In class' : 'At home';
}

export function modeDescription(mode: ShowcaseMode): string {
  return mode === 'in-class'
    ? 'Short, focused — one class period. Fewer questions, brief written responses.'
    : 'Longer-form, self-directed. More questions, essay-length responses.';
}
