'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { LoginInput, RegisterInput, User } from '@/types';
import * as api from './api';

type AuthContextValue = {
    user: User | null;
    token: string | null;
    /** True until the stored token has been validated (or found missing). */
    loading: boolean;
    login: (input: LoginInput) => Promise<void>;
    register: (input: RegisterInput) => Promise<void>;
    logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [token, setTokenState] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const clearSession = useCallback(() => {
        api.setToken(null);
        setTokenState(null);
        setUser(null);
    }, []);

    // Any authenticated request that gets a 401 ends up here.
    useEffect(() => {
        api.setUnauthorizedHandler(() => {
            clearSession();
            router.replace('/login');
        });
        return () => api.setUnauthorizedHandler(null);
    }, [clearSession, router]);

    // Validate the stored token once on mount.
    useEffect(() => {
        let cancelled = false;
        const stored = api.getToken();
        if (!stored) {
            setLoading(false);
            return;
        }
        setTokenState(stored);
        api.getUser()
            .then((me) => {
                if (!cancelled) setUser(me);
            })
            .catch(() => {
                // A 401 already cleared the token; anything else leaves the user signed out too.
                if (!cancelled) clearSession();
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [clearSession]);

    const startSession = useCallback((payload: { user: User; token: string }) => {
        api.setToken(payload.token);
        setTokenState(payload.token);
        setUser(payload.user);
    }, []);

    const login = useCallback(
        async (input: LoginInput) => startSession(await api.login(input)),
        [startSession],
    );

    const register = useCallback(
        async (input: RegisterInput) => startSession(await api.register(input)),
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
        () => ({ user, token, loading, login, register, logout }),
        [user, token, loading, login, register, logout],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
    return ctx;
}
