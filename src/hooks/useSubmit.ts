'use client';

import { useCallback, useState } from 'react';
import { ApiError, errorMessage } from '@/lib/api';
import type { ValidationErrors } from '@/types';

/**
 * Submitting / validation-error state for a form that calls the API.
 * `format` turns a caught error into the message shown to the user.
 */
export function useSubmit(format: (error: unknown) => string = errorMessage) {
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<ValidationErrors>({});
    const [message, setMessage] = useState<string | null>(null);
    /** HTTP status of the last failure (0 when the API was unreachable), for status-specific UI. */
    const [status, setStatus] = useState<number | null>(null);

    const reset = useCallback(() => {
        setErrors({});
        setMessage(null);
        setStatus(null);
    }, []);

    /** Runs `action`, capturing API errors. Resolves to true when it succeeded. */
    const run = useCallback(
        async (action: () => Promise<unknown>): Promise<boolean> => {
            setSubmitting(true);
            setErrors({});
            setMessage(null);
            setStatus(null);
            try {
                await action();
                return true;
            } catch (err) {
                setErrors(err instanceof ApiError && err.errors ? err.errors : {});
                setMessage(format(err));
                setStatus(err instanceof ApiError ? err.status : null);
                return false;
            } finally {
                setSubmitting(false);
            }
        },
        [format],
    );

    return { submitting, errors, message, status, run, reset };
}
