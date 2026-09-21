'use client';

import { useState, type ReactNode } from 'react';

type CardProps = { title: string; description?: string; children: ReactNode };

/** One section of the settings page. */
export function SettingsCard({ title, description, children }: CardProps) {
    return (
        <section className="card bg-base-100 shadow-sm" aria-label={title}>
            <div className="card-body gap-3 p-4 sm:p-6">
                <h2 className="card-title">{title}</h2>
                {description && <p className="-mt-1 text-sm text-base-content/70">{description}</p>}
                {children}
            </div>
        </section>
    );
}

export function ListSkeleton({ rows = 3 }: { rows?: number }) {
    return (
        <div className="flex flex-col gap-2" aria-busy="true" aria-label="Loading">
            {Array.from({ length: rows }, (_, i) => (
                <div key={i} className="skeleton h-10 w-full" />
            ))}
        </div>
    );
}

export function EmptyState({ children }: { children: ReactNode }) {
    return (
        <p className="rounded-box border border-dashed border-base-300 p-6 text-center text-sm text-base-content/60">
            {children}
        </p>
    );
}

export function LoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
    return (
        <div role="alert" className="alert alert-error">
            <span>{message}</span>
            <button type="button" className="btn btn-sm" onClick={onRetry}>
                Retry
            </button>
        </div>
    );
}

type ConfirmProps = { label: string; busy?: boolean; onConfirm: () => void };

/** A small destructive action that asks "Sure?" inline before running. */
export function ConfirmButton({ label, busy = false, onConfirm }: ConfirmProps) {
    const [open, setOpen] = useState(false);

    if (!open) {
        return (
            <button type="button" className="btn btn-ghost btn-xs" onClick={() => setOpen(true)} disabled={busy}>
                {label}
            </button>
        );
    }
    return (
        <span className="inline-flex items-center gap-1">
            <span className="text-xs">Sure?</span>
            <button
                type="button"
                className="btn btn-error btn-xs"
                onClick={() => {
                    setOpen(false);
                    onConfirm();
                }}
                disabled={busy}
            >
                {busy ? <span className="loading loading-spinner loading-xs" /> : 'Yes'}
            </button>
            <button type="button" className="btn btn-ghost btn-xs" onClick={() => setOpen(false)} disabled={busy}>
                No
            </button>
        </span>
    );
}
