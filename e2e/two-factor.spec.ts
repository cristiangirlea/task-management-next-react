import type { Page } from '@playwright/test';
import { expect, signIn, test } from './support/fixtures';
import { totp } from './support/totp';

const card = (page: Page) => page.locator('section[aria-label="Two-factor authentication"]');

async function signOut(page: Page) {
    await page.getByRole('button', { name: 'Logout' }).click();
    await page.waitForURL('/login');
}

/** The first step of signing in, for an account that asks for a second factor. */
async function enterPassword(page: Page) {
    await page.getByLabel('Email').fill('demo@example.com');
    await page.getByLabel('Password', { exact: true }).fill('password');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByRole('heading', { name: 'Two-factor authentication' })).toBeVisible();
}

test('two-factor authentication: set up, sign in with a code or a recovery code, turn off', async ({ page }) => {
    await signIn(page);
    await page.goto('/settings');

    await card(page).getByLabel('Your password').fill('wrong-password');
    await card(page).getByRole('button', { name: 'Set up' }).click();
    await expect(card(page)).toContainText('The password is incorrect');

    await card(page).getByLabel('Your password').fill('password');
    await card(page).getByRole('button', { name: 'Set up' }).click();
    await expect(card(page).getByRole('img', { name: /QR code/ })).toBeVisible();
    const secret = (await card(page).getByLabel('Setup key').textContent())!.trim();

    await card(page).getByLabel('Code from the app').fill('000000');
    await card(page).getByRole('button', { name: 'Turn on' }).click();
    await expect(card(page)).toContainText('That code is not valid.');

    await card(page).getByLabel('Code from the app').fill(totp(secret));
    await card(page).getByRole('button', { name: 'Turn on' }).click();
    const recoveryCodes = (await card(page).getByLabel('Recovery codes').textContent())!.trim().split('\n');
    expect(recoveryCodes).toHaveLength(8);
    await card(page).getByRole('button', { name: 'I have saved them' }).click();
    await expect(card(page).getByText('On', { exact: true })).toBeVisible();

    // The code from the app. Setting up used the current one, and each works once.
    await signOut(page);
    await enterPassword(page);
    await page.getByLabel('Authentication code').fill('111111');
    await page.getByRole('button', { name: 'Verify' }).click();
    await expect(page.getByText('That code is not valid.')).toBeVisible();
    await page.getByLabel('Authentication code').fill(totp(secret, 1));
    await page.getByRole('button', { name: 'Verify' }).click();
    await page.waitForURL('/');

    // A recovery code, once.
    await signOut(page);
    await enterPassword(page);
    await page.getByRole('button', { name: 'Use a recovery code' }).click();
    await page.getByLabel('Recovery code').fill(recoveryCodes[0]);
    await page.getByRole('button', { name: 'Verify' }).click();
    await page.waitForURL('/');

    await signOut(page);
    await enterPassword(page);
    await page.getByRole('button', { name: 'Use a recovery code' }).click();
    await page.getByLabel('Recovery code').fill(recoveryCodes[0]);
    await page.getByRole('button', { name: 'Verify' }).click();
    await expect(page.getByText('That code is not valid.')).toBeVisible();
    await page.getByLabel('Recovery code').fill(recoveryCodes[1]);
    await page.getByRole('button', { name: 'Verify' }).click();
    await page.waitForURL('/');

    // Turning it off makes signing in one step again.
    await page.goto('/settings');
    await card(page).getByLabel('Your password').fill('password');
    await card(page).getByRole('button', { name: 'Turn off' }).click();
    await expect(card(page).getByText('Off', { exact: true })).toBeVisible();
    await signOut(page);
    await signIn(page);
});

test('an expired sign-in goes back to the password step', async ({ page }) => {
    await signIn(page);
    await page.goto('/settings');
    await card(page).getByLabel('Your password').fill('password');
    await card(page).getByRole('button', { name: 'Set up' }).click();
    const secret = (await card(page).getByLabel('Setup key').textContent())!.trim();
    await card(page).getByLabel('Code from the app').fill(totp(secret));
    await card(page).getByRole('button', { name: 'Turn on' }).click();
    await card(page).getByRole('button', { name: 'I have saved them' }).click();

    await signOut(page);
    await enterPassword(page);
    // The API forgets the challenge (expired, or out of attempts).
    await page.route('**/api/login/two-factor', (route) =>
        route.fulfill({
            status: 422,
            json: { status: 'error', message: 'Validation failed.', errors: { challenge: ['This sign-in has expired. Sign in again.'] } },
        }),
    );
    await page.getByLabel('Authentication code').fill(totp(secret, 1));
    await page.getByRole('button', { name: 'Verify' }).click();

    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
    await expect(page.getByText('This sign-in has expired. Sign in again.')).toBeVisible();
});
