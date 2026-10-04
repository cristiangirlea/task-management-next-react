import type { MetadataRoute } from 'next';

/** Lets phones and desktops install Task Board as an app ("Add to Home Screen"). */
export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Task Board',
        short_name: 'Task Board',
        description: 'Kanban boards for your team, with an MCP server for AI assistants.',
        id: '/',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        // The page background and the navbar, so the app opens without a flash of another colour.
        background_color: '#f2f2f2',
        theme_color: '#ffffff',
        icons: [
            { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
    };
}
