'use client';

import { useSearchParams } from 'next/navigation';
import { useCallback, useState } from 'react';
import AuthCard from '@/components/auth/AuthCard';
import AuthCardSkeleton from '@/components/auth/AuthCardSkeleton';
import { FormAlert } from '@/components/forms/Fields';
import { useResource } from '@/hooks/useResource';
import * as api from '@/lib/api';
import { ApiError, errorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { signInPath } from '@/lib/redirect';
import type { OAuthAuthorization } from '@/types';

const EXPIRED = 'This request has expired or was already answered. Start connecting again from the app.';

/** For an answer: the request may have expired, or been answered in another tab. */
function consentError(error: unknown): string {
    return error instanceof ApiError && error.status === 404 ? EXPIRED : errorMessage(error);
}

/**
 * An MCP client (Claude, Cursor, …) asks to use Task Board as the signed-in
 * person. The API checked the request and sent the browser here with its id;
 * the answer sends it back to the client.
 */
export default function ConsentPage() {
    const id = useSearchParams().get('request') ?? '';
    const { user, logout } = useAuth();
    const load = useCallback(
        () => (id ? api.getOAuthAuthorization(id) : Promise.reject(new ApiError(404, EXPIRED))),
        [id],
    );
    const { data: request, loading, error } = useResource<OAuthAuthorization | null>(load, null);
    const [answering, setAnswering] = useState<'allow' | 'deny' | null>(null);
    const [answerError, setAnswerError] = useState<string | null>(null);
    // Denied without a way back to the client: nothing left but to say so.
    const [closed, setClosed] = useState(false);

    const answer = async (choice: 'allow' | 'deny') => {
        setAnswering(choice);
        setAnswerError(null);
        try {
            const { redirect_url } =
                choice === 'allow' ? await api.approveOAuthAuthorization(id) : await api.denyOAuthAuthorization(id);
            if (redirect_url) {
                // Stays busy: the browser is leaving for the client.
                window.location.assign(redirect_url);
                return;
            }
            setClosed(true);
        } catch (err) {
            setAnswerError(consentError(err));
        }
        setAnswering(null);
    };

    if (loading) return <AuthCardSkeleton title="Allow access" rows={3} />;

    const switchAccount = (
        <button type="button" className="link link-primary" onClick={() => void logout(signInPath())}>
            Use a different account
        </button>
    );

    if (error || !request) {
        return (
            <AuthCard title="Allow access" footer={switchAccount}>
                <FormAlert message={error ?? EXPIRED} />
            </AuthCard>
        );
    }

    if (closed) {
        return (
            <AuthCard title="Access denied" footer={null}>
                <p className="text-sm">{request.client.name} was not given access. You can close this window.</p>
            </AuthCard>
        );
    }

    const { client, scopes } = request;

    return (
        <AuthCard title={`Allow ${client.name}?`} footer={switchAccount}>
            <p className="text-sm">
                <strong>{client.name}</strong> wants to use Task Board as you ({user?.email})
                {user?.tenant ? (
                    <>
                        , in <strong>{user.tenant.name}</strong>
                    </>
                ) : null}
                .
            </p>
            {scopes.length > 0 && (
                <div className="text-sm">
                    <p>It will be able to:</p>
                    <ul className="ml-5 list-disc">
                        {scopes.map((scope) => (
                            <li key={scope.id}>{scope.description}</li>
                        ))}
                    </ul>
                </div>
            )}
            {client.redirect_host && (
                <p className="text-sm text-base-content/70">
                    Afterwards you go back to <strong className="break-all">{client.redirect_host}</strong>. Only allow
                    it if you started connecting this app yourself.
                </p>
            )}
            <FormAlert message={answerError} />
            <div className="mt-2 flex gap-2">
                <button
                    type="button"
                    className="btn btn-primary flex-1"
                    onClick={() => void answer('allow')}
                    disabled={answering !== null}
                >
                    {answering === 'allow' ? <span className="loading loading-spinner loading-sm" /> : 'Allow'}
                </button>
                <button
                    type="button"
                    className="btn btn-ghost flex-1"
                    onClick={() => void answer('deny')}
                    disabled={answering !== null}
                >
                    {answering === 'deny' ? <span className="loading loading-spinner loading-sm" /> : 'Deny'}
                </button>
            </div>
            <p className="text-xs text-base-content/60">You can disconnect it at any time in Settings.</p>
        </AuthCard>
    );
}
