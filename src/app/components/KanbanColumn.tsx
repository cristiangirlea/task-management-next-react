import React from 'react';
import TaskCard from './TaskCard';
import { Task } from '../../types/shared';

interface KanbanColumnProps {
    title: string;
    status: string;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ title, status }) => {
    const tasks: Task[] = [
        { id: 1, title: 'Sample Task 1', status: 'todo' },
        { id: 2, title: 'Sample Task 2', status: 'todo' },
    ];

    return (
        <div className="flex flex-col gap-4 p-4 bg-base-200 rounded-lg shadow-lg w-80">
            <h2 className="text-xl font-bold text-primary">{title}</h2>
            <div className="flex flex-col gap-4">
                {tasks
                    .filter((task) => task.status === status)
                    .map((task) => (
                        <TaskCard key={task.id} task={task} />
                    ))}
            </div>
        </div>
    );
};

export default KanbanColumn;
