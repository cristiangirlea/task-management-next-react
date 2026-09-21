'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import AuthCard from '@/components/auth/AuthCard';
import { FormAlert, TextField } from '@/components/forms/Fields';
import { useSubmit } from '@/hooks/useSubmit';
import * as api from '@/lib/api';

const FOOTER = (
    <>
        Remembered it?{' '}
        <Link href="/login" className="link link-primary">
            Sign in
        </Link>
    </>
);

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);
    const { submitting, errors, message, run } = useSubmit();

    const onSubmit = async (event: FormEvent) => {
        event.preventDefault();
        if (await run(() => api.forgotPassword({ email }))) setSent(true);
    };

    // The API answers the same way for known and unknown addresses, and so does this panel.
    if (sent) {
        return (
            <AuthCard title="Check your inbox" footer={FOOTER}>
                <div role="status" className="alert alert-success py-2 text-sm">
                    <span>If an account exists for that address, we’ve sent a reset link.</span>
                </div>
                <p className="text-sm text-base-content/70">
                    The link is only valid for a short while. If nothing arrives, look in your spam folder or{' '}
                    <button type="button" className="link link-primary" onClick={() => setSent(false)}>
                        try another address
                    </button>
                    .
                </p>
            </AuthCard>
        );
    }

    return (
        <AuthCard title="Reset your password" footer={FOOTER}>
            <p className="text-sm text-base-content/70">
                Enter the address you signed up with and we will email you a link to choose a new password.
            </p>
            <form onSubmit={onSubmit} className="flex flex-col gap-3">
                <TextField
                    label="Email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    autoFocus
                    value={email}
                    onChange={setEmail}
                    errors={errors.email}
                />
                <FormAlert message={message} />
                <button type="submit" className="btn btn-primary mt-2" disabled={submitting}>
                    {submitting ? <span className="loading loading-spinner loading-sm" /> : 'Email me a reset link'}
                </button>
            </form>
        </AuthCard>
    );
}
