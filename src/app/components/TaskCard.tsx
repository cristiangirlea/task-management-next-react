import React from 'react';
import {Task} from "@/types/shared";

interface TaskCardProps {
    task: Task;
}

const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
    return (
        <div className="p-2 bg-secondary rounded shadow">
            <h3 className="text-base font-semibold">{task.title}</h3>
        </div>
    );
};

export default TaskCard;
