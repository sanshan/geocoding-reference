import { useEffect, useState } from 'react';
import { Autocomplete, Loader, Text } from '@mantine/core';

import { useLocationSearch } from '../../hooks/use-location-search';
import type { LocationResult } from '../../types/location-result';

type LocationSearchProps = {
    selectedLocation: LocationResult | null;
    onSelect: (location: LocationResult) => void;
};

export function LocationSearch({ selectedLocation, onSelect }: LocationSearchProps) {
    const [inputValue, setInputValue] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const {
        data: results = [],
        isLoading,
        isError,
        isSuccess,
        debouncedQuery,
    } = useLocationSearch(searchQuery);

    const data = results.map((location) => location.formattedAddress);

    const nothingFound =
        searchQuery.trim() === debouncedQuery &&
        debouncedQuery.length > 0 &&
        isSuccess &&
        results.length === 0;

    useEffect(() => {
        if (!selectedLocation) {
            return;
        }

        setInputValue(selectedLocation.formattedAddress);
        setSearchQuery('');
    }, [selectedLocation]);

    function handleInputChange(value: string) {
        setInputValue(value);
        setSearchQuery(value);
    }

    function handleSelect(value: string) {
        const selected = results.find((location) => location.formattedAddress === value);

        if (!selected) {
            return;
        }

        setInputValue(selected.formattedAddress);
        setSearchQuery('');
        onSelect(selected);
    }

    return (
        <>
            <Autocomplete
                label="Location"
                placeholder="Search location..."
                value={inputValue}
                data={data}
                onChange={handleInputChange}
                onOptionSubmit={handleSelect}
                rightSection={isLoading ? <Loader size="xs" /> : undefined}
                error={isError ? 'Failed to search locations' : undefined}
                limit={8}
            />

            <Text size="sm" c="dimmed" mt={4} mih={20}>
                {nothingFound ? 'No locations found' : ''}
            </Text>
        </>
    );
}
