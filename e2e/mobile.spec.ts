import { expect, signIn, test } from './support/fixtures';

test.describe('on a phone', () => {
    test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

    test('the board fits the screen, and the switcher moves between columns', async ({ page }) => {
        await signIn(page);
        const todo = page.getByRole('region', { name: 'To do' });
        const done = page.getByRole('region', { name: 'Done' });
        await expect(todo).toBeVisible();

        // Only the board scrolls sideways, never the page.
        const width = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
        expect(width[0]).toBeLessThanOrEqual(width[1]);

        const switcher = page.getByRole('group', { name: 'Columns' });
        await expect(switcher.getByRole('button', { name: /To do/ })).toHaveAttribute('aria-pressed', 'true');
        await expect(done).not.toBeInViewport({ ratio: 0.9 });

        await switcher.getByRole('button', { name: /Done/ }).click();
        await expect(done).toBeInViewport({ ratio: 0.9 });
        await expect(switcher.getByRole('button', { name: /Done/ })).toHaveAttribute('aria-pressed', 'true');
    });

    test('a task moves to another column from its dialog, without dragging', async ({ page }) => {
        await signIn(page);
        const todo = page.getByRole('region', { name: 'To do' });
        const done = page.getByRole('region', { name: 'Done' });
        const title = (await todo.getByRole('heading', { level: 3 }).first().textContent())!.trim();

        // A tap opens the task (a long press would pick it up to drag).
        await todo.getByRole('heading', { name: title }).tap();
        const dialog = page.getByRole('dialog');
        // Not getByLabel: the label wraps the select, so its text includes the options.
        await dialog.getByRole('combobox', { name: 'Column' }).selectOption({ label: 'Done' });
        await dialog.getByRole('button', { name: 'Save' }).click();

        await expect(page.getByText('Task updated')).toBeVisible();
        await expect(done.getByRole('heading', { level: 3 }).last()).toHaveText(title);
        await expect(todo.getByRole('heading', { name: title })).toHaveCount(0);
    });
});

test('the app can be installed: manifest, icons and theme colour', async ({ page, request }) => {
    await page.goto('/login');
    const manifestHref = await page.locator('link[rel="manifest"]').getAttribute('href');
    expect(manifestHref).toBeTruthy();
    await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveCount(1);
    await expect(page.locator('meta[name="theme-color"][media="(prefers-color-scheme: light)"]')).toHaveAttribute('content', '#ffffff');
    await expect(page.locator('meta[name="theme-color"][media="(prefers-color-scheme: dark)"]')).toHaveAttribute('content', '#1d232a');

    const manifest = await (await request.get(manifestHref!)).json();
    expect(manifest).toMatchObject({ name: 'Task Board', start_url: '/', display: 'standalone' });
    for (const icon of manifest.icons as { src: string; sizes: string; purpose: string }[]) {
        const response = await request.get(icon.src);
        expect(response.status(), icon.src).toBe(200);
        expect(response.headers()['content-type']).toBe('image/png');
    }
    expect(manifest.icons.map((icon: { purpose: string }) => icon.purpose)).toContain('maskable');
});
