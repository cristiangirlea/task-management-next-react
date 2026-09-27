'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import AuthCard from '@/components/auth/AuthCard';
import { FormAlert } from '@/components/forms/Fields';
import { useResendVerification } from '@/hooks/useResendVerification';
import { useAuth } from '@/lib/auth';

type Status = 'success' | 'already-verified' | 'expired' | 'invalid';

const COPY: Record<Status, { title: string; body: string; alert: string }> = {
    success: {
        title: 'Your email is verified',
        body: 'Thanks for confirming your address. Your account is all set.',
        alert: 'alert-success',
    },
    'already-verified': {
        title: 'Already verified',
        body: 'This address was confirmed earlier, so there is nothing left to do.',
        alert: 'alert-info',
    },
    expired: {
        title: 'That link has expired',
        body: 'Verification links are short-lived. Request a new one and we will email it straight away.',
        alert: 'alert-warning',
    },
    invalid: {
        title: 'That link is not valid',
        body: 'The link may have been cut short by your email client, or it has already been replaced by a newer one.',
        alert: 'alert-warning',
    },
};

/** The API verifies the address itself and redirects here with the outcome. */
function toStatus(value: string | null): Status {
    return value === 'success' || value === 'already-verified' || value === 'expired' ? value : 'invalid';
}

export default function VerifyEmailPage() {
    const status = toStatus(useSearchParams().get('status'));
    const { user } = useAuth();
    const { submitting, sent, message, resend } = useResendVerification();
    const canResend = Boolean(user) && (status === 'expired' || status === 'invalid');
    const { title, body, alert } = COPY[status];

    return (
        <AuthCard
            title={title}
            footer={
                user ? (
                    <Link href="/" className="link link-primary">
                        Back to the board
                    </Link>
                ) : (
                    <Link href="/login" className="link link-primary">
                        Sign in
                    </Link>
                )
            }
        >
            <div role="status" className={`alert ${alert} py-2 text-sm`}>
                <span>{body}</span>
            </div>
            {canResend && (
                <>
                    <button
                        type="button"
                        className="btn btn-primary mt-2"
                        onClick={() => void resend()}
                        disabled={submitting || sent}
                    >
                        {submitting ? (
                            <span className="loading loading-spinner loading-sm" />
                        ) : sent ? (
                            'Sent'
                        ) : (
                            'Resend verification email'
                        )}
                    </button>
                    <FormAlert message={message} />
                </>
            )}
            {!user && status !== 'success' && status !== 'already-verified' && (
                <p className="text-sm text-base-content/70">Sign in to send yourself a new verification email.</p>
            )}
        </AuthCard>
    );
}
