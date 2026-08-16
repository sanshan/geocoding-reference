import type { LocationResult } from '../types/location-result';

export async function searchLocations(query: string): Promise<LocationResult[]> {
    const response = await fetch(`/api/geocoding/search?q=${encodeURIComponent(query)}`);

    if (!response.ok) {
        throw new Error(`Failed to search locations: ${response.status}`);
    }

    return response.json() as Promise<LocationResult[]>;
}

type ReverseGeocodeParams = {
    latitude: number;
    longitude: number;
};

export async function reverseGeocode({
    latitude,
    longitude,
}: ReverseGeocodeParams): Promise<LocationResult | null> {
    const params = new URLSearchParams({
        latitude: String(latitude),
        longitude: String(longitude),
    });

    const response = await fetch(`/api/geocoding/reverse?${params}`);

    if (!response.ok) {
        throw new Error(`Failed to reverse geocode location: ${response.status}`);
    }

    const body = await response.text();

    if (!body) {
        return null;
    }

    return JSON.parse(body) as LocationResult;
}

export type StartImportResponse = {
    id: string;
    status: 'running';
};

export async function startLocationsImport(): Promise<StartImportResponse> {
    const response = await fetch('/api/geocoding/import', {
        method: 'POST',
    });

    if (!response.ok) {
        throw new Error(`Failed to start import: ${response.status}`);
    }

    return response.json() as Promise<StartImportResponse>;
}
