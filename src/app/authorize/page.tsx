import type { Metadata } from 'next';
import { Suspense } from 'react';
import RequireAuth from '@/components/RequireAuth';
import AuthCardSkeleton from '@/components/auth/AuthCardSkeleton';
import ConsentPage from '@/components/oauth/ConsentPage';

export const metadata: Metadata = { title: 'Allow access · Task Board' };

/** The consent page reads `request` with `useSearchParams`, so it needs a Suspense boundary. */
export default function Page() {
    const skeleton = <AuthCardSkeleton title="Allow access" rows={3} />;

    return (
        <Suspense fallback={skeleton}>
            <RequireAuth fallback={skeleton}>
                <ConsentPage />
            </RequireAuth>
        </Suspense>
    );
}
