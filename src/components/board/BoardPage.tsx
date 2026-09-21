'use client';

import { useCallback, useEffect, useState } from 'react';
import Toast from '@/components/Toast';
import { useProjects } from '@/hooks/useProjects';
import { useToast } from '@/hooks/useToast';
import { PROJECT_KEY, readStorage, writeStorage } from '@/lib/storage';
import BoardSkeleton from './BoardSkeleton';
import KanbanBoard from './KanbanBoard';
import ProjectSelector from './ProjectSelector';

export default function BoardPage() {
    const { projects, loading, error, refresh, create } = useProjects();
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const { toast, show, dismiss } = useToast();

    // Once projects are known: keep the current pick if it still exists,
    // otherwise use the remembered project, otherwise the first one.
    useEffect(() => {
        if (loading) return;
        setSelectedId((current) => {
            if (current !== null && projects.some((p) => p.id === current)) return current;
            const remembered = Number(readStorage(PROJECT_KEY));
            const match = projects.find((p) => p.id === remembered) ?? projects[0];
            return match ? match.id : null;
        });
    }, [projects, loading]);

    const selectProject = useCallback((id: number) => {
        setSelectedId(id);
        writeStorage(PROJECT_KEY, String(id));
    }, []);

    const createProject = useCallback(
        async (name: string) => {
            const project = await create({ name });
            selectProject(project.id);
        },
        [create, selectProject],
    );

    return (
        <div className="flex flex-col gap-4">
            <ProjectSelector
                projects={projects}
                loading={loading}
                selectedId={selectedId}
                onSelect={selectProject}
                onCreate={createProject}
            />
            {error && (
                <div role="alert" className="alert alert-error">
                    <span>{error}</span>
                    <button type="button" className="btn btn-sm" onClick={() => void refresh()}>
                        Retry
                    </button>
                </div>
            )}
            {loading ? (
                <BoardSkeleton />
            ) : selectedId !== null ? (
                <KanbanBoard key={selectedId} projectId={selectedId} notify={show} />
            ) : (
                !error && <NoProjects />
            )}
            <Toast toast={toast} onDismiss={dismiss} />
        </div>
    );
}

function NoProjects() {
    return (
        <div className="rounded-box border border-dashed border-base-300 bg-base-100 p-10 text-center">
            <h2 className="text-lg font-semibold">No projects yet</h2>
            <p className="mt-1 text-sm text-base-content/70">
                Create your first project with the “New project” button above to start adding tasks.
            </p>
        </div>
    );
}
