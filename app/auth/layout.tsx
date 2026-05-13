import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-rule">
        <div className="max-w-page mx-auto px-6 py-5">
          <Link href="/" className="wordmark text-xl text-ink no-underline">
            qed&rsquo;bop
          </Link>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
