"use client";

import { DndContext, DragEndEvent } from '@dnd-kit/core';
import KanbanColumn from './KanbanColumn';

const KanbanBoard = () => {
    return (
        <DndContext onDragEnd={handleDragEnd}>
            <div className="flex gap-6 overflow-x-auto p-6 bg-gray-50 min-h-screen">
                <KanbanColumn title="To Do" status="todo" />
                <KanbanColumn title="In Progress" status="in-progress" />
                <KanbanColumn title="Done" status="done" />
                <div className="p-4">
                    <button className="btn btn-primary">Add New Task</button>
                </div>
            </div>
        </DndContext>
    );
};

const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over) {
        console.log(`Dragged ${active.id} to ${over.id}`);
    } else {
        console.log(`Dragged ${active.id} but did not drop over any column.`);
    }
};

export default KanbanBoard;
