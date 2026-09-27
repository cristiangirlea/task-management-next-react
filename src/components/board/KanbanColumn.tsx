'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useMemo } from 'react';
import type { Task, TaskStatus } from '@/types';
import TaskCard from './TaskCard';

type Props = {
    status: TaskStatus;
    title: string;
    tasks: Task[];
    onAdd: () => void;
    onOpen: (task: Task) => void;
};

export default function KanbanColumn({ status, title, tasks, onAdd, onOpen }: Props) {
    const { setNodeRef, isOver } = useDroppable({ id: status });
    const ids = useMemo(() => tasks.map((t) => t.id), [tasks]);

    return (
        <section
            aria-label={title}
            className="flex w-72 shrink-0 snap-start flex-col rounded-box bg-base-100 shadow-sm sm:w-80"
        >
            <header className="flex items-center justify-between px-4 py-3">
                <h2 className="flex items-center gap-2 font-semibold">
                    {title}
                    <span className="badge badge-ghost badge-sm">{tasks.length}</span>
                </h2>
                <button type="button" className="btn btn-ghost btn-xs" onClick={onAdd}>
                    + Add task
                </button>
            </header>
            <SortableContext items={ids} strategy={verticalListSortingStrategy}>
                <div
                    ref={setNodeRef}
                    className={`flex min-h-32 flex-1 flex-col gap-2 px-3 pb-3 transition-colors ${
                        isOver ? 'bg-base-200/60' : ''
                    }`}
                >
                    {tasks.map((task) => (
                        <TaskCard key={task.id} task={task} onOpen={onOpen} />
                    ))}
                    {tasks.length === 0 && (
                        <p className="rounded-box border border-dashed border-base-300 p-4 text-center text-sm text-base-content/60">
                            No tasks yet. Drop one here or add a task.
                        </p>
                    )}
                </div>
            </SortableContext>
        </section>
    );
}
