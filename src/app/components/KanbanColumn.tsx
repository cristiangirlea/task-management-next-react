import React from 'react';
import TaskCard from './TaskCard';
import { Task } from '../../types/shared'; // Import from the shared types file

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
        <div className="flex flex-col gap-2 p-2 bg-base-100 rounded-lg shadow-md">
            <h2 className="text-lg font-bold">{title}</h2>
            <div className="flex flex-col gap-2">
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
