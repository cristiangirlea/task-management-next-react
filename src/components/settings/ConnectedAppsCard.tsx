'use client';

import { useState } from 'react';
import { useResource } from '@/hooks/useResource';
import type { Notify } from '@/hooks/useToast';
import * as api from '@/lib/api';
import { apiOrigin, errorMessage } from '@/lib/api';
import { formatDate } from '@/lib/workspace';
import type { OAuthConnection } from '@/types';
import { CopyField } from './CopyButton';
import { ConfirmButton, EmptyState, ListSkeleton, LoadError, SettingsCard } from './SettingsCard';

type Props = { notify: Notify };

/** MCP clients that were allowed in through OAuth, and taking that access back. */
export default function ConnectedAppsCard({ notify }: Props) {
    const { data: apps, setData, loading, error, refresh } = useResource<OAuthConnection[]>(api.listOAuthConnections, []);
    const [disconnectingId, setDisconnectingId] = useState<string | null>(null);

    const disconnect = async (app: OAuthConnection) => {
        setDisconnectingId(app.id);
        try {
            await api.disconnectOAuthConnection(app.id);
            setData((prev) => prev.filter((a) => a.id !== app.id));
            notify('success', `${app.name} disconnected`);
        } catch (err) {
            notify('error', errorMessage(err));
        } finally {
            setDisconnectingId(null);
        }
    };

    return (
        <SettingsCard
            title="Connected apps"
            description="AI assistants you allowed to use Task Board as you. To connect one, add this address as a remote MCP server in Claude, Cursor or VS Code; it opens Task Board for you to allow it."
        >
            <CopyField value={`${apiOrigin()}/mcp`} label="MCP server address" />
            {loading ? (
                <ListSkeleton rows={2} />
            ) : error ? (
                <LoadError message={error} onRetry={() => void refresh()} />
            ) : apps.length === 0 ? (
                <EmptyState>No connected apps.</EmptyState>
            ) : (
                <div className="overflow-x-auto">
                    <table className="table table-sm">
                        <thead>
                            <tr>
                                <th>App</th>
                                <th>Returns to</th>
                                <th>Connected</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {apps.map((app) => (
                                <tr key={app.id}>
                                    <td className="font-medium">{app.name}</td>
                                    <td className="break-all">{app.redirect_host ?? '—'}</td>
                                    <td className="whitespace-nowrap">{app.connected_at ? formatDate(app.connected_at) : '—'}</td>
                                    <td className="text-right">
                                        <ConfirmButton
                                            label="Disconnect"
                                            busy={disconnectingId === app.id}
                                            onConfirm={() => void disconnect(app)}
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
