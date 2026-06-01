'use client';

import { QRCodeSVG } from 'qrcode.react';

// Renders a QR code at a comfortable classroom-projection size with
// the destination URL printed below it (so the back of the room can
// see + scan, and any phone that can't scan has a fallback to type).

type Props = {
  url: string;
  // Title shown above the QR — e.g. the poem name, so a teacher
  // projecting this can confirm the right link is showing.
  caption?: string;
};

export function QrPanel({ url, caption }: Props) {
  return (
    <div
      style={{
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1rem',
      }}
    >
      {caption && (
        <p
          style={{
            fontFamily: 'Georgia, "Source Serif Pro", serif',
            fontSize: '1.0625rem',
            fontWeight: 600,
            margin: 0,
            textAlign: 'center',
          }}
        >
          {caption}
        </p>
      )}
      <div
        style={{
          background: '#fff',
          padding: '1rem',
          borderRadius: '0.5rem',
          border: '1px solid var(--rule)',
        }}
      >
        <QRCodeSVG value={url} size={320} level="M" />
      </div>
      <code
        style={{
          fontFamily: 'ui-monospace, monospace',
          fontSize: '0.8125rem',
          color: 'var(--muted)',
          wordBreak: 'break-all',
          textAlign: 'center',
          maxWidth: '32rem',
        }}
      >
        {url}
      </code>
    </div>
  );
}
