import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    reactStrictMode: true,

    // A self-contained server in .next/standalone for the production image.
    output: 'standalone',
};

export default nextConfig;
