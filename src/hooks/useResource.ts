'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { errorMessage } from '@/lib/api';

/**
 * Loads one API resource on mount. `load` must be a stable function (for
 * example an export of `@/lib/api`) or the effect would refetch on every
 * render; `setData` lets callers apply the result of a mutation locally.
 */
export function useResource<T>(load: () => Promise<T>, initial: T) {
    const [data, setData] = useState<T>(initial);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    // Only the latest request may update the state; an older one finishing late is ignored.
    const latest = useRef(0);

    const fetchData = useCallback((): Promise<T | undefined> => {
        const id = ++latest.current;
        return load().then(
            (result) => {
                if (id === latest.current) {
                    setData(result);
                    setLoading(false);
                }
                return result;
            },
            (err: unknown) => {
                if (id === latest.current) {
                    setError(errorMessage(err));
                    setLoading(false);
                }
                return undefined;
            },
        );
    }, [load]);

    /** Loads again; resolves to what this request returned, or undefined if it failed. */
    const refresh = useCallback(() => {
        setLoading(true);
        setError(null);
        return fetchData();
    }, [fetchData]);

    useEffect(() => {
        void fetchData();
    }, [fetchData]);

    return { data, setData, loading, error, refresh };
}
