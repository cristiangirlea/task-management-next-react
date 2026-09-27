import type { Metadata } from 'next';
import { Suspense } from 'react';
import AuthCardSkeleton from '@/components/auth/AuthCardSkeleton';
import ResetPasswordPage from '@/components/auth/ResetPasswordPage';

export const metadata: Metadata = { title: 'Reset password · Task Board' };

/** The card reads `token` and `email` with `useSearchParams`, so it needs a Suspense boundary. */
export default function Page() {
    return (
        <Suspense fallback={<AuthCardSkeleton title="Choose a new password" rows={3} />}>
            <ResetPasswordPage />
        </Suspense>
    );
}
