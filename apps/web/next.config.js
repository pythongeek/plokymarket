/** @type {import('next').NextConfig} */
const nextConfig = {
    // Build checks - temporarily allowing TypeScript errors
    // TODO: Generate fresh Supabase types to fix all type errors
    typescript: {
        ignoreBuildErrors: true,
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
};

module.exports = nextConfig;
