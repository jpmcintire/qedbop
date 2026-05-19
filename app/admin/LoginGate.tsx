'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { adminLogin } from './actions';

export function LoginGate() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await adminLogin(password);
      if (res.ok) {
        router.refresh();
      } else {
        setError('Wrong password.');
        setPassword('');
      }
    });
  }

  return (
    <main className="page">
      <header style={{ marginTop: '3rem', marginBottom: '2rem' }}>
        <span className="wordmark" style={{ color: 'var(--ink)', fontSize: '2rem' }}>
          qed&rsquo;bop
        </span>
        <p className="chrome" style={{ marginTop: '0.5rem' }}>Admin</p>
      </header>
      <form onSubmit={submit} style={{ maxWidth: '20rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Admin password"
          autoFocus
          style={{
            fontFamily: 'inherit',
            fontSize: '1rem',
            padding: '0.625rem 0.875rem',
            border: '1px solid var(--rule)',
            borderRadius: '0.5rem',
            background: 'transparent',
            color: 'var(--ink)',
          }}
        />
        <button type="submit" className="btn" disabled={pending || !password}>
          {pending ? 'Checking…' : 'Enter'}
        </button>
        {error && <p style={{ color: '#a33', fontSize: '0.875rem', margin: 0 }}>{error}</p>}
      </form>
    </main>
  );
}
