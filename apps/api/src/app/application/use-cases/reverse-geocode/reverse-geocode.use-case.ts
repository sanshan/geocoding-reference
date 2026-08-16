import { LocationPort } from '../../ports/location.port';
import { Injectable } from '@nestjs/common';
import type { Location } from '../../../domain/location.aggregate';

@Injectable()
export class ReverseGeocodeUseCase {
    constructor(private readonly locationRepository: LocationPort) {}

    async execute(input: { latitude: number; longitude: number }): Promise<Location | null> {
        return this.locationRepository.findNearest(input.latitude, input.longitude);
    }
}