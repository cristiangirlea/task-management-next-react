'use client';

import { useState, type FormEvent } from 'react';
import { FormAlert, TextField } from '@/components/forms/Fields';
import { useSubmit } from '@/hooks/useSubmit';
import type { Project } from '@/types';

type Props = {
    projects: Project[];
    loading: boolean;
    selectedId: number | null;
    onSelect: (id: number) => void;
    onCreate: (name: string) => Promise<void>;
};

export default function ProjectSelector({ projects, loading, selectedId, onSelect, onCreate }: Props) {
    const [creating, setCreating] = useState(false);
    const [name, setName] = useState('');
    const { submitting, errors, message, run, reset } = useSubmit();

    const close = () => {
        setCreating(false);
        setName('');
        reset();
    };

    const submit = async (event: FormEvent) => {
        event.preventDefault();
        if (await run(() => onCreate(name.trim()))) close();
    };

    return (
        <div className="card bg-base-100 shadow-sm">
            <div className="card-body gap-3 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                    <label className="form-control w-full sm:max-w-xs">
                        <div className="label">
                            <span className="label-text">Project</span>
                        </div>
                        <select
                            className="select select-bordered w-full"
                            value={selectedId ?? ''}
                            onChange={(event) => onSelect(Number(event.target.value))}
                            disabled={loading || projects.length === 0}
                        >
                            {projects.length === 0 && (
                                <option value="">{loading ? 'Loading projects…' : 'No projects yet'}</option>
                            )}
                            {projects.map((project) => (
                                <option key={project.id} value={project.id}>
                                    {project.name}
                                </option>
                            ))}
                        </select>
                    </label>
                    {!creating && (
                        <button type="button" className="btn btn-outline" onClick={() => setCreating(true)}>
                            New project
                        </button>
                    )}
                </div>
                {creating && (
                    <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row sm:items-end">
                        <TextField
                            label="New project name"
                            name="name"
                            required
                            autoFocus
                            placeholder="e.g. Website redesign"
                            value={name}
                            onChange={setName}
                            errors={errors.name}
                        />
                        <div className="flex gap-2">
                            <button type="submit" className="btn btn-primary" disabled={submitting || name.trim() === ''}>
                                {submitting ? <span className="loading loading-spinner loading-sm" /> : 'Create'}
                            </button>
                            <button type="button" className="btn btn-ghost" onClick={close} disabled={submitting}>
                                Cancel
                            </button>
                        </div>
                    </form>
                )}
                {creating && <FormAlert message={message} />}
            </div>
        </div>
    );
}
