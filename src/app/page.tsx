"use client";

import KanbanBoard from "./components/KanbanBoard";

export default function HomePage() {
    return (
        <main className="min-h-screen bg-base-200 text-base-content p-8">
            <h1 className="text-4xl font-bold text-primary mb-6">Task Management</h1>
            <div className="border border-red-500 p-4">
                {/* Add a border for debugging */}
                <KanbanBoard />
            </div>
        </main>
    );
}
