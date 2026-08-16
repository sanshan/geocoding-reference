import { useQuery } from '@tanstack/react-query';

import { searchLocations } from '../api/geocoding.api';
import { useDebounce } from './use-debounce';

export function useLocationSearch(query: string) {
    const normalizedQuery = query.trim();
    const debouncedQuery = useDebounce(normalizedQuery, 300);

    const queryResult = useQuery({
        queryKey: ['locations', debouncedQuery],
        queryFn: () => searchLocations(debouncedQuery),
        enabled: debouncedQuery.length > 0,
    });

    return {
        ...queryResult,
        debouncedQuery,
    };
}
