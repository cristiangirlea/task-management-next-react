'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { FieldErrors, FormAlert, TextField } from '@/components/forms/Fields';
import { useSubmit } from '@/hooks/useSubmit';
import type { ToastMessage } from '@/hooks/useToast';
import { PRIORITY_LABELS, toDateInput } from '@/lib/board';
import type { CreateTaskInput, Task, TaskPriority, TaskStatus, UpdateTaskInput } from '@/types';

export type TaskModalState = { mode: 'create'; status: TaskStatus } | { mode: 'edit'; task: Task };

const PRIORITIES: TaskPriority[] = [1, 2, 3, 4, 5];

type Props = {
    state: TaskModalState;
    projectId: number;
    onClose: () => void;
    onCreate: (input: CreateTaskInput) => Promise<Task>;
    onUpdate: (id: number, input: UpdateTaskInput) => Promise<Task>;
    onDelete: (id: number) => Promise<void>;
    notify: (type: ToastMessage['type'], text: string) => void;
};

export default function TaskFormModal({ state, projectId, onClose, onCreate, onUpdate, onDelete, notify }: Props) {
    const editing = state.mode === 'edit' ? state.task : null;
    const [title, setTitle] = useState(editing?.title ?? '');
    const [description, setDescription] = useState(editing?.description ?? '');
    const [priority, setPriority] = useState<TaskPriority>(editing?.priority ?? 3);
    const [dueDate, setDueDate] = useState(toDateInput(editing?.due_date));
    const [confirmDelete, setConfirmDelete] = useState(false);
    const { submitting, errors, message, run } = useSubmit();

    useEffect(() => {
        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    const submit = async (event: FormEvent) => {
        event.preventDefault();
        const fields = {
            title: title.trim(),
            description: description.trim() || null,
            priority,
            due_date: dueDate || null,
        };
        const ok = await run(() =>
            editing
                ? onUpdate(editing.id, fields)
                : onCreate({ ...fields, status: state.mode === 'create' ? state.status : undefined, project_id: projectId }),
        );
        if (ok) {
            notify('success', editing ? 'Task updated' : 'Task created');
            onClose();
        }
    };

    const destroy = async () => {
        if (!editing) return;
        if (await run(() => onDelete(editing.id))) {
            notify('success', 'Task deleted');
            onClose();
        }
    };

    return (
        <div className="modal modal-open" role="dialog" aria-modal="true" aria-labelledby="task-modal-title">
            <div className="modal-box">
                <h3 id="task-modal-title" className="text-lg font-bold">
                    {editing ? 'Edit task' : 'New task'}
                </h3>
                <form onSubmit={submit} className="mt-4 flex flex-col gap-3">
                    <TextField label="Title" name="title" required autoFocus value={title} onChange={setTitle} errors={errors.title} />
                    <label className="form-control w-full">
                        <div className="label">
                            <span className="label-text">Description</span>
                        </div>
                        <textarea
                            name="description"
                            rows={3}
                            className="textarea textarea-bordered w-full"
                            value={description}
                            onChange={(event) => setDescription(event.target.value)}
                        />
                        <FieldErrors errors={errors.description} />
                    </label>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <label className="form-control w-full">
                            <div className="label">
                                <span className="label-text">Priority</span>
                            </div>
                            <select
                                name="priority"
                                className="select select-bordered w-full"
                                value={priority}
                                onChange={(event) => setPriority(Number(event.target.value) as TaskPriority)}
                            >
                                {PRIORITIES.map((p) => (
                                    <option key={p} value={p}>
                                        {p} – {PRIORITY_LABELS[p]}
                                    </option>
                                ))}
                            </select>
                            <FieldErrors errors={errors.priority} />
                        </label>
                        <TextField label="Due date" name="due_date" type="date" value={dueDate} onChange={setDueDate} errors={errors.due_date} />
                    </div>
                    <FormAlert message={message} />
                    <div className="modal-action items-center justify-between">
                        {editing ? (
                            confirmDelete ? (
                                <div className="flex items-center gap-2">
                                    <button type="button" className="btn btn-error btn-sm" onClick={destroy} disabled={submitting}>
                                        Confirm delete
                                    </button>
                                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirmDelete(false)}>
                                        Keep
                                    </button>
                                </div>
                            ) : (
                                <button type="button" className="btn btn-outline btn-error btn-sm" onClick={() => setConfirmDelete(true)}>
                                    Delete
                                </button>
                            )
                        ) : (
                            <span />
                        )}
                        <div className="flex gap-2">
                            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={submitting}>
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary" disabled={submitting || title.trim() === ''}>
                                {submitting ? <span className="loading loading-spinner loading-sm" /> : editing ? 'Save' : 'Create'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
            <button type="button" className="modal-backdrop" aria-label="Close" onClick={onClose} />
        </div>
    );
}
