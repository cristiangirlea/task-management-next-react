import { expect, signIn, test } from './support/fixtures';

// The seeded workspace has two projects with three tasks in each column.

test('a new project is selected, keeps its tasks and is remembered across reloads', async ({ page }) => {
    await signIn(page);
    const project = page.getByRole('combobox', { name: 'Project' });
    const todo = page.getByRole('region', { name: 'To do' });
    await expect(project).toBeEnabled();
    const seeded = await project.inputValue();
    await expect(todo.getByRole('heading', { level: 3 })).toHaveCount(3);

    await page.getByRole('button', { name: 'New project' }).click();
    await page.getByLabel('New project name').fill('E2E Alpha');
    await page.getByRole('button', { name: 'Create', exact: true }).click();
    await expect(project.locator('option:checked')).toHaveText('E2E Alpha');
    await expect(todo.getByText('No tasks yet.')).toBeVisible();

    await todo.getByRole('button', { name: '+ Add task' }).click();
    await page.getByRole('dialog').getByLabel('Title').fill('Write the board test');
    await page.getByRole('dialog').getByRole('button', { name: 'Create' }).click();
    await expect(todo.getByRole('heading', { name: 'Write the board test' })).toBeVisible();

    await page.reload();
    await expect(project.locator('option:checked')).toHaveText('E2E Alpha');
    await expect(todo.getByRole('heading', { level: 3 })).toHaveText(['Write the board test']);

    await project.selectOption(seeded);
    await expect(todo.getByRole('heading', { level: 3 })).toHaveCount(3);
    await expect(todo.getByRole('heading', { name: 'Write the board test' })).toHaveCount(0);

    await project.selectOption({ label: 'E2E Alpha' });
    await expect(todo.getByRole('heading', { level: 3 })).toHaveText(['Write the board test']);
});
