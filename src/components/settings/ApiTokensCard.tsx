'use client';

import { useState, type FormEvent } from 'react';
import { FormAlert, TextField } from '@/components/forms/Fields';
import { useResource } from '@/hooks/useResource';
import { useSubmit } from '@/hooks/useSubmit';
import type { Notify } from '@/hooks/useToast';
import * as api from '@/lib/api';
import { formatDate, mcpAddCommand, workspaceError } from '@/lib/workspace';
import type { ApiToken, CreatedApiToken } from '@/types';
import { CopyField } from './CopyButton';
import { ConfirmButton, EmptyState, ListSkeleton, LoadError, SettingsCard } from './SettingsCard';

type Props = { notify: Notify };

export default function ApiTokensCard({ notify }: Props) {
    const { data: tokens, setData, loading, error, refresh } = useResource<ApiToken[]>(api.listTokens, []);
    const [name, setName] = useState('');
    const [created, setCreated] = useState<CreatedApiToken | null>(null);
    const [revokingId, setRevokingId] = useState<number | null>(null);
    const { submitting, errors, message, run } = useSubmit(workspaceError);

    const create = async (event: FormEvent) => {
        event.preventDefault();
        const ok = await run(async () => {
            const token = await api.createToken({ name: name.trim() });
            setCreated(token);
            // The create response has no timestamps; the token was created just now.
            setData((prev) => [
                ...prev,
                { id: token.id, name: token.name, last_used_at: null, created_at: new Date().toISOString() },
            ]);
        });
        if (ok) {
            setName('');
            notify('success', 'Token created');
        }
    };

    const revoke = async (token: ApiToken) => {
        setRevokingId(token.id);
        try {
            await api.revokeToken(token.id);
            setData((prev) => prev.filter((t) => t.id !== token.id));
            setCreated((current) => (current?.id === token.id ? null : current));
            notify('success', `Token "${token.name}" revoked`);
        } catch (err) {
            notify('error', workspaceError(err));
        } finally {
            setRevokingId(null);
        }
    };

    return (
        <SettingsCard
            title="API tokens"
            description="Personal tokens let MCP clients such as Claude Code use the API on your behalf."
        >
            <form onSubmit={create} className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <TextField
                    label="Token name"
                    name="name"
                    required
                    placeholder="e.g. Claude Code on my laptop"
                    value={name}
                    onChange={setName}
                    errors={errors.name}
                />
                <button type="submit" className="btn btn-primary" disabled={submitting || name.trim() === ''}>
                    {submitting ? <span className="loading loading-spinner loading-sm" /> : 'Create token'}
                </button>
            </form>
            <FormAlert message={message} />
            {created && (
                <div role="alert" className="flex flex-col gap-3 rounded-box border border-warning/50 bg-warning/10 p-3 text-sm">
                    <p>
                        <strong>Copy your new token now.</strong> For security it will not be shown again.
                    </p>
                    <CopyField value={created.token} label="API token" />
                    <p>Connect Claude Code by running:</p>
                    <CopyField value={mcpAddCommand(created.token)} label="Claude Code MCP command" />
                    <div>
                        <button type="button" className="btn btn-outline btn-sm" onClick={() => setCreated(null)}>
                            I have copied it
                        </button>
                    </div>
                </div>
            )}
            {loading ? (
                <ListSkeleton rows={2} />
            ) : error ? (
                <LoadError message={error} onRetry={() => void refresh()} />
            ) : tokens.length === 0 ? (
                <EmptyState>No API tokens yet. Create one above to connect an MCP client.</EmptyState>
            ) : (
                <div className="overflow-x-auto">
                    <table className="table table-sm">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Created</th>
                                <th>Last used</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tokens.map((token) => (
                                <tr key={token.id}>
                                    <td className="font-medium">{token.name}</td>
                                    <td className="whitespace-nowrap">{formatDate(token.created_at)}</td>
                                    <td className="whitespace-nowrap">
                                        {token.last_used_at ? formatDate(token.last_used_at, true) : 'Never'}
                                    </td>
                                    <td className="text-right">
                                        <ConfirmButton
                                            label="Revoke"
                                            busy={revokingId === token.id}
                                            onConfirm={() => void revoke(token)}
                                        />
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
