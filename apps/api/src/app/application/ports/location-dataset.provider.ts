export abstract class LocationDatasetProvider {
    abstract stream(): AsyncIterable<LocationDatasetRecord>;
}

export interface LocationDatasetRecord {
    zipCode: string;
    city: string;
    stateCode: string;
    stateName: string;
    county: string | null;
    latitude: number;
    longitude: number;
    accuracy: number | null;
}
