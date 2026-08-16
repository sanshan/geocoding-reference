import type { Location } from '../../../domain/location.aggregate';
import { LocationResultDto } from '../dto/location-result.dto';

export class LocationResultMapper {
  static toDto(location: Location): LocationResultDto {
    return new LocationResultDto(
      location.id,
      location.zipCode,
      location.city,
      location.stateCode,
      location.stateName,
      location.coordinates.latitude,
      location.coordinates.longitude,
      `${location.city}, ${location.stateCode} ${location.zipCode}`
    );
  }

  static toDtoArray(locations: Location[]): LocationResultDto[] {
    return locations.map(location => this.toDto(location));
  }
}