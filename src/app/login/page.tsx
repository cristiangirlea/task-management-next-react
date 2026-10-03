'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import AuthCard from '@/components/auth/AuthCard';
import { FormAlert, TextField } from '@/components/forms/Fields';
import { useSubmit } from '@/hooks/useSubmit';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function LoginPage() {
    const { login, completeTwoFactor, user, loading } = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    // Set once the password was right and the account asks for a second factor.
    const [challenge, setChallenge] = useState<string | null>(null);
    const [useRecovery, setUseRecovery] = useState(false);
    const [code, setCode] = useState('');
    // Why the second step ended and the form is back to the first one.
    const [restartReason, setRestartReason] = useState<string | null>(null);
    const { submitting, errors, message, run, reset } = useSubmit();

    // Already signed in (or just signed in): go to the board.
    useEffect(() => {
        if (!loading && user) router.replace('/');
    }, [loading, user, router]);

    const signIn = (event: FormEvent) => {
        event.preventDefault();
        setRestartReason(null);
        void run(async () => {
            const result = await login({ email, password });
            if (result) setChallenge(result.challenge);
        });
    };

    const restart = (reason: string | null) => {
        reset();
        setChallenge(null);
        setUseRecovery(false);
        setCode('');
        setPassword('');
        setRestartReason(reason);
    };

    const verify = async (event: FormEvent) => {
        event.preventDefault();
        if (!challenge) return;
        let expired: string | null = null;
        await run(async () => {
            try {
                await completeTwoFactor(challenge, useRecovery ? { recovery_code: code } : { code });
            } catch (err) {
                // An expired or exhausted challenge cannot be retried: back to the password.
                if (err instanceof ApiError && err.errors?.challenge) expired = err.errors.challenge[0];
                throw err;
            }
        });
        if (expired) restart(expired);
    };

    const toggleRecovery = () => {
        reset();
        setCode('');
        setUseRecovery((current) => !current);
    };

    if (challenge) {
        return (
            <AuthCard
                title="Two-factor authentication"
                footer={
                    <button type="button" className="link link-primary" onClick={() => restart(null)}>
                        Sign in as someone else
                    </button>
                }
            >
                <p className="text-sm text-base-content/70">
                    {useRecovery
                        ? 'Enter one of the recovery codes you saved when you turned on two-factor authentication. Each works once.'
                        : 'Enter the 6-digit code from your authenticator app.'}
                </p>
                <form onSubmit={verify} className="flex flex-col gap-3">
                    {useRecovery ? (
                        <TextField
                            key="recovery"
                            label="Recovery code"
                            name="recovery_code"
                            autoComplete="off"
                            autoFocus
                            required
                            value={code}
                            onChange={setCode}
                            errors={errors.recovery_code}
                        />
                    ) : (
                        <TextField
                            key="code"
                            label="Authentication code"
                            name="code"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            pattern="[0-9 ]*"
                            maxLength={7}
                            autoFocus
                            required
                            value={code}
                            onChange={setCode}
                            errors={errors.code}
                        />
                    )}
                    <div className="-mt-1 text-right">
                        <button type="button" className="link link-primary text-sm" onClick={toggleRecovery}>
                            {useRecovery ? 'Use your authenticator app' : 'Use a recovery code'}
                        </button>
                    </div>
                    <FormAlert message={errors.code || errors.recovery_code ? null : message} />
                    <button type="submit" className="btn btn-primary mt-2" disabled={submitting || code.trim() === ''}>
                        {submitting ? <span className="loading loading-spinner loading-sm" /> : 'Verify'}
                    </button>
                </form>
            </AuthCard>
        );
    }

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
            <form onSubmit={signIn} className="flex flex-col gap-3">
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
                <div className="-mt-1 text-right">
                    <Link href="/forgot-password" className="link link-primary text-sm">
                        Forgot your password?
                    </Link>
                </div>
                <FormAlert message={message ?? restartReason} />
                <button type="submit" className="btn btn-primary mt-2" disabled={submitting}>
                    {submitting ? <span className="loading loading-spinner loading-sm" /> : 'Sign in'}
                </button>
            </form>
        </AuthCard>
    );
}
