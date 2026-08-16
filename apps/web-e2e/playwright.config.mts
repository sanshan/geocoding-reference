import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './src',

    use: {
        baseURL: 'http://localhost:4200',
        trace: 'on-first-retry',
    },

    webServer: [
        {
            command: 'node scripts/fixture-server.mjs',
            url: 'http://127.0.0.1:4300/US.zip',
            reuseExistingServer: true,
        },
        {
            command: 'pnpm exec nx build @geocoding/api && node ../api/dist/src/main.js',
            url: 'http://localhost:3000/api/health',
            reuseExistingServer: true,
            env: {
                ...process.env,
                DATASET_URL: 'http://127.0.0.1:4300/US.zip',
            },
        },
        {
            command: 'pnpm exec vite --host localhost --port 4200',
            cwd: '../web',
            url: 'http://localhost:4200',
            reuseExistingServer: true,
        },
    ],

    projects: [
        {
            name: 'setup',
            testMatch: /.*\.setup\.ts/,
        },
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
            dependencies: ['setup'],
            testIgnore: /.*\.setup\.ts/,
        },
    ],
});
