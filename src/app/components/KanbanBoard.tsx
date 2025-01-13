"use client";

import { DndContext, DragEndEvent } from '@dnd-kit/core';  // Import the correct event type
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

// Use DragEndEvent as the type for the event
const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over) {
        console.log(`Dragged ${active.id} to ${over.id}`);
    } else {
        console.log(`Dragged ${active.id} but did not drop over any column.`);
    }
};

export default KanbanBoard;
