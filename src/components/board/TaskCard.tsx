'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PRIORITY_BADGE_CLASS, PRIORITY_LABELS, formatDueDate, isOverdue } from '@/lib/board';
import type { Task, TaskPriority } from '@/types';

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
    return (
        <span
            className={`badge badge-sm shrink-0 ${PRIORITY_BADGE_CLASS[priority]}`}
            title={`Priority ${priority}: ${PRIORITY_LABELS[priority]}`}
        >
            P{priority}
        </span>
    );
}

/** Presentation only; also used for the drag overlay. */
export function TaskCardView({ task, dragging = false }: { task: Task; dragging?: boolean }) {
    const overdue = isOverdue(task);
    return (
        <article
            className={`card card-compact border border-base-300 bg-base-100 shadow-sm ${
                dragging ? 'shadow-lg ring-2 ring-primary' : ''
            }`}
        >
            <div className="card-body gap-2 p-3">
                <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-medium leading-snug">{task.title}</h3>
                    <PriorityBadge priority={task.priority} />
                </div>
                {task.due_date && (
                    <p className={`text-xs ${overdue ? 'font-semibold text-error' : 'text-base-content/60'}`}>
                        {overdue ? 'Overdue' : 'Due'} · {formatDueDate(task.due_date)}
                    </p>
                )}
            </div>
        </article>
    );
}

type Props = { task: Task; onOpen: (task: Task) => void };

export default function TaskCard({ task, onOpen }: Props) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: task.id,
        data: { status: task.status },
    });

    return (
        <div
            ref={setNodeRef}
            style={{ transform: CSS.Transform.toString(transform), transition }}
            {...attributes}
            {...listeners}
            className={`cursor-grab touch-manipulation active:cursor-grabbing ${isDragging ? 'opacity-40' : ''}`}
            onClick={() => onOpen(task)}
        >
            <TaskCardView task={task} />
            {/* Keyboard users lift the card with Space; this gives them a way to open it too. */}
            <button
                type="button"
                className="btn btn-ghost btn-xs sr-only mt-1 focus:not-sr-only"
                onClick={(event) => {
                    event.stopPropagation();
                    onOpen(task);
                }}
            >
                Edit “{task.title}”
            </button>
        </div>
    );
}
