import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import '@mantine/core/styles.css';
import 'leaflet/dist/leaflet.css';

import App from './app/app';

const queryClient = new QueryClient();

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

root.render(
    <StrictMode>
        <QueryClientProvider client={queryClient}>
            <MantineProvider>
                <App />
            </MantineProvider>
        </QueryClientProvider>
    </StrictMode>,
);
