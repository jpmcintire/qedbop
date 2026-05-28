import 'server-only';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// Upload helper for the media R2 bucket. Reads its own env vars rather
// than reusing the backup token, so the credential scope stays compart-
// mentalized: the backup token can only touch the backups bucket, the
// media token can only touch the media bucket.

function client(): S3Client {
  const endpoint = process.env.R2_ENDPOINT;
  const accessKeyId = process.env.R2_MEDIA_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_MEDIA_SECRET_ACCESS_KEY;
  if (!endpoint) throw new Error('R2_ENDPOINT not set');
  if (!accessKeyId || !secretAccessKey) {
    throw new Error('R2_MEDIA_ACCESS_KEY_ID / R2_MEDIA_SECRET_ACCESS_KEY not set');
  }
  return new S3Client({
    region: 'auto',
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  });
}

function bucket(): string {
  const b = process.env.R2_MEDIA_BUCKET;
  if (!b) throw new Error('R2_MEDIA_BUCKET not set');
  return b;
}

function publicBase(): string {
  // R2 bucket public URL (set up once on the bucket as a custom domain or
  // managed r2.dev domain). Falls back to None — the caller can decide
  // how to serve. For privacy/control we'll use a custom domain in
  // production; for now we accept whatever the user configures.
  return process.env.R2_MEDIA_PUBLIC_BASE ?? '';
}

export async function uploadMedia(args: {
  key: string;             // e.g. "prep-podcasts/qedbop-recuerdo-high-school-XXXX.mp3"
  body: Buffer;
  contentType: string;     // e.g. "audio/mpeg"
}): Promise<{ key: string; url: string }> {
  const cmd = new PutObjectCommand({
    Bucket: bucket(),
    Key: args.key,
    Body: args.body,
    ContentType: args.contentType,
    CacheControl: 'public, max-age=31536000, immutable',
  });
  await client().send(cmd);

  const base = publicBase().replace(/\/$/, '');
  const url = base ? `${base}/${args.key}` : `r2://${bucket()}/${args.key}`;
  return { key: args.key, url };
}
