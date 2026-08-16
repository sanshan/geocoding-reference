import { expect, test } from '@playwright/test';

type LocationResult = {
    formattedAddress: string;
    zipCode: string;
};

test('reverse geocodes a location selected on the map', async ({ page }) => {
    await page.goto('/');

    const map = page.locator('.leaflet-container');

    await expect(map).toBeVisible();

    const reverseResponsePromise = page.waitForResponse(
        (response) =>
            response.url().includes('/api/geocoding/reverse') &&
            response.request().method() === 'GET' &&
            response.status() === 200,
    );

    await map.click({
        position: {
            x: 580,
            y: 260,
        },
    });

    const reverseResponse = await reverseResponsePromise;
    const location = (await reverseResponse.json()) as LocationResult;

    const search = page.getByRole('combobox', { name: 'Location' });

    await expect(search).toHaveValue(location.formattedAddress);

    const details = page.locator('aside');

    await expect(details.getByText(location.formattedAddress, { exact: true })).toBeVisible();

    await expect(details.getByText(location.zipCode, { exact: true })).toBeVisible();

    await expect(page.locator('.leaflet-marker-icon')).toBeVisible();
});
