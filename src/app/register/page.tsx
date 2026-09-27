'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import AuthCard from '@/components/auth/AuthCard';
import { FormAlert, TextField } from '@/components/forms/Fields';
import { useSubmit } from '@/hooks/useSubmit';
import { useAuth } from '@/lib/auth';

const EMPTY = { name: '', email: '', password: '', password_confirmation: '', workspace_name: '' };

export default function RegisterPage() {
    const { register, user, loading } = useAuth();
    const router = useRouter();
    const [form, setForm] = useState(EMPTY);
    const { submitting, errors, message, run } = useSubmit();

    useEffect(() => {
        if (!loading && user) router.replace('/');
    }, [loading, user, router]);

    const field = (key: keyof typeof EMPTY) => ({
        name: key,
        value: form[key],
        onChange: (value: string) => setForm((prev) => ({ ...prev, [key]: value })),
        errors: errors[key],
    });

    const onSubmit = (event: FormEvent) => {
        event.preventDefault();
        const { workspace_name, ...rest } = form;
        void run(() => register({ ...rest, workspace_name: workspace_name.trim() || undefined }));
    };

    return (
        <AuthCard
            title="Create an account"
            footer={
                <>
                    Already registered?{' '}
                    <Link href="/login" className="link link-primary">
                        Sign in
                    </Link>
                </>
            }
        >
            <form onSubmit={onSubmit} className="flex flex-col gap-3">
                <TextField label="Name" autoComplete="name" required {...field('name')} />
                <TextField label="Email" type="email" autoComplete="email" required {...field('email')} />
                <TextField
                    label="Password"
                    type="password"
                    autoComplete="new-password"
                    required
                    {...field('password')}
                />
                <TextField
                    label="Confirm password"
                    type="password"
                    autoComplete="new-password"
                    required
                    {...field('password_confirmation')}
                />
                <TextField
                    label="Workspace name (optional)"
                    placeholder="e.g. Acme Inc."
                    {...field('workspace_name')}
                />
                <FormAlert message={message} />
                <button type="submit" className="btn btn-primary mt-2" disabled={submitting}>
                    {submitting ? <span className="loading loading-spinner loading-sm" /> : 'Create account'}
                </button>
            </form>
        </AuthCard>
    );
}
