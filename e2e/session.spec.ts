import { expect, signIn, test } from './support/fixtures';

test('the API failing while a page checks the session does not sign the user out', async ({ page }) => {
    await signIn(page);

    await page.route('**/api/user', (route) =>
        route.fulfill({ status: 503, contentType: 'application/json', json: { message: 'Service Unavailable' } }),
    );
    await page.goto('/settings');
    await expect(page).toHaveURL(/\/login$/);

    await page.unroute('**/api/user');
    await page.goto('/settings');
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
});
