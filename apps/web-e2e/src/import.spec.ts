import { expect, test } from '@playwright/test';

test('imports the dataset and displays live progress', async ({ page }) => {
    test.setTimeout(90_000);

    await page.goto('/');

    const importButton = page.getByRole('button', {
        name: 'Import data',
    });

    await expect(importButton).toBeVisible();

    await importButton.click();

    await expect(page.getByText(/Processed:/)).toBeVisible();
    await expect(page.getByText(/Inserted:/)).toBeVisible();
    await expect(page.getByText(/Skipped:/)).toBeVisible();

    await expect(page.getByText('Import completed')).toBeVisible({
        timeout: 60_000,
    });

    await expect(importButton).toBeEnabled();
});
