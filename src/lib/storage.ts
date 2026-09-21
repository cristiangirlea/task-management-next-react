/**
 * Thin, SSR-safe wrappers around localStorage. Every access is guarded so
 * server rendering, private windows and blocked storage never throw.
 */
export const TOKEN_KEY = 'tm.token';
export const PROJECT_KEY = 'tm.projectId';

export function readStorage(key: string): string | null {
    if (typeof window === 'undefined') return null;
    try {
        return window.localStorage.getItem(key);
    } catch {
        return null;
    }
}

export function writeStorage(key: string, value: string | null): void {
    if (typeof window === 'undefined') return;
    try {
        if (value === null) window.localStorage.removeItem(key);
        else window.localStorage.setItem(key, value);
    } catch {
        // Storage unavailable; the app still works without persistence.
    }
}
