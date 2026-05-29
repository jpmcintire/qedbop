import type { Metadata } from 'next';
import { Dongle } from 'next/font/google';
import './globals.css';

// Display font for the qed'bop wordmark. The thin, condensed character
// gives the logo its identity. Body/UI type stays system sans.
const dongle = Dongle({
  weight: ['300', '400', '700'],
  subsets: ['latin'],
  variable: '--font-dongle',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "qed'bop",
  description: 'Public-domain poems set to music.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={dongle.variable}>
      <body>{children}</body>
    </html>
  );
}
