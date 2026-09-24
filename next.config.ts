import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    reactStrictMode: true,

    // A self-contained server in .next/standalone for the production image.
    output: 'standalone',

    webpack(config, { dev }) {
        if (dev) {
            // Polling keeps hot reload working when the app runs inside Docker.
            config.watchOptions = {
                poll: 1000,
                aggregateTimeout: 300,
            };
        }
        return config;
    },
};

export default nextConfig;
