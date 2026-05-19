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

  // Populated at runtime by getPoemEnriched from the PoetAnnotation table.
  // Curated facts the teacher wants the AI to take into account when
  // generating poet bio, historical context, and teacher chat answers.
  // Not present in the static catalog.
  poetSpecialFacts?: string;
};

// Stable slug for a poet, derived from the author name as it appears in
// POEMS. Used as the primary key of PoetAnnotation rows and as the URL
// segment for /admin/poets/[slug].
export function slugifyAuthor(name: string): string {
  return name
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Unique poets from the static catalog, in the order they first appear.
// Each one's displayName is whatever string the poem's `author` field
// uses. Slug is derived consistently via slugifyAuthor.
export function listPoets(): Array<{ slug: string; displayName: string; poemSlugs: string[] }> {
  const order: string[] = [];
  const byName = new Map<string, string[]>();
  for (const poem of POEMS) {
    if (!byName.has(poem.author)) {
      byName.set(poem.author, []);
      order.push(poem.author);
    }
    byName.get(poem.author)!.push(poem.slug);
  }
  return order.map((name) => ({
    slug: slugifyAuthor(name),
    displayName: name,
    poemSlugs: byName.get(name) ?? [],
  }));
}

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
  {
    slug: 'mending-wall',
    title: 'Mending Wall',
    author: 'Robert Frost',
    year: 1914,
    // PASTE: full text of Mending Wall (Project Gutenberg / Poetry Foundation).
    text: ``,
    versions: [
      {
        label: 'Frost reads his own poem',
        youtubeId: 'gOT4NUKBNIU',
        artist: 'Robert Frost (the poet himself)',
        themes: `An author-reading rather than a musical setting. Frost's own delivery makes audible the poem's quiet conversational pacing and the dry irony of its central refrain. Hearing the poet read tilts the interpretive question: is the "Something there is that doesn't love a wall" voice the speaker's, or Frost's own? The pacing of the reading itself becomes a kind of argument about the line breaks, and where Frost slows or doesn't slow tells the listener what he heard in his own meter.`,
        teacherNotes: '',
      },
      {
        label: 'Leonard Nimoy reads it',
        youtubeId: 'rMXB-C2iKpM',
        artist: 'Leonard Nimoy',
        themes: `An actor's reading rather than a musical setting, but one whose interpretive choices function the way a musical arrangement would. Nimoy's measured cadence and resonant lower register make the poem feel more formal and ceremonial than Frost's own conversational delivery — closer to a public address than a private musing. The contrast with Frost's own reading is itself the lesson: the same words, two different arguments about who the speaker is and how seriously to take his observations.`,
        teacherNotes: '',
      },
    ],
    questions: [
      'The poem opens with "Something there is that doesn\'t love a wall" and closes with the neighbor\'s "Good fences make good neighbors." Which line does the poem itself believe?',
      'The speaker repairs the wall every spring even while questioning whether it should exist. What does that contradiction reveal about him?',
      'The neighbor "moves in darkness" — not literal darkness, but a darkness "not of woods only and the shade of trees." What kind of darkness?',
      'Frost gives almost no physical description of either man. Why? What does that choice do to the poem\'s argument?',
      'The wall divides "apple orchard" from "pines." Does the kind of land on each side matter? Why these crops?',
      'Compare two of the recorded readings. Pick one specific moment — a pause, a stress, an inflection — where the readers seem to disagree about what the poem means. Describe what you heard in each and what each implies.',
      'The line "He will not go behind his father\'s saying" appears near the end. Is the speaker condescending? Sympathetic? Both?',
      'New England farmers really did mend stone walls each spring. How does knowing this is a real practice, not a metaphor Frost invented, change the way the poem\'s metaphors land?',
    ],
  },
  {
    slug: 'richard-cory',
    title: 'Richard Cory',
    author: 'Edwin Arlington Robinson',
    year: 1897,
    // PASTE: full text of Richard Cory (Project Gutenberg / Poetry Foundation).
    text: ``,
    versions: [
      {
        label: 'Simon & Garfunkel setting',
        youtubeId: '_vNSWoSWSog',
        artist: 'Simon & Garfunkel',
        genre: 'Folk rock',
        recordingYear: 1966,
        themes: `Paul Simon's 1966 setting repositions Robinson's poem from the point of view of a person who works in Cory's factory. The musical adaptation keeps the original third-person framing in the verses but inserts a recurring refrain — a wish to be in Cory's place — that recasts the poem's irony. Where Robinson's poem lets the final line do all the interpretive work in a single beat of silence, the song's refrain forces the reader to inhabit the envy for several minutes before the ending arrives, so the final turn lands as a comment on the speaker's longing, not just on Cory himself. The folk-rock arrangement gives the verses a working-class register the poem alone doesn't insist on.`,
        teacherNotes: '',
      },
    ],
    questions: [
      'Robinson controls every word of his portrait of Cory until the final line. What does the form of that withholding accomplish that a longer poem could not?',
      'The townspeople call Cory "richer than a king" and "imperially slim." Why royal language for a businessman?',
      'Simon & Garfunkel\'s song adds a refrain that doesn\'t appear in the poem ("Oh, I wish that I could be Richard Cory"). What does the addition change about the poem\'s argument?',
      'The poem describes Cory only from the outside — "he glittered when he walked." What does the speaker NOT know about him, and how is that absence the point?',
      'Listen to the Simon & Garfunkel arrangement. Identify a specific musical choice (tempo, instrumentation, dynamics, vocal delivery) and describe how it changes the way you read the poem\'s ending.',
      'The townspeople\'s narration uses "we" throughout. Who is included in that "we," and who is excluded?',
      'The penultimate stanza ends with the line "And we thought that he was everything / To make us wish that we were in his place." The very next line reverses everything. Is the reversal a twist, or the inevitable consequence of what came before?',
      'Robinson published this in 1897, in the middle of a long American economic depression. How might that context have shaped readers\' response — and does the song\'s 1966 context shift that response again?',
    ],
  },
  {
    slug: 'ozymandias',
    title: 'Ozymandias',
    author: 'Percy Bysshe Shelley',
    year: 1818,
    // PASTE: full text of Ozymandias (Project Gutenberg / Poetry Foundation).
    text: ``,
    versions: [
      {
        label: 'Sung setting',
        youtubeId: '5MlW6QDsH2U',
        themes: `A contemporary musical setting that holds the sonnet's ironic structure intact. Settings of Ozymandias face a basic interpretive choice: amplify the imperial grandeur of the inscribed boast so the surrounding ruin lands harder, or undercut the boast from the start so the irony is audible from the opening lines. This setting tilts toward the former — the music permits the king's voice the weight he claims, then the arrangement opens out into the empty desert behind it. The two-frame structure of the poem (traveler narrating, then king's inscription quoted within) gets musical parallel in the way the texture shifts when the inscription begins.`,
        teacherNotes: '',
      },
      {
        label: 'Lyric video setting',
        youtubeId: 'WhJSZ2SNoeY',
        themes: `A second musical setting available for comparison work. Because the sonnet is so compact and so structurally famous, having more than one setting in the classroom lets students argue about which interpretive emphasis the music should pursue: the inscription's bombast, the traveler's quiet report, the desert's surrounding silence, or the speaker's own framing that holds all three. No single setting can carry every emphasis; the comparison itself becomes the lesson.`,
        teacherNotes: '',
      },
    ],
    questions: [
      'The poem has four narrators stacked inside each other: Shelley, the speaker, the traveler, and the king\'s inscription. What does that nesting accomplish?',
      'The sculptor\'s hand "mocked" the king\'s passions — meaning both imitated and ridiculed. How does that double meaning sit at the center of the poem?',
      'The inscription says "Look on my Works, ye Mighty, and despair!" In context, the despair the visitor feels is not the despair the king intended. Trace the reversal.',
      'The poem is a sonnet, but an unusual one — the rhyme scheme is irregular. Why might Shelley have refused the standard form for this subject?',
      'Compare the two musical settings. Identify a specific moment where one of the settings makes an interpretive choice the other doesn\'t, and describe what each implies about the poem.',
      'Three things outlast the king: the sculptor\'s artistry, the desert sands, and the poem itself. Which of those does the poem seem most interested in?',
      'Shelley wrote this in friendly competition with a friend who wrote a sonnet on the same subject the same week. What does knowing the poem began as a writing exercise change about how you read its solemnity?',
      'The final image is "the lone and level sands stretch far away." Why "level"? What does the flatness do?',
    ],
  },
  {
    slug: 'the-tyger',
    title: 'The Tyger',
    author: 'William Blake',
    year: 1794,
    // PASTE: full text of The Tyger (Project Gutenberg / Poetry Foundation).
    text: ``,
    versions: [
      {
        label: 'Allen Ginsberg sings Blake',
        youtubeId: 'luUCgQ84sO4',
        artist: 'Allen Ginsberg',
        themes: `Ginsberg's pump-organ setting of Blake's lyric is part of a larger project to recover Blake's "songs" as music actually meant to be sung rather than read silently. The setting pushes the poem toward its mystical and prophetic register — Blake as visionary chanter rather than as philosopher. The simple drone underneath, the unornamented vocal line, and the cyclic return to the opening question all emphasize that the poem is a sequence of unanswered theological inquiries, not a set of statements. Hearing it sung makes audible what silent reading often hides: the poem is structured as an incantation, repeating its central question with mounting intensity rather than resolving it.`,
        teacherNotes: '',
      },
      {
        label: 'Tangerine Dream setting',
        youtubeId: '_6UsrgRkOas',
        artist: 'Tangerine Dream',
        genre: 'Electronic / ambient',
        recordingYear: 1987,
        themes: `An electronic, atmospheric setting from Tangerine Dream's 1987 album Tyger, which sets three Blake poems with vocalist Jocelyn B. Smith. Where Ginsberg's reading turns the poem into chant, this setting builds a vast synthesized texture around the lyric so the "fearful symmetry" becomes a sonic phenomenon — the listener experiences the scale of what Blake describes rather than just hearing it described. The female vocal floats above the instrumental wash, treating Blake's lines closer to spell than catechism. The two settings (Ginsberg and Tangerine Dream) are an unusually clean comparison case: same brief lyric, radically different commitments about what the poem IS.`,
        teacherNotes: '',
      },
    ],
    questions: [
      'The poem consists almost entirely of questions and never gives an answer. What kind of inquiry refuses its own conclusion, and what does that refusal do?',
      'Blake pairs this poem with "The Lamb" in his Songs of Innocence and of Experience. How does the existence of that pairing change what The Tyger can mean alone?',
      'The famous line "Did he who made the Lamb make thee?" hangs at the structural center. Is the question rhetorical, or genuinely open?',
      'The poem repeats its opening stanza at the end with one word changed: "Could" becomes "Dare." Track what that single substitution does.',
      'Compare Ginsberg\'s sung setting with Tangerine Dream\'s instrumental-electronic one. Identify a specific musical moment in one of them where the music answers a question the poem itself refuses to answer, and describe what it answered.',
      'Blake illustrated this poem himself in his hand-printed edition. The tiger in his illustration looks oddly meek — almost smiling. How does that mismatch sit?',
      'The poem\'s meter is a strict trochaic tetrameter ("Tyger Tyger, burning bright"). Why this insistent, hammer-on-anvil rhythm for these particular questions?',
      'Hearing the poem sung versus read silently is a real interpretive shift. Which mode do you think Blake intended, and what evidence in the poem supports your view?',
    ],
  },
  {
    slug: 'the-raven',
    title: 'The Raven',
    author: 'Edgar Allan Poe',
    year: 1845,
    // PASTE: full text of The Raven (Project Gutenberg / Poetry Foundation).
    text: ``,
    versions: [
      {
        label: 'Alan Parsons Project setting',
        youtubeId: '_oOBt4L9ky4',
        artist: 'The Alan Parsons Project',
        genre: 'Progressive rock',
        recordingYear: 1976,
        themes: `From the 1976 album Tales of Mystery and Imagination, an album-length progressive-rock interpretation of Poe. The setting layers spoken intro (originally Orson Welles), choral vocals, and synthesized instrumentation; the refrain "Nevermore" becomes a choral motif that arrives like an external chorus of accusations rather than a single bird's reply. The musical arrangement organizes the poem's eighteen stanzas into a longer-arc shape, moving across sections that group the early stanzas (curiosity, mild dread), the middle (escalating exchange), and the closing stanzas (settled resignation). The setting compresses Poe's incremental movement into a few clear musical pivots, so the moment of recognition lands more decisively than the poem alone allows.`,
        teacherNotes: '',
      },
    ],
    questions: [
      'The poem repeats "Nevermore" as the bird\'s only word, but the meaning shifts with each repetition. Track three repetitions and describe how each one means something different.',
      'The speaker invents an entire conversation with a bird who only ever says one word. What does that one-sided exchange reveal about the speaker, independent of what the bird represents?',
      'Poe wrote an essay (The Philosophy of Composition) claiming he calculated every effect in this poem mathematically before writing a word. Do you believe him? What in the poem feels calculated and what feels intuitive?',
      'The trochaic octameter ("Once upon a midnight dreary, while I pondered, weak and weary") is unusual in English. Why this specific propulsive meter for this subject?',
      'Compare the Alan Parsons Project setting to the poem read silently. Identify one musical choice (a vocal entry, an instrumental shift, a textural change) and describe how it reframes a passage that reads differently on the page.',
      'The bird perches on a bust of Pallas (Athena, goddess of wisdom). Why that particular bust? What would change if it perched somewhere else?',
      'Lost-love poems were a Victorian commonplace. What does Poe do that takes the poem somewhere a generic lost-love poem doesn\'t go?',
      'Poe became famous on the strength of this single poem. Why this one — what about its specific construction made it portable enough to travel?',
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
