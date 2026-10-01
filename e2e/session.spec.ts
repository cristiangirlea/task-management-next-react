import { expect, signIn, test } from './support/fixtures';

test('when the API fails the session check the user stays signed in and can retry', async ({ page }) => {
    await signIn(page);

    await page.route('**/api/user', (route) =>
        route.fulfill({ status: 503, contentType: 'application/json', json: { message: 'Service Unavailable' } }),
    );
    await page.goto('/settings');
    await expect(page.getByRole('alert').filter({ hasText: "Can't reach Task Board right now" })).toBeVisible();
    await expect(page).toHaveURL(/\/settings$/);
    await expect(page.getByRole('link', { name: 'Log in' })).toHaveCount(0);

    await page.unroute('**/api/user');
    await page.getByRole('button', { name: 'Try again' }).click();
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
});
