"use client";

import { DndContext } from '@dnd-kit/core';
import KanbanColumn from './KanbanColumn';

const KanbanBoard = () => {
    return (
        <DndContext onDragEnd={handleDragEnd}>
            <div className="p-4 flex gap-4 overflow-x-auto">
                <KanbanColumn title="To Do" status="todo" />
                <KanbanColumn title="In Progress" status="in-progress" />
                <KanbanColumn title="Done" status="done" />
            </div>
        </DndContext>
    );
};

const handleDragEnd = (event: any) => {
    console.log('Dragged', event);
};

export default KanbanBoard;
