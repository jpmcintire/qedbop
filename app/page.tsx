import Link from 'next/link';

export const metadata = {
  title: "qed'bop",
  description: 'Shareable poem-and-music lessons for teachers.',
};

export default function Landing() {
  return (
    <main className="page">
      <header style={{ marginTop: '2rem', marginBottom: '3rem' }}>
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

      <section style={{ marginBottom: '3rem', maxWidth: '40rem' }}>
        <p style={{ fontSize: '1.0625rem', lineHeight: 1.7, marginBottom: '1rem' }}>
          qed&rsquo;bop builds shareable lessons around public-domain poems that
          have been set to music. Pick a poem, pick one or more recorded settings,
          and qed&rsquo;bop drafts discussion questions calibrated to your audience.
        </p>
        <p style={{ fontSize: '1.0625rem', lineHeight: 1.7, marginBottom: '1rem' }}>
          The questions stay deliberately general about the music — never
          quoting timestamps or specific moments. Students supply the
          specificity from their own listening. That&rsquo;s the proof of
          engagement, and the part AI can&rsquo;t shortcut.
        </p>
        <p style={{ fontSize: '1.0625rem', lineHeight: 1.7 }}>
          No accounts, no sign-ups. Every lesson is a URL you send.
        </p>
      </section>

      <nav
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          maxWidth: '20rem',
          marginBottom: '4rem',
        }}
      >
        <Link
          href="/build"
          className="btn"
          style={{ textDecoration: 'none', textAlign: 'center' }}
        >
          Build a lesson
        </Link>
        <Link
          href="/admin"
          className="btn btn-ghost"
          style={{ textDecoration: 'none', textAlign: 'center' }}
        >
          Admin
        </Link>
      </nav>

      <footer className="hairline" style={{ paddingTop: '1.5rem' }}>
        <p className="chrome">
          A teaching tool, not a tracking tool. Anonymous from the student&rsquo;s side.
        </p>
      </footer>
    </main>
  );
}
