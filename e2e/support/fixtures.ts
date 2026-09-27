import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { test as base, expect, type Page } from '@playwright/test';
import { API_DIR, API_ENV, DB_FILE } from './env';

/** Run SQL against the API's database, for putting a workspace in a given billing state. */
export function sql<T = Record<string, unknown>>(query: string): T[] {
    const out = execFileSync('php', [path.join(__dirname, 'db.php'), DB_FILE, query]).toString();
    return JSON.parse(out || '[]') as T[];
}

/** "2026-09-27 10:00:00", the format Laravel stores in SQLite; `days` from now. */
export function timestamp(days = 0): string {
    return new Date(Date.now() + days * 86_400_000).toISOString().replace('T', ' ').slice(0, 19);
}

/** Sign in as the seeded owner (demo@example.com), who owns the "Demo Workspace". */
export async function signIn(page: Page, email = 'demo@example.com', password = 'password'): Promise<void> {
    await page.goto('/login');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password', { exact: true }).fill(password);
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await page.waitForURL('/');
}

// Error statuses the API returns on purpose in these tests; the browser logs each one.
const EXPECTED_HTTP_ERRORS = /status of (401|402|403|404|409|410|422|503)/;

export const test = base.extend<{ freshDatabase: void; consoleErrors: string[] }>({
    // Every test starts from a newly migrated and seeded database.
    freshDatabase: [
        async ({}, use) => {
            execFileSync('php', ['artisan', 'migrate:fresh', '--seed', '--force'], {
                cwd: API_DIR,
                env: { ...process.env, ...API_ENV },
                stdio: 'pipe',
            });
            await use();
        },
        { auto: true },
    ],

    // Fails the test on any script error or unexpected console error.
    consoleErrors: [
        async ({ page }, use) => {
            const errors: string[] = [];
            page.on('pageerror', (error) => errors.push(String(error)));
            page.on('console', (message) => {
                if (message.type() === 'error' && !EXPECTED_HTTP_ERRORS.test(message.text()) && !/favicon/.test(message.text())) {
                    errors.push(message.text());
                }
            });
            await use(errors);
            expect(errors, 'browser errors').toEqual([]);
        },
        { auto: true },
    ],
});

export { expect };
