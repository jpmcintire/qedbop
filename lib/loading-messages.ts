// Loading messages displayed while qed'bop generates content. Per-poem
// playful messages cycle first; a brand closer always settles last.
//
// Per-poem messages live on the Poem record (lib/poems.ts), so adding a
// new poem can ship a new set of inside-joke loading lines without
// touching anything else. Falls back to a generic poetry pool for poems
// that haven't been given a custom list yet.

const GENERIC_MESSAGES: string[] = [
  'Listening carefully…',
  'Hearing the meter…',
  'Reading between the lines…',
  'Counting syllables…',
  'Consulting the muses…',
  'Finding the right key…',
  'Tuning the questions…',
  'Weighing each word…',
  'Scanning the stanzas…',
];

// The brand closer. Always shown as the final, settled message after
// the playful ones have cycled past.
export const LOADING_CLOSER = 'The proof is in the song.';

// Build the ordered list of messages for a single load. Shuffles the
// playful messages so consecutive loads of the same poem feel different,
// then appends the closer.
export function buildLoadingMessages(poem?: { loadingMessages?: string[] } | null): string[] {
  const pool = poem?.loadingMessages?.length ? poem.loadingMessages : GENERIC_MESSAGES;
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return [...shuffled, LOADING_CLOSER];
}
