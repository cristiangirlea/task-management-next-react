"use client";

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import axios from 'axios';

type Task = { id: number; title: string };


const ClientDashboard = () => {
    const [tasks, setTasks] = useState<string[]>([]);

    useEffect(() => {
        const socket: Socket = io('http://localhost:8080/node/');

        socket.on('message', (msg: string) => console.log('WebSocket message:', msg));

        axios.get<Task[]>('/api/tasks')
            .then((res) => setTasks(res.data.map((task) => task.title)))
            .catch((err) => console.error('Error:', err));

        return () => {
            socket.disconnect();  // Cleanup when component unmounts
        };
    }, []);

    return (
        <div>
            <h1>Task Management Dashboard</h1>
            <ul>
                {tasks.map((task, index) => (
                    <li key={index}>{task}</li>
                ))}
            </ul>
        </div>
    );
};

export default ClientDashboard;
