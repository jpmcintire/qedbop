import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';

export const metadata: Metadata = {
  metadataBase: new URL('https://qedbop.com'),
  title: {
    default: "qed'bop — public-domain poems set to music",
    template: "%s — qed'bop",
  },
  description:
    "A catalog of public-domain poems set to music. The poem comes first; the music serves the literature.",
  openGraph: {
    siteName: "qed'bop",
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,500;0,8..60,600;1,8..60,400&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <header className="border-b border-rule">
          <div className="max-w-page mx-auto px-6 py-5 flex items-baseline justify-between">
            <Link href="/" className="wordmark text-xl text-ink no-underline">
              qed&rsquo;bop
            </Link>
            <nav className="chrome flex gap-6">
              <Link href="/poems" className="hover:text-ink">Catalog</Link>
              <Link href="/about" className="hover:text-ink">About</Link>
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
      </body>
    </html>
  );
}
