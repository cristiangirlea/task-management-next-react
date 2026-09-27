'use client';

import { useState, type FormEvent } from 'react';
import { FormAlert, TextField } from '@/components/forms/Fields';
import { useResource } from '@/hooks/useResource';
import { useSubmit } from '@/hooks/useSubmit';
import type { Notify } from '@/hooks/useToast';
import * as api from '@/lib/api';
import { workspaceError } from '@/lib/workspace';
import type { Tenant } from '@/types';
import { ListSkeleton, LoadError, SettingsCard } from './SettingsCard';

type Props = { isOwner: boolean; notify: Notify };

export default function WorkspaceCard({ isOwner, notify }: Props) {
    const { data: tenant, setData, loading, error, refresh } = useResource<Tenant | null>(api.getTenant, null);
    const [editing, setEditing] = useState(false);
    const [name, setName] = useState('');
    const { submitting, errors, message, run, reset } = useSubmit(workspaceError);

    const startEditing = () => {
        setName(tenant?.name ?? '');
        setEditing(true);
    };

    const cancel = () => {
        setEditing(false);
        reset();
    };

    const submit = async (event: FormEvent) => {
        event.preventDefault();
        const ok = await run(async () => setData(await api.updateTenant({ name: name.trim() })));
        if (ok) {
            setEditing(false);
            notify('success', 'Workspace renamed');
        }
    };

    return (
        <SettingsCard title="Workspace" description="The workspace everyone on this account shares.">
            {loading ? (
                <ListSkeleton rows={1} />
            ) : error ? (
                <LoadError message={error} onRetry={() => void refresh()} />
            ) : tenant && editing ? (
                <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row sm:items-end">
                    <TextField
                        label="Workspace name"
                        name="name"
                        required
                        autoFocus
                        value={name}
                        onChange={setName}
                        errors={errors.name}
                    />
                    <div className="flex gap-2">
                        <button type="submit" className="btn btn-primary" disabled={submitting || name.trim() === ''}>
                            {submitting ? <span className="loading loading-spinner loading-sm" /> : 'Save'}
                        </button>
                        <button type="button" className="btn btn-ghost" onClick={cancel} disabled={submitting}>
                            Cancel
                        </button>
                    </div>
                </form>
            ) : (
                tenant && (
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-lg font-medium">{tenant.name}</p>
                            <p className="text-xs text-base-content/60">Slug: {tenant.slug}</p>
                        </div>
                        {isOwner ? (
                            <button type="button" className="btn btn-outline btn-sm" onClick={startEditing}>
                                Rename
                            </button>
                        ) : (
                            <span className="text-xs text-base-content/60">Only workspace owners can rename it.</span>
                        )}
                    </div>
                )
            )}
            {editing && <FormAlert message={message} />}
        </SettingsCard>
    );
}
