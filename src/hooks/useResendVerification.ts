'use client';

import { useCallback, useState } from 'react';
import { useSubmit } from '@/hooks/useSubmit';
import { ApiError, errorMessage, resendVerificationEmail } from '@/lib/api';

/** The resend endpoint is throttled; a 429 is a "try later", not a failure. */
function resendError(error: unknown): string {
    if (error instanceof ApiError && error.status === 429) return 'Please wait a moment before trying again.';
    return errorMessage(error);
}

/**
 * Asks the API to send the verification email again. Shared by the verify-email
 * page and the board banner; `sent` stays true so the button is only used once.
 */
export function useResendVerification() {
    const { submitting, message, run } = useSubmit(resendError);
    const [sent, setSent] = useState(false);

    const resend = useCallback(async () => {
        if (await run(resendVerificationEmail)) setSent(true);
    }, [run]);

    return { submitting, sent, message, resend };
}
