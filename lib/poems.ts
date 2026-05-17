export type Version = {
  label: string;
  youtubeId: string;
};

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
      { label: 'Version 1', youtubeId: 'lAd2Ct6Y1BQ' },
      { label: 'Version 2', youtubeId: 'C7PGMBtRV-o' },
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
      { label: 'Version 1', youtubeId: '2t7rQtX6zjk' },
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
  { value: 'self-education', label: 'Self-education' },
] as const;

export type AudienceValue = (typeof AUDIENCES)[number]['value'];

export function audienceLabel(value: string | undefined): string | undefined {
  return AUDIENCES.find((a) => a.value === value)?.label;
}
