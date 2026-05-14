import Link from 'next/link';
import { getAllPoems } from '@/lib/poems';

export const metadata = {
  title: 'Catalog',
  description: 'The full catalog of public-domain poems set to music.',
};

export default async function CatalogPage() {
  const poems = await getAllPoems();
  return (
    <div className="max-w-page mx-auto px-6 pt-12 pb-24">
      <h1 className="font-serif text-4xl mb-8 text-ink">Catalog</h1>
      <ul className="divide-y divide-rule">
        {poems.map((p) => (
          <li key={p.slug} className="py-5">
            <Link href={`/poems/${p.slug}`} className="block group max-w-prose">
              <div className="chrome mb-1">{p.poet} &middot; {p.year}</div>
              <div className="font-serif text-2xl group-hover:underline decoration-rule underline-offset-4">
                {p.title}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
