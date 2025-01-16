import React from 'react';
import { Task } from '../../types/shared';

interface TaskCardProps {
    task: Task;
}

const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
    return (
        <div className="bg-primary text-primary-content p-4 rounded shadow-md hover:shadow-lg transition">
            <h3 className="text-sm font-medium">{task.title}</h3>
        </div>
    );
};

export default TaskCard;
