import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth, signOut } from '@/lib/auth';
import { Providers } from '@/components/Providers';

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect('/auth/signin');

  return (
    <Providers>
      <div className="min-h-screen flex flex-col">
        <header className="border-b border-rule">
          <div className="max-w-page mx-auto px-6 py-5 flex items-baseline justify-between">
            <Link href="/app/dashboard" className="wordmark text-xl text-ink no-underline">
              qed&rsquo;bop
            </Link>
            <nav className="chrome flex gap-6 items-baseline">
              <Link href="/app/dashboard" className="hover:text-ink">Dashboard</Link>
              <Link href="/app/library" className="hover:text-ink">Library</Link>
              <Link href="/app/build" className="hover:text-ink">Build</Link>
              <Link href="/app/profile" className="hover:text-ink">Profile</Link>
              {session.user.role === 'ADMIN' && (
                <Link href="/admin/works" className="hover:text-ink">Admin</Link>
              )}
              <form
                action={async () => {
                  'use server';
                  await signOut({ redirectTo: '/' });
                }}
              >
                <button className="chrome hover:text-ink">Sign out</button>
              </form>
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </Providers>
  );
}
