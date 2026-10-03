import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    reactStrictMode: true,

    // A self-contained server in .next/standalone for the production image.
    output: 'standalone',

    // No page may be framed by another site: a framed consent page (/authorize)
    // could trick someone into clicking "Allow".
    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
                    { key: 'X-Frame-Options', value: 'DENY' },
                ],
            },
        ];
    },
};

export default nextConfig;
