/**
 * Where to go after signing in: the page that sent the visitor to sign in
 * (`?next=`) when it is on this site, otherwise the board. Anything that
 * could leave the site ("//evil.example", "https://…", "/\evil") falls back
 * to "/". Browser-only: call it from effects and event handlers.
 */
export function nextPath(): string {
    const raw = new URLSearchParams(window.location.search).get('next');
    if (!raw?.startsWith('/')) return '/';
    try {
        const url = new URL(raw, window.location.origin);
        return url.origin === window.location.origin ? `${url.pathname}${url.search}${url.hash}` : '/';
    } catch {
        return '/';
    }
}

/** `path`, keeping this page's `?next=` (from sign-in to sign-up and back). */
export function withNext(path: string): string {
    const next = nextPath();
    return next === '/' ? path : `${path}?next=${encodeURIComponent(next)}`;
}

/** The sign-in page, set to come back to the current one. */
export function signInPath(): string {
    const { pathname, search } = window.location;
    // Already signing in (or up): keep the page it should come back to.
    if (pathname === '/login' || pathname === '/register') return `${pathname}${search}`;
    const here = `${pathname}${search}`;
    return here === '/' ? '/login' : `/login?next=${encodeURIComponent(here)}`;
}
