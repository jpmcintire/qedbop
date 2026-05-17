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
      { label: 'Version 2', youtubeId: 'lAd2Ct6Y1BQ' },
      { label: 'Version 3', youtubeId: 'C7PGMBtRV-o' },
    ],
  },
];

export function getPoem(slug: string): Poem | undefined {
  return POEMS.find((p) => p.slug === slug);
}
