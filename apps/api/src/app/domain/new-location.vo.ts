export interface NewLocation {
    zipCode: string;
    city: string;
    stateCode: string;
    stateName: string;
    county: string | null;
    coordinates: {
        latitude: number;
        longitude: number;
    };
    accuracy: number | null;
}
