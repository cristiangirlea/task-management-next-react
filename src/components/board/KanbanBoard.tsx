'use client';

import { DndContext, DragOverlay } from '@dnd-kit/core';
import { useCallback, useId, useMemo, useRef, useState } from 'react';
import { useBoardDnd } from '@/hooks/useBoardDnd';
import { useTasks } from '@/hooks/useTasks';
import type { ToastMessage } from '@/hooks/useToast';
import { COLUMNS, groupTasks, isTaskStatus } from '@/lib/board';
import type { TaskStatus } from '@/types';
import BoardSkeleton from './BoardSkeleton';
import KanbanColumn from './KanbanColumn';
import { TaskCardView } from './TaskCard';
import TaskFormModal, { type TaskModalState } from './TaskFormModal';

type Props = {
    projectId: number;
    notify: (type: ToastMessage['type'], text: string) => void;
};

export default function KanbanBoard({ projectId, notify }: Props) {
    const { tasks, setTasks, loading, error, refresh, create, update, remove } = useTasks(projectId);
    const onError = useCallback((text: string) => notify('error', text), [notify]);
    const dnd = useBoardDnd({ tasks, setTasks, onError, refresh });
    const [modal, setModal] = useState<TaskModalState | null>(null);
    const closeModal = useCallback(() => setModal(null), []);
    const dndId = useId();
    const columns = useMemo(() => groupTasks(tasks), [tasks]);

    // On a phone one column fills the screen; the switcher above the board
    // shows which one and jumps to the others.
    const row = useRef<HTMLDivElement | null>(null);
    const [shown, setShown] = useState<TaskStatus>(COLUMNS[0].status);
    const observeColumns = useCallback((node: HTMLDivElement | null) => {
        row.current = node;
        if (!node) return;
        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    const status = (entry.target as HTMLElement).dataset.column;
                    if (entry.isIntersecting && isTaskStatus(status)) setShown(status);
                }
            },
            { root: node, threshold: 0.6 },
        );
        node.querySelectorAll('[data-column]').forEach((column) => observer.observe(column));
        return () => observer.disconnect();
    }, []);
    // Scrolls the row only: scrollIntoView would also scroll the page down to a long column.
    const showColumn = (status: TaskStatus) => {
        const column = row.current?.querySelector<HTMLElement>(`[data-column="${status}"]`);
        if (column) row.current?.scrollTo({ left: column.offsetLeft, behavior: 'smooth' });
    };

    if (loading && tasks.length === 0) return <BoardSkeleton />;

    return (
        <>
            {error && (
                <div role="alert" className="alert alert-error">
                    <span>{error}</span>
                    <button type="button" className="btn btn-sm" onClick={() => void refresh()}>
                        Retry
                    </button>
                </div>
            )}
            <DndContext
                id={dndId}
                sensors={dnd.sensors}
                collisionDetection={dnd.collisionDetection}
                {...dnd.handlers}
            >
                <div className="join w-full sm:hidden" role="group" aria-label="Columns">
                    {COLUMNS.map((column) => (
                        <button
                            key={column.status}
                            type="button"
                            className={`btn join-item btn-sm flex-1 flex-nowrap ${shown === column.status ? 'btn-active' : ''}`}
                            aria-pressed={shown === column.status}
                            onClick={() => showColumn(column.status)}
                        >
                            {column.title}
                            <span className="badge badge-ghost badge-sm">{columns[column.status].length}</span>
                        </button>
                    ))}
                </div>
                {/* `relative` makes this the containing block of the cards' screen-reader-only
                    text (absolutely positioned), which otherwise escapes the scrolling and
                    widens the whole page on a phone. */}
                <div ref={observeColumns} className="relative flex snap-x gap-4 overflow-x-auto pb-4">
                    {COLUMNS.map((column) => (
                        <KanbanColumn
                            key={column.status}
                            status={column.status}
                            title={column.title}
                            tasks={columns[column.status]}
                            onAdd={() => setModal({ mode: 'create', status: column.status })}
                            onOpen={(task) => setModal({ mode: 'edit', task })}
                        />
                    ))}
                </div>
                <DragOverlay>{dnd.activeTask ? <TaskCardView task={dnd.activeTask} dragging /> : null}</DragOverlay>
            </DndContext>
            {modal && (
                <TaskFormModal
                    state={modal}
                    projectId={projectId}
                    onClose={closeModal}
                    onCreate={create}
                    onUpdate={update}
                    onDelete={remove}
                    notify={notify}
                />
            )}
        </>
    );
}
