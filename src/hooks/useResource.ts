'use client';

import { useCallback, useEffect, useState } from 'react';
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

    const refresh = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            setData(await load());
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setLoading(false);
        }
    }, [load]);

    useEffect(() => {
        void refresh();
    }, [refresh]);

    return { data, setData, loading, error, refresh };
}
