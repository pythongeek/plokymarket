const { withSentryConfig } = require("@sentry/nextjs");

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

module.exports = withSentryConfig(nextConfig, {
    org: "bdowneer-llc",
    project: "sentry-bronze-marble",

    // Upload source maps for readable stack traces
    authToken: process.env.SENTRY_AUTH_TOKEN,
  