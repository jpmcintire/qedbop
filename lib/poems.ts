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
  },
];

export function getPoem(slug: string): Poem | undefined {
  return POEMS.find((p) => p.slug === slug);
}
