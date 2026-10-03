export type Plan = 'free' | 'team';

export type Tenant = {
    id: number;
    name: string;
    slug: string;
    domain: string | null;
    settings: Record<string, unknown> | null;
    plan?: Plan;
    users_count?: number;
    created_at: string;
    updated_at: string;
};

/** `canceled`: cancelled but paid up until `ends_at`. `none`: not subscribed. */
export type BillingStatus = 'none' | 'active' | 'past_due' | 'canceled';

export type Billing = {
    plan: Plan;
    status: BillingStatus;
    /**
     * `used` is members; `pending` is invitations not yet accepted, which also
     * hold a seat on the free plan. `limit` is null on Team (no limit).
     */
    seats: { used: number; pending: number; limit: number | null };
    free_seats: number;
    seat_price_cents: number;
    currency: string;
    ends_at: string | null;
    has_payment_problem: boolean;
    /** Whether the viewer may upgrade or open the billing portal (owners). */
    can_manage: boolean;
};

/** A Stripe-hosted page to send the browser to. */
export type RedirectUrl = { url: string };

/** An MCP client asking to use Task Board as the signed-in person (OAuth consent). */
export type OAuthAuthorization = {
    client: {
        id: string;
        /** Chosen by whoever registered the client, so shown together with `redirect_host`. */
        name: string;
        /** Where the browser goes back to after the answer. */
        redirect_host: string | null;
    };
    scopes: { id: string; description: string }[];
};

/** Where to send the browser after allowing or denying: back to the client. */
export type OAuthAnswer = { redirect_url: string | null };

/** An MCP client someone allowed in, which can still use its tokens. */
export type OAuthConnection = {
    id: string;
    name: string;
    redirect_host: string | null;
    connected_at: string | null;
};

export type Role = 'owner' | 'member';

export type User = {
    id: number;
    name: string;
    email: string;
    role: Role;
    /** Null until the address behind the verification email has been confirmed. */
    email_verified_at: string | null;
    /** Signing in also asks for a code from an authenticator app. */
    two_factor_enabled: boolean;
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

/** What POST /login returns instead of a token when two-factor authentication is on. */
export type TwoFactorChallenge = { two_factor: true; challenge: string };

/** The second sign-in step: a code from the app, or one of the recovery codes. */
export type TwoFactorAnswer = { code: string } | { recovery_code: string };

/** A secret not yet in force: shown as a QR code (a data URI) and as text for typing in. */
export type TwoFactorSetup = { secret: string; otpauth_url: string; qr_code: string };

/** Shown once; each works once. */
export type RecoveryCodes = { recovery_codes: string[] };

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
    /**
     * The link to accept. Only in the response that issued it (sending or
     * re-sending): the API stores just a hash, so it cannot be read again.
     */
    accept_url?: string;
    /** Present with a newly issued link: false when the API could not email it. */
    email_sent?: boolean;
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
