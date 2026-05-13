import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth, signOut } from '@/lib/auth';
import { Providers } from '@/components/Providers';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect('/auth/signin');
  if (session.user.role !== 'ADMIN') redirect('/app/dashboard');

  return (
    <Providers>
      <div className="min-h-screen flex flex-col">
        <header className="border-b border-rule bg-ink text-paper">
          <div className="max-w-page mx-auto px-6 py-5 flex items-baseline justify-between">
            <Link href="/admin/works" className="wordmark text-xl text-paper no-underline">
              qed&rsquo;bop · admin
            </Link>
            <nav className="chrome flex gap-6 items-baseline" style={{ color: '#FBFAF7' }}>
              <Link href="/admin/works" className="hover:text-paper">Works</Link>
              <Link href="/app/dashboard" className="hover:text-paper">Exit admin</Link>
              <form
                action={async () => {
                  'use server';
                  await signOut({ redirectTo: '/' });
                }}
              >
                <button className="chrome hover:text-paper">Sign out</button>
              </form>
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </Providers>
  );
}
