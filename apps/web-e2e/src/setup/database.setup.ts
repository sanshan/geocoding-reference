import { type APIRequestContext, expect, test } from '@playwright/test';

const API_BASE_URL = 'http://localhost:3000';

async function hasDataset(request: APIRequestContext): Promise<boolean> {
    const response = await request.get(`${API_BASE_URL}/api/geocoding/search?q=10001`);

    if (!response.ok()) {
        throw new Error(`Failed to check dataset: ${response.status()}`);
    }

    const locations = (await response.json()) as unknown[];

    return locations.length > 0;
}

async function startImportIfNeeded(request: APIRequestContext): Promise<void> {
    if (await hasDataset(request)) {
        return;
    }

    const response = await request.post(`${API_BASE_URL}/api/geocoding/import`);

    if (response.status() !== 202) {
        throw new Error(`Failed to start dataset import: ${response.status()}`);
    }
}

test('ensure geocoding dataset is imported', async ({ request }) => {
    await startImportIfNeeded(request);

    await expect
        .poll(() => hasDataset(request), {
            message: 'Waiting for geocoding dataset import to complete',
            timeout: 60_000,
            intervals: [500, 1_000, 2_000],
        })
        .toBe(true);
});
