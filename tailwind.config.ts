import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Source Serif 4"', '"Source Serif Pro"', 'Georgia', 'serif'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        paper: '#FBFAF7',
        ink: '#1B1B1A',
        rule: '#E5E2DA',
        muted: '#6B6862',
        accent: '#5A5448',
      },
      maxWidth: {
        prose: '38rem',
        page: '64rem',
      },
      letterSpacing: {
        wordmark: '0.06em',
        chrome: '0.08em',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};

export default config;
