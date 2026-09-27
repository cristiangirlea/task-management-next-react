'use client';

import { DndContext, DragOverlay } from '@dnd-kit/core';
import { useCallback, useId, useMemo, useState } from 'react';
import { useBoardDnd } from '@/hooks/useBoardDnd';
import { useTasks } from '@/hooks/useTasks';
import type { ToastMessage } from '@/hooks/useToast';
import { COLUMNS, groupTasks } from '@/lib/board';
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
                <div className="flex snap-x gap-4 overflow-x-auto pb-4">
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
