'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import AuthCard from '@/components/auth/AuthCard';
import { FormAlert, TextField } from '@/components/forms/Fields';
import { useSubmit } from '@/hooks/useSubmit';
import { useAuth } from '@/lib/auth';

export default function LoginPage() {
    const { login, user, loading } = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { submitting, errors, message, run } = useSubmit();

    // Already signed in (or just signed in): go to the board.
    useEffect(() => {
        if (!loading && user) router.replace('/');
    }, [loading, user, router]);

    const onSubmit = (event: FormEvent) => {
        event.preventDefault();
        void run(() => login({ email, password }));
    };

    return (
        <AuthCard
            title="Sign in"
            footer={
                <>
                    No account yet?{' '}
                    <Link href="/register" className="link link-primary">
                        Create one
                    </Link>
                </>
            }
        >
            <form onSubmit={onSubmit} className="flex flex-col gap-3">
                <TextField
                    label="Email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={setEmail}
                    errors={errors.email}
                />
                <TextField
                    label="Password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={setPassword}
                    errors={errors.password}
                />
                <FormAlert message={message} />
                <button type="submit" className="btn btn-primary mt-2" disabled={submitting}>
                    {submitting ? <span className="loading loading-spinner loading-sm" /> : 'Sign in'}
                </button>
            </form>
        </AuthCard>
    );
}
