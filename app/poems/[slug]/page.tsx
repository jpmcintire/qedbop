import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getAllPoemSlugs, getPoem, splitStanzas } from '@/lib/poems';
import { AudioBlock, YouTubeEmbed } from '@/components/AudioBlock';

interface Params {
  slug: string;
}

export async function generateStaticParams(): Promise<Params[]> {
  return getAllPoemSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<Params> }
): Promise<Metadata> {
  const { slug } = await params;
  const poem = await getPoem(slug);
  if (!poem) return {};
  const description =
    poem.oneLineSummary ??
    `"${poem.title}" by ${poem.poet} — read, listen, and study.`;
  return {
    title: `${poem.title} — ${poem.poet}`,
    description,
    openGraph: {
      title: `${poem.title} — ${poem.poet}`,
      description,
      type: 'article',
    },
  };
}

export default async function PoemPage(
  { params }: { params: Promise<Params> }
) {
  const { slug } = await params;
  const poem = await getPoem(slug);
  if (!poem) notFound();

  const stanzas = splitStanzas(poem.poem);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: poem.title,
    author: { '@type': 'Person', name: poem.poet },
    datePublished: String(poem.year),
    description: poem.oneLineSummary,
    url: `https://qedbop.com/poems/${poem.slug}`,
  };

  return (
    <article className="max-w-page mx-auto px-6 pt-12 pb-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Above the fold */}
      <header className="max-w-prose">
        <div className="chrome mb-4">
          {poem.poet} &middot; {poem.year}
        </div>
        <h1 className="font-serif text-4xl md:text-5xl leading-tight mb-5 text-ink">
          {poem.title}
        </h1>
        {poem.oneLineSummary && (
          <p className="font-serif italic text-muted text-lg mb-2">
            {poem.oneLineSummary}
          </p>
        )}
      </header>

      <AudioBlock
        spotify={poem.spotify}
        appleMusic={poem.appleMusic}
        youtube={poem.youtube}
        sunoAudio={poem.sunoAudio}
      />

      {/* Section nav — anchors */}
      <nav className="chrome flex gap-6 mb-10">
        <a href="#read" className="hover:text-ink">Read</a>
        <a href="#listen" className="hover:text-ink">Listen</a>
        <a href="#context" className="hover:text-ink">Context</a>
        <a href="#classroom" className="hover:text-ink">For the classroom</a>
      </nav>

      {/* The poem itself — the hero */}
      <section id="read" className="max-w-prose">
        <div className="poem">
          {stanzas.map((stanza, i) => (
            <div key={i} className="poem-stanza">
              {stanza}
            </div>
          ))}
        </div>
      </section>

      {/* Listen */}
      <section id="listen" className="max-w-prose mt-20">
        <h2 className="chrome mb-4">Listen</h2>
        {poem.youtube && <YouTubeEmbed url={poem.youtube} title={poem.title} />}
        {poem.musicalSetting && (
          <p className="prose-literary">{poem.musicalSetting}</p>
        )}
      </section>

      {/* Context — rendered from markdown body */}
      {poem.bodyHtml && (
        <section id="context" className="mt-20">
          <div
            className="prose-literary"
            dangerouslySetInnerHTML={{ __html: poem.bodyHtml }}
          />
        </section>
      )}

      {/* Classroom — placeholder until lesson plan content exists */}
      <section id="classroom" className="max-w-prose mt-20">
        <h2 className="chrome mb-4">For the classroom</h2>
        <p className="prose-literary text-muted">
          Lesson plans, discussion questions, and slide decks are in development.
        </p>
      </section>

      {/* Related */}
      {poem.related && poem.related.length > 0 && (
        <section className="max-w-prose mt-20">
          <h2 className="chrome mb-4">Related</h2>
          <ul className="prose-literary">
            {poem.related.map((relSlug) => (
              <li key={relSlug}>
                <Link href={`/poems/${relSlug}`}>{relSlug.replace(/-/g, ' ')}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
