"use client";

import KanbanBoard from './components/KanbanBoard';
import {useEffect} from "react";

export default function HomePage() {
    return (
        <main className="min-h-screen p-8">
            <h1 className="text-3xl font-bold">Task Management</h1>
            <KanbanBoard />
        </main>
    );
}
