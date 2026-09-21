export type Tenant = {
    id: number;
    name: string;
    slug: string;
    domain: string | null;
    settings: Record<string, unknown> | null;
    created_at: string;
    updated_at: string;
};

export type User = {
    id: number;
    name: string;
    email: string;
    tenant?: Tenant;
    created_at: string;
    updated_at: string;
};

export type Project = {
    id: number;
    name: string;
    description: string | null;
    tasks_count?: number;
    created_at: string;
    updated_at: string;
};

export type TaskStatus = 'pending' | 'in_progress' | 'completed';

export type TaskPriority = 1 | 2 | 3 | 4 | 5;

export type Task = {
    id: number;
    title: string;
    description: string | null;
    status: TaskStatus;
    priority: TaskPriority;
    position: number;
    due_date: string | null;
    project_id: number;
    user_id: number | null;
    assignee?: User | null;
    created_at: string;
    updated_at: string;
};

export type AuthPayload = { user: User; token: string };

export type RegisterInput = {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    workspace_name?: string;
};

export type LoginInput = { email: string; password: string };

export type ProjectInput = { name: string; description?: string | null };

export type CreateTaskInput = {
    title: string;
    description?: string | null;
    status?: TaskStatus;
    priority?: TaskPriority;
    due_date?: string | null;
    project_id: number;
};

export type UpdateTaskInput = Partial<Omit<CreateTaskInput, 'project_id'>>;

/** Laravel-style validation errors: field name -> list of messages. */
export type ValidationErrors = Record<string, string[]>;
