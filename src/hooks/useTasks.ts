'use client';

import { useCallback, useEffect, useRef } from 'react';
import * as api from '@/lib/api';
import { watchBoard } from '@/lib/live';
import type { CreateTaskInput, Task, UpdateTaskInput } from '@/types';
import { useResource } from './useResource';

/** One project's tasks. The board is keyed by project, so a new project means a fresh hook. */
export function useTasks(projectId: number) {
    const load = useCallback(() => api.listTasks(projectId), [projectId]);
    const { data: tasks, setData: setTasks, loading, error, refresh } = useResource<Task[]>(load, []);

    // Changes made elsewhere reload the board, but never over one of this
    // browser's own that is still in progress (a drag, or a save on its way):
    // the reload could carry the board as it was before it.
    const busy = useRef(0);
    const edits = useRef(0);
    const stale = useRef(false);
    const syncing = useRef(false);

    const sync = useCallback(async () => {
        stale.current = true;
        if (busy.current > 0 || syncing.current) return;
        syncing.current = true;
        try {
            while (stale.current && busy.current === 0) {
                stale.current = false;
                const before = edits.current;
                let fresh: Task[];
                try {
                    fresh = await api.listTasks(projectId);
                } catch {
                    // Tried again on the next change or reconnection.
                    stale.current = true;
                    return;
                }
                if (edits.current === before && busy.current === 0) setTasks(fresh);
                else stale.current = true;
            }
        } finally {
            syncing.current = false;
        }
    }, [projectId, setTasks]);

    useEffect(() => watchBoard(projectId, () => void sync()), [projectId, sync]);

    /** Holds reloads back while this browser changes the board; `release` when done. */
    const hold = useCallback(() => {
        busy.current += 1;
        edits.current += 1;
    }, []);

    const release = useCallback(() => {
        busy.current -= 1;
        edits.current += 1;
        if (stale.current) void sync();
    }, [sync]);

    const whileHeld = useCallback(
        async <T>(change: () => Promise<T>): Promise<T> => {
            hold();
            try {
                return await change();
            } finally {
                release();
            }
        },
        [hold, release],
    );

    const create = useCallback(
        (input: CreateTaskInput) =>
            whileHeld(async () => {
                const task = await api.createTask(input);
                setTasks((prev) => [...prev, task]);
                return task;
            }),
        [whileHeld, setTasks],
    );

    const update = useCallback(
        (id: number, input: UpdateTaskInput) =>
            whileHeld(async () => {
                const task = await api.updateTask(id, input);
                setTasks((prev) => prev.map((t) => (t.id === id ? task : t)));
                return task;
            }),
        [whileHeld, setTasks],
    );

    const remove = useCallback(
        (id: number) =>
            whileHeld(async () => {
                await api.deleteTask(id);
                setTasks((prev) => prev.filter((t) => t.id !== id));
            }),
        [whileHeld, setTasks],
    );

    return { tasks, setTasks, loading, error, refresh, create, update, remove, hold, release };
}
