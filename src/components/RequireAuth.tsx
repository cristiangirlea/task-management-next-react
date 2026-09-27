'use client';

import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { useAuth } from '@/lib/auth';

/** Renders children for a signed-in user; sends everyone else to /login. */
export default function RequireAuth({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) router.replace('/login');
    }, [loading, user, router]);

    return <>{user ? children : fallback}</>;
}
