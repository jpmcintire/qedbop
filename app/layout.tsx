import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "qed'bop",
  description: "Public-domain poems set to music.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          background: '#FBFAF7',
          color: '#1B1B1A',
        }}
      >
        {children}
      </body>
    </html>
  );
}
