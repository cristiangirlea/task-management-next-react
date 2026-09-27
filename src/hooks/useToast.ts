'use client';

import { useCallback, useEffect, useState } from 'react';

export type ToastMessage = { type: 'error' | 'success'; text: string };

/** Signature of `show`, for components that receive it as a prop. */
export type Notify = (type: ToastMessage['type'], text: string) => void;

export function useToast(durationMs = 4000) {
    const [toast, setToast] = useState<ToastMessage | null>(null);

    useEffect(() => {
        if (!toast) return;
        const timer = window.setTimeout(() => setToast(null), durationMs);
        return () => window.clearTimeout(timer);
    }, [toast, durationMs]);

    const show = useCallback((type: ToastMessage['type'], text: string) => setToast({ type, text }), []);
    const dismiss = useCallback(() => setToast(null), []);

    return { toast, show, dismiss };
}
