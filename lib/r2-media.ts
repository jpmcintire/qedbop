import 'server-only';
import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
} from '@aws-sdk/client-s3';

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

// Delete every object under a given key prefix. R2's DeleteObjects API
// accepts up to 1000 keys per call, so we paginate the list and chunk
// the deletes. Returns the total number of objects removed. Used by
// the admin "wipe prep podcasts" action when we want to invalidate
// every cached MP3 (e.g. after a voice or script change).
export async function deleteMediaPrefix(prefix: string): Promise<number> {
  const c = client();
  const b = bucket();
  let removed = 0;
  let continuationToken: string | undefined;

  do {
    const listed = await c.send(
      new ListObjectsV2Command({
        Bucket: b,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      })
    );
    const keys = (listed.Contents ?? [])
      .map((o) => o.Key)
      .filter((k): k is string => !!k);
    if (keys.length > 0) {
      // DeleteObjects accepts up to 1000 keys per call.
      for (let i = 0; i < keys.length; i += 1000) {
        const slice = keys.slice(i, i + 1000);
        await c.send(
          new DeleteObjectsCommand({
            Bucket: b,
            Delete: { Objects: slice.map((Key) => ({ Key })), Quiet: true },
          })
        );
        removed += slice.length;
      }
    }
    continuationToken = listed.IsTruncated ? listed.NextContinuationToken : undefined;
  } while (continuationToken);

  return removed;
}
