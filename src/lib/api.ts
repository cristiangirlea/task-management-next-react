import type {
    AcceptInvitationInput,
    ApiToken,
    ApiTokenInput,
    AuthPayload,
    CreatedApiToken,
    CreateTaskInput,
    Invitation,
    InvitationInput,
    InvitationPreview,
    LoginInput,
    Member,
    Project,
    ProjectInput,
    RegisterInput,
    Task,
    TaskStatus,
    Tenant,
    TenantInput,
    UpdateTaskInput,
    User,
    ValidationErrors,
} from '@/types';
import { TOKEN_KEY, readStorage, writeStorage } from './storage';

const BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api').replace(/\/+$/, '');

/** The API host without the `/api` prefix, e.g. for the MCP endpoint at `<origin>/mcp`. */
export const API_ORIGIN = BASE_URL.replace(/\/api$/, '');

export class ApiError extends Error {
    readonly status: number;
    readonly errors?: ValidationErrors;

    constructor(status: number, message: string, errors?: ValidationErrors) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.errors = errors;
    }
}

export function errorMessage(error: unknown): string {
    if (error instanceof ApiError) return error.message;
    if (error instanceof Error && error.message) return error.message;
    return 'Something went wrong. Please try again.';
}

export function getToken(): string | null {
    return readStorage(TOKEN_KEY);
}

export function setToken(token: string | null): void {
    writeStorage(TOKEN_KEY, token);
}

type UnauthorizedHandler = () => void;
let onUnauthorized: UnauthorizedHandler | null = null;

/** Registered by the AuthProvider so a 401 can reset auth state and redirect. */
export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
    onUnauthorized = handler;
}

type Envelope<T> = {
    status: 'success' | 'error';
    message: string;
    data?: T;
    errors?: ValidationErrors;
};

type RequestOptions = {
    body?: unknown;
    /** Set to false for login/register so a 401 is reported instead of triggering a redirect. */
    auth?: boolean;
};

async function request<T>(method: string, path: string, options: RequestOptions = {}): Promise<T> {
    const { body, auth = true } = options;
    const headers: Record<string, string> = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
    };
    const token = auth ? getToken() : null;
    if (token) headers.Authorization = `Bearer ${token}`;

    let response: Response;
    try {
        response = await fetch(`${BASE_URL}${path}`, {
            method,
            headers,
            body: body === undefined ? undefined : JSON.stringify(body),
        });
    } catch {
        throw new ApiError(0, 'Could not reach the API. Check your connection and try again.');
    }

    if (response.status === 204) return undefined as T;

    const text = await response.text();
    let payload: Envelope<T> | null = null;
    if (text) {
        try {
            payload = JSON.parse(text) as Envelope<T>;
        } catch {
            payload = null;
        }
    }

    if (!response.ok) {
        if (response.status === 401 && auth) {
            setToken(null);
            onUnauthorized?.();
        }
        const message = payload?.message || response.statusText || `Request failed with status ${response.status}`;
        throw new ApiError(response.status, message, payload?.errors);
    }

    return payload?.data as T;
}

// Auth
export const register = (input: RegisterInput) =>
    request<AuthPayload>('POST', '/register', { body: input, auth: false });

export const login = (input: LoginInput) =>
    request<AuthPayload>('POST', '/login', { body: input, auth: false });

export const logout = () => request<unknown>('POST', '/logout');

export const getUser = () => request<User>('GET', '/user');

// Projects
export const listProjects = () => request<Project[]>('GET', '/projects');

export const createProject = (input: ProjectInput) =>
    request<Project>('POST', '/projects', { body: input });

export const updateProject = (id: number, input: Partial<ProjectInput>) =>
    request<Project>('PUT', `/projects/${id}`, { body: input });

export const deleteProject = (id: number) => request<void>('DELETE', `/projects/${id}`);

// Tasks
export const listTasks = (projectId: number, status?: TaskStatus) => {
    const params = new URLSearchParams({ project_id: String(projectId) });
    if (status) params.set('status', status);
    return request<Task[]>('GET', `/tasks?${params.toString()}`);
};

export const createTask = (input: CreateTaskInput) =>
    request<Task>('POST', '/tasks', { body: input });

export const updateTask = (id: number, input: UpdateTaskInput) =>
    request<Task>('PUT', `/tasks/${id}`, { body: input });

export const deleteTask = (id: number) => request<void>('DELETE', `/tasks/${id}`);

export const reorderTasks = (status: TaskStatus, taskIds: number[]) =>
    request<Task[]>('POST', '/tasks/reorder', { body: { status, task_ids: taskIds } });

// Workspace
export const getTenant = () => request<Tenant>('GET', '/tenant');

export const updateTenant = (input: TenantInput) => request<Tenant>('PUT', '/tenant', { body: input });

// Members
export const listMembers = () => request<Member[]>('GET', '/tenant/members');

export const removeMember = (id: number) => request<void>('DELETE', `/tenant/members/${id}`);

// Invitations
export const listInvitations = () => request<Invitation[]>('GET', '/tenant/invitations');

export const createInvitation = (input: InvitationInput) =>
    request<Invitation>('POST', '/tenant/invitations', { body: input });

export const revokeInvitation = (id: number) => request<void>('DELETE', `/tenant/invitations/${id}`);

export const getInvitation = (token: string) =>
    request<InvitationPreview>('GET', `/invitations/${encodeURIComponent(token)}`, { auth: false });

export const acceptInvitation = (token: string, input: AcceptInvitationInput) =>
    request<AuthPayload>('POST', `/invitations/${encodeURIComponent(token)}/accept`, { body: input, auth: false });

// Personal API tokens (used by MCP clients such as Claude Code)
export const listTokens = () => request<ApiToken[]>('GET', '/tokens');

export const createToken = (input: ApiTokenInput) =>
    request<CreatedApiToken>('POST', '/tokens', { body: input });

export const revokeToken = (id: number) => request<void>('DELETE', `/tokens/${id}`);
