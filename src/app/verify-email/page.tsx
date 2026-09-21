import type { Metadata } from 'next';
import { Suspense } from 'react';
import AuthCardSkeleton from '@/components/auth/AuthCardSkeleton';
import VerifyEmailPage from '@/components/auth/VerifyEmailPage';

export const metadata: Metadata = { title: 'Email verification · Task Board' };

/** The card reads `status` with `useSearchParams`, so it needs a Suspense boundary. */
export default function Page() {
    return (
        <Suspense fallback={<AuthCardSkeleton title="Email verification" rows={1} />}>
            <VerifyEmailPage />
        </Suspense>
    );
}
