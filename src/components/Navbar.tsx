'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export default function Navbar() {
    const { user, loading, logout } = useAuth();
    const pathname = usePathname();
    const settingsActive = pathname === '/settings';

    return (
        <header className="navbar sticky top-0 z-20 border-b border-base-300 bg-base-100">
            <div className="flex-1">
                <Link href="/" className="btn btn-ghost text-xl">
                    Task Board
                </Link>
            </div>
            <nav className="flex items-center gap-2">
                {loading ? null : user ? (
                    <>
                        <Link
                            href="/settings"
                            className={`btn btn-ghost btn-sm ${settingsActive ? 'btn-active' : ''}`}
                            aria-current={settingsActive ? 'page' : undefined}
                        >
                            Settings
                        </Link>
                        <span className="hidden text-sm sm:inline">{user.name}</span>
                        <button type="button" className="btn btn-outline btn-sm" onClick={() => void logout()}>
                            Logout
                        </button>
                    </>
                ) : (
                    <>
                        <Link href="/login" className="btn btn-ghost btn-sm">
                            Log in
                        </Link>
                        <Link href="/register" className="btn btn-primary btn-sm">
                            Register
                        </Link>
                    </>
                )}
            </nav>
        </header>
    );
}
