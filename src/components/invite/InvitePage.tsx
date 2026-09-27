'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import AuthCard from '@/components/auth/AuthCard';
import { FormAlert, TextField } from '@/components/forms/Fields';
import { useSubmit } from '@/hooks/useSubmit';
import * as api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { formatDate, invitationError } from '@/lib/workspace';
import type { InvitationPreview } from '@/types';

const EMPTY = { name: '', password: '', password_confirmation: '' };

const FOOTER = (
    <>
        Already have an account?{' '}
        <Link href="/login" className="link link-primary">
            Sign in
        </Link>
    </>
);

/** Public page behind an invitation link: previews the invite and creates the account. */
export default function InvitePage({ token }: { token: string }) {
    const { acceptInvitation, user } = useAuth();
    const router = useRouter();
    const [preview, setPreview] = useState<InvitationPreview | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [form, setForm] = useState(EMPTY);
    const { submitting, errors, message, run } = useSubmit(invitationError);

    useEffect(() => {
        let cancelled = false;
        setPreview(null);
        setLoadError(null);
        api.getInvitation(token)
            .then((data) => {
                if (!cancelled) setPreview(data);
            })
            .catch((err: unknown) => {
                if (!cancelled) setLoadError(invitationError(err));
            });
        return () => {
            cancelled = true;
        };
    }, [token]);

    const field = (key: keyof typeof EMPTY) => ({
        name: key,
        value: form[key],
        onChange: (value: string) => setForm((prev) => ({ ...prev, [key]: value })),
        errors: errors[key],
    });

    const onSubmit = async (event: FormEvent) => {
        event.preventDefault();
        if (await run(() => acceptInvitation(token, form))) router.replace('/');
    };

    if (loadError) {
        return (
            <AuthCard title="Invitation not found" footer={FOOTER}>
                <p className="text-sm text-base-content/70">{loadError}</p>
            </AuthCard>
        );
    }

    if (!preview) {
        return (
            <AuthCard title="Loading invitation…" footer={FOOTER}>
                <div className="flex flex-col gap-3" aria-busy="true">
                    <div className="skeleton h-5 w-3/4" />
                    <div className="skeleton h-12 w-full" />
                    <div className="skeleton h-12 w-full" />
                </div>
            </AuthCard>
        );
    }

    if (preview.status !== 'pending') {
        const expired = preview.status === 'expired';
        return (
            <AuthCard title={expired ? 'Invitation expired' : 'Invitation already used'} footer={FOOTER}>
                <p className="text-sm text-base-content/70">
                    {expired
                        ? `This invitation to ${preview.workspace.name} expired on ${formatDate(preview.expires_at, true)}. Ask ${
                              preview.invited_by ?? 'a workspace owner'
                          } to send a new one.`
                        : `This invitation to ${preview.workspace.name} has already been accepted. Sign in to continue.`}
                </p>
            </AuthCard>
        );
    }

    return (
        <AuthCard title="Join workspace" footer={FOOTER}>
            <p className="text-sm text-base-content/70">
                You have been invited to join <strong>{preview.workspace.name}</strong> as{' '}
                <strong>{preview.email}</strong>
                {preview.invited_by ? ` by ${preview.invited_by}` : ''}. This link expires on{' '}
                {formatDate(preview.expires_at, true)}.
            </p>
            {user && (
                <div role="note" className="alert alert-info py-2 text-sm">
                    <span>
                        You are signed in as {user.email}. Accepting creates a separate account for {preview.email} and
                        signs you in with it; your current account is not affected. Log out first if you would rather
                        keep this session.
                    </span>
                </div>
            )}
            <form onSubmit={onSubmit} className="flex flex-col gap-3">
                <TextField label="Name" autoComplete="name" required autoFocus {...field('name')} />
                <TextField label="Password" type="password" autoComplete="new-password" required {...field('password')} />
                <TextField
                    label="Confirm password"
                    type="password"
                    autoComplete="new-password"
                    required
                    {...field('password_confirmation')}
                />
                <FormAlert message={message} />
                <button type="submit" className="btn btn-primary mt-2" disabled={submitting}>
                    {submitting ? <span className="loading loading-spinner loading-sm" /> : 'Accept invitation'}
                </button>
            </form>
        </AuthCard>
    );
}
