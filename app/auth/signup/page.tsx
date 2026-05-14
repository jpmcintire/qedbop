'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';

export default function SignUpPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name || undefined, email, password }),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error || 'Could not create account.');
      setLoading(false);
      return;
    }
    const signed = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (signed?.error) {
      setError('Account created. Please sign in.');
      return;
    }
    window.location.href = '/app/profile?onboarding=1';
  }

  return (
    <div className="max-w-page mx-auto px-6 pt-20 pb-24 max-w-prose">
      <p className="chrome mb-4">Create account</p>
      <h1 className="font-serif text-4xl mb-8">For teachers.</h1>

      <form onSubmit={onSubmit} className="space-y-5">
        <label className="block">
          <span className="chrome block mb-1">Name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border-b border-rule bg-transparent py-2 text-ink focus:outline-none focus:border-ink"
          />
        </label>
        <label className="block">
          <span className="chrome block mb-1">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border-b border-rule bg-transparent py-2 text-ink focus:outline-none focus:border-ink"
          />
        </label>
        <label className="block">
          <span className="chrome block mb-1">Password (8+ chars)</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="w-full border-b border-rule bg-transparent py-2 text-ink focus:outline-none focus:border-ink"
          />
        </label>
        {error && <p className="prose-literary text-muted">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="bg-ink text-paper px-5 py-2 rounded-full chrome disabled:opacity-50"
        >
          {loading ? 'Creating…' : 'Create account'}
        </button>
      </form>

      <p className="prose-literary mt-12 text-muted">
        Already have an account? <Link href="/auth/signin" className="underline">Sign in</Link>.
      </p>
    </div>
  );
}
