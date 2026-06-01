'use client';

import { useState } from 'react';
import { Modal } from '@/app/_components/Modal';
import { QrPanel } from '@/app/_components/QrPanel';

// The in-class moment: teacher is already projecting /t while
// running the discussion, hits this button, a big QR appears.
// Students scan from their seats and now have the assignment on
// their phones. URL fallback is printed below the code for any
// phone that can't scan.

type Props = {
  studentUrl: string;
  caption: string;
};

export function ShowToClassButton({ studentUrl, caption }: Props) {
  const [open, setOpen] = useState(false);
  const fullUrl =
    typeof window !== 'undefined' ? `${window.location.origin}${studentUrl}` : studentUrl;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn btn-ghost"
        style={{
          fontSize: '0.75rem',
          padding: '0.375rem 0.875rem',
          fontFamily: 'inherit',
          cursor: 'pointer',
        }}
      >
        Show to class
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Show to class"
        subtitle="Project this. Students scan to open the assignment on their phones."
        maxWidth="480px"
      >
        <QrPanel url={fullUrl} caption={caption} />
      </Modal>
    </>
  );
}
