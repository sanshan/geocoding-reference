import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';

import App from './app';

describe('App', () => {
    it('renders the application title', () => {
        const queryClient = new QueryClient({
            defaultOptions: {
                queries: {
                    retry: false,
                },
                mutations: {
                    retry: false,
                },
            },
        });

        render(
            <QueryClientProvider client={queryClient}>
                <MantineProvider>
                    <App />
                </MantineProvider>
            </QueryClientProvider>,
        );

        expect(screen.getByRole('heading', { name: 'Geocoding' })).toBeTruthy();
    });
});
