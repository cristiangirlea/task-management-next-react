'use client';

import { useCallback } from 'react';
import * as api from '@/lib/api';
import type { Project, ProjectInput } from '@/types';
import { useResource } from './useResource';

export function useProjects() {
    const { data: projects, setData: setProjects, loading, error, refresh } = useResource<Project[]>(api.listProjects, []);

    const create = useCallback(
        async (input: ProjectInput) => {
            const project = await api.createProject(input);
            setProjects((prev) => [...prev, project]);
            return project;
        },
        [setProjects],
    );

    return { projects, loading, error, refresh, create };
}
