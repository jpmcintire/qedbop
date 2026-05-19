import { isAdmin, isGateConfigured } from '@/lib/admin-auth';
import { LoginGate } from './LoginGate';

export const dynamic = 'force-dynamic';

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const ok = await isAdmin();
  if (!ok) {
    return <LoginGate />;
  }
  return (
    <>
      {!isGateConfigured() && (
        <div
          style={{
            background: '#fff8e1',
            borderBottom: '1px solid var(--rule)',
            padding: '0.5rem 1rem',
            fontSize: '0.8125rem',
            color: '#8a6d00',
            textAlign: 'center',
          }}
        >
          Admin is unprotected — set <code>ADMIN_PASSWORD</code> in the environment to require a password.
        </div>
      )}
      {children}
    </>
  );
}
