import type { Location } from '../../domain/location.aggregate';

export abstract class LocationPort {
    abstract search(query: string): Promise<Location[]>;
    abstract findNearest(latitude: number, longitude: number): Promise<Location | null>;
}
