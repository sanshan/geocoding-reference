import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';

import type { LocationResult } from '../../types/location-result';
import { LocationDetails } from './location-details';

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

function renderComponent(props: Partial<React.ComponentProps<typeof LocationDetails>> = {}) {
    return render(
        <MantineProvider>
            <LocationDetails location={null} isLoading={false} isError={false} {...props} />
        </MantineProvider>,
    );
}

describe('LocationDetails', () => {
    it('shows the empty state', () => {
        renderComponent();

        expect(screen.getByText('Select a location or click on the map')).toBeTruthy();
    });

    it('shows loading state', () => {
        renderComponent({
            isLoading: true,
        });

        expect(screen.getByRole('heading', { name: 'Location' })).toBeTruthy();
    });

    it('shows error state', () => {
        renderComponent({
            isError: true,
        });

        expect(screen.getByText('Failed to resolve location')).toBeTruthy();
    });

    it('shows location details', () => {
        renderComponent({
            location,
        });

        expect(screen.getByText('New York, NY 10001')).toBeTruthy();
        expect(screen.getByText('10001')).toBeTruthy();
        expect(screen.getByText('40.7484, -73.9967')).toBeTruthy();
    });
});
