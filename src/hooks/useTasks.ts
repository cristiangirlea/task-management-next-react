'use client';

import { useCallback } from 'react';
import * as api from '@/lib/api';
import type { CreateTaskInput, Task, UpdateTaskInput } from '@/types';
import { useResource } from './useResource';

/** One project's tasks. The board is keyed by project, so a new project means a fresh hook. */
export function useTasks(projectId: number) {
    const load = useCallback(() => api.listTasks(projectId), [projectId]);
    const { data: tasks, setData: setTasks, loading, error, refresh } = useResource<Task[]>(load, []);

    const create = useCallback(
        async (input: CreateTaskInput) => {
            const task = await api.createTask(input);
            setTasks((prev) => [...prev, task]);
            return task;
        },
        [setTasks],
    );

    const update = useCallback(
        async (id: number, input: UpdateTaskInput) => {
            const task = await api.updateTask(id, input);
            setTasks((prev) => prev.map((t) => (t.id === id ? task : t)));
            return task;
        },
        [setTasks],
    );

    const remove = useCallback(
        async (id: number) => {
            await api.deleteTask(id);
            setTasks((prev) => prev.filter((t) => t.id !== id));
        },
        [setTasks],
    );

    return { tasks, setTasks, loading, error, refresh, create, update, remove };
}
