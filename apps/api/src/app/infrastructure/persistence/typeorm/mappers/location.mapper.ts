import type { NewLocation } from '../../../../domain/new-location.vo';
import { Location } from '../../../../domain/location.aggregate';
import type { LocationEntity } from '../entities/location.entity';

export class LocationMapper {
    static toDomain(entity: LocationEntity): Location {
        const [longitude, latitude] = entity.location.coordinates;

        return new Location(
            entity.id,
            entity.zipCode,
            entity.city,
            entity.stateCode,
            entity.stateName,
            entity.county,
            {
                latitude: latitude as number,
                longitude: longitude as number,
            },
            entity.accuracy,
        );
    }

    static toDomainArray(entities: LocationEntity[]): Location[] {
        return entities.map((entity) => this.toDomain(entity));
    }

    static toPersistence(location: NewLocation): Omit<LocationEntity, 'id'> {
        return {
            zipCode: location.zipCode,
            city: location.city,
            stateCode: location.stateCode,
            stateName: location.stateName,
            county: location.county,
            location: {
                type: 'Point',
                coordinates: [location.coordinates.longitude, location.coordinates.latitude],
            },
            accuracy: location.accuracy,
        };
    }

    static toPersistenceArray(locations: NewLocation[]): Omit<LocationEntity, 'id'>[] {
        return locations.map((location) => this.toPersistence(location));
    }
}
