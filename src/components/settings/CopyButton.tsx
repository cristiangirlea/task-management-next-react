'use client';

import { useEffect, useRef, useState } from 'react';
import { copyText, selectContents } from '@/lib/clipboard';

type Status = 'idle' | 'copied' | 'failed';

/** Copies `text`; briefly reports the outcome on the button itself. */
export function CopyButton({
    text,
    label = 'Copy',
    className = 'btn btn-outline btn-sm',
    onFail,
}: {
    text: string;
    label?: string;
    className?: string;
    onFail?: () => void;
}) {
    const [status, setStatus] = useState<Status>('idle');

    useEffect(() => {
        if (status === 'idle') return;
        const timer = window.setTimeout(() => setStatus('idle'), 2500);
        return () => window.clearTimeout(timer);
    }, [status]);

    const copy = async () => {
        const ok = await copyText(text);
        setStatus(ok ? 'copied' : 'failed');
        if (!ok) onFail?.();
    };

    return (
        <button type="button" className={`${className} shrink-0`} onClick={() => void copy()} aria-live="polite">
            {status === 'copied' ? 'Copied' : status === 'failed' ? 'Copy failed' : label}
        </button>
    );
}

/**
 * A read-only value shown in a code block next to a copy button. When the
 * clipboard is unavailable the text is selected so it can be copied by hand.
 */
export function CopyField({ value, label }: { value: string; label: string }) {
    const ref = useRef<HTMLElement>(null);
    return (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
            <code
                ref={ref}
                aria-label={label}
                className="min-w-0 flex-1 overflow-x-auto whitespace-pre-wrap break-all rounded-box bg-base-200 px-3 py-2 text-xs sm:text-sm"
            >
                {value}
            </code>
            <CopyButton text={value} onFail={() => selectContents(ref.current)} />
        </div>
    );
}
