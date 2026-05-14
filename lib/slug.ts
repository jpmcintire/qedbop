import { customAlphabet } from 'nanoid';

// URL-safe, lowercase, no easily-confused chars. 7 chars ≈ 78B combos.
const nano = customAlphabet('abcdefghjkmnpqrstuvwxyz23456789', 7);

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32);

export function buildAssignmentSlug(workTitle: string): string {
  const base = slugify(workTitle) || 'assignment';
  return `${base}-${nano()}`;
}
