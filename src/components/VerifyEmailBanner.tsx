'use client';

import { useState } from 'react';
import { useResendVerification } from '@/hooks/useResendVerification';
import { useAuth } from '@/lib/auth';
import { VERIFY_BANNER_KEY, readSession, writeSession } from '@/lib/storage';

/**
 * Nudge shown to signed-in users who have not confirmed their address yet.
 * Dismissing it hides it for the rest of the tab session.
 */
export default function VerifyEmailBanner() {
    const { user } = useAuth();
    const [dismissed, setDismissed] = useState(() => readSession(VERIFY_BANNER_KEY) === '1');
    const { submitting, sent, message, resend } = useResendVerification();

    if (!user || user.email_verified_at !== null || dismissed) return null;

    const dismiss = () => {
        writeSession(VERIFY_BANNER_KEY, '1');
        setDismissed(true);
    };

    return (
        <div role="alert" className="alert alert-warning">
            <div className="flex-1 text-sm">
                <span>Confirm your email address to secure your account.</span>
                {message && <p className="mt-1 text-xs">{message}</p>}
            </div>
            <div className="flex gap-2">
                <button type="button" className="btn btn-sm" onClick={() => void resend()} disabled={submitting || sent}>
                    {submitting ? <span className="loading loading-spinner loading-xs" /> : sent ? 'Sent' : 'Resend email'}
                </button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={dismiss}>
                    Dismiss
                </button>
            </div>
        </div>
    );
}
