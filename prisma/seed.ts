import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Idempotent: skip if any Work exists. To re-seed, truncate first.
  const existing = await prisma.work.count();
  if (existing > 0) {
    console.log(`Seed: ${existing} works already present, skipping.`);
    return;
  }

  const frost = await prisma.work.create({
    data: {
      title: 'Stopping by Woods on a Snowy Evening',
      author: 'Robert Frost',
      type: 'POEM',
      publicationYear: 1923,
      copyrightStatus: 'PUBLIC_DOMAIN',
      gradeBands: ['9-10', '11-12'],
      themes: ['duty', 'solitude', 'the pull of beauty', 'mortality'],
      notes: null,
      fullText: `Whose woods these are I think I know.
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
    },
  });

  await prisma.version.create({
    data: {
      workId: frost.id,
      label: 'Folk Setting — Acoustic Guitar',
      youtubeId: '2t7rQtX6zjk',
      youtubeStatus: 'PUBLIC',
      durationSeconds: null,
      musicDescription: 'Spare acoustic setting; voice and finger-picked guitar.',
      chorusPhrases: 'The repeated final line ("And miles to go before I sleep") is held as the refrain — the music lets the second repetition fall into a hush rather than swell.',
      vocalCharacter: 'Plain-spoken baritone, restrained throughout.',
      isRecommended: true,
      musicTextThemes: `This setting argues that Frost's poem is, despite its smooth surface, an exercise in restraint. The arrangement matches the speaker's deliberate refusal to dramatize the pull toward the woods: there is no swell, no climactic moment. The music chooses dailiness over revelation. The choice to let the refrain decay rather than crescendo reinforces a reading of the poem as quietly elegiac — not "about death" in the loud sense, but aware of the proximity of stopping.

The acoustic palette places the song in a folk-American tradition that carries its own weight: this is the music of laborers, journeymen, plain speech. The setting suggests Frost's speaker is one of these people — a working person with promises to keep, not a romantic figure beholding the sublime.`,
      musicTextTeacherOnly: `(Placeholder. As you watch this version, fill this field with specific moments — for example:
- At 0:00, the guitar begins on a single bass note, leaving space for the first line.
- Around 1:30, the finger-picking pattern thins out on "the only other sound's the sweep" — the music mimics the listening.
- The final "miles to go before I sleep" drops in dynamic rather than rising; the singer almost whispers it.

These specifics power the coaching podcast and listening guide. NEVER paste them into musicTextThemes — they belong here, where Claude cannot see them.)`,
      musicTextDepth: 4,
      comparativeValue: 3,
      emotionalImpact: 4,
      accessibility: 5,
      discussionPotential: 4,
    },
  });

  console.log(`Seed: created Work "${frost.title}" with one Version.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
