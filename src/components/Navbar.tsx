'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth';

export default function Navbar() {
    const { user, loading, logout } = useAuth();

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
