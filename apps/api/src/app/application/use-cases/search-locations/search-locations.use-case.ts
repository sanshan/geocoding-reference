import { LocationPort } from '../../ports/location.port';
import { Injectable } from '@nestjs/common';
import type { Location } from '../../../domain/location.aggregate';

@Injectable()
export class SearchLocationsUseCase {
    constructor(private readonly locationRepository: LocationPort) {}

    async execute(query: string): Promise<Location[]> {
        return this.locationRepository.search(query);
    }
}
