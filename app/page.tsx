export default function HomePage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        textAlign: 'center',
      }}
    >
      <h1
        style={{
          fontFamily: 'Georgia, "Source Serif Pro", serif',
          fontWeight: 600,
          fontSize: '3rem',
          letterSpacing: '0.06em',
          margin: 0,
        }}
      >
        qed&rsquo;bop
      </h1>
      <p
        style={{
          marginTop: '1.5rem',
          fontSize: '1rem',
          color: '#6B6862',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}
      >
        Public-domain poems set to music
      </p>
    </main>
  );
}
