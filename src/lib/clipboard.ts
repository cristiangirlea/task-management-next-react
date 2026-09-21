/**
 * Copies `text` to the clipboard. Uses the async Clipboard API when the page
 * is allowed to (secure context, permission granted) and otherwise falls back
 * to selecting the text in an off-screen textarea and running the legacy copy
 * command. Resolves to whether the copy is believed to have worked.
 */
export async function copyText(text: string): Promise<boolean> {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch {
            // Fall through to the selection-based copy.
        }
    }
    return legacyCopy(text);
}

function legacyCopy(text: string): boolean {
    if (typeof document === 'undefined') return false;
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.setAttribute('aria-hidden', 'true');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    let copied = false;
    try {
        copied = document.execCommand('copy');
    } catch {
        copied = false;
    }
    document.body.removeChild(area);
    return copied;
}

/** Highlights the contents of `element` so the user can copy them manually. */
export function selectContents(element: HTMLElement | null): void {
    if (!element || typeof window === 'undefined') return;
    const selection = window.getSelection();
    if (!selection) return;
    const range = document.createRange();
    range.selectNodeContents(element);
    selection.removeAllRanges();
    selection.addRange(range);
}
