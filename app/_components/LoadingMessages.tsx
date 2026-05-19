'use client';

import { useEffect, useMemo, useState } from 'react';
import { buildLoadingMessages } from '@/lib/loading-messages';

type Props = {
  // Poem currently in scope. Used to pick the poem's bespoke message
  // pool when one exists; falls back to the generic pool otherwise.
  poem?: { loadingMessages?: string[] } | null;
  // ms between message transitions. Cycles through the playful messages
  // and then settles on the closer.
  intervalMs?: number;
  style?: React.CSSProperties;
  className?: string;
};

export function LoadingMessages({ poem, intervalMs = 2500, style, className }: Props) {
  // Build the list once per mount so re-renders don't reshuffle mid-load.
  const messages = useMemo(() => buildLoadingMessages(poem), [poem]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    // Stop advancing once we hit the closer — it's the final, settled
    // state, not part of the rotation.
    if (index >= messages.length - 1) return;
    const t = setTimeout(() => setIndex((i) => i + 1), intervalMs);
    return () => clearTimeout(t);
  }, [index, messages, intervalMs]);

  return (
    <span
      className={className}
      style={{ fontStyle: 'italic', color: 'var(--muted)', ...style }}
    >
      {messages[index]}
    </span>
  );
}
