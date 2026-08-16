import { expect, test } from '@playwright/test';

test('searches and selects a location', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Geocoding' })).toBeVisible();

    const search = page.getByRole('combobox', { name: 'Location' });

    await search.fill('New York');

    const option = page.getByRole('option', {
        name: 'New York, NY 10001',
    });

    await expect(option).toBeVisible();

    await option.click();

    await expect(search).toHaveValue('New York, NY 10001');

    const details = page.locator('aside');

    await expect(details.getByText('New York, NY 10001', { exact: true })).toBeVisible();

    await expect(details.getByText('10001', { exact: true })).toBeVisible();
});
