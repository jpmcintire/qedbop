/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Write build output to a non-default directory. Railway mounts a
  // persistent volume at .next/cache, which causes stale compiled
  // middleware to survive across deploys even after the source file
  // is removed. Using a fresh distDir on each build sidesteps that.
  distDir: '.next-build',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'i.ytimg.com' },
      { protocol: 'https', hostname: 'img.youtube.com' },
    ],
  },
};

module.exports = nextConfig;
