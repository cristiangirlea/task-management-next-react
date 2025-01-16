import type { NextConfig } from 'next';

const rewrites = async (): Promise<{ source: string; destination: string }[]> => {
    return [
        {
            source: '/api/:path*',
            destination: 'http://localhost:4000/api/:path*', // Forward requests to Express.js backend
        },
    ];
};

const nextConfig: NextConfig = {
    reactStrictMode: true,
    rewrites,

    webpack(config, { dev }) {
        if (dev) {
            config.watchOptions = {
                poll: 1000, // Check for changes every second
                aggregateTimeout: 300, // Delay before rebuilding
            };
        }
        return config;
    },
};

export default nextConfig;
