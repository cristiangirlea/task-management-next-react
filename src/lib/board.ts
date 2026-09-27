import type { Task, TaskPriority, TaskStatus } from '@/types';

/** Column definitions in display order. The status doubles as the droppable id. */
export const COLUMNS: ReadonlyArray<{ status: TaskStatus; title: string }> = [
    { status: 'pending', title: 'To do' },
    { status: 'in_progress', title: 'In progress' },
    { status: 'completed', title: 'Done' },
];

const STATUSES: ReadonlySet<string> = new Set(COLUMNS.map((c) => c.status));

export function isTaskStatus(value: unknown): value is TaskStatus {
    return typeof value === 'string' && STATUSES.has(value);
}

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
    1: 'Highest',
    2: 'High',
    3: 'Medium',
    4: 'Low',
    5: 'Lowest',
};

export const PRIORITY_BADGE_CLASS: Record<TaskPriority, string> = {
    1: 'badge-error',
    2: 'badge-warning',
    3: 'badge-info',
    4: 'badge-success',
    5: 'badge-ghost',
};

function byPosition(a: Task, b: Task): number {
    return a.position - b.position || a.id - b.id;
}

/** Tasks of one column, ordered by position. */
export function tasksInColumn(tasks: Task[], status: TaskStatus): Task[] {
    return tasks.filter((t) => t.status === status).sort(byPosition);
}

export function columnIds(tasks: Task[], status: TaskStatus): number[] {
    return tasksInColumn(tasks, status).map((t) => t.id);
}

export function groupTasks(tasks: Task[]): Record<TaskStatus, Task[]> {
    return {
        pending: tasksInColumn(tasks, 'pending'),
        in_progress: tasksInColumn(tasks, 'in_progress'),
        completed: tasksInColumn(tasks, 'completed'),
    };
}

/**
 * Move a task to `toStatus` at `toIndex` (the index it should end up at once
 * it is removed from its current column). Positions in the affected columns
 * are renumbered from 0 so they match what /tasks/reorder will assign.
 */
export function moveTask(tasks: Task[], taskId: number, toStatus: TaskStatus, toIndex: number): Task[] {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return tasks;

    const fromStatus = task.status;
    const destination = tasksInColumn(tasks, toStatus).filter((t) => t.id !== taskId);
    const index = Math.max(0, Math.min(toIndex, destination.length));
    destination.splice(index, 0, { ...task, status: toStatus });

    const renumbered = new Map<number, Task>();
    destination.forEach((t, position) => renumbered.set(t.id, { ...t, position }));
    if (fromStatus !== toStatus) {
        tasksInColumn(tasks, fromStatus)
            .filter((t) => t.id !== taskId)
            .forEach((t, position) => renumbered.set(t.id, { ...t, position }));
    }

    return tasks.map((t) => renumbered.get(t.id) ?? t);
}

export type ReorderCall = { status: TaskStatus; task_ids: number[] };

/**
 * The /tasks/reorder calls needed to persist the difference between `before`
 * and `after` for the task that was dragged: always the destination column,
 * plus the source column when the task changed status (skipped when empty,
 * since there is nothing left to renumber).
 */
export function reorderPlan(before: Task[], after: Task[], taskId: number): ReorderCall[] {
    const previous = before.find((t) => t.id === taskId);
    const current = after.find((t) => t.id === taskId);
    if (!previous || !current) return [];

    const destinationIds = columnIds(after, current.status);
    const unchanged =
        previous.status === current.status &&
        sameIds(destinationIds, columnIds(before, previous.status));
    if (unchanged) return [];

    const plan: ReorderCall[] = [{ status: current.status, task_ids: destinationIds }];
    if (previous.status !== current.status) {
        const sourceIds = columnIds(after, previous.status);
        if (sourceIds.length > 0) plan.push({ status: previous.status, task_ids: sourceIds });
    }
    return plan;
}

function sameIds(a: number[], b: number[]): boolean {
    return a.length === b.length && a.every((id, i) => id === b[i]);
}

/** "YYYY-MM-DD" for date inputs, or "" when there is no due date. */
export function toDateInput(iso: string | null | undefined): string {
    return iso ? iso.slice(0, 10) : '';
}

function localDate(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Past its due date (compared by calendar day, in the viewer's timezone) and not done. */
export function isOverdue(task: Pick<Task, 'due_date' | 'status'>, now: Date = new Date()): boolean {
    if (!task.due_date || task.status === 'completed') return false;
    return toDateInput(task.due_date) < localDate(now);
}

export function formatDueDate(iso: string): string {
    const [year, month, day] = toDateInput(iso).split('-').map(Number);
    if (!year || !month || !day) return iso;
    return new Date(year, month - 1, day).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}
