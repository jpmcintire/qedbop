import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { remark } from 'remark';
import remarkHtml from 'remark-html';

export interface PoemFrontmatter {
  title: string;
  poet: string;
  year: number | string;
  slug: string;
  oneLineSummary?: string;
  poem: string; // the full poem text, preserving line breaks
  youtube?: string;
  spotify?: string;
  appleMusic?: string;
  sunoAudio?: string;
  musicalSetting?: string; // a brief note on genre choice
  themes?: string[];
  related?: string[]; // slugs
}

export interface Poem extends PoemFrontmatter {
  bodyHtml: string; // rendered prose (context, interpretation, etc.)
}

const CONTENT_DIR = path.join(process.cwd(), 'content', 'poems');

export function getAllPoemSlugs(): string[] {
  if (!fs.existsSync(CONTENT_DIR)) return [];
  return fs
    .readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith('.md'))
    .map((f) => f.replace(/\.md$/, ''));
}

export async function getPoem(slug: string): Promise<Poem | null> {
  const filePath = path.join(CONTENT_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(raw);
  const processed = await remark().use(remarkHtml).process(content);
  const fm = data as PoemFrontmatter;
  return {
    ...fm,
    slug: fm.slug ?? slug,
    bodyHtml: processed.toString(),
  };
}

export async function getAllPoems(): Promise<Poem[]> {
  const slugs = getAllPoemSlugs();
  const poems = await Promise.all(slugs.map((s) => getPoem(s)));
  return poems.filter((p): p is Poem => p !== null);
}

/**
 * Split a poem into stanzas on blank-line boundaries.
 * Trims surrounding whitespace; preserves intra-stanza line breaks.
 */
export function splitStanzas(poem: string): string[] {
  return poem
    .replace(/\r\n/g, '\n')
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}
