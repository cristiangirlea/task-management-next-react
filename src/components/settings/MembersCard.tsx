'use client';

import { useState } from 'react';
import { useResource } from '@/hooks/useResource';
import type { Notify } from '@/hooks/useToast';
import * as api from '@/lib/api';
import { formatDate, workspaceError } from '@/lib/workspace';
import type { Member, Role, User } from '@/types';
import { ConfirmButton, EmptyState, ListSkeleton, LoadError, SettingsCard } from './SettingsCard';

type Props = { user: User; notify: Notify };

export function RoleBadge({ role }: { role: Role }) {
    return <span className={`badge badge-sm ${role === 'owner' ? 'badge-primary' : 'badge-ghost'}`}>{role}</span>;
}

export default function MembersCard({ user, notify }: Props) {
    const { data: members, setData, loading, error, refresh } = useResource<Member[]>(api.listMembers, []);
    const [removingId, setRemovingId] = useState<number | null>(null);
    const isOwner = user.role === 'owner';

    const remove = async (member: Member) => {
        setRemovingId(member.id);
        try {
            await api.removeMember(member.id);
            setData((prev) => prev.filter((m) => m.id !== member.id));
            notify('success', `${member.name} was removed from the workspace`);
        } catch (err) {
            notify('error', workspaceError(err));
        } finally {
            setRemovingId(null);
        }
    };

    // Owners cannot be removed, and nobody can remove themselves.
    const canRemove = (member: Member) => isOwner && member.role !== 'owner' && member.id !== user.id;

    return (
        <SettingsCard title="Members" description="Everyone who can sign in to this workspace.">
            {loading ? (
                <ListSkeleton />
            ) : error ? (
                <LoadError message={error} onRetry={() => void refresh()} />
            ) : members.length === 0 ? (
                <EmptyState>No members yet.</EmptyState>
            ) : (
                <div className="overflow-x-auto">
                    <table className="table table-sm">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Joined</th>
                                {isOwner && <th className="text-right">Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {members.map((member) => (
                                <tr key={member.id}>
                                    <td className="font-medium">
                                        {member.name}
                                        {member.id === user.id && (
                                            <span className="ml-1 text-xs font-normal text-base-content/60">(you)</span>
                                        )}
                                    </td>
                                    <td>{member.email}</td>
                                    <td>
                                        <RoleBadge role={member.role} />
                                    </td>
                                    <td className="whitespace-nowrap">{formatDate(member.created_at)}</td>
                                    {isOwner && (
                                        <td className="text-right">
                                            {canRemove(member) && (
                                                <ConfirmButton
                                                    label="Remove"
                                                    busy={removingId === member.id}
                                                    onConfirm={() => void remove(member)}
                                                />
                                            )}
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </SettingsCard>
    );
}
