'use client';

import Toast from '@/components/Toast';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/lib/auth';
import ApiTokensCard from './ApiTokensCard';
import InvitationsCard from './InvitationsCard';
import MembersCard from './MembersCard';
import WorkspaceCard from './WorkspaceCard';

export default function SettingsPage() {
    const { user } = useAuth();
    const { toast, show, dismiss } = useToast();

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
            <MembersCard user={user} notify={show} />
            <InvitationsCard isOwner={isOwner} notify={show} />
            <ApiTokensCard notify={show} />
            <Toast toast={toast} onDismiss={dismiss} />
        </div>
    );
}
