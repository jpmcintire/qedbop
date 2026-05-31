import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPoetEditState } from '@/lib/poems-runtime';
import { EditPoetForm } from './EditPoetForm';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Edit poet — qed’bop",
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ slug: string }> };

export default async function EditPoetPage({ params }: Props) {
  const { slug } = await params;
  const state = await getPoetEditState(slug);
  if (!state) notFound();

  return (
    <main className="page">
      <header style={{ marginBottom: '2rem' }}>
        <Link
          href="/admin/poets"
          className="chrome"
          style={{ color: 'var(--ink)', textDecoration: 'none' }}
        >
          ← Back to poets
        </Link>
        <p className="chrome" style={{ marginTop: '0.75rem' }}>
          {state.poemSlugs.length} poem{state.poemSlugs.length === 1 ? '' : 's'} in catalog
        </p>
      </header>

      <EditPoetForm
        slug={state.slug}
        displayName={state.displayName}
        initialSpecialFacts={state.specialFacts ?? ''}
        hasDbRow={state.specialFacts !== null}
      />
    </main>
  );
}
