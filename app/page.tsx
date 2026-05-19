import Link from 'next/link';
import { ConciergeForm } from './_components/ConciergeForm';

export const metadata = {
  title: "qed'bop",
  description: 'Shareable poem-and-music lessons for teachers.',
};

export default function Landing() {
  return (
    <main className="page">
      <header style={{ marginTop: '2rem', marginBottom: '2.5rem' }}>
        <span
          className="wordmark"
          style={{ color: 'var(--ink)', fontSize: '3rem', display: 'block' }}
        >
          qed&rsquo;bop
        </span>
        <p className="chrome" style={{ marginTop: '0.5rem' }}>
          Poems set to music · lessons that demand close listening
        </p>
      </header>

      <section style={{ marginBottom: '2.5rem', maxWidth: '38rem' }}>
        <h1
          style={{
            fontFamily: 'Georgia, "Source Serif Pro", serif',
            fontSize: '1.5rem',
            fontWeight: 600,
            margin: '0 0 0.5rem 0',
            lineHeight: 1.3,
          }}
        >
          What are you interested in teaching?
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.9375rem', marginBottom: '1.25rem' }}>
          A poem, a poet, a theme, a literary work, a grade level — any of those work.
          qed&rsquo;bop will suggest specific lessons from its library.
        </p>
        <ConciergeForm />
      </section>

      <p style={{ marginBottom: '4rem' }}>
        <Link href="/build" className="chrome" style={{ color: 'var(--ink)' }}>
          Or browse the library directly →
        </Link>
      </p>

      <footer className="hairline" style={{ paddingTop: '1.5rem' }}>
        <p className="chrome">
          A teaching tool, not a tracking tool. Anonymous from the student&rsquo;s side.{' '}
          <Link href="/admin" style={{ color: 'inherit' }}>
            Admin
          </Link>
        </p>
      </footer>
    </main>
  );
}
