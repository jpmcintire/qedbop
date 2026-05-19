'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { setModelOverride } from '../actions';
import type { Component } from '@/lib/model-config';

type Props = {
  component: Component;
  label: string;
  defaultModel: string;
  currentOverride: string | undefined;
  options: Array<{ id: string; label: string }>;
};

export function ModelPicker({
  component,
  label,
  defaultModel,
  currentOverride,
  options,
}: Props) {
  const router = useRouter();
  const initial = currentOverride ?? 'default';
  const [value, setValue] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isOverride = value !== 'default';
  const effectiveModel = isOverride ? value : defaultModel;
  const effectiveLabel = options.find((o) => o.id === effectiveModel)?.label ?? effectiveModel;

  function change(next: string) {
    if (next === value) return;
    setValue(next);
    setError(null);
    startTransition(async () => {
      const res = await setModelOverride({ component, model: next });
      if (res.ok) {
        router.refresh();
      } else {
        setError(res.error);
        setValue(initial);
      }
    });
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto auto',
        gap: '1rem',
        alignItems: 'center',
        padding: '0.625rem 0.875rem',
        border: '1px solid var(--rule)',
        borderRadius: '0.5rem',
      }}
    >
      <div>
        <p style={{ margin: 0, fontFamily: 'Georgia, serif', fontSize: '1rem' }}>
          {label}
        </p>
        <p
          className="chrome"
          style={{
            margin: '0.125rem 0 0 0',
            fontStyle: isOverride ? 'normal' : 'italic',
            color: isOverride ? 'var(--ink)' : 'var(--muted)',
          }}
        >
          Using {effectiveLabel}
          {!isOverride && ' (default)'}
        </p>
      </div>
      <select
        value={value}
        onChange={(e) => change(e.target.value)}
        disabled={pending}
        style={{
          fontFamily: 'inherit',
          fontSize: '0.875rem',
          padding: '0.375rem 0.625rem',
          border: '1px solid var(--rule)',
          borderRadius: '0.375rem',
          background: 'transparent',
          color: 'var(--ink)',
        }}
      >
        <option value="default">Default ({options.find((o) => o.id === defaultModel)?.label ?? defaultModel})</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
      {error && (
        <span style={{ color: '#a33', fontSize: '0.75rem' }}>{error}</span>
      )}
      {!error && pending && (
        <span className="chrome" style={{ fontStyle: 'italic' }}>Saving…</span>
      )}
      {!error && !pending && <span />}
    </div>
  );
}
