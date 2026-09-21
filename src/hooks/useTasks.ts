'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import * as api from '@/lib/api';
import { errorMessage } from '@/lib/api';
import type { CreateTaskInput, Task, UpdateTaskInput } from '@/types';

export function useTasks(projectId: number | null) {
    const [tasks, setTasks] = useState<Task[]>([]);
    // A fetch starts on mount whenever there is a project, so begin in the loading state.
    const [loading, setLoading] = useState(projectId !== null);
    const [error, setError] = useState<string | null>(null);
    // Ignore responses from requests that were superseded by a newer one.
    const requestId = useRef(0);

    const refresh = useCallback(async () => {
        const id = ++requestId.current;
        if (projectId === null) {
            setTasks([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const data = await api.listTasks(projectId);
            if (id === requestId.current) setTasks(data);
        } catch (err) {
            if (id === requestId.current) setError(errorMessage(err));
        } finally {
            if (id === requestId.current) setLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        void refresh();
    }, [refresh]);

    const create = useCallback(async (input: CreateTaskInput) => {
        const task = await api.createTask(input);
        setTasks((prev) => [...prev, task]);
        return task;
    }, []);

    const update = useCallback(async (id: number, input: UpdateTaskInput) => {
        const task = await api.updateTask(id, input);
        setTasks((prev) => prev.map((t) => (t.id === id ? task : t)));
        return task;
    }, []);

    const remove = useCallback(async (id: number) => {
        await api.deleteTask(id);
        setTasks((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return { tasks, setTasks, loading, error, refresh, create, update, remove };
}
