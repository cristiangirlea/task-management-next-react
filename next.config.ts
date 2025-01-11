import type { NextConfig } from 'next';

const rewrites = async (): Promise<{ source: string; destination: string }[]> => {
    return [
        {
            source: '/api/:path*',
            destination: 'http://localhost:4000/api/:path*', // Forward requests to Express.js backend
        },
    ];
};

const nextConfig: {
    rewrites: () => Promise<{ source: string; destination: string }[]>;
    reactStrictMode: boolean;
} = {
    reactStrictMode: true,
    rewrites,
};

export default nextConfig;
