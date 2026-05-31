'use client';

import { useState } from 'react';

// A single shareable-URL card with Copy and Open buttons. Owns its own
// "copied" toast state. Used in both Quick mode (one block, just the
// student URL) and Custom mode (two blocks, share + editable).
type Props = {
  label: string;
  description: string;
  relativeUrl: string;
  accent?: boolean;
};

export function UrlBlock({ label, description, relativeUrl, accent }: Props) {
  const [copied, setCopied] = useState(false);
  const fullUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${relativeUrl}`
      : relativeUrl;

  async function copy() {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }

  return (
    <div
      style={{
        padding: '1rem 1.25rem',
        border: `1px solid ${accent ? 'var(--ink)' : 'var(--rule)'}`,
        borderRadius: '0.5rem',
        background: accent ? 'rgba(27,27,26,0.04)' : 'transparent',
      }}
    >
      <p className="chrome" style={{ marginBottom: '0.375rem' }}>{label}</p>
      <p
        style={{
          color: 'var(--muted)',
          fontSize: '0.8125rem',
          marginBottom: '0.75rem',
          maxWidth: '46rem',
        }}
      >
        {description}
      </p>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button type="button" className="btn" onClick={copy}>
          {copied ? 'Copied' : 'Copy URL'}
        </button>
        <a
          href={relativeUrl}
          target="_blank"
          rel="noreferrer"
          className="btn btn-ghost"
          style={{ textDecoration: 'none', display: 'inline-block' }}
        >
          Open ↗
        </a>
      </div>
    </div>
  );
}
