// Numbered section wrapper for the builder steps.
type Props = {
  n: number;
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
};

export function Step({ n, title, right, children }: Props) {
  return (
    <section style={{ marginBottom: '2rem' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginBottom: '0.75rem',
          gap: '1rem',
        }}
      >
        <p className="chrome" style={{ margin: 0 }}>
          {n} — {title}
        </p>
        {right}
      </div>
      {children}
    </section>
  );
}
