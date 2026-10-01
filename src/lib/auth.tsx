'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AcceptInvitationInput, LoginInput, RegisterInput, User } from '@/types';
import * as api from './api';

type AuthContextValue = {
    user: User | null;
    token: string | null;
    /** True until the stored token has been validated (or found missing). */
    loading: boolean;
    /** The API could not be reached to validate the stored token, which is kept for `retry`. */
    unreachable: boolean;
    retry: () => void;
    login: (input: LoginInput) => Promise<void>;
    register: (input: RegisterInput) => Promise<void>;
    /** Accepts a workspace invitation; on success the new account is signed in. */
    acceptInvitation: (token: string, input: AcceptInvitationInput) => Promise<void>;
    logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [token, setTokenState] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [unreachable, setUnreachable] = useState(false);

    const clearSession = useCallback(() => {
        api.setToken(null);
        setTokenState(null);
        setUser(null);
        setUnreachable(false);
    }, []);

    // Any authenticated request that gets a 401 ends up here.
    useEffect(() => {
        api.setUnauthorizedHandler(() => {
            clearSession();
            router.replace('/login');
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
    }, []);

    const login = useCallback(
        async (input: LoginInput) => startSession(await api.login(input)),
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

    const logout = useCallback(async () => {
        try {
            await api.logout();
        } catch {
            // The token is discarded locally regardless of what the server says.
        }
        clearSession();
        router.replace('/login');
    }, [clearSession, router]);

    const value = useMemo(
        () => ({ user, token, loading, unreachable, retry, login, register, acceptInvitation, logout }),
        [user, token, loading, unreachable, retry, login, register, acceptInvitation, logout],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
    return ctx;
}
