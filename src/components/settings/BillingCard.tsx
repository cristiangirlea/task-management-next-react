'use client';

import { useEffect, useState } from 'react';
import type { Notify } from '@/hooks/useToast';
import * as api from '@/lib/api';
import { formatDate, formatPrice, workspaceError } from '@/lib/workspace';
import type { Billing, RedirectUrl } from '@/types';
import { ListSkeleton, LoadError, SettingsCard } from './SettingsCard';

type Props = {
    billing: Billing | null;
    loading: boolean;
    error: string | null;
    /** Reloads the billing state; resolves to it, or undefined if loading failed. */
    refresh: () => Promise<Billing | null | undefined>;
    notify: Notify;
};

// Stripe confirms a new subscription through a webhook that can land a few
// seconds after the browser returns from Checkout, so poll briefly.
const CONFIRM_ATTEMPTS = 8;
const CONFIRM_INTERVAL_MS = 2000;

// After paying: polling for the webhook, or given up waiting for it. Either
// way the upgrade button stays off, so nobody pays twice.
type Confirmation = 'none' | 'confirming' | 'unconfirmed';

/** `success` or `cancel` when the browser has just come back from Stripe Checkout. */
function checkoutResult(): string | null {
    return new URLSearchParams(window.location.search).get('billing');
}

export default function BillingCard({ billing, loading, error, refresh, notify }: Props) {
    const [redirecting, setRedirecting] = useState(false);
    // This card renders only for a signed-in user, so only in the browser.
    const [confirmation, setConfirmation] = useState<Confirmation>(() =>
        checkoutResult() === 'success' ? 'confirming' : 'none',
    );

    // Say so once when Checkout was cancelled, and drop the result from the URL.
    useEffect(() => {
        const result = checkoutResult();
        if (!result) return;
        window.history.replaceState(null, '', window.location.pathname);
        if (result === 'cancel') notify('error', 'Checkout was cancelled. Nothing was charged.');
    }, [notify]);

    useEffect(() => {
        if (confirmation !== 'confirming') return;
        let stopped = false;
        let timer: number | undefined;
        const check = (attempt: number) => {
            void refresh().then((latest) => {
                if (stopped) return;
                if (latest?.plan === 'team') {
                    setConfirmation('none');
                    notify('success', 'Your workspace is now on the Team plan');
                } else if (attempt >= CONFIRM_ATTEMPTS) {
                    setConfirmation('unconfirmed');
                } else {
                    timer = window.setTimeout(() => check(attempt + 1), CONFIRM_INTERVAL_MS);
                }
            });
        };
        check(0);
        return () => {
            stopped = true;
            window.clearTimeout(timer);
        };
    }, [confirmation, refresh, notify]);

    const checkAgain = () => setConfirmation('confirming');

    const redirect = async (action: () => Promise<RedirectUrl>) => {
        setRedirecting(true);
        try {
            const { url } = await action();
            window.location.assign(url);
        } catch (err) {
            setRedirecting(false);
            notify('error', workspaceError(err));
        }
    };

    return (
        <SettingsCard id="billing" title="Plan and billing" description="Free for small teams; pay per member beyond that.">
            {!billing && loading ? (
                <ListSkeleton rows={2} />
            ) : !billing ? (
                <LoadError message={error ?? 'Could not load billing.'} onRetry={() => void refresh()} />
            ) : (
                <>
                    <PlanSummary billing={billing} />
                    {confirmation === 'confirming' && (
                        <p className="flex items-center gap-2 text-sm" role="status">
                            <span className="loading loading-spinner loading-xs" /> Payment received. Confirming your upgrade…
                        </p>
                    )}
                    {confirmation === 'unconfirmed' && (
                        <div role="alert" className="alert alert-warning py-2 text-sm">
                            <span>
                                Stripe has not confirmed your payment yet. Don&apos;t pay again: the plan changes to Team as
                                soon as the confirmation arrives.
                            </span>
                            <button type="button" className="btn btn-sm" onClick={checkAgain}>
                                Check again
                            </button>
                        </div>
                    )}
                    {billing.has_payment_problem && (
                        <div role="alert" className="alert alert-warning py-2 text-sm">
                            <span>
                                Stripe could not charge the card on file and will retry.{' '}
                                {billing.can_manage
                                    ? 'Update it under Manage billing to keep the Team plan.'
                                    : 'A workspace owner needs to update it.'}
                            </span>
                        </div>
                    )}
                    <div className="card-actions items-center">
                        {!billing.can_manage ? (
                            <p className="text-sm text-base-content/70">Ask a workspace owner to change the plan.</p>
                        ) : billing.plan === 'free' ? (
                            <button
                                type="button"
                                className="btn btn-primary"
                                disabled={redirecting || confirmation !== 'none'}
                                onClick={() => void redirect(api.startCheckout)}
                            >
                                {redirecting ? <span className="loading loading-spinner loading-sm" /> : 'Upgrade to Team'}
                            </button>
                        ) : (
                            <button
                                type="button"
                                className="btn"
                                disabled={redirecting}
                                onClick={() => void redirect(api.openBillingPortal)}
                            >
                                {redirecting ? <span className="loading loading-spinner loading-sm" /> : 'Manage billing'}
                            </button>
                        )}
                    </div>
                </>
            )}
        </SettingsCard>
    );
}

function PlanSummary({ billing }: { billing: Billing }) {
    const { seats } = billing;
    const price = formatPrice(billing.seat_price_cents, billing.currency);
    const taken = seats.used + seats.pending;
    const full = seats.limit !== null && taken >= seats.limit;

    return (
        <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
                <span className="text-lg font-semibold">{billing.plan === 'team' ? 'Team' : 'Free'}</span>
                {billing.status === 'past_due' && <span className="badge badge-warning">Payment problem</span>}
                {billing.status === 'canceled' && billing.ends_at && (
                    <span className="badge badge-ghost">Ends {formatDate(billing.ends_at)}</span>
                )}
            </div>
            <p className="text-sm text-base-content/70">
                {billing.plan === 'team'
                    ? `${price} per member per month, unlimited members. ${seats.used} ${seats.used === 1 ? 'member' : 'members'} today.`
                    : `Up to ${billing.free_seats} members, pending invitations included. Team is ${price} per member per month with no limit.`}
            </p>
            {seats.limit !== null && (
                <div className="flex flex-col gap-1">
                    <progress
                        className={`progress w-full ${full ? 'progress-warning' : 'progress-primary'}`}
                        value={taken}
                        max={seats.limit}
                        aria-label="Seats taken"
                    />
                    <span className="text-xs text-base-content/70">
                        {seats.used} of {seats.limit} seats used
                        {seats.pending > 0 && `, ${seats.pending} held by pending ${seats.pending === 1 ? 'invitation' : 'invitations'}`}
                        {full ? '. The workspace is full.' : '.'}
                    </span>
                </div>
            )}
        </div>
    );
}
