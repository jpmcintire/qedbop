'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { disconnectYouTube } from '../actions';

export function DisconnectButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function disconnect() {
    if (!confirm('Disconnect the YouTube channel? You can reconnect anytime; attached videos stay attached.')) {
      return;
    }
    startTransition(async () => {
      await disconnectYouTube();
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={disconnect}
      disabled={pending}
      className="btn btn-ghost"
      style={{ fontSize: '0.8125rem' }}
    >
      {pending ? 'Disconnecting…' : 'Disconnect'}
    </button>
  );
}
