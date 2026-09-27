import { expect, signIn, test } from './support/fixtures';

// Invitation links are stored as hashes: shown once, and Resend is how an
// owner gets a working link again.

test('resending replaces the link and the old one stops working', async ({ page, browser }) => {
    await signIn(page);
    await page.goto('/settings');

    await page.getByLabel('Invite by email').fill('eve@example.com');
    await page.getByRole('button', { name: 'Send invite' }).click();
    const firstLink = (await page.getByLabel('Invitation link').textContent())!.trim();

    // The list itself carries no link.
    const row = page.getByRole('row').filter({ hasText: 'eve@example.com' });
    await expect(row.getByRole('button', { name: 'Copy link' })).toHaveCount(0);

    await row.getByRole('button', { name: 'Resend' }).click();
    await expect(page.locator('.alert-success').filter({ hasText: 'Sent a new invitation link to eve@example.com' })).toBeVisible();
    const secondLink = (await page.getByLabel('Invitation link').textContent())!.trim();
    expect(secondLink).not.toBe(firstLink);

    const visitor = await (await browser.newContext()).newPage();
    await visitor.goto(firstLink);
    await expect(visitor.getByText('This invitation link is not valid.')).toBeVisible();
    await visitor.goto(secondLink);
    await expect(visitor.getByRole('button', { name: 'Accept invitation' })).toBeVisible();
});

test('when the invitation email fails the owner is told and still gets the link', async ({ page }) => {
    await signIn(page);
    await page.goto('/settings');

    // The API reports a failed email with email_sent: false (covered by its own tests).
    await page.route('**/api/tenant/invitations', async (route) => {
        if (route.request().method() !== 'POST') return route.fallback();
        const response = await route.fetch();
        const json = await response.json();
        json.data.email_sent = false;
        await route.fulfill({ response, json });
    });

    await page.getByLabel('Invite by email').fill('lost@example.com');
    await page.getByRole('button', { name: 'Send invite' }).click();

    await expect(page.locator('.alert-error').filter({ hasText: 'The email to lost@example.com could not be sent' })).toBeVisible();
    await expect(page.getByLabel('Invitation link')).toContainText('/invite/');
});
