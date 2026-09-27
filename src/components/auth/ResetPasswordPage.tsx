'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import AuthCard from '@/components/auth/AuthCard';
import { FormAlert, TextField } from '@/components/forms/Fields';
import { useSubmit } from '@/hooks/useSubmit';
import * as api from '@/lib/api';

const EMPTY = { password: '', password_confirmation: '' };

const SIGN_IN_FOOTER = (
    <>
        Remembered your password?{' '}
        <Link href="/login" className="link link-primary">
            Sign in
        </Link>
    </>
);

/** The email is fixed by the link, so the field is read-only. */
const keepEmail = () => {};

/** Page behind the emailed reset link: `?token=…&email=…`. */
export default function ResetPasswordPage() {
    const params = useSearchParams();
    const token = params.get('token') ?? '';
    const email = params.get('email') ?? '';
    const [form, setForm] = useState(EMPTY);
    const [done, setDone] = useState(false);
    const { submitting, errors, message, run } = useSubmit();

    const field = (key: keyof typeof EMPTY) => ({
        name: key,
        value: form[key],
        onChange: (value: string) => setForm((prev) => ({ ...prev, [key]: value })),
        errors: errors[key],
    });

    const onSubmit = async (event: FormEvent) => {
        event.preventDefault();
        if (await run(() => api.resetPassword({ token, email, ...form }))) setDone(true);
    };

    if (!token || !email) {
        return (
            <AuthCard title="This reset link is not valid" footer={SIGN_IN_FOOTER}>
                <p className="text-sm text-base-content/70">
                    The link is missing part of its address, which usually means the email client cut it short. Request a
                    fresh one and open it directly from the email.
                </p>
                <Link href="/forgot-password" className="btn btn-primary mt-2">
                    Request a new link
                </Link>
            </AuthCard>
        );
    }

    if (done) {
        return (
            <AuthCard title="Password updated" footer={SIGN_IN_FOOTER}>
                <div role="status" className="alert alert-success py-2 text-sm">
                    <span>Your password has been changed.</span>
                </div>
                <p className="text-sm text-base-content/70">
                    For safety every other session was signed out, so sign in again with your new password.
                </p>
                <Link href="/login" className="btn btn-primary mt-2">
                    Sign in
                </Link>
            </AuthCard>
        );
    }

    // A bad or expired token comes back as an error on a field the form does not own.
    const linkErrors = [...(errors.token ?? []), ...(errors.email ?? [])];

    return (
        <AuthCard title="Choose a new password" footer={SIGN_IN_FOOTER}>
            <form onSubmit={onSubmit} className="flex flex-col gap-3">
                <TextField
                    label="Email"
                    name="email"
                    type="email"
                    autoComplete="username"
                    readOnly
                    value={email}
                    onChange={keepEmail}
                />
                <TextField
                    label="New password"
                    type="password"
                    autoComplete="new-password"
                    required
                    autoFocus
                    minLength={8}
                    {...field('password')}
                />
                <TextField
                    label="Confirm new password"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    {...field('password_confirmation')}
                />
                <p className="text-xs text-base-content/60">Use at least 8 characters.</p>
                {linkErrors.length > 0 ? (
                    <div role="alert" className="alert alert-error py-2 text-sm">
                        <span>
                            {linkErrors.join(' ')}{' '}
                            <Link href="/forgot-password" className="link">
                                Request a new link
                            </Link>
                            .
                        </span>
                    </div>
                ) : (
                    <FormAlert message={message} />
                )}
                <button type="submit" className="btn btn-primary mt-2" disabled={submitting}>
                    {submitting ? <span className="loading loading-spinner loading-sm" /> : 'Save new password'}
                </button>
            </form>
        </AuthCard>
    );
}
