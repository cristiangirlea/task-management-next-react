'use client';

import Toast from '@/components/Toast';
import { useResource } from '@/hooks/useResource';
import { useToast } from '@/hooks/useToast';
import * as api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { Billing } from '@/types';
import ApiTokensCard from './ApiTokensCard';
import BillingCard from './BillingCard';
import InvitationsCard from './InvitationsCard';
import MembersCard from './MembersCard';
import WorkspaceCard from './WorkspaceCard';

export default function SettingsPage() {
    const { user } = useAuth();
    const { toast, show, dismiss } = useToast();
    // Shared: the billing card shows the plan, the members card the seat count.
    const billing = useResource<Billing | null>(api.getBilling, null);

    // RequireAuth only renders this once there is a user.
    if (!user) return null;
    const isOwner = user.role === 'owner';

    return (
        <div className="flex flex-col gap-4">
            <div>
                <h1 className="text-2xl font-bold">Settings</h1>
                <p className="text-sm text-base-content/70">
                    You are {isOwner ? 'an owner' : 'a member'} of this workspace.
                </p>
            </div>
            <WorkspaceCard isOwner={isOwner} notify={show} />
            <BillingCard
                billing={billing.data}
                loading={billing.loading}
                error={billing.error}
                refresh={billing.refresh}
                notify={show}
            />
            <MembersCard user={user} notify={show} seatLimit={billing.data?.seats.limit} onChange={billing.refresh} />
            <InvitationsCard isOwner={isOwner} notify={show} onChange={billing.refresh} />
            <ApiTokensCard notify={show} />
            <Toast toast={toast} onDismiss={dismiss} />
        </div>
    );
}
