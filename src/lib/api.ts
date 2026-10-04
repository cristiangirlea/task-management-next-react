import type {
    AcceptInvitationInput,
    ApiToken,
    ApiTokenInput,
    AuthPayload,
    Billing,
    BroadcastingConfig,
    ChannelAuthorization,
    CreatedApiToken,
    CreateTaskInput,
    ForgotPasswordInput,
    Invitation,
    InvitationInput,
    InvitationPreview,
    LoginInput,
    Member,
    OAuthAnswer,
    OAuthAuthorization,
    OAuthConnection,
    Project,
    ProjectInput,
    RedirectUrl,
    RecoveryCodes,
    RegisterInput,
    ResetPasswordInput,
    Task,
    TaskStatus,
    Tenant,
    TenantInput,
    TwoFactorAnswer,
    TwoFactorChallenge,
    TwoFactorSetup,
    UpdateTaskInput,
    User,
    ValidationErrors,
} from '@/types';
import { TOKEN_KEY, readStorage, writeStorage } from './storage';

const BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api').replace(/\/+$/, '');

/**
 * The API host without the `/api` prefix, e.g. for the MCP endpoint at
 * `<origin>/mcp`. A relative base (the production image uses `/api`) means the
 * API is served from the page's own origin.
 */
export function apiOrigin(): string {
    const origin = BASE_URL.replace(/\/api$/, '');
    if (/^https?:\/\//.test(origin) || typeof window === 'undefined') return origin;
    return `${window.location.origin}${origin}`;
}

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

type SocketIdProvider = () => string | undefined;
let socketId: SocketIdProvider | null = null;

/**
 * Registered while the board listens for live updates: every request then
 * names this browser's connection (X-Socket-ID), so the API does not send the
 * browser news of its own changes.
 */
export function setSocketIdProvider(provider: SocketIdProvider | null): void {
    socketId = provider;
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
    /** Set to false for the few Laravel responses that are not wrapped in { status, message, data }. */
    envelope?: boolean;
};

async function request<T>(method: string, path: string, options: RequestOptions = {}): Promise<T> {
    const { body, auth = true, envelope = true } = options;
    const headers: Record<string, string> = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
    };
    const token = auth ? getToken() : null;
    if (token) headers.Authorization = `Bearer ${token}`;
    const socket = socketId?.();
    if (socket) headers['X-Socket-ID'] = socket;

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

    return (envelope ? payload?.data : payload) as T;
}

// Auth
export const register = (input: RegisterInput) =>
    request<AuthPayload>('POST', '/register', { body: input, auth: false });

export const login = (input: LoginInput) =>
    request<AuthPayload | TwoFactorChallenge>('POST', '/login', { body: input, auth: false });

export const loginTwoFactor = (challenge: string, answer: TwoFactorAnswer) =>
    request<AuthPayload>('POST', '/login/two-factor', { body: { challenge, ...answer }, auth: false });

export const logout = () => request<unknown>('POST', '/logout');

export const getUser = () => request<User>('GET', '/user');

// Password recovery and email verification
/** Always succeeds, even for an unknown address: the API never reveals whether an account exists. */
export const forgotPassword = (input: ForgotPasswordInput) =>
    request<void>('POST', '/forgot-password', { body: input, auth: false });

/** On success the API revokes every token of that account, so the user has to sign in again. */
export const resetPassword = (input: ResetPasswordInput) =>
    request<void>('POST', '/reset-password', { body: input, auth: false });

/** Sends the verification email again; the endpoint is throttled and answers 429 when called too often. */
export const resendVerificationEmail = () => request<void>('POST', '/email/verification-notification');

// Two-factor authentication (each step but confirming asks for the password again)
export const startTwoFactor = (password: string) =>
    request<TwoFactorSetup>('POST', '/user/two-factor', { body: { password } });

export const confirmTwoFactor = (code: string) =>
    request<RecoveryCodes & { user: User }>('POST', '/user/two-factor/confirm', { body: { code } });

export const disableTwoFactor = (password: string) =>
    request<User>('DELETE', '/user/two-factor', { body: { password } });

export const regenerateRecoveryCodes = (password: string) =>
    request<RecoveryCodes>('POST', '/user/two-factor/recovery-codes', { body: { password } });

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

/** Live board updates: Reverb's public key and address, or null when they are off. */
export const getBroadcastingConfig = () => request<BroadcastingConfig | null>('GET', '/broadcasting/config');

/** Lets this browser's connection listen on a private channel (Pusher's channel authorization). */
export const authorizeChannel = (socketId: string, channelName: string) =>
    request<ChannelAuthorization>('POST', '/broadcasting/auth', {
        body: { socket_id: socketId, channel_name: channelName },
        envelope: false,
    });

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

/** Emails a new link (the old one stops working); the response carries it, once. */
export const resendInvitation = (id: number) => request<Invitation>('POST', `/tenant/invitations/${id}/resend`);

export const revokeInvitation = (id: number) => request<void>('DELETE', `/tenant/invitations/${id}`);

export const getInvitation = (token: string) =>
    request<InvitationPreview>('GET', `/invitations/${encodeURIComponent(token)}`, { auth: false });

export const acceptInvitation = (token: string, input: AcceptInvitationInput) =>
    request<AuthPayload>('POST', `/invitations/${encodeURIComponent(token)}/accept`, { body: input, auth: false });

// Billing
export const getBilling = () => request<Billing>('GET', '/billing');

/** A Stripe Checkout page for the Team plan (owners). */
export const startCheckout = () => request<RedirectUrl>('POST', '/billing/checkout');

/** The Stripe billing portal: card, invoices, cancellation (owners). */
export const openBillingPortal = () => request<RedirectUrl>('POST', '/billing/portal');

// Personal API tokens (used by MCP clients such as Claude Code)
export const listTokens = () => request<ApiToken[]>('GET', '/tokens');

export const createToken = (input: ApiTokenInput) =>
    request<CreatedApiToken>('POST', '/tokens', { body: input });

export const revokeToken = (id: number) => request<void>('DELETE', `/tokens/${id}`);

// OAuth for MCP clients: the consent screen and the apps allowed in
export const getOAuthAuthorization = (id: string) =>
    request<OAuthAuthorization>('GET', `/oauth/authorizations/${encodeURIComponent(id)}`);

export const approveOAuthAuthorization = (id: string) =>
    request<OAuthAnswer>('POST', `/oauth/authorizations/${encodeURIComponent(id)}/approve`);

export const denyOAuthAuthorization = (id: string) =>
    request<OAuthAnswer>('POST', `/oauth/authorizations/${encodeURIComponent(id)}/deny`);

export const listOAuthConnections = () => request<OAuthConnection[]>('GET', '/oauth/connections');

export const disconnectOAuthConnection = (clientId: string) =>
    request<void>('DELETE', `/oauth/connections/${encodeURIComponent(clientId)}`);
