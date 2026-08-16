import type { Config } from 'jest';

const config: Config = {
    displayName: '@geocoding/api:external',
    preset: '../../jest.preset.js',
    testEnvironment: 'node',
    testMatch: ['<rootDir>/src/**/*.e2e-spec.ts'],
};

export default config;
