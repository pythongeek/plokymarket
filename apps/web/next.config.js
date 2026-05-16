const { withSentryConfig } = require("@sentry/nextjs");
const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    eslint: { ignoreDuringBuilds: true },
    typescript: { ignoreBuildErrors: true },
    serverExternalPackages: ['pg', 'pgpass', 'pg-pool'],
    // Reduce JS chunks — 30 → ~10-15 for faster load
    experimental: {
        optimizePackageImports: ['lucide-react', '@radix-ui', 'framer-motion', 'recharts'],
    },
    webpack: (config, { isServer, isEdge }) => {
        if (isEdge) {
            config.resolve.alias = {
                ...config.resolve.alias,
                'pgpass': false,
                'pg': false,
                'split2': false,
            };
        }
        if (!isServer || isEdge) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false, path: false, net: false, dns: false, tls: false,
                'pg-native': false, stream: false, string_decoder: false,
            };
        }
        // Aggressive chunk splitting — fewer files = fewer round trips
        if (!isServer) {
            config.optimization.splitChunks = {
                chunks: 'all',
                cacheGroups: {
                    vendor: {
                        test: /[\\/]node_modules[\\/]/,
                        name: 'vendors',
                        chunks: 'all',
                        enforce: true,
                    },
                    common: {
                        minChunks: 2,
                        chunks: 'all',
                        enforce: true,
                    },
                },
            };
        }
        return config;
    },
};

module.exports = withNextIntl(withSentryConfig(nextConfig, {
    org: "bdowneer-llc",
    project: "sentry-bronze-marble",
    authToken: process.env.SENTRY_AUTH_TOKEN,
    // DISABLE Sentry webpack injection — reduces bundle size + build time
    disableServerWebpackPlugin: true,
    disableClientWebpackPlugin: true,
    silent: true,
}));
