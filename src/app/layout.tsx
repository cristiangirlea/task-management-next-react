import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import { AuthProvider } from '@/lib/auth';

export const metadata: Metadata = {
    title: 'Task Board',
    description: 'Kanban task board backed by a Laravel API',
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
