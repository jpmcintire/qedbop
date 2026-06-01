'use client';

import { useEffect, useRef } from 'react';

// Reusable modal primitive. Closes on Escape, on click of the
// backdrop, and on click of the explicit close button. Locks body
// scroll while open. Renders nothing when closed (no transition —
// keep it tight).

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  // Optional subtitle below the title — useful for context.
  subtitle?: string;
  children: React.ReactNode;
  // Optional max content width. Defaults to 800px (good for preview
  // iframes); QR popovers can pass something smaller.
  maxWidth?: string;
};

export function Modal({ open, onClose, title, subtitle, children, maxWidth = '800px' }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        zIndex: 1000,
      }}
    >
      <div
        ref={dialogRef}
        style={{
          background: 'var(--paper)',
          color: 'var(--ink)',
          borderRadius: '0.75rem',
          width: '100%',
          maxWidth,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px rgba(0,0,0,0.35)',
          overflow: 'hidden',
        }}
      >
        <header
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '1rem',
            padding: '1rem 1.25rem',
            borderBottom: '1px solid var(--rule)',
          }}
        >
          <div style={{ minWidth: 0 }}>
            <h2
              style={{
                fontFamily: 'Georgia, "Source Serif Pro", serif',
                fontSize: '1.125rem',
                fontWeight: 600,
                margin: 0,
              }}
            >
              {title}
            </h2>
            {subtitle && (
              <p
                style={{
                  color: 'var(--muted)',
                  fontSize: '0.8125rem',
                  margin: '0.125rem 0 0 0',
                }}
              >
                {subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'transparent',
              border: '1px solid var(--rule)',
              borderRadius: '0.25rem',
              padding: '0.25rem 0.625rem',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: '0.875rem',
              color: 'var(--muted)',
              flexShrink: 0,
            }}
          >
            Close ✕
          </button>
        </header>
        <div style={{ overflow: 'auto', flex: 1 }}>{children}</div>
      </div>
    </div>
  );
}
