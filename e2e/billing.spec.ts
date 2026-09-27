import type { Page } from '@playwright/test';
import { expect, signIn, sql, test, timestamp } from './support/fixtures';

// The seeded owner's workspace is tenant 1; Stripe itself is never reached.
const billingCard = (page: Page) => page.locator('section#billing');
const membersCard = (page: Page) => page.locator('section[aria-label="Members"]');

async function invite(page: Page, email: string): Promise<string> {
    await page.getByLabel('Invite by email').fill(email);
    await page.getByRole('button', { name: 'Send invite' }).click();
    await expect(page.getByRole('row').filter({ hasText: email })).toBeVisible();
    return (await page.getByLabel('Invitation link').textContent())!.trim();
}

/** The state Stripe's webhook leaves after a completed checkout. */
function subscribe(overrides: { status?: string; endsAt?: string } = {}): void {
    sql(`update tenants set stripe_id = 'cus_e2e' where id = 1`);
    sql(
        `insert into subscriptions (tenant_id, type, stripe_id, stripe_status, stripe_price, quantity, ends_at, created_at, updated_at)
         values (1, 'default', 'sub_e2e', '${overrides.status ?? 'active'}', 'price_e2e', 1, ${overrides.endsAt ? `'${overrides.endsAt}'` : 'null'}, '${timestamp()}', '${timestamp()}')`,
    );
}

test.beforeEach(async ({ page }) => {
    await signIn(page);
    await page.goto('/settings');
});

test('a free workspace shows its plan, price and seats', async ({ page }) => {
    const card = billingCard(page);
    await expect(card.getByRole('button', { name: 'Upgrade to Team' })).toBeVisible();
    await expect(card).toContainText('$8.00 per member per month');
    await expect(card).toContainText('1 of 3 seats used.');
    await expect(membersCard(page)).toContainText('1 of 3 seats used.');
});

test('pending invitations fill the free seats and the next invite points to the upgrade', async ({ page }) => {
    await invite(page, 'anna@example.com');
    await invite(page, 'ben@example.com');
    await expect(billingCard(page)).toContainText('1 of 3 seats used, 2 held by pending invitations. The workspace is full.');

    await page.getByLabel('Invite by email').fill('carl@example.com');
    await page.getByRole('button', { name: 'Send invite' }).click();

    const invitations = page.locator('section[aria-label="Invitations"]');
    await expect(invitations.getByRole('alert')).toContainText('The Free plan includes up to 3 members');
    await invitations.getByRole('link', { name: 'See plans and upgrade' }).click();
    await expect(page).toHaveURL(/#billing$/);
});

test('upgrading on a server without Stripe says billing is not configured', async ({ page }) => {
    await billingCard(page).getByRole('button', { name: 'Upgrade to Team' }).click();
    await expect(page.locator('.alert-error').filter({ hasText: 'Billing is not configured' })).toBeVisible();
});

test('the MCP command points at this origin', async ({ page }) => {
    await page.getByLabel('Token name').fill('e2e');
    await page.getByRole('button', { name: 'Create token' }).click();
    await expect(page.getByLabel('Claude Code MCP command')).toContainText(' http://localhost:3200/mcp ');
});

test('returning from checkout confirms the Team plan', async ({ page }) => {
    subscribe();
    await page.goto('/settings?billing=success');

    await expect(page.locator('.alert-success').filter({ hasText: 'now on the Team plan' })).toBeVisible();
    await expect(page).toHaveURL(/\/settings$/);
    const card = billingCard(page);
    await expect(card.getByRole('button', { name: 'Manage billing' })).toBeVisible();
    await expect(card.getByRole('button', { name: 'Upgrade to Team' })).toHaveCount(0);
    await expect(card.locator('progress')).toHaveCount(0);
    await expect(membersCard(page)).toContainText('1 member.');
});

test('a payment Stripe never confirms keeps the upgrade off and says so', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto('/settings?billing=success');

    const card = billingCard(page);
    await expect(card.getByText('Stripe has not confirmed your payment yet')).toBeVisible({ timeout: 30_000 });
    await expect(card.getByRole('button', { name: 'Upgrade to Team' })).toBeDisabled();

    subscribe();
    await card.getByRole('button', { name: 'Check again' }).click();
    await expect(page.locator('.alert-success').filter({ hasText: 'now on the Team plan' })).toBeVisible();
    await expect(card.getByRole('button', { name: 'Manage billing' })).toBeVisible();
});

test('a failed payment and a cancellation are shown', async ({ page }) => {
    subscribe({ status: 'past_due' });
    await page.reload();
    await expect(billingCard(page).getByText('Payment problem')).toBeVisible();
    await expect(billingCard(page)).toContainText('Stripe could not charge the card on file');

    sql(`update subscriptions set stripe_status = 'active', ends_at = '${timestamp(10)}'`);
    await page.goto('/settings?billing=cancel');
    await expect(page.locator('.alert-error').filter({ hasText: 'Checkout was cancelled' })).toBeVisible();
    await expect(billingCard(page).getByText(/^Ends /)).toBeVisible();
});

test('members see the plan but cannot change it', async ({ page, browser }) => {
    subscribe();
    const link = await invite(page, 'anna@example.com');
    const token = link.split('/invite/')[1];

    const joined = await page.evaluate(async (t) => {
        const res = await fetch(`/api/invitations/${t}/accept`, {
            method: 'POST',
            headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Anna', password: 'secret-password', password_confirmation: 'secret-password' }),
        });
        return { status: res.status, token: (await res.json()).data?.token as string };
    }, token);
    expect(joined.status).toBe(201);

    const member = await browser.newContext();
    await member.addInitScript((t) => localStorage.setItem('tm.token', t), joined.token);
    const memberPage = await member.newPage();
    await memberPage.goto('/settings');
    await expect(billingCard(memberPage).getByText('Ask a workspace owner to change the plan.')).toBeVisible();
    await expect(billingCard(memberPage).getByRole('button')).toHaveCount(0);
    await member.close();
});

test('someone invited into a workspace that has since filled up is told why', async ({ page, browser }) => {
    const link = await invite(page, 'dora@example.com');
    // Two people joined by other means in the meantime.
    for (const email of ['x@example.com', 'y@example.com']) {
        sql(`insert into users (tenant_id, role, name, email, password, created_at, updated_at) values (1, 'member', 'X', '${email}', 'x', '${timestamp()}', '${timestamp()}')`);
    }

    const visitor = await (await browser.newContext()).newPage();
    await visitor.goto(link);
    await visitor.getByLabel('Name').fill('Dora');
    await visitor.getByLabel('Password', { exact: true }).fill('secret-password');
    await visitor.getByLabel('Confirm password').fill('secret-password');
    await visitor.getByRole('button', { name: 'Accept invitation' }).click();

    await expect(visitor.locator('.alert[role="alert"]')).toContainText('no free seats');
    expect(sql(`select count(*) as n from users where email = 'dora@example.com'`)[0].n).toBe(0);
});
