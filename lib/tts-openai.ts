import 'server-only';
import type { PodcastScript } from './podcast-script';

// OpenAI Text-to-Speech for the personalized prep podcast. Each script
// line is synthesized as one HTTP call with the speaker's voice, then
// the resulting MP3 buffers are byte-concatenated. MP3 supports frame-
// level concatenation, so a simple Buffer.concat() of well-formed MP3
// payloads is playable end-to-end (the seams aren't gapless, but for
// a podcast that's imperceptible).
//
// Voice assignment:
//   HOST_A → 'nova'  (warmer, female-presenting, conversational)
//   HOST_B → 'onyx'  (deeper, male-presenting, analytical)
//
// Pricing (tts-1): roughly $0.000015 / character. A ~1800-word podcast
// (~10,000 characters) runs ~$0.15. tts-1-hd is higher quality at 2x
// price; tts-1 is the right default for v1.

const VOICES = { A: 'nova', B: 'onyx' } as const;
const MODEL = 'tts-1'; // upgrade to 'tts-1-hd' if quality needs the bump

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

// Per-podcast cost estimate at current OpenAI tts-1 pricing
// ($15 / 1M characters as of 2026-05). Returned as USD; used to log to
// ApiUsage so /admin/usage sees podcast spend alongside Claude spend.
export function estimateTtsCostUsd(totalChars: number): number {
  return (totalChars * 15) / 1_000_000;
}
