'use client';

import { useState, type FormEvent } from 'react';
import { FormAlert, TextField } from '@/components/forms/Fields';
import { useResource } from '@/hooks/useResource';
import { useSubmit } from '@/hooks/useSubmit';
import type { Notify } from '@/hooks/useToast';
import * as api from '@/lib/api';
import { formatDate, workspaceError } from '@/lib/workspace';
import type { Invitation } from '@/types';
import { CopyButton, CopyField } from './CopyButton';
import { ConfirmButton, EmptyState, ListSkeleton, LoadError, SettingsCard } from './SettingsCard';

type Props = { isOwner: boolean; notify: Notify };

export default function InvitationsCard({ isOwner, notify }: Props) {
    const { data: invitations, setData, loading, error, refresh } = useResource<Invitation[]>(api.listInvitations, []);
    const [email, setEmail] = useState('');
    const [created, setCreated] = useState<Invitation | null>(null);
    const [revokingId, setRevokingId] = useState<number | null>(null);
    const { submitting, errors, message, run } = useSubmit(workspaceError);

    const invite = async (event: FormEvent) => {
        event.preventDefault();
        const ok = await run(async () => {
            const invitation = await api.createInvitation({ email: email.trim() });
            setData((prev) => [...prev, invitation]);
            setCreated(invitation);
        });
        if (ok) {
            setEmail('');
            notify('success', 'Invitation sent');
        }
    };

    const revoke = async (invitation: Invitation) => {
        setRevokingId(invitation.id);
        try {
            await api.revokeInvitation(invitation.id);
            setData((prev) => prev.filter((i) => i.id !== invitation.id));
            setCreated((current) => (current?.id === invitation.id ? null : current));
            notify('success', 'Invitation revoked');
        } catch (err) {
            notify('error', workspaceError(err));
        } finally {
            setRevokingId(null);
        }
    };

    return (
        <SettingsCard title="Invitations" description="People who have been invited but have not joined yet.">
            {isOwner && (
                <form onSubmit={invite} className="flex flex-col gap-2 sm:flex-row sm:items-end">
                    <TextField
                        label="Invite by email"
                        name="email"
                        type="email"
                        required
                        placeholder="colleague@example.com"
                        value={email}
                        onChange={setEmail}
                        errors={errors.email}
                    />
                    <button type="submit" className="btn btn-primary" disabled={submitting || email.trim() === ''}>
                        {submitting ? <span className="loading loading-spinner loading-sm" /> : 'Send invite'}
                    </button>
                </form>
            )}
            {isOwner && <FormAlert message={message} />}
            {created && (
                <div className="flex flex-col gap-2 rounded-box border border-success/40 bg-success/10 p-3 text-sm">
                    <div className="flex items-start justify-between gap-2">
                        <p>
                            <strong>{created.email}</strong> has been emailed an invitation. You can also share this link
                            directly:
                        </p>
                        <button type="button" className="btn btn-ghost btn-xs" onClick={() => setCreated(null)} aria-label="Dismiss">
                            ✕
                        </button>
                    </div>
                    <CopyField value={created.accept_url} label="Invitation link" />
                </div>
            )}
            {loading ? (
                <ListSkeleton rows={2} />
            ) : error ? (
                <LoadError message={error} onRetry={() => void refresh()} />
            ) : invitations.length === 0 ? (
                <EmptyState>
                    No pending invitations.{isOwner ? ' Invite someone by email above.' : ''}
                </EmptyState>
            ) : (
                <div className="overflow-x-auto">
                    <table className="table table-sm">
                        <thead>
                            <tr>
                                <th>Email</th>
                                <th>Invited by</th>
                                <th>Expires</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invitations.map((invitation) => (
                                <tr key={invitation.id}>
                                    <td className="font-medium">{invitation.email}</td>
                                    <td>{invitation.invited_by?.name ?? '—'}</td>
                                    <td className="whitespace-nowrap">{formatDate(invitation.expires_at, true)}</td>
                                    <td className="whitespace-nowrap text-right">
                                        <CopyButton text={invitation.accept_url} label="Copy link" className="btn btn-ghost btn-xs" />
                                        {isOwner && (
                                            <ConfirmButton
                                                label="Revoke"
                                                busy={revokingId === invitation.id}
                                                onConfirm={() => void revoke(invitation)}
                                            />
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </SettingsCard>
    );
}
