'use client';

import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { useAuth } from '@/lib/auth';
import { signInPath } from '@/lib/redirect';

/**
 * Renders children for a signed-in user and sends everyone else to /login,
 * which brings them back here afterwards.
 * When the API could not be reached to check the session, the user may still
 * be signed in, so it offers a retry instead.
 */
export default function RequireAuth({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
    const { user, loading, unreachable, retry, signedOutTo } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user && !unreachable) router.replace(signedOutTo ?? signInPath());
    }, [loading, user, unreachable, signedOutTo, router]);

    if (user) return <>{children}</>;
    if (unreachable) {
        return (
            <div role="alert" className="alert alert-warning">
                <span>Can&apos;t reach Task Board right now. Check your connection, then try again.</span>
                <button type="button" className="btn btn-sm" onClick={retry}>
                    Try again
                </button>
            </div>
        );
    }
    return <>{fallback}</>;
}
