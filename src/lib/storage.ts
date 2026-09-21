/**
 * Thin, SSR-safe wrappers around localStorage and sessionStorage. Every access
 * is guarded so server rendering, private windows and blocked storage never throw.
 */
export const TOKEN_KEY = 'tm.token';
export const PROJECT_KEY = 'tm.projectId';
/** Set once the unverified-email banner is dismissed; only for the current tab. */
export const VERIFY_BANNER_KEY = 'tm.verifyBannerDismissed';

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

/** Same guards, but the value is forgotten when the tab is closed. */
export function readSession(key: string): string | null {
    if (typeof window === 'undefined') return null;
    try {
        return window.sessionStorage.getItem(key);
    } catch {
        return null;
    }
}

export function writeSession(key: string, value: string | null): void {
    if (typeof window === 'undefined') return;
    try {
        if (value === null) window.sessionStorage.removeItem(key);
        else window.sessionStorage.setItem(key, value);
    } catch {
        // Storage unavailable; the banner simply comes back on the next page load.
    }
}
