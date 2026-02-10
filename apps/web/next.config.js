/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Optimize for Vercel deployment
  output: 'standalone',
  // Ignore the legacy pages folder since we're using App Router
  pageExtensions: ['ts', 'tsx', 'js', 'jsx'],
  // Image optimization
  images: {
    unoptimized: true,
  },
  // Disable middleware for debugging
  skipMiddlewareUrlNormalize: true,
  skipTrailingSlashRedirect: true,
};

module.exports = nextConfig;
