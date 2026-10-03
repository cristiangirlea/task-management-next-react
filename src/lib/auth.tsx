'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type {
    AcceptInvitationInput,
    LoginInput,
    RegisterInput,
    TwoFactorAnswer,
    TwoFactorChallenge,
    User,
} from '@/types';
import * as api from './api';
import { signInPath } from './redirect';

type AuthContextValue = {
    user: User | null;
    token: string | null;
    /** True until the stored token has been validated (or found missing). */
    loading: boolean;
    /** The API could not be reached to validate the stored token, which is kept for `retry`. */
    unreachable: boolean;
    retry: () => void;
    /** Signs in, or returns the challenge for the second step when two-factor authentication is on. */
    login: (input: LoginInput) => Promise<TwoFactorChallenge | null>;
    completeTwoFactor: (challenge: string, answer: TwoFactorAnswer) => Promise<void>;
    /** Replaces the signed-in user after a change made elsewhere, such as two-factor settings. */
    updateUser: (user: User) => void;
    register: (input: RegisterInput) => Promise<void>;
    /** Accepts a workspace invitation; on success the new account is signed in. */
    acceptInvitation: (token: string, input: AcceptInvitationInput) => Promise<void>;
    /** Signs out, then goes to `to` (the sign-in page by default). */
    logout: (to?: string) => Promise<void>;
    /** Where the last sign-out went, so protected pages follow it rather than add their own way back. */
    signedOutTo: string | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [token, setTokenState] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [unreachable, setUnreachable] = useState(false);
    const [signedOutTo, setSignedOutTo] = useState<string | null>(null);

    const clearSession = useCallback(() => {
        api.setToken(null);
        setTokenState(null);
        setUser(null);
        setUnreachable(false);
    }, []);

    // Any authenticated request that gets a 401 ends up here; signing in again comes back.
    useEffect(() => {
        api.setUnauthorizedHandler(() => {
            clearSession();
            router.replace(signInPath());
        });
        return () => api.setUnauthorizedHandler(null);
    }, [clearSession, router]);

    const checkSession = useCallback(() => {
        const stored = api.getToken();
        return (stored ? api.getUser() : Promise.resolve(null)).then(
            (me) => {
                setUser(me);
                setTokenState(me ? stored : null);
                setUnreachable(false);
                setLoading(false);
            },
            (error: unknown) => {
                // A 401 has already discarded the token. Any other failure (the API
                // restarting, or this page being left mid-request) keeps it.
                setUnreachable(!(error instanceof api.ApiError && error.status === 401));
                setLoading(false);
            },
        );
    }, []);

    useEffect(() => {
        void checkSession();
    }, [checkSession]);

    const retry = useCallback(() => {
        setLoading(true);
        setUnreachable(false);
        void checkSession();
    }, [checkSession]);

    const startSession = useCallback((payload: { user: User; token: string }) => {
        api.setToken(payload.token);
        setTokenState(payload.token);
        setUser(payload.user);
        setUnreachable(false);
        setSignedOutTo(null);
    }, []);

    const login = useCallback(
        async (input: LoginInput) => {
            const result = await api.login(input);
            if ('two_factor' in result) return result;
            startSession(result);
            return null;
        },
        [startSession],
    );

    const completeTwoFactor = useCallback(
        async (challenge: string, answer: TwoFactorAnswer) => startSession(await api.loginTwoFactor(challenge, answer)),
        [startSession],
    );

    const register = useCallback(
        async (input: RegisterInput) => startSession(await api.register(input)),
        [startSession],
    );

    const acceptInvitation = useCallback(
        async (token: string, input: AcceptInvitationInput) => startSession(await api.acceptInvitation(token, input)),
        [startSession],
    );

    const logout = useCallback(
        async (to = '/login') => {
            try {
                await api.logout();
            } catch {
                // The token is discarded locally regardless of what the server says.
            }
            setSignedOutTo(to);
            clearSession();
            router.replace(to);
        },
        [clearSession, router],
    );

    const value = useMemo(
        () => ({
            user,
            token,
            loading,
            unreachable,
            retry,
            login,
            completeTwoFactor,
            updateUser: setUser,
            register,
            acceptInvitation,
            logout,
            signedOutTo,
        }),
        [user, token, loading, unreachable, retry, login, completeTwoFactor, register, acceptInvitation, logout, signedOutTo],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
    return ctx;
}
