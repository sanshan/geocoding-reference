import { Loader, Stack, Text, Title } from '@mantine/core';

import type { LocationResult } from '../../types/location-result';

type LocationDetailsProps = {
    location: LocationResult | null;
    isLoading: boolean;
    isError: boolean;
};

export function LocationDetails({ location, isLoading, isError }: LocationDetailsProps) {
    if (isLoading) {
        return (
            <Stack gap="sm">
                <Title order={3}>Location</Title>
                <Loader size="sm" />
            </Stack>
        );
    }

    if (isError) {
        return (
            <Stack gap="sm">
                <Title order={3}>Location</Title>
                <Text c="red">Failed to resolve location</Text>
            </Stack>
        );
    }

    if (!location) {
        return (
            <Stack gap="sm">
                <Title order={3}>Location</Title>
                <Text c="dimmed">Select a location or click on the map</Text>
            </Stack>
        );
    }

    return (
        <Stack gap="lg">
            <Title order={3}>Location</Title>

            <div>
                <Text size="sm" c="dimmed">
                    Address
                </Text>
                <Text fw={500}>{location.formattedAddress}</Text>
            </div>

            <div>
                <Text size="sm" c="dimmed">
                    ZIP code
                </Text>
                <Text>{location.zipCode}</Text>
            </div>

            <div>
                <Text size="sm" c="dimmed">
                    Coordinates
                </Text>
                <Text>
                    {location.latitude}, {location.longitude}
                </Text>
            </div>
        </Stack>
    );
}
