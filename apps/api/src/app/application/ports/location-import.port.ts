import type { NewLocation } from '../../domain/new-location.vo';

export interface InsertLocationsResult {
    inserted: number;
}

export abstract class LocationImportPort {
    abstract insertMany(locations: NewLocation[]): Promise<InsertLocationsResult>;
}
