'use client';

import { useCallback, useRef, useState } from 'react';
import {
    KeyboardSensor,
    MouseSensor,
    TouchSensor,
    closestCorners,
    pointerWithin,
    useSensor,
    useSensors,
    type CollisionDetection,
    type DragEndEvent,
    type DragOverEvent,
    type DragStartEvent,
    type Over,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import * as api from '@/lib/api';
import { errorMessage } from '@/lib/api';
import { isTaskStatus, moveTask, reorderPlan, tasksInColumn, type ReorderCall } from '@/lib/board';
import type { Task, TaskStatus } from '@/types';

type Options = {
    tasks: Task[];
    setTasks: (next: Task[]) => void;
    /** Called after a failed persist, once the board has been refetched. */
    onError: (message: string) => void;
    refresh: () => Promise<void>;
};

type DropTarget = { status: TaskStatus; index: number };

/** Prefer what the pointer is actually inside; fall back to the nearest corners. */
const collisionDetection: CollisionDetection = (args) => {
    const within = pointerWithin(args);
    return within.length > 0 ? within : closestCorners(args);
};

/** A drop target is either a column (append) or a card (insert at its index). */
function resolveTarget(over: Over, tasks: Task[]): DropTarget | null {
    if (isTaskStatus(over.id)) {
        return { status: over.id, index: tasksInColumn(tasks, over.id).length };
    }
    const overTask = tasks.find((t) => t.id === over.id);
    if (!overTask) return null;
    const index = tasksInColumn(tasks, overTask.status).findIndex((t) => t.id === overTask.id);
    return { status: overTask.status, index };
}

async function persist(plan: ReorderCall[]): Promise<void> {
    for (const call of plan) {
        await api.reorderTasks(call.status, call.task_ids);
    }
}

export function useBoardDnd({ tasks, setTasks, onError, refresh }: Options) {
    const [activeId, setActiveId] = useState<number | null>(null);
    const snapshot = useRef<Task[]>([]);

    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    const onDragStart = useCallback(
        ({ active }: DragStartEvent) => {
            snapshot.current = tasks;
            setActiveId(Number(active.id));
        },
        [tasks],
    );

    // Moving between columns happens live so the card visually joins its new column.
    const onDragOver = useCallback(
        ({ active, over }: DragOverEvent) => {
            if (!over) return;
            const task = tasks.find((t) => t.id === active.id);
            const target = resolveTarget(over, tasks);
            if (!task || !target || task.status === target.status) return;
            setTasks(moveTask(tasks, task.id, target.status, target.index));
        },
        [tasks, setTasks],
    );

    const onDragCancel = useCallback(() => {
        setTasks(snapshot.current);
        setActiveId(null);
    }, [setTasks]);

    const onDragEnd = useCallback(
        ({ active, over }: DragEndEvent) => {
            setActiveId(null);
            const before = snapshot.current;
            const target = over ? resolveTarget(over, tasks) : null;
            if (!target) {
                setTasks(before);
                return;
            }

            const taskId = Number(active.id);
            const after = moveTask(tasks, taskId, target.status, target.index);
            setTasks(after);

            const plan = reorderPlan(before, after, taskId);
            if (plan.length === 0) return;

            persist(plan).catch(async (err: unknown) => {
                await refresh();
                onError(`Could not save the new order: ${errorMessage(err)}`);
            });
        },
        [tasks, setTasks, refresh, onError],
    );

    const activeTask = activeId === null ? null : (tasks.find((t) => t.id === activeId) ?? null);

    return {
        sensors,
        collisionDetection,
        activeTask,
        handlers: { onDragStart, onDragOver, onDragEnd, onDragCancel },
    };
}
