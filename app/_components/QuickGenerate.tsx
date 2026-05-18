import { UrlBlock } from './UrlBlock';
import { formatExpirationFriendly } from '@/lib/expiration';

type Props = {
  ready: boolean;
  generating: boolean;
  hasResult: boolean;
  error: string | null;
  onGenerate: () => void;
  studentUrl: string;
  expiration: string;
};

// Quick mode's bottom section: a single button that generates and reveals
// the share-with-students URL.
export function QuickGenerate({
  ready,
  generating,
  hasResult,
  error,
  onGenerate,
  studentUrl,
  expiration,
}: Props) {
  return (
    <section className="hairline" style={{ paddingTop: '1.5rem', marginTop: '1rem' }}>
      <button
        type="button"
        className="btn"
        onClick={onGenerate}
        disabled={!ready || generating}
        style={{ fontSize: '0.9375rem', padding: '0.75rem 1.5rem' }}
      >
        {generating
          ? 'Generating with Claude Opus 4.7…'
          : hasResult
            ? 'Regenerate'
            : 'Get student URL'}
      </button>
      {!ready && !generating && (
        <p style={{ color: 'var(--muted)', fontSize: '0.8125rem', marginTop: '0.5rem' }}>
          Pick at least one musical version above first.
        </p>
      )}
      {error && (
        <p style={{ color: '#a33', fontSize: '0.875rem', marginTop: '0.5rem' }}>{error}</p>
      )}

      {hasResult && studentUrl && (
        <div style={{ marginTop: '1.5rem' }}>
          <UrlBlock
            label="Share with students"
            description={`Send this to students. Read-only, expires ${formatExpirationFriendly(expiration)}. To tweak topics, questions, or expiration date, switch to Custom mode at the top.`}
            relativeUrl={studentUrl}
            accent
          />
        </div>
      )}
    </section>
  );
}
