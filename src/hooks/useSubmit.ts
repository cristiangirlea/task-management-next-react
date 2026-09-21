'use client';

import { useCallback, useState } from 'react';
import { ApiError, errorMessage } from '@/lib/api';
import type { ValidationErrors } from '@/types';

/** Submitting / validation-error state for a form that calls the API. */
export function useSubmit() {
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<ValidationErrors>({});
    const [message, setMessage] = useState<string | null>(null);

    const reset = useCallback(() => {
        setErrors({});
        setMessage(null);
    }, []);

    /** Runs `action`, capturing API errors. Resolves to true when it succeeded. */
    const run = useCallback(async (action: () => Promise<unknown>): Promise<boolean> => {
        setSubmitting(true);
        setErrors({});
        setMessage(null);
        try {
            await action();
            return true;
        } catch (err) {
            setErrors(err instanceof ApiError && err.errors ? err.errors : {});
            setMessage(errorMessage(err));
            return false;
        } finally {
            setSubmitting(false);
        }
    }, []);

    return { submitting, errors, message, run, reset };
}
