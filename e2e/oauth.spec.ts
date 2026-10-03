import { createHash, randomBytes } from 'node:crypto';
import type { APIRequestContext, Page } from '@playwright/test';
import { expect, signIn, test } from './support/fixtures';

// An MCP client's redirect URI. Nothing listens there: the test catches the
// browser arriving, as the client would.
const REDIRECT = 'http://127.0.0.1:7999/callback';

const MCP_HEADERS = { Accept: 'application/json, text/event-stream' };

async function registerClient(request: APIRequestContext, name = 'Claude'): Promise<string> {
    const response = await request.post('/oauth/register', { data: { client_name: name, redirect_uris: [REDIRECT] } });
    expect(response.status()).toBe(201);
    return ((await response.json()) as { client_id: string }).client_id;
}

/** The address a client sends the browser to, with a PKCE pair (RFC 7636). */
function authorization(clientId: string) {
    const verifier = randomBytes(32).toString('base64url');
    const challenge = createHash('sha256').update(verifier).digest('base64url');
    const query = new URLSearchParams({
        response_type: 'code',
        client_id: clientId,
        redirect_uri: REDIRECT,
        code_challenge: challenge,
        code_challenge_method: 'S256',
        state: 'e2e-state',
        scope: 'mcp:use',
    });
    return { url: `/oauth/authorize?${query}`, verifier };
}

/** Starts listening; the function it gives resolves with the URL the browser is sent back to. */
async function catchCallback(page: Page): Promise<() => Promise<URL>> {
    let arrived!: (url: URL) => void;
    const callback = new Promise<URL>((resolve) => (arrived = resolve));
    await page.route(`${REDIRECT}**`, async (route) => {
        arrived(new URL(route.request().url()));
        await route.fulfill({ status: 200, contentType: 'text/plain', body: 'Connected. You can close this window.' });
    });
    return () => callback;
}

function listTools(request: APIRequestContext, token: string) {
    return request.post('/mcp', {
        headers: { ...MCP_HEADERS, Authorization: `Bearer ${token}` },
        data: { jsonrpc: '2.0', id: 1, method: 'tools/list' },
    });
}

test('an MCP client connects through OAuth, then is disconnected in Settings', async ({ page, request }) => {
    // The client finds the endpoints from the 401.
    const unauthenticated = await request.post('/mcp', {
        headers: MCP_HEADERS,
        data: { jsonrpc: '2.0', id: 1, method: 'tools/list' },
    });
    expect(unauthenticated.status()).toBe(401);
    expect(unauthenticated.headers()['www-authenticate']).toContain('resource_metadata=');

    const clientId = await registerClient(request);
    const { url, verifier } = authorization(clientId);
    const callback = await catchCallback(page);

    // Signed out: sign in first, then straight back to the request.
    await page.goto(url);
    await page.waitForURL(/\/login\?next=/);
    await page.getByLabel('Email').fill('demo@example.com');
    await page.getByLabel('Password', { exact: true }).fill('password');
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page.getByRole('heading', { name: 'Allow Claude?' })).toBeVisible();
    await expect(page.getByText('demo@example.com')).toBeVisible();
    await expect(page.getByText('Demo Workspace')).toBeVisible();
    await expect(page.getByText('127.0.0.1', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Allow' }).click();

    const back = await callback();
    expect(back.searchParams.get('state')).toBe('e2e-state');
    const code = back.searchParams.get('code');
    expect(code).toBeTruthy();

    const exchange = await request.post('/oauth/token', {
        form: { grant_type: 'authorization_code', client_id: clientId, redirect_uri: REDIRECT, code_verifier: verifier, code: code! },
    });
    expect(exchange.status()).toBe(200);
    const { access_token: token } = (await exchange.json()) as { access_token: string };

    const tools = await listTools(request, token);
    expect(tools.status()).toBe(200);
    expect(((await tools.json()) as { result: { tools: unknown[] } }).result.tools.length).toBeGreaterThan(0);

    // Settings lists it, and disconnecting ends its access.
    await page.goto('/settings');
    const card = page.locator('section[aria-label="Connected apps"]');
    const row = card.getByRole('row', { name: /Claude/ });
    await expect(row).toContainText('127.0.0.1');
    await row.getByRole('button', { name: 'Disconnect' }).click();
    await row.getByRole('button', { name: 'Yes' }).click();
    await expect(page.getByText('Claude disconnected')).toBeVisible();
    await expect(card).toContainText('No connected apps.');

    expect((await listTools(request, token)).status()).toBe(401);
});

test('denying sends the client back with access_denied', async ({ page, request }) => {
    await signIn(page);
    const { url } = authorization(await registerClient(request, 'Cursor'));
    const callback = await catchCallback(page);

    await page.goto(url);
    await expect(page.getByRole('heading', { name: 'Allow Cursor?' })).toBeVisible();
    await page.getByRole('button', { name: 'Deny' }).click();

    const back = await callback();
    expect(back.searchParams.get('error')).toBe('access_denied');
    expect(back.searchParams.get('state')).toBe('e2e-state');
    expect(back.searchParams.get('code')).toBeNull();
});

test('another account can answer: signing out and in comes back to the request', async ({ page, request }) => {
    await signIn(page);
    await page.goto(authorization(await registerClient(request, 'VS Code')).url);
    await expect(page.getByRole('heading', { name: 'Allow VS Code?' })).toBeVisible();

    await page.getByRole('button', { name: 'Use a different account' }).click();
    await page.waitForURL(/\/login\?next=%2Fauthorize/);
    await page.getByLabel('Email').fill('demo@example.com');
    await page.getByLabel('Password', { exact: true }).fill('password');
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page.getByRole('heading', { name: 'Allow VS Code?' })).toBeVisible();
});

test('an expired or answered request says so', async ({ page }) => {
    await signIn(page);
    await page.goto('/authorize?request=no-such-request');

    await expect(page.getByRole('alert').filter({ hasText: 'expired' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Allow' })).toHaveCount(0);
});

test('a page that asked for a sign-in is where signing in leads', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForURL('/login?next=%2Fsettings');
    await page.getByLabel('Email').fill('demo@example.com');
    await page.getByLabel('Password', { exact: true }).fill('password');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.waitForURL('/settings');

    // Never off the site, whatever `next` says.
    await page.getByRole('button', { name: 'Logout' }).click();
    await page.goto('/login?next=//evil.example/path');
    await page.getByLabel('Email').fill('demo@example.com');
    await page.getByLabel('Password', { exact: true }).fill('password');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.waitForURL('/');
});
