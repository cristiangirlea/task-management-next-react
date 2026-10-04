import type { Page } from '@playwright/test';
import { expect, signIn, test } from './support/fixtures';

// Live board updates through Reverb. Each test waits until the board listens
// before changing anything elsewhere, so only the live update can show it.

/** Resolves once the page's board is subscribed to its project's channel. */
function listening(page: Page): Promise<void> {
    return new Promise((resolve) => {
        page.on('websocket', (socket) =>
            socket.on('framereceived', ({ payload }) => {
                if (String(payload).includes('pusher_internal:subscription_succeeded')) resolve();
            }),
        );
    });
}

/** Marks the document, to tell a live update from a reload. */
async function markDocument(page: Page): Promise<() => Promise<boolean>> {
    await page.evaluate(() => Object.assign(window, { sameDocument: true }));
    return () => page.evaluate(() => 'sameDocument' in window);
}

test('a task added in another browser appears without a reload', async ({ page, browser }) => {
    const subscribed = listening(page);
    await signIn(page);
    await subscribed;
    const unchanged = await markDocument(page);

    const other = await browser.newPage();
    await signIn(other);
    await other.getByRole('region', { name: 'To do' }).getByRole('button', { name: '+ Add task' }).click();
    await other.getByRole('dialog').getByLabel('Title').fill('Added in the other window');
    await other.getByRole('dialog').getByRole('button', { name: 'Create' }).click();
    await expect(other.getByText('Task created')).toBeVisible();
    await other.close();

    await expect(page.getByRole('region', { name: 'To do' }).getByRole('heading', { name: 'Added in the other window' })).toBeVisible();
    expect(await unchanged()).toBe(true);
});

test("an MCP client's move appears without a reload", async ({ page, request }) => {
    const subscribed = listening(page);
    await signIn(page);
    await subscribed;
    const unchanged = await markDocument(page);
    const todo = page.getByRole('region', { name: 'To do' });
    const title = (await todo.getByRole('heading', { level: 3 }).first().textContent())!.trim();

    const login = await request.post('/api/login', { data: { email: 'demo@example.com', password: 'password' } });
    const token = ((await login.json()) as { data: { token: string } }).data.token;
    const auth = { Authorization: `Bearer ${token}` };
    const projectId = await page.getByRole('combobox', { name: 'Project' }).inputValue();
    const tasks = ((await (await request.get(`/api/tasks?project_id=${projectId}`, { headers: auth })).json()) as {
        data: { id: number; title: string }[];
    }).data;
    const task = tasks.find((t) => t.title === title)!;

    const moved = await request.post('/mcp', {
        headers: { ...auth, Accept: 'application/json, text/event-stream' },
        data: { jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'move_task', arguments: { task_id: task.id, status: 'completed' } } },
    });
    expect(moved.status()).toBe(200);

    await expect(page.getByRole('region', { name: 'Done' }).getByRole('heading', { name: title })).toBeVisible();
    await expect(todo.getByRole('heading', { name: title })).toHaveCount(0);
    expect(await unchanged()).toBe(true);
});

test("the board's own changes name its connection, so they are not sent back to it", async ({ page }) => {
    const subscribed = listening(page);
    await signIn(page);
    await subscribed;
    const todo = page.getByRole('region', { name: 'To do' });

    await todo.getByRole('heading', { level: 3 }).first().click();
    const saved = page.waitForRequest((request) => request.method() === 'PUT' && request.url().includes('/api/tasks/'));
    await page.getByRole('dialog').getByRole('combobox', { name: 'Column' }).selectOption({ label: 'In progress' });
    await page.getByRole('dialog').getByRole('button', { name: 'Save' }).click();

    expect((await saved).headers()['x-socket-id']).toMatch(/^\d+\.\d+$/);
});
