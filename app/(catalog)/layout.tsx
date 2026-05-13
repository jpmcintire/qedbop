import Link from 'next/link';

export default function CatalogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="border-b border-rule">
        <div className="max-w-page mx-auto px-6 py-5 flex items-baseline justify-between">
          <Link href="/" className="wordmark text-xl text-ink no-underline">
            qed&rsquo;bop
          </Link>
          <nav className="chrome flex gap-6">
            <Link href="/poems" className="hover:text-ink">Catalog</Link>
            <Link href="/about" className="hover:text-ink">About</Link>
            <Link href="/app/dashboard" className="hover:text-ink">For teachers</Link>
          </nav>
        </div>
      </header>
      <main>{children}</main>
      <footer className="hairline mt-24">
        <div className="max-w-page mx-auto px-6 py-8 chrome flex justify-between">
          <span>qed&rsquo;bop &middot; Public-domain poems set to music</span>
          <span>&copy; {new Date().getFullYear()}</span>
        </div>
      </footer>
    </>
  );
}
