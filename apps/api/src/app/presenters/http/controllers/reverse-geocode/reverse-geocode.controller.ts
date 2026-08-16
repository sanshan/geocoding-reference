import { Controller, Get, Query } from '@nestjs/common';
import { ReverseGeocodeUseCase } from '../../../../application/use-cases/reverse-geocode/reverse-geocode.use-case';
import { ZodValidationPipe } from '../../validation/zod-validation.pipe';
import type { LocationResultDto } from '../../dto/location-result.dto';
import { LocationResultMapper } from '../../mappers/location-result.mapper';
import {
    type ReverseGeocodeQueryDto,
    ReverseGeocodeQuerySchema,
} from './reverse-geocode-query.schema';

@Controller('geocoding')
export class ReverseGeocodeController {
    constructor(private readonly reverseGeocodeUseCase: ReverseGeocodeUseCase) {}

    @Get('reverse')
    async reverseGeocode(
        @Query(new ZodValidationPipe(ReverseGeocodeQuerySchema))
        query: ReverseGeocodeQueryDto,
    ): Promise<LocationResultDto | null> {
        const location = await this.reverseGeocodeUseCase.execute({
            latitude: query.latitude,
            longitude: query.longitude,
        });

        if (!location) {
            return null;
        }

        return LocationResultMapper.toDto(location);
    }
}
