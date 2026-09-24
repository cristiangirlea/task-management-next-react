import { ApiError, apiOrigin, errorMessage } from './api';

export const OWNER_ONLY_MESSAGE = 'Only workspace owners can do this.';

/** Like `errorMessage`, but a 403 becomes a friendly owner-only notice. */
export function workspaceError(error: unknown): string {
    if (error instanceof ApiError && error.status === 403) return OWNER_ONLY_MESSAGE;
    return errorMessage(error);
}

/** Error text for the public invitation endpoints (404 unknown link, 410 no longer usable). */
export function invitationError(error: unknown): string {
    if (error instanceof ApiError) {
        if (error.status === 404) return 'This invitation link is not valid.';
        if (error.status === 410) return 'This invitation has expired or has already been accepted.';
        if (error.status === 402) {
            return 'This workspace has no free seats right now. Ask the person who invited you to free one or upgrade, then open this link again.';
        }
    }
    return errorMessage(error);
}

/** "Sep 21, 2026" or, with `withTime`, "Sep 21, 2026, 3:05 PM" in the viewer's locale. */
export function formatDate(iso: string, withTime = false): string {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;
    return date.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        ...(withTime ? { hour: 'numeric', minute: '2-digit' } : {}),
    });
}

/** "$8.00" from cents, in the viewer's locale. */
export function formatPrice(cents: number, currency: string): string {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: currency.toUpperCase() }).format(cents / 100);
}

/** Shell command that registers this API as an MCP server in Claude Code. */
export function mcpAddCommand(token: string): string {
    return `claude mcp add --transport http task-board ${apiOrigin()}/mcp --header "Authorization: Bearer ${token}"`;
}
