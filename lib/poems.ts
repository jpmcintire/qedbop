export type Version = {
  label: string;
  youtubeId: string;

  // ---- Objective metadata (safe to share with Claude for any output) ----
  durationSeconds?: number;
  genre?: string;
  vocalCharacter?: string;
  artist?: string;
  recordingYear?: number;

  // ---- Interpretive themes (no timestamps, no specific moments) ----
  // Broader notes about what the music ARGUES about the poem: what the
  // arrangement emphasizes, what tradition the genre carries, how the
  // setting reframes the poem. Safe to feed Claude when generating
  // STUDENT-FACING content.
  themes?: string;

  // ---- Teacher-only annotations (may include timestamps) ----
  // Specific timestamped observations: "at 2:35, the modulation lands
  // under 'we hailed, good morrow'", etc. NEVER fed to Claude when
  // generating content that students will see (questions on /a/, etc.).
  // ONLY used in teacher-edition page generation and teacher Q&A chat.
  // This is the product's moat — students must identify specific
  // moments themselves; we never reveal them in question prompts.
  teacherNotes?: string;
};

// Builds a prompt block describing a version. Two modes:
//   - 'safe': returns only objective metadata + interpretive themes.
//     Use this when generating content that ends up on the student page.
//   - 'full': adds the teacher-only timestamped notes. Use this only
//     for teacher-edition output and teacher Q&A chat.
export function versionPromptBlock(v: Version, mode: 'safe' | 'full'): string {
  const lines: string[] = [`Label: ${v.label}`];
  if (v.genre) lines.push(`Genre: ${v.genre}`);
  if (v.vocalCharacter) lines.push(`Vocal: ${v.vocalCharacter}`);
  if (v.artist) lines.push(`Artist: ${v.artist}`);
  if (v.recordingYear) lines.push(`Recording year: ${v.recordingYear}`);
  if (v.durationSeconds) {
    const min = Math.floor(v.durationSeconds / 60);
    const sec = v.durationSeconds % 60;
    lines.push(`Duration: ${min}:${String(sec).padStart(2, '0')}`);
  }
  if (v.themes && v.themes.trim()) {
    lines.push(`Interpretive themes (safe to reference; no specific moments):\n${v.themes.trim()}`);
  }
  if (mode === 'full' && v.teacherNotes && v.teacherNotes.trim()) {
    lines.push(
      `Teacher-only specific observations (you MAY reference these in teacher-facing output, but never in student-facing output like discussion questions):\n${v.teacherNotes.trim()}`
    );
  }
  return lines.join('\n');
}

export type Poem = {
  slug: string;
  title: string;
  author: string;
  year: number;
  text: string;
  versions: Version[];
  // Reasonable starter discussion questions, ordered roughly from concrete
  // to interpretive. The viewer URL specifies how many to render (?q=N),
  // which slices from the top. Edit freely; no schema, no migration.
  questions: string[];
};

export const POEMS: Poem[] = [
  {
    slug: 'recuerdo',
    title: 'Recuerdo',
    author: 'Edna St. Vincent Millay',
    year: 1919,
    text: `We were very tired, we were very merry—
We had gone back and forth all night on the ferry.
It was bare and bright, and smelled like a stable—
But we looked into a fire, we leaned across a table,
We lay on a hill-top underneath the moon;
And the whistles kept blowing, and the dawn came soon.

We were very tired, we were very merry—
We had gone back and forth all night on the ferry;
And you ate an apple, and I ate a pear,
From a dozen of each we had bought somewhere;
And the sky went wan, and the wind came cold,
And the sun rose dropping, a bucketful of gold.

We were very tired, we were very merry,
We had gone back and forth all night on the ferry.
We hailed, "Good morrow, mother!" to a shawl-covered head,
And bought a morning paper, which neither of us read;
And she wept, "God bless you!" for the apples and pears,
And we gave her all our money but our subway fares.`,
    versions: [
      {
        label: 'Version 1',
        youtubeId: 'lAd2Ct6Y1BQ',
        // TODO: fill in once viewed
        // durationSeconds: ___,
        // genre: '___',
        // vocalCharacter: '___',
        // artist: '___',
        // recordingYear: ___,
        themes: `This setting treats the poem as an exuberant young-adult song — the music leans into the "very merry" half of the refrain rather than the "very tired" half. The arrangement carries forward the poem's modernist sensibility: Greenwich Village in 1919 as a place where two friends (lovers? collaborators?) could ride the ferry all night without explanation, and the music doesn't try to explain it either. The cyclical structure of the song echoes the three-stanza repetition of "We were very tired, we were very merry" — each return slightly altered, the way the original phrase shifts in meaning across the poem. The encounter with the shawl-covered woman in the third stanza arrives as a turn, not a climax; the music shapes it as a moral pivot rather than a swell.`,
        // teacherNotes: see /admin once we build it; for now edit lib/poems.ts directly
        teacherNotes: '',
      },
      {
        label: 'Version 2',
        youtubeId: 'C7PGMBtRV-o',
        // TODO: fill in once viewed
        // durationSeconds: ___,
        // genre: '___',
        // vocalCharacter: '___',
        // artist: '___',
        // recordingYear: ___,
        themes: `This setting argues that the poem is less about youthful joy than about the strange melancholy of staying up all night — the music finds the loneliness inside the merriment. The third-stanza encounter with the woman selling fruit is the song's emotional center: the speakers' generosity is presented not as triumphant charity but as an unsteady, impulsive gesture by two people whose own footing is uncertain. The arrangement makes audible the class distance the poem only glances at: the lilting refrain belongs to the speakers' world, but the encounter forces a different register in. The repeated "very tired, very merry" feels less like a refrain and more like a thing the speakers are convincing themselves of.`,
        teacherNotes: '',
      },
    ],
    questions: [
      'The phrase "We were very tired, we were very merry" repeats three times. How does its meaning shift across the three stanzas?',
      'What is the relationship between the speaker and the person they\'re with? What clues in the poem support your reading?',
      'The speakers give away "all our money but our subway fares" to a stranger. What does this exchange reveal about their state of mind, and about the woman they meet?',
      'Listen for the moment in each musical setting where the mood turns. Does the music locate that moment in the same place the poem does? If not, where does the music put it?',
      'The poem mentions a "shawl-covered head" and a "morning paper" — what social class divisions are implied? How does the encounter complicate the poem\'s joy?',
      'Where does the night end and the day begin in this poem? Identify a specific image that marks the transition.',
      'Millay published this in 1919, when she was 27 and living in Greenwich Village. How might knowing that change your reading?',
      'Choose one of the two musical settings and describe a specific moment — a tempo change, an instrumentation shift, a vocal choice — that argues for a particular interpretation of the poem.',
    ],
  },
  {
    slug: 'stopping-by-woods',
    title: 'Stopping by Woods on a Snowy Evening',
    author: 'Robert Frost',
    year: 1923,
    text: `Whose woods these are I think I know.
His house is in the village though;
He will not see me stopping here
To watch his woods fill up with snow.

My little horse must think it queer
To stop without a farmhouse near
Between the woods and frozen lake
The darkest evening of the year.

He gives his harness bells a shake
To ask if there is some mistake.
The only other sound's the sweep
Of easy wind and downy flake.

The woods are lovely, dark and deep,
But I have promises to keep,
And miles to go before I sleep,
And miles to go before I sleep.`,
    versions: [
      {
        label: 'Version 1',
        youtubeId: '2t7rQtX6zjk',
        // TODO: fill in once viewed
        // durationSeconds: ___,
        // genre: '___',
        // vocalCharacter: '___',
        // artist: '___',
        // recordingYear: ___,
        themes: `The poem's surface is so smooth it has fooled generations of readers into mistaking it for a postcard. A musical setting has to decide whether to reinforce that smoothness or rough it up. This setting honors the poem's restraint: it does not try to dramatize the speaker's hesitation at the woods' edge into something operatic. Instead, the arrangement is built around the doubled final line — "And miles to go before I sleep, / And miles to go before I sleep" — which Frost famously refused to gloss. The setting lets the repetition do its own work. The interlocking aaba-bbcb-ccdc-dddd rhyme scheme that Frost said he had never seen and never tried again creates a sense of forward motion that the music either rides or stalls; either choice is an interpretive argument about the poem.`,
        teacherNotes: '',
      },
    ],
    questions: [
      'Why does the speaker stop? The poem does not say directly — what attracts him?',
      'The horse "must think it queer / To stop without a farmhouse near." What does the horse\'s perspective reveal about the speaker?',
      'The closing line repeats: "And miles to go before I sleep, / And miles to go before I sleep." Why the repetition? Does the meaning change between the two iterations?',
      'The woods are described as "lovely, dark and deep." Three adjectives, deliberately ordered. How do they work together, and what mood do they create?',
      'The speaker has "promises to keep" but never says to whom. Does that omission matter?',
      'What is "the darkest evening of the year"? What does that specificity add?',
      'Listen for where the music gets quietest. Does that moment correspond to the most ambiguous line in the poem?',
      'Frost called this poem "my best bid for remembrance." What about it might endure?',
    ],
  },
];

export function getPoem(slug: string): Poem | undefined {
  return POEMS.find((p) => p.slug === slug);
}

export const AUDIENCES = [
  { value: 'middle-school', label: 'Middle school' },
  { value: 'high-school', label: 'High school' },
  { value: 'college', label: 'College' },
  { value: 'post-graduate', label: 'Post-graduate' },
] as const;

export type AudienceValue = (typeof AUDIENCES)[number]['value'];

export function audienceLabel(value: string | undefined): string | undefined {
  return AUDIENCES.find((a) => a.value === value)?.label;
}

// Response length options. The list varies by audience — middle schoolers
// don't get "research paper", post-grads don't get "1-2 sentences" — and the
// chosen value(s) are fed to the question generator so it can calibrate
// question complexity.
export type LengthOption = { value: string; label: string };

export const LENGTHS_BY_AUDIENCE: Record<string, LengthOption[]> = {
  'middle-school': [
    { value: 'sentence', label: '1–2 sentences' },
    { value: 'short-paragraph', label: 'Short paragraph (3–5 sentences)' },
    { value: 'paragraph', label: 'Paragraph' },
  ],
  'high-school': [
    { value: 'sentence', label: '1–2 sentences' },
    { value: 'short-paragraph', label: 'Short paragraph' },
    { value: 'paragraph', label: 'Paragraph' },
    { value: 'short-essay', label: 'Short essay (3–4 paragraphs)' },
  ],
  'college': [
    { value: 'paragraph', label: 'Paragraph' },
    { value: 'short-essay', label: 'Short essay (3–4 paragraphs)' },
    { value: 'essay', label: 'Essay (~750 words)' },
    { value: 'long-essay', label: 'Long essay (~1500 words)' },
  ],
  'post-graduate': [
    { value: 'short-essay', label: 'Short essay' },
    { value: 'essay', label: 'Essay (~750 words)' },
    { value: 'long-essay', label: 'Long essay (~1500 words)' },
    { value: 'research-paper', label: 'Research paper (3000+ words)' },
  ],
};

// Sensible default when an audience is first picked (or in Quick mode).
export const DEFAULT_LENGTH_BY_AUDIENCE: Record<string, string> = {
  'middle-school': 'short-paragraph',
  'high-school': 'paragraph',
  'college': 'short-essay',
  'post-graduate': 'essay',
};

export function getLengthOptions(audience: string): LengthOption[] {
  return LENGTHS_BY_AUDIENCE[audience] ?? LENGTHS_BY_AUDIENCE['high-school'];
}

export function lengthLabel(audience: string, value: string): string | undefined {
  return getLengthOptions(audience).find((l) => l.value === value)?.label;
}
