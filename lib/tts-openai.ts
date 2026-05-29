import 'server-only';
import type { PodcastScript } from './podcast-script';

// OpenAI Text-to-Speech for the personalized prep podcast. Each script
// line is synthesized as one HTTP call with the speaker's voice, then
// the resulting MP3 buffers are byte-concatenated. MP3 supports frame-
// level concatenation, so a simple Buffer.concat() of well-formed MP3
// payloads is playable end-to-end (the seams aren't gapless, but for
// a podcast that's imperceptible).
//
// Voice assignment (gpt-4o-mini-tts):
//   HOST_A → 'marin'  (clearer, brighter — the warmer "asks the
//                      leading questions" voice)
//   HOST_B → 'cedar'  (deeper, warmer — the analytical "explains the
//                      moves" voice)
// To try a different pair, swap to 'verse' here — 'cedar', 'marin',
// and 'verse' are the three dramatic voices we standardized on.
//
// INSTRUCTIONS prompt the model to deliver lines with a specific tone.
// gpt-4o-mini-tts is the only OpenAI TTS that respects this parameter
// (the older tts-1 family ignores it). We use it to lock in a
// theatrical, audiobook-style delivery rather than the default flat
// newscaster reading.
//
// Pricing (gpt-4o-mini-tts): billed per audio output token, roughly
// $12 / 1M output tokens, where ~600 tokens ≈ 1 minute of audio. A
// 10-minute podcast lands around $0.07 — substantially cheaper than
// tts-1-hd ($0.30), with notably better voices.

const VOICES = { A: 'marin', B: 'cedar' } as const;
const MODEL = 'gpt-4o-mini-tts';
const INSTRUCTIONS =
  'Read with a dramatic, theatrical delivery. Vary pace and pitch with the meaning of each line, lean into emotionally charged phrases, and use pauses for emphasis. This is a teacher-prep podcast — two informed colleagues talking shop — so the tone is alive and committed, not lecturing.';

const OPENAI_TTS_URL = 'https://api.openai.com/v1/audio/speech';
// Hard cap per line; OpenAI's per-request limit is 4096 chars, well above
// realistic dialogue turn lengths. Anything longer suggests a malformed
// script and we'd rather throw than send.
const PER_LINE_CHAR_LIMIT = 4000;

export type SynthResult = {
  buffer: Buffer;
  totalChars: number;
};

export async function synthesizePodcastMp3(script: PodcastScript): Promise<SynthResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not set');

  // Synthesize each line in parallel. OpenAI's TTS rate limits are
  // generous enough for ~100-200 short calls; if we ever hit throttling
  // we can add a concurrency limiter, but a dialogue script's lines are
  // independent so parallelism is the natural shape.
  const chunks = await Promise.all(
    script.lines.map((line, i) => synthLine(apiKey, line.text, VOICES[line.speaker], i))
  );

  const totalChars = script.lines.reduce((s, l) => s + l.text.length, 0);
  return { buffer: Buffer.concat(chunks), totalChars };
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
      instructions: INSTRUCTIONS,
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

// Per-podcast cost estimate for gpt-4o-mini-tts. The model bills per
// audio output token (~$12 / 1M output tokens, ~600 tokens per minute
// of audio), but we don't have the token count at synth time so we
// approximate from the input character count: ~10,000 input chars
// produces ~10 minutes of audio ≈ 6,000 output tokens ≈ $0.07. Used
// for informational logging only.
export function estimateTtsCostUsd(totalChars: number): number {
  return (totalChars * 7) / 1_000_000;
}
