import 'server-only';
import type { PodcastScript } from './podcast-script';

// OpenAI Text-to-Speech for the personalized prep podcast. Each script
// line is synthesized as one HTTP call with the speaker's voice, then
// the resulting MP3 buffers are byte-concatenated. MP3 supports frame-
// level concatenation, so a simple Buffer.concat() of well-formed MP3
// payloads is playable end-to-end (the seams aren't gapless, but for
// a podcast that's imperceptible).
//
// Model: tts-1-hd-1106 — the high-fidelity legacy TTS model. We'd
// prefer gpt-4o-mini-tts (cheaper, honors per-line tone "instructions"
// for dramatic delivery, ships warmer voices like ballad / marin),
// but the OpenAI project tied to OPENAI_API_KEY doesn't have access
// to it; only the tts-1-hd family is enabled. tts-1-hd ignores the
// `instructions` param so we don't send it.
//
// Voice strategy: the pool is fable + nova — fable is the most
// expressive male voice in the legacy set (British-leaning, theatrical),
// nova the warmest female. Each podcast generation shuffles them and
// assigns Host A / Host B, so the host-to-voice mapping varies even
// though both voices are always used. Cache keys are per-lesson, so a
// given lesson keeps its initial assignment on re-listens; only newly
// generated podcasts roll the dice.
//
// Pricing: tts-1-hd is ~$30 / 1M input characters (~$0.30 per 10k chars).
// A 10-minute podcast lands around ~$0.30. Higher than gpt-4o-mini-tts
// (~$0.07) but the only option until the project's model access is
// widened.

const VOICE_POOL = ['fable', 'nova'] as const;
const MODEL = 'tts-1-hd-1106';

const OPENAI_TTS_URL = 'https://api.openai.com/v1/audio/speech';
// Hard cap per line; OpenAI's per-request limit is 4096 chars, well above
// realistic dialogue turn lengths. Anything longer suggests a malformed
// script and we'd rather throw than send.
const PER_LINE_CHAR_LIMIT = 4000;

export type SynthResult = {
  buffer: Buffer;
  totalChars: number;
  voices: { A: string; B: string };
};

// Returns two distinct voices from the pool, randomly. The shuffle is
// per-call, so each podcast generation gets its own pair.
function pickVoicePair(): { A: string; B: string } {
  const shuffled = [...VOICE_POOL].sort(() => Math.random() - 0.5);
  return { A: shuffled[0], B: shuffled[1] };
}

export async function synthesizePodcastMp3(script: PodcastScript): Promise<SynthResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not set');

  const voices = pickVoicePair();

  // Synthesize each line in parallel. OpenAI's TTS rate limits are
  // generous enough for ~100-200 short calls; if we ever hit throttling
  // we can add a concurrency limiter, but a dialogue script's lines are
  // independent so parallelism is the natural shape.
  const chunks = await Promise.all(
    script.lines.map((line, i) => synthLine(apiKey, line.text, voices[line.speaker], i))
  );

  const totalChars = script.lines.reduce((s, l) => s + l.text.length, 0);
  return { buffer: Buffer.concat(chunks), totalChars, voices };
}

async function synthLine(
  apiKey: string,
  text: string,
  voice: string,
  index: number
): Promise<Buffer> {
  if (text.length > PER_LINE_CHAR_LIMIT) {
    throw new Error(`Script line ${index} is ${text.length} chars (limit ${PER_LINE_CHAR_LIMIT}).`);
  }

  const res = await fetch(OPENAI_TTS_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      voice,
      input: text,
      response_format: 'mp3',
    }),
    cache: 'no-store',
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`OpenAI TTS line ${index} failed (${res.status}): ${body.slice(0, 200)}`);
  }

  const arrayBuf = await res.arrayBuffer();
  return Buffer.from(arrayBuf);
}

// Per-podcast cost estimate for tts-1-hd. Bills per input character
// at ~$30 / 1M chars. ~10,000 input chars → ~10 min audio → ~$0.30.
// Informational only.
export function estimateTtsCostUsd(totalChars: number): number {
  return (totalChars * 30) / 1_000_000;
}
