'use client';

import { useCallback, useEffect, useState } from 'react';
import * as api from '@/lib/api';
import { errorMessage } from '@/lib/api';
import type { Project, ProjectInput } from '@/types';

export function useProjects() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refresh = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            setProjects(await api.listProjects());
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void refresh();
    }, [refresh]);

    const create = useCallback(async (input: ProjectInput) => {
        const project = await api.createProject(input);
        setProjects((prev) => [...prev, project]);
        return project;
    }, []);

    return { projects, loading, error, refresh, create };
}
