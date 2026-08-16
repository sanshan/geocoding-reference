import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useLocationSearch } from '../../hooks/use-location-search';
import type { LocationResult } from '../../types/location-result';
import { LocationSearch } from './location-search';

vi.mock('../../hooks/use-location-search');

const mockedUseLocationSearch = vi.mocked(useLocationSearch);

const location: LocationResult = {
    id: 1,
    zipCode: '10001',
    city: 'New York',
    stateCode: 'NY',
    stateName: 'New York',
    latitude: 40.7484,
    longitude: -73.9967,
    formattedAddress: 'New York, NY 10001',
};

type LocationSearchMock = {
    data: LocationResult[];
    isLoading: boolean;
    isError: boolean;
    isSuccess: boolean;
    debouncedQuery: string;
};

function mockLocationSearch(result: LocationSearchMock) {
    mockedUseLocationSearch.mockReturnValue(
        result as unknown as ReturnType<typeof useLocationSearch>,
    );
}

function renderComponent({
    selectedLocation = null,
    onSelect = vi.fn(),
}: {
    selectedLocation?: LocationResult | null;
    onSelect?: (location: LocationResult) => void;
} = {}) {
    render(
        <MantineProvider>
            <LocationSearch selectedLocation={selectedLocation} onSelect={onSelect} />
        </MantineProvider>,
    );

    return { onSelect };
}

describe('LocationSearch', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('shows search results', async () => {
        const user = userEvent.setup();

        mockLocationSearch({
            data: [location],
            isLoading: false,
            isError: false,
            isSuccess: true,
            debouncedQuery: 'New',
        });

        renderComponent();

        const input = screen.getByRole('combobox', { name: 'Location' });

        await user.type(input, 'New');

        expect(screen.getByText('New York, NY 10001')).toBeInTheDocument();
    });

    it('selects a location', async () => {
        const user = userEvent.setup();
        const onSelect = vi.fn();

        mockLocationSearch({
            data: [location],
            isLoading: false,
            isError: false,
            isSuccess: true,
            debouncedQuery: 'New',
        });

        renderComponent({ onSelect });

        const input = screen.getByRole('combobox', { name: 'Location' });

        await user.type(input, 'New');

        await user.click(screen.getByText('New York, NY 10001'));

        expect(onSelect).toHaveBeenCalledOnce();
        expect(onSelect).toHaveBeenCalledWith(location);
        expect(input).toHaveValue('New York, NY 10001');
    });

    it('shows no locations found after a successful empty search', async () => {
        const user = userEvent.setup();

        mockLocationSearch({
            data: [],
            isLoading: false,
            isError: false,
            isSuccess: true,
            debouncedQuery: 'Unknown',
        });

        renderComponent();

        const input = screen.getByRole('combobox', { name: 'Location' });

        await user.type(input, 'Unknown');

        expect(screen.getByText('No locations found')).toBeInTheDocument();
    });

    it('shows a search error', () => {
        mockLocationSearch({
            data: [],
            isLoading: false,
            isError: true,
            isSuccess: false,
            debouncedQuery: '',
        });

        renderComponent();

        expect(screen.getByText('Failed to search locations')).toBeInTheDocument();
    });

    it('updates the input when selectedLocation changes', () => {
        mockLocationSearch({
            data: [],
            isLoading: false,
            isError: false,
            isSuccess: false,
            debouncedQuery: '',
        });

        renderComponent({
            selectedLocation: location,
        });

        expect(screen.getByRole('combobox', { name: 'Location' })).toHaveValue(
            'New York, NY 10001',
        );
    });
});
