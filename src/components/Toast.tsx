'use client';

import type { ToastMessage } from '@/hooks/useToast';

export default function Toast({ toast, onDismiss }: { toast: ToastMessage | null; onDismiss: () => void }) {
    if (!toast) return null;
    return (
        <div className="toast toast-end z-50">
            <div role="alert" className={`alert ${toast.type === 'error' ? 'alert-error' : 'alert-success'}`}>
                <span>{toast.text}</span>
                <button type="button" className="btn btn-ghost btn-xs" onClick={onDismiss} aria-label="Dismiss">
                    ✕
                </button>
            </div>
        </div>
    );
}
