'use client';

import { useEffect, useRef, useState } from 'react';
import {
  IDENTITIES,
  IDENTITY_LIST,
  signIn,
  signOut,
  useIdentity,
} from '@/lib/identity-client';
import { seedIfFirstTime } from '@/lib/lessons-store';

// Right-side sign-in affordance for the top nav. Renders a single
// chip-style button; clicking opens a small popover with sign-in
// choices (or the sign-out action if signed in). Two named proxy
// identities — John and Dante — let us evaluate signed-in features
// without standing up real auth.

export function SignInMenu() {
  const identity = useIdentity();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click + escape.
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  function handleSignIn(id: typeof IDENTITY_LIST[number]) {
    signIn(id);
    seedIfFirstTime(id);
    setOpen(false);
  }

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        style={triggerStyle}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {identity
          ? `Hi, ${IDENTITIES[identity].displayName} ▾`
          : 'Sign in ▾'}
      </button>
      {open && (
        <div role="menu" style={menuStyle}>
          {identity ? (
            <>
              <div style={menuHeaderStyle}>
                <div style={{ fontWeight: 600 }}>{IDENTITIES[identity].displayName}</div>
                <div className="chrome" style={{ marginTop: '0.125rem' }}>
                  {IDENTITIES[identity].role}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  signOut();
                  setOpen(false);
                }}
                style={itemStyle}
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <div style={menuHeaderStyle}>
                <div className="chrome">Sign in as (demo)</div>
              </div>
              {IDENTITY_LIST.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleSignIn(id)}
                  style={itemStyle}
                >
                  <span style={{ fontWeight: 500 }}>{IDENTITIES[id].displayName}</span>
                  <span className="chrome" style={{ display: 'block', marginTop: '0.125rem' }}>
                    {IDENTITIES[id].role}
                  </span>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

const triggerStyle: React.CSSProperties = {
  fontSize: '0.875rem',
  padding: '0.375rem 0.75rem',
  border: '1px solid var(--rule)',
  borderRadius: '0.375rem',
  background: 'var(--paper)',
  color: 'var(--ink)',
  cursor: 'pointer',
  fontFamily: 'inherit',
  lineHeight: 1.2,
};

const menuStyle: React.CSSProperties = {
  position: 'absolute',
  top: 'calc(100% + 0.5rem)',
  right: 0,
  minWidth: '14rem',
  background: 'var(--paper)',
  border: '1px solid var(--rule)',
  borderRadius: '0.5rem',
  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
  padding: '0.5rem',
  zIndex: 50,
};

const menuHeaderStyle: React.CSSProperties = {
  padding: '0.5rem 0.75rem',
  borderBottom: '1px solid var(--rule)',
  marginBottom: '0.25rem',
};

const itemStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  textAlign: 'left',
  padding: '0.5rem 0.75rem',
  border: 'none',
  background: 'transparent',
  color: 'var(--ink)',
  cursor: 'pointer',
  borderRadius: '0.25rem',
  fontFamily: 'inherit',
  fontSize: '0.875rem',
};
