/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  output: 'standalone',
  pageExtensions: ['ts', 'tsx', 'js', 'jsx'],
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
