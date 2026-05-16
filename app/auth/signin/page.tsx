'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function SignInPage() {
  const params = useSearchParams();
  const next =
    params.get('callbackUrl') || params.get('next') || '/app/dashboard';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (result?.error) {
      setError('Invalid email or password.');
      return;
    }
    window.location.href = next;
  }

  return (
    <div className="max-w-page mx-auto px-6 pt-20 pb-24 max-w-prose">
      <p className="chrome mb-4">Sign in</p>
      <h1 className="font-serif text-4xl mb-8">For teachers.</h1>

      <form onSubmit={onSubmit} className="space-y-5">
        <Field label="Email">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border-b border-rule bg-transparent py-2 text-ink focus:outline-none focus:border-ink"
          />
        </Field>
        <Field label="Password">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full border-b border-rule bg-transparent py-2 text-ink focus:outline-none focus:border-ink"
          />
        </Field>
        {error && <p className="prose-literary text-muted">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="bg-ink text-paper px-5 py-2 rounded-full chrome disabled:opacity-50"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <div className="mt-8">
        <button
          onClick={() => signIn('google', { callbackUrl: next })}
          className="border border-rule px-5 py-2 rounded-full chrome hover:border-ink"
        >
          Continue with Google
        </button>
      </div>

      <p className="prose-literary mt-12 text-muted">
        New here? <Link href="/auth/signup" className="underline">Create an account</Link>.
      </p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="chrome block mb-1">{label}</span>
      {children}
    </label>
  );
}
