'use client';

import Image from 'next/image';
import { useState, type FormEvent } from 'react';
import { FormAlert, TextField } from '@/components/forms/Fields';
import { useSubmit } from '@/hooks/useSubmit';
import type { Notify } from '@/hooks/useToast';
import * as api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { TwoFactorSetup, User } from '@/types';
import { CopyField } from './CopyButton';
import { SettingsCard } from './SettingsCard';

type Props = { user: User; notify: Notify };

export default function TwoFactorCard({ user, notify }: Props) {
    const { updateUser } = useAuth();
    const [password, setPassword] = useState('');
    // A secret waiting for its first code; not in force until confirmed.
    const [setup, setSetup] = useState<TwoFactorSetup | null>(null);
    const [code, setCode] = useState('');
    // Shown once, right after they are made.
    const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
    const { submitting, errors, message, run, reset } = useSubmit();

    const begin = async (event: FormEvent) => {
        event.preventDefault();
        if (await run(async () => setSetup(await api.startTwoFactor(password)))) setPassword('');
    };

    const confirm = async (event: FormEvent) => {
        event.preventDefault();
        const ok = await run(async () => {
            const result = await api.confirmTwoFactor(code);
            setRecoveryCodes(result.recovery_codes);
            updateUser(result.user);
        });
        if (ok) {
            setSetup(null);
            setCode('');
            notify('success', 'Two-factor authentication is on');
        }
    };

    const cancel = () => {
        reset();
        setSetup(null);
        setCode('');
    };

    const regenerate = async () => {
        const ok = await run(async () => setRecoveryCodes((await api.regenerateRecoveryCodes(password)).recovery_codes));
        if (ok) {
            setPassword('');
            notify('success', 'New recovery codes created; the old ones no longer work');
        }
    };

    const disable = async () => {
        const ok = await run(async () => updateUser(await api.disableTwoFactor(password)));
        if (ok) {
            setPassword('');
            setRecoveryCodes(null);
            notify('success', 'Two-factor authentication is off');
        }
    };

    const passwordField = (
        <TextField
            label="Your password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={setPassword}
            errors={errors.password}
        />
    );

    return (
        <SettingsCard
            title="Two-factor authentication"
            description="Signing in also asks for a code from an authenticator app, such as Google Authenticator, 1Password or Authy."
        >
            <p className="flex items-center gap-2 text-sm">
                Status:
                {user.two_factor_enabled ? (
                    <span className="badge badge-success">On</span>
                ) : (
                    <span className="badge badge-ghost">Off</span>
                )}
            </p>

            {recoveryCodes ? (
                <div role="alert" className="flex flex-col gap-3 rounded-box border border-warning/50 bg-warning/10 p-3 text-sm">
                    <p>
                        <strong>Save these recovery codes now.</strong> If you lose your phone, each one signs you in once.
                        They will not be shown again.
                    </p>
                    <CopyField value={recoveryCodes.join('\n')} label="Recovery codes" />
                    <div>
                        <button type="button" className="btn btn-outline btn-sm" onClick={() => setRecoveryCodes(null)}>
                            I have saved them
                        </button>
                    </div>
                </div>
            ) : setup ? (
                <div className="flex flex-col gap-3">
                    <p className="text-sm">
                        Scan this QR code with your authenticator app, or type in the key below. Then enter the 6-digit code
                        it shows.
                    </p>
                    <Image
                        src={setup.qr_code}
                        alt="QR code that adds Task Board to an authenticator app"
                        width={192}
                        height={192}
                        unoptimized
                        className="rounded-box border border-base-300 bg-white p-2"
                    />
                    <CopyField value={setup.secret} label="Setup key" />
                    <form onSubmit={confirm} className="flex flex-col gap-2 sm:flex-row sm:items-end">
                        <TextField
                            label="Code from the app"
                            name="code"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            pattern="[0-9 ]*"
                            maxLength={7}
                            required
                            value={code}
                            onChange={setCode}
                            errors={errors.code}
                        />
                        <div className="flex gap-2">
                            <button type="submit" className="btn btn-primary" disabled={submitting || code.trim() === ''}>
                                {submitting ? <span className="loading loading-spinner loading-sm" /> : 'Turn on'}
                            </button>
                            <button type="button" className="btn btn-ghost" onClick={cancel} disabled={submitting}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            ) : user.two_factor_enabled ? (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                    {passwordField}
                    <div className="flex gap-2">
                        <button
                            type="button"
                            className="btn btn-outline"
                            onClick={() => void regenerate()}
                            disabled={submitting || password === ''}
                        >
                            New recovery codes
                        </button>
                        <button
                            type="button"
                            className="btn btn-outline btn-error"
                            onClick={() => void disable()}
                            disabled={submitting || password === ''}
                        >
                            Turn off
                        </button>
                    </div>
                </div>
            ) : (
                <form onSubmit={begin} className="flex flex-col gap-2 sm:flex-row sm:items-end">
                    {passwordField}
                    <button type="submit" className="btn btn-primary" disabled={submitting || password === ''}>
                        {submitting ? <span className="loading loading-spinner loading-sm" /> : 'Set up'}
                    </button>
                </form>
            )}
            <FormAlert message={errors.password || errors.code ? null : message} />
        </SettingsCard>
    );
}
