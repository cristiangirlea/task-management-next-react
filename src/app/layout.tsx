import type { Metadata, Viewport } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import { AuthProvider } from '@/lib/auth';

export const metadata: Metadata = {
    title: 'Task Board',
    description: 'Kanban task board backed by a Laravel API',
    applicationName: 'Task Board',
    // Installed on an iPhone's home screen: the name under the icon, and full screen.
    appleWebApp: { title: 'Task Board', statusBarStyle: 'default' },
};

// The navbar's colour (daisyUI base-100) in the light and dark themes.
export const viewport: Viewport = {
    themeColor: [
        { media: '(prefers-color-scheme: light)', color: '#ffffff' },
        { media: '(prefers-color-scheme: dark)', color: '#1d232a' },
    ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body className="min-h-screen bg-base-200 text-base-content">
                <AuthProvider>
                    <Navbar />
                    <main className="mx-auto w-full max-w-7xl p-4 sm:p-6">{children}</main>
                </AuthProvider>
            </body>
        </html>
    );
}
