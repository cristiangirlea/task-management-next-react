export type Tenant = {
    id: number;
    name: string;
    slug: string;
    domain: string | null;
    settings: Record<string, unknown> | null;
    created_at: string;
    updated_at: string;
};

export type Role = 'owner' | 'member';

export type User = {
    id: number;
    name: string;
    email: string;
    role: Role;
    /** Null until the address behind the verification email has been confirmed. */
    email_verified_at: string | null;
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

export type ForgotPasswordInput = { email: string };

export type ResetPasswordInput = {
    /** From the `token` query parameter of the emailed reset link. */
    token: string;
    email: string;
    password: string;
    password_confirmation: string;
};

export type TenantInput = { name: string };

export type Member = {
    id: number;
    name: string;
    email: string;
    role: Role;
    created_at: string;
};

export type Invitation = {
    id: number;
    email: string;
    invited_by: { id: number; name: string } | null;
    expires_at: string;
    accept_url: string;
    created_at: string;
};

export type InvitationInput = { email: string };

export type InvitationStatus = 'pending' | 'expired' | 'accepted';

/** What a visitor of /invite/[token] sees before accepting (public endpoint). */
export type InvitationPreview = {
    workspace: { name: string };
    email: string;
    invited_by: string | null;
    expires_at: string;
    status: InvitationStatus;
};

export type AcceptInvitationInput = {
    name: string;
    password: string;
    password_confirmation: string;
};

export type ApiToken = {
    id: number;
    name: string;
    last_used_at: string | null;
    created_at: string;
};

export type ApiTokenInput = { name: string };

/** Returned once, right after creation; the plain token is never shown again. */
export type CreatedApiToken = { id: number; name: string; token: string };

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
